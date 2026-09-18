# Implementation Log

## 2026-09-14 — Phase 1: Monorepo hygiene and baseline cleanup

**Branch:** `main` (started at `e7b182f`, ahead of `origin/main`)  
**Scope:** Workspace naming, lockfile/package-manager consistency, gitignore, tracked OS junk.  
**Not in this phase:** authentication, RBAC, Dashboard redesign, Sanity architecture, AI translation, themes, website UI rewrite.

---

### Actions actually performed

1. Renamed workspace package `name` fields:
   - `apps/web`: `nora-group` → `@nora/web`
   - `apps/Dashboard`: `nextjs` → `@nora/dashboard`
2. Updated root scripts to `pnpm --filter @nora/web` and `@nora/dashboard`.
3. Added root scripts: `lint`, `lint:web`, `lint:dashboard`, `typecheck`, `typecheck:web`, `typecheck:dashboard`, `check`.
4. Set root `"packageManager": "pnpm@9.15.0"` (matches lockfile v9; Corepack used this version).
5. Removed redundant npm lockfiles (`apps/web/package-lock.json`, `apps/Dashboard/package-lock.json`). Authoritative lockfile remains `pnpm-lock.yaml`.
6. Removed tracked `desktop.ini`.
7. Expanded root `.gitignore` (`dist`, `build`, `coverage`, `.turbo`, `desktop.ini`, logs, `*.tsbuildinfo`, env rules as specified).
8. Added `.npmrc` with `dedupe-peer-dependents=false` to reduce React 18/19 type mixing on a future lockfile re-resolve. **Lockfile was not regenerated** (avoids in-range version drift).
9. Ran `pnpm install` (non-interactive `CI=true` after an interactive prompt interrupted the first attempt).
10. Ran website and dashboard production builds, lint, and typecheck.

No application source, Sanity schemas, or business content files were edited.  
`.env.local` files were not deleted, not read, and not printed.

---

### Files changed

| File | Change |
|------|--------|
| `package.json` | Filters, scripts, `packageManager` |
| `apps/web/package.json` | `name`: `@nora/web` |
| `apps/Dashboard/package.json` | `name`: `@nora/dashboard` |
| `.gitignore` | Broader ignore rules |
| `.npmrc` | New; peer-dedupe isolation (lockfile not rewritten) |

### Files removed

| File | Reason |
|------|--------|
| `apps/web/package-lock.json` | Redundant npm lockfile |
| `apps/Dashboard/package-lock.json` | Redundant npm lockfile |
| `desktop.ini` | Tracked Windows shell metadata |

### Package-name / workspace status

- Root: `nora-group-monorepo` (unchanged)
- Website: `@nora/web` at `apps/web`
- Dashboard: `@nora/dashboard` at `apps/Dashboard`
- `pnpm-workspace.yaml` still `packages: ["apps/*"]` — both apps listed by `pnpm list -r`
- No `packages/` or `apps/api/` added
- Apps do not import each other by package name

### Lockfile / dependency status

- `pnpm-lock.yaml` **not modified** (`Lockfile is up to date`)
- **No dependency version specifiers changed** in any `package.json`
- Nested `package-lock.json` files removed

### Environment / secrets

- Tracked env-related files remain `apps/web/.env.example` and code helpers (`lib/sanity/env.ts`, `sanity/env.ts`)
- No `.env` / `.env.local` in `git ls-files`
- No Sanity write tokens, API keys, or passwords found in tracked source (search was for names/patterns only)
- **No tracked secret requiring history cleanup**

---

### Commands executed

| Command | Result |
|---------|--------|
| `pnpm --version` | `9.15.0` (Corepack fetched this after `packageManager` was set) |
| `pnpm install` (first, interactive) | Prompted to recreate `node_modules`; not a complete install |
| `CI=true pnpm install` | **Success** (exit 0), ~26 min after modules purge; 1432 packages |
| `CI=true pnpm install` (after `.npmrc`) | **Success**; already up to date; lockfile unchanged |
| `pnpm typecheck` | **Failed** (exit 2) — website `tsc` passed; dashboard `tsc` failed (see below) |
| `pnpm --filter @nora/web build` | **Success** (exit 0) |
| `pnpm --filter @nora/dashboard build` | **Success** (exit 0) |
| `pnpm lint:web` | **Failed** (exit 1) — `next lint` has no ESLint config; interactive prompt; **no ESLint file was created** |
| `pnpm lint:dashboard` | **Success** — “No ESLint warnings or errors” |
| `pnpm check` | **Not run as a single command.** Equivalent parts: `typecheck:web` passed; both `build`s passed. Script is `pnpm typecheck:web && pnpm build`. |
| `pnpm dev` / browser | **Not tested.** |
| Lint/typecheck after further source edits | N/A — no app source edits |

### Errors encountered and what was done

1. **Interactive `pnpm install` purge prompt** — reran with `CI=true`.
2. **Dashboard `tsc --noEmit`** — many `TS2786` / `ReactNode` errors: Lucide/`@types/react@19` vs dashboard React 18. **Not caused by the package rename.** Pre-existing mixed React 18 (dashboard) / 19 (website) in one pnpm store. `.npmrc` added but lockfile **not** regenerated. **Not fixed in Phase 1** (would risk dependency resolution changes). Next.js dashboard **build** still type-checked and succeeded.
3. **Website `next lint`** — no ESLint config (known from audit). Failed with setup prompt. **Did not add ESLint packages** (out of Phase 1 scope).

### Remaining issues (real)

- Dashboard `pnpm typecheck` fails (React 18 vs 19 types). Next.js build for dashboard succeeds.
- Website `pnpm lint` fails until ESLint is configured (later phase).
- Root `pnpm lint` / `pnpm typecheck` therefore fail if run as combined scripts.
- Dashboard mock still includes doors content (product, not Phase 1).
- Auth / Dashboard→Sanity / unused Supabase — unchanged, later phases.
- `.npmrc` `dedupe-peer-dependents=false` has **no effect until** a lockfile re-resolve is approved.

### Git status at end of Phase 1

Working tree is **not clean** (changes not committed, as instructed):

- Modified: `.gitignore`, `package.json`, `apps/web/package.json`, `apps/Dashboard/package.json`
- Deleted: `desktop.ini`, both app `package-lock.json` files
- Untracked: `.npmrc`, `IMPLEMENTATION_LOG.md` (this file)

No Sanity, mock-data, or `.env` files in the Phase 1 diff.

**STOP.** Phase 2 not started.

---

## 2026-09-14 — Phase 2 architecture preparation (plan only)

**Status:** Read-only. **No implementation.** No packages installed. No schemas, env, auth, UI, or source application files modified.

### Inspected

- Root: `package.json`, `pnpm-workspace.yaml` (via current Phase 1 layout)
- Website: `getContent.ts`, `lib/sanity/fetch.ts`, `lib/sanity/env.ts`, `sanity/env.ts`, `sanity/lib/client.ts`, `sanity.config.ts`, `middleware.ts`, `app/api/revalidate/route.ts`, `lib/content/types.ts`, `lib/content/chrome.ts`, `sanity/structure.ts`, all `sanity/schemaTypes/*`
- Dashboard: `lib/types.ts`, `lib/mock-data.ts` (doors service noted, not edited), `lib/AdminDataContext.tsx`, `app/layout.tsx`, `app/page.tsx`, admin modules and `LanguageTabs.tsx`

### Created

- `PHASE_2_PLAN.md` — target architecture, Option A (Dashboard Route Handlers), mapping tables, auth/RBAC requirements, security/Vercel notes, JSON-error status (**not confirmed statically** as a runtime incident)

### Not done

- No Dashboard→Sanity connection
- No authentication
- No new Sanity project
- No dependency changes

**STOP.** Waiting for approval before Phase 2 implementation.

---

## 2026-09-14 — Phase 2A mapping (documentation only)

**Status:** Read-only. **No implementation.** No Sanity schema changes, no Dashboard/Website source changes, no packages installed, no content migration, no authentication.

### Inspected (in addition to Phase 2 plan)

- Dashboard: `lib/types.ts`, `lib/mock-data.ts` (including Luxury Doors `svc-3`), `components/admin/modules/{Site,Hero,About,Projects,Materials,Services}Module.tsx` (Projects `CATEGORIES`, Services `door-open` icon)
- Website: `lib/constants.ts` (`PROJECT_CATEGORIES`, `SERVICE_SLUGS`), existing Sanity schema types (already listed in Phase 2)

### Created

- `PHASE_2A_MAPPING.md` — per-module field maps; direct / partial / unmapped; future schema (not now); do-not-migrate (doors + mock import); locale omit-`ru` rule; read-mapping order

### Not done

- No code, no mutations, no mock import, no schema extensions

**STOP.** Waiting for approval before any mapping implementation.

---

## 2026-09-14 — Phase 2B read-only Sanity mapping

**Status:** Implemented **reads only**. No mutations, auth, RBAC, schema changes, or new packages.

### Done

- Server `readDashboardContent()` in `apps/Dashboard/lib/sanity/*`
- Layout loads Sanity **or** mock (exclusive). Doors stripped. `ru` omitted from Dashboard models.
- Overview shows content source.
- `apps/Dashboard/.env.example` (names only)

### Verification

- Dashboard **build**, **typecheck**, **lint**: success
- Website **typecheck** and **build**: failed on React 18/19 types in generated `.next/types` (website source not modified in 2B)
- Browser: not tested
- JSON parse incident: not confirmed

**STOP.** No Phase 3 / auth / writes.

---

## 2026-09-14 — Phases 3–16 (partial production foundation)

**Branch:** `main` at `de76db4` plus uncommitted work.  
**No commit** in this phase (not requested).  
**No deploy.** **No new Sanity project.** **No production Sanity deletes.** **No Git history rewrite.**

### Objective

Move from read-only Dashboard mapping to authenticated server-side CMS mutations over the existing Sanity project, plus auth/RBAC, media upload, translation drafts, themes, lint, and type isolation.

### Actions actually performed

- Phase 3–6: HMAC session cookies (Web Crypto, Edge-safe), scrypt password hashes for file users, env Owner, `/login`, middleware, `POST /api/cms` with Zod + origin check + role gates, field-level locale patches (he/ar/en only), door-service rejection, optional website revalidate.
- Phase 5: Owner-only `/api/users`. File store `.data/users.json` (gitignored). Cannot create/promote Owner.
- Phase 6–8: Dashboard Save-to-Sanity on mapped modules; homepage/how-we-work/hero image reads + patches; RTL `lang`/`dir`; no Russian targets.
- Phase 9: `POST /api/translate` server-only; human review queue; does **not** auto-write Sanity.
- Phase 10–11: Dashboard `next-themes`; website `html.dark` toggle. Partial visual coverage.
- Phase 12: Marketing CSP without `unsafe-eval`; Studio path keeps `unsafe-eval`. Studio unconfigured project id no longer uses `placeholder`.
- Phase 13–14: ESLint for website; Testimonials unescaped-quote lint fix. Dashboard React aligned to 19 to fix mixed `@types/react`. Removed unused `@supabase/supabase-js`.
- Phase 15: Dashboard build is Vercel-compatible Next output. Netlify plugin still listed (not removed this pass). Extra users file store **not durable on serverless**.

### Files created (high level)

Dashboard: `middleware.ts`, `app/login`, `app/api/*`, `lib/auth/*`, `lib/server/*`, CMS modules (Homepage, HowWeWork, Users, Translation), `CmsNotice`, theme/lang helpers.  
Website: `.eslintrc.json`, `ThemeToggle.tsx`.  
Docs: this log section, `FINAL_PROJECT_REPORT.md`.

### Tests actually run (2026-09-14)

| Check | Result |
|-------|--------|
| `pnpm --filter @nora/dashboard typecheck` | **Success** (after React 19 + async session) |
| `pnpm --filter @nora/web typecheck` | **Success** (after React 19 alignment) |
| `pnpm --filter @nora/dashboard lint` | **Success** |
| `pnpm --filter @nora/web lint` | **Success** (after quote fix; next lint also rewrote `tsconfig.json` include) |
| `pnpm --filter @nora/dashboard build` | **Success** (after Edge crypto + CSS brace fix) |
| `pnpm --filter @nora/web build` | **Success** |
| Browser / E2E / live Dashboard→Sanity→Website | **Not tested — reason: no interactive browser verification of login or mutations in this session** |
| Login with real `AUTH_SECRET` / owner env | **Not tested — reason: credentials not exercised end-to-end here** |
| Sanity write token mutations | **Not tested — reason: write path not executed against the live dataset in this session** |
| AI translation provider | **Not tested — reason: `TRANSLATION_API_KEY` not used in a live call** |
| JSON parse `/he` incident | **Not confirmed at runtime** |

### Remaining issues

- Extra Dashboard users persist only in `.data/` (not Vercel-durable).
- Nav/footer/social, about vision/mission/banners, service steps, material spec sheets: not in Sanity schema; local-only.
- New services from Dashboard create form blocked without allowlisted slug (prevents doors).
- Website dark theme is CSS-partial (not every section re-skinned).
- In-memory rate limits (login, revalidate) are not multi-instance.
- Studio remains on the marketing origin (`/studio`); documented, not moved.
- Password reset email/invite flow not implemented.
- Dashboard→Sanity→Website loop **not verified live**.

---

## 2026-09-14 — Production hardening / error-fix pass

**Branch:** `main` at `de76db4` plus uncommitted work.
**No commit** (not requested).
**No deploy.** **No production Sanity deletes.** **No Git history rewrite.** Secret values were not read or printed.

### Problems

1. Dashboard `next.config.js` skipped ESLint during production builds (`ignoreDuringBuilds`).
2. CMS patch/delete used client-supplied document IDs without checking Sanity `_type` (IDOR across types).
3. Failed Owner password could fall through to the file user store for the same email.
4. Owner password used ordinary string equality.
5. `lib/server/http.ts` imported RBAC from `users.ts` (Node `fs` / `node:crypto`), risking server-only modules leaking toward shared graphs.
6. Middleware treated any pathname containing `.` as a public asset.
7. Mock `Luxury Doors` service still existed in `mock-data.ts`.
8. Website Sanity client was constructed even when `projectId` was empty.
9. `/login` layout still loaded CMS/mock content into the HTML for unauthenticated visitors.
10. Dashboard had no `robots` metadata and no CSP.
11. Translation endpoint had no rate limit and accepted an arbitrary `TRANSLATION_API_URL`.
12. Empty locale strings could wipe he/ar/en fields (Russian still not in the patch).
13. User IDs used timestamps; user-file writes were unordered.

### Root causes

Shared auth/RBAC lived next to filesystem code. Mutations trusted IDs. Owner bootstrap comparison was not fail-closed. Login layout always called `readDashboardContent()`. Dashboard Next config disabled lint. Translation URL was env-controlled without an HTTPS/SSRF allowlist.

### Actions

- Split RBAC into `lib/auth/rbac.ts`; added `server-only` to password, users, Sanity fetch/read, and mutate modules.
- Owner mismatch returns null; dummy scrypt on unknown file users; timing-safe owner compare; in-process user write lock; random user ids.
- Parameterized GROQ `*[_id == $id][0]._type` before patch/delete; tighter IDs; skip empty locale patches; HTTPS (or local http) revalidate URL only.
- Removed `ignoreDuringBuilds`; added Dashboard CSP / frame denial / `robots: noindex`; unauthenticated layout uses empty admin data.
- Translation: rate limit, HTTPS URL allowlist, JSON parse guard, review PATCH schema.
- Removed Luxury Doors from mock; website client is `null` when unconfigured.
- Session role/sub validation; middleware static-extension allowlist; Dashboard `app/robots.ts`.

### Files changed (this pass, high level)

Dashboard: `next.config.js`, `middleware.ts`, `app/layout.tsx`, `app/robots.ts`, `app/login/page.tsx`, `app/page.tsx`, `app/api/translate/route.ts`, `app/api/users/route.ts`, `lib/auth/{password,users,rbac,session}.ts`, `lib/server/{http,content/mutate,content/schema}.ts`, `lib/sanity/{fetch,read}.ts`, `lib/mock-data.ts`.
Website: `sanity/lib/client.ts`, `lib/sanity/fetch.ts`.
Docs: this log, `FINAL_PROJECT_REPORT.md`.

### Environment variable names only

Unchanged set: `AUTH_SECRET`, `DASHBOARD_OWNER_EMAIL`, `DASHBOARD_OWNER_PASSWORD`, `SANITY_API_WRITE_TOKEN`, `SANITY_REVALIDATE_SECRET`, `WEBSITE_REVALIDATE_URL`, `TRANSLATION_API_KEY`, `TRANSLATION_API_URL`, `TRANSLATION_MODEL`, public Sanity identifiers.

### Security impact

Reduces IDOR, Owner fall-through, unauthenticated CMS HTML leak, lint-skip in production builds, translation SSRF, accidental empty-string locale wipes. Does not replace in-memory rate limits or the non-durable `.data/` store.

### Tests run (this pass)

| Check | Result |
|-------|--------|
| `pnpm install` | Success (lockfile already up to date) |
| `pnpm --filter @nora/web typecheck` | Success |
| `pnpm --filter @nora/dashboard typecheck` | Success |
| `pnpm --filter @nora/web lint` | Success |
| `pnpm --filter @nora/dashboard lint` | Success |
| `pnpm --filter @nora/web build` | Success |
| `pnpm --filter @nora/dashboard build` | Success (no `node:crypto` in `.next/static`) |
| `git ls-files` env files | Only `apps/web/.env.example` tracked; `.env.local` not tracked |
| Browser / E2E locales + login | **Not passed** — running `pnpm dev` returned timeouts/500 after the production build replaced `.next` |
| Live Sanity writes | **Not tested** — no controlled mutation was executed against the live dataset |
| Login with Owner env | **Not tested** — credentials were not exercised |

### Remaining limitations

- `.data/users.json` and translation reviews are not durable on Vercel serverless.
- Empty locale strings are ignored (cannot clear a field by saving blank text).
- Nav/footer/social and several About/service/material fields remain local-only.
- Studio remains on the marketing origin with `unsafe-eval` isolated to `/studio`.
- In-memory rate limits are per instance.
- Password reset / email invite still absent.
- Live Dashboard → Sanity → Website loop still unverified.

---

## 2026-09-14 — Runtime recovery after stale `.next`

**Problem:** `pnpm dev` returned 500s and missing-manifest ENOENT after a production build replaced `.next` while the server was running. Login POST returned 503 because `AUTH_SECRET` was shorter than 32 characters.

**Action:** Stopped the stale process tree; deleted `apps/web/.next` and `apps/Dashboard/.next`; pinned Dashboard to port 3000 and Website to 3001 (webpack, not Turbo); apply Dashboard CSP only in production; regenerated gitignored `AUTH_SECRET` to meet the 32-character minimum (value not logged). Empty he/ar/en locale patches are allowed again; `ru` is still never written.

**Tests:** Website `/`, `/ar`, `/en`, `/ru` HTTP 200. Browser confirmed `/ar`, `/en`, `/ru`, and Dashboard `/login`. Unauthenticated Dashboard `/` → 307 `/login`. Invalid login POST → 401. Owner login with real credentials and live Sanity writes were not exercised.

---

## 2026-09-14 — Dashboard Owner login session cookie

**Problem:** Correct Owner email/password did not keep the user in the Dashboard.

**Root cause:** `POST /api/auth/login` set `nora_session` via a raw `Set-Cookie` header on `Response`. Next.js App Router does not reliably attach that cookie. The handler returned 200, then the client navigated to `/`, middleware found no session, and redirected back to `/login`.

**Action:** Set/clear the cookie with `NextResponse.cookies.set` (HttpOnly, SameSite=Lax, Path=/, Secure only in production). Login uses a full `window.location` navigation after success. Logout is allowed without a prior session. Env Owner values are read server-side from `apps/Dashboard/.env.local` with quote/CR trim. No secret values logged.

**Files:** `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`, `lib/server/http.ts`, `lib/auth/env.ts`, `lib/auth/session.ts`, `lib/auth/users.ts`, `middleware.ts`, `app/login/page.tsx`, `app/page.tsx`

**Tests:** Local Owner login against configured env (values not printed): POST login 200 + cookie flags; GET `/` 200 with cookie; refresh 200; logout 200; GET `/` 307 `/login`. Typecheck/lint follow. Browser form fill not used (would expose the password in snapshots).

---

## 2026-09-14 — Dashboard UI language switcher (ar / he / en)

**Scope:** Interface language for the Dashboard only. Does not change Website locale, Sanity documents, CMS field content, RBAC, or authentication.

**Architecture:** Lightweight dictionaries in `apps/Dashboard/lib/i18n/messages.ts` (`MessageKey` + `translate()`). Client provider `UiI18nProvider`. No extra i18n library. CMS field locale remains `LanguageTabs` / `LocalizedInput` (he/ar/en **content** fields), separate from UI language.

**Switcher:** Native `<select>` (`UiLangSwitcher`) with native names العربية / עברית / English, `aria-label`, visible focus. On Login (unauthenticated). Inside the Dashboard user menu (summary + language + sign out). Not duplicated in the header chrome.

**Persistence:** Cookie `nora_ui_lang` (`Path=/; SameSite=Lax; Max-Age=31536000`) plus `localStorage` mirror. Not stored in Sanity or `users.json`. Default **ar**. Website default remains Hebrew (`NEXT_LOCALE` is unused by this feature).

**RTL/LTR:** Root layout reads the cookie and sets `<html lang>` and `dir` (`rtl` for ar/he, `ltr` for en) with `suppressHydrationWarning`. `setLang` updates `document.documentElement` immediately without a full reload.

**Files:** `lib/i18n/*`, `components/admin/UiLangSwitcher.tsx`, `UserMenu.tsx`, `LanguageTabs.tsx`, `Sidebar.tsx`, `shared.tsx`, `CmsNotice.tsx`, `ThemeToggle.tsx`, `app/layout.tsx`, `app/providers.tsx`, `app/page.tsx`, `app/login/page.tsx`, admin modules; removed `DocumentLang.tsx` (it had bound `html.lang` to CMS field language).

**Tests:**
- `pnpm --filter @nora/dashboard typecheck` — PASS
- `pnpm --filter @nora/dashboard lint` — PASS
- `pnpm --filter @nora/dashboard build` — PASS (ran while `next dev` was also using `.next`; restart the Dashboard dev server if the workspace goes stale)
- Browser Login: default Arabic RTL; switch he / en / ar; English `dir=ltr` `lang=en`; Hebrew persisted after reload via `nora_ui_lang` — PASS
- Authenticated Dashboard modules, tables, dialogs, logout/login round-trip — NOT TESTED (no browser password entry)
- Sanity mutations from language change — not triggered in code; live write check — NOT TESTED
- Next.js hydration overlay appeared once on Login (likely `next-themes` `class` on `<html>`) — REMAINING ISSUE

**Remaining UI strings:** some form chrome still English (material specs, icon names, placeholders, a few FieldLabels such as Publish Date / Wood Types / Footer Links). CMS document values are not translated by this system (intentional).

---

## 2026-09-14 — Website `/ar` hydration mismatch (HomeView / Reveal)

**Issue:** Recoverable hydration error on `/ar` at `HomeView.tsx` ~185. Diagnostic compared a server `<a href="/ar/projects/...">` with a client `<div class="reveal">`.

**Root cause:**
1. `Reveal` always wrapped children in a `div`, but visibility used React `useState`. Combined with later tree drift, React could report the project grid as `<a>` vs `<div class="reveal">`.
2. `Hero` called framer-motion `useReducedMotion()`, which on the client first paint reads `window.matchMedia` (boolean) while SSR keeps `null`. That can change `motion.*` props on the first client render and desynchronize hydration below the hero, including the project cards.

**Files inspected:** `HomeView.tsx`, `Reveal.tsx`, `Hero.tsx`, `CookieNotice.tsx`, `ThemeToggle.tsx`, `Header.tsx`, locale layout/routing, `globals.css` `.reveal` rules.

**Files changed:**
- `apps/web/components/ui/Reveal.tsx` — same wrapper `div` on SSR and the first client render; `is-visible` is added after hydration via `IntersectionObserver` + `classList` (no visibility `useState`).
- `apps/web/components/home/Hero.tsx` — reduced motion is `false` until `useEffect`; no `useReducedMotion()` during render.

HomeView markup (`<Reveal><Link>`), locale routing, and Sanity data were not changed.

**Tests:**
- `pnpm --filter @nora/web typecheck` — PASS
- `pnpm --filter @nora/web lint` — PASS
- `pnpm --filter @nora/web build` — PASS (ran while `next dev` was using `.next`; restart the Website dev server if it goes stale)
- Did not delete `apps/web/.next` (dev server was already running)
- Browser `/ar`: no “Hydration failed” text in the document or Next portal shadow text; 45 `.reveal` wrappers; project link still inside `.reveal` — PASS
- Scroll: `.reveal.is-visible` applied — PASS
- `/ar/projects/built-in-wardrobe-06` loads — PASS
- HTTP `/`, `/ar`, `/en`, `/ru` — 200 PASS
- Browser hydration on `/`, `/en`, `/ru` — NOT TESTED

**Follow-up (same day, later):**
- The Website dev server on port 3001 exited with `MODULE_NOT_FOUND` for `.next/server/vendor-chunks/*` (500 on `/en/how-we-work`) — the production build had overwritten `.next` while `next dev` was serving from it. An orphaned `next start-server.js` child still held port 3001. Fix: stopped the orphaned process, deleted `apps/web/.next`, restarted `pnpm --filter @nora/web dev -- --port 3001`. No source changes.
- Fresh `/ar` load showed one remaining dev-overlay “Console Error: A tree hydrated but some attributes … didn't match”. The diff contained only `data-cursor-ref="eN"` attributes, which are injected by the Cursor browser tool's accessibility snapshot before React finished hydrating (the “browser extension modified the HTML before React loaded” case). A JS-triggered `location.reload()` with no pre-hydration snapshot produced **0 issues** in the overlay. Not an application bug; nothing changed.
- After the clean reload: 45 `.reveal` wrappers, 0 `is-visible` at top (hero fills the viewport), 5 `is-visible` after scrolling to 3600px; first project card mid-transition (`opacity 0.86`, `transitionDelay 0ms`) — animation PASS.
- Fetched from the tab: `/ar/projects/modern-wooden-kitchen-01`, `/ar/projects/walk-in-closet-05` → 200, `lang="ar" dir="rtl"`, 7 reveal wrappers each; `/ar`, `/en`, `/ru`, `/` → 200 with correct `lang`/`dir` and 45 reveal wrappers each — PASS.
- Browser hydration overlay on `/`, `/en`, `/ru` — still NOT TESTED (only `/ar` was loaded in the browser).
- Same stale-`.next` failure hit the Dashboard dev server on port 3000 (`TypeError: a[d] is not a function` from a minified production `webpack-runtime.js`, `GET / 500`) after the earlier `pnpm --filter @nora/dashboard build`. Fix: stopped the orphaned `next start-server.js` process, deleted `apps/Dashboard/.next`, restarted `pnpm --filter @nora/dashboard dev`. Verified: unauthenticated `GET /` → 307 to `/login`; `GET /login` → 200. No source changes.
- Lesson recorded: do not run `next build` for an app while its `next dev` server is running from the same `.next` directory; stop dev first or run the build in an isolated checkout.

---

## 2026-09-14 — Phases 3–8 (partial): data merge, mutations, translation apply, dark tokens

**Branch:** `main` (ahead of origin by 2; uncommitted working tree)  
**Sanity:** no dataset bootstrap, no bulk create, no `cms:bootstrap` write, no token printed.  
**Not in this slice:** production build (dev servers may be using `.next`), live Dashboard→Website E2E (needs a logged-in Save), live AI provider (no `TRANSLATION_API_KEY`).

### Issue / root cause (from PROJECT_AUDIT.md)

1. Website replaced entire seed collections when Sanity returned any items; Dashboard creates never showed because dataset empty **and** create required Hebrew title, dropped `_id`, hid unpublished, never attached images, never revalidated.
2. Translation 503 without key; review never wrote Sanity; unguarded `response.json()`.
3. Dark mode: `html.dark body` only; sections stayed white; OS auto-dark made text unreadable.

### Files changed

- `apps/web/lib/sanity/fetch.ts` — if `siteSettings` exists, CMS lists are authoritative; otherwise CMS items merge onto seed by slug/id.
- `apps/Dashboard/lib/server/content/schema.ts` — `assetIds`, material/blog extras, site phones; `ru` still omitted from patches.
- `apps/Dashboard/lib/server/content/mutate.ts` — return created `_id`; sanitized Sanity errors; gallery/image refs; title from he/ar/en; default `visible: true` on create; revalidate boolean.
- `apps/Dashboard/app/api/cms/route.ts` — `{ ok, id, revalidated }`.
- `apps/Dashboard/lib/cms-client.ts` — `slugFromLocalized`, parse `id`.
- `apps/Dashboard/lib/sanity/fetch.ts` — `api.sanity.io` + `cache: 'no-store'` (not CDN).
- `apps/Dashboard/app/api/content/route.ts` — editor+ only.
- `apps/Dashboard/lib/sanity/queries.ts`, `readTypes.ts`, `map.ts`, `lib/types.ts`, `AdminDataContext.tsx` — gallery asset ids; new project category `kitchens`, published true; `replaceProjectId`.
- `apps/Dashboard/components/admin/modules/ProjectsModule.tsx` — persist gallery assets; keep Sanity id after create.
- `apps/Dashboard/components/admin/shared.tsx`, `UsersModule.tsx`, `TranslationModule.tsx` — guarded JSON parse.
- `apps/Dashboard/app/api/translate/route.ts` — “applied” writes one locale field via `/api/cms` path (`applyMutation`); does not send `ru`.
- `apps/web/app/globals.css` — `--ng-*` tokens; dark remaps for surfaces/ink/cards/gradients; hero stays charcoal.
- `apps/web/components/ui/ThemeToggle.tsx` — default **light** unless `nora-theme=dark` (no OS auto-dark).

### Tests

- `pnpm --filter @nora/web typecheck` — PASS
- `pnpm --filter @nora/dashboard typecheck` — PASS (after fixing a syntax slip in `schema.ts` testimonial object)
- `pnpm --filter @nora/web lint` — PASS
- `pnpm --filter @nora/dashboard lint` — PASS
- `next build` — NOT TESTED (avoid corrupting running `.next`)
- Dashboard create-project E2E on Website — NOT TESTED
- AI provider call — BLOCKED (`TRANSLATION_API_KEY` absent)
- Dark mode in browser — NOT TESTED this slice
- Hydration `/` `/en` `/ru` — NOT TESTED this slice

### Remaining

- Set `SANITY_REVALIDATE_SECRET` + `WEBSITE_REVALIDATE_URL` (names only) for on-demand ISR.
- Optional `cms:bootstrap` after owner approval (§25 of audit).
- Remaining Dashboard modules still have some unsaved chrome fields (featured, completion date, nav/social).
- English chrome leftovers in several Dashboard forms.
- Provision translation key for live AI.

---

## 2026-09-14 — Website dark mode: unreadable text (root cause)

**Issue:** Enabling Dark Mode on the Website made body/heading ink cream while most sections and cards stayed `bg-white` / `bg-warm-50` with `text-charcoal-*`. Cream-on-white (and leftover white slabs on a dark body) made copy disappear and the page look broken.

**Root cause (not a missing `dark:` variant sweep):**
1. Theme is a manual `html.dark` class from `ThemeToggle` (`localStorage` key `nora-theme`). Tailwind `darkMode: 'class'`. The Website does **not** use `next-themes`.
2. `--ng-*` tokens on `html.dark` flipped `body` to cream ink on charcoal, and `h1–h6` used `text-foreground`.
3. Page sections still hard-coded light surfaces (`bg-white`, `bg-warm-50`) and charcoal text. Earlier remaps in `@layer components` could not override Tailwind utilities.
4. Utility classes such as `bg-white` / `text-charcoal-900` do not follow CSS variables, so they stayed light after `html.dark`.

**Fix:** One semantic token system (`background`, `foreground`, `card`, `muted` / `muted-foreground`, `border` → `--ng-*`). Light pages use those classes. Photo overlays, Hero, PageHero, Footer, CookieNotice, and the contact/footer QR white pad were left as-is (luxury charcoal bands and scannable QR). Opaque header/nav/language menu follow the same tokens. Theme still applies after mount (no `suppressHydrationWarning`, no blocking theme script).

**Files changed**
- `apps/web/app/globals.css` — tokens, `color-scheme`, body/heading `bg-background text-foreground`; dark `.btn-primary` / `.btn-secondary` kept
- `apps/web/tailwind.config.ts` — semantic colors
- `apps/web/components/ui/ThemeToggle.tsx` — opaque control uses `text-foreground`; `useHtmlDark()`
- `apps/web/components/ui/LanguageSelector.tsx` — dropdown `bg-card` / `text-foreground`
- `apps/web/components/layout/Header.tsx` — opaque chrome `bg-background`; dark-mode logo
- `apps/web/components/layout/BrandLockup.tsx` — light variant `text-foreground`
- `apps/web/components/home/HomeView.tsx` — light sections/cards to tokens (why/CTA charcoal bands unchanged)
- `apps/web/components/pages/ServicesView.tsx`, `ProjectsView.tsx`, `ProjectsGrid.tsx`, `HowWeWorkView.tsx`, `FaqView.tsx`, `TestimonialsView.tsx`, `AboutView.tsx`, `MaterialsView.tsx`, `ContactView.tsx`, `LegalView.tsx`, `NotFoundView.tsx`, `BlogView.tsx`, `ServiceDetailView.tsx`, `ProjectDetailView.tsx`, `BlogDetailView.tsx`

**Not changed:** Sanity data, Hero, PageHero, Footer (QR stays white), CookieNotice.

**Tests**
- `pnpm --filter @nora/web typecheck` — PASS
- `pnpm --filter @nora/web lint` — PASS
- `pnpm --filter @nora/web build` — PASS (dev server was stopped first; `.next` is now a production build)
- Browser dark `/ar` home intro/services/projects/about/contact/faq/how-we-work/materials/testimonials: charcoal surfaces, cream headings, muted secondary, contrast ≥ 4.5 on measured pairs — PASS
- Browser light `/` (he, `dir=rtl`): cream surface, charcoal ink, white cards — PASS
- Locales dark: `/` he RTL, `/ar` ar RTL, `/en` en-US LTR, `/ru` ru LTR — PASS
- Contact QR pad remains `bg-white` in dark — PASS
- Clean `location.replace('/ar')` without an a11y snapshot: Next portal present, no hydration-error copy — PASS
- Overlay “hydration mismatch” while the Cursor browser snapshot was attached: only extra `data-cursor-ref` attributes — identified separately, not an app bug; not hidden with `suppressHydrationWarning`
- Blog index, legal pages, 404, service/project/blog detail in the browser — NOT TESTED (same token mapping as tested list pages)
- Desktop (lg) nav row — NOT TESTED (viewport was the compact header)

**Remaining**
- Production `.next` from this build; start `pnpm --filter @nora/web dev` again before local UI work
- Blog / legal / 404 / detail routes still need a visual pass

---

## 2026-09-18 — Website PostgreSQL cutover (Sanity removed)

**Branch:** `cursor/postgres-website-cutover-89ec`  
**Scope:** Public website reads PostgreSQL. Dashboard CMS writes already used Prisma. Sanity Studio, GROQ, and `next-sanity` removed. Seed now includes the existing marketing catalog (projects, materials, testimonials, blog, FAQ).

**Also added:** shared `storage/media` for Dashboard uploads; public `GET /api/media/[id]` on the website; `REVALIDATE_SECRET` + `WEBSITE_REVALIDATE_URL` after CMS saves; blocking theme script to reduce dark-mode flash; `pnpm setup:local` and `LOCAL_SETUP.md`.

**Not in this phase:** Prisma User/Session auth (Owner still from env); Cloudflare R2; production deploy; live AI translation.

---

## 2026-09-18 — Local Postgres install recovery (Linux Mint dpkg)

**Branch:** `cursor/postgres-website-cutover-89ec`  
**Problem:** Dashboard Homepage stayed empty because `localhost:5432` was down. `apt` could not install PostgreSQL: `dpkg was interrupted`. `postgresql.service` was missing. Bracketed-paste junk (`^[[200~`) also broke `sudo`.

**Changes:** `scripts/fix-linux-dev.sh` runs `sudo dpkg --configure -a` before apt, starts `postgresql` or `postgresql@16-main`, and falls back to `docker compose` if the OS package still is not listening. `LOCAL_SETUP.md` documents the four repair commands. Dashboard copy now says empty fields are placeholders, not live site content.

**Not verified on the laptop:** `sudo dpkg --configure -a` and Postgres install require the machine owner's password. This agent cannot complete those commands remotely. The NVIDIA DKMS configure was interrupted by the operator; a colleague is expected to finish `dpkg`, install Postgres, and seed.

---

## 2026-09-18 — Colleague handoff README

**Branch:** `cursor/colleague-handoff-readme-89ec` (from `cursor/postgres-website-cutover-89ec`)  
**Change:** Added root `README.md` describing what already changed, local steps for the next person, and remaining production work. No application code in this commit. Secrets were not added.



