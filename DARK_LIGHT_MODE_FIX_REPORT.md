# Dark / Light Mode Fix Report

**Date:** 18 September 2026  
**App:** `@nora/web` (`apps/web`)  
**Git:** no commit, no push.

## 1. Root Cause

The hydration overlay named `LocaleLayout` / `<html>` because a **blocking inline script** in `apps/web/app/[locale]/layout.tsx` mutated `document.documentElement` **after SSR and before React 19 hydrated**.

- Server `className` was fonts + `font-hebrew` / `font-arabic` only. It never included `dark`.
- Script: if `localStorage['nora-theme'] === 'dark'` then `classList.add('dark')`.
- React then compared its props (`… font-hebrew`) to the DOM (`… font-hebrew dark`) and reported:

```
<html lang="he" dir="rtl"
+ className="… font-hebrew"
- className="… font-hebrew dark"
>
```

Evidence:

- Layout owned `<html>` as a Server Component.
- The script was not part of the React tree, so React would not “patch” the class.
- `lang` and `dir` matched. Only `dark` conflicted.
- PostgreSQL cutover, Sanity, next-intl, Dashboard `next-themes`, and `prefers-color-scheme` were not involved.
- Confirmed after the fix: SSR with `Cookie: nora-theme=dark` emits `class="… font-hebrew dark"`; `nora-theme=light` omits `dark`.

A second, unrelated leftover: `BrandLockup` set `dir="ltr"` on the next-intl `Link`. That could mismatch on RTL pages. It did **not** produce the original `html.dark` error.

## 2. Files Changed

| File | Change |
|---|---|
| `apps/web/app/[locale]/layout.tsx` | Read `nora-theme` cookie; put `dark` on `<html>` when cookie is dark; wrap chrome in `ThemeProvider`; **removed** the blocking script |
| `apps/web/lib/theme.ts` | **New.** Cookie/storage helpers, `parseTheme`, `themeCookieString` |
| `apps/web/components/providers/ThemeProvider.tsx` | **New.** Client source of truth after SSR; toggle writes class + cookie + localStorage |
| `apps/web/components/ui/ThemeToggle.tsx` | Uses context immediately (no empty placeholder span) |
| `apps/web/components/layout/BrandLockup.tsx` | `dir="ltr"` moved from `Link` to an inner `<span>` |
| `DARK_LIGHT_MODE_AUDIT.md` | Phase 2 investigation (no implementation in that file) |
| `DARK_LIGHT_MODE_FIX_REPORT.md` | This report |

Not changed: Prisma, PostgreSQL data, Dashboard, Hero slider implementation, Tailwind `darkMode: 'class'`, `globals.css` tokens, SEO/JSON-LD, service list.

## 3. Fixes Implemented

1. **Cookie is the SSR-readable source of truth.** `LocaleLayout` calls `cookies().get('nora-theme')` and appends ` dark` to `<html className>` only when the value is `dark`. First React hydration matches the HTML.
2. **Removed the anti-FOUC script.** No pre-hydration `classList` mutation.
3. **ThemeProvider** starts with `initialTheme` from the server. Toggle updates `html.dark`, cookie (`Path=/; Max-Age=31536000; SameSite=Lax`), and `localStorage`. After mount, if the cookie is missing and legacy `localStorage` is `dark`, migrate once (possible one-frame flash for old users only; no hydration mismatch).
4. **ThemeToggle** renders the button on the first client paint from context (moon/sun, `aria-label`, focus ring). No 40×40 empty slot.
5. **BrandLockup** keeps the English wordmark LTR without putting `dir` on next-intl `Link`.
6. **No `suppressHydrationWarning` on `<html>`.**
7. **No `next-themes` on the Website.** Light/Dark only. No System mode.
8. Dashboard theme left untouched.

## 4. Theme Architecture After Fix

```
Request Cookie nora-theme=light|dark
  → LocaleLayout (Server)
      <html lang dir fonts [dark]>
      <body>
        NextIntlClientProvider
          ThemeProvider initialTheme={cookie}
            SiteProvider
              Header / pages / Footer
                ThemeToggle → class + cookie + localStorage
  → Tailwind darkMode: 'class'
  → globals.css :root tokens + html.dark overrides
```

`lang` / `dir` remain locale-only. Theme never changes RTL/LTR.

## 5. Light Mode Validation

Hebrew `/` first paint (no dark cookie):

- `<html lang="he" dir="rtl" class="… font-hebrew">` (no `dark`)
- Body `background: rgb(253, 251, 247)` (`--ng-surface`)
- Toggle: “Switch to dark theme” (moon)
- Hero kitchen image loaded; overlay copy readable (white on photo)
- RTL chrome; “Nora Group” wordmark stays LTR
- No `html.dark` hydration overlay on that load

Hardcoded charcoal Hero/Footer/photo overlays left as luxury chrome (intentional, not inverted).

## 6. Dark Mode Validation

After toggle:

- `<html class="… font-hebrew dark">`
- Cookie `nora-theme=dark`
- Body `background: rgb(15, 16, 18)`, text `rgb(246, 241, 232)`
- Toggle: “Switch to light theme” (sun), visible on transparent and solid headers
- About: dark header, gold eyebrow, white title on photo, readable
- Contact: same; WhatsApp / phone CTAs remain visible
- Buttons keep gold / charcoal / WhatsApp treatments; `html.dark` primary/secondary variants in `globals.css` still apply

Not a full visual pass of every inner route at every breakpoint (see Remaining Issues).

## 7. Locale Validation

| Locale | URL | SSR `<html>` (dark cookie) | Browser |
|---|---|---|---|
| he | `/` | `lang="he" dir="rtl" … font-hebrew dark` | RTL, theme persisted |
| ar | `/ar` | `lang="ar" dir="rtl" … font-arabic dark` | RTL Arabic copy, theme persisted |
| en | `/en` | `lang="en-US" dir="ltr" … dark` | LTR English copy, theme persisted |
| ru | `/ru` | `lang="ru" dir="ltr" … dark` | LTR Russian copy, theme persisted |

SSR light Hebrew: `lang="he" dir="rtl" … font-hebrew` (no `dark`).

Seven services on all locales (kitchens, bedrooms, wardrobes, walk-in closets, custom furniture, offices, commercial). No doors.

Locale change did not drop `dark` or flip `dir` incorrectly.

## 8. Hero Slider Validation

- CSS stacked opacity slider unchanged (no Framer rewrite in this task)
- Images resolve through `/_next/image` (`hero-kitchen.jpg`, `living.jpg`, `hero-kitchen-2.jpg`, `kitchen-white.jpg`, `wardrobe.jpg`) with `complete: true` and non-zero width
- Autoplay advanced (dots moved from slide 1 toward later slides)
- Manual “Go to slide 2” set `aria-current` on that control
- Dark overlay + white/gold copy remained readable in both themes
- No Hero-named hydration overlay

## 9. Hydration Validation

**Original `html` className mismatch: resolved.**

Proof:

- Light cookie SSR: `class="… font-hebrew"`
- Dark cookie SSR: `class="… font-hebrew dark"`
- Client `ThemeProvider` first state equals that cookie
- No blocking script
- After BrandLockup fix, Hebrew/English/Russian/Contact snapshots often had **no** “Open issues overlay” control

The Cursor embedded browser **injects `data-cursor-ref`** on links/buttons before React hydrates. When the red “1 Issue” badge appeared, the overlay diff was:

```
<a … href="/">
- data-cursor-ref="e0"
```

That is a **test-harness artifact**, not `html.dark`, and will not appear in a normal browser. It is not hidden with `suppressHydrationWarning`.

## 10. Build / Typecheck

| Command | Result |
|---|---|
| `pnpm typecheck:web` (`tsc --noEmit`) | **PASS** (exit 0) |
| `pnpm --filter @nora/web lint` | **PASS** — `No ESLint warnings or errors` |
| `pnpm build` / `pnpm build:web` | **NOT RUN** — `pnpm dev` is already using `apps/web/.next`. A production build would overwrite that cache and break the running Website. |

## 11. Remaining Issues

1. **Production build not executed** in this session (dev server owns `.next`).
2. **Viewport matrix** 320–1920 was not screenshot-tested; checks used the default desktop embedded browser.
3. **Reveal** still starts at `opacity: 0` until IntersectionObserver. Fast scroll in Dark Mode can look like an empty charcoal band until the section intersects. Pre-existing; not a theme-class bug.
4. **Cursor `data-cursor-ref`** can still raise a Next.js overlay **inside this automation browser only**.
5. First visit after the cookie migration, a user who only had `localStorage=dark` may see one light frame, then dark. No hydration error.
6. Full contrast audit of every inner template (blog, FAQ, materials, 404, mobile drawer at 320px) was not exhaustive. Tokens (`--ng-surface`, `--ng-ink`, `--ng-border`) cover most chrome; photo overlays and the QR pad stay high-contrast by design (`bg-white` under the QR).

Do not treat this as 100% coverage of every page at every breakpoint.

## Integrity

- PostgreSQL remains the Website CMS. No Prisma schema or production data edits.
- No Sanity packages or client code in `apps/web`.
- Doors remain excluded (`lib/constants.ts`, contract tests still reject door slugs).
- Dashboard `next-themes` unchanged.
