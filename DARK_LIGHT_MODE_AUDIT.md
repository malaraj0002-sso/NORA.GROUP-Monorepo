# Dark / Light Mode Audit

**Date:** 18 September 2026  
**App:** `@nora/web` (`apps/web`)  
**Mode:** Investigation complete before implementation.

## 1. Executive Summary

The Website does **not** use `next-themes`. Theme is a custom `html.dark` class, Tailwind `darkMode: 'class'`, CSS variables on `html.dark`, `localStorage` key `nora-theme`, and a **blocking inline script** in `LocaleLayout`.

React 19 hydrates `<html>` from the Server Component `className`, which **never** includes `dark`. Before hydration, the inline script reads `localStorage` and **adds** `dark` to `document.documentElement`. The DOM then has `font-hebrew dark` while React expects `font-hebrew`. That is the reported mismatch:

```
+ className="… font-hebrew"          ← client / React
- className="… font-hebrew dark"     ← DOM after the script
```

`lang` and `dir` match. The extra `dark` class is the only conflicting attribute.

## 2. Root Cause

**Confirmed:** The anti-FOUC script in `apps/web/app/[locale]/layout.tsx` mutates `<html class>` after SSR HTML is parsed and before React hydrates. `LocaleLayout` is a Server Component; its `className` is fonts + `font-hebrew` / `font-arabic` only. React owns that `className`. The script is not part of React’s tree, so React 19 reports a hydration error and does not patch the mismatch.

Evidence:

- Layout SSR `className` is `` `${fontClass}${locale === 'ar' ? ' font-arabic' : locale === 'he' ? ' font-hebrew' : ''}` `` — no `dark`.
- Inline script: `if(localStorage.getItem('nora-theme')==='dark')document.documentElement.classList.add('dark')`.
- `ThemeToggle` also toggles `html.dark` in `useEffect` (after mount). That is too late to cause this overlay; the overlay names `LocaleLayout` / `<html>`.
- Overlay class lists match Next font CSS variables + `font-hebrew` ± `dark`.

Not the cause: PostgreSQL cutover, Sanity, next-intl `lang`/`dir`, Dashboard `next-themes`, `prefers-color-scheme` (unused for theme), Hero slider.

## 3. Theme Architecture

**Current (broken for hydration):**

```
Server LocaleLayout
  → <html lang dir className={fonts only}>     // never "dark"
  → <head><script> localStorage → classList.add('dark')
  → <body>
       NextIntlClientProvider
         SiteProvider
           Header → ThemeToggle (client, after mount)
           pages (bg-background / html.dark tokens)
```

```
Tailwind darkMode: 'class'
globals.css :root tokens + html.dark token override
No ThemeProvider
No next-themes on the Website
```

Dashboard (`apps/Dashboard`) has its own `next-themes` `ThemeProvider`. Separate app, separate port, no shared `<html>`.

**Intended after fix:** cookie `nora-theme` is the source of truth the **server can read**. SSR `<html>` already has `dark` when the cookie is `dark`. No pre-hydration DOM mutation. Client toggle updates class + cookie + localStorage (migration). Light/Dark only — no System mode (the current product is a stored light/dark choice, not `prefers-color-scheme`).

```
Request Cookie nora-theme
  → Server LocaleLayout className includes "dark" iff cookie === dark
  → <html lang dir fonts [dark]>
  → ThemeProvider initialTheme={cookie}
  → CSS html.dark / Tailwind class
  → Components (tokens + intentional charcoal bands)
```

## 4. Hydration Analysis

| Step | `<html class>` |
|---|---|
| Next SSR of `LocaleLayout` | fonts + `font-hebrew` (no `dark`) |
| Browser parses HTML, runs inline script (user previously chose dark) | adds `dark` |
| React 19 hydrates `LocaleLayout` | expects fonts + `font-hebrew` |
| Compare | **mismatch** |

`ThemeToggle` starts `useState(false)` and returns an empty `span` until mount so its **own** tree matches SSR. That does not protect `<html>`, which the script already changed.

`useHtmlDark()` also starts `false`, so the header logo can be wrong for one frame in dark mode even after hydration “succeeds” with a warning.

`suppressHydrationWarning` is **not** used on Website `<html>` today (correct). The fix must make SSR `className` equal to the hydrated `className`, not hide the warning.

## 5. Files Responsible

| File | Role |
|---|---|
| `apps/web/app/[locale]/layout.tsx` | Owns `<html>`/`<body>`; fonts; **inline theme script**; locale `lang`/`dir` |
| `apps/web/app/layout.tsx` | Pass-through; no html |
| `apps/web/components/ui/ThemeToggle.tsx` | localStorage + `classList.toggle('dark')`; placeholder until mount |
| `apps/web/components/layout/Header.tsx` | `useHtmlDark()` for logo; hosts toggle |
| `apps/web/app/globals.css` | `--ng-*` tokens; `html.dark`; button dark variants |
| `apps/web/tailwind.config.ts` | `darkMode: 'class'`; maps background/foreground/card/muted/border |
| `apps/web/package.json` | No `next-themes` |
| `apps/web/components/providers/SiteProvider.tsx` | Chrome copy only, not theme |
| `apps/Dashboard/app/providers.tsx` | Unrelated Dashboard theme |

Hardcoded charcoal/white on Hero, PageHero, Footer, CookieNotice, photo overlays, QR pad (`bg-white`) is **intentional** luxury chrome, not a second theme system.

## 6. Problems Found

### Critical

1. Inline `localStorage` script vs React-owned `<html className>` → hydration mismatch when theme is dark.

### High

2. First paint for dark users: script paints dark, React then disagrees; overlay / “won’t be patched” on `html`.
3. `ThemeToggle` delayed mount (empty 40×40 slot) causes a small header layout shift.

### Medium

4. Theme lives only in `localStorage`, so the server cannot emit a matching `dark` class. Any blocking script that “fixes” FOUC will fight hydration.
5. `useHtmlDark` initial `false` disagrees with a dark `<html>` after the script.

### Low

6. `framer-motion` still a Website dependency (unused by Hero); unrelated.
7. Dashboard `next-themes` System mode is a different product; do not copy it onto the marketing site.

## 7. Recommended Architecture

**Single source of truth:** cookie `nora-theme=light|dark` (path `/`, `SameSite=Lax`, long max-age). Readable in `LocaleLayout` via `cookies()`.

- SSR: append `dark` to `<html className>` when cookie is `dark`.
- Remove the inline script. Do not mutate `documentElement` before hydration.
- Client `ThemeProvider` receives `initialTheme` from the server; first client state matches SSR.
- Toggle: update React state, `classList`, cookie, and `localStorage` (so old keys still migrate).
- After mount only: if cookie was missing and `localStorage` is `dark`, apply dark and write the cookie (one FOUC for pre-cookie users, no hydration error).
- Light / Dark only. No System.
- Do not add `next-themes`.
- Do not use `suppressHydrationWarning` for this.

`lang` / `dir` stay locale-driven and independent of theme.

## 8. Validation Plan

After the fix:

- Hebrew `/` RTL light + dark: no `html` class mismatch overlay.
- `/ar` RTL, `/en` LTR, `/ru` LTR, both themes.
- Toggle Light → Dark → Light without reload; refresh keeps choice; locale change keeps theme; new tab keeps cookie.
- Header, Hero (photo + overlay + copy), cards, footer, forms, language menu, mobile menu readable in both themes.
- Hero slider still autoplays; dots work; no hydration overlay on Hero.
- `pnpm typecheck`; `pnpm build` if `.next` is not owned by a conflicting `next build` (dev server may be running).
- PostgreSQL loaders / Sanity absence / seven services unchanged.

---

Implementation follows this document.
