# Phase 2 Plan — Architecture preparation and Sanity integration

**Date:** 2026-09-14  
**Status:** Plan only. **Not implemented.**  
**Constraint:** Reuse the existing Sanity Cloud project. Do not create a new project. Do not store users/passwords in Sanity.

This document is based on a **read-only** inspection of the repository after Phase 1. Application source, schemas, env files, and dependencies were **not** modified while producing this plan.

---

## 1. Current architecture

The monorepo (`pnpm`, `apps/*`) has two **independent** Next.js apps and **no shared packages**.

```
apps/web (@nora/web)
  Public site + embedded Sanity Studio
  Server reads published Sanity (CDN, no token) → merge onto seed
  POST /api/revalidate (webhook secret)

apps/Dashboard (@nora/dashboard)
  Single client page, in-memory CRUD from mock-data.ts
  No Sanity client, no API routes, no auth middleware
```

**Website (existing)**

| Piece | Location | Role |
|-------|----------|------|
| Locale routing | `middleware.ts`, `i18n/routing.ts` | `he` default unprefixed; `ar`/`en`/`ru` prefixed; skips `api` and `studio` |
| Content entry | `lib/content/getContent.ts` | `getSiteContent()` — Sanity if configured, else seed |
| GROQ + merge | `lib/sanity/fetch.ts` | Server-only `client.fetch`; `Promise.allSettled`; deep-merge onto `seedContent` |
| Read client | `sanity/lib/client.ts` | `useCdn: true`, `perspective: 'published'`, **no token** |
| Env (site) | `lib/sanity/env.ts` | Missing/`placeholder` project id → unconfigured |
| Env (Studio) | `sanity/env.ts` | `projectId \|\| 'placeholder'` |
| Studio | `app/studio/[[...tool]]`, `sanity.config.ts` | Client-only `NextStudio`; Vision off in production |
| Webhook | `app/api/revalidate/route.ts` | Header `x-revalidate-secret`; fail-closed; tag ISR |
| Pages | `app/[locale]/**` | Thin routes; `loadLocalePage` / `loadSlugPage` |

Pages consume Sanity **indirectly** via `getSiteContent()` (Server Components). Client chrome (`Header`, `Footer`, WhatsApp) receives a **chrome slice** (`toChrome`), not the full CMS blob. Interactive client bits do not call Sanity.

**Dashboard (existing)**

| Piece | Location | Role |
|-------|----------|------|
| Data origin | `lib/mock-data.ts` | Static mock; includes a **Luxury Doors** service (must never be published as Nora Group) |
| CRUD | `lib/AdminDataContext.tsx` | `useState(mockData)`; add/update/delete/reorder in memory only |
| Provider | `app/layout.tsx` | Wraps the tree; no persistence |
| UI | `app/page.tsx` + `components/admin/modules/*` | Module switcher, not URL routes |

All admin modules call `useAdminData()` except chrome-only UI primitives. **Refresh discards edits.**

---

## 2. Target architecture

```
Dashboard UI (Client Components)
    ↓  same-origin fetch / form POST (no write token)
Dashboard Route Handlers (server-only)
    ↓  session + RBAC (future) → validated payload
Sanity Cloud (existing project / production dataset)
    ↓  webhook POST /api/revalidate
Website server read (existing getSiteContent)
    ↓
Public pages + seed fallback
```

**Rules**

- Sanity remains the **content** source of truth for the website.
- Authentication remains **separate** from Sanity (later phase). Passwords never in Sanity.
- `SANITY_API_WRITE_TOKEN` (or equivalent) exists **only** on the Dashboard **server**.
- Website keeps the **read-only, no-token** CDN client (or a server-only read token if the dataset is later made private — not required today).
- Studio may remain as a power-user desk until Dashboard writes cover the same documents; it must not become a second conflicting product without a policy.

**Do not enable live mutations until authentication exists.** After this plan is approved, the first **implementation** slice should be read-only mapping + fail-closed write stubs, not an open write API.

---

## 3. Website data flow

```
Request
  → next-intl middleware
  → Server Component page / layout
  → getSiteContent() [React.cache]
       → isSanityConfigured()?
            no  → seedContent
            yes → fetchSanityContent() (GROQ, tags, 3600s safety revalidate)
                  fail/empty slice → keep seed for that slice
  → toChrome() for Header/Footer
  → view components
```

**Server-side queries:** all GROQ in `lib/sanity/fetch.ts` (lists + singletons + blog body by `$slug`).

**Client-side:** layout chrome, language switch, hero video, filters, cookie notice. **No privileged APIs.**

**Revalidation:** Sanity webhook → `POST /api/revalidate` → `revalidateTag(...)`. Empty secret → 401.

**Studio:** `/studio` on the marketing origin; Sanity-hosted login; CORS configured in Sanity manage (not in repo).

---

## 4. Dashboard data flow (current vs target)

**Current**

```
mock-data.ts → AdminDataProvider state → modules
```

**Target (after auth)**

```
Browser
  → GET  /api/... (session cookie) → server GROQ read (or cached)
  → POST /api/... (session + CSRF) → server patch/create/delete
  → Sanity
  → existing website webhook ISR
```

Until auth exists, Dashboard must **not** ship a working write token path.

---

## 5. Sanity integration strategy

1. **Reuse** the existing project id / `production` dataset / API version already used by the website (`NEXT_PUBLIC_SANITY_*` are public identifiers; write token is new and server-only).
2. **Do not duplicate schemas.** Prefer a **mapping layer** from Dashboard DTOs → existing document types.
3. **Do not migrate mock doors.** Exclude that service from any import.
4. **Singletons** (`siteSettings`, `homePage`, `aboutPage`, `howWeWorkPage`, `contactPage`) use fixed document ids already used by Studio structure (`documentId` = type name).
5. **Lists** (`service`, `project`, `material`, `testimonial`, `blogPost`, `faqItem`) use Sanity `_id`; Dashboard `id` today is a generated string — map `_id` after first read.
6. **Images:** upload via Sanity Assets API **on the server**, or return an upload URL from a server route. Never put the write token in the browser.
7. **Publish vs visible:** Website uses `visible`. Dashboard uses `published`. Map `published ↔ visible`. Do not invent a second draft workflow unless approved (Sanity drafts exist; website currently reads `published` perspective only).
8. **Schema changes** are **out of the first implementation slice** unless a field is required to avoid data loss. Gaps (below) are documented; filling them needs explicit approval because it changes the CMS.

---

## 6. Recommended API / server boundary

### Options

| | Option A — Dashboard Route Handlers / server actions | Option B — future `apps/api` |
|--|------------------------------------------------------|------------------------------|
| Fits repo today | Yes. Dashboard is already a Next app; website already has one Route Handler | No `apps/api` or shared package exists |
| Cookies / session | Same-origin with Dashboard UI | Cross-origin unless a parent domain cookie; extra CORS |
| CSRF | Same-site cookies + Origin check on POST | Harder (separate origin) |
| Vercel | Second project, Root Directory `apps/Dashboard` | Third project |
| Auth later | `middleware.ts` on Dashboard | Must share session secret and cookie domain |
| Sanity token | `SANITY_API_WRITE_TOKEN` only in Dashboard env | Token on API app only — also valid, but extra hop |
| Scale | Enough for CMS traffic | Useful later if mobile apps / many clients appear |

### Recommendation: **Option A**

Use **Route Handlers under `apps/Dashboard/app/api/`** (server-only Sanity client). Prefer Route Handlers over Server Actions for an already fully client-rendered admin (`'use client'` page): explicit JSON, easier CSRF/Origin checks, no accidental import of server modules into the client graph.

Keep **website** `POST /api/revalidate` where it is (ISR belongs to the public app).

**Do not create `apps/api` in the next implementation slice.** Revisit Option B only if a third consumer appears or Dashboard and Website must share mutation code via a later `packages/` library.

---

## 7. Authentication requirements

**Not implemented now.** Future placement:

```
Dashboard UI
  → HttpOnly session cookie (Secure, SameSite=Lax or Strict)
  → apps/Dashboard middleware (protect all /api and pages)
  → Route Handler: load session → RBAC
  → Sanity mutation
```

Users/roles live in the **auth provider or a dedicated user store**, **not** Sanity.

**Do not auto-select a vendor.** Any provider must support:

| Requirement | Why |
|-------------|-----|
| Secure sessions | Dashboard is otherwise a public admin UI |
| HttpOnly cookies | Token not readable by XSS |
| CSRF protection | State-changing POSTs from a browser |
| Password hashing | If passwords are used; never plaintext; never Sanity |
| Password reset | Operational necessity |
| Invitations | Owner/Admin add staff |
| Disable/delete accounts | Offboarding |
| Server-side RBAC | UI is not a security boundary |
| Owner / Admin / Editor / Employee | Project rules |
| Auditability | Who published/changed what (app log and/or Sanity history) |
| Vercel | Serverless-compatible session store (or managed IdP); no long-lived in-memory sessions as the only store |

Unused `@supabase/supabase-js` on the Dashboard is **not** an existing auth implementation.

---

## 8. RBAC requirements

**Not implemented now.** Intended model (enforce **only** on the server):

| Role | Users | Roles | Settings | Content edit | Publish (`visible`) | Schema / Studio tokens | How-we-work / UI labels |
|------|-------|-------|----------|--------------|---------------------|------------------------|-------------------------|
| Owner | yes | yes | yes | yes | yes | yes (ops) | yes |
| Admin | no | no | limited (contact/SEO, not env) | yes | yes | no | yes |
| Editor | no | no | no | yes | **policy TBD** (recommend no by default) | no | no |
| Employee | no | no | no | limited modules (e.g. testimonials) | no | no | no |

**Must be server-side protected**

- Every Sanity create/patch/delete/publish
- Asset upload
- Revalidate trigger (if Dashboard ever calls the website webhook)
- User invite / role change
- Reads of draft/unpublished content (if added)

Hiding Sidebar items is **not** authorization.

---

## 9. Dashboard → Sanity mapping

Locales in Sanity `localeString` / `localeText`: **`he`, `ar`, `en`, `ru`**. Dashboard `LocalizedText`: **`ar`, `he`, `en` only**.

| Sanity type | Kind | Localized | Website | Dashboard module | Safe to manage without schema change? | Notes |
|-------------|------|-----------|---------|------------------|----------------------------------------|-------|
| `siteSettings` | singleton | tagline, pillars, address, hours, WhatsApp msg, SEO | Yes | Site (partial) | **Partial** | Maps: brandName, tagline, email, phones, address, logos. **Missing in Sanity:** `navItems`, `footerLinks`, `socialLinks` (website nav is **hardcoded** + `uiLabels`). Dashboard `contactPhone` vs `phoneDisplay`/`phoneTel`/`whatsappE164` must be split carefully. |
| `homePage` | singleton | almost all copy | Yes | Hero (mismatch) | **Partial** | Website: one hero title + `heroImages[]`. Dashboard: **slides** (`HeroSlide` with per-slide CTA). Not 1:1. Map first slide → `heroTitle`/`heroSubtitle`/`heroImages` **or** request schema change (approval). Home intro/why/CTA exist in Sanity, **no** Dashboard module. |
| `aboutPage` | singleton | hero + body + values | Yes | About | **Partial** | Dashboard: `story`/`vision`/`mission`/`featureBanners`. Sanity: `body` + `values[]`. Map story→body, banners→values; vision/mission have **no field**. |
| `howWeWorkPage` | singleton | hero + steps | Yes | **None** | N/A until module | No Dashboard UI. |
| `contactPage` | singleton | page hero only | Yes | **None** (contact numbers live in Site) | N/A | Hero copy vs Site contact fields. |
| `uiLabels` | one doc **per locale** | labels as strings, not locale objects | Yes | **None** | Later | Document-per-locale, not field-level. |
| `service` | list | title, description, features, imageAlt | Yes | Services | **Partial** | Dashboard `steps[]` and `icon` **not** in schema. Website uses `features[]` and **slug** (`SERVICE_SLUGS`). Slug is required and becomes **read-only once set**. **Do not import doors.** |
| `project` | list | title, description, gallery alt | Yes | Projects | **Partial** | Map gallery ↔ images; `visible` ↔ `published`. **No** `featured`, `completedDate`. Category must be website enum (`kitchens`/`bedrooms`/`wardrobes`/`furniture`/`commercial`). |
| `material` | list | name, description, characteristics, applications, finishes | Yes | Materials | **Partial** | Dashboard `name: string` vs Sanity `localeString`. Dashboard `specifications` object **has no Sanity equivalent** (hardness, Janka, etc.). |
| `testimonial` | list | review, project type | Yes | TestimonialsFaq | **Partial** | `name`/`rating`/`review`/`visible` map. **No** `clientTitle`, `avatarUrl`. |
| `blogPost` | list | title, excerpt, content | Yes | Blog | **High** (content yes) | slug, author, date, image, visible map. **No** `tags`. List fetch omits body; detail uses extra GROQ. |
| `faqItem` | list | question, answer | Yes | TestimonialsFaq | **High** | Add Sanity `category` + `order` in Dashboard later. Dashboard FAQ has no category today. |

**Dashboard data with no Sanity equivalent (do not invent silently)**

- Editable nav / footer / social link lists  
- Hero **slider** as multiple CTA slides  
- About vision, mission (as distinct fields)  
- Service **process steps** and icon names  
- Material **spec sheet** (`MaterialSpec`)  
- Testimonial avatar + job title  
- Blog tags  
- Project featured flag + completed date  
- Russian strings on Dashboard types  
- Doors service (forbidden as a Nora Group service)

**Website-consumed, Dashboard-absent:** `howWeWorkPage`, `contactPage` hero, `uiLabels`, most of `homePage` except a mismatched hero, legal pages (code, not CMS).

---

## 10. Localization strategy

**Website (existing, keep):** `he` default; `ar`/`en`/`ru`; `html[dir]` from `LOCALE_META`; `t()` fallback Hebrew → any non-empty; next-intl messages empty (copy lives in seed/CMS).

**Sanity:** field-level `{ ar, he, en, ru }` except `uiLabels` (one document per locale).

**Dashboard today:** `LangCode = ar \| he \| en`; language tabs switch **field** locale; `LocalizedInput` sets `dir` on the input only; `<html lang="en">` is **not** switched. No Russian.

**Plan (do not implement yet)**

- Mapping layer should accept `ru` as optional (`''` until editors fill it).
- Do not drop website `ru` when patching from Dashboard (merge, don’t overwrite empty `ru` with missing keys).
- Document `dir` on `<html>` is a later UI change (out of schema work).
- RTL on the full chrome is **not** required to start server mapping.

---

## 11. Security requirements (for the future integration)

| Risk | Requirement |
|------|-------------|
| Client write token | Never `NEXT_PUBLIC_` write token; never import mutation client in Client Components |
| Unauthorized mutations | Auth + RBAC on every POST/PATCH/DELETE **before** any token is added |
| IDOR | Mutations keyed by Sanity `_id` after server verifies type + permission; no client-supplied `_type` blindly |
| GROQ injection | Bound parameters only (`$id`, `$slug`); reuse `isSafeSlug` |
| CSRF | Same-origin + Origin/Host check; SameSite cookie |
| XSS | Do not `dangerouslySetInnerHTML` CMS HTML; website JSON-LD already escapes |
| Open redirects | No CMS-driven `ctaLink` without allowlist (Dashboard hero `ctaLink` is a future risk) |
| Uploads | Server-side Sanity assets; type/size checks |
| CORS | Dashboard API same-origin; do not `Access-Control-Allow-Origin: *` with credentials |
| Error leakage | Generic 4xx/5xx to client; log ids server-side; never log tokens |
| Privilege escalation | Role from session, not from request body |
| Website | Keep read-only client; do not add write token there |

**Doors / mock:** treating mock as a bulk import would publish invalid services. Import allowlists only.

---

## 12. Vercel architecture

| App | Suggested Vercel project | Env (names only) |
|-----|--------------------------|------------------|
| Website | Root Directory `apps/web` | Existing public Sanity + `SANITY_REVALIDATE_SECRET` + `NEXT_PUBLIC_SITE_URL` |
| Dashboard | Root Directory `apps/Dashboard` | Public project/dataset/apiVersion **plus** server `SANITY_API_WRITE_TOKEN` **only after auth** |

- ISR stays on the **website**. Dashboard mutations rely on the existing Sanity **webhook** to hit website `/api/revalidate`.
- Serverless: Sanity client in Route Handlers is compatible; do not use in-memory rate maps as the only control for auth (website webhook already has this limitation).
- Cookies: set cookie `Domain` only if both apps share a parent host; **default is two hosts** → session stays on Dashboard origin (supports Option A).
- Dashboard `netlify.toml` is leftover; Vercel does not need it. **Do not change deploy files in this planning step.**
- Do not deploy Dashboard publicly until auth exists.

---

## 13. JSON error investigation (`Unexpected end of JSON input`)

**Still present in source (not fixed in Phase 1):**

```6:7:apps/web/sanity/env.ts
export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'placeholder';
```

Studio/`sanity/lib/client.ts` use this helper. `lib/sanity/env.ts` (website reads) treats `placeholder` as **unconfigured** and skips GROQ.

**Evidence:** If Studio or the Studio client runs with a missing project id, requests go to an invalid Sanity host. An empty HTTP body then surfaces as JSON parse errors **inside** `next-sanity` / the browser client — not in app `JSON.parse` / `response.json()` (those still do not exist in app TS).

**Runtime of the original error:** **Not confirmed statically.** This audit did not run Studio or issue HTTP calls. The placeholder default is a **plausible** failure mode, not a proven incident root cause.

---

## 14. Required dependencies (implementation later — **do not install now**)

Likely needed on **`@nora/dashboard` only** when implementation is approved:

- `@sanity/client` (or `next-sanity`) **server-only** for mutations and authenticated reads
- CSRF helper (custom Origin check may be enough; do not add a library unless needed)
- Auth library — **not** in the Sanity-mapping slice; chosen in the auth phase

**Do not add** Sanity packages to the website for writes.  
**Do not add** a write token to `@nora/web`.  
Website already has `next-sanity`.  
Avoid installing `@sanity/client` in Client Component bundles (`server-only` import barrier).

No new packages are required to **keep** the current mock Dashboard.

---

## 15. Files expected to change in implementation (after approval)

**Dashboard (primary)**

- New: `app/api/**/route.ts` (reads; later writes)
- New: `lib/sanity/serverClient.ts` (server-only)
- New: mapping helpers DTO ↔ Sanity documents
- `lib/AdminDataContext.tsx` — load from API instead of (or in addition to) mock
- `lib/types.ts` — optional `ru`; align `published`/`visible`; Sanity `_id`
- `.env.example` (names only) for Dashboard

**Website (minimal, only if required)**

- Optional: fail closed if Studio `projectId` is placeholder (JSON-error hardening) — **separate small fix, needs approval**
- Unchanged ISR route unless webhook contract changes

**Root**

- `IMPLEMENTATION_LOG.md` after real work  
- Env docs (names/purpose only)

**Schemas:** change **only** with explicit approval if mapping cannot land without new fields.

---

## 16. Files that must NOT change (first implementation slice)

- `apps/web` page views, visual identity, locale routing, seed marketing copy (except bugs explicitly approved)
- `apps/web/sanity/schemaTypes/**` unless a named, approved schema delta
- Creating a new Sanity project
- `apps/web/.env.local` / real secrets
- Auth provider wiring, user tables, RBAC enforcement code (next phase)
- Dashboard visual redesign / shadcn sweep
- Legal pages (`lib/content/legal.ts`) unless required
- `packages/` or `apps/api/` (not in the first slice)
- Business rule: **no doors** as a service

---

## 17. Risks

- Dual writers (Studio + Dashboard) overwriting documents  
- Mapping Dashboard slides/nav into the wrong Sanity fields  
- Empty `ru` overwriting approved Russian website copy  
- Shipping write token before auth  
- Slug immutability vs Dashboard creating new slugs  
- React 18 Dashboard vs React 19 website if a shared `packages/sanity-map` is added too early  
- Importing mock **doors**  
- Cross-origin session mistakes if Option B is chosen prematurely  

---

## 18. Rollback strategy

- Feature-flag Dashboard API: default **mock-only** until flag + auth  
- Write token unset → mutations 401 (fail closed), like `SANITY_REVALIDATE_SECRET`  
- Website seed fallback remains if Sanity read fails  
- Git revert of Dashboard API files does not require schema rollback if schemas were untouched  
- If a schema change is approved and deployed, keep it additive (new optional fields), never required-without-default  

---

## 19. Testing strategy (for later implementation)

- Unit: mapper Dashboard DTO ↔ GROQ projection; empty `ru` merge  
- Route Handler: unauthenticated POST → 401; invalid `_id` → 404; GROQ params not string-interpolated  
- Website: after a test patch in a **non-production dataset** (if available) or a throwaway document, confirm `getSiteContent` + webhook  
- **Do not** use production dataset for destructive tests without Owner approval  
- Lint/typecheck/build as in Phase 1; Dashboard `tsc` may still fail on React types (known)  
- Browser: **Not tested** in this planning step  

---

## 20. Ordered implementation steps (after this plan is approved)

Do **not** skip auth for live writes.

1. **Approve this plan** (and whether Studio remains a parallel editor).  
2. **Approve mapping decisions:** hero slides vs `homePage`; skip vs add schema fields for vision/mission, material specs, service steps, nav links. Default recommendation: **adapt Dashboard to existing schemas**; do not expand schemas in the first slice.  
3. **JSON placeholder (optional small fix on website Studio env)** — separate approval.  
4. Add Dashboard **server-only** Sanity **read** client using public project/dataset (no write token).  
5. Replace `AdminDataProvider` initial state with mapped Sanity reads; keep mock as fallback if unconfigured (mirrors website). **Filter out doors.**  
6. Add Route Handlers that **reject all mutations** (401) until auth exists — proves the boundary.  
7. **Auth phase** (provider chosen then): sessions, middleware, CSRF.  
8. **RBAC** on those handlers.  
9. Enable mutations (patch singletons, CRUD lists) with validation, slug rules, image uploads.  
10. Confirm website webhook still revalidates.  
11. Add missing Dashboard modules only if needed (`howWeWork`, `uiLabels`) — UI work, separate approval.  
12. Stop. Do not add AI translation in this track.

---

## Approval questions

1. Keep Sanity Studio on `/studio` as a parallel editor after Dashboard writes exist?  
2. First slice: **map down** to existing schemas, or **extend schemas** (hero slides, nav, material specs, etc.)?  
3. Editor publish permission: yes or no by default?  
4. Is a non-production Sanity dataset available for tests?  
5. Auth provider still deferred — confirm no vendor should be added in the first implementation slice.

**STOP. Do not implement until approved.**
