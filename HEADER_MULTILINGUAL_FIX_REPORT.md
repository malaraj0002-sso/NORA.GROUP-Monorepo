# Header multilingual fix report

**Date:** 18 September 2026  
**App:** `@nora/web`  
**Git:** no commit, no push.

## Root Cause

Desktop navigation turned on at Tailwind **`lg` (1024px)** with **`whitespace-nowrap`** links and **`overflow-x-auto`** (scrollbar hidden). English and Russian labels are much longer than Hebrew/Arabic. At 1024–1366px the middle grid column was narrower than the intrinsic link row.

Nav is `z-10`, logo is `z-20`. Overflow did not show a scrollbar; the first items painted **behind the lockup**.

Measured before the fix, Russian @ 1024×768:

- Logo right edge: **272px**
- First link «Главная» left: **204px** (under the wordmark)
- `nav.scrollWidth` 584 > `nav.clientWidth` 500

English @ 1366: link row ~679px vs 666px column (`scrollWidth` 679).

Not caused by Dark/Light, hydration, PostgreSQL, Hero, or absolute positioning of the logo.

## Files Changed

| File | Why |
|---|---|
| `apps/web/components/layout/Header.tsx` | Breakpoints, remove nav overflow-x, WhatsApp chip at `2xl`, drop extra logo scale wrapper |
| `apps/web/components/ui/LanguageSelector.tsx` | `shrink-0` on the wrapper so the control cannot be compressed |
| `HEADER_MULTILINGUAL_AUDIT.md` | Phase 7 audit |
| `HEADER_MULTILINGUAL_FIX_REPORT.md` | This report |

Unchanged: Prisma, Dashboard, Sanity, Hero, theme/hydration, CMS seed copy, `globals.css`, `tailwind.config.ts`.

## Fix

Same three-column luxury Header (`auto | minmax(0,1fr) | auto`).

1. **Desktop links from `xl` (1280px)** — hamburger until then (`xl:hidden` on the menu button and drawer).
2. **Removed `overflow-x-auto`** and scrollbar-hiding utilities. No Header horizontal scroll; no `overflow-hidden` mask.
3. **WhatsApp text chip from `2xl` (1536px)** so 1280–1535 uses leftover width for EN/RU labels.
4. Kept **`text-sm` / `px-2.5`** at all desktop sizes (a later `2xl:text-base` bump re-overflowed RU at 1920 with the chip; that bump was dropped).
5. Removed the Header wrapper **`hover:scale-105`** (BrandLockup still scales the image).
6. Logo and actions stay **`shrink-0`**; nav column stays **`min-w-0`**.

RTL/LTR still come from `<html dir>`. One Header for all locales.

## Locale Results

| Locale | Result |
|---|---|
| Hebrew | **PASS** — RTL desktop row at 1366; six links; no overlap |
| Arabic | **PASS** — RTL at 1366; logo on the right (1080–1287); actions on the left; no overlap |
| English | **PASS** — LTR at 1366; 143px gaps logo↔nav and nav↔actions |
| Russian | **PASS** — longest labels; 1024 compact; 1280/1366/1920 desktop with positive gaps |

## RTL / LTR

| | |
|---|---|
| he RTL | **PASS** |
| ar RTL | **PASS** (logo inline-end, actions inline-start) |
| en LTR | **PASS** |
| ru LTR | **PASS** |

## Responsive Results

| Width | Mode | Overlap | Overflow |
|---|---|---|---|
| 375 | Compact + drawer (opened OK) | none | none |
| 1024 | Compact (hamburger) | none | none (`scrollWidth` 1009 / 1024) |
| 1093 (~125% of 1366) | Compact | none | none |
| 1280 | Desktop, 6 RU links, 44px gaps | none | none |
| 1366 | Desktop EN/RU/HE/AR | none | none |
| 1920 | Desktop + WhatsApp chip; RU 55px gaps | none | none |

320–1279 use the existing drawer. 1280–1535 desktop without the chip. ≥1536 desktop with chip.

## Browser Zoom

CSS-pixel equivalents (browser zoom shrinks `innerWidth`):

| Zoom | Equivalent on 1366 laptop | Result |
|---|---|---|
| 80% | ~1708 — desktop | **PASS** (same as ≥1280) |
| 90% | ~1518 — desktop | **PASS** |
| 100% | 1366 measured | **PASS** |
| 110% | ~1242 — compact | **PASS** (hamburger, usable) |
| 125% | 1093 measured | **PASS** |
| 150% | ~911 — compact | **PASS** (same compact path as 1024) |

## Overflow

| Check | Result |
|---|---|
| Horizontal overflow | **PASS** (`scrollWidth` ≤ `innerWidth + 1` on tested widths) |
| Logo overlap | **PASS** |
| Navigation overlap | **PASS** |
| CTA overlap | **PASS** (chip only at 2xl; 1920 RU last link 55px from actions) |

Did not add `body { overflow-x: hidden }`.

## Build

| Command | Result |
|---|---|
| `pnpm typecheck` | **PASS** (web + dashboard, exit 0) |
| `pnpm --filter @nora/web lint` | **PASS** — no ESLint warnings or errors |
| `pnpm build` | **PASS** (exit 0). Web compiled; dashboard compiled. Local Prisma `P1010` “User was denied access on the database” logs during web page data are a **pre-existing local DB role issue**, not caused by this Header work. |

`pnpm dev` was stopped before the production build as requested.

## Hydration note (out of scope)

The Cursor embedded browser can still show a Next.js “1 Issue” overlay from injected `data-cursor-ref` attributes. **Existing issue — outside current Header scope.** Theme/hydration files were not modified.

## Scope Protection

| Area | Status |
|---|---|
| PostgreSQL | **NOT MODIFIED** |
| Dashboard | **NOT MODIFIED** |
| Sanity | **NOT REINTRODUCED** |
| Hero Slider | **NOT MODIFIED** |
| Dark Mode | **NOT MODIFIED** |
| Light Mode | **NOT MODIFIED** |
| Hydration | **NOT MODIFIED** |
