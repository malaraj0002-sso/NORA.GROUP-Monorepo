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
