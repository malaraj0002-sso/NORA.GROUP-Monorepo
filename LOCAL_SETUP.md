# Local setup (no Sanity)

PostgreSQL is the CMS. Do not configure Sanity.

## Prerequisites

- Node.js 20+
- pnpm 9.15 (`corepack enable`)
- PostgreSQL 16+ on `localhost:5432`

## After pulling this branch

```bash
pnpm install
```

Create gitignored `.env` (PowerShell: `Copy-Item .env.example .env`) and set **one** line to your local Postgres login:

```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/nora_group
```

Then:

```bash
pnpm bootstrap
pnpm dev
```

`pnpm bootstrap` fills `AUTH_SECRET`, local Owner login, and copies env into both apps. Default Dashboard login (local only):

- email: `owner@localhost`
- password: `nora-local-owner`

Change those in `.env` and run `pnpm bootstrap` again if you want different credentials.

| App | URL |
|---|---|
| Website | http://localhost:3001 |
| Dashboard | http://localhost:3000/login |

If bootstrap fails with **P1010**, the role in `DATABASE_URL` cannot use `nora_group`. Grant that role, or use a superuser URL locally.

## Linux: empty Dashboard boxes / `Can't reach database server at localhost:5432`

The Dashboard shows empty fields on purpose when PostgreSQL is down. The public website can still render built-in seed copy. That is not CMS data.

Type commands. Do **not** paste lines that start with `~` or `^[[200~` — that is terminal bracketed-paste junk and will break `sudo`.

If apt says **dpkg was interrupted**, PostgreSQL is not installed yet. Repair that first:

```bash
sudo dpkg --configure -a
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
pg_isready -h localhost -p 5432
bash scripts/fix-linux-dev.sh
pnpm dev
```

`fix-linux-dev.sh` now runs `dpkg --configure -a` itself, then installs/starts Postgres, writes `DATABASE_URL`, migrates, and seeds the website catalog into the CMS. If the OS package still will not start, the same script starts Docker Postgres when `docker` works.
