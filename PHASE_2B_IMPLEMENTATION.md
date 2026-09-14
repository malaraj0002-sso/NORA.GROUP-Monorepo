# Phase 2B implementation — read-only Dashboard → Sanity mapping

**Date:** 2026-09-14  
**Scope:** Server-side **reads** only. No mutations, auth, RBAC, schema changes, or new npm packages.

**JSON `Unexpected end of JSON input`:** empty/non-JSON Sanity HTTP bodies are handled as a failed read (mock fallback). The Studio `placeholder` project-id issue was **not reproduced**. **Not confirmed** as the same incident.

---

## Files created

| File | Role |
|------|------|
| `apps/Dashboard/lib/sanity/env.ts` | Public project/dataset/apiVersion only |
| `apps/Dashboard/lib/sanity/fetch.ts` | GET CDN query; empty-body / non-JSON / timeout handling |
| `apps/Dashboard/lib/sanity/queries.ts` | One static GROQ document (no user interpolation) |
| `apps/Dashboard/lib/sanity/readTypes.ts` | Raw Sanity payload types |
| `apps/Dashboard/lib/sanity/map.ts` | Map to `AdminData`; omit `ru`; strip doors |
| `apps/Dashboard/lib/sanity/read.ts` | `readDashboardContent()` — Sanity **or** mock, never merged |
| `apps/Dashboard/.env.example` | Public env **names** only (empty project id placeholder) |
| `PHASE_2B_IMPLEMENTATION.md` | This file |

## Files changed

| File | Change |
|------|--------|
| `apps/Dashboard/app/layout.tsx` | Async server layout; `readDashboardContent()` |
| `apps/Dashboard/lib/AdminDataContext.tsx` | `initialData` + `source`; no longer loads mock internally |
| `apps/Dashboard/components/admin/modules/OverviewModule.tsx` | Shows content source |
| `IMPLEMENTATION_LOG.md` | Phase 2B entry |

## Files not changed

Website app source, Sanity schemas, `mock-data.ts` (file kept), auth, mutations.

**No new dependencies.** Dashboard uses `fetch` to the public Sanity HTTP CDN (same public identifiers as the website). `next-sanity` was not added to `@nora/dashboard`.

---

## Mappings implemented (read-only)

| Area | Sanity | Dashboard |
|------|--------|-----------|
| Projects | `project` | `_id`, title, description, category **as stored**, gallery URLs, `materials`→`woodTypes`, `visible`→`published`. `featured`/`completedDate` empty. |
| Blog | `blogPost` | title, slug, excerpt, content, image, author, date→`publishedAt`, visible. **`tags` always `[]`** (not filled from `category`). |
| FAQ | `faqItem` | question, answer, order, visible. Category not on Dashboard type. |
| Testimonials | `testimonial` | name→`clientName`, rating, review→`text`, visible. Title/avatar empty. |
| Services | `service` | title, description, image, visible. `steps`/`icon` empty. **Doors filtered out.** |
| Materials | `material` | `name` = display string he→ar→en (not concatenated, **`ru` unused**). description locales he/ar/en. Specs/type empty. |
| Site | `siteSettings` | brandName, tagline, email, address, phoneDisplay→`contactPhone`, logo URL. Nav/footer/social empty arrays. |
| About | `aboutPage.body` | `story` only. vision/mission empty; featureBanners `[]`. |

Unmapped modules when `source === 'sanity'`: **heroSlides `[]`** (not mock slides).

---

## Mappings intentionally not implemented

Hero slider, nav/social/footer CMS, About vision/mission/feature icons, service steps/icons, material spec sheets, Dashboard project category taxonomy rewrite, How We Work module, UI Labels module.

---

## Sanity queries

- **Added:** `DASHBOARD_READ_QUERY` in `queries.ts` (one object with typed projections; `asset->url` for images).
- **Reused pattern:** public CDN, published dataset, no token — same idea as `apps/web/sanity/lib/client.ts`, not the same module (separate app).
- **Not reused:** website `lib/sanity/fetch.ts` (seed merge + ISR tags + website types).

No parameterized user input in this query.

---

## Localization

- Dashboard models remain `{ he, ar, en }`.
- Sanity `ru` is **never copied** into Dashboard objects and **never sent** (no writes).
- Russian in Sanity is untouched.
- No invented Russian.

---

## Error handling

`fetchSanityQuery` treats as failure (then mock fallback, doors stripped):

- missing/placeholder project id
- network/timeout (8s)
- empty body
- non-JSON body (`JSON.parse` only after non-empty text)
- HTTP / query error
- mapping throw

Client UI does not receive stack traces or tokens. `console.error` uses a short reason string.

**Sources are exclusive:** Sanity success → mapped CMS only. Failure → mock (doors removed from `services`). No blend of mock projects with Sanity services.

---

## Luxury Doors

- Not imported from mock into Sanity.
- `isForbiddenDoorService`: `svc-3`, `door-open`, slug/title matching door / דלת / باب.
- Applied to Sanity service maps **and** mock fallback services.

---

## Tests performed

| Check | Result |
|-------|--------|
| `pnpm --filter @nora/dashboard build` | **Success** (exit 0). Next typecheck during build passed. ISR 60s on `/`. |
| `pnpm typecheck:dashboard` | **Success** (exit 0) this run |
| `pnpm lint:dashboard` | **Success** — no ESLint warnings |
| `pnpm typecheck:web` | **Failed** — React 18 vs 19 `ReactNode` in generated `.next/types` and existing views. **No website files were edited in 2B.** |
| `pnpm --filter @nora/web build` | **Failed** after “Compiled successfully” on the same dual-`@types/react` error. Not a 2B website source change. |
| `pnpm lint:web` | **Not run** (known missing ESLint config / interactive prompt) |
| Browser click-through of Dashboard | **Not tested.** |
| Whether live Sanity documents loaded vs mock | **Not confirmed in a browser.** Build used `apps/Dashboard/.env.local` if present; values were **not read** for this log. |
| Unexpected end of JSON input | **Not confirmed.** |

---

## Remaining limitations

- In-memory Dashboard CRUD still exists; **does not persist** to Sanity.
- Hero/nav/etc. empty when Sanity is the source.
- Project categories display Sanity enums (`kitchens`, …) in a UI built for `Residential`, …
- Material name is a single display string.
- Website `tsc` / `next build` typecheck currently fail in this workspace due to mixed React types (pre-existing monorepo issue; Phase 1 web **build** had passed).
- Dashboard needs its own public Sanity env vars (does not load `apps/web/.env.local`).

**STOP.** No auth, mutations, or schema work.
