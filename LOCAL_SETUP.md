# Local setup (no Sanity)

PostgreSQL is the CMS. Do not configure Sanity.

## Prerequisites

- Node.js 20+
- pnpm 9.15 (`corepack enable`)
- PostgreSQL 16+ on `localhost:5432`

## After clone

```bash
pnpm install
```

Create a gitignored root `.env` (PowerShell: `Copy-Item .env.example .env`):

```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/nora_group
AUTH_SECRET=at-least-32-characters-of-random-text
DASHBOARD_OWNER_EMAIL=you@example.com
DASHBOARD_OWNER_PASSWORD=choose-a-strong-local-password
REVALIDATE_SECRET=another-long-random-value
WEBSITE_REVALIDATE_URL=http://localhost:3001/api/revalidate
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

Copy the same `DATABASE_URL` / `REVALIDATE_SECRET` into:

- `apps/web/.env.local`
- `apps/Dashboard/.env.local` (plus `AUTH_SECRET` and Owner email/password)

Create the database, then:

```bash
pnpm setup:local
pnpm dev
```

| App | URL |
|---|---|
| Website | http://localhost:3001 |
| Dashboard | http://localhost:3000/login |

If `prisma:ensure-local` fails with `P1010`, the role in `DATABASE_URL` cannot use `nora_group`. Grant that role, or use a superuser URL locally.

Seed copies the existing marketing catalog (services, projects, materials, pages) into PostgreSQL. Extra Dashboard users still live in gitignored `.data/users.json` until auth is migrated onto Prisma `User`.
