# Nora Group Monorepo — Project Audit (Phase 0/1)

> **Superseded for current decisions (18 Sep 2026):** see [`CURRENT_STATE_AUDIT.md`](./CURRENT_STATE_AUDIT.md). Sanity is no longer the target CMS. This file remains the 14 Sep source audit (HEAD `de76db4` plus then-uncommitted work).

**Audit date:** 2026-09-14 (evening pass, inspection continued after bootstrap-run rejection)  
**Branch:** `main` at `de76db4` plus a large uncommitted working tree (Dashboard auth/CMS/i18n work from earlier phases today).  
**Phase status:** **AUDIT COMPLETE.** No implementation, no Sanity mutations, no `SANITY_API_WRITE_TOKEN` loaded for a write, no `pnpm cms:bootstrap` without `--dry-run`. Next step is owner approval, then implementation.  
**Method:** Source read-through of both apps and the Sanity schema, three parallel code sweeps (theme, Dashboard modules/APIs, Website routing/SEO/seed), read-only public GROQ queries against the configured Sanity dataset, env variable *names* only (no values read or printed).  
**Runtime state at audit time:** Website dev on `:3001`, Dashboard dev on `:3000`, both freshly restarted after stale-`.next` crashes.

Statuses used below: **Existing / Partial / Missing / Broken**, with evidence (`file:line`) for every "Broken" claim. Nothing in this document was proven by running an end-to-end flow unless explicitly stated.

---

## 0. The five reported failures — root causes (evidence)

### 0.1 Dashboard content does not appear on the Website — **Broken / Critical**

This is not one bug. It is a broken pipeline with several independently fatal steps.

1. **The two apps do not share a populated CMS.** Read-only GROQ against the configured dataset returned **0** documents of every content type (`project`, `service`, `material`, `testimonial`, `faqItem`, `blogPost`, `homePage`, `siteSettings`, `aboutPage`, `howWeWorkPage`, `contactPage`, `uiLabels`). The Website therefore renders `apps/web/lib/content/seed.ts`. The Dashboard, when Sanity is configured, maps empty arrays and shows empty modules (`read.ts` success path, no mock merge).
2. **A Dashboard Save that *does* reach Sanity still cannot appear on the site.** Website GROQ is `*[_type == "project" && visible != false]` (`apps/web/lib/sanity/fetch.ts:64`). New projects are created with `published: false` → `visible: false` (`AdminDataContext.tsx:307`, `mutate.ts:280`).
3. **Create often never reaches Sanity.** `buildCreate` requires a slug **and** a Hebrew title (`mutate.ts:265-267`). The UI slug is derived from `title.en` only (`ProjectsModule.tsx:151`). Empty English title → slug `"project"`. Empty Hebrew → HTTP 400. Default category on add is `'Residential'`, which is not in the Sanity enum (`AdminDataContext.tsx:302` vs `schema.ts:10-16`).
4. **Images never attach.** `/api/media` returns `{ url, assetId }` (`media/route.ts`). `ProjectsModule` stores only `url` and never sends gallery asset ids (`ProjectsModule.tsx:173-177`). The mutation schema has no gallery/image field (`schema.ts:39-51`).
5. **Created `_id` is discarded.** `mutate()` parses JSON then returns `{ ok: true }` with no document id (`mutate.ts:58-68`). `/api/cms` returns `{ ok: true }` (`cms/route.ts:35`). The client keeps `proj-<timestamp>-<rand>`. The next Save is another `create`.
6. **Website cache never invalidates.** `revalidateWebsite()` returns immediately when `SANITY_REVALIDATE_SECRET` or `WEBSITE_REVALIDATE_URL` is unset (`mutate.ts:84-87`). Confirmed by env *names* in `apps/Dashboard/.env.local` (neither name present) and `apps/web/.env.local` (neither name present). Website fetches use `revalidate: 3600` (`fetch.ts:23-25`).
7. **If a visible Sanity project ever did land,** `if (projects?.length) base.projects = mapped` (`fetch.ts:250-263`) would **replace all eight seed projects** with that one document. That is a content-loss risk, not a display path, until the dataset is populated.

**Root causes:** R1 (empty dataset / seed-first Website), R2 (mutation schema ≠ Sanity schema), R3 (fire-and-forget writes), R4 (revalidation env never set).

### 0.2 AI translation does not work — **Broken / High**

1. **Immediate runtime cause:** `TRANSLATION_API_KEY` is not among the env *names* in `apps/Dashboard/.env.local`. `POST /api/translate` returns 503 `"Translation is not configured"` when the key is empty (`translate/route.ts:103-105`).
2. **Design gap:** `PATCH` only flips `status` in `.data/translation-reviews.json` (`translate/route.ts:215-224`). Nothing calls `applyMutation` / `/api/cms`. "Mark reviewed" never writes a locale field to Sanity (`TranslationModule.tsx:69-79`).
3. **JSON crash path:** `TranslationModule.tsx:33` still does `await response.json()` with no try/catch. An empty or non-JSON body throws `SyntaxError: Unexpected end of JSON input` in the browser.
4. **Scope:** request schema allows only `he|ar|en` (`translate/route.ts:46-47`). Website locale `ru` is not a target. Reviews live in a local file, not durable on Vercel.

**Root cause:** R6. Credentials never provisioned; apply-to-CMS step never built. API key stays server-side (correct).

### 0.3 Website dark mode makes text disappear — **Broken / Critical (UX)**

1. Theme is `html.dark` class, applied **after mount** by `ThemeToggle` (`ThemeToggle.tsx:12-18`). Default when no `localStorage` key `nora-theme` is **OS `prefers-color-scheme`**, so OS-dark users get dark immediately after hydration.
2. `globals.css` dark rules exist only for `body` (`html.dark body` → `bg-charcoal-950 text-warm-50`, lines 19-21) and two buttons (84-90).
3. **Zero** `dark:` Tailwind variants exist under `apps/web` (repo-wide grep: no matches).
4. Page sections hardcode light surfaces: `bg-warm-50`, `bg-white` (`HomeView.tsx:68,105,173,280,304,357` and the same pattern in `ServicesView`, `ProjectsView`, `MaterialsView`, `FaqView`, …). `.card-luxury` is `#ffffff` (`globals.css:100-105`).
5. Some headings use inherited color (`HomeView.tsx:285,294` `text-section` / `font-semibold` with no `text-charcoal-*`). On `html.dark body` those become `text-warm-50`. Sitting on a still-white `bg-white` / `bg-warm-50` section they are cream-on-cream or cream-on-white — unreadable. Nearby copy that *does* set `text-charcoal-900` stays charcoal on white (readable but the page looks broken: mixed invisible + dark-on-light).
6. `html.dark .btn-secondary` paints light borders/text (`globals.css:88-90`) on those still-white sections.

**Root cause:** R5. Dark mode is a body-level paint, not a semantic token system. Must not be "fixed" with one global CSS override.

### 0.4 Website hydration errors — **Partial / previously fixed on `/ar`; not fully re-verified**

**Historical root cause (fixed in source, still in `IMPLEMENTATION_LOG.md`):**
- `Reveal` used to change DOM structure between SSR and the first client render (`useState` visibility). Current `Reveal.tsx` always renders the same `<div class="reveal">` and adds `is-visible` in `useEffect` via `classList` (lines 16-48). SSR and first client paint match.
- `Hero` used to call framer-motion `useReducedMotion()` during render (SSR `null` vs client `boolean`). Current `Hero.tsx:36-47` initializes `reduceMotion` to `false` and reads `matchMedia` only in `useEffect`.

**Remaining hydration / flash risks (not suppressHydrationWarning on marketing pages):**
- `ThemeToggle` returns an empty `<span>` until `mounted` (`ThemeToggle.tsx:21`) — structure is consistent (SSR and first client both unmounted). Theme class is still missing until `useEffect` → FOUC, not a React mismatch.
- Locale layout does not include a blocking theme script (`app/[locale]/layout.tsx:98-103`).
- `/ar` was verified 0 issues after the Reveal/Hero fix. `/`, `/en`, `/ru` were **not** re-verified in this audit pass. Cursor browser `data-cursor-ref` snapshots previously produced false hydration overlays.

**Do not** "fix" remaining issues with `suppressHydrationWarning` on marketing content, `dynamic({ ssr: false })` on HomePage, or disabling SSR.

### 0.5 Dashboard UI language switching — **Existing core; incomplete chrome**

This is **Dashboard chrome language**, not Website locale and not Sanity content.

**What works in code:**
- Languages: `ar`, `he`, `en` (`ui-lang.ts:1-4`). Default `ar`. Cookie `nora_ui_lang`.
- Server layout reads the cookie and sets `<html lang dir>` (`layout.tsx:32-41`).
- Client `setLang` updates React state, cookie, `localStorage`, and `document.documentElement.lang/dir` (`UiI18nProvider.tsx:25-31`).
- Switcher on login (`login/page.tsx`) and user menu (`UserMenu.tsx`). Sidebar labels go through `t()` (`Sidebar.tsx:28-42`).
- Separate `LanguageTabs` edits **content** locales he/ar/en and does not change UI language (`LanguageTabs.tsx`). That split is correct.

**What is incomplete:**
- Hardcoded English chrome remains in modules (`ProjectsModule.tsx:104` "Edit Project", `:193` "Category", `:209` "Completion Date", `:227` "Wood Types Used", `:244` "Add wood type...", `:273` "Gallery Images", plus similar strings in Site/Materials/Services/Blog).
- Native `confirm()` / `alert()` in Projects, Services, Materials, Blog, TestimonialsFaq.
- `LanguageTabs` initial content tab is always `'en'` (`LanguageTabs.tsx:28`), independent of UI language.
- `generateMetadata` description is hardcoded English `'Nora Group admin'` (`layout.tsx:20`).
- Changing language does not `router.refresh()`; cookie is set so the **next** full request gets the new `lang`/`dir`. In-page `t()` updates immediately. Server metadata lags until navigation.
- Russian is intentionally absent from Dashboard UI.

**Does not** modify Website locale routing or Sanity documents.

---

## 0.6 `cms:bootstrap` — inspected, not executed (mutating)

See **§25** for the full table. Summary for this stop:

| Question | Answer |
|---|---|
| What is it? | Uncommitted `apps/web` script (`scripts/seed-sanity.ts` + `package.json` script `cms:bootstrap`). Not in root `package.json`. Not in git history as a feature (package.json history is unrelated workspace commits). |
| Read-only or mutating? | **Mutating** unless `--dry-run`. Real path: upload local images to Sanity assets API, then one `createIfNotExists` mutate transaction. |
| Destructive? | **Non-destructive to existing documents** (`createIfNotExists` only; no patch/delete/replace). Asset uploads are hash-deduplicated by Sanity. Still a **write** to the shared dataset. |
| Executed? | `--dry-run` ran once (46 docs / 19 images planned; no network writes). The real run was **rejected** (would load `SANITY_API_WRITE_TOKEN`) and **must not be run** until explicit approval. |
| Necessary now? | **Not for completing the audit.** Necessary later if Sanity must become the shared source of truth. |

Env *names* present locally (values not printed): Website `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`. Dashboard those two plus `SANITY_API_WRITE_TOKEN`, `DASHBOARD_OWNER_EMAIL`, `DASHBOARD_OWNER_PASSWORD`, `AUTH_SECRET`. **Absent:** `TRANSLATION_API_KEY`, `TRANSLATION_API_URL`, `SANITY_REVALIDATE_SECRET`, `WEBSITE_REVALIDATE_URL`.

---

## 1. Architecture overview

```
apps/web        (@nora/web)        Next 15.5 App Router, React 19, next-intl, Tailwind, next-sanity, embedded Studio at /studio
apps/Dashboard  (@nora/dashboard)  Next 15.5 App Router, React 19, Tailwind + shadcn/Radix, next-themes, zod
Sanity          project q7u9ax5m / dataset production  (local .env.local, both apps)
```

Actual data flow today:

```
Website  ──GROQ (published, CDN, tags, revalidate 3600s)──▶ Sanity   ──(empty)──▶ falls back to lib/content/seed.ts
Dashboard ──GROQ (apicdn, revalidate 60s)───────────────────▶ Sanity   (reads all-empty arrays → "sanity" source, empty modules)
Dashboard ──POST /api/cms ── server-side mutate API (write token) ──▶ Sanity (partial fields; created _id discarded)
Dashboard ──POST WEBSITE_REVALIDATE_URL ─────────────────────────▶ Website /api/revalidate  (NOT configured → never called)
```

**Decisive fact (proven by GROQ):** the configured dataset contains **no content documents at all** — only 3 `sanity.imageAsset` records created 2026-09-14 15:58–16:04 UTC (the user's project attempt). Counts for `project`, `service`, `material`, `testimonial`, `faqItem`, `blogPost`, `homePage`, `siteSettings`, `aboutPage`, `howWeWorkPage`, `contactPage`, `uiLabels` are all **0**. Every piece of content the Website shows comes from `apps/web/lib/content/seed.ts` (8 projects, 7 services, 8 materials, 3 testimonials, 3 blog posts, 8 FAQ, homepage, about, how-we-work, contact, settings, nav/ui labels; all four locales he/ar/en/ru; 17 local images under `public/images`).

The committed `apps/web/.env.example` points at a **different** project (`g32xvgua`, holding 1 `siteSettings` document and image assets). Which project the Vercel deployment uses is unknown from the repo — **needs confirmation by the owner** (see §22/§24).

---

## 2. Website architecture (`apps/web`)

- **Routing:** `app/[locale]/…` with `next-intl`; locales `he|ar|en|ru`, default `he`, `localePrefix: 'as-needed'`, `localeDetection: false` (`i18n/routing.ts:6-9`). Middleware matcher excludes `api|studio|_next|_vercel|files` (`middleware.ts:6-8`).
- **Layout:** `app/layout.tsx` is a passthrough; `app/[locale]/layout.tsx:98-102` sets `<html lang dir class>` from `LOCALE_META`; fonts Inter / Noto Sans Hebrew / Cairo.
- **Data loading:** `lib/content/getContent.ts` (`React.cache`) → `lib/sanity/fetch.ts` runs 12 parallel GROQ queries (`Promise.allSettled`) and deep-merges onto `seedContent`. Per-collection rule: `if (projects?.length) base.projects = mapped` (`fetch.ts:250-263`) — Sanity replaces a seed collection **only when non-empty**.
- **Cache:** every query uses `next: { tags, revalidate: 3600 }` (`fetch.ts:23-25`). No page-level `revalidate`/`dynamic`. `dynamicParams` default `true`, so a new project slug is servable once the cached content includes it.
- **Client/Sanity:** `sanity/lib/client.ts` → `useCdn: true`, `perspective: 'published'`, no token, `null` when unconfigured.
- **Images:** `next/image` with `remotePatterns` for `cdn.sanity.io` (`next.config.ts:20`); `lib/content/media.ts` allows only `/…` and `https://cdn.sanity.io`.
- **Revalidation:** `POST /api/revalidate` (header `x-revalidate-secret`, timing-safe, fail-closed when env empty, in-memory 10/min/IP, revalidates all tags). `SANITY_REVALIDATE_SECRET` is **not set** in `apps/web/.env.local` → endpoint returns 401 to everyone.
- **Theme:** manual `html.dark` class toggled by `components/ui/ThemeToggle.tsx` after mount (`useEffect`), honoring `prefers-color-scheme` by default; no blocking script; `globals.css` has dark rules only for `body`, `.btn-primary`, `.btn-secondary` (see §12).
- **Hydration:** `Reveal` and `Hero` were fixed earlier today (`IMPLEMENTATION_LOG.md`); `/ar` verified 0 issues; `/`, `/en`, `/ru` not yet browser-verified.
- **APIs:** only `/api/revalidate`.

## 3. Dashboard architecture (`apps/Dashboard`)

- Single client page `app/page.tsx` switching modules in `useState`; `app/layout.tsx` (server) reads the session cookie, loads `readDashboardContent()` (Sanity or mock fallback) and injects it into `AdminDataProvider` (`lib/AdminDataContext.tsx`), which is **in-memory React state**.
- Modules under `components/admin/modules/*` edit that in-memory state; a subset is persisted through `CmsNotice` "Save" → `postCms()` (`lib/cms-client.ts`) → `POST /api/cms` → `lib/server/content/mutate.ts` → Sanity HTTP mutate API with `SANITY_API_WRITE_TOKEN`.
- Media: `components/admin/shared.tsx` `ImageUpload` → `POST /api/media` → Sanity assets API; returns `{ url, assetId }`.
- Reads: `lib/sanity/fetch.ts` uses `apicdn.sanity.io` with `next: { revalidate: 60 }`; `fetchSanityDocumentType` also uses `apicdn` (`cache: 'no-store'` but still CDN-side stale).
- Theme: `next-themes` (`attribute="class"`, `defaultTheme="system"`); `globals.css` `:root` = dark tokens, `.light` = light tokens.
- UI language: `lib/i18n/*` dictionaries (ar/he/en), cookie `nora_ui_lang`, `<html lang dir>` from cookie.

## 4. Sanity architecture

Schemas in `apps/web/sanity/schemaTypes/`: `localeString`/`localeText` (ar, he required, en, ru), `siteSettings`, `homePage`, `aboutPage`, `howWeWorkPage`, `contactPage`, `uiLabels`, `service`, `project`, `material`, `testimonial`, `blogPost`, `faqItem`. `project` = `slug`, `title`, `description`, `category` (enum of 5), `gallery[] image`, `materials[] string`, `order`, `visible`. No users/passwords in Sanity (correct). Studio at `/studio` (Sanity login). Live dataset: **empty** (see §1).

## 5. Authentication (Dashboard)

**Existing.** HMAC-SHA256 signed session cookie `nora_session` (HttpOnly, SameSite=Lax, Secure in prod, 8 h) via Web Crypto (`lib/auth/session.ts`). Owner = env `DASHBOARD_OWNER_EMAIL/PASSWORD` compared timing-safe; additional users in `.data/users.json` with scrypt hashes (`lib/auth/users.ts`). Login rate-limited in memory (8/min/IP). Middleware redirects unauthenticated pages to `/login` and returns 401 JSON for `/api/*`. Verified today: `GET /` → 307 `/login`; `GET /login` → 200; invalid login → 401; Owner login round-trip PASS (earlier entry in the log).

Weaknesses: `.data/users.json` is not durable on Vercel; no password reset/invite; rate limit per instance.

## 6. RBAC

`lib/auth/rbac.ts`: `employee(1) < editor(2) < admin(3) < owner(4)`. Enforced server-side in route handlers: `/api/cms` editor+ (delete admin+), `/api/media` editor+, `/api/translate` editor+, `/api/users` owner only, `/api/content` any session. IDs are re-checked against Sanity `_type` before patch/delete (`mutate.ts:108-118`). Users API cannot create/promote Owner. The UI does not currently hide anything by role (cosmetic, not security).

Gap: `/api/content` readable by `employee`; not exploited by the UI today. Employee role has no defined capabilities in the UI.

## 7. Data flow (as implemented) — where it breaks

Tracing **Dashboard → Add Project → Save**:

| Step | Finding | Evidence |
|---|---|---|
| Add | `addProject()` creates draft `proj-<ts>-<rand>` with `published: false`, `category: 'Residential'` (not a schema value), empty titles | `AdminDataContext.tsx:296-312` |
| Image upload | `/api/media` uploads the asset (3 exist in Sanity) but `ProjectsModule` ignores `assetId` and never sends images | `ProjectsModule.tsx:173-177`, `shared.tsx:139` |
| Save → create | Requires `slug` **and** Hebrew title; user typing English/Arabic only → 400 "Project requires slug and Hebrew title" | `mutate.ts:265-267` |
| Slug | Derived from `title.en` only; empty → `'project'` (collides on second create) | `ProjectsModule.tsx:151` |
| Visibility | `published:false` → `visible:false` → Website filters `visible != false` | `fetch.ts:64` |
| Result | `mutate()` discards Sanity's response body; created `_id` never returned; local draft keeps `proj-…` id → next Save **creates again** | `mutate.ts:58-68`, `cms-client.ts:16-33` |
| Error text | Sanity's real error is replaced by "Sanity mutation was rejected" | `mutate.ts:64-66` |
| Dashboard refresh | Reads via `apicdn` + 60 s data cache → new doc invisible to the Dashboard for up to a minute+ | `lib/sanity/fetch.ts:25-34` |
| Website | Content cached 3600 s; `WEBSITE_REVALIDATE_URL` / `SANITY_REVALIDATE_SECRET` unset → `revalidateWebsite()` silently returns | `mutate.ts:84-87`, env names |
| Website merge | If ≥1 project exists in Sanity, **all 8 seed projects disappear** and only the Sanity one(s) show | `fetch.ts:250-263` |

**Proven:** no `project` document exists in Sanity → the mutation never succeeded (most likely the Hebrew-title/slug 400 or a silent 4xx). Every later step would also have blocked visibility.

## 8. Website ↔ Sanity flow

Existing and correct for reads *when documents exist*. Issues: (a) empty-collection fallback to seed makes "delete the last project" resurrect seed projects; (b) Sanity image fields for projects come from `gallery[].asset->url` only — no gallery → hero fallback image; (c) no per-request bypass of the 3600 s cache without the webhook/secret; (d) `uiLabels` docs are read but never written by any tool except Studio.

## 9. Dashboard → API → Sanity flow

`/api/cms` (same-origin check, session, role, zod `mutationSchema`, door rejection, `_type` check). Field coverage is a thin subset — from the module sweep ([Dashboard modules gap audit](e4ede2f0-2fda-4cf5-8b47-e5e517dc9465)):

| Resource | Written today | Edited in UI but never persisted | Website reads but Dashboard cannot write |
|---|---|---|---|
| project | title, description, category, materials, visible, slug (create) | imageUrl, galleryImages, featured, completedDate | **gallery**, order |
| service | title, description, visible | icon, imageUrl, steps | **image**, **features**, order, slug (create blocked) |
| material | name.*, description, visible | name (display), type, textureImageUrl, specifications | **image**, characteristics, applications, finishes, order |
| testimonial | name, rating, review, visible | clientTitle | project, order |
| faq | question, answer, order, visible | — | category |
| blog | title, excerpt, content, author, date, visible, slug (create) | featuredImageUrl, tags | **image**, category |
| site | brandName, tagline, email, address | logoUrl, contactPhone, navItems, footerLinks, socialLinks, footerCopyright | phoneDisplay, phoneTel, whatsappE164, logo, logoDark, seo*, workingHours, whatsappMessage |
| homepage | 6 locale fields + heroImages | hero slide title/subtitle/cta/published | intro/why/process/services/projects/materials/testimonials eyebrow-title-subtitle, introFeatures, whyItems |
| about | body | vision, mission, featureBanners | eyebrow, title, subtitle, image, valuesTitle, values |
| howWeWork | steps (patch by `_key`) | — | eyebrow, title, subtitle, image; cannot add/remove steps |

Russian (`ru`) is never written by any patch (`schema.ts:4-8`) — safe against erasure, but also never editable.

## 10. Localization

Website: 4 locales, RTL for he/ar via `<html dir>`, `t()` fallback chain locale → he → any (`lib/i18n/locale.ts:26-40`), canonical + hreflang + `x-default` per page (`lib/seo/*`), sitemap from `getSiteContent()`. English-only `aria-label`s: Header Menu/Close, LanguageSelector "Language", ThemeToggle, Footer QR alt.

Dashboard: UI language ar/he/en with RTL — **Existing** (verified on Login). Remaining hardcoded English chrome strings listed per module in the sweep (e.g. `ProjectsModule.tsx:104,193,209,227,244,273,294`; `SiteModule.tsx:138-268`; `MaterialsModule.tsx:17-28,146-186`; `ServicesModule.tsx:151,194,214,237`; `BlogModule.tsx:87,163-209`). Native `confirm()`/`alert()` in five modules.

## 11. AI translation

**Broken (config + design).**
- `TRANSLATION_API_KEY` is absent from `apps/Dashboard/.env.local` → `POST /api/translate` returns 503 "Translation is not configured" (`translate/route.ts:103-105`). This is the immediate cause of "does not work".
- Provider format is hard-coded to OpenAI chat-completions JSON; no retry; provider status codes collapsed into one 502 string.
- "Mark reviewed" only flips `status` inside `.data/translation-reviews.json` (`route.ts:190-224`); **nothing is ever written to Sanity**, so the workflow never reaches the CMS.
- `TranslationModule.tsx:33` uses `response.json()` without a guard → a non-JSON/empty response throws `SyntaxError: Unexpected end of JSON input` in the browser (the earlier reported incident).
- Targets limited to he/ar/en; the site also has ru.
- Secrets stay server-side (correct).

## 12. Theme system

**Website — Broken in dark mode** ([Website theme audit](19142fe0-14e7-4c57-9ff4-6f3160f73546)): `globals.css:14-21` gives `html.dark body` `bg-charcoal-950 text-warm-50`, but **zero** `dark:` variants exist in `components/**`; sections hardcode `bg-warm-50`/`bg-white` (e.g. `HomeView.tsx:68,105`), `.card-luxury` is `#ffffff` (`globals.css:100-105`). Headings that rely on inherited color (`HomeView.tsx:285-294,362-376`) become cream-on-white → the reported "page white, text invisible". `html.dark .btn-secondary` (`globals.css:88-90`) puts light borders/text on white sections. `ThemeToggle` auto-enables dark for OS-dark users and applies after mount (flash).

**Dashboard — Existing:** semantic HSL tokens; `:root` dark-first, `.light` overrides; `next-themes`. `suppressHydrationWarning` on `<html>`/`<body>` (standard for next-themes on `<html>`).

## 13. Content management

The Dashboard is a real, authenticated writer for a **subset** of fields against an **empty** dataset, while the Website renders **seed**. Result: the two apps do not share a content source in practice. Mock data (`lib/mock-data.ts`, Bolt template, doors removed) is used only when the Sanity read fails.

## 14. Media management

Upload path is sound (session, role, 8 MB cap, magic-byte sniff jpeg/png/webp, Sanity assets API). Binding uploaded assets to documents exists **only** for `homePage.heroImages`. Project/service/material/blog/site images are lost on reload. No delete/reorder of assets; hero reorder is in-memory until Save.

## 15. Security

Positive: server-side auth + role checks on every mutating route; same-origin check (CSRF); zod validation; `_type` re-check before patch/delete (IDOR); scrypt hashes; timing-safe compares; `server-only` on token-bearing modules; write token never in client code; Dashboard CSP/`X-Frame-Options: DENY`/noindex; Website CSP split (Studio keeps `unsafe-eval`); JSON-LD escaped; image `src` allow-list.

Findings:

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| S1 | High | Live content source not in Sanity; Dashboard writes land in an empty dataset and would *replace* seed collections on the Website once ≥1 doc exists | §1, `fetch.ts:250-263` |
| S2 | Medium | Revalidation secret/URL unset in both apps → webhook fail-closed; stale ISR for 1 h after any edit | env names |
| S3 | Medium | `.data/users.json` and `.data/translation-reviews.json` not durable on serverless | `users.ts:22`, `translate/route.ts:6` |
| S4 | Medium | In-memory rate limits (login, translate, revalidate) per instance | three routes |
| S5 | Low | `/api/content` readable by any role incl. employee | `content/route.ts:6-7` |
| S6 | Low | Unguarded `JSON.parse`/`response.json()` in `TranslationModule.tsx:33`, `UsersModule.tsx:29`, `shared.tsx:136` | sweep |
| S7 | Low | `@netlify/plugin-nextjs` still a runtime dependency; `netlify.toml` present in a Vercel-targeted app | `apps/Dashboard/package.json` |
| S8 | Info | Website `.env.example` project id differs from local env | §1 |

No secrets found in tracked files; `.env.local`, `.data/`, `.next/` are ignored (verified with `git check-ignore`).

## 16. Performance

Website: 12 parallel GROQ queries per request (cached 1 h), AVIF/WebP, hero video loop, framer-motion on hero, `optimizePackageImports`. Dashboard: `images.unoptimized`, large Radix surface (47 UI files, most unused), whole app client-rendered. No measurements taken; no clear regressions blocking current work.

## 17. SEO

Existing: per-page canonical/hreflang/x-default, sitemap from content, robots (disallow `/studio`, `/api/`), JSON-LD (LocalBusiness/WebSite/Breadcrumb/FAQ/Article), `metadataBase` from `NEXT_PUBLIC_SITE_URL`. Dashboard `robots: noindex`. Not verified against a live crawl.

## 18. Accessibility

Website: buttons are real `<button>`s; cookie banner `role="dialog"`; but English-only aria labels (Header/LanguageSelector/ThemeToggle/Footer QR), no visible `focus-visible` styles in globals, mobile menu has no focus trap/Escape, language dropdown lacks keyboard navigation. Dashboard: Radix primitives (good), native `confirm/alert`, several unlabeled inputs (`placeholder` only).

## 19. Deployment / Vercel

Two Next apps → two Vercel projects (Root Directory `apps/web` and `apps/Dashboard`). Root scripts use correct filters (`@nora/web`, `@nora/dashboard`). `packageManager: pnpm@9.15.0`. Dashboard still ships `netlify.toml` + plugin dependency. File-based stores (`.data/`) will not persist on Vercel. Vercel env must include the Sanity project id actually holding content (unknown — see §1).

## 20. Dependencies

Both apps on React 19 / Next 15.5.25 (aligned earlier today). Website: next-intl 4, next-sanity 9, sanity 3.78, framer-motion 11, tailwind 3.4. Dashboard: tailwind 3.3.3, framer-motion 13, next-themes 0.3, zod 3, many Radix packages, `@netlify/plugin-nextjs` (unused for Vercel), `date-fns`/`recharts`/`embla`/`cmdk`/`vaul`/`input-otp` (template leftovers). Node 24.19, pnpm 9.15. No `engines`. No upgrades planned in this pass.

## 21. Broken functionality (evidence-backed)

1. Dashboard-created project never appears on the Website (§7) — **Critical**.
2. Sanity holds no content; Website = seed; Dashboard = empty (§1) — **Critical**.
3. Dark mode on the Website unreadable (§12) — **Critical (UX)**.
4. AI translation: unconfigured, never writes to Sanity, unguarded JSON parse (§11) — **High**.
5. Project/service/material/blog/site images never attach to documents (§14) — **High**.
6. Website revalidation never fires (S2) — **High**.
7. Created `_id` lost → duplicate documents on repeated Save (§7) — **High**.
8. Many module fields silently unsaved (§9) — **High**.
9. Dashboard read staleness (CDN + 60 s cache) after writes (§7) — **Medium**.
10. Seed resurrection when a Sanity collection becomes empty (§8) — **Medium**.
11. Native `alert/confirm`, English chrome strings, unguarded JSON in Dashboard (§10, S6) — **Medium**.
12. Website a11y: English aria labels, no focus styles (§18) — **Medium**.
13. Theme flash on Website load (§12) — **Low**.

## 22. Root causes

- **R1 — Content was never migrated into the CMS.** The Website was built seed-first with Sanity as an optional overlay; the Dashboard was then wired to Sanity. Nobody populated the dataset, so the two apps never met.
- **R2 — Mutation layer built from mock types, not from the Sanity schema.** `lib/types.ts` mirrors the Bolt template (featured, woodTypes, specifications…), so the zod schema and `mutate.ts` cover only the overlap; images/order/features were left out.
- **R3 — Fire-and-forget writes.** `mutate()` ignores Sanity's response, the client never receives the `_id`, and state is not re-synced from the server.
- **R4 — Cache invalidation depends on env that was never set** (revalidate secret/URL), and Dashboard reads go through the CDN.
- **R5 — Dark theme implemented at `body` level only**, with components hardcoding light palette classes and relying on inherited text color.
- **R6 — Translation feature stopped at "draft file"**; the Sanity write step and provider config were never completed.
- **R7 — Environment drift** between `.env.example` and local env (different project ids).

## 23. Recommended fixes (this engagement, in order)

1. **Seed Sanity with the Website's existing published content** via an idempotent script (`createIfNotExists`, deterministic `_id`s, upload the 17 local images once) — the seed is the site's real content, not Dashboard mock data; the dataset is currently empty so nothing is overwritten. Dashboard mock data (Bolt template) is **not** imported.
2. Website: treat Sanity as authoritative once bootstrapped (empty collection ≠ fall back to seed when `siteSettings` exists); keep seed as a resilience fallback for unconfigured/failed fetches only.
3. Dashboard writes: return created `_id`s; surface sanitized Sanity errors; support `gallery`/`image` asset references, `order`, `features`, material texts, testimonial `project`, faq/blog `category`, blog `image`, site phones/WhatsApp/logo/SEO, homepage section texts; auto-slug from any locale; require at least one title; keep `ru` untouched.
4. Dashboard reads: `api.sanity.io` (uncached) with the write token for the authenticated read + `/api/content` refresh after every Save; `_type` check also uncached.
5. Revalidation: generate `SANITY_REVALIDATE_SECRET` (both apps) and `WEBSITE_REVALIDATE_URL` locally; report revalidation failures to the UI instead of swallowing them.
6. Translation: keep credentials server-side; robust provider call (timeout, retry on 429/5xx, structured errors, env-name hints); review in the UI; explicit "Apply" writes one locale field through `/api/cms`; guard all JSON parsing; support ru as an explicit opt-in target only.
7. Website theme: semantic surface/text tokens in `globals.css` + Tailwind; migrate `bg-warm-50/bg-white/text-charcoal-*` on page surfaces to tokens; keep hero/footer/CTA bands fixed-dark; scope button dark overrides; blocking theme script + `data-theme`-free `class` approach with default **light** (no OS auto-dark until contrast verified) — verify all locales in both modes.
8. Hydration: re-verify `/`, `/en`, `/ru` in the browser after the theme change.
9. Dashboard modules: replace `alert/confirm` with in-UI status/Radix dialog; move remaining chrome strings to `t()`; role-aware UI hints (server remains the boundary).
10. Security hygiene: restrict `/api/content` to editor+; keep rate limits (document per-instance limitation); remove Netlify plugin dependency (suggestion, not required for correctness).
11. A11y/SEO: localized aria labels, `focus-visible` ring, Escape/focus handling for mobile menu.
12. Docs: `IMPLEMENTATION_LOG.md`, `FINAL_PROJECT_REPORT.md`.

## 24. Priority

**Critical:** R1/R2/R3 (content source + project flow), dark mode readability, revalidation.  
**High:** image binding for all document types, translation pipeline + Sanity apply, unguarded JSON parsing, module field coverage.  
**Medium:** Dashboard read staleness, seed resurrection edge case, native dialogs/English chrome, a11y labels/focus, `/api/content` role, Vercel durability of `.data/`.  
**Low:** theme flash, Netlify leftovers, unused Radix packages, English-only Studio strings.

**Requires owner confirmation (BLOCKED items):** which Sanity project id the production Vercel deployment uses (`q7u9ax5m` local vs `g32xvgua` in `.env.example`); provisioning `TRANSLATION_API_KEY` (no provider credentials exist locally); a durable user store for Vercel.

---

## 25. Appendix — `cms:bootstrap` script (proposed, NOT executed)

**Provenance.** This script did not exist in the repository before 2026-09-14. It was written during this engagement as the proposed remedy for root cause R1 (Sanity dataset empty; Website serving `seed.ts`). It is **uncommitted**, has **never been run against Sanity**, and remains inspection-only until explicitly approved. Files: `apps/web/scripts/seed-sanity.ts` (new), one `scripts` entry in `apps/web/package.json`. The root `package.json` does not reference it.

**Definition.** `apps/web/package.json` → `"cms:bootstrap": "esbuild scripts/seed-sanity.ts --bundle --platform=node --format=esm ... --outfile=node_modules/.cache/nora/seed-sanity.mjs && node node_modules/.cache/nora/seed-sanity.mjs"`. esbuild (already present via `sanity`/`vite`) bundles the TS file with the app's `tsconfig.json` path aliases; Node runs the bundle. No new dependency.

**Imports (all local, no Next/React):** `@/lib/content/seed` (the live Website content), `@/lib/content/types` (types only), `@/lib/constants` (`LOCALES`; reads `NEXT_PUBLIC_SITE_URL` only), transitively `@/lib/content/images`, `@/lib/content/legal`, `@/lib/i18n/locale`. Node built-ins `fs/promises`, `path`. It does **not** import the Dashboard's `mutate.ts` or any Sanity SDK; it calls the Sanity HTTP API directly with `fetch`.

**Environment (names only):** `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` (default `production`), `NEXT_PUBLIC_SANITY_API_VERSION` (default `2025-01-01`), `SANITY_API_WRITE_TOKEN` (required unless `--dry-run`). The token lives only in `apps/Dashboard/.env.local` today; `apps/web/.env.local` has no token, so running it from `apps/web` requires the token to be supplied to the process explicitly.

**Behaviour.**
1. `--dry-run`: reads `/public` image files, builds the document list, prints counts, makes **no network calls**. (Executed once today: 46 documents, 19 unique images.)
2. Real run — two classes of write:
   - `POST /v{ver}/assets/images/{dataset}` for each unique local image referenced by the seed (19 files: 17 under `public/images`, plus `/logo.png`, `/qr.jpg`). Sanity de-duplicates by content hash, so re-uploading an identical file returns the existing asset instead of creating a duplicate.
   - one `POST /v{ver}/data/mutate/{dataset}` transaction of 46 `createIfNotExists` mutations.
3. Prints "Created N, already existed M". Exits non-zero on any HTTP error; the transaction is atomic (all-or-nothing).

**Verdict: mutating, non-destructive.** `createIfNotExists` never overwrites, patches, or deletes; a document whose `_id` already exists is skipped untouched. There is no `--force`/`createOrReplace` path in the script. Re-running is a no-op for documents and a de-duplicated no-op for assets.

**Documents it would create (never update/delete):**

| `_type` | `_id` pattern | Count | Source |
|---|---|---|---|
| `siteSettings` | `siteSettings` | 1 | `seed.settings` (+ logo / logoDark / contactQr assets) |
| `homePage` | `homePage` | 1 | `seed.home` (+ 5 hero images) |
| `aboutPage` | `aboutPage` | 1 | `seed.about` |
| `howWeWorkPage` | `howWeWorkPage` | 1 | `seed.howWeWork` (steps keyed `step-01…`) |
| `contactPage` | `contactPage` | 1 | `seed.contactPage` |
| `uiLabels` | `uiLabels-{he,ar,en,ru}` | 4 | `seed.nav` + `seed.ui` |
| `service` | `service-<slug>` | 7 | `seed.services` (no door service exists in seed) |
| `project` | `project-<slug>` | 8 | `seed.projects` (gallery keyed `img-01…`) |
| `material` | `material-<slug>` | 8 | `seed.materials` |
| `testimonial` | `testimonial-<id>` | 3 | `seed.testimonials` |
| `faqItem` | `faqItem-<id>` | 8 | `seed.faq` |
| `blogPost` | `blogPost-<slug>` | 3 | `seed.blogPosts` |

Singleton ids match the Studio structure (`sanity/structure.ts` `singleton()` uses `documentId(id)` = schema name) and the Dashboard's existing patch targets (`mutate.ts:144,151,167,190`). All four locales (`he/ar/en/ru`) are written from the seed. `order` = seed array index; `visible` = seed value (all `true`).

**Is it necessary?** For the stated goal ("Dashboard manages the same content the Website shows; Sanity is the source of truth") the dataset must contain the Website's content. Today it contains none (§1). The alternatives are: (a) re-enter ~46 documents and 19 images by hand in Studio/Dashboard; (b) this script; (c) keep the Website on `seed.ts` and accept that the Dashboard manages a different, empty content set (which defeats the goal). So some form of one-time import **is** necessary; the script is the lowest-effort, reversible way to do it. It is **not** necessary for any other audit item (theme, hydration, translation pipeline, module field coverage, revalidation) — those can proceed without it.

**Should it run later?** Yes, but only after the safeguards below, and only against the dataset the owner confirms is the intended one. Nothing else in the plan blocks on it except the final "Dashboard edit → Website shows it for real content" acceptance test.

**Required safeguards before any real run:**
1. Owner confirms the target project id + dataset (local env says `q7u9ax5m/production`; `apps/web/.env.example` says `g32xvgua`). The script prints both before writing.
2. Fresh read-only GROQ count of every content `_type` immediately before running, to confirm the dataset is still empty (or that any existing ids will simply be skipped).
3. `pnpm cms:bootstrap -- --dry-run` first, output reviewed (document/asset counts as above).
4. Merge-rule fix in `apps/web/lib/sanity/fetch.ts` (§8/§23.2) landed first, so that a partially populated dataset can never hide seed content on the live site during the transition.
5. Token supplied to the process only for that one command, never echoed, never written to `apps/web/.env.local` or any tracked file; Sanity token should be dataset-scoped Editor, not Admin/Deploy.
6. Sanity dataset export/backup taken first (`sanity dataset export`) so the state is reversible even though the script itself never overwrites.
7. Run once; verify with read-only GROQ counts (expected: 46 docs, 19+ assets) and in Studio; then verify Website renders identically from Sanity in all four locales.
8. Explicit go-ahead from the owner in chat before execution.

---

## 26. Audit complete — waiting for approval

Inspection of architecture, data flow, the five reported failures, security/auth (server-side), localization, theme, hydration, and `cms:bootstrap` is finished. `PROJECT_AUDIT.md` is the report.

**Not done (by design):** implementation, Sanity writes, `pnpm cms:bootstrap` without `--dry-run`, loading `SANITY_API_WRITE_TOKEN`, theme/CSS patches, mutation-layer rewrites.

**Owner decisions needed before Phase 2+:**
1. Approve leaving audit and starting implementation (recommended first code change: Website merge rule in `apps/web/lib/sanity/fetch.ts` so a partial Sanity dataset cannot hide seed content — no Sanity write).
2. Confirm which Sanity project id production uses (`q7u9ax5m` local vs `g32xvgua` in `apps/web/.env.example`).
3. Keep or revert the uncommitted `cms:bootstrap` files (`apps/web/scripts/seed-sanity.ts` and the `package.json` script line). They were added during the audit as a proposal; they have not mutated Sanity.
4. Do **not** run `cms:bootstrap` until safeguards in §25 are met and you say so in chat.
5. Provision `TRANSLATION_API_KEY` (name only documented) when translation work starts; do not put it in client code.
