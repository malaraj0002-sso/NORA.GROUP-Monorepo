# PostgreSQL P1010 + Hero Persistence Fix Audit

**Date:** 19 September 2026  
**Branch:** `main`  
**Mode:** Phase 0 read-only diagnosis. This file was written before any repair, GRANT, schema change, or Hero mutation-code change.

Passwords, tokens, and full connection strings are **not** recorded here.

---

## 1. DATABASE_URL source resolution

### Loader order

| Consumer | Function | Resolution order |
|---|---|---|
| Website Prisma | `apps/web/lib/db/loadDatabaseUrl.ts` `ensureDatabaseUrl()` | 1. `process.env.DATABASE_URL` if non-empty **2. `apps/web/.env.local` 3. `apps/web/.env` 4. repo-root `.env`** |
| Dashboard Prisma | `apps/Dashboard/lib/db/loadDatabaseUrl.ts` `ensureDatabaseUrl()` | 1. `process.env.DATABASE_URL` if non-empty **2. `apps/Dashboard/.env` 3. repo-root `.env`**. Does **not** read `.env.local` itself; Next.js may inject `.env.local` into `process.env` first. |
| Parity / seed / ensure-db | `apps/web/scripts/local-database-url.ts` `loadLocalDatabaseUrl()` | 1. `process.env.DATABASE_URL` if non-empty **2. cwd `.env` 3. `../../.env` 4. `../.env`**. Host must be `localhost` or `127.0.0.1`. |

All three treat **any non-empty string** as valid. They do not require a username.

### Files actually present (this machine)

| Path | Exists | `DATABASE_URL` |
|---|---|---|
| repo-root `.env` | Yes | Present, parseable, **not** a placeholder |
| repo-root `.env.local` | No | — |
| `apps/web/.env` | No | — |
| `apps/web/.env.local` | Yes | **Absent**. File only has leftover `NEXT_PUBLIC_SANITY_*` **names**. |
| `apps/Dashboard/.env` | No | — |
| `apps/Dashboard/.env.local` | Yes | **Absent**. File has auth keys plus leftover `SANITY_*` / `NEXT_PUBLIC_SANITY_*` **names**. Runtime CMS code does not read those Sanity names. |

`pnpm bootstrap` is supposed to copy root `DATABASE_URL` into both app `.env.local` files. That copy is **missing** on this checkout. The files exist from an earlier Sanity-era setup.

### Parsed connection facts (no password)

**Intended application URL (root `.env`):**

- Protocol: `postgresql`
- User: `postgres`
- Host: `localhost`
- Port: `5432`
- Database: `nora_group`
- Password present: yes
- Placeholder `USER:PASSWORD`: no

**Overriding process environment in this agent/shell:**

- `process.env.DATABASE_URL` is set (length 38)
- Parsed as `postgresql://localhost:5432/nora_group`
- User: **empty**
- Password: **absent**
- Windows User env `DATABASE_URL`: not set
- Windows Machine env `DATABASE_URL`: not set

Length 38 matches `postgresql://localhost:5432/nora_group` exactly. That form appears in `PHASE_1_POSTGRES_FOUNDATION_REPORT.md` as a **schema-only** Prisma CLI example, not as a login.

Because loaders prefer a non-empty `process.env.DATABASE_URL`, Website, Dashboard, and `pnpm postgres:parity` never reach the working root `.env` while that override is present.

---

## 2. Database host and engine

| Fact | Value |
|---|---|
| Listener | `localhost:5432` (`::1`) |
| Engine | PostgreSQL **18.4** |
| Service | Windows `postgresql-x64-18` **Running** |
| `postgres` OS processes | Present |
| Docker Engine | `com.docker.backend` processes present |
| Docker Compose Postgres for this repo | **Not** the database in use (compose would create role `nora` / db `nora_group`) |
| Role `nora` on this cluster | **Does not exist** |

This is **local Windows PostgreSQL**, not the optional `docker-compose.yml` service.

---

## 3. Role / privilege state (file URL only)

Connecting with the **root `.env` URL** (process override ignored) succeeded as:

- `current_user` / `session_user`: `postgres`
- `current_database`: `nora_group`
- Database owner: `postgres`
- `rolsuper`: true, `rolcanlogin`: true

Read-only privilege checks for role `postgres` on `nora_group`:

| Check | Result |
|---|---|
| Role exists | Yes |
| CONNECT on `nora_group` | Yes |
| CONNECT on `postgres` | Yes |
| USAGE on schema `public` | Yes |
| SELECT/INSERT/UPDATE/DELETE on `media`, `home_pages`, `home_hero_media`, `site_settings`, `services`, `about_pages`, `ui_copy` | Yes (all true) |

Live row counts (same connection, read-only):

- `services`: **7**
- `home_hero_media`: **5**
- `media` ids `local-hero-*`: **5** (`local-hero-0` … `local-hero-4`, `sortOrder` 0–4)

**No GRANT is required** for role `postgres`. Existing CMS data is present and should be preserved. No `DROP DATABASE` / `DROP SCHEMA` is justified.

Connecting with the **process override** (empty user, no password) failed:

```
PrismaClientInitializationError
User was denied access on the database `(not available)`
```

That is Prisma **P1010**. The same failure occurs against both `nora_group` and the `postgres` maintenance database, because there is no authenticating role in the URL.

---

## 4. Exact cause of P1010

P1010 here is **not** “role `postgres` lacks CONNECT on `nora_group`”.

It is:

1. A process-level `DATABASE_URL` without username or password is already set in the environment that runs Prisma (this agent shell; also inherited by commands that do not clear it).
2. `ensureDatabaseUrl` / `loadLocalDatabaseUrl` accept that string because it is non-empty.
3. Prisma authenticates with no role. PostgreSQL denies access. Prisma reports P1010 with database `(not available)`.
4. Website `getSiteContent()` catches the error and serves **seed fallback**. That is not proof of live CMS content.

Root `.env` credentials were **not** used during those failing runs.

---

## 5. Hero save flow

```
Dashboard HeroModule
  → sort slides by order
  → map slide.id
  → filter id.startsWith('image-')     ← leftover Sanity asset-id prefix
  → POST /api/cms { resource: 'hero', op: 'patch', data: { assetIds } }
  → mutationSchema (assetIds: string[], max 20, charset [a-zA-Z0-9._-])
  → applyMutation → patchResource('hero')
  → resolveMediaIds(assetIds)          ← Prisma Media by id, else objectKey
  → $transaction:
        homeHeroMedia.deleteMany({ homePageId: 'default' })
        if (resolved.length) createMany(sortOrder = index)
  → applyMutation then revalidateWebsite()
```

Seed / live Media ids are `local-hero-0` … `local-hero-4` (`seed-postgres.ts` `mediaId('hero', index)`).

Dashboard uploads create Prisma `Media` rows with **cuid** ids (`apps/Dashboard/app/api/media/route.ts`), also **not** `image-*`.

`resolveMediaIds` itself is correct. The wipe happens **before** it can help, because the client sends `[]`.

There is **no** explicit-clear flag in the schema or UI. `DeleteButton` only updates React state. Persist is the “save images” action, which always patches `assetIds`.

---

## 6. Exact cause of Hero deletion risk

1. Client keeps only ids starting with `image-`.
2. Seeded and current rows are `local-hero-*` (and uploads are cuids).
3. `assetIds` becomes `[]`.
4. Server still runs `deleteMany(HomeHeroMedia)` then inserts nothing.
5. Website mapper yields `home.heroImages: []`; `Hero.tsx` uses `FALLBACK_SLIDES`.

This is a code defect, confirmed against live ids `local-hero-0`…`local-hero-4`. It does not require P1010 to be dangerous once Postgres is reachable.

---

## 7. Website live-read path (for Phase 2)

```
Dashboard/API applyMutation
  → PostgreSQL
  → revalidateWebsite() POST WEBSITE_REVALIDATE_URL
       header x-revalidate-secret = REVALIDATE_SECRET
       (SANITY_REVALIDATE_SECRET is a leftover alias only)
  → apps/web/app/api/revalidate/route.ts revalidateTag(*)
  → getSiteContent → unstable_cache → getSiteContentFromPostgres
  → HomeView title={t(home.heroTitle, locale)}
```

Harmless proof candidate: `HomePage.heroTitle.en` (rendered in the home Hero). Must restore after the test.

Seed fallback is **not** acceptable proof.

---

## 8. Proposed minimal fixes

### 8.1 P1010 — do not change the working URL; stop using the incomplete override

**Do not** alter root `.env` user/password/host/database.  
**Do not** GRANT (role `postgres` already owns `nora_group` and has table rights).  
**Do not** recreate the database.  
**Do not** introduce Docker role `nora` on this cluster.

Code (minimal):

- In Website `ensureDatabaseUrl`, Dashboard `ensureDatabaseUrl`, and `loadLocalDatabaseUrl`: if `process.env.DATABASE_URL` is set but has **no username** (or is not a postgres URL), ignore it and continue loading from files.
- After a usable file URL is found, assign `process.env.DATABASE_URL` so Prisma CLI/client in that process uses it.

Ops (this session only):

- Unset the incomplete process `DATABASE_URL` before `pnpm postgres:parity` and Prisma commands so Prisma’s own dotenv load of root `.env` is not shadowed.
- Optionally merge `DATABASE_URL` from root `.env` into `apps/web/.env.local` and `apps/Dashboard/.env.local` **without** wiping other keys, matching `pnpm bootstrap`. This is additive, same URL, still gitignored.

No password will be printed, guessed, or committed.

### 8.2 Hero persistence

- `HeroModule`: send ordered slide ids that look like media ids (`mediaIdSchema`). **Stop** `startsWith('image-')`.
- Schema: keep `assetIds`; add optional `clear: z.boolean()` for an explicit empty save. **Do not** add a new clear button (UI does not have one).
- `patchResource('hero')`:
  1. If `assetIds.length === 0` and `clear !== true` → **400**, do not `deleteMany`.
  2. Resolve each id against `Media` (id then objectKey), preserve order, drop blanks.
  3. If submitted list was non-empty and **zero** rows resolve → **400**, do not `deleteMany`.
  4. If `clear === true` and `assetIds` empty → transactional `deleteMany` only (API-only; unused by current UI).
  5. Otherwise transactional `deleteMany` + `createMany` with `sortOrder = index`.

Do not change Hero visual design, timing, or animation.

### 8.3 Out of scope (document only)

- Leftover `SANITY_*` names in app `.env.local` files
- `SANITY_REVALIDATE_SECRET` alias on revalidate routes
- `ProjectsModule` still filters `image-*` (not a confirmed wipe of `HomeHeroMedia`)
- Header, theme, hydration, auth, R2, Prisma schema, service list

---

## 9. Phase 0 gate

Repair may proceed:

- P1010 cause identified without guessing passwords
- File-based role `postgres` can already use `nora_group`; data is present
- Hero wipe cause identified in client filter + unconditional `deleteMany`

If a later step cannot authenticate as `postgres` using the existing root `.env` URL, **stop** and do not invent credentials.
