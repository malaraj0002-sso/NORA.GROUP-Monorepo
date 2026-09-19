# Nora Group

Premium custom carpentry and interior design (Nora Group). Public site languages: Hebrew, Arabic, English, and Russian. Dashboard UI: Arabic, Hebrew, and English.

**PostgreSQL is the CMS. Do not use Sanity. Do not add doors as a Nora Group service.**

| App | Package | Local URL |
|---|---|---|
| Website | `@nora/web` | http://localhost:3001 |
| Dashboard (CMS) | `@nora/dashboard` | http://localhost:3000/login |

This document is the handoff for whoever continues after the 2026-09-18 Postgres cutover.

- **Continue from this branch:** `cursor/colleague-handoff-readme-89ec`
- **Code it contains:** the website→Postgres cutover plus this README
- **Earlier cutover branch / PR:** `cursor/postgres-website-cutover-89ec` — https://github.com/malaraj0002-sso/NORA.GROUP-Monorepo/pull/2

After `pnpm bootstrap`, create the first Dashboard Owner in PostgreSQL (one-time, password is not stored in env):

```bash
OWNER_BOOTSTRAP_EMAIL=owner@localhost OWNER_BOOTSTRAP_PASSWORD=******** pnpm bootstrap:owner
```

Never commit `.env`, `.env.local`, passwords, tokens, or real `DATABASE_URL` values.

---

## What already changed

- The public website reads **PostgreSQL** (Prisma). Sanity Studio, GROQ, and `next-sanity` were removed.
- The Dashboard already writes CMS content to Postgres. A successful save can revalidate the website (`REVALIDATE_SECRET` + `WEBSITE_REVALIDATE_URL`).
- `pnpm bootstrap` / `apps/web/scripts/seed-postgres.ts` load the existing marketing catalog into Postgres (homepage, seven services, projects, materials, testimonials, FAQ, blog). That is the copy the Dashboard should show for edit/delete — **once Postgres is running and seeded**.
- Shared local uploads live in `storage/media`. The website serves `GET /api/media/[id]`.
- Linux helper `scripts/fix-linux-dev.sh` repairs interrupted `dpkg`, installs/starts PostgreSQL, or starts Docker Postgres as a fallback, then bootstraps and seeds.
- Dashboard login requires PostgreSQL `User` + `Session`. **Empty Homepage boxes mean Postgres is not connected.** They are placeholders, not the live website. The public site can still render built-in seed copy when the database is down; that fallback is not editable CMS data.

Yousef’s Linux Mint laptop (`yousefhedmi-TM1703`): package setup (`sudo dpkg --configure -a`) was interrupted during NVIDIA DKMS compile. **PostgreSQL was not installed. Local CMS edit→site was not verified.** The next person should finish `dpkg`, then install Postgres, then seed. Do not Ctrl+C `dpkg --configure -a`.

---

## What a colleague should do next (local)

Prerequisites: Node.js 20+, pnpm 9.15 (`corepack enable`), PostgreSQL 16+ on `localhost:5432` (or Docker).

```bash
git fetch origin
git checkout cursor/colleague-handoff-readme-89ec
git pull origin cursor/colleague-handoff-readme-89ec
pnpm install
```

### Linux Mint / Ubuntu if Postgres is missing

Type commands. Do **not** paste lines that start with `~` or `^[[200~`.

If apt says **dpkg was interrupted**, finish that first and wait for the prompt (NVIDIA kernel modules can take many minutes):

```bash
sudo dpkg --configure -a
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
pg_isready -h localhost -p 5432
cd ~/NORA.GROUP-Monorepo
bash scripts/fix-linux-dev.sh
pnpm dev
```

If PostgreSQL is already accepting connections on port 5432:

```bash
cp .env.example .env
# set a real DATABASE_URL in .env (not USER:PASSWORD)
pnpm bootstrap
pnpm dev
```

More detail: [`LOCAL_SETUP.md`](LOCAL_SETUP.md).

### Confirm before calling local setup done

1. Website http://localhost:3001 shows Nora content (not a blank page).
2. Dashboard http://localhost:3000 — sign in; Homepage, Projects, and Services are **filled**, not empty boxes.
3. Edit one Homepage field, Save to website, refresh the public site.
4. Check Hebrew and Arabic (RTL) and English (LTR). Light and dark.
5. Do not add doors. Do not reintroduce Sanity.

---

## What is still required for production

Pointing a domain at a laptop will not publish the site. This branch is **not production-ready** until the items below are done.

1. Verify local CMS: Dashboard edit → Save → website updates.
2. Review and merge into `main` (this branch and/or PR #2).
3. Provision **hosted PostgreSQL** (Neon, Supabase, RDS, or similar). Production cannot use `localhost:5432`.
4. Deploy **two** Next.js apps (website + dashboard), typically two Vercel projects with root directories `apps/web` and `apps/Dashboard`.
5. Set production environment variables (names only — never put real secrets in git):
   - `DATABASE_URL` — hosted Postgres
   - `REVALIDATE_SECRET` — same value on both apps
   - `WEBSITE_REVALIDATE_URL` — public website `https://…/api/revalidate`
   - `NEXT_PUBLIC_SITE_URL` — real `https` domain
6. DNS: apex/www → website; e.g. `admin.` → dashboard.
7. **Durable media:** uploads today use `storage/media` on disk. Add object storage (Cloudflare R2 / S3 or equivalent) before serverless hosting, or images will vanish on redeploy.
8. **Dashboard users** live in PostgreSQL (`User` / `Session`). Create the first Owner with `pnpm bootstrap:owner`. Do not use env passwords or `.data/users.json`.
9. Content pass in the Dashboard: seed is starter marketing copy. Replace with real photos, projects, and contact details.
10. Optional: `TRANSLATION_API_KEY` for AI translation drafts (human review still required).
11. Run `pnpm check` (typecheck + production builds) before deploy.

Brand: premium, architectural, modern, minimal. Website languages he / ar / en / ru. Dashboard ar / he / en.

---

## Useful paths

| Path | Purpose |
|---|---|
| [`LOCAL_SETUP.md`](LOCAL_SETUP.md) | Local Postgres, `.env`, bootstrap |
| [`prisma/schema.prisma`](prisma/schema.prisma) | Database schema |
| [`apps/web/lib/content/seed.ts`](apps/web/lib/content/seed.ts) | Built-in marketing copy |
| [`apps/web/scripts/seed-postgres.ts`](apps/web/scripts/seed-postgres.ts) | Writes that copy into Postgres |
| [`scripts/fix-linux-dev.sh`](scripts/fix-linux-dev.sh) | Linux dpkg / Postgres / seed helper |
| [`docker-compose.yml`](docker-compose.yml) | Optional local Postgres 16 |
| [`IMPLEMENTATION_LOG.md`](IMPLEMENTATION_LOG.md) | What was implemented and what was not tested |
