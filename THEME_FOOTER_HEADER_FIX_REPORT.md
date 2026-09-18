# Theme Footer / Header Fix Report

**Date:** 19 September 2026  
**App:** `@nora/web` (`apps/web`)  
**Git:** no commit, no push.

This report covers two Website-only visual bugs: the Footer QR in Dark Mode, and Light Mode Header contrast when the sticky Header sits over the Footer.

## 1. Exact root cause of QR disappearance

The Footer QR is a real black-on-white JPEG at `apps/web/public/qr.jpg` (362×210). The Footer always uses `bg-charcoal-950` (`#0f1012`) in both themes.

The QR was already wrapped in `bg-white/95` plus `backdrop-blur-md`. That is not a missing image and not a `dark:` invert. Live `/_next/image?url=%2Fqr.jpg` returned the original JPEG.

Unreadability in Dark Mode came from three stacked presentation issues:

1. **Small rendered code.** The asset is a wide 362×210 JPEG forced into an 80×80 `object-contain` box. Most of the 80×80 is empty cream/white letterboxing; the actual QR modules occupy a small center region.
2. **Soft compositing.** `bg-white/95` + `backdrop-blur-md` over charcoal and gold glow blobs reduced edge contrast of those already-small modules.
3. **`html.dark { color-scheme: dark }`.** A light JPEG inside a dark color-scheme document can be darkened by the user agent. That is a presentation risk, not a data/source change.

There was no `dark:` class, `invert()`, `mix-blend-*`, or filter on the Footer QR image itself.

## 2. Exact root cause of Header text disappearing / low contrast

This was not a Footer CSS-variable leak, not a blend mode, and not a Header text-color bug.

Proven chain:

1. The Header is `fixed` / `z-50`. After `window.scrollY > 40` it leaves the home-only transparent gradient and applies scrolled chrome.
2. Scrolled chrome used Tailwind `bg-background/95`.
3. Tailwind `background` is `var(--ng-surface)`, a hex CSS variable (`#fdfbf7` light / `#0f1012` dark).
4. Tailwind v3 opacity modifiers compile that to an invalid color (`rgb(var(--ng-surface) / 0.95)`). The computed Header background was **`rgba(0, 0, 0, 0)`** while the class string still contained `bg-background/95`.
5. Scrolled Header text correctly uses `text-foreground` → `--ng-ink` (`#1a1c20` in Light Mode).
6. The Footer is always charcoal `#0f1012` in both themes. In Light Mode the sticky Header therefore painted **dark ink on a transparent surface over a dark Footer**.

The gold logo mark stayed visible. Brand wordmark, nav, language control, theme toggle, and hamburger blended into the Footer.

Dark Mode hid the same hole: dark ink tokens become light (`#f6f1e8`), so transparent chrome over the dark Footer still read. The defect is Light Mode + scrolled/non-home Header + always-dark Footer.

## 3. Files inspected

| File | Why |
|---|---|
| `apps/web/components/layout/Footer.tsx` | QR markup, Footer surface, glow overlays |
| `apps/web/components/layout/Header.tsx` | Sticky Header, scroll state, transparent vs chrome classes |
| `apps/web/components/layout/BrandLockup.tsx` | Brand color variants (`text-foreground` / `text-warm-50`) |
| `apps/web/components/ui/ThemeToggle.tsx` | Header control colors |
| `apps/web/components/ui/LanguageSelector.tsx` | Header control colors |
| `apps/web/components/providers/ThemeProvider.tsx` | Cookie / `html.dark` / localStorage theme owner |
| `apps/web/lib/theme.ts` | `nora-theme` cookie helpers |
| `apps/web/app/[locale]/layout.tsx` | SSR `html.dark` from cookie; shared Header + Footer |
| `apps/web/app/globals.css` | `--ng-*` tokens, `color-scheme`, component utilities |
| `apps/web/tailwind.config.ts` | `darkMode: 'class'`; `background` / `foreground` maps |
| `apps/web/lib/content/media.ts` | `mediaSrc()` QR path sanitization |
| `apps/web/lib/constants.ts` | `CONTACT_DEFAULTS.qrPath` = `/qr.jpg` |
| `apps/web/components/pages/ContactView.tsx` | Separate contact-page QR (already on `bg-white`) |
| `apps/web/public/qr.jpg` | Source asset 362×210 |

Not changed and confirmed out of scope: PostgreSQL, Prisma, Dashboard, Hero, Sanity, Header breakpoints, ThemeProvider, `[locale]/layout.tsx`.

## 4. Files changed

| File | Change |
|---|---|
| `apps/web/app/globals.css` | Added `.site-chrome` (opaque `--ng-surface`) and `.qr-plate` (solid white, `color-scheme: light`, `isolation`) |
| `apps/web/components/layout/Header.tsx` | Scrolled / non-home class: `bg-background/95 backdrop-blur-md` → `site-chrome` |
| `apps/web/components/layout/Footer.tsx` | QR wrapper: `bg-white/95 backdrop-blur-md hover:scale-105` → `qr-plate`; same `/qr.jpg` via `mediaSrc` |

## 5. Exact nature of the fix

**Header.** When the Header is not the home-top transparent overlay, it now uses `.site-chrome { background-color: var(--ng-surface); }`. That is an opaque semantic surface, not a Tailwind opacity modifier on a CSS-variable color. Light Mode chrome is cream `#fdfbf7` with ink `#1a1c20`. Dark Mode chrome is `#0f1012` with ink `#f6f1e8`. Sticky/fixed behavior, scroll threshold (`> 40`), home transparent gradient, breakpoints, and nav structure are unchanged.

**QR.** The original JPEG and destination are unchanged (`mediaSrc(settings.qrUrl, '/qr.jpg')`, `h-20 w-20 object-contain`). The plate is a stable light square: white background, `color-scheme: light` so `html.dark` cannot UA-darken the JPEG, `isolation: isolate`, gold border retained, hover scale removed so the code does not shift. No `invert()` filter.

The Contact page QR already sat on `bg-white` and was left alone.

## 6. Why the fix is theme-safe

- No second theme system and no new theme library.
- No blocking theme script in `[locale]/layout.tsx`.
- `ThemeProvider` still owns `html.dark`, the `nora-theme` cookie, and localStorage.
- Header chrome follows `--ng-surface` / `--ng-ink` instead of hardcoded Light-only colors, so Dark Mode stays correct.
- QR plate is intentionally theme-stable (always light) because a black-on-white QR must stay high-contrast.
- Footer remains the existing charcoal luxury surface in both themes.

## 7. Light Mode verification

Production server (`next start -p 3001`) after the fix:

| Surface | Computed |
|---|---|
| Scrolled Header background | `rgb(253, 251, 247)` (`--ng-surface`) |
| Brand / nav | `rgb(26, 28, 32)` (`--ng-ink`) |
| Footer | `rgb(15, 16, 18)` |
| QR plate | `rgb(255, 255, 255)`, `color-scheme: light`, 98×98 square |
| QR image box | 80×80, not clipped |

Verified scrolled Light chrome on `/en`, `/en/about`, `/en/services`, `/en/services/kitchens`, `/`, `/ar`, `/ru`. Contact was checked earlier in the same fix session. Home-top transparent gradient is unchanged and still uses light-on-dark overlay colors.

## 8. Dark Mode verification

After `html.dark` and the 500ms Header transition:

| Surface | Computed |
|---|---|
| Scrolled Header background | `rgb(15, 16, 18)` |
| Brand | `rgb(246, 241, 232)` |
| QR plate | still `rgb(255, 255, 255)` |
| QR image | still 80×80 square, original `/qr.jpg` |

Fresh Dark load, Light → Dark, and Dark → Light were exercised by toggling `html.dark` / the `nora-theme` cookie. ThemeProvider and layout were not modified, so the existing cookie SSR path is unchanged.

## 9. HE / AR / EN / RU verification

| Locale | Path | Dir | Scrolled Header | QR plate |
|---|---|---|---|---|
| English | `/en`, `/en/about`, `/en/services`, `/en/services/kitchens` | LTR | cream + dark ink | white |
| Hebrew | `/` | RTL | cream + dark ink | white |
| Arabic | `/ar` | RTL | cream + dark ink | white |
| Russian | `/ru` | LTR | cream + dark ink | white |

Header and Footer are mounted once in `apps/web/app/[locale]/layout.tsx`, so remaining public routes (projects, project detail, materials, how-we-work, testimonials, blog, FAQ, contact, legal) share the same chrome. Those routes were not each individually scrolled in the production pass; the shared layout is the same components.

No RTL flip of the English wordmark (BrandLockup keeps `dir="ltr"` on the inner lockup).

## 10. Responsive verification

Live device-metrics checks:

| Width | Page | Header chrome | QR | Overflow |
|---|---|---|---|---|
| 375 | `/en/about` | `rgb(253, 251, 247)`, dark ink | 98×98 plate, 80×80 image, not clipped | `scrollWidth === 375` |
| 1440 | home + inner pages above | same tokens | same plate | no horizontal overflow |

Header/QR colors are not width-specific. There is no media-query recolor of `.site-chrome` or `.qr-plate`. Widths 390, 430, 768, 1024, 1280, and 1920 were not each emulated as a separate screenshot pass; they use the same chrome CSS.

Breakpoints and Header grid were not changed.

## 11. Typecheck result

```
pnpm typecheck:web
```

**Passed** (`tsc --noEmit`, exit 0).

## 12. Lint result

```
pnpm --filter @nora/web lint
```

**Passed** (`✔ No ESLint warnings or errors`).

## 13. Build result

Website dev server was stopped so it would not lock `.next`. Then:

```
pnpm build
```

**Passed.**

- `@nora/web` Next.js 15.5.25 production build compiled, linted, and generated 87 static pages.
- `@nora/dashboard` production build also compiled (root `pnpm build` runs both). Dashboard source was not edited for this task.

## 14. Remaining limitations

- The source QR JPEG is **362×210**, not square. `object-contain` inside 80×20 padding keeps aspect ratio, so the scannable modules stay smaller than the plate. The image was not cropped or replaced.
- The Footer is still charcoal in Light Mode by existing brand design. That is why the Header needed an opaque surface instead of remaining transparent.
- Home at `scrollY <= 40` still uses the intentional transparent dark gradient. That path is not the Footer-contrast bug.
- `hover:bg-foreground/10` on Header links can still fail the same Tailwind CSS-variable opacity limitation. It only affects a hover wash, not default readability, and was left untouched.
- Contact-page QR (`ContactView`) already uses a white plate and was not part of this Footer bug.
- Not every listed inner route was scrolled in the production browser pass; they share the locale layout Header/Footer.

No PostgreSQL, Prisma, Dashboard, Hero, or Sanity changes. No doors content. No commit. No push.
