#!/usr/bin/env bash
# One-shot local fix for Linux: recover apt, start Postgres, write DATABASE_URL, seed.
# Does not print secret values. Type commands; do not paste bracketed-paste junk (~ or ESC[200~).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

postgres_ready() {
  if command -v pg_isready >/dev/null 2>&1; then
    pg_isready -h localhost -p 5432 >/dev/null 2>&1
    return $?
  fi
  if command -v ss >/dev/null 2>&1; then
    ss -ltn "sport = :5432" 2>/dev/null | grep -q 5432
    return $?
  fi
  return 1
}

print_install_help() {
  cat <<'EOF'
PostgreSQL is still not listening on localhost:5432.

On this machine the usual blocker is an interrupted package manager.
Run these four lines in a terminal (one line at a time, no extra ~ characters):

  sudo dpkg --configure -a
  sudo apt-get update
  sudo apt-get install -y postgresql postgresql-contrib
  sudo systemctl start postgresql

Then:

  pg_isready -h localhost -p 5432
  bash scripts/fix-linux-dev.sh
  pnpm dev

If apt cannot install Postgres and Docker is available:

  docker compose up -d --wait
  bash scripts/fix-linux-dev.sh
EOF
}

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

if command -v ss >/dev/null 2>&1; then
  for port in 3000 3001; do
    pids="$(ss -lptn "sport = :$port" 2>/dev/null | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | sort -u || true)"
    for pid in $pids; do
      echo "Stopping process on port $port (pid $pid)"
      kill "$pid" 2>/dev/null || true
    done
  done
fi
fuser -k 3000/tcp 3001/tcp >/dev/null 2>&1 || true
sleep 1

if postgres_ready; then
  echo "PostgreSQL is already running on localhost:5432"
else
  echo "Repairing interrupted package setup if needed (sudo)…"
  sudo DEBIAN_FRONTEND=noninteractive dpkg --configure -a

  if ! command -v psql >/dev/null 2>&1 && ! command -v pg_isready >/dev/null 2>&1; then
    echo "Installing PostgreSQL (sudo)…"
    sudo apt-get update -y
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
  fi

  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl start postgresql 2>/dev/null || \
      sudo systemctl start postgresql@16-main 2>/dev/null || \
      sudo systemctl start postgresql@15-main 2>/dev/null || \
      true
    sudo systemctl enable postgresql >/dev/null 2>&1 || true
  elif command -v pg_ctlcluster >/dev/null 2>&1; then
    sudo pg_ctlcluster 16 main start 2>/dev/null || \
      sudo pg_ctlcluster 15 main start 2>/dev/null || \
      sudo pg_ctlcluster 14 main start 2>/dev/null || true
  fi
fi

if ! postgres_ready; then
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    echo "OS PostgreSQL is not up. Starting Docker Postgres on port 5432…"
    python3 - "$ROOT/.env" <<'PY'
from pathlib import Path
import secrets
import sys
from urllib.parse import unquote, urlparse

path = Path(sys.argv[1])
text = path.read_text()
values = {}
for raw in text.splitlines():
    if not raw.strip() or raw.lstrip().startswith("#") or "=" not in raw:
        continue
    key, value = raw.split("=", 1)
    values[key.strip()] = value.strip()

password = values.get("POSTGRES_PASSWORD", "").strip()
url = values.get("DATABASE_URL", "").strip()
if url and "USER:PASSWORD" not in url and "://USER:" not in url:
    parsed = urlparse(url)
    if parsed.password:
        password = unquote(parsed.password)
if not password:
    password = secrets.token_urlsafe(18)

line_db = f"DATABASE_URL=postgresql://nora:{password}@localhost:5432/nora_group"
line_pw = f"POSTGRES_PASSWORD={password}"
out = []
have_db = False
have_pw = False
for raw in text.splitlines():
    if raw.startswith("DATABASE_URL="):
        out.append(line_db)
        have_db = True
    elif raw.startswith("POSTGRES_PASSWORD="):
        out.append(line_pw)
        have_pw = True
    else:
        out.append(raw)
if not have_db:
    out.append(line_db)
if not have_pw:
    out.append(line_pw)
path.write_text("\n".join(out) + "\n")
PY
    if docker compose version >/dev/null 2>&1; then
      docker compose --project-directory "$ROOT" up -d --wait
    elif command -v docker-compose >/dev/null 2>&1; then
      docker-compose --project-directory "$ROOT" up -d
    else
      echo "Docker is installed but Compose is missing."
      print_install_help
      exit 1
    fi
    for _ in $(seq 1 30); do
      if postgres_ready; then
        break
      fi
      sleep 1
    done
  fi
fi

if ! postgres_ready; then
  print_install_help
  exit 1
fi
echo "PostgreSQL is running on localhost:5432"

url="$(grep -E '^DATABASE_URL=' .env | tail -n1 | cut -d= -f2- | tr -d '\r' || true)"
need_url=0
if [[ -z "$url" || "$url" == *"USER:PASSWORD"* || "$url" == *"://USER:"* ]]; then
  need_url=1
fi

if [[ "$need_url" -eq 1 ]]; then
  pass="$(python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(18))
PY
)"
  if id postgres >/dev/null 2>&1 && command -v psql >/dev/null 2>&1; then
    sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL >/dev/null
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'nora') THEN
    CREATE ROLE nora LOGIN PASSWORD '${pass}';
  ELSE
    ALTER ROLE nora LOGIN PASSWORD '${pass}';
  END IF;
END
\$\$;
SQL
    if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='nora_group'" | grep -q 1; then
      sudo -u postgres createdb -O nora nora_group
    else
      sudo -u postgres psql -c "ALTER DATABASE nora_group OWNER TO nora;" >/dev/null
    fi
    sudo -u postgres psql -d nora_group -c "GRANT ALL ON SCHEMA public TO nora; ALTER SCHEMA public OWNER TO nora;" >/dev/null
  fi
  python3 - "$ROOT/.env" "$pass" <<'PY'
from pathlib import Path
import sys
path = Path(sys.argv[1])
password = sys.argv[2]
text = path.read_text()
line = f"DATABASE_URL=postgresql://nora:{password}@localhost:5432/nora_group"
pw_line = f"POSTGRES_PASSWORD={password}"
lines = []
found = False
found_pw = False
for raw in text.splitlines():
    if raw.startswith("DATABASE_URL="):
        lines.append(line)
        found = True
    elif raw.startswith("POSTGRES_PASSWORD="):
        lines.append(pw_line)
        found_pw = True
    else:
        lines.append(raw)
if not found:
    lines.append(line)
if not found_pw:
    lines.append(pw_line)
path.write_text("\n".join(lines) + "\n")
PY
  echo "Wrote a local DATABASE_URL for role nora (value not printed)"
fi

pnpm bootstrap
echo
echo "Setup finished. Start the apps with: pnpm dev"
echo "Website:   http://localhost:3001"
echo "Dashboard: http://localhost:3000/login"
echo "Login:     owner@localhost  /  nora-local-owner"
echo "Homepage fields stay empty until this seed succeeds. Then refresh the Dashboard."
