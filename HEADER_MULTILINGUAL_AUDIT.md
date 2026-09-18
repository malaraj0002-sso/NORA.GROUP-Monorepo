# Header multilingual / responsive audit

**Date:** 18 September 2026  
**App:** `@nora/web`  
**Mode:** Investigation complete before implementation. Header/nav only.

## 1. Current Header architecture

```
<header> fixed inset-x-0 z-50
  └── .container-luxury
        CSS grid: grid-cols-[auto_minmax(0,1fr)_auto]
        h-20 / sm:h-24, gap-3 / sm:gap-4
        ├── [auto] Logo (z-20, shrink-0)
        │     BrandLockup: image + “Nora Group” wordmark (dir=ltr inner span)
        ├── [1fr] Desktop <nav> (z-10)
        │     hidden until lg (1024px)
        │     flex, nowrap links, overflow-x-auto (scrollbar hidden)
        └── [auto] Actions (z-20, shrink-0)
              LanguageSelector | ThemeToggle | WhatsApp CTA (xl+) | Hamburger (until lg)
Mobile overlay: full-screen charcoal drawer, lg:hidden
```

It is **CSS Grid**, not a wrapping flex row. Direction comes from `<html dir>`, not a second Header.

Desktop links (6): Home, About, Services, Projects, How We Work, Contact. Extra IA (materials, blog, FAQ, testimonials) is mobile/footer only.

## 2. Root cause of overlap

**Confirmed in the running Website at 1024×768, locale `ru`:**

| Box | x | width | right |
|---|---|---|---|
| Logo | 48 | 224 | **272** |
| Nav column | 288 | 500 | 787 |
| First link «Главная» | **204** | 77 | **281** |
| Last link «Связаться с нами» | 727 | 144 | 871 |

- `Главная` left **204** < logo right **272** → the first item paints **through/behind** the lockup.
- `nav.scrollWidth` 584 > `nav.clientWidth` 500.
- Nav uses `overflow-x-auto` + hidden scrollbars + `z-10`; logo is `z-20`. Overflow is not a visible scrollbar; it is clipped/stacked **under the logo**.
- Screenshot: wordmark, then «О нас» — «Главная» is missing because it sits under “Nora Group”.

English at **1366×768**: links already need ~679px; the middle column is 666px (`scrollWidth` 679). Screenshot shows Home jammed against the wordmark; How We Work / Contact / WhatsApp are squeezed off the right of a typical laptop crop.

**Why Hebrew looks fine and EN/RU do not:** desktop nav is `whitespace-nowrap` and turns on at Tailwind `lg` (1024px) for every locale. Hebrew/Arabic labels are short (`אודות`, `שירותים`). English/Russian are long (`How We Work`, `Связаться с нами`). Same breakpoint, different intrinsic width.

Not the cause: Dark/Light, ThemeProvider, PostgreSQL, Hero, absolute logo (logo is **not** `position: absolute`; it only *looks* overlapped because of overflow + z-index).

## 3. Affected locales

| Locale | Dir | Typical desktop labels | Overlap risk |
|---|---|---|---|
| he | RTL | Short | Low at 1024+ |
| ar | RTL | Short–medium | Low–medium |
| en | LTR | Longer (`About Us`, `Our Services`, `How We Work`, `Contact Us`) | High |
| ru | LTR | Longest (`Как мы работаем`, `Связаться с нами`) | **Highest** |

Switching he → en/ru at 100% zoom on a ~1024–1366 window is the reported path.

## 4. Affected viewport sizes

Desktop nav is `lg:flex` (1024px). WhatsApp chip is `xl:inline-flex` (1280px). Link type becomes `xl:text-base` / `xl:px-3.5` at the same moment the chip appears.

| Width | What happens |
|---|---|
| ≤1023 | Hamburger. Logo + language + theme. OK. |
| **1024–1279** | Six nowrap links, no WhatsApp chip. **EN/RU overflow behind logo.** |
| **1280–1440** | Links get larger padding/type **and** WhatsApp chip. 1366 laptop is the worst “full desktop” squeeze. |
| ≥1536 | Enough leftover width if overflow is removed. |

## 5. Affected browser zoom

Zoom shrinks CSS pixels (`1366 @ 125% ≈ 1093`, `@ 150% ≈ 911`). Those widths fall into the 1024–1279 band (or below `lg`), so 100–125% on a laptop reproduces the same overlap. 80–90% on a wide monitor is usually OK because more CSS pixels are available.

## 6. Exact files responsible

| File | Role |
|---|---|
| `apps/web/components/layout/Header.tsx` | Grid, breakpoints, overflow, z-index, CTA, hamburger |
| `apps/web/components/layout/BrandLockup.tsx` | Logo + wordmark (~224px, `shrink` not applied on header wrapper beyond parent) |
| `apps/web/components/ui/LanguageSelector.tsx` | Globe + locale name from `sm` |
| `apps/web/components/ui/ThemeToggle.tsx` | 40×40; **do not change** (out of scope except Header classes that wrap it) |
| `apps/web/lib/nav.ts` | Which 6 links are desktop |
| `apps/web/lib/content/seed.ts` | Label copy (do not edit CMS copy) |
| `apps/web/app/globals.css` | `.container-luxury` padding / max-width 1440 |
| `apps/web/app/[locale]/layout.tsx` | Renders `<Header />` only — no Header layout logic |

## 7. CSS / layout problems

1. Desktop nav at **`lg` (1024)** is too early for EN/RU nowrap labels.
2. **`overflow-x-auto` + hidden scrollbar** lets items occupy space under the logo instead of wrapping or collapsing to the drawer.
3. **`z-10` nav vs `z-20` logo** makes overflow look like “behind the logo”.
4. **`whitespace-nowrap`** is correct for a luxury nav; it must be paired with a breakpoint that actually fits.
5. **`xl:text-base` + `xl:px-3.5` + WhatsApp at `xl`** grow the row at 1280–1440.
6. Extra **`hover:scale-105`** on the Header logo wrapper (BrandLockup already scales the image) can grow the lockup into the nav on hover.
7. Logo is `shrink-0` (good). Nav has `min-w-0` (good) but children cannot shrink.

No `position: absolute` on the primary nav or logo.

## 8. RTL / LTR

`dir` on `<html>` already flips the three grid columns. Do not fork four Headers. Hebrew/Arabic place the lockup on the inline-start (visual right). English/Russian place it on the left. After overflow is gone, the same grid is valid in both directions.

Language dropdown uses `absolute end-0` (logical). Keep that.

## 9. Recommended fix

Keep the existing three-column luxury Header. Change only when the row is shown.

1. **Remove** `overflow-x-auto` and scrollbar-hiding utilities from desktop nav. Do not scroll the Header; do not `overflow-hidden` to mask overlap.
2. **Show desktop nav from `xl` (1280px)** — first width where measured EN/RU label sums (~580–680px) fit beside the ~224px lockup and language+theme (~160px) with container padding. Keep the hamburger until then (`xl:hidden`).
3. **Move the WhatsApp text chip to `2xl` (1536px)** so 1280–1535 uses leftover space for labels, not the CTA. WhatsApp remains in the mobile drawer and on the page.
4. Keep `text-sm` / `px-2.5` until `2xl`; restore `2xl:text-base 2xl:px-3.5` on wide screens (not a locale-specific font shrink).
5. Drop the extra Header wrapper `hover:scale-105`.
6. Keep `flex-shrink-0` on logo and actions; `min-w-0` on the nav column; no negative margins; no `body { overflow-x: hidden }`.
7. Do not truncate labels. Do not change seed/CMS strings. Do not touch ThemeProvider, hydration, Hero, Prisma, Dashboard.

CSS-only (no `useLayoutEffect` measuring) so SSR `hidden xl:flex` / `xl:hidden` matches the client and does not affect hydration work.

## 10. Responsive breakpoint recommendation

| Band | Header mode |
|---|---|
| 320–1279 | Compact: logo + language + theme + hamburger. Existing drawer. |
| 1280–1535 | Desktop links + language + theme. No header WhatsApp chip. |
| ≥1536 | Desktop links (slightly roomier type/padding) + WhatsApp chip. |

`lg` (1024) stays for container padding only, not for revealing the six-link row.

Implementation follows this document.
