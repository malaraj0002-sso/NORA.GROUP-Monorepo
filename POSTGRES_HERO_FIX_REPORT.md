# PostgreSQL P1010 + Hero Persistence Fix Report

**Date:** 19 September 2026  
**Branch:** `main`  
**Mode:** Implementation and verification. No commit. No push. Passwords were not printed, guessed, or committed.

Related audit: `POSTGRES_HERO_FIX_AUDIT.md`

---

## 1. PostgreSQL Fix

### Original P1010 cause

P1010 was **not** a missing `GRANT` on role `postgres`.

The working root `.env` URL is:

- User: `postgres`
- Host: `localhost`
- Port: `5432`
- Database: `nora_group`

That role **already** owns `nora_group` on local Windows PostgreSQL 18.4 (`postgresql-x64-18`) and has CONNECT, schema USAGE, and SELECT/INSERT/UPDATE/DELETE on CMS tables.

The failing runs used a process-level `DATABASE_URL` of the form `postgresql://localhost:5432/nora_group` (no username, no password, length 38). Website, Dashboard, and `pnpm postgres:parity` treated any non-empty `process.env.DATABASE_URL` as valid, so they never opened root `.env`. Prisma then authenticated with no role and reported:

`User was denied access on the database (not available)`

Website `getSiteContent()` caught that error and served seed fallback.

### Exact repair performed

No database GRANT. No DROP. No recreate. Root `.env` credentials were **not** changed.

Loaders now ignore an unusable `DATABASE_URL` (missing username, placeholder `USER:PASSWORD`, or non-postgres protocol) and continue to gitignored env files:

- `apps/web/lib/db/loadDatabaseUrl.ts`
- `apps/Dashboard/lib/db/loadDatabaseUrl.ts` (also now reads `.env.local`)
- `apps/web/scripts/local-database-url.ts` (parity/seed; also reads `.env.local`)

This session unset the incomplete process `DATABASE_URL` before Prisma/parity/build commands.

Existing CMS rows were left in place. Read-only counts after repair: 7 services, 5 `home_hero_media` rows (`local-hero-0` … `local-hero-4`).

### Privileges verified (role `postgres` on `nora_group`)

| Check | Result |
|---|---|
| Role exists / can login | Yes (superuser) |
| CONNECT | Yes |
| USAGE on `public` | Yes |
| SELECT/INSERT/UPDATE/DELETE on CMS tables | Yes |
| Data preserved | Yes |

Docker Compose role `nora` is **not** present on this cluster. This machine uses Windows PostgreSQL, not the compose container.

---

## 2. PostgreSQL Parity

**Command:** `pnpm postgres:parity`  
**Result:** PASS (exit 0)

```
Parity against LOCAL PostgreSQL host=localhost database=nora_group
SiteContent contract: PASS (no issues)
services: kitchens, bedrooms, wardrobes, walk-in-closets, custom-furniture, offices, commercial
locales: he=rtl-ready ar=rtl-ready en=ltr-ready ru=ltr-ready
```

| Check | Result |
|---|---|
| Services | **7/7** |
| Locales | **he / ar / en / ru** |
| Hero media | **PASS** (5 `local-hero-*` rows; mapper `heroImages` length 5) |
| Core CMS data | **PASS** (contract: no issues) |
| Doors | **PASS** (none in live services) |

This is live PostgreSQL, not seed fallback.

---

## 3. Website Runtime Proof

Path tested:

Dashboard `applyMutation` (homepage patch) → PostgreSQL `home_pages.heroTitle.en` → Website Postgres loader (`loadPostgresSitePayload` + `mapPostgresToSiteContent`) → HTTP `GET http://localhost:3001/en`

`REVALIDATE_SECRET` and `WEBSITE_REVALIDATE_URL` are **not** set in root `.env` or app `.env.local`, so `revalidateWebsite()` returned `false`. Cache was cleared by restarting the Website process after each write (the documented 60s `unstable_cache` would also expire).

| Step | Value |
|---|---|
| Original `heroTitle.en` | `Wooden Spaces Designed Just for You` |
| Temporary value | `PGPROOF- Nora Group live Postgres 191809` |
| Loader after patch | `LOADER_EN=PGPROOF- Nora Group live Postgres 191809` (7 services, 5 hero images) |
| HTTP `/en` after restart | **HAS_MARKER=True**, original title absent |
| Restored value | `Wooden Spaces Designed Just for You` |
| Loader after restore | original title; 7 services; 5 hero images |
| HTTP `/en` after restart | **HAS_MARKER=False**, **HAS_ORIGINAL=True** |

The seed catalog uses the same original English title. The **marker** is the distinguishing proof: seed does not contain `PGPROOF-…`. Seeing that string on `/en` means the Website rendered PostgreSQL, not seed.

Test content was not left in the database.

---

## 4. Hero Fix

### Old `image-*` filtering

`HeroModule` saved only slide ids with `id.startsWith('image-')`. Seeded and live Media ids are `local-hero-0` … `local-hero-4`. Uploads use Prisma cuids. The client posted `assetIds: []`.

`patchResource('hero')` always ran `homeHeroMedia.deleteMany({ homePageId: 'default' })` then inserted the resolved list. An empty filtered list wiped every Hero join row.

### New behavior

1. Client sends ordered slide ids that match `[a-zA-Z0-9._-]+`. No `image-` prefix check.
2. Server rejects empty `assetIds` unless `clear: true`.
3. Inside a Prisma transaction, each id is resolved against `Media` by primary key, then `objectKey`, preserving order and skipping duplicates.
4. If the submitted list is non-empty and **zero** rows resolve → **400**, transaction aborts **before** `deleteMany`.
5. Otherwise `deleteMany` + `createMany` with `sortOrder = index`.
6. `clear: true` with empty `assetIds` is an API-only explicit clear. The current UI has no clear control; that UI was **not** added.

### Regression (live PostgreSQL via `applyMutation`)

| Case | Result |
|---|---|
| A — save `local-hero-0` … `local-hero-4` | PASS; 5 rows remain |
| B — reverse order | PASS; `sortOrder` 0–4 maps to `local-hero-4` … `local-hero-0`; then restored |
| C — `not-a-real-media-id` | PASS; 400 `None of the submitted media IDs exist. Existing Hero media was not changed.` |
| Empty list without `clear` | PASS; 400; rows preserved |
| D — explicit UI clear | **Not supported in UI**; accidental wipe is now impossible |

Website Hero visual design, slider timing, and animation were not changed. Case B order was verified on PostgreSQL `sortOrder`; the Website mapper already sorts `heroMedia` by `sortOrder`.

---

## 5. Tests

| Command | Result | Notes |
|---|---|---|
| `pnpm postgres:contract` | **PASS** | Seven official slugs; injected doors rejected |
| `pnpm postgres:parity` | **PASS** | Live `localhost` / `nora_group` |
| `pnpm typecheck` | **PASS** | Website + Dashboard `tsc --noEmit` |
| `pnpm --filter @nora/web lint` | **PASS** | No ESLint warnings or errors |
| `pnpm --filter @nora/dashboard lint` | **PASS** | No ESLint warnings or errors |
| `pnpm postgres:dashboard-check` | **PASS** | Local host; 7 services; door rejection; page CRUD |
| `pnpm build` | **PASS** | Website 87 pages generated; Dashboard compiled. No P1010 during page data collection |

Dev servers were stopped before the production build.

---

## 6. Scope Protection

| Area | Status |
|---|---|
| Header | **NOT MODIFIED** |
| Dark Mode | **NOT MODIFIED** |
| Light Mode | **NOT MODIFIED** |
| Hydration | **NOT MODIFIED** |
| Dashboard architecture | **NOT MODIFIED** (Hero save validation only) |
| Auth | **NOT MODIFIED** |
| R2 | **NOT IMPLEMENTED** |
| Sanity | **NOT REINTRODUCED** |
| Doors | **NOT ADDED** |
| Prisma schema | **NOT MODIFIED** |
| Hero visual / animation | **NOT MODIFIED** |
| Git commit / push | **NOT DONE** |

---

## 7. Remaining Issues

1. **Website HTTP revalidate is unconfigured locally.** `REVALIDATE_SECRET` and `WEBSITE_REVALIDATE_URL` are absent from gitignored env files. CMS saves return `revalidated: false`. The Website still refreshes via `unstable_cache` (60s) or process restart. Do not invent those secrets in this task.
2. **App `.env.local` files still omit `DATABASE_URL`.** Loaders now fall through to root `.env`. Leftover `SANITY_*` / `NEXT_PUBLIC_SANITY_*` **names** remain in those files (cleanup later; they are not runtime CMS).
3. **`SANITY_REVALIDATE_SECRET` alias** remains on revalidate routes. Out of scope.
4. **`ProjectsModule` still filters `image-*`.** Not the confirmed `HomeHeroMedia` wipe; left unchanged.
5. **Explicit Hero clear has no Dashboard button.** Accidental empty save is rejected. Intentional clear is API-only (`clear: true`).
6. **Authentication** remains env Owner + `.data/users.json`, not Prisma `User` / `Session`.
7. **Agent/shell `DATABASE_URL` without a username** can still be injected by the environment. Loaders ignore it; Prisma CLI that does not use these loaders could still be shadowed if that variable is left set.
