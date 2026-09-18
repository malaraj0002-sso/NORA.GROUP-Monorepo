# Nora Group — Current-state audit (Sanity out)

**Date:** 18 September 2026  
**Inspected HEAD:** `99f8eb5` on `main` (`feat: enhance Dashboard with PostgreSQL integration and Prisma updates`)  
**Repo:** https://github.com/malaraj0002-sso/NORA.GROUP-Monorepo  
**Owner decision recorded in this pass:** **Sanity will not be used.** Studio, GROQ, and Sanity env vars are leftover, not the target architecture.

This document supersedes the live conclusions in `PROJECT_AUDIT.md` (14 Sep, still Sanity-centric) and `FINAL_PROJECT_REPORT.md` (14 Sep, pre-Postgres). Those files remain useful as history. Phase reports (`PHASE_1_*` … `PHASE_3_*`) are still accurate about *what was built*, with one correction: Phase 3 **was committed** as `99f8eb5`.

**Method:** source inspection of `apps/web`, `apps/Dashboard`, `prisma/`, env *names* only. No live PostgreSQL, no Dashboard login, no Website browser pass, no production deploy in this session.

Statuses: **Done / Built but unwired / Partial / Missing / Broken**.

---

## How to clone this on your PC

The cloud agent cannot push files onto your laptop. Clone GitHub, then work locally.

```bash
git clone https://github.com/malaraj0002-sso/NORA.GROUP-Monorepo.git
cd NORA.GROUP-Monorepo
git checkout main
git pull origin main
```

SSH (if you use keys):

```bash
git clone git@github.com:malaraj0002-sso/NORA.GROUP-Monorepo.git
```

You need:

| Tool | Version / note |
|---|---|
| Node.js | 20+ |
| pnpm | 9.15.0 (`packageManager` in root `package.json`; Corepack: `corepack enable`) |
| PostgreSQL | Local 18 is what previous phases targeted (`localhost:5432`, database `nora_group`) |
| GitHub access | This org/repo is not the old public `yousefhedmi3/NoraGroupWebsite` README clone URL |

Install and run (after env files exist — see §12):

```bash
pnpm install
pnpm prisma generate
pnpm prisma:ensure-local   # creates local DB if the role can
pnpm prisma migrate deploy
pnpm prisma:seed
pnpm dev                   # Website :3001 + Dashboard :3000
```

Do **not** copy real secrets into git. Use gitignored `.env` / `.env.local` only.

---

## One-page verdict

The **marketing website can render today** without Sanity: it falls back to TypeScript seed (`apps/web/lib/content/seed.ts`). The **Dashboard CMS cannot work as designed without PostgreSQL**. The two apps do **not** share a live content store yet.

```
TODAY (code on main)
  Public visitors → Website (apps/web) → Sanity GROQ if configured, else seed.ts
  Editors         → Dashboard login cookie → PostgreSQL (Prisma) for CMS read/write
  Shared DB       → Prisma schema + mapper exist; Website getSiteContent() does not call them
  Sanity          → Studio at /studio, next-sanity, leftover Dashboard sanity/ folder (unused at runtime)

TARGET (owner: no Sanity)
  Public visitors → Website → PostgreSQL (same SiteContent shape)
  Editors         → Dashboard → PostgreSQL
  Media           → start LOCAL files; later Cloudflare R2
  Auth            → Prisma User + hashed passwords + hashed Session (not env plaintext)
```

Until Website is cut over to PostgreSQL, **Dashboard Save cannot appear on the public site**, even when Postgres writes succeed. That is the remaining content pipeline, not a small UI bug.

Previous Phase 3 live CRUD against `nora_group` **failed** with Prisma `P1010` (role denied). That is an operator database-privilege issue, not missing application code.

---

## 1. What this repo is

pnpm monorepo, two Next.js 15 App Router apps, React 19:

| Package | Path | Port | Role |
|---|---|---|---|
| `@nora/web` | `apps/web` | 3001 | Public marketing site (he / ar / en / ru) |
| `@nora/dashboard` | `apps/Dashboard` | 3000 | Private CMS / admin |

PostgreSQL schema lives at the **repo root**: `prisma/schema.prisma` + one migration `prisma/migrations/20260917220000_init/`.

Brand: premium custom carpentry and interior design. Official services are exactly seven slugs: `kitchens`, `bedrooms`, `wardrobes`, `walk-in-closets`, `custom-furniture`, `offices`, `commercial`. **Doors are not a service** and must stay rejected.

---

## 2. What has already been done (in git)

### 2.1 Monorepo and hygiene — **Done**

- Website and Dashboard merged (`979face` and follow-ups).
- Workspace names `@nora/web` / `@nora/dashboard`, pnpm 9.15, shared lockfile.
- Root scripts: `dev`, `build`, `lint`, `typecheck`, Prisma helpers.

### 2.2 Public website — **Mostly done as a static/seeded marketing site**

Routes under `apps/web/app/[locale]/`:

- Home, about, services (+ detail), projects (+ detail), materials, how-we-work, testimonials, blog (+ detail), FAQ, contact, privacy, cookies, terms, 404.
- Locales: Hebrew default (`/`), `/ar`, `/en`, `/ru`. RTL for he/ar. Fonts: Inter, Noto Sans Hebrew, Cairo.
- Contact model: phone + WhatsApp only (no quote funnel). Defaults: 052-465-9510, official.noragroup@gmail.com, Migdal Oz.
- SEO: `generateMetadata`, sitemap, robots, JSON-LD helper.
- Cookie notice, floating WhatsApp, language selector, theme toggle.
- Dark mode: semantic tokens (`--ng-surface` / `--ng-ink` / `--ng-border`) on `html.dark`. This replaced the earlier “cream text on white sections” failure for the pages that use those tokens.
- Hydration: `Reveal` and `Hero` no longer mismatch SSR vs client (historical bug; `/ar` was verified in an earlier session). Full re-check of `/`, `/en`, `/ru` was **not** repeated here.
- Luxury Doors removed from seed/mock; mutations reject door slugs/titles.

**Not a CMS-backed live site.** `getSiteContent()` still prefers Sanity, else seed. PostgreSQL mapper `getSiteContentFromPostgres()` exists and is **unused**.

### 2.3 Dashboard shell — **Done as a product UI**

Modules: Overview, Site, Homepage, Hero, About, How We Work, Projects, Services, Materials, Testimonials/FAQ, Blog, Translation, Users.

- Login page + UI language cookie `nora_ui_lang` (`ar` / `he` / `en`).
- HMAC session cookie `nora_session` (HttpOnly, SameSite=Lax, Secure in production).
- Server RBAC: `owner` > `admin` > `editor` > `employee`.
- shadcn/Radix UI, next-themes (Dashboard light/dark is separate from the website theme).

### 2.4 Authentication — **Partial (works locally, not production-ready)**

| Piece | Status |
|---|---|
| Session cookie + middleware | **Done** |
| Owner login from `DASHBOARD_OWNER_EMAIL` / `DASHBOARD_OWNER_PASSWORD` | **Done**, plaintext env compare (debt) |
| Extra users in `.data/users.json` (scrypt) | **Done**, not durable on Vercel |
| Prisma `User` / `Session` models | **Schema only**, unused at runtime |
| Password reset / invite | **Missing** |
| Rate limit | In-memory per instance |

### 2.5 PostgreSQL foundation (Phase 1) — **Done (schema)**

Prisma 6.16.3 models for:

- Auth/RBAC: `User`, `Role`, `Permission`, `RolePermission`, `Session`
- `AuditLog`
- `Media` (providers `R2` / `LOCAL` / `EXTERNAL`)
- Site/pages: `SiteSettings`, `HomePage` (+ intro/why/hero media), `AboutPage` (+ values), `HowWeWorkPage` (+ steps), `ContactPage`, `UiCopy`, `LegalDocument` (+ sections)
- Catalog: `Service` (+ features/media), `Project` (+ media), `Material` (+ media), `Testimonial`, `FaqItem`, `BlogPost`

Localized copy is JSONB `{ he, ar, en, ru }`. Service slugs are a closed enum with **no doors**.

### 2.6 Website PostgreSQL repository (Phase 2) — **Built but unwired**

- Loader: `apps/web/lib/content/postgres/load.ts`
- Mapper to existing `SiteContent`: `apps/web/lib/content/postgres/map.ts`
- Entry: `apps/web/lib/content/fromPostgres.ts` → `getSiteContentFromPostgres()`
- Seed script: `apps/web/scripts/seed-postgres.ts` (`pnpm prisma:seed`)
- Contract/parity scripts: `postgres:contract` (passed), `postgres:parity` (needs a reachable DB)

Seed is designed to insert **structural** data only: roles/permissions, seven services, site/home/about/how-we-work/contact, UI labels, legal pages, local `/public` image metadata.

**Explicitly not seeded:** users, projects, testimonials, blog posts, FAQ. After cutover, those Website collections will be **empty until editors create them** (today the seed file still shows 8 demo projects / 3 testimonials / 3 posts / 8 FAQ). That content decision must be made before going live.

### 2.7 Dashboard → PostgreSQL (Phase 3) — **Built; live DB CRUD not verified**

Committed in `99f8eb5`. Runtime path:

| Route | Now |
|---|---|
| `GET /api/content` | PostgreSQL; `503` if unavailable (no Sanity/mock for authenticated reads) |
| `POST /api/cms` | PostgreSQL transactions |
| `POST /api/media` | Files under `apps/Dashboard/.data/media` + `Media` row (`provider = LOCAL`) |
| `GET /api/media/[id]` | Authenticated file serve |
| `POST/PATCH /api/translate` | Drafts still in `.data/translation-reviews.json`; **apply** writes Postgres |
| `GET/POST/PATCH /api/users` | Still `.data/users.json` |
| Login/logout | Unchanged HMAC cookie |

Permissions are looked up from `RolePermission` when the DB is reachable; otherwise a conservative rank fallback.

Sanity writer code under `apps/Dashboard/lib/sanity/` is leftover. Dashboard source no longer imports `@/lib/sanity`.

### 2.8 Security work already in code — **Partial**

- Write secrets are server env names, not `NEXT_PUBLIC_`.
- Mutations: session + permission + origin/referer + Zod + door rejection.
- Media: magic-byte sniff; SVG rejected.
- Website production CSP (Studio still needs `unsafe-eval` while `/studio` exists).
- Dashboard: CSP, `X-Frame-Options: DENY`, `robots: noindex`.
- Unauthenticated Dashboard layout does not embed CMS content.

Not claimed: pentest, live IDOR tests, multi-instance rate limits, production deploy.

---

## 3. What is left — to make Website + Dashboard work together (no Sanity)

Ordered so each step unblocks the next. Do not skip 3.1.

### 3.1 Make local PostgreSQL actually usable — **Broken today (operator)**

Previous run: `P1010` user denied on database `nora_group`. Until this is fixed, Dashboard CMS returns unavailable/503 and seed never lands.

On the PC:

1. Create role + database `nora_group` the app can own.
2. Gitignored root `.env`:

   `DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/nora_group`

3. Same `DATABASE_URL` in `apps/web/.env.local` and `apps/Dashboard/.env.local` (or load from root).
4. Run `pnpm prisma migrate deploy` then `pnpm prisma:seed`.
5. Prove: `pnpm postgres:parity` and `pnpm postgres:dashboard-check` both pass.

Without this, nothing else “works perfectly.”

### 3.2 Cut the Website off Sanity onto PostgreSQL — **Missing (code exists)**

Required implementation (not done):

1. Change `apps/web/lib/content/getContent.ts` to call `getSiteContentFromPostgres()` (with a safe empty/error policy — do **not** silently resurrect seed catalogs that hide CMS deletes).
2. Point `GET /api/revalidate` (or a new path) at Postgres-driven cache tags, not Sanity webhooks.
3. After Dashboard mutations, call the Website revalidate URL with a shared secret (`WEBSITE_REVALIDATE_URL` + a non-Sanity-named secret).
4. Allow `next/image` / CSP for whatever media host you use (today only `cdn.sanity.io` is allowed remotely).
5. Decide seed vs empty catalogs for projects / testimonials / blog / FAQ (see §2.6).

Until this ships, Dashboard and Website are two products.

### 3.3 Shared media that the public site can show — **Partial**

Dashboard uploads go to **Dashboard-local disk** and URLs like `/api/media/{id}` that require a Dashboard session. The public Website cannot display those files.

Minimum for “working”:

- Either serve media from a public path/CDN both apps can read, **or**
- Put files on Cloudflare R2 (`Media.provider` already has `R2`) and store public HTTPS URLs.

Local `.data/media` will not survive serverless (Vercel) anyway.

### 3.4 Auth onto PostgreSQL — **Missing at runtime**

Phase 4 (documented, not started):

- Hash Owner + staff into `User.passwordHash` (no plaintext `DASHBOARD_OWNER_PASSWORD`).
- Store hashed session tokens in `Session`.
- Stop using `.data/users.json`.
- Set `AuditLog.actorId`.
- Replace in-memory login rate limits if you run more than one instance.

### 3.5 Remove Sanity — **Not started (safe only after 3.2)**

Delete / stop using, after Website cutover and a short rollback window:

- `apps/web/app/studio/**`, `apps/web/sanity/**`, `apps/web/lib/sanity/**`, `apps/web/scripts/seed-sanity.ts`
- `apps/Dashboard/lib/sanity/**` (already unused)
- Packages: `sanity`, `next-sanity`, `@sanity/icons`, `@sanity/image-url`, `@sanity/vision`
- Env names: `NEXT_PUBLIC_SANITY_*`, `SANITY_API_WRITE_TOKEN`, `SANITY_REVALIDATE_SECRET`
- Studio CSP / `cdn.sanity.io` image allowlist
- Cursor rule `.cursor/rules/sanity.mdc` (still says Sanity is the source of truth — it will be wrong)

Do **not** run `cms:bootstrap` / `seed-sanity.ts`. That writes the old CMS.

### 3.6 Translation — **Partial / blocked**

- API exists; needs `TRANSLATION_API_KEY` (and URL/model) server-side.
- Human review file is not durable.
- Targets are he/ar/en; Website `ru` is stored in Postgres on other writes but is not an AI target.
- Live provider call was never tested.

### 3.7 Dashboard field completeness vs Website — **Partial**

Postgres can store more than some screens edit. Known UI gaps (still true after Phase 3):

| Area | Edited in UI but weak / local-only | Website needs |
|---|---|---|
| Site | Nav / footer / social still Dashboard-chrome, not a first-class public nav CMS in the mutation set | `UiCopy` + settings SEO / WhatsApp / working hours |
| About | Vision, mission, feature banners not in `about` mutation (story only) | `AboutPage` values/image |
| Homepage | Intro features / why-items not in Dashboard mutations | `HomeIntroFeature`, `HomeWhyItem` |
| Services | Steps/icons in UI; persist path is title/description/visible/slug/image/features | Features + image + order |
| Materials | Spec sheet fields in UI; some persist (characteristics/applications/finishes) | Image + copy |
| How we work | Patch existing steps; add/remove steps limited | Page eyebrow/title/image |
| Legal | Mutation exists; dedicated editor UX may be thin | privacy / cookies / terms |

These do not block a first launch if seed copy is good and editors mainly add **projects** and **services visibility**.

### 3.8 Dashboard i18n chrome — **Partial**

Switcher works (login + user menu). Many module labels remain hardcoded English (`Edit Project`, native `confirm()` / `alert()`, etc.). Russian is intentionally absent from Dashboard UI.

### 3.9 Website polish still open

| Item | Status |
|---|---|
| Dark mode tokens | In CSS; not every leftover `bg-white` / charcoal utility was re-verified here |
| Theme flash (FOUC) | No blocking theme script in `[locale]/layout.tsx`; class applied after `ThemeToggle` mount |
| Blog / legal / 404 / detail dark pass | Previously **not tested** |
| Desktop lg navbar | Previously **not tested** |
| Hydration on `/`, `/en`, `/ru` | Previously **not re-verified** after `/ar` |
| Contact form | Out of scope by product (phone/WhatsApp only) |

### 3.10 Production / Vercel — **Missing**

Nothing in this repo proves a live deploy. To ship:

1. Managed PostgreSQL (`DATABASE_URL`) — not localhost.
2. Durable media (R2 or equivalent).
3. Durable users (Prisma User).
4. Website + Dashboard as two Vercel projects (or one monorepo with two apps), env per app.
5. `AUTH_SECRET` ≥ 32 chars, Owner bootstrap, revalidate secret, `NEXT_PUBLIC_SITE_URL`.
6. Do not deploy Dashboard with only `.data/` files.

---

## 4. Environment variable names (no values)

**Keep (Postgres world):**

| Name | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | root + both apps, server-only | Prisma |
| `AUTH_SECRET` | Dashboard | Session HMAC |
| `DASHBOARD_OWNER_EMAIL` | Dashboard | Temporary Owner until User table |
| `DASHBOARD_OWNER_PASSWORD` | Dashboard | Temporary; remove after auth migration |
| `WEBSITE_REVALIDATE_URL` | Dashboard | POST Website after CMS save |
| `SANITY_REVALIDATE_SECRET` or a renamed `REVALIDATE_SECRET` | both | Shared revalidate header (rename when Sanity dies) |
| `NEXT_PUBLIC_SITE_URL` | Website | SEO / sitemap |
| `TRANSLATION_API_KEY` / `URL` / `MODEL` | Dashboard, optional | AI drafts |

**Drop after cutover:** `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, `SANITY_API_WRITE_TOKEN`.

Never commit real values. Never put write tokens in `NEXT_PUBLIC_*`.

---

## 5. Historical bugs — still relevant or not

The 14 Sep audit listed five public failures. Status **if we abandon Sanity**:

| Old failure | Status now |
|---|---|
| Dashboard content never appears on Website | **Still true**, but the cause is “Website still not on Postgres,” not the old GROQ/visible/slug bugs |
| AI translation | **Still blocked** on missing key + file-based reviews |
| Dark mode unreadable text | **Largely addressed** via semantic tokens; leftover pages need a visual pass |
| Hydration errors | **Fixed in source** for Reveal/Hero; not fully re-verified on all locales |
| Dashboard UI language | **Core works**; module chrome incomplete |

Do not spend time bootstrapping or repairing Sanity datasets.

---

## 6. Recommended next implementation sequence (needs approval)

This audit does **not** implement the cutover. Suggested order after you approve:

1. **Local DB** — credentials, migrate, seed, prove `postgres:parity` + `postgres:dashboard-check`.
2. **Website read Postgres** — wire `getContent.ts`; cache/revalidate; image CSP.
3. **E2E** — login Dashboard → create/publish a project with image → confirm it on `/he` and `/ar` (and en/ru).
4. **Auth to Prisma User/Session** — drop plaintext Owner password and `users.json`.
5. **Public media** — R2 or shared public storage.
6. **Delete Sanity** — Studio, packages, env, leftover folders, CSP, cursor rule.
7. **Polish** — Dashboard chrome i18n, remaining About/nav CMS fields, dark-mode page pass, FOUC script.
8. **Production PostgreSQL + Vercel env + deploy.**

Risks: empty project/testimonial/blog lists after cutover; media URLs that only work on Dashboard; FOUC; Owner password still in env until step 4.

---

## 7. What this session did **not** do

- Did not modify application source (this file is documentation only).
- Did not connect to PostgreSQL or Sanity.
- Did not run lint, typecheck, build, or browser tests.
- Did not deploy.
- Did not invent customers, orders, leads, or extra services.

---

## 8. File map (current)

| Path | Role |
|---|---|
| `apps/web/lib/content/getContent.ts` | **Live** Website entry (Sanity \|\| seed) |
| `apps/web/lib/content/fromPostgres.ts` | Ready, unused |
| `apps/web/lib/content/seed.ts` | What visitors see without CMS |
| `apps/web/app/studio/**` | Sanity Studio (to remove) |
| `apps/Dashboard/lib/server/content/postgres/*` | Live Dashboard CMS |
| `apps/Dashboard/lib/auth/*` | Cookie auth + file users |
| `prisma/schema.prisma` | Target source of truth |
| `PHASE_3_DASHBOARD_POSTGRES_MIGRATION_REPORT.md` | Phase 3 detail |
| `PROJECT_AUDIT.md` | 14 Sep Sanity-era audit (stale conclusions) |
