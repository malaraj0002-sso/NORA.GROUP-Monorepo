#!/usr/bin/env bash
# One-shot local fix for Linux: Postgres, env, seed, free ports 3000/3001.
# Does not print secret values.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

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

if ! command -v psql >/dev/null 2>&1 && ! command -v pg_isready >/dev/null 2>&1; then
  echo "Installing PostgreSQL (sudo)…"
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
fi

if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl start postgresql || true
  sudo systemctl enable postgresql >/dev/null 2>&1 || true
elif command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo pg_ctlcluster 16 main start 2>/dev/null || sudo pg_ctlcluster 15 main start 2>/dev/null || sudo pg_ctlcluster 14 main start 2>/dev/null || true
fi

if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
  echo "PostgreSQL is still not listening on localhost:5432."
  echo "Install/start it, then run: bash scripts/fix-linux-dev.sh"
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
SELECT 'create_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nora_group');
SQL
  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='nora_group'" | grep -q 1; then
    sudo -u postgres createdb -O nora nora_group
  else
    sudo -u postgres psql -c "ALTER DATABASE nora_group OWNER TO nora;" >/dev/null
  fi
  sudo -u postgres psql -d nora_group -c "GRANT ALL ON SCHEMA public TO nora; ALTER SCHEMA public OWNER TO nora;" >/dev/null
  python3 - "$ROOT/.env" "$pass" <<'PY'
from pathlib import Path
import sys
path = Path(sys.argv[1])
password = sys.argv[2]
text = path.read_text()
line = f"DATABASE_URL=postgresql://nora:{password}@localhost:5432/nora_group"
lines = []
found = False
for raw in text.splitlines():
    if raw.startswith("DATABASE_URL="):
        lines.append(line)
        found = True
    else:
        lines.append(raw)
if not found:
    lines.append(line)
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
