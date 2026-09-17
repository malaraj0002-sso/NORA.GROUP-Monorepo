# Phase 2 — Local PostgreSQL repository report

**Date:** 18 September 2026  
**Checkpoint before Phase 1:** `56212d5`  
**This phase:** Local PostgreSQL content repository that returns the existing `SiteContent` shape. No production cutover. No commit.

PostgreSQL is **not** the live Website source. Sanity remains the current content path.

This report distinguishes **LOCAL PostgreSQL** (this machine, `localhost:5432`) from **PRODUCTION PostgreSQL** (not used, not migrated).

---

## 1. PostgreSQL connection status

| Item | Result |
|---|---|
| Local PostgreSQL service | **Available** — `postgresql-x64-18` Running (Automatic) |
| Port | `localhost:5432` accepting connections (`pg_isready`) |
| Cloud / production database | **Not used** |
| Docker | **Not installed or started** by this phase |
| Gitignored root `.env` | **Does not exist** |
| `apps/web/.env.local` / Dashboard `.env.local` | Exist; **no** `DATABASE_URL` |
| Process `DATABASE_URL` | Present from the environment: protocol `postgresql`, host `localhost`, port `5432`, database `nora_group`, **no username**, **no password** |

Authentication: `psql --no-password` to `localhost` fails with `fe_sendauth: no password supplied` (scram-sha-256).

**LOCAL connection is therefore incomplete.** The server is running; a local role password is required before `CREATE DATABASE`, `migrate deploy`, or seed can succeed.

This phase did **not** invent a password, did **not** write a fake `.env`, and did **not** connect to production.

### What is required to finish the local database steps

On this Windows machine, with PostgreSQL 18 already installed:

1. Use the password chosen when PostgreSQL 18 was installed (user `postgres`), **or** create a dedicated local role.
2. Create a **LOCAL** database named `nora_group` (or run `pnpm prisma:ensure-local` once `DATABASE_URL` is valid).
3. Create a gitignored root `.env` (never commit it):

   `DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/nora_group`

4. Then run, in order:

   `pnpm prisma migrate deploy`  
   `pnpm prisma:seed`  
   `pnpm postgres:parity`

Do **not** point `DATABASE_URL` at a production host.

---

## 2. Migration status

| Command | Result |
|---|---|
| `pnpm prisma validate` | **Pass** — `prisma/schema.prisma` valid |
| `pnpm prisma generate` | **Pass** — Prisma Client **6.16.3** |
| `pnpm prisma migrate deploy` | **Not run** — local URL has no credentials; applying it would only fail auth. No schema was applied to any database. |
| `prisma migrate reset` / `db push` / `DROP` / `TRUNCATE` | **Not run** |

Phase 1 migration file remains: `prisma/migrations/20260917220000_init/migration.sql`.

**LOCAL database `nora_group` was not created. PRODUCTION was not touched.**

---

## 3. Seed status

Seed **code** is implemented and typechecked: `apps/web/scripts/seed-postgres.ts`, invoked by `pnpm prisma:seed`.

Seed **was not inserted** into PostgreSQL because authentication failed.

The seed is deterministic and idempotent (upserts). It seeds only structural/development data:

- Roles, permissions, role-permission mappings
- Seven official services from existing Website seed copy (`he` / `ar` / `en` / `ru`)
- Site settings, home, about, how we work, contact, UI/nav/category labels, legal pages (existing Nora copy from `apps/web/lib/content/seed.ts` and `legal.ts`)
- `Media` rows with `provider = LOCAL` pointing at existing `/public` paths (`/images/...`, `/logo.png`, `/qr.jpg`) — files were **not** moved; R2 was **not** used

**Explicitly not seeded:** users, projects, testimonials, blog posts, FAQ (no fake customers or business projects).

---

## 4. Roles created (in seed code; not yet in a live database)

- `owner`
- `admin`
- `editor`
- `employee`

---

## 5. Permissions created (in seed code; not yet in a live database)

From Phase 1 and current Dashboard API gates:

| Code | Source in the current app |
|---|---|
| `cms.read` | Dashboard content read (`GET /api/content`, editor+ today) |
| `cms.write` | `POST /api/cms` create/update (editor+) |
| `cms.delete` | `POST /api/cms` `op=delete` (admin+) |
| `media.upload` | `POST /api/media` (editor+) |
| `users.manage` | `/api/users` (owner only) |
| `translations.manage` | `/api/translate` (editor+) |
| `audit.read` | Prepared; there is no live audit API yet |

No unrelated permissions were invented.

---

## 6. Services created (in seed code; not yet in a live database)

Copied from `apps/web/lib/content/seed.ts` only. Missing locales would have been left empty; all four locales already exist in that source.

## 7. Exact seven service slugs

1. `kitchens`
2. `bedrooms`
3. `wardrobes`
4. `walk-in-closets`
5. `custom-furniture`
6. `offices`
7. `commercial`

Prisma enum members for hyphenated slugs remain `walkInClosets` / `customFurniture` with `@map` to the website slugs.

## 8. Confirmation that no door service exists

- Prisma `ServiceSlug` has **no** `doors` / `luxury-doors` member (Phase 1 schema unchanged).
- Mapper drops unknown slugs (including `doors` / `luxury-doors`).
- Contract test **fails** if `SiteContent.services` contains a door slug or door copy (`door`, `luxury-doors`, `דלת`, `باب`).
- Loader throws if a door slug is ever present in PostgreSQL.
- Seed refuses to finish if a door slug appears.

No door service was added.

---

## 9. Repository files created

| Path | Purpose |
|---|---|
| `apps/web/lib/db/prisma.ts` | Server-only Prisma Client singleton (`import 'server-only'`) |
| `apps/web/lib/content/fromPostgres.ts` | `getSiteContentFromPostgres()` |
| `apps/web/lib/content/postgres/load.ts` | Server query assembling the Postgres payload |
| `apps/web/lib/content/postgres/map.ts` | Maps Postgres rows → existing `SiteContent` |
| `apps/web/lib/content/siteContentContract.ts` | Contract / parity checks |
| `apps/web/scripts/local-database-url.ts` | Loads gitignored `.env`; **refuses non-local hosts**; never logs the URL |
| `apps/web/scripts/seed-postgres.ts` | Deterministic local seed |
| `apps/web/scripts/postgres-parity.ts` | Live LOCAL DB vs `SiteContent` contract |
| `apps/web/scripts/postgres-contract.ts` | Offline mapper/contract fixture (no database) |
| `prisma/ensure-local-database.ts` | Creates LOCAL `nora_group` via the `postgres` maintenance DB |

`getSiteContentFromPostgres()` is **not** imported by `getContent.ts`.

---

## 10. SiteContent compatibility results

Inspected contract (do not guess): `apps/web/lib/content/types.ts`, `getContent.ts`, `seed.ts`, `legal.ts`, `images.ts`, `constants.ts`, locale helpers, Sanity schemas, Dashboard CMS APIs.

The repository maps onto the **existing** `SiteContent` fields:

`settings`, `nav`, `home`, `about`, `howWeWork`, `contactPage`, `categoryLabels`, `services`, `projects`, `materials`, `testimonials`, `blogPosts`, `faq`, `legal`, `ui`

The `SiteContent` TypeScript contract was **not** changed to make Prisma easier.

Empty arrays are valid for unseeded catalog collections (`projects`, `materials`, `testimonials`, `blogPosts`, `faq`).

---

## 11. Localization results

| Locale | Direction in `LOCALE_META` | Repository |
|---|---|---|
| `he` | `rtl` | JSON `{ he, ar, en, ru }` + `UiCopy` locale `he` |
| `ar` | `rtl` | same |
| `en` | `ltr` | same |
| `ru` | `ltr` | same |

Website locale routing and next-intl were **not** changed.

The contract test asserts all four locale keys on localized objects and the expected `rtl`/`ltr` directions.

---

## 12. Parity test results

**Offline fixture** (`pnpm postgres:contract`): **PASS**

- Official seven slugs map correctly.
- Unknown door slugs are dropped.
- Injected door service fails validation (`Expected exactly 7 services` + `Door service is not permitted`).

**Live LOCAL PostgreSQL** (`pnpm postgres:parity`): **FAIL (auth)**

```text
Parity against LOCAL PostgreSQL host=localhost database=nora_group
User was denied access on the database `(not available)`
```

This is **not** a SiteContent shape failure. It is a missing local password. It is **not** a production comparison with Sanity.

---

## 13. Typecheck results

```text
pnpm typecheck
```

**Pass** — `@nora/web` and `@nora/dashboard`.

---

## 14. Build results

| App | Command | Result |
|---|---|---|
| Website | `pnpm build:web` | **Pass** (Next.js 15.5.25). `/studio/[[...tool]]` still present. Locale routes `he`/`ar`/`en`/`ru` still generated. Service routes still include the seven official slugs. |
| Dashboard | `pnpm build:dashboard` | **Pass**. `/api/cms`, `/api/media`, `/api/users`, `/api/auth/*` unchanged. |

---

## 15. Sanity status

**Unchanged. Still the live CMS.**

Not removed: `sanity` / `next-sanity` packages, `/studio`, Sanity schemas, Dashboard Sanity writes, `SANITY_*` env names.

---

## 16. Website runtime status

- Live path is still `getSiteContent()` → seed + Sanity overlay.
- `getContent.ts` was **not** modified.
- PostgreSQL is a **side repository** only.
- Production Website was **not** switched.
- A browser runtime pass was not required for a content-source that was not wired; the production build still includes Studio and the four locales.

---

## 17. Dashboard runtime status

- Authentication is still HMAC `nora_session` + `users.json`.
- `/api/cms` still writes Sanity.
- No PostgreSQL CRUD was added.
- Dashboard production build succeeded.

---

## 18. Problems discovered

1. **LOCAL PostgreSQL is installed and running, but this environment has no local role password.** Root `.env` was not created because a real local credential is missing. A successful connection was **not** fabricated.
2. Leftover process `DATABASE_URL` points at `localhost:5432/nora_group` **without** user or password. It is LOCAL, not production, and it cannot authenticate.
3. Therefore: database not created, Phase 1 migration not applied, seed not inserted, live parity not executed against data.
4. Prisma 6.16.3 warns that `package.json#prisma.seed` is deprecated in Prisma 7. The project stays on **6.16.3** (Phase 1 pin). Ignore Prisma 7/8 upgrades in this phase.
5. Current Dashboard APIs still authorize by **role rank**, not by the new permission rows. Permission seeding is schema-ready only.
6. `employee` is seeded with `cms.read` even though today’s content APIs require editor+. That is a future RBAC mapping, not a live behavior change.
7. Catalog collections (projects, testimonials, blog, FAQ) remain empty in the Postgres mapping until a later content phase — by design, to avoid fake customers/projects.

---

## 19. Exact next phase

**Stop here.** Do not start production migration, Dashboard PostgreSQL CRUD, auth migration, R2 uploads, Website source cutover, or Sanity removal.

**Phase 3 (recommended, still local only):**

1. Operator creates a gitignored root `.env` with a **LOCAL** `DATABASE_URL` (username + password).
2. `pnpm prisma:ensure-local` (create `nora_group` if needed).
3. `pnpm prisma migrate deploy` against that local database only.
4. `pnpm prisma:seed`
5. `pnpm postgres:parity` against the seeded local database.
6. Review live parity (seven slugs, four locales, no doors).

Only after that review: later phases may consider Dashboard writes, media/R2, or a dual-read Website switch. Sanity stays until a dedicated cutover phase.

---

## Claims this report does **not** make

- Production PostgreSQL was created or migrated.
- The Website now reads PostgreSQL.
- The Dashboard now writes PostgreSQL.
- Local seed rows exist in a running database.
- Authentication now uses Postgres users/sessions.
- Sanity was removed.
- Media was uploaded to R2.

---

## Files modified (non-secret)

- `package.json` — Prisma seed/parity scripts; `tsx`
- `pnpm-lock.yaml` — lockfile from `pnpm install`
- `apps/web/package.json` — `@prisma/client@6.16.3`, `server-only`, `tsx`, postgres scripts
- `apps/web/next.config.ts` — `serverExternalPackages` includes `@prisma/client` / `prisma`

No commit. No push. No history rewrite.
