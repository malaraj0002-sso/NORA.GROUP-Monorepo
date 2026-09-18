# Phase 3 — Dashboard PostgreSQL migration report

**Date:** 18 September 2026  
**Current HEAD (unchanged by this phase):** `a694f88`  
**This phase:** Migrate Nora Dashboard content CRUD from Sanity to PostgreSQL. Public Website unchanged. Sanity kept as rollback/reference. No commit.

PostgreSQL is the **target** source of truth for Dashboard content writes. PostgreSQL is **not** the live Website source. PRODUCTION PostgreSQL was not used.

This report distinguishes **LOCAL PostgreSQL** (this machine, `localhost:5432`) from **PRODUCTION PostgreSQL** (not used, not migrated).

---

## Executive Summary

Dashboard content read/write was moved off Sanity onto the Prisma models created in Phase 1 and seeded in Phase 2.

- **Before:** Dashboard → Sanity GROQ/write token, plus local file stores for users and translation reviews.
- **After:** Dashboard authenticated content APIs → PostgreSQL. Website still → seed + Sanity.
- **Not done:** Website cutover, Sanity removal, Cloudflare R2, production data migration, authentication rewrite.

Code and builds are in place. **Live local CRUD against `nora_group` did not succeed** because the LOCAL PostgreSQL role in the gitignored `.env` is denied database access (`P1010`). That is an operator credential/privilege issue, not a missing application layer.

---

## 1. What was migrated

Dashboard CMS mutations and authenticated content reads now use the server-only Prisma client in `apps/Dashboard/lib/db/prisma.ts`.

Sanity Studio, Sanity dependencies, and the Website `getSiteContent()` seed+Sanity path were **not** changed.

---

## 2. Before

| Layer | Behaviour |
|---|---|
| Website | `getSiteContent()` → Sanity when configured, else TypeScript seed |
| Dashboard read | Sanity GROQ, or mock if disconnected |
| Dashboard write | Sanity mutation API (`SANITY_API_WRITE_TOKEN`) |
| Media | Sanity asset upload |
| Auth | HMAC `nora_session`; Owner from env plaintext; extra users in `.data/users.json` (scrypt) |
| RBAC | Role rank (`employee < editor < admin < owner`) |
| Translation reviews | `.data/translation-reviews.json`; apply wrote Sanity |
| Audit | Not written to PostgreSQL `AuditLog` |

---

## 3. After

| Layer | Behaviour |
|---|---|
| Website | **Unchanged** — Sanity/seed |
| Dashboard read | `GET /api/content` → PostgreSQL (`cms.read`). `503` if unavailable. No Sanity/mock fallback for authenticated reads |
| Dashboard write | `POST /api/cms` → PostgreSQL transactions (`cms.write` / `cms.delete`) |
| Media | LOCAL files under `.data/media` + `Media` metadata row. `GET /api/media/[id]` serves them. No R2 |
| Auth | **Unchanged persistence** — still env Owner + `.data/users.json` |
| RBAC | Permission codes looked up from `Role` / `RolePermission`. Rank fallback if the table is unseeded or unreachable |
| Translation reviews | Still `.data/translation-reviews.json` (debt). **Apply** writes PostgreSQL |
| Audit | `AuditLog` rows for create/update/delete (no passwords/secrets) |

---

## 4. Migrated domains

| Domain | Prisma models used by Dashboard | Notes |
|---|---|---|
| Services | `Service`, `ServiceFeature`, `ServiceMedia` | Seven official slugs only. Door slugs/titles rejected |
| Site settings | `SiteSettings` | Global brand/contact fields |
| Home | `HomePage`, `HomeHeroMedia` | Hero slides map to `HomeHeroMedia` |
| About | `AboutPage` | Dashboard story → `AboutPage.body` |
| How we work | `HowWeWorkPage`, `HowWeWorkStep` | Step patch in a transaction |
| Contact | `ContactPage` | Eyebrow/title/subtitle |
| UI copy | `UiCopy` | `(locale, namespace, key)` |
| Legal | `LegalDocument`, `LegalSection` | Existing copy only; no invented legal text |
| Media metadata | `Media` | `provider = LOCAL`; R2 later |
| Audit | `AuditLog` | Actor email/role in metadata; `actorId` left null until users live in Postgres |
| RBAC lookup | `Role`, `Permission`, `RolePermission` | Not a user-account store |

**Related models present in schema/seed, not edited by the current Dashboard UI:**

- `HomeIntroFeature`
- `HomeWhyItem`
- `AboutValue`

Phase 3 did **not** invent Dashboard fields for those. They remain available for Website mapping / later UI work.

**Catalog CRUD is implemented if an editor creates a row from the existing UI, without fake seed data:**

- `Project` + `ProjectMedia`
- `Material` + `MaterialMedia`
- `Testimonial`
- `FaqItem`
- `BlogPost`

Empty lists are expected until real content exists.

---

## 5. Not migrated (intentional)

| Item | Why |
|---|---|
| Public Website | Phase 3 website-safety rule. `apps/web/lib/content/getContent.ts` still seed + Sanity |
| Sanity package, `/studio`, GROQ helpers | Temporary rollback/reference |
| Cloudflare R2 | Explicitly out of scope |
| Production PostgreSQL / production content | Explicitly out of scope |
| `User` / `Session` tables | Auth rewrite deferred; see §6 |
| Fake projects, testimonials, blog, FAQ, customers, orders, leads, employees | No authoritative source; do not manufacture records |
| Dashboard visual redesign | Data layer only |

There are **no** `Customer`, `Order`, `Lead`, or `Employee` Prisma models. None were invented.

---

## 6. Authentication status

**Temporary. Not production-ready.**

| Mechanism | Status |
|---|---|
| HMAC cookie `nora_session` | Still the live session |
| Owner account | `DASHBOARD_OWNER_EMAIL` + **plaintext** `DASHBOARD_OWNER_PASSWORD` compared server-side |
| Additional users | `.data/users.json` with scrypt hashes (not Sanity, not Postgres `User`) |
| Prisma `User` | Unused at runtime |
| Prisma `Session.tokenHash` | Unused at runtime |

Passwords are **not** stored in PostgreSQL in this phase. Plaintext is **not** written to Prisma. The env Owner password remains a known secret-in-config debt.

Login/logout routes were not redesigned. They still issue/clear the HMAC cookie.

**Phase 4 must migrate auth** onto hashed `User` rows and hashed session tokens, and remove the plaintext Owner env password.

---

## 7. RBAC status

Implemented permission codes (unchanged from Phase 1):

- `cms.read`
- `cms.write`
- `cms.delete`
- `media.upload`
- `users.manage`
- `translations.manage`
- `audit.read`

Roles: `owner`, `admin`, `editor`, `employee`. No extra roles.

### Enforcement

Every Dashboard mutation is server-side. `requirePermission(session, code)` loads `RolePermission` for `session.role`.

| Operation | Permission |
|---|---|
| `GET /api/content`, `GET /api/media/[id]` | `cms.read` |
| `POST /api/cms` create/patch | `cms.write` |
| `POST /api/cms` delete | `cms.delete` |
| `POST /api/media` | `media.upload` |
| `GET/POST/PATCH /api/users` | `users.manage` |
| `GET/POST/PATCH /api/translate` | `translations.manage` |

### Mapping vs older rank UI

If `RolePermission` rows are missing or PostgreSQL is unreachable, a **conservative rank fallback** is used:

| Permission | Minimum role (fallback) |
|---|---|
| `cms.read` / `cms.write` / `media.upload` / `translations.manage` | `editor` |
| `cms.delete` / `audit.read` | `admin` |
| `users.manage` | `owner` |

Phase 2 seed grants `employee` `cms.read`. When the database is seeded and reachable, that mapping wins. When it is not, employees cannot read CMS via the fallback (safer). The Dashboard UI still uses the same four roles; this is the safest compatible mapping without breaking screens.

---

## 8. Sanity status

| Surface | Connected? |
|---|---|
| Website public content | **Yes** — still Sanity/seed |
| `/studio` | **Yes** — not deleted |
| Dashboard Sanity identifiers in `.env.example` | Still documented |
| Dashboard CMS read/write | **No** — PostgreSQL |
| Previous Sanity writer | Kept at `apps/Dashboard/lib/sanity/` for rollback/reference. `lib/server/content/mutate.ts` re-exports the Postgres writer |

**CURRENT:** Website → Sanity/seed  
**PHASE 3:** Dashboard → PostgreSQL  
**FUTURE:** Website → PostgreSQL and Dashboard → PostgreSQL, then remove Sanity.

---

## 9. Security

- `DATABASE_URL` is server-only. Loaded from gitignored `.env` / `../../.env`. Never logged.
- Prisma runs in API routes, `layout.tsx` (server), and Node scripts. Not imported by client components.
- Mutations use Zod (`mutationSchema`). Invalid IDs, locales, and slugs are rejected.
- Door services are rejected (`doors`, `luxury-doors`, `door-service`, and door words in he/ar/en/ru titles). No silent replacement service.
- Locales on write: `he`, `ar`, `en`, `ru`. `mergeLocale` never drops Russian. Dashboard UI still shows he/ar/en; `ru` is preserved on patch.
- API errors: `{ ok: false, error }` with generic messages. Prisma/SQL traces are logged server-side, not returned.
- Success mutations: `{ ok: true, data: { id, revalidated } }` (plus top-level `id` for the existing CMS client).
- Same-origin check remains on mutating routes.
- Audit metadata stores email + role only. No password hashes, session secrets, or `DATABASE_URL`.

---

## 10. API route audit

| Route | Previous source | Write behaviour now | Auth | RBAC | Phase 3 change |
|---|---|---|---|---|---|
| `/api/auth/login` | env Owner + `users.json` | Unchanged | Public + rate limit | — | No data-store change |
| `/api/auth/logout` | Cookie | Unchanged | Cookie present | — | No |
| `/api/cms` | Sanity | PostgreSQL transactions | Session | `cms.write` / `cms.delete` | **Yes** |
| `/api/content` | Sanity / mock | PostgreSQL read | Session | `cms.read` | **Yes** |
| `/api/media` | Sanity assets | LOCAL disk + `Media` | Session | `media.upload` | **Yes** |
| `/api/media/[id]` | Did not exist | Authenticated LOCAL file | Session | `cms.read` | **Yes (new)** |
| `/api/translate` | JSON reviews; Sanity apply | JSON reviews; **Postgres apply** | Session | `translations.manage` | Partial |
| `/api/users` | `users.json` | Still `users.json` | Session | `users.manage` | AuthZ only |

---

## 11. Services rule

Allowed website slugs (exactly seven):

`kitchens`, `bedrooms`, `wardrobes`, `walk-in-closets`, `custom-furniture`, `offices`, `commercial`

Prisma enum uses camelCase for `walkInClosets` and `customFurniture`; APIs accept the website hyphenated slugs.

Forbidden: `doors`, `luxury-doors`, `door-service`, and door-related names in he/ar/en/ru. Create/update/delete of a forbidden service returns `400`.

---

## 12. Media / R2

- No Cloudflare R2 in this phase.
- Uploads go to gitignored `apps/Dashboard/.data/media`.
- `Media.provider = LOCAL`, `objectKey`, `url = /api/media/{id}`.
- Existing `/public` Website images were not moved or deleted.
- Structure is ready for an R2 provider later (`Media.provider` already exists).

---

## 13. Translation API

`/api/translate` was **not** removed.

- Provider: existing OpenAI-compatible env (`TRANSLATION_API_KEY` / URL / model). No invented provider. No new outbound calls unless those env vars already exist.
- Draft storage: `.data/translation-reviews.json` — **temporary technical debt**.
- Applying a reviewed draft calls `applyMutation` → PostgreSQL, not Sanity.
- Dashboard translation UI languages remain he/ar/en; Russian content is still stored and merged on other mutations.

---

## 14. LOCAL PostgreSQL connection

| Item | Result |
|---|---|
| Gitignored root `.env` | **Exists** (not committed; value not logged) |
| Host in URL | `localhost`, database name `nora_group` |
| `pnpm prisma:ensure-local` | **FAIL** — `P1010` User was denied access on the database |
| `pnpm prisma migrate deploy` | **Not applied** — same access denial |
| `pnpm prisma:seed` | **Not inserted in this phase** — cannot reach `nora_group` |
| PRODUCTION database | **Not used** |

The LOCAL PostgreSQL 18 service is running (Phase 2). The role in `DATABASE_URL` cannot use the database. Phase 3 did **not** invent credentials, did **not** change `pg_hba`, and did **not** connect to production.

Until the operator grants that local role access to `nora_group` (or uses a role that already owns it), live seed/parity/Dashboard CRUD against data cannot run.

---

## 15. Tests

### `pnpm postgres:contract` — **PASS** (exit 0)

```
SiteContent contract: PASS (no issues)
mapped slugs: kitchens, bedrooms, wardrobes, walk-in-closets, custom-furniture, offices, commercial
Mapper dropped unknown door slugs: PASS
Contract fixture: PASS
```

(The injected-door fixture is expected to report `found 8` / `Door service is not permitted` and then pass.)

### `pnpm postgres:dashboard-check` — **FAIL** (exit 1) after partial PASS

| Check | Result |
|---|---|
| Unauthenticated mutation rejected (`401`) | **PASS** |
| Permission mapping (employee no `cms.write`; owner has `cms.write`; editor no `cms.delete`; admin has `cms.delete`) | **PASS** (rank fallback while DB denied) |
| Door title rejected | **PASS** |
| Seven services read / `doors = 0` / he·ar·en·ru keys | **FAIL** — `service.findMany` `P1010` |
| Service update + locale preserve | Not reached |
| Homepage / about / how-we-work / contact / UI copy | Not reached |
| `AuditLog` row | Not reached |

Live database CRUD, service-count, and audit persistence therefore remain **unverified against data**.

### `pnpm postgres:parity`

Not re-run as a live data test. It requires the same LOCAL access that `ensure-local` failed.

---

## 16. Typecheck and build

| Command | Result |
|---|---|
| `pnpm typecheck` (`@nora/web` + `@nora/dashboard`) | **PASS** (exit 0) |
| `pnpm build:web` | **PASS** (exit 0). Studio route present. `he` / `ar` / `en` / `ru` routes present |
| `pnpm build:dashboard` | **PASS** (exit 0) after fixing Prisma `$transaction` client typing |

A first Dashboard build failed with a TypeScript mismatch: `Tx = typeof prisma` is not assignable to the interactive transaction client (methods `$connect` / `$transaction` omitted). Fixed with `Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>`. Rebuild succeeded.

`pnpm prisma:generate` also copies the generated client from the TypeScript 5.9.3 `@prisma/client` install into the Dashboard TypeScript 5.2.2 copy (`prisma/copy-dashboard-client.mjs`). That is local tooling, not a schema change.

---

## 17. Git

- **No commit**
- **No push**
- **No reset / checkout / branch delete / force-push / history rewrite**

`git status --short` after this phase (see §20). `.env` remains gitignored and untracked.

---

## 18. Remaining work (Phase 4 — do not start here)

1. Grant the LOCAL PostgreSQL role access to `nora_group` (operator). Then `prisma migrate deploy`, `prisma:seed`, `postgres:parity`, `postgres:dashboard-check`.
2. Migrate authentication to Prisma `User` + hashed passwords + hashed `Session` tokens. Remove plaintext `DASHBOARD_OWNER_PASSWORD`.
3. Persist translation reviews in PostgreSQL instead of `.data/translation-reviews.json`.
4. Dual-read then cut the **Website** from Sanity/seed to PostgreSQL.
5. Introduce Cloudflare R2; keep `Media` as metadata.
6. Remove Sanity / Studio only after Website cutover and a rollback window.
7. Production database, production content migration, production deploy — none of that in Phase 3.
8. Optionally expose `HomeIntroFeature`, `HomeWhyItem`, and `AboutValue` in the Dashboard UI without redesigning the product.
9. Set `AuditLog.actorId` once users live in PostgreSQL.

**Stop.** Phase 4 requires explicit approval.

---

## 19. Claims this report does **not** make

- Live LOCAL service rows were verified in `nora_group` during this run.
- The Website now reads PostgreSQL.
- Authentication now uses Postgres users/sessions.
- Sanity was removed.
- Media lives on R2.
- Production was migrated or deployed.

---

## 20. Files

### Created

- `apps/Dashboard/lib/db/loadDatabaseUrl.ts`
- `apps/Dashboard/lib/db/prisma.ts`
- `apps/Dashboard/lib/db/locale.ts`
- `apps/Dashboard/lib/db/services.ts`
- `apps/Dashboard/lib/server/permissions.ts`
- `apps/Dashboard/lib/server/audit.ts`
- `apps/Dashboard/lib/server/content/postgres/read.ts`
- `apps/Dashboard/lib/server/content/postgres/mutate.ts`
- `apps/Dashboard/lib/server/content/postgres/media.ts`
- `apps/Dashboard/app/api/media/[id]/route.ts`
- `apps/Dashboard/scripts/phase3-postgres-check.ts`
- `prisma/copy-dashboard-client.mjs`
- `PHASE_3_DASHBOARD_POSTGRES_MIGRATION_REPORT.md`

### Modified

- `package.json` — `postgres:dashboard-check`; `prisma:generate` copies the Dashboard client
- `pnpm-lock.yaml`
- `apps/Dashboard/package.json` — `@prisma/client@6.16.3`, `server-only`, `tsx`, `postgres:check`
- `apps/Dashboard/.env.example` — `DATABASE_URL` name only
- `apps/Dashboard/next.config.js` — `serverExternalPackages` for Prisma
- `apps/Dashboard/app/layout.tsx` — read PostgreSQL for authenticated sessions
- `apps/Dashboard/app/api/cms/route.ts`
- `apps/Dashboard/app/api/content/route.ts`
- `apps/Dashboard/app/api/media/route.ts`
- `apps/Dashboard/app/api/translate/route.ts`
- `apps/Dashboard/app/api/users/route.ts`
- `apps/Dashboard/lib/server/http.ts` — `{ ok: false, error }`, `requirePermission`
- `apps/Dashboard/lib/server/content/schema.ts` — `ru`, contact/uiCopy/legal, door check, media IDs
- `apps/Dashboard/lib/server/content/mutate.ts` — re-export Postgres writer
- `apps/Dashboard/lib/AdminDataContext.tsx` — `postgres` / `unavailable` sources
- `apps/Dashboard/lib/i18n/messages.ts` — source labels (en/ar/he)
- `apps/Dashboard/components/admin/modules/OverviewModule.tsx`
- `apps/Dashboard/components/admin/modules/HomepageModule.tsx` — do not treat Postgres as “Sanity disconnected”
- `apps/Dashboard/components/admin/modules/HowWeWorkModule.tsx` — same

### Not modified (by design)

- `apps/web/lib/content/getContent.ts`
- `prisma/schema.prisma`
- Sanity Studio / Website Sanity fetch
- Authentication password files / hashing implementation
