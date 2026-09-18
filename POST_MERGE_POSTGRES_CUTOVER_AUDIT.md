# Post-Merge Postgres Cutover Audit

**Date:** 18 September 2026  
**Branch:** `main` (up to date with `origin/main`)  
**HEAD:** `b888fa2` Merge pull request #3  
**Mode:** Audit only. No code, env, schema, or database mutations were made except creating this report.

## Executive Summary

**PASS WITH WARNINGS**

Commit `5c52623` did cut the public Website off Sanity and onto Prisma/PostgreSQL in the **application architecture**. Studio, GROQ, `next-sanity`, `@sanity/*`, and `cdn.sanity.io` image config are gone from runtime packages and Website source. Dashboard CMS writes already go through `apps/Dashboard/lib/server/content/postgres/mutate.ts`. There is **no** Sanity fallback path.

Warnings prevent a plain PASS:

1. Local live PostgreSQL content could **not** be verified (`P1010` / user denied on `localhost/nora_group`). Until that role can read, `getSiteContent()` will catch the error and serve **seed**, not CMS rows.
2. If Postgres is reachable but empty/unseeded, the mapper is authoritative including empty strings and empty arrays (no merge onto seed). The Hero UI then uses hardcoded `FALLBACK_SLIDES`.
3. Dashboard Hero “save images” only posts asset ids that start with `image-`. Seeded hero media ids are `local-hero-*`. A save can `deleteMany` `HomeHeroMedia` and leave zero slides.
4. Authentication is still env Owner + `.data/users.json`, not Prisma `User`/`Session`.
5. Media is local disk (`storage/media` + `/public/images`). Cloudflare R2 is schema-ready, not implemented.
6. `pnpm build` was not re-run here because `pnpm dev` owns `apps/web/.next` (previous concurrent builds destroyed manifests).

Sanity is removed from the production **code** architecture. It is not proven that this machine’s Postgres is the live Website source until the local role is granted and seeded.

---

## 1. Commit Verification

Current history includes all listed hashes. Working tree was clean before this report was written.

| Commit | Present | Message (actual) | Notes |
|---|---|---|---|
| `5c52623` | Yes | feat: cut website over to PostgreSQL and remove Sanity | Core cutover. 71 files. Studio/GROQ/`next-sanity` deleted. Website `getContent.ts` → Prisma. |
| `90d3bcd` | Yes | fix: allow Dashboard postgres check to import revalidate helper | Removes `import 'server-only'` from `revalidate-website.ts` (2 lines). |
| `eb33c67` | Yes | feat: one-command local bootstrap from a single root `.env` | Adds `scripts/bootstrap-local.ts` and `pnpm bootstrap`. |
| `3e857e5` | Yes | fix: explain missing local Postgres during bootstrap | Hints when `localhost:5432` is down; refuses placeholder `DATABASE_URL`. |
| `c65cf92` | Yes | feat: add Linux one-shot script to start Postgres and free ports | Adds `scripts/fix-linux-dev.sh`. |
| `f4d5ea1` | Yes | fix: generate Prisma client for Dashboard and keep login off the DB | Lazy Prisma Proxy; layout reads CMS only after a session. |
| `d6d14cd` | Yes | fix: recover interrupted dpkg so local Postgres can seed the CMS | Expands Linux script, adds `docker-compose.yml`. |
| `e8dcb11` | Yes | docs: add colleague handoff README for Postgres cutover | Hash was not in the prompt; this is that docs commit. |

Also on `main` after those commits (not in the prompt list, but they affect the audit):

| Commit | Present | Relevance |
|---|---|---|
| `c1a1c82` | Yes | Hero CSS stacked slider (`Hero.tsx` + `HERO_SLIDER_AUDIT.md`). |
| `b888fa2` | Yes | Merge PR #3 of the handoff branch into `main`. |

`PHASE_0_ARCHITECTURE_VALIDATION.md` was requested and **does not exist** in the repository.

---

## 2. Website Data Flow

**Actual runtime path (current `main`):**

```
app/[locale]/* page / layout / sitemap
  → loadLocalePage() or getSiteContent()
    → React cache(getSiteContent)
      → next/cache unstable_cache (tag + 60s)
        → getSiteContentFromPostgres()          [server-only]
          → loadPostgresSitePayload(prisma)     [Prisma findUnique/findMany]
            → mapPostgresToSiteContent()
              → SiteContent
                → HomeView / page views / Hero / SEO
```

Prisma client: `apps/web/lib/db/prisma.ts` (`@prisma/client` 6.16.3), URL from `ensureDatabaseUrl()` (`process.env`, then `apps/web/.env.local`, `.env`, `../../.env`).

**Not used at runtime:** Sanity client, GROQ, Studio, `lib/sanity/fetch.ts` (file deleted, not tracked).

Home Hero specifically:

`HomePage.heroMedia` → `HomeHeroMedia.sortOrder` + `Media.url` → `home.heroImages: string[]` → `HomeView slides={home.heroImages}` → client `Hero` → `mediaSrc()` → `next/image`.

---

## 3. Sanity Removal Audit

### Runtime packages

- `@nora/web` `package.json`: no `sanity`, `next-sanity`, `@sanity/*`.
- `git ls-files '*sanity*'`: **empty**. Studio, schemas, `sanity.config.ts`, `seed-sanity.ts` are not tracked.
- Repo search: **no** `cdn.sanity.io`, `next-sanity`, `@sanity/`, GROQ strings, or `sanityFetch` in `.ts`/`.tsx`/`.js`.

### Remaining occurrences (classified)

| Location | Classification |
|---|---|
| `apps/web/app/api/revalidate/route.ts` — `SANITY_REVALIDATE_SECRET` alias | 6. Potentially dangerous leftover **and** 4. migration artifact. Fail-closed if both secrets empty. |
| `apps/Dashboard/lib/server/revalidate-website.ts` — same alias | Same. |
| `apps/Dashboard/lib/i18n/messages.ts` key `common.sanityDisconnected` (copy says PostgreSQL) | 2. Dead naming / leftover UI key. |
| `HomepageModule.tsx`, `HowWeWorkModule.tsx` using that key | 2. Leftover key name; text is Postgres help. |
| `AdminDataContext.tsx` `ContentSource` includes `'sanity'` | 2. Dead union member. Dashboard read only returns `postgres` / `mock` / `unavailable`. |
| `OverviewModule.tsx` `source === 'sanity'` | 2. Dead UI branch. |
| `.cursor/rules/sanity.mdc` | 3. Documentation / rule: do **not** reintroduce Sanity. |
| README, LOCAL_SETUP, IMPLEMENTATION_LOG, PHASE_* reports, PROJECT_AUDIT, FINAL_PROJECT_REPORT, HERO_SLIDER_AUDIT (pre-cutover description), `apps/web/docs/*` | 3. Documentation, much of it **stale**. |
| Gitignored Dashboard `.env.local` still containing unused `SANITY_*` **names** | 4. Local leftover env. Values were not copied into this report. Runtime code does not read `SANITY_API_WRITE_TOKEN`. |

**No active Sanity runtime dependency** was found in Website or Dashboard application code.

---

## 4. Fallback Audit

### PostgreSQL unavailable (query/connect error after Prisma loads)

`getSiteContent()`:

```ts
try {
  return await postgresSiteContent();
} catch {
  console.error('[getSiteContent] PostgreSQL unavailable; using seed fallback');
  return seedContent;
}
```

- Does **not** fall back to Sanity.
- **Does** silently fall back to `apps/web/lib/content/seed.ts`.
- Operator sees a log line, visitors see the built-in catalog.
- This is an **active production-path fallback**, not dead code. Documented in README as intentional so the marketing site is never blank.

### PostgreSQL reachable but empty / unseeded

Mapper returns empty settings/home/lists. **No** merge onto seed. Website can show empty copy. Hero with `heroImages: []` uses `FALLBACK_SLIDES` (five `/images/...` files). Services/projects/blog can be empty.

### `DATABASE_URL` missing at module load

Website Prisma is constructed **eagerly** in `apps/web/lib/db/prisma.ts`. `ensureDatabaseUrl()` throws before `getSiteContent`’s try/catch. That path can 500 the app instead of serving seed.

### Dashboard

Logged-out layout does not construct CMS reads. Logged-in `readDashboardContent()` catch → `source: 'unavailable'` and empty placeholder `AdminData` (not Sanity, not Website seed).

---

## 5. PostgreSQL Content Contract

Mapper `mapPostgresToSiteContent` fills every `SiteContent` key: settings, nav, ui, categoryLabels, home, about, howWeWork, contactPage, services, projects, materials, testimonials, blogPosts, faq, legal.

| Domain | Mapper | Seed/postgres seed script | Live DB this audit |
|---|---|---|---|
| settings | JSONB + logo/qr media URLs | Yes | **NOT VERIFIED** (`P1010`) |
| home + heroImages | `HomeHeroMedia` ordered | Yes (`local-hero-*` + `/images/...`) | **NOT VERIFIED** |
| about / how-we-work / contact | singletons + media | Yes | **NOT VERIFIED** |
| services | enum slugs → hyphenated website slugs; `published` → `visible` | Seven official | **NOT VERIFIED** |
| projects / materials / testimonials / blog / FAQ | arrays + media | Seed catalog included in `5c52623` seed script | **NOT VERIFIED** |
| nav / ui / category | `UiCopy` rows, all four locales | Yes | **NOT VERIFIED** |
| legal | `LegalDocument` privacy/cookies/terms | `legal.ts` via seed | **NOT VERIFIED** |
| metadata | `settings.seoTitle` / `seoDescription` | Yes | **NOT VERIFIED** |

`legal.ts` is not a second Website loader. It is the seed module imported by `seed.ts` and written into Postgres by `seed-postgres.ts`.

**Code defect vs missing data:** code can serve a full `SiteContent` if Postgres is seeded. This audit could not confirm row counts. Empty domains in a connected DB would be **missing data / unseeded**, not a mapper hole. `P1010` is an **operations** issue (role cannot use `nora_group`).

`assertSiteContentContract` requires exactly seven services, four locale keys on localized objects, no door copy, he/ar RTL and en/ru LTR.

---

## 6. Seven Services Audit

**Schema enum `ServiceSlug`:** kitchens, bedrooms, wardrobes, walk-in-closets, custom-furniture, offices, commercial. No doors member.

**Website `SERVICE_SLUGS`:** same seven.

**Mapper:** unknown Prisma slugs (including doors if they could exist) are dropped. Loader **throws** if `service.slug` matches `/door/i` (defense in depth; enum already forbids it).

**Dashboard:** `isForbiddenDoorService` + `rejectDoorMutation` on create/patch/delete (slug and he/ar/en/ru titles: door / luxury-doors / door-service / דלת / باب).

**Seed `seed.ts`:** seven service slugs only. No door/דלת/باب in that file.

**Fixture contract (`pnpm postgres:contract`):** PASS — mapped slugs match; injected `doors` / `luxury-doors` dropped; forced door service fails validation.

**Runtime Website content:** **NOT VERIFIED** against live Postgres (same `P1010`).

Door strings in PHASE_* / PROJECT_AUDIT / contract fixtures are documentation or tests, not Website services.

---

## 7. Hero Slider Audit

Current UI is `c1a1c82` (after the Postgres cutover): client stacked `next/image` layers, CSS `transition-opacity` 1400ms, 5s interval with cleanup, `priority` on index 0, `sizes="100vw"`, keys `` `${idx}-${src}` ``. Framer Motion is **not** used in `Hero.tsx`. `framer-motion` remains a Website dependency (unused by Hero).

Postgres mapping: `heroMedia` sorted by `sortOrder`, `Media.url`, empty URLs filtered. No locale-specific hero images (shared URLs; copy is localized separately). No desktop/mobile pair.

`mediaSrc` now allows only same-origin paths starting with `/` (local public files and `/api/media/[id]`). Sanity CDN URLs are **rejected** and replaced with `images.hero1`. That can collapse several invalid slides into duplicate kitchens.

Empty `slides` → five local fallbacks. That prevents a blank Hero when CMS hero rows are missing; it is a UI fallback, not Sanity.

**Regression risk (HIGH, code-confirmed, not live-reproduced this audit):** `HeroModule` save sends only ids `startsWith('image-')`. Seeded ids are `local-hero-0`…. Patch always `deleteMany` then insert resolved ids. Empty list wipes `home_hero_media`. Website would then use `FALLBACK_SLIDES` until re-seeded.

Hydration: first slide is `opacity-100` in SSR HTML. Reduced-motion is applied in `useEffect` (false on server and first client paint). No Framer `initial={{ opacity: 0 }}` on this component.

Live Hero behavior in the browser was **not** re-tested in this audit (dev server `.next` was previously corrupted by concurrent `next build`; terminal `38.txt` still showed ENOENT around that incident).

---

## 8. Localization

Routing: `next-intl` `localePrefix: 'as-needed'`, default `he` unprefixed `/`, locales `he | ar | en | ru`, `localeDetection: false`. `generateStaticParams` emits all four. `dir` from `LOCALE_META` (he/ar rtl, en/ru ltr). Fonts: Hebrew Noto, Arabic Cairo, Inter includes cyrillic for Russian.

JSONB contract is `{ he, ar, en, ru }`. `asLocale` / `mergeLocale` keep `ru` when another locale is patched. Dashboard **UI** mapping `toDashboardLocale` **omits `ru`** (Dashboard languages are ar/he/en). That does not delete Russian in Postgres on read. Translation API (`/api/translate`) only allows he/ar/en source and targets — Russian is never machine-translated (INFO / product gap, not a silent drop).

Live four-locale row fill: **NOT VERIFIED**.

---

## 9. SEO

| Surface | Status |
|---|---|
| Page metadata | `buildPageMetadata` — title, description, canonical, hreflang for he/ar/en/ru + `x-default` |
| Locale layout metadata | `seoTitle` / `seoDescription` from `SiteContent.settings` |
| Home OG image | `heroImages[0]` or logo |
| sitemap | All locales × static paths + visible services/projects/blog; hreflang map |
| robots | allow `/`, disallow `/api/`, sitemap URL. `/studio` no longer listed (Studio removed). |
| JSON-LD | LocalBusiness graph, breadcrumbs, FAQ, article helpers; `toAbsoluteAsset` rejects odd URLs |

No Sanity asset host remains in SEO helpers. If `NEXT_PUBLIC_SITE_URL` is unset, `SITE_URL` falls back to `https://officialnoragroup.com`.

When Postgres fails, sitemap/metadata follow **seed**, not an empty CMS.

---

## 10. Media

Intended end state (Postgres + R2) is **not** implemented.

Current:

| Kind | Behavior |
|---|---|
| Seed / public catalog | `/images/...` and `/logo.png` under `apps/web/public` |
| Seeded `Media` rows | `provider: LOCAL`, `url` = public path |
| Dashboard upload | writes `storage/media/{id}.ext`, `url` = `/api/media/{id}` |
| Website `GET /api/media/[id]` | reads LOCAL object from shared `storage/media` via Prisma |
| Schema `MediaProvider.R2` | unused at runtime |
| Sanity CDN | removed from `next.config.ts` `images` / CSP |

`next/image` has no `remotePatterns`. Remote https URLs would fail optimization even if `mediaSrc` allowed them (it does not).

Serverless warning (README): disk uploads vanish on redeploy. That is remaining architecture debt, not introduced as a silent URL rewrite of existing `/images` seed files.

---

## 11. Dashboard

CMS:

- `GET /api/content` → `readDashboardContent()` Prisma (`cms.read`)
- `POST /api/cms` → `applyMutation` Postgres (`cms.write` / `cms.delete`)
- `POST /api/media` LOCAL upload (`media.upload`)
- `GET /api/media/[id]` file bytes
- `POST /api/translate` drafts; apply uses Postgres mutate (`translations.manage`); targets he/ar/en only
- `/api/users` file store (`users.manage`)

After create/patch/delete, `applyMutation` calls `revalidateWebsite()` (inner `revalidated: false` is overwritten by the outer return).

RBAC codes present: `cms.read`, `cms.write`, `cms.delete`, `media.upload`, `users.manage`, `translations.manage`, `audit.read`. Seeded role map: owner all; admin all except `users.manage`; editor read/write/media/translate; employee `cms.read` only. If RolePermission rows are missing, rank fallback is used (`cms.read` minimum **editor**, so an unseeded **employee** would lose `cms.read`).

Not Sanity.

---

## 12. Authentication

`f4d5ea1` means:

- Login (`POST /api/auth/login`) uses HMAC session cookie + `authenticateUser` (env Owner plaintext compare, extra users scrypt in gitignored `.data/users.json`).
- Root layout reads Postgres **only if** a session exists, so `/login` does not construct Prisma.
- Prisma client is a lazy `Proxy` on the Dashboard.

It does **not** mean passwords moved to Postgres. Prisma `User` / `Session` models exist and are unused by login.

No client component is given password hashes or `DATABASE_URL`. Login JSON returns `{ ok, role }` only.

**Technical debt:** Owner password still env plaintext; extra users not durable on serverless; Prisma auth unused.

Default local Owner printed in README / Linux script: `owner@localhost` / `nora-local-owner` (bootstrap fills these if empty). Local-only; still a published default.

---

## 13. Bootstrap / Environment

- Root `.env` is gitignored (`.env` / `.env.*`, with `!.env.example`).
- Examples contain placeholders only (`postgresql://USER:PASSWORD@localhost:5432/nora_group`), no live secrets.
- `pnpm bootstrap` copies example → `.env` if missing; fills `AUTH_SECRET` / `REVALIDATE_SECRET` / default owner; writes `apps/web/.env.local` and `apps/Dashboard/.env.local`; refuses placeholder `DATABASE_URL`; then `pnpm setup:local` (generate, ensure DB, **migrate deploy**, seed).
- `serializeEnv` rewrites the whole `.env` (comments dropped). Short `AUTH_SECRET` is regenerated.
- Windows: `pnpm bootstrap` is Node/tsx (applicable). `fix-linux-dev.sh` is bash/apt/systemctl (Linux only).
- `loadLocalDatabaseUrl` / parity scripts refuse non-localhost hosts.
- Website `ensureDatabaseUrl` does **not** refuse remote hosts (needed for production).

### Linux script / ports (`c65cf92` + `d6d14cd`)

`scripts/fix-linux-dev.sh`:

- Does **not** kill port **5432**.
- **Does** `kill` PIDs listening on **3000** and **3001** (`ss` parse) then `fuser -k 3000/tcp 3001/tcp`. That can stop **any** process bound there, not only Nora.
- Runs `sudo dpkg --configure -a`, may `apt-get install postgresql`, `systemctl start`, or Docker Compose.
- May `ALTER ROLE nora PASSWORD` and rewrite `DATABASE_URL` / `POSTGRES_PASSWORD` in `.env`.
- Then `pnpm bootstrap` (migrate + seed).

Dangerous relative to a laptop with other apps on 3000/3001; scoped to those two ports, not a global `killall`.

`docker-compose.yml` Postgres 16, credentials from env, named volume. No hardcoded password in the compose file.

---

## 14. Revalidation

`90d3bcd` removed `server-only` from `apps/Dashboard/lib/server/revalidate-website.ts` so the Phase 3 Node script can import it.

Behavior: POST `WEBSITE_REVALIDATE_URL` with header `x-revalidate-secret`. Secret = `REVALIDATE_SECRET` or leftover `SANITY_REVALIDATE_SECRET`. Missing URL/secret → `false` (silent). Website route is timing-safe, rate-limited, fail-closed, `revalidateTag` on all `REVALIDATE_TAGS`.

Not imported by Client Components today (only mutate + the mutating check script). Removing `server-only` is a footgun if a client file later imports it (env values would be empty in the browser for non-`NEXT_PUBLIC_` keys, not printed, but the module would be wrongly bundled).

Website cache: `unstable_cache` 60s + tags. CMS save depends on this POST actually reaching the Website process.

---

## 15. Tests

| Command | Result | Notes |
|---|---|---|
| `pnpm typecheck` | **PASS** | web + dashboard `tsc --noEmit` |
| `pnpm postgres:contract` | **PASS** | Fixture mapper + door rejection; no database |
| `pnpm prisma:validate` | **PASS** | Schema valid. Prisma 7 deprecation warning for `package.json#prisma` |
| `pnpm postgres:parity` | **FAIL / DATABASE NOT VERIFIED** | Connected to `localhost` / `nora_group`, then `P1010` user denied. Read-only SELECT. No repair attempted. |
| `pnpm postgres:dashboard-check` | **SKIPPED** | Script **patches** live service/homepage rows. Forbidden in this audit. |
| `pnpm build` | **SKIPPED** | `pnpm dev` is using `apps/web/.next`. A concurrent production build previously caused `ENOENT` page modules. |
| `prisma migrate deploy` / seed | **NOT RUN** | Forbidden. Single init migration `20260917220000_init` is create-only (enums/tables). Safe on an empty local DB; not executed. |
| Browser Hero / locale pass | **NOT RE-RUN** this audit | |

---

## 16. Git Status

Before the report: `main`, clean, tracking `origin/main`.

After the report, the only **intentional** change is this untracked file:

`POST_MERGE_POSTGRES_CUTOVER_AUDIT.md`

No source, env, or Prisma files were edited. Typecheck / Prisma validate / parity do not commit generated clients into git (`node_modules/` gitignored).

---

## 17. Findings

### CRITICAL

None proven in code as “Sanity still serves the site.” Local `P1010` is operational, not a leftover Sanity client.

### HIGH

1. **Local Postgres role cannot read `nora_group` (`P1010`).** Website will log “PostgreSQL unavailable; using seed fallback.” Cutover is not proven on this machine. Do not treat seed pages as CMS proof.
2. **Dashboard Hero save can wipe seeded slides.** `HeroModule` filters `id.startsWith('image-')`; seed ids are `local-hero-*`; mutate `deleteMany`s `HomeHeroMedia`.
3. **Silent seed fallback** when Prisma queries throw. Not Sanity, but production can show starter catalog while CMS is down or denied, with only a server log.
4. **Eager Website Prisma** throws at import if `DATABASE_URL` is missing — possible 500, no seed.

### MEDIUM

5. Connected-but-empty Postgres is authoritative (blank copy). Hero still has image fallbacks; services/projects do not.
6. Linux `fuser -k` / `kill` on ports 3000 and 3001 can stop unrelated processes.
7. Auth still env + `users.json`. Prisma User/Session unused.
8. Uploads are filesystem-only; R2 unused. Serverless deploys will lose `/api/media` files.
9. `SANITY_REVALIDATE_SECRET` still accepted. Confusing and easy to leave unset next to `REVALIDATE_SECRET`.
10. Stale docs (`PROJECT_AUDIT.md`, `FINAL_PROJECT_REPORT.md`, PHASE reports, `apps/web/docs/STUDIO-HANDOFF.he.md`, `HERO_SLIDER_AUDIT.md` data-flow section) still describe Sanity as live.

### LOW

11. `ContentSource` still includes `'sanity'`; i18n key still named `sanityDisconnected`.
12. `import 'server-only'` removed from revalidate helper.
13. README still tells colleagues to check out `cursor/colleague-handoff-readme-89ec` though work is on `main`.
14. `framer-motion` unused by Website Hero.
15. Prisma `package.json#prisma` seed key deprecated in Prisma 7.
16. Translation API never targets `ru`.
17. Unseeded RBAC fallback denies `cms.read` to `employee`.

### INFO

18. Default local Owner password is documented (`nora-local-owner`).
19. Gitignored env files may still list unused `SANITY_*` names from the old stack.
20. `PHASE_0_ARCHITECTURE_VALIDATION.md` is absent.
21. Schema default `Media.provider` is `R2` while all current writes use `LOCAL`.

---

## 18. Required Next Steps

Recommendations only. Not implemented.

1. Fix the **local Postgres role** so it can use `nora_group`, then run read-only `pnpm postgres:parity` (seven services, he/ar/en/ru, hero URLs). Do not guess credentials from this audit.
2. After parity passes, confirm the Website is **not** on seed (compare a CMS edit to `/`).
3. Fix Hero save to persist existing `local-hero-*` / any Prisma media ids, or stop `deleteMany` when the filtered list is empty.
4. Decide whether production may use seed on DB failure (current) or must fail closed.
5. Provision hosted Postgres + two app deployments; set `DATABASE_URL`, `AUTH_SECRET`, `REVALIDATE_SECRET`, `WEBSITE_REVALIDATE_URL`, `NEXT_PUBLIC_SITE_URL` (names only in git).
6. Implement durable media (R2/S3) before serverless.
7. Migrate Dashboard auth to Prisma `User`/`Session` (hashed passwords).
8. Drop `SANITY_REVALIDATE_SECRET` once operators have `REVALIDATE_SECRET`.
9. Refresh stale Sanity-era docs; point the handoff README at `main`.
10. Run `pnpm build` with `pnpm dev` **stopped**.
11. Do not reintroduce Sanity. Do not add doors.

---

**Stop.** No implementation was performed.
