# Nora Group Monorepo — Project Audit

**Audit date:** 2026-09-14  
**Branch:** `main` (`8d2c6a7` — “pnpm install”)  
**Scope:** Read-only inspection of the repository as it exists on disk.  
**This phase:** Audit only. No implementation, no package install, no schema/auth/data changes.

**Verification status:** Static code and Git inspection only. Lint, typecheck, production build, runtime of the apps, and browser checks (languages, RTL/LTR, light/dark) were **not** executed. Claims below are **Existing / Partially implemented / Missing / Broken / Recommended** as observed in source, not as proven in a running environment.

---

## 1. Executive Summary

The repository is a **pnpm workspace monorepo** with **two independent Next.js applications** and **no shared packages**.

| App | Path | Role (actual) |
|-----|------|----------------|
| Website | `apps/web` | Production-oriented multilingual marketing site + embedded Sanity Studio |
| Dashboard | `apps/Dashboard` | Client-only admin **UI mock** (Bolt/shadcn template). Edits live in React state and **do not persist**. No login. No Sanity writes. |

**What exists and is relatively mature:** the public website (Next.js 15 App Router, `next-intl` locales HE/AR/EN/RU with RTL, seed fallback if Sanity fails, GROQ reads, ISR tags, webhook revalidate endpoint, SEO metadata/JSON-LD, security headers).

**What is missing or not real:** a secure backend for the dashboard, authentication, authorization/RBAC, user management, AI translation, a shared API layer, and any live connection from the dashboard to Sanity or to the website.

**Highest-risk product/security facts:**

1. The dashboard is **fully public in code** (no auth). Anyone who can open it can use it; it currently cannot change production content, but it **looks** like a CMS and must not be deployed as a real admin without auth.
2. Real content editing today is **Sanity Studio at `/studio` on the website**, gated by **Sanity project login**, not Nora Group Owner/Admin/Editor/Employee roles.
3. Dashboard **mock data includes a “Luxury Doors” service**, which conflicts with Nora Group business rules. The **website** explicitly omits doors.
4. Root scripts `pnpm --filter web` / `pnpm --filter dashboard` do **not** match the `name` fields in those apps’ `package.json` files (`nora-group` and `nextjs`). Monorepo scripts appear **broken** as written.
5. `@supabase/supabase-js` is listed on the dashboard but **never imported**. Authentication is **missing**, not implemented via Supabase.
6. Sanity is **not** used as a password store (no user/password schemas). That is correct; app auth is simply absent.

**JSON `Unexpected end of JSON input`:** There is **almost no application `fetch()` / `response.json()` / `JSON.parse` usage**. The likely causes are **Sanity HTTP client** responses (empty body) or **Studio** talking to a bad/placeholder project ID — **not** a custom REST handler that parses request bodies. This was **not reproduced** in this audit.

---

## 2. Repository Structure

Discovered layout (do not assume other names; this is what is present):

```
nora-group-monorepo/
  package.json              # workspace scripts (filter names mismatch apps)
  pnpm-workspace.yaml       # packages: apps/*
  pnpm-lock.yaml
  .gitignore                # working tree more complete than last commit (uncommitted)
  desktop.ini               # TRACKED (Windows shell file)
  apps/web/                 # website + Sanity
  apps/Dashboard/           # dashboard (capital D)
```

**Not present:**

- `packages/` or any shared library
- `apps/api` or a dedicated backend
- `vercel.json` / root `engines` / `.nvmrc`
- `PROJECT_AUDIT.md` / `IMPLEMENTATION_LOG.md` / `FINAL_PROJECT_REPORT.md` (this file is the first of those)
- ESLint config for the website
- Database (Postgres, Prisma, etc.)

**Package managers (mixed — Existing, risky):**

- Root: **pnpm** (`pnpm-lock.yaml`, `pnpm-workspace.yaml`)
- `apps/web/package-lock.json` **tracked**
- `apps/Dashboard/package-lock.json` **tracked**

Apps still document `npm install` in `apps/web/README.md` (pre-monorepo).

---

## 3. Current Architecture

```
Browser
  ├── officialnoragroup.com (intended)  →  apps/web (Next.js)
  │     ├── Public pages  →  getSiteContent()
  │     │     ├── Sanity CDN (published docs) if project ID set
  │     │     └── seedContent fallback on miss/error
  │     ├── /studio       →  Embedded Sanity Studio (Sanity user login)
  │     └── POST /api/revalidate  →  Next cache tags (shared secret header)
  │
  └── Dashboard app (separate Next.js)
        └── React state initialized from mock-data.ts
              └── no API, no Sanity, no users
```

**Existing:** Website → Sanity Cloud (read) + Studio (write via Sanity accounts).  
**Missing:** Website → Secure Backend → Sanity.  
**Missing:** Dashboard → Secure Backend → Sanity.  
**Missing:** Dashboard → Auth → Users/Roles.

The two apps **do not import each other**. They are not a unified system yet; they were merged into one Git repo (`feat(monorepo): merge website and dashboard`).

---

## 4. Website Audit

**Status:** Existing (marketing site); Sanity live content Partially implemented (depends on env + published docs).

### Framework and version

- **Next.js** `^15.2.4` (App Router)
- **React** `^19.0.0`
- **TypeScript** `^5.5.3`
- **next-intl** `^4.0.2`
- **next-sanity** / **sanity** `^3.78.1` / `^9.9.0`
- **Tailwind CSS** `^3.4.1`
- **framer-motion**, **lucide-react**
- Dev server: `next dev --turbo -p 3001`

Package `name` is `"nora-group"`, not `"web"`.

### Routing

Locale segment `app/[locale]/`:

| Route | Notes |
|-------|--------|
| `/` | Home (Hebrew unprefixed) |
| `/about`, `/services`, `/services/[slug]` | |
| `/projects`, `/projects/[slug]` | |
| `/materials`, `/how-we-work`, `/testimonials` | Visibility flags from CMS |
| `/blog`, `/blog/[slug]` | |
| `/faq`, `/contact` | Contact: phone/WhatsApp/email, **no quote form** (documented) |
| `/privacy`, `/cookies`, `/terms` | Legal from `lib/content/legal.ts` |
| `/studio` | Isolated layout, `noindex` |
| `POST /api/revalidate` | Only API route |

`middleware.ts`: `next-intl` matcher; skips `api`, `studio`, `_next`, `_vercel`, files with extensions.

`localePrefix: 'as-needed'`, `defaultLocale: 'he'`, `localeDetection: false`.

Unknown slugs: `notFound()` after `isSafeSlug`.

### Language routing

**Existing:** `he`, `ar`, `en`, `ru` in `lib/constants.ts`.  
next-intl `messages` are **empty objects**; UI copy lives in **seed + Sanity locale fields**, not `messages/*.json`.

### RTL/LTR

**Existing:** `html` `dir` from `LOCALE_META` (`he`/`ar` RTL, `en`/`ru` LTR). Fonts: Noto Sans Hebrew, Cairo, Inter (incl. Cyrillic). Brand lockup documented as `dir="ltr"` so the name does not reverse.

**Not tested** in a browser in this audit.

### Components

Thin route files + view components under `components/home`, `components/pages`, `components/layout`, `components/seo`, `components/ui`. Chrome via `SiteProvider`.

### Content architecture

**Existing:** `getSiteContent()` (`React.cache`) prefers Sanity, else `lib/content/seed.ts`.  
Legal pages are **code**, not Sanity documents.  
Footer “Made by lazaCore” is **hardcoded** (intentional per docs).

### API usage

**Existing:** only `app/api/revalidate/route.ts`.  
No contact form POST. WhatsApp/tel/mailto helpers sanitize input.

### Sanity integration

See §6. Website **reads** published documents via `sanity/lib/client.ts` (`useCdn: true`, no token).

### Authentication dependencies

**None** on the public site. Studio uses Sanity’s own login in the browser.

### Theme

**Existing:** Light, warm luxury palette (`bg-amber-50`, charcoal, gold).  
**Missing:** Dark mode / theme toggle / `next-themes` on the website. Header uses a **transparent-on-hero vs solid** treatment, not a user theme.

### SEO

**Existing (code):** `generateMetadata`, canonical + hreflang (`lib/seo/metadata.ts`, `urls.ts`), `sitemap.ts`, `robots.ts` (disallow `/studio`, `/api/`), JSON-LD (LocalBusiness, WebSite, Breadcrumb, FAQ, Article) with XSS escaping in `safeJsonLd`. `metadataBase` from `NEXT_PUBLIC_SITE_URL` (fallback `https://officialnoragroup.com`).

**Not verified** against a live crawl.

### Accessibility

**Partially implemented:** some `aria-label` on menu buttons; cookie banner `role="dialog"`; `min-h-11` buttons.  
**Missing / weak (from code):** no skip-to-content link found; menu `aria-label` is English-only (`"Menu"` / `"Close"`); dashboard/search patterns N/A on site.

**Not tested** with a screen reader.

### Performance

**Existing:** `next/image` + AVIF/WebP, Sanity CDN remotePatterns, `optimizePackageImports`, ISR tags + 3600s safety revalidate, `poweredByHeader: false`.  
**Risks:** hero `public/videos/hero.mp4` (large asset likely); CSP `'unsafe-eval'` on **all** production paths (Studio + marketing); many parallel GROQ queries per `getSiteContent()`.

**Not measured.**

### Error handling

**Existing:** Sanity fetch `Promise.allSettled` + seed fallback; `getSiteContent` catch-all; blog body fetch catch.  
**Missing:** no generic `app/error.tsx` observed in the file list; locale `not-found.tsx` exists.

---

## 5. Dashboard Audit

**Status:** Partially implemented UI; **Broken as a real CMS**; auth **Missing**.

### Framework and version

- **Next.js** `15.5.25` (pinned; **newer than website**)
- **React** `18.2.0` (**not** React 19 like the website)
- **TypeScript** `5.2.2`
- **Tailwind** `3.3.3` + `tailwindcss-animate`
- **Radix / shadcn** large UI kit
- **next-themes**, **zod**, **react-hook-form**, **recharts**, **@supabase/supabase-js** (unused)
- **@netlify/plugin-nextjs** + `netlify.toml` (Netlify-oriented, not Vercel)
- Package `name`: `"nextjs"` (template leftover)
- `eslint.ignoreDuringBuilds: true`
- `images: { unoptimized: true }`

### Routing / architecture

**Existing:** single route `app/page.tsx` (`'use client'`). Module switching is **in-memory** `useState`, not URLs. No `app/api/*`.

`AdminDataProvider` holds `useState(mockData)` and CRUD **only in client memory**. Refresh loses edits.

### Authentication / authorization / users

**Missing.** Layout hardcodes visual “Admin” / “Nora Group”. No login page, session, middleware protection, or roles.

### Sanity integration

**Missing.** Dashboard does not import Sanity clients or GROQ.

### API/backend

**Missing.** No server actions, no route handlers.

### Multilingual UI / RTL

**Partial:** content fields `ar` / `he` / `en` only (**no Russian**). Language tabs switch **field preview**, not `document.documentElement.dir` / `lang`. `<html lang="en" className="dark">` is fixed. Sidebar labels EN/AR only.

### Theme

**Existing:** forced **dark** luxury tokens in CSS; `html` class `dark`.  
**Missing:** light mode, `ThemeProvider` (but `sonner.tsx` calls `useTheme()` from `next-themes` — unused toaster path; if mounted without provider, behavior is undefined).

### Error handling

No API layer. No persistence errors. Form validation is local UI only.

### Security weaknesses (dashboard)

See §11. Summary: **no access control**; deploying it publicly is an information/UI exposure and a future privilege problem; mock includes **doors**; unused Supabase dependency invites accidental client-side keys later.

### Brand conflict

`apps/Dashboard/lib/mock-data.ts` service **“Luxury Doors”** (`title` AR/HE/EN, icon `door-open`). `ServicesModule.tsx` includes a Door icon option. This **must not** be published as Nora Group services.

---

## 6. Sanity Audit

**Status:** Existing on the website. Dashboard unrelated.

### Project ID / dataset / API version

From `apps/web/.env.example` and code (project IDs are public identifiers, not write secrets):

| Variable | Example / default |
|----------|-------------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | set in example file (public ID) |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | `2025-01-01` |

Two env helpers:

- `apps/web/lib/sanity/env.ts` — treats missing/`placeholder` as **unconfigured** (good for public site fallback).
- `apps/web/sanity/env.ts` — **`projectId` falls back to the string `'placeholder'`** (used by Studio `createClient`).

### Schemas (`apps/web/sanity/schemaTypes/`)

`localeString`, `localeText`, `siteSettings`, `homePage`, `aboutPage`, `howWeWorkPage`, `contactPage`, `uiLabels`, `service`, `project`, `material`, `testimonial`, `blogPost`, `faqItem`.

**No user, password, session, or role documents.** Sanity is **not** used as an auth database.

### GROQ

In `lib/sanity/fetch.ts`: document-type list queries with `visible != false`, image URLs, `order`/`date`. Blog body uses **parameterized** `$slug` plus `isSafeSlug`.

### Read/write

- **Read (app):** anonymous published perspective, CDN, **no token** in `sanity/lib/client.ts`.
- **Write:** Sanity Studio (`/studio` or `sanity dev --port 3333`) using logged-in Sanity users. **No `SANITY_API_*` write token in source.**

### Server/client boundaries

- Fetch module used from Server Components (`getSiteContent`).
- `sanity.config.ts` is `'use client'` (Studio). Public env vars only.
- Vision tool **stripped in production** (`NODE_ENV === 'production'`).

### Privileged credentials in the browser?

**No write token found in client code.**  
`NEXT_PUBLIC_SANITY_*` **will** appear in the browser bundle (expected for public project/dataset).  
Studio still requires CORS + credentials on the Sanity project (documented in README; **not** encoded in repo).

### Incorrect use for passwords?

**No.** Not present.

---

## 7. Authentication Audit

**Website public pages:** No end-user accounts. **Existing** as a contact/marketing site by design.

**Sanity Studio:** **Existing** (Sanity-hosted login). Not Owner/Admin/Editor/Employee. Anyone invited to the Sanity project can edit CMS content. `/studio` is **reachable without an extra app gate**; unauthenticated users should see Sanity’s login, not Nora RBAC.

**Dashboard:** **Missing.** `@supabase/supabase-js` is an **unused dependency**. No session cookies, JWT handling, password hashing, or auth provider wiring.

**Do not implement a provider in this phase.** Whatever is chosen later must be **separate from Sanity** and must **never store passwords in Sanity**.

---

## 8. Authorization / RBAC Audit

**Status:** Missing (application).  
**Partial (external):** Sanity project members/roles inside Sanity (not inspected in the Sanity managed UI; not in this repo).

No Owner / Admin / Editor / Employee checks in code. Dashboard UI implies a single “Admin”.

---

## 9. API / Backend Audit

| Endpoint | App | Status |
|----------|-----|--------|
| `POST /api/revalidate` | web | **Existing** |
| `GET /api/revalidate` | web | 405 JSON |
| Dashboard APIs | — | **Missing** |
| Contact/lead API | — | **Missing** (intentional: no quote form) |
| Translation API | — | **Missing** |

Revalidate: Node runtime; `x-revalidate-secret` compared with `crypto.timingSafeEqual`; fail-closed if secret empty; in-memory rate limit 10/min/IP; `revalidateTag` for content tags.

**Limitations:** rate-limit `Map` is **per instance** (weak on serverless). Trusts `x-forwarded-for` (spoofable if the platform does not overwrite it). Does **not** parse JSON bodies (good).

---

## 10. JSON / API Error Audit

### What the code actually does

- **No** `JSON.parse(` in application TS/TSX (except the idea of `JSON.stringify` for JSON-LD).
- **No** `response.json()` on outbound `fetch()`.
- Sanity uses `client.fetch(groq, params, nextCacheOpts)` (next-sanity), which **internally** parses HTTP JSON.

Revalidate **returns** `NextResponse.json(...)` and does not read `request.json()`.

JSON-LD: `JSON.stringify` then escape `<`, `>`, U+2028/U+2029 — appropriate.

### “Unexpected end of JSON input” — likely root causes (not reproduced)

This audit **did not run** the apps, so the error was **not observed here**. From code, the most plausible sources are:

1. **Sanity HTTP JSON parse** when the API returns an **empty body** (wrong project ID, network failure, private dataset without token, or Studio using `projectId: 'placeholder'`).
2. **Embedded Studio** (`NextStudio`) calling `*.api.sanity.io` / `*.apicdn.sanity.io` with a missing/invalid project.
3. Less likely: tooling/lockfile issues from **mixed npm/pnpm** lockfiles (install-time), not request handlers.

**Not likely:** `/api/revalidate` empty-body `request.json()` (it does not parse the body).

**Recommended (later, not this phase):** never default Studio `projectId` to `'placeholder'`; treat empty Sanity HTTP bodies as structured errors; keep site seed fallback (already present).

---

## 11. Security Audit

Issues found in **source review**. No penetration test was run.

| ID | Severity | Path | Location | Why | Recommended (do not implement now) |
|----|----------|------|----------|-----|-----------------------------------|
| S1 | **Critical** (if dashboard is deployed as “admin”) | `apps/Dashboard/app/page.tsx`, `layout.tsx` | Entire app client-rendered, no middleware auth | No authentication; UI presents as Admin | Do not expose publicly until server-side auth exists; add real auth later |
| S2 | **High** | `apps/Dashboard` vs website | Dual “CMS” | Editors may think dashboard writes the site; it does not; doors mock could be copied into CMS | Decide one write path (Sanity); strip doors from mock |
| S3 | **High** | `apps/web/app/studio/**` | Public `/studio` | CMS UI on marketing origin; security = Sanity invites + CORS | Keep Studio off public nav (robots already disallow); consider extra gate later; review Sanity members |
| S4 | **Medium** | `apps/web/next.config.ts` | CSP `script-src 'unsafe-inline' 'unsafe-eval'` on `/:path*` | Weakens XSS defenses for the whole site to accommodate Studio | Split CSP: strict for marketing, looser only for `/studio` |
| S5 | **Medium** | `apps/web/app/api/revalidate/route.ts` | In-memory rate limit; `x-forwarded-for` | Bypassable on multi-instance; IP spoofing if mis-proxied | Platform rate limits / WAF; use platform client IP |
| S6 | **Medium** | `apps/web/sanity/env.ts` | `projectId \|\| 'placeholder'` | Studio/client may call invalid host → JSON parse errors; noisy failures | Fail closed in Studio if unset |
| S7 | **Low** | `apps/web/.env.example` | Public project ID committed | Normal for Sanity; confirm dataset remains **public read / authenticated write** | Document CORS; never add write tokens to `NEXT_PUBLIC_*` |
| S8 | **Low** | `apps/Dashboard/package.json` | Unused `@supabase/supabase-js` | Accidental client `anon`/`service_role` later | Remove until a chosen auth design uses it **server-side** |
| S9 | **Info / Low** | `apps/Dashboard/next.config.js` | `eslint.ignoreDuringBuilds: true` | Broken code can ship | Enable lint on builds when dashboard becomes real |
| S10 | **Low** | Dashboard `sonner.tsx` | `useTheme` without `ThemeProvider` | Runtime pitfalls if Toaster mounted | Wire theme properly or drop unused UI |

**Checked, not found in this codebase (or N/A):**

| Topic | Result |
|-------|--------|
| XSS via JSON-LD | Mitigated (`safeJsonLd`) |
| Image URL injection | Mitigated (`mediaSrc` allows `/` and `cdn.sanity.io` only) |
| Open redirects | Nav hrefs are **hardcoded paths**, not CMS URLs |
| Path traversal in slugs | `isSafeSlug` |
| SQL injection | No SQL database |
| GROQ injection | Blog slug parameterized |
| CSRF on session cookies | No app session cookies |
| File uploads | Via Sanity Studio only (Sanity pipeline) |
| JWT | None |
| Passwords in Sanity | None |
| Client write tokens | None found |
| CORS headers on Next API | Default same-origin; webhook is secret-header based |

**Not tested:** live CORS, webhook from Sanity, brute-force against Studio login (Sanity-side).

---

## 12. Environment Variables Audit

### Website (`apps/web/.env.example`)

| Name | Purpose | Secret? |
|------|---------|---------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Public project id | No (public) |
| `NEXT_PUBLIC_SANITY_DATASET` | Dataset name | No |
| `NEXT_PUBLIC_SANITY_API_VERSION` | API version date | No |
| `SANITY_REVALIDATE_SECRET` | Webhook auth | **Yes** — server only |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL | No |

**Dashboard:** no `.env.example`. No env usage found in dashboard source.

**Git:** root `.gitignore` (working tree) ignores `.env`, `.env.*`, `*.local`, with exceptions for `.env.example` / `.env.template`. Last **committed** `.gitignore` was weaker (see §13).

A local `apps/web/.env.local` is present in the developer workspace listing. **Values were not read or copied into this audit.** It is gitignored by current patterns.

---

## 13. Git / `.gitignore` Audit

**Remote:** `origin/main` at `8d2c6a7`.

**Tracked and OK:** source, public images, `apps/web/.env.example`, lockfiles.

**Tracked and undesirable:** `desktop.ini` (Windows folder metadata).

**Not tracked (good):** `.next`, `node_modules`, `.env.local` (not in `git ls-files`).

**Uncommitted at audit time:**

- Modified `.gitignore` (expanded ignores: `.vercel/`, `.env.*`, logs, IDE)
- Untracked `.cursor/` (project rules)

**Committed `.gitignore` gaps (until the working-tree version is committed):** no `.vercel/`, no generic `.env.*` (only `.env` and `.env*.local`).

**No force-push / history rewrite** was done.

---

## 14. Dependency Audit

**Not upgraded. Versions taken from `package.json` only (no npm outdated).**

### Root

- `concurrently` `^9.2.1`
- Scripts assume pnpm filters `web` and `dashboard` — **names do not match** (`nora-group`, `nextjs`) → **Broken scripts**

### Website — notable

Needed: next, react 19, next-intl, sanity stack, tailwind.  
**Missing:** `eslint`, `eslint-config-next` (README: lint not configured).  
Lockfile: extra `package-lock.json` alongside root pnpm.

### Dashboard — notable

- Large shadcn/Radix surface vs **one page** of modules — many **likely unused** components
- `@supabase/supabase-js` **unused**
- `@netlify/plugin-nextjs` in `dependencies` — deploy plugin, odd as a runtime dep
- `eslint` / `typescript` / `@types/*` in `dependencies` not `devDependencies`
- React 18 vs website React 19 — **incompatible if code is later shared without a shared package strategy**
- Next 15.5.25 vs website ^15.2.4 — split toolchain
- `framer-motion` `^13.2.0` on dashboard vs `^11.18.2` on web — verify on install (not verified here)

**Suspicious:** unused Supabase; package name `nextjs`; Bolt README badge. Not malware from names alone; **template leftover**.

---

## 15. Performance Audit

**Website (code-level, not profiled):** image optimization, cache tags, seed fallback, Turbopack in dev. Risks: hero video, many GROQ queries, Studio on same deployment, CSP/eval.

**Dashboard:** `images.unoptimized`; full Radix set; client-only page; **not production-critical** until it is a real app.

---

## 16. SEO Audit

**Website:** solid implementation in code (titles, hreflang, sitemap, robots, JSON-LD). Live indexing **not verified**. Studio `noindex` in layout + robots disallow.

**Dashboard:** metadata title “Luxury Carpentry Admin” — should **never** be indexed if deployed; no `robots` file found in dashboard.

---

## 17. Accessibility Audit

**Website:** partial (contrast not measured; skip link missing; some English-only aria). Legal/cookie copy exists. **Not tested.**

**Dashboard:** `html lang="en"` always; RTL not applied to document; search input non-functional; decorative admin chrome. **Not tested.**

---

## 18. Multilingual / RTL Audit

| Surface | Languages | RTL | Status |
|---------|-----------|-----|--------|
| Website | he, ar, en, ru | html dir | **Existing** (not browser-tested) |
| Sanity Studio UI | Arabic titles in schema/structure | Studio layout `lang="ar" dir="rtl"` | **Existing** |
| Dashboard UI chrome | EN (+ some AR labels) | **Missing** on `<html>` | Partial field i18n |
| Dashboard content fields | ar, he, en (**no ru**) | Per-input only | Partial |

AI translation: **Missing** (no server translation pipeline).

---

## 19. Theme / Dark Mode Audit

| App | Light | Dark | Flash |
|-----|-------|------|--------|
| Website | Default warm light | **Missing** as a mode | N/A (single theme) |
| Dashboard | **Missing** | Forced `class="dark"` | N/A (always dark) |

Project rules ask for both modes professionally. **Gap vs target.** Website identity is currently a **light** luxury site; dashboard is a **dark** admin mock. Unifying later is a product decision.

---

## 20. Vercel / Deployment Audit

**Not deployed in this phase.**

### Website

- **Vercel-ready as a standard Next.js app** (no `vercel.json` required).
- README expects import of **this GitHub repo**, env from `.env.example` + real `SANITY_REVALIDATE_SECRET`, domain `officialnoragroup.com`, Sanity CORS + webhook.
- **Monorepo complication:** Root Directory should be `apps/web` (or a correct filter). Root `pnpm build:web` is **mis-filtered**.
- Node: README says **20+**; no `engines` field.
- Output: Next default (not `out/` static export).

### Dashboard

- `netlify.toml` + Netlify Next plugin → **not Vercel-first**.
- Could run on Vercel as a second project with Root Directory `apps/Dashboard`, but **must not** be public without auth.
- `ignoreDuringBuilds: true` hides lint failures.

### Possible deploy problems

1. Wrong pnpm filter / wrong package names  
2. Two apps, one repo, no `vercel.json` project mapping  
3. Empty `SANITY_REVALIDATE_SECRET` → webhooks always 401 (fail closed — safe but ISR stale)  
4. Sanity CORS missing for production origin  
5. Dashboard Netlify config if someone deploys the whole repo as one Netlify site  
6. Mixed lockfiles confusing install on CI  

---

## 21. Critical Issues

1. **No application authentication or RBAC** for a dashboard that presents as admin.  
2. **Dashboard is not connected to Sanity or any backend** — not a real CMS.  
3. **Root workspace scripts likely cannot build/dev apps** (`--filter web` / `--filter dashboard` vs package names).  
4. **Doors service in dashboard mock data** vs explicit Nora Group rule and website `SERVICE_SLUGS`.

---

## 22. High Priority Issues

1. Dual CMS story (Studio vs dashboard) will confuse operators and future agents.  
2. `/studio` on the marketing origin; CSP weakened globally.  
3. React 19 / Next 15.2 vs React 18 / Next 15.5 split — sharing code later is unsafe without a plan.  
4. Website `npm run lint` **not configured**.  
5. Mixed pnpm + nested `package-lock.json`.  
6. JSON parse failures likely from Sanity client/Studio placeholder project (see §10).

---

## 23. Medium Priority Issues

1. In-memory webhook rate limit.  
2. Dashboard languages omit Russian; no document-level RTL.  
3. Website dark mode missing vs project UI rules.  
4. No `engines` / Node pin.  
5. Tracked `desktop.ini`.  
6. Unused dashboard dependencies (Supabase, much of shadcn).  
7. No `app/error.tsx` on website (from file inventory).  
8. Committed `.gitignore` weaker than working tree.

---

## 24. Low Priority Issues

1. Dashboard package name `"nextjs"` and Bolt README.  
2. `sonner` / `next-themes` unused or miswired.  
3. English-only header menu aria-labels.  
4. No skip link.  
5. Dashboard search/bell controls are non-functional.  
6. `.cursor/` untracked (optional to commit).

---

## 25. Recommended Target Architecture

```
Website (apps/web)
    ↓  server-only reads + webhook ISR
Secure Backend / Route Handlers (same Next app or later apps/api)
    ↓  public dataset read; no write tokens in browser
Sanity Cloud (content source of truth)

Dashboard (apps/Dashboard or folded later)
    ↓  HTTPS, session cookies, CSRF
Secure Backend (server-only Sanity write token OR Sanity client with user-backed token)
    ↓
Sanity Cloud

Dashboard
    ↓
Authentication + Authorization (NOT Sanity)
    ↓
Users / Roles / Permissions store (auth provider or own DB)
```

Keep **Sanity Studio** as an optional power-user editor **or** retire it from the public domain once the dashboard can write safely — **product decision** (see §31).

---

## 26. Recommended Authentication Architecture

**Do not pick a vendor in this phase.**

Requirements that follow from current code + project rules:

- Separate from Sanity; **no passwords in Sanity**.
- Sessions: httpOnly, Secure, SameSite cookies (or equivalent IdP sessions).
- Authorization **only** on the server.
- Dashboard routes/APIs default-deny.
- Website stays public except `/studio` (extra gate optional).
- Unused Supabase dependency is **not** an existing implementation.

---

## 27. Recommended RBAC Architecture

Document and enforce server-side:

| Role | Intended (recommended) |
|------|-------------------------|
| Owner | Users, roles, publish, settings, production secrets access policy |
| Admin | Full content + publish |
| Editor | Content draft/edit; publish only if allowed |
| Employee | Limited modules (e.g. leads later); no schema/settings |

UI hiding is **not** security. Map Sanity dataset permissions **separately** (Studio users ≠ app roles unless explicitly synced).

---

## 28. Recommended Website / Dashboard / Sanity Relationship

- **Sanity** = source of truth for **website content**.  
- **Website** = public renderer (seed fallback for resilience).  
- **Dashboard** = authenticated operator UI that **reads/writes Sanity via a server**.  
- **Do not** keep two writable content models (mock dashboard vs Sanity) in production.  
- **Do not** add doors as a service on either surface.

---

## 29. Migration Risks

- Treating dashboard mock as live content (data loss / wrong services including doors).  
- Inviting staff only to Studio vs only to dashboard (split brain).  
- Adding `SANITY_API_WRITE_TOKEN` to `NEXT_PUBLIC_*` or Client Components.  
- Unifying React 18/19 without a shared package boundary.  
- Deploying the monorepo as a **single** Vercel project without `apps/web` root.  
- Enabling dashboard persistence before auth.  
- Overwriting approved Sanity content with seed or mock.  
- Changing package names/scripts without updating CI.

---

## 30. Implementation Plan

**Not started.** Suggested phases for approval (do not skip):

| Phase | Intent |
|-------|--------|
| **0 — this audit** | Done. Wait for approval. |
| **1 — Monorepo hygiene** | Fix package `name`s/filters, gitignore commit, ignore `desktop.ini`, document two Vercel projects, align lockfiles. No architecture change. |
| **2 — Content source of truth** | Confirm Studio as the only writer; freeze dashboard as mock or disable deploy. Remove doors from mock. |
| **3 — Auth design approval** | Choose provider/DB; still no passwords in Sanity. |
| **4 — Dashboard security** | AuthN/Z, RBAC, server APIs. |
| **5 — Dashboard → Sanity** | Server-side writes, preview, webhooks already on website. |
| **6 — Website hardening** | Split CSP, ESLint, error boundaries, optional dark mode. |
| **7 — i18n alignment** | Dashboard AR/HE/EN (+ RU if clean), RTL on `html`. |
| **8 — AI translation** | Server-only, human review, no overwrite of approved copy. |

---

## 31. Questions / Requiring Approval

1. Is the **dashboard** meant to replace Sanity Studio, sit beside it, or remain a prototype that should not be deployed?  
2. May package names be changed to `web` and `dashboard` so root pnpm scripts work?  
3. Which **authentication** approach is acceptable later (IdP vs self-hosted)? Do **not** implement until chosen.  
4. Should `/studio` stay on the public website origin?  
5. Website is **light-only** today. Require dark mode on the marketing site, dashboard, or both?  
6. Deploy: two Vercel projects from this monorepo, or another host for the dashboard (Netlify files exist)?  
7. Commit the improved `.gitignore` and optionally `.cursor/rules`?  
8. Remove unused dashboard dependencies (Supabase, unused Radix) in a later hygiene phase?  
9. Confirm Sanity dataset remains publicly readable for the current no-token client.  
10. Who owns Sanity project invites (write access) today?

---

## Appendix A — Files that define the system

- Website entry: `apps/web/app/[locale]/layout.tsx`, `middleware.ts`, `lib/content/getContent.ts`, `lib/sanity/fetch.ts`  
- Webhook: `apps/web/app/api/revalidate/route.ts`  
- Studio: `apps/web/sanity.config.ts`, `apps/web/app/studio/`  
- Dashboard: `apps/Dashboard/app/page.tsx`, `lib/AdminDataContext.tsx`, `lib/mock-data.ts`  
- Prior website docs: `apps/web/README.md`, `apps/web/docs/CODE-REVIEW.md`

## Appendix B — What this audit did not do

- Run `pnpm` / `npm` install, lint, typecheck, or `next build`  
- Start dev servers or click through the site/dashboard  
- Read secret values from `.env.local`  
- Call Sanity APIs or inspect the live dataset  
- Test RTL, all languages, or accessibility tools  

**End of audit. Stop here pending approval. No Phase 2 in this run.**
