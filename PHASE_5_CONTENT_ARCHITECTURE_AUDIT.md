# PHASE 5 — CONTENT ARCHITECTURE AUDIT

**Repository:** Nora Group Monorepo  
**Branch:** `main`  
**HEAD:** `ed8668b5d735ef294c495a20df01944213b1dcf2` — `docs: finalize owner password reset verification`  
**Date:** 2026-09-19  
**Mode:** READ / INSPECT / REPORT / STOP  

This audit inspects Website + Dashboard + PostgreSQL content architecture against the target:

Website + Dashboard + PostgreSQL + Cloudflare R2 (Sanity is not part of the final architecture).

No implementation was performed. No schema, migration, package, UI, API, or database mutation was performed. Authentication, Owner, passwords, roles, and sessions were not changed.

---

## 1. Executive Summary

The repository is **already a PostgreSQL CMS in architecture**, not a Sanity CMS. Website reads Prisma. Dashboard CMS writes Prisma. Authentication is PostgreSQL User / Role / Permission / Session with Argon2id. The seven official services exist in the live local database and there is **no doors service**.

The gap is not “missing Prisma.” The gap is that **the CMS path is incomplete and dual-sourced**:

1. PostgreSQL holds site chrome, home, about, how-we-work, contact, legal, UI copy, seven services, and five Hero media rows.
2. Catalog tables for **projects, materials, testimonials, blog posts, and FAQ are empty** (`0` rows).
3. Website `getSiteContent()` treats PostgreSQL as source of truth, then **silently returns `seedContent` on any loader error**, including a door-guard throw.
4. The public Hero component **falls back to static `/public/images` slides** when PostgreSQL `heroImages` is empty.
5. Dashboard editors persist only a subset of fields; several visible editors never write media or Russian; project image save still filters `image-*` IDs while uploads return Prisma cuids.
6. Media is **local filesystem** (`storage/media`, `MediaProvider.LOCAL`). Cloudflare R2 exists only as an unused Prisma enum. This is not Vercel-ready.

**Verdict:** Phase 5 is not a greenfield CMS build. It is a **close-the-loop** phase: persist every Dashboard field, migrate remaining catalog content into PostgreSQL, stop fallbacks from hiding database state, then remove leftover Sanity names and add R2.

**Distance to target architecture**

| Layer | Current state |
|---|---|
| PostgreSQL as CMS source of truth | Partial — schema complete; catalog mostly unseeded |
| Website reads PostgreSQL | Yes, with seed fallback on error |
| Dashboard writes PostgreSQL | Yes, for a subset of fields |
| Auth / RBAC in PostgreSQL | Complete (Phase 4A) |
| Sanity runtime | Removed from packages and TS imports |
| Cloudflare R2 | Schema placeholder only |
| Production/Vercel media | Blocked without object storage or an equivalent durable store |

---

## 2. Actual Repository Architecture

### 2.1 Workspace

pnpm workspace (`pnpm-workspace.yaml`): `apps/*`.  
Root package: `nora-group-monorepo`, `packageManager: pnpm@9.15.0`.  
No `engines` field. Node observed locally: `v24.19.0`.

| Path | Role |
|---|---|
| `apps/web` (`@nora/web`) | Public marketing site. Next.js `^15.2.4`, React 19, next-intl 4, Tailwind 3.4, Prisma client 6.16.3. Port **3001**. |
| `apps/Dashboard` (`@nora/dashboard`) | Admin CMS + auth. Next.js `15.5.25`, React 19, Tailwind 3.3.3, zod, argon2 `^0.45.1`, Prisma client 6.16.3. Port **3000**. |
| `prisma/` | Shared schema, migrations, copy-client helper. Prisma **6.16.3**. |
| `scripts/` | `bootstrap-local.ts`, `bootstrap-owner.ts`, `fix-linux-dev.sh`. |
| `storage/` | Gitignored media directory (`storage/media/`). |
| `docker-compose.yml` | Local PostgreSQL. |
| `.env.example` | `DATABASE_URL`, `POSTGRES_PASSWORD`, `REVALIDATE_SECRET`, `WEBSITE_REVALIDATE_URL`, `NEXT_PUBLIC_SITE_URL`. Placeholders only. |

Root scripts of note: `dev` / `build` / `lint` / `typecheck` for both apps; `prisma:validate`; `prisma:generate` (+ `prisma/copy-dashboard-client.mjs`); `prisma:migrate:deploy`; `setup:local`; `bootstrap`; `bootstrap:owner`; `postgres:contract` / `postgres:parity` / `postgres:dashboard-check`.

Seed is configured as `"prisma": { "seed": "pnpm --filter @nora/web postgres:seed" }` (Prisma 7 deprecation warning on `prisma validate`; schema itself is valid).

### 2.2 Intended vs actual runtime

```
                    PostgreSQL (nora_group)
                    ┌─────────────────────┐
                    │ Auth + CMS tables   │
                    └──────────┬──────────┘
           Prisma reads        │         Prisma writes
     ┌─────────────────────────┴──────────────────────────┐
     │                                                    │
┌────▼─────┐                                        ┌─────▼──────┐
│ Website  │  GET /api/media/[id] (public LOCAL)    │ Dashboard  │
│ apps/web │  GET pages via getSiteContent()        │ auth/RBAC  │
│          │  POST /api/revalidate (secret)         │ POST /api/cms
└────┬─────┘                                        └─────┬──────┘
     │                                                    │
     └── seed.ts fallback on ANY loader error             └── AdminDataProvider
     └── Hero FALLBACK_SLIDES if heroImages empty             (client buffer)
     └── /public/images and /public/videos                    LOCAL upload
```

Sanity Studio, GROQ, `next-sanity`, and `@sanity/*` are **not** in `package.json` or `pnpm-lock.yaml`. There is **no** `studio/` directory.

### 2.3 Website tree (actual)

- `apps/web/app/[locale]/` pages: home, about, services, services/[slug], projects, projects/[slug], materials, how-we-work, testimonials, blog, blog/[slug], faq, contact, privacy, cookies, terms.
- `apps/web/app/api/revalidate/route.ts`
- `apps/web/app/api/media/[id]/route.ts`
- `apps/web/lib/content/getContent.ts` → `fromPostgres.ts` → `postgres/load.ts` + `postgres/map.ts`
- `apps/web/lib/content/seed.ts` (emergency fallback + historical marketing copy)
- `apps/web/middleware.ts` (next-intl only)
- No server actions directory. No Sanity client.

### 2.4 Dashboard tree (actual)

- Client SPA modules on `app/page.tsx` (not separate CMS routes).
- Routes: `/`, `/login`, API under `app/api/`.
- Auth: `lib/auth/password.ts`, `users.ts`, `session.ts`, `session-store.ts`.
- CMS: `lib/server/content/schema.ts`, `postgres/read.ts`, `postgres/mutate.ts`, `postgres/media.ts`.
- `lib/server/content/mutate.ts` is a **re-export** of PostgreSQL `applyMutation`, not Sanity.
- Middleware: Edge cookie presence only. Node session validation in `app/layout.tsx` and route handlers.

### 2.5 Prisma models present

Authentication: `User`, `Role`, `Permission`, `RolePermission`, `Session`, `AuditLog`.  
Media: `Media` (`MediaProvider`: `R2` \| `LOCAL` \| `EXTERNAL`).  
Site: `SiteSettings`, `HomePage`, `HomeIntroFeature`, `HomeWhyItem`, `HomeHeroMedia`, `AboutPage`, `AboutValue`, `HowWeWorkPage`, `HowWeWorkStep`, `ContactPage`, `UiCopy`, `LegalDocument`, `LegalSection`.  
Catalog: `Service`, `ServiceFeature`, `ServiceMedia`, `Project`, `ProjectMedia`, `Material`, `MaterialMedia`, `Testimonial`, `BlogPost`, `FaqItem`.

`prisma validate`: **PASS** (schema valid). `prisma generate`, migrate, seed, and `db push` were **not** run.

---

## 3. Website Data Sources

Every public page goes through `loadLocalePage` / `loadSlugPage` → `getSiteContent()`.

```9:32:apps/web/lib/content/getContent.ts
const postgresSiteContent = unstable_cache(
  async () => getSiteContentFromPostgres(),
  ['nora-site-content'],
  {
    tags: Object.values(REVALIDATE_TAGS),
    revalidate: 60,
  },
);

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  try {
    return await postgresSiteContent();
  } catch {
    console.error('[getSiteContent] PostgreSQL unavailable; using seed fallback');
    return seedContent;
  }
});
```

| Question | Finding |
|---|---|
| Where content comes from | Prisma via `getSiteContentFromPostgres()` when the query succeeds |
| Is PostgreSQL actually queried? | **Yes** (`loadPostgresSitePayload`) |
| Fallback data? | **Yes** — `seedContent` on any throw |
| Can fallback hide DB failures? | **Yes.** Catch is unconditional. A door-guard throw in `load.ts` also falls back to seed, so a forbidden service in DB would not appear on the public site and would not fail the page |
| Mock/test data? | `seed.ts` is a full marketing dataset (services, projects, materials, testimonials, blog, FAQ, hero images pointing at `/public/images`) |
| Sanity referenced? | **No** in Website TS/JS runtime |
| Statically generated? | `generateStaticParams` for locales; slug pages call `getSiteContent()` at build |
| Dynamically fetched? | Cached 60s + tag revalidation; not a live query on every request |
| Revalidation? | `POST /api/revalidate` with `x-revalidate-secret`; Dashboard calls it after successful CMS mutations **if** `WEBSITE_REVALIDATE_URL` and `REVALIDATE_SECRET` (or leftover `SANITY_REVALIDATE_SECRET`) are set |
| Locale-specific content? | Yes. Locales `he`, `ar`, `en`, `ru`. Default `he`, `localePrefix: 'as-needed'`, `localeDetection: false` |

**Hero visual source (additional fallback):** `apps/web/components/home/Hero.tsx` uses `FALLBACK_SLIDES` (`/public/images/...`) when `slides.length === 0`. That is independent of the PostgreSQL error catch. An explicit empty Hero in the database still shows local stock images.

**Media URLs:** mapper uses `media.url`. Uploads store `/api/media/{id}`. Website serves that path from the same LOCAL directory. `mediaSrc()` allows only relative `/` paths; a future `https://...r2...` URL would be rejected and replaced with `images.hero1`.

**Pages vs loader**

| Page | Loader | Notes |
|---|---|---|
| `/`, about, services, projects, materials, how-we-work, testimonials, blog, faq, contact, legal | `getSiteContent()` | Same bundle |
| `services/[slug]`, `projects/[slug]`, `blog/[slug]` | `getSiteContent()` then find by slug | `generateStaticParams` uses current bundle |
| sitemap | `getSiteContent()` | |
| `/api/media/[id]` | Prisma Media + filesystem | Public, LOCAL only |
| `/api/revalidate` | `revalidateTag` | Secret, fail-closed |

---

## 4. Dashboard Data Sources

Authenticated layout loads PostgreSQL:

```38:40:apps/Dashboard/app/layout.tsx
  const content = session
    ? await (await import('@/lib/server/content/postgres/read')).readDashboardContent()
    : { source: 'mock' as const, data: emptyAdminData };
```

`AdminDataProvider` then holds that bundle in **React state**. Saves go to `POST /api/cms` via `postCms()`.

| Module | Real? | Reads PG? | Writes PG? | Client-only remaining |
|---|---|---|---|---|
| Overview | Real status UI | Yes (source flag) | No | Dead `source === 'sanity'` branch |
| Homepage | Partial | Yes (6 fields) | Yes (6 text fields) | Intro features, why items, eyebrows, section titles not in UI/API |
| Site | Partial | Brand/contact | Tagline/name/email/address only | Nav, footer links, social, logo `assetIds`, phone/WhatsApp not sent |
| Hero | Real media list | Yes (`heroSlides` from `HomeHeroMedia`) | Yes (`resource: 'hero'`) | Per-slide title/CTA are UI-only; empty save without `clear` is rejected; UI never sends `clear: true` |
| About | Partial | Story/body | Story only | Vision/mission/values/image not persisted |
| How we work | Partial | Steps | Step title/description | Page eyebrow/title/image not in UI |
| Projects | Partial | Yes | Text/category/published; **images filtered out** | `image-*` filter vs cuid |
| Materials | Partial | Yes | Names he/ar/en + description; **no media** | Type/specs client-only; Studio leftover copy |
| Services | Partial | Yes | Title/description/published; **no media, no features** | Local drafts refused; image upload not saved |
| Testimonials / FAQ | Partial | Yes | Text fields | Empty DB today |
| Blog | Partial | Yes | Text; **no featured image** | Empty DB today |
| Users | Real | User table | User table | Auth, not CMS |
| Translation | Partial | Review JSON file | Apply via `applyMutation` | `.data/translation-reviews.json`; locales he/ar/en only |

**Legacy patterns**

| Pattern | Classification |
|---|---|
| `AdminDataProvider` + `useState(initialData)` | Harmless UI buffer **if** Save is used. Production source is PostgreSQL after save. Unsaved edits are local only |
| `initialData` from layout | Live PostgreSQL bundle when session exists |
| `lib/mock-data.ts` / `emptyAdminData` | Login placeholder / disconnected empty shell. Not the public website source |
| `source: 'sanity'` union + Overview branch | Legacy dead type/UI |
| `localStorage` (`nora_ui_lang`) | Harmless UI language preference |
| `sessionStorage` | Not used as a CMS store |
| `.data/translation-reviews.json` | Local review queue; not Vercel-durable |
| Hardcoded `ICON_OPTIONS` / material types | Harmless UI enums |
| `common.sanityDisconnected` i18n keys | Legacy key name; current English/Arabic/Hebrew copy talks about PostgreSQL |

Modules are one client page (`app/page.tsx`) switched by `AdminModule` state. There are no per-module URL routes. Protection is layout session + API permissions, not per-module routes.

---

## 5. PostgreSQL State

Read-only counts from the live local database (no inserts/updates/deletes). Secrets, hashes, tokens, and emails are not printed.

| Table | Count |
|---|---|
| Users | **1** (role `owner`, `enabled: true`) |
| Roles | **4** (`owner`, `admin`, `editor`, `employee`) |
| Permissions | **7** |
| Sessions | **4** (opaque cookies; hashes not inspected/printed) |
| AuditLogs | **40** |
| Media | **18** (all `LOCAL`) |
| Services | **7** |
| ServiceFeatures | **21** |
| ServiceMedia | **7** |
| Projects | **0** |
| ProjectMedia | **0** |
| Materials | **0** |
| MaterialMedia | **0** |
| Testimonials | **0** |
| BlogPosts | **0** |
| FaqItems | **0** |
| HomeHeroMedia | **5** |
| HomeIntroFeature | **4** |
| HomeWhyItem | **6** |
| SiteSettings | **1** |
| HomePage | **1** |
| AboutPage | **1** |
| AboutValue | **3** |
| HowWeWorkPage | **1** |
| HowWeWorkSteps | **7** |
| ContactPage | **1** |
| UiCopy | **172** |
| LegalDocuments | **3** |
| LegalSections | **24** |

Interpretation: **home/company/legal/UI/services are seeded. Catalog social-proof and blog are not.** A healthy PostgreSQL connection therefore yields an empty projects/materials/blog/FAQ/testimonials website, while a failed connection yields the rich `seed.ts` catalog. That inversion is a Phase 5 content-integrity issue.

Sessions were not created or revoked by this audit. The count of 4 is reported only.

---

## 6. Content Model Audit

Status key: **Complete** = UI → API → validation → Prisma → PostgreSQL → Website loader → Website UI all exist and are wired. **Partial** = some layers missing or a field subset only. **Gap** = schema and/or website exist but Dashboard cannot manage it, or PostgreSQL has no rows.

| Content Type | Dashboard UI | API/Action | Validation | Prisma | PostgreSQL | Website Loader | Website UI | Status |
|---|---|---|---|---|---|---|---|---|
| Hero media | Yes | `hero` patch | Yes + empty-list guard | `HomeHeroMedia` | 5 rows | Yes | Yes (+ static fallback) | Partial |
| Home intro text | Yes (title/desc) | `homepage` patch | Yes | `HomePage` | 1 row | Yes | Yes | Partial |
| Home intro features | No | No | No | `HomeIntroFeature` | 4 rows | Yes | Yes | Gap (read-only in CMS) |
| Why choose Nora | No | No | No | `HomeWhyItem` | 6 rows | Yes | Yes | Gap |
| Home hero titles | Yes | `homepage` | Yes | `HomePage` | Yes | Yes | Yes | Partial (no `ru` editor) |
| Home section eyebrows/titles | No | No | No | `HomePage` JSON columns | Yes | Yes | Yes | Gap |
| About story | Yes | `about` patch | Yes | `AboutPage.body` | Yes | Yes | Yes | Partial |
| About values | No | No | No | `AboutValue` | 3 rows | Yes | Yes | Gap |
| How We Work steps | Yes | `howWeWork` | Yes | `HowWeWorkStep` | 7 rows | Yes | Yes | Partial |
| How We Work page chrome | No | No | No | `HowWeWorkPage` | 1 row | Yes | Yes | Gap |
| Services | Yes | create/patch/delete | Slug enum + door guard | `Service` | 7 rows | Yes | Yes | Partial (no media/features save) |
| Service features | Shown as steps | `features` on schema | Yes on API | `ServiceFeature` | 21 rows | Yes | Yes | Gap in UI save |
| Service media | Upload widget | `assetIds` on API | Yes | `ServiceMedia` | 7 rows | Yes | Yes | Gap in UI save |
| Projects | Yes | Yes | Yes | `Project` | **0** | Yes | Yes | Incomplete data + image-id bug |
| Project media | Upload widget | `assetIds` | Yes | `ProjectMedia` | 0 | Yes | Yes | **Broken persist** (`image-*` filter) |
| Materials | Yes | Yes | Yes | `Material` | **0** | Yes | Yes | Incomplete + media not saved |
| Material media | Upload widget | `assetIds` | Yes | `MaterialMedia` | 0 | Yes | Yes | Gap in UI save |
| Testimonials | Yes | Yes | Yes | `Testimonial` | **0** | Yes | Yes | Empty PG |
| FAQ | Yes | Yes | Yes | `FaqItem` | **0** | Yes | Yes | Empty PG |
| Blog posts | Yes | Yes | Yes | `BlogPost` | **0** | Yes | Yes | Empty PG; featured image not saved |
| Contact page | No module | `contact` patch exists | Yes | `ContactPage` | 1 row | Yes | Yes | API without UI |
| Site settings | Partial | `site` patch | Yes | `SiteSettings` | 1 row | Yes | Yes | Partial |
| UI copy | No module | `uiCopy` patch exists | Yes | `UiCopy` | 172 rows | Yes | Header/Footer/nav | API without UI |
| Legal documents | No module | `legal` patch exists | Yes | `LegalDocument`/`LegalSection` | 3 / 24 | Yes | privacy/cookies/terms | API without UI |

**Schema vs code (no schema-change recommendation unless evidenced)**

- Relationships in schema match Website includes. No missing FK required by current loaders.
- Dashboard `LocalizedText` is `{ he, ar, en }` while Prisma JSON contract is `{ he, ar, en, ru }`. Code drops `ru` on read (`toDashboardLocale`) and never sends `ru` (`compactLocale`). Existing Russian in DB is preserved by `mergeLocale` if omitted, but **cannot be edited**.
- `Service` uses `published`, not `enabled`. Website maps `published` → `visible`.
- `ProjectCategory` has five values; offices and walk-in-closets have no dedicated project category (documented in schema comments). Evidence-supported, not a defect by itself.
- `Media.provider` defaults to `R2` in schema; uploads force `LOCAL`. Fine if R2 is future-only.
- Unused by Dashboard UI but used by Website: many `HomePage` JSON columns, `AboutValue`, contact fields, legal, uiCopy.
- Dashboard still has nav/footer/social editors that **do not map** to `UiCopy` / `SiteSettings` columns.

---

## 7. Seven-Service Audit

Live PostgreSQL contains **exactly seven** services. Prisma enum slugs map to website hyphenated slugs.

| ID | Prisma slug | Website slug | Localized names | Published | Sort | Media | Features |
|---|---|---|---|---|---|---|---|
| `cmu64uuat006ev7e0zp7j4s91` | kitchens | kitchens | he, ar, en, ru | true | 0 | 1 | 3 |
| `cmu64uuct006iv7e0ukrb3nj2` | bedrooms | bedrooms | he, ar, en, ru | true | 1 | 1 | 3 |
| `cmu64uud8006mv7e0bvw9wi1e` | wardrobes | wardrobes | he, ar, en, ru | true | 2 | 1 | 3 |
| `cmu64uudm006qv7e0kra6bai0` | walkInClosets | walk-in-closets | he, ar, en, ru | true | 3 | 1 | 3 |
| `cmu64uufj006uv7e0s1gysnb2` | customFurniture | custom-furniture | he, ar, en, ru | true | 4 | 1 | 3 |
| `cmu64uuh1006yv7e04ob6omsn` | offices | offices | he, ar, en, ru | true | 5 | 1 | 3 |
| `cmu64uuhk0072v7e0mqcvobwy` | commercial | commercial | he, ar, en, ru | true | 6 | 1 | 3 |

**Forbidden services:** no `doors`, `luxury-doors`, or `door` slug. Title JSON scan for door / דלת / باب / двер: **none**. Project slug/title scan: **none**.

Schema `ServiceSlug` has no doors member. Website `SERVICE_SLUGS` matches the seven. Dashboard create requires `z.enum(SERVICE_SLUGS)`. Duplicate slug returns 409. Door mutations return 400.

---

## 8. Hero Media Audit

The previous production bug (unconditional deletion when `assetIds` was empty / `image-*` / `local-hero-*`) is **not present** in the current mutate path.

Current Dashboard save (`HeroModule`):

- Sorts slides by `order`.
- Sends `slide.id` values that match `^[a-zA-Z0-9._-]+$`.
- After upload, `ImageUpload` replaces slide `id` with Prisma `assetId` (cuid).
- Does **not** send `clear: true`.

Current mutate (`apps/Dashboard/lib/server/content/postgres/mutate.ts`):

| Behavior | Implementation |
|---|---|
| Identify media | Resolve each submitted id as `Media.id`, else `Media.objectKey` |
| Ordering | `sortOrder: index` after resolution |
| Empty list without `clear` | **400**, existing `HomeHeroMedia` unchanged |
| Empty list with `clear: true` | Transaction `deleteMany` only |
| Invalid IDs | If **none** resolve: 400, existing unchanged. If **some** resolve: unresolved IDs are silently dropped |
| Transaction | `deleteMany` then `createMany` inside `$transaction` |
| Website read | `home.heroMedia` sorted by `sortOrder` → `heroImages` URL list |
| Empty on Website | Hero UI uses `FALLBACK_SLIDES` |
| Dashboard vs Website source | Same `HomeHeroMedia` join table |

Live DB: **5** `HomeHeroMedia` rows. Website and Dashboard agree on that table when PostgreSQL succeeds.

**Residual risks (do not fix in this phase):**

- Dashboard cannot clear Hero from the UI (`clear` is never sent). Accidental empty save is safely rejected.
- Mixed valid/invalid IDs can persist a shorter list without error.
- Website stock-image fallback hides an empty Hero.

---

## 9. Media Storage Audit

| Question | Answer |
|---|---|
| Images stored as bytes in PostgreSQL? | **No** |
| URLs stored in PostgreSQL? | **Yes** (`Media.url`, typically `/api/media/{id}`) |
| Local filesystem? | **Yes** — `storage/media/{id}.{ext}` via `MEDIA_DIR` or `../../storage/media` from each app cwd |
| Object storage? | **No** |
| Cloudflare R2 integrated? | **No.** No SDK, no env, no upload to R2. Enum member `MediaProvider.R2` only |
| R2 placeholders? | Schema default `provider @default(R2)`; unused |
| Abstract enough for R2? | **Mostly.** `provider` + `objectKey` + `url` are the right columns. Website `mediaSrc()` currently **rejects absolute https URLs**, so R2 public URLs would not render without a code change |
| Dashboard upload? | `POST /api/media`, session + `media.upload`, same-origin, 8 MB, magic-byte JPEG/PNG/WebP |
| RBAC on upload? | **Yes** |
| Website public access? | **Yes** — `GET` `/api/media/[id]` on Website and Dashboard (Dashboard GET is unauthenticated) |
| Signed URLs? | **No.** Public bytes + `Cache-Control: public, max-age=3600` |
| Deletion? | No media DELETE route. Join rows delete with parent documents. `onDelete: Restrict` on media FKs. **No orphan cleanup** |
| Vercel? | Filesystem writes are **not durable**. Translation review file has the same problem |

---

## 10. Localization Audit

| Surface | Locales |
|---|---|
| Website routes / `SiteContent` | `he`, `ar`, `en`, `ru` (default `he`) |
| Prisma JSON contract | `he`, `ar`, `en`, `ru` (schema comment: do not omit `ru`) |
| Live service titles | All four keys present |
| Dashboard UI chrome | `ar`, `he`, `en` only (`UI_LANGS`) — allowed by product rules |
| Dashboard **content** tabs (`LanguageTabs`) | `en`, `ar`, `he` only — **Russian missing** |
| `LocalizedText` / `LocalizedInput` | No `ru` |
| `compactLocale` | Emits `he`/`ar`/`en` only |
| `toDashboardLocale` | Drops `ru` on read |
| Translation API schema | `he`/`ar`/`en` only; system prompt says “Do not invent Russian” |
| RTL/LTR | Website: he/ar RTL, en/ru LTR. Dashboard UI: ar/he RTL, en LTR |
| Hardcoded copy | Some Dashboard field labels remain English (`Edit Service`, material type names) |

Mismatch: Website and database are four-locale. Dashboard content editing is three-locale. Russian already stored in PostgreSQL is not visible or editable in the CMS, but is usually preserved on patch because omitted keys are not overwritten.

---

## 11. API / Security Audit

Dashboard middleware: cookie **presence** only (Edge). Stolen/expired cookies are rejected in Node `requireSession` / layout `resolveDatabaseSession`. `/api/auth/login` and `/api/auth/logout` are excluded from the cookie gate (logout still revokes if a cookie exists).

| Route | Method | Auth | Permission | Validation | DB | AuditLog | Public/Private | Risk |
|---|---|---|---|---|---|---|---|---|
| `/api/auth/login` | POST | No (creates session) | — | JSON email/password; same-origin; rate 8/min | User + Session | `login` / `login_failed` | Private | Low (rate limit + dummy verify expected from Phase 4A) |
| `/api/auth/logout` | POST | Optional session | — | same-origin | Revoke Session | `logout` if session | Private | Low |
| `/api/content` | GET | Session | `cms.read` | — | Prisma read bundle | No | Private | Low |
| `/api/cms` | POST | Session | `cms.write` or `cms.delete` | `mutationSchema` (zod) | Prisma mutate | create/update/delete | Private | Medium: service delete can remove an official service; origin check required |
| `/api/media` | POST | Session | `media.upload` | Magic bytes, size, type | Media + filesystem | `create` media | Private | Medium on Vercel (local FS) |
| `/api/media/[id]` | GET | **None** | — | id charset, no `..` | Media + filesystem | No | **Public** | Low for LOCAL public assets; no auth by design. Same pattern on Website |
| `/api/users` | GET | Session | `users.manage` | — | Users | No | Private | Low |
| `/api/users` | POST | Session | `users.manage` | zod; cannot create `owner` | User | `user_create` | Private | Low |
| `/api/users` | PATCH | Session | `users.manage` | zod; no owner role assign | User | disable / role change | Private | Low |
| `/api/translate` | GET/POST/PATCH | Session | `translations.manage` | zod; URL allowlist; rate 10/min | Optional mutate + **JSON file** | Via applyMutation if applied | Private | Medium: filesystem store; no `ru` |
| Website `/api/revalidate` | POST | Shared secret | — | timing-safe; fail-closed; rate 10/min | Cache tags | No | Private | Low if secret set; 401 if empty |
| Website `/api/media/[id]` | GET | None | — | id charset | Media + FS | No | Public | Same as Dashboard GET |
| Website pages | GET | None | — | locale/slug guards | Prisma or seed | No | Public | Seed fallback (see findings) |

CSRF: mutating Dashboard routes use `assertSameOrigin`. Session cookie is `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` in production.

No content route trusts client-supplied roles. Permissions are loaded from `RolePermission` (rank fallback only if unseeded).

---

## 12. Cache / Revalidation Audit

| Mechanism | Behavior |
|---|---|
| `unstable_cache` | Key `nora-site-content`, tags from `REVALIDATE_TAGS`, `revalidate: 60` |
| React `cache()` | Dedupes `getSiteContent` per request |
| Dashboard after CMS write | `applyMutation` always `await revalidateWebsite()` on successful create/patch/delete |
| `revalidateWebsite()` | POST `WEBSITE_REVALIDATE_URL` with `x-revalidate-secret` = `REVALIDATE_SECRET` or `SANITY_REVALIDATE_SECRET`. Missing URL/secret → **false, silent** |
| Website endpoint | `revalidateTag` for all tags |
| Stale content | Up to 60 seconds even when revalidate is configured. If env is unset, stale until 60s ISR/cache expiry or process restart |
| Vercel | Tag revalidation works if both apps share the secret and the Website URL is reachable from Dashboard. Split deployments require that URL to be the public Website origin |

Inner mutate helpers return `revalidated: false`; the wrapper overwrites that by calling `revalidateWebsite()`. That is not a miss.

Build-time `generateStaticParams` for service/project/blog slugs uses `getSiteContent()`. If PostgreSQL is down at build, slugs come from **seed**. If PostgreSQL is up, catalog slugs currently come from **empty** tables (except the seven services).

---

## 13. Sanity Dependency Audit

| Item | Classification | Break if removed? |
|---|---|---|
| `sanity` / `next-sanity` / `@sanity/*` in package.json / lockfile | **Absent** | N/A |
| `from 'sanity'` / `from 'next-sanity'` / `from '@sanity` in TS/JS | **Absent** | N/A |
| `/studio` | **Absent** | N/A |
| `ContentSource` includes `'sanity'` | Legacy type | No (dead member) |
| `OverviewModule` `source === 'sanity'` | Legacy UI branch | No |
| i18n key `common.sanityDisconnected` | Legacy key; copy is PostgreSQL | No |
| `SANITY_REVALIDATE_SECRET` alias | Unused env name accepted as secret fallback | Removing alias is safe once `REVALIDATE_SECRET` is set |
| `.env.example` files | No `NEXT_PUBLIC_SANITY_*` | N/A |
| Gitignored `.env.local` | Prior audits noted leftover **names**; this audit did not print values | Runtime CMS does not import Sanity |
| Historical docs (`PROJECT_AUDIT.md`, `PHASE_2_PLAN.md`, etc.) | Documentation-only | No |
| `POST_MERGE_POSTGRES_CUTOVER_AUDIT.md` | Accurate that Studio/GROQ were removed | No |

**Would removing remaining Sanity strings break Website, Dashboard, build, runtime, content loading, or deployment?**  
**No**, provided `REVALIDATE_SECRET` remains the active secret. There is no Sanity runtime dependency left to uninstall.

Stale documentation still describing next-sanity / Studio as current architecture is **wrong** and should not be trusted (per audit rule 22). Code was verified.

---

## 14. Vercel Readiness

| Topic | Assessment |
|---|---|
| Website `next.config.ts` | Security headers, `serverExternalPackages: ['@prisma/client','prisma']`, next-intl plugin. **Likely works on Vercel** with `DATABASE_URL` |
| Dashboard `next.config.js` | Same Prisma externalization; images unoptimized. **Likely works** for UI/auth |
| Prisma | Client in both apps; `postinstall` generates. Need generate during Vercel install. **Requires environment configuration** |
| `DATABASE_URL` | Must be a hosted Postgres reachable from Vercel. Localhost URLs will fail. **Requires environment configuration** |
| Media LOCAL FS | **Requires architectural change** (R2 or equivalent). Ephemeral filesystem |
| Translation review JSON | **Requires architectural change** or accept lossy reviews |
| `WEBSITE_REVALIDATE_URL` | Must be the deployed Website origin, not `http://localhost:3001`. **Requires environment configuration** |
| `NEXT_PUBLIC_SITE_URL` | SEO/sitemap; localhost rejected for public origin except local http. **Requires environment configuration** |
| `pnpm@9.15.0` | Set in packageManager; configure Vercel to pnpm 9 |
| Node | No engines pin; Next 15 wants Node 20+ |
| `vercel.json` | **Absent** |
| Build commands | `pnpm build:web` / `pnpm build:dashboard` (two Vercel projects expected) |
| Middleware | Website i18n matcher excludes `api|_next|_vercel`. Dashboard cookie gate is Edge-safe |
| Filesystem writes | Upload + translation store assume writable disk |
| `@netlify/plugin-nextjs` | Leftover Dashboard dependency; unused for Vercel |
| Split Next versions | Website `^15.2.4`, Dashboard `15.5.25` — works locally; keep generating Prisma for both |

| Works locally | Likely works on Vercel | Needs env | Needs architecture |
|---|---|---|---|
| Auth, CMS text for wired fields, seven services, Hero from PG, legal/uiCopy/home | HTML/SSR apps + Prisma **if** DATABASE_URL and secrets set | DATABASE_URL, REVALIDATE_SECRET, WEBSITE_REVALIDATE_URL, NEXT_PUBLIC_SITE_URL, AUTH cookie Secure | LOCAL media, translation file, seed/Hero fallbacks for production integrity |

---

## 15. Mock / Legacy Data Audit

| Location | Classification |
|---|---|
| `apps/web/lib/content/seed.ts` | Emergency fallback **and** a full production-shaped catalog. Can become the live site if Prisma throws |
| `apps/web/lib/content/images.ts` | Static `/public/images` used by seed and Hero fallback |
| `apps/web/components/home/Hero.tsx` `FALLBACK_SLIDES` | Production visual fallback; hides empty CMS Hero |
| `apps/Dashboard/lib/mock-data.ts` | Login/unavailable placeholder. Contains luxury-carpentry copy, **no doors service** |
| `emptyAdminData` | Empty shell |
| `AdminDataProvider` state | UI buffer |
| `apps/Dashboard/scripts/phase3-postgres-check.ts` door fixture | Test fixture (he דלתות / ar أبواب / en Doors / ru Двери) used to prove rejection |
| `apps/web/scripts/postgres-contract.ts` injected `doors` / `luxury-doors` | Test fixture |
| Overview `sanity` source | Legacy dead branch |
| Search chrome / Bell on Dashboard page | Harmless UI-only state |

---

## 16. Doors-Prohibition Audit

Repository-wide relevant hits (not deleted, classified):

| Occurrence | Class |
|---|---|
| `prisma/schema.prisma` comments and absent enum member | Code / documentation — legitimate guard |
| `apps/web/lib/constants.ts` `SERVICE_SLUGS` comment | Code — legitimate |
| `apps/web/lib/content/postgres/load.ts` throw if slug matches `/door/i` | Code — legitimate guard |
| `apps/web/lib/content/siteContentContract.ts` doorPattern | Test/contract — legitimate |
| `apps/Dashboard/lib/db/services.ts` `DOOR_PATTERN` / `isForbiddenDoorService` | Code — legitimate |
| `apps/Dashboard/lib/server/content/schema.ts` `rejectDoorMutation` | Code — legitimate |
| Seed / mock-data | **No** doors service. “outdoor furniture” in mock material copy is unrelated |
| Live PostgreSQL services | **None** |
| `phase3-postgres-check.ts` / `postgres-contract.ts` titles דלתות / أبواب / Doors / Двери | Mock/test fixture for rejection |
| Phase reports (`PHASE_1`…`PHASE_4`, `POST_MERGE_...`) | Documentation of the prohibition |
| Russian `Двери` | Only in the Dashboard phase3 rejection fixture |

**No prohibited service reference in production data.** Do not delete the guards.

---

## 17. Regression Findings

This phase did not modify UI. Static inspection:

| Area | Intentionally changed by this audit? | Notes |
|---|---|---|
| Header / Footer | No | Website still `getSiteContent` → `toChrome` |
| Hero visual design | No | Same `Hero.tsx`; fallback slides still present |
| Theme / dark / light | No | Untouched |
| Responsive / RTL / LTR | No | Untouched |
| Fonts / branding / logo | No | `CONTACT_DEFAULTS.logoPath` + SiteSettings media |
| Service presentation | No | Seven slugs; HomeView slices 7 services |

No Header/Footer/Hero redesign occurred. Residual visual risk is **content** (empty catalog vs seed), not CSS.

---

## 18. Git State

Inspected with `git status`, `git diff --stat`, `git diff --name-only`. Nothing was staged or committed by this audit.

| Item | Value |
|---|---|
| Branch | `main` (up to date with `origin/main` at inspection time) |
| HEAD | `ed8668b5d735ef294c495a20df01944213b1dcf2` |
| Uncommitted files before this report | **None** (clean tree) |
| Phase 5 source changes | **None** |
| Unexpected modifications | **None** at start of audit |
| Only file this audit is allowed to add | `PHASE_5_CONTENT_ARCHITECTURE_AUDIT.md` |

`prisma validate` was run (read-only). It did not change the working tree. `prisma generate`, migrate, seed, build, and `--fix` were not run.

---

## 19. Critical Findings

**C1. Dual public content sources (PostgreSQL vs seed vs `/public` images)**  
Severity: **CRITICAL**  
When Prisma throws, the entire marketing site is `seedContent` (full catalog, local hero images). When Prisma succeeds, catalog tables are empty. Operators cannot tell which source the public site used. A door-guard throw is also swallowed by the same catch.

**C2. LOCAL filesystem media cannot satisfy the target production architecture**  
Severity: **CRITICAL** (for Vercel / durable production, not for local Docker)  
Uploads write `storage/media`. Vercel instances do not share that disk. Schema is R2-ready; runtime is not. Website also cannot display absolute R2 URLs until `mediaSrc` is extended.

These are architecture blockers for the stated end state. They are not authentication regressions.

---

## 20. High-Priority Findings

**H1. Catalog tables empty in PostgreSQL**  
Projects, materials, testimonials, blog, FAQ = 0. Website loaders and UIs exist. Public catalog pages are empty while seed still contains the historical marketing set.

**H2. Project image persist bug**  
`ProjectsModule` keeps only IDs that `startsWith('image-')`. Uploads return Prisma cuids. `read.ts` already stores `imageAssetId` as `mediaId`. Saving a project **drops** gallery/cover media. This is the same class of ID mismatch that previously broke Hero.

**H3. Service / material / blog / site logo media not saved from UI**  
API supports `assetIds`. Widgets either ignore `assetId` or omit it from the POST body. Features on services are also not included in save.

**H4. Dashboard cannot edit Russian content**  
Four-locale database and website vs three-locale editors and `compactLocale`.

**H5. Large Home/About/Contact/Legal/UiCopy surface is Website-live but Dashboard-read-only**  
Intro features, why items, about values, contact, legal, uiCopy have Prisma rows and Website UI. Mutation schema already covers contact/uiCopy/legal; **no modules call them**. Homepage mutation omits most `HomePage` columns.

**H6. Site nav/footer/social editors are production-looking but client-only**  
Website nav comes from `UiCopy`, not `siteSettings.navItems`. Saving Site does not send logo `assetIds` or phone/WhatsApp.

**H7. Hero empty state still looks populated on the Website**  
`FALLBACK_SLIDES` after a successful empty `heroImages` array.

**H8. Revalidation silently no-ops without env**  
Stale Website cache for 60s+ if `WEBSITE_REVALIDATE_URL` / `REVALIDATE_SECRET` unset.

---

## 21. Medium-Priority Findings

**M1.** Hero save silently drops unresolved IDs if at least one ID resolves.  
**M2.** Dashboard cannot explicitly clear Hero (`clear: true` unused by UI).  
**M3.** `GET /api/media/[id]` on Dashboard is unauthenticated (same public files as Website).  
**M4.** Translation drafts live in `.data/` JSON; no `ru`; leftover “Studio” error strings in Services/Materials.  
**M5.** Service delete API can remove an official seven-service row (door delete is blocked; kitchens delete is not).  
**M6.** `SANITY_REVALIDATE_SECRET` alias and `'sanity'` ContentSource leftover.  
**M7.** Split Next.js versions; leftover `@netlify/plugin-nextjs`.  
**M8.** Four leftover Session rows exist (not inspected beyond count; not revoked).  
**M9.** `mediaSrc` / CSP `img-src 'self' data: blob:` will need a conscious change before public R2 hostnames.  
**M10.** Dashboard material `nameRu` cannot be sent (`nameHe`/`nameAr`/`nameEn` only).

---

## 22. Low-Priority Findings

**L1.** i18n key still named `sanityDisconnected`.  
**L2.** Prisma `package.json#prisma` seed key deprecation warning.  
**L3.** Some Dashboard labels hardcoded English.  
**L4.** Search field and notification bell on Dashboard are non-functional UI.  
**L5.** Historical docs (`PROJECT_AUDIT.md`, `FINAL_PROJECT_REPORT.md`, `PHASE_2_PLAN.md`) still describe Sanity as current.  
**L6.** Schema comment still says “Argon2id in a later auth migration” though Phase 4A shipped it.  
**L7.** No orphan Media cleanup job.  
**L8.** `HeroModule` per-slide title/CTA fields are unused by Website (Website Hero uses `HomePage.heroTitle` / `heroSubtitle` once).

---

## 23. Recommended Phase 5 Implementation Plan

Do **not** implement these now. Order is based on this audit, not a generic template.

### Phase 5A — Dashboard persist completeness (no schema change expected)

- **Objective:** Every control that looks like a save must write PostgreSQL using existing mutation resources. Fix the `image-*` filter. Pass `assetId` from `ImageUpload`. Persist service features and media. Add `ru` to content editors and `compactLocale`. Wire contact/legal/uiCopy/homepage remaining fields **or hide the fake editors**.
- **Files likely affected:** `ProjectsModule.tsx`, `ServicesModule.tsx`, `MaterialsModule.tsx`, `BlogModule.tsx`, `SiteModule.tsx`, `HeroModule.tsx`, `HomepageModule.tsx`, `LanguageTabs.tsx`, `cms-client.ts`, `lib/types.ts`, `postgres/read.ts`, possibly `schema.ts` if homepage/about values need new patch fields.
- **Database impact:** Data updates only; schema change only if evidence shows missing columns (none required for the persist bugs).
- **API impact:** Mostly existing `/api/cms` resources.
- **UI impact:** Editors gain Russian; broken image saves start working; remove or label non-persisting nav/footer.
- **Migration risk:** Low if patches remain additive. High if homepage rewrite clears JSON columns.
- **Rollback:** Git revert; PostgreSQL rows remain.
- **Verification:** Save project/service/material/blog/hero with cuid media IDs; confirm join tables; confirm `ru` round-trip; confirm empty Hero without `clear` still 400.

### Phase 5B — Catalog content load into PostgreSQL

- **Objective:** Copy the intended production catalog (projects, materials, testimonials, blog, FAQ) into PostgreSQL so the live site no longer depends on `seed.ts` for those sections. Keep the seven services as they are. **No doors.**
- **Files likely affected:** `apps/web/scripts/seed-postgres.ts` or a one-off import script; possibly Dashboard-only manual entry.
- **Database impact:** Inserts into empty catalog tables; Media rows if images are imported from `/public/images`.
- **API impact:** None required.
- **UI impact:** Website catalog pages populate from Prisma.
- **Migration risk:** Medium — must not duplicate services or add doors; image paths must become `/api/media/{id}` or remain `/public` EXTERNAL URLs.
- **Rollback:** Delete inserted catalog rows (scripted), not `migrate reset`.
- **Verification:** Counts > 0; website loaders return those slugs; contract tests still fail if doors appear.

### Phase 5C — Stop fallbacks from hiding the CMS

- **Objective:** PostgreSQL failure must be visible in logs and, in production, must not silently swap in a second catalog. Hero empty list must not impersonate stock photography unless product explicitly wants a branded fallback.
- **Files likely affected:** `apps/web/lib/content/getContent.ts`, `Hero.tsx`, Dashboard Overview source banner.
- **Database impact:** None.
- **API impact:** None.
- **UI impact:** Possible empty Hero if CMS cleared; possible error page instead of seed.
- **Migration risk:** Medium for UX; low for data.
- **Rollback:** Restore previous catch / FALLBACK_SLIDES.
- **Verification:** Stop Postgres → confirm behavior matches the chosen policy; restore Postgres → seven services + catalog from DB.

### Phase 5D — Cache / environment / leftover Sanity names

- **Objective:** Require `REVALIDATE_SECRET` + `WEBSITE_REVALIDATE_URL` in deployed env; drop `SANITY_REVALIDATE_SECRET` alias after operators migrate; delete dead `'sanity'` union/UI; refresh stale docs.
- **Files likely affected:** `revalidate-website.ts`, `apps/web/app/api/revalidate/route.ts`, `AdminDataContext.tsx`, `OverviewModule.tsx`, `.env.example`, selected audit docs.
- **Database impact:** None.
- **API impact:** Secret name only.
- **UI impact:** Overview source label.
- **Migration risk:** Low.
- **Rollback:** Restore alias.
- **Verification:** CMS save revalidates Website tags; unset secret still fail-closed.

### Phase 5E — Media / R2

- **Objective:** Implement Cloudflare R2 using existing `Media` columns. Upload from Dashboard with RBAC. Store public or signed URL. Teach Website `mediaSrc` / CSP about the R2 host. Keep LOCAL for local dev if needed. Orphan cleanup later.
- **Files likely affected:** `apps/Dashboard/app/api/media/route.ts`, both `localMedia.ts`, `apps/web/lib/content/media.ts`, `next.config` CSP, env examples.
- **Database impact:** `provider=R2`, `objectKey`, `url` updates. Avoid fake R2 URLs.
- **API impact:** Upload implementation change; GET may redirect or remain app-proxied.
- **UI impact:** None intended for layout.
- **Migration risk:** High (existing 18 LOCAL files).
- **Rollback:** Keep LOCAL records; do not delete R2 objects until verified.
- **Verification:** Upload → Website image; delete policy; Vercel durable; no doors/media path traversal.

### Phase 5F — Production verification

- **Objective:** Full matrix: four website locales, RTL/LTR, light/dark, seven services, no doors, auth still Argon2id/session, Hero order, catalog CRUD, revalidation, Vercel env.
- **Files likely affected:** Reports only.
- **Database impact:** None beyond test content if explicitly approved.
- **API / UI impact:** None.
- **Migration risk:** None.
- **Rollback:** N/A.
- **Verification:** Browser + read-only SQL counts + permission matrix. Do not create a second Owner.

---

## 24. Files That Would Need Modification

Implementation is **not** done. Candidate files for later phases:

**Persist / i18n / modules:**  
`apps/Dashboard/components/admin/modules/ProjectsModule.tsx`  
`apps/Dashboard/components/admin/modules/ServicesModule.tsx`  
`apps/Dashboard/components/admin/modules/MaterialsModule.tsx`  
`apps/Dashboard/components/admin/modules/BlogModule.tsx`  
`apps/Dashboard/components/admin/modules/SiteModule.tsx`  
`apps/Dashboard/components/admin/modules/HomepageModule.tsx`  
`apps/Dashboard/components/admin/modules/AboutModule.tsx`  
`apps/Dashboard/components/admin/modules/HeroModule.tsx`  
`apps/Dashboard/components/admin/shared.tsx`  
`apps/Dashboard/components/admin/LanguageTabs.tsx`  
`apps/Dashboard/lib/cms-client.ts`  
`apps/Dashboard/lib/types.ts`  
`apps/Dashboard/lib/server/content/schema.ts`  
`apps/Dashboard/lib/server/content/postgres/mutate.ts`  
`apps/Dashboard/lib/server/content/postgres/read.ts`  
`apps/Dashboard/lib/db/locale.ts`  
`apps/Dashboard/app/api/translate/route.ts`

**Website integrity / cache / media URLs:**  
`apps/web/lib/content/getContent.ts`  
`apps/web/components/home/Hero.tsx`  
`apps/web/lib/content/media.ts`  
`apps/web/next.config.ts`  
`apps/web/lib/content/seed.ts` (only if seed policy changes)  
`apps/web/scripts/seed-postgres.ts`

**Sanity leftover cleanup:**  
`apps/Dashboard/lib/AdminDataContext.tsx`  
`apps/Dashboard/components/admin/modules/OverviewModule.tsx`  
`apps/Dashboard/lib/i18n/messages.ts`  
`apps/Dashboard/lib/server/revalidate-website.ts`  
`apps/web/app/api/revalidate/route.ts`  
`.env.example` files

**R2 (later):**  
`apps/Dashboard/app/api/media/route.ts`  
`apps/Dashboard/app/api/media/[id]/route.ts`  
`apps/web/app/api/media/[id]/route.ts`  
`apps/Dashboard/lib/storage/localMedia.ts`  
`apps/web/lib/storage/localMedia.ts`

**Unchanged unless a later phase proves a hole:**  
`prisma/schema.prisma` (currently sufficient)  
Auth files from Phase 4A

---

## 25. Risks

| Risk | Why it matters |
|---|---|
| Treating `seed.ts` as “the website” | Hides empty PostgreSQL catalog and real outages |
| Migrating seed blindly | Could reintroduce doors if fixtures leak; contract tests must stay |
| Fixing image IDs without regression tests | Hero was already burned by empty `assetIds` |
| Enabling R2 without `mediaSrc`/CSP updates | Images would vanish on Website |
| Deleting Sanity strings while `SANITY_REVALIDATE_SECRET` is the only configured secret | Revalidation would fail closed |
| Catalog import without media files | Broken images |
| Service delete in CMS | Can destroy one of the seven official rows |
| Expanding schema without evidence | Phase 1 schema already covers the Website contract |
| Vercel deploy before R2 | Uploads appear to work then disappear |
| Editing Owner / passwords in Phase 5 | Out of scope; auth is verified |

---

## 26. Verification Matrix

| Check | Method | Result |
|---|---|---|
| Prisma schema valid | `pnpm exec prisma validate` | PASS |
| Prisma generate / migrate / seed | Not run (would modify) | N/A |
| Typecheck / lint / build | Not run (avoid `.next` artifacts) | Not claimed |
| Users | Read-only count + role | 1 owner, enabled |
| Roles / permissions | Count | 4 / 7 |
| Sessions | Count only | 4 (not mutated) |
| Seven services | Read-only findMany | PASS — exact seven, all published, 4 locales |
| doors / luxury-doors in DB | Title/slug scan | PASS — none |
| Hero rows | Count | 5 |
| Catalog emptiness | Counts | projects/materials/testimonials/blog/faq = 0 |
| Media provider | groupBy | all LOCAL (18) |
| Website PostgreSQL read | Code path `fromPostgres` | Confirmed |
| Website seed fallback | `getContent.ts` catch | Confirmed |
| Hero empty fallback | `Hero.tsx` FALLBACK_SLIDES | Confirmed |
| Dashboard CMS write | `POST /api/cms` → `applyMutation` | Confirmed |
| Project `image-*` filter | `ProjectsModule.tsx` | Confirmed defect |
| Sanity packages | package.json + lockfile + imports | Absent |
| R2 runtime | repo search + upload route | Enum only |
| Auth unchanged | No auth files edited this phase | Confirmed |
| Git clean before report | `git status` | Clean |
| DB mutation this phase | Only `findMany`/`count`/`groupBy` | Confirmed |

---

## 27. Final Verdict

The Nora Group monorepo is **past the PostgreSQL foundation and past Sanity as a runtime CMS**. Phase 4A auth is in place. The seven official services are in the database. Hero media is in PostgreSQL with a safe empty-list guard. Website and Dashboard both speak Prisma.

Phase 5 is still required because the **content loop is not closed**:

- PostgreSQL is the intended source of truth, but the public site can still render `seed.ts` or `/public` hero slides.
- Dashboard editors still mix real Prisma saves with React-only fields and a broken project-image ID filter.
- Russian exists in the database and on the Website, not in the CMS editors.
- Catalog tables that the Website already knows how to render are empty.
- Media is local-disk, not R2.

**Do not remove Sanity packages** (they are already gone).  
**Do not migrate to R2 yet** (schema is ready; Website URL policy is not).  
**Do not change auth, Owner, or passwords.**  
**Do not add a doors service.**

Recommended next implementation, when approved: **Phase 5A (persist completeness)**, then **5B (catalog into PostgreSQL)**, then **5C (fallback policy)**, then env/Sanity-name cleanup, then R2.

---

## Audit execution confirmation

1. No source code modified.  
2. No Prisma schema modified.  
3. No migration created.  
4. No database data mutated (read-only `count` / `findMany` / `groupBy`).  
5. No user / password / session changed.  
6. No package installed.  
7. No commit created.  
8. No push performed.  
9. The only new file from this audit is `PHASE_5_CONTENT_ARCHITECTURE_AUDIT.md`.  
10. `git status` / `git diff --stat` / `git diff --name-only` at start: clean `main` @ `ed8668b`. After this file is added, that report should be the only untracked path.

`prisma validate`: schema valid. Build/typecheck/lint were skipped to avoid generated artifacts.
