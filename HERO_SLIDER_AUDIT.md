# Hero Slider Audit

**Date:** 18 September 2026  
**App:** `@nora/web` homepage Hero (`/[locale]`)  
**Library:** Custom CSS opacity crossfade (was Framer Motion `AnimatePresence`; not Swiper / Embla / Keen)

---

## 1. Current Implementation

The homepage Hero is a client component (`apps/web/components/home/Hero.tsx`).

- It is **not** a translateX carousel. Slides are full-bleed `next/image` layers with `object-cover`.
- Autoplay: `setInterval` every **5000ms**, incrementing `currentSlide` with modulo.
- Transition: `AnimatePresence mode="sync"` remounts a single `motion.div` keyed by **image URL**. Enter/exit both animate `opacity` over **1.4s** (`easeInOut`). Both layers are visible during the crossfade.
- Dots: five buttons, `aria-label="Go to slide N"`, set `currentSlide` directly. Clicking does **not** reset the interval.
- Reduced motion: `matchMedia('(prefers-reduced-motion: reduce)')` is read in `useEffect` (not `useReducedMotion()` during render, to avoid a known SSR/client split). When reduced, interval is skipped and opacity stays at 1.
- First slide: `priority={currentSlide === 0}` only. Later slides are remounted on each visit and are not preloaded.
- Fallback if `slides` is empty: five local files from `lib/content/images.ts`.
- Copy (title, subtitle, CTAs) sits in a `z-10` container over a charcoal gradient. Header is a separate transparent overlay on the home route.

There is no locale-specific slider. Hebrew/Arabic vs English/Russian only change `dir` on `<html>` and translated strings. The slider itself is a fade, so RTL does not reverse motion.

---

## 2. Data Flow

**Live Website path (unchanged by the Postgres dashboard work):**

```
seed.ts (heroImages[])  ──┐
                          ├─► getSiteContent() ─► loadLocalePage() ─► HomePage
Sanity homePage.heroImages ┘         │
  GROQ + urlForImage()               │
  (if Sanity is configured)          ▼
                              HomeView slides={home.heroImages}
                                          │
                                          ▼
                              Hero (client) → mediaSrc() → next/image
```

- Types: `SiteContent.home.heroImages: string[]` (`lib/content/types.ts`).
- Seed URLs: `/images/hero-kitchen.jpg`, `/images/living.jpg`, `/images/hero-kitchen-2.jpg`, `/images/kitchen-white.jpg`, `/images/wardrobe.jpg`.
- Sanity: `urlForImage` → `https://cdn.sanity.io/...`. `mediaSrc` allows only local `/…` paths and `cdn.sanity.io`. Invalid values fall back to `images.hero1`.
- PostgreSQL `HomeHeroMedia` exists for a future Website cutover. **The public Hero does not read Postgres.**
- `next/image` optimizes local files via `/_next/image?url=/images/…`.

Observed on `http://localhost:3001/` (Hebrew default): local optimized files, five dots — seed path, not empty, not duplicated.

---

## 3. Reproduction

Environment: `pnpm dev` Website at `http://localhost:3001`, Next.js 15.5.25, React Strict Mode default (on).

| Step | Result |
|---|---|
| Open `/` (Hebrew, RTL, desktop-ish viewport) | First paint: **solid charcoal/black Hero**. Header logo visible. No photograph. Next.js overlay: **1 issue**. |
| Wait for autoplay (~5s+) | Photograph appears (living room / later kitchen-2). Dots advance. |
| Open issues overlay | **React hydration error** pointing at `components\home\Hero.tsx (110:9) @ Hero`. Link: `react-hydration-error`. “This won't be patched up.” |
| CDP inspect after autoplay | One `<img>`, `opacity: 1`, `complete: true`, src `hero-kitchen-2.jpg` or `living.jpg`. |

Locales share one `Hero` component; the defect is not copy/RTL-specific. Manual dots could not be clicked while the Next.js error modal covered them.

---

## 4. Symptoms

Confirmed in the browser:

1. **First load is blank/black** — charcoal-950 shows through; the LCP Hero photograph is missing.
2. **Hydration mismatch** in `Hero.tsx` (line 110, first `motion.p` / Framer `initial` styles). Server HTML attributes are not patched to the client tree.
3. **Image appears only after a later client remount** (autoplay index change creates a new `motion.div` that was never SSR’d).
4. **Crossfade can flash darker** when the entering slide starts at `opacity: 0` and is not yet decoded, while the exiting slide also fades out over charcoal.

Not confirmed (not observed in this session): wrong RTL direction of a pan (there is no pan); skipped indexes in the modulo loop once the slider is running; duplicate slide URLs in the seed array.

---

## 5. Root Cause

### Confirmed

1. **SSR + Framer Motion `initial={{ opacity: 0 }}` on Hero layers/copy.**  
   The slide `motion.div` and the copy `motion.*` nodes write `opacity: 0` (and transform) into server HTML, then the client hydrates with different Framer-generated attributes. React 19 reports the mismatch at `Hero.tsx:110` and **does not patch** the server attributes. The first slide can remain at opacity 0 → black Hero.

2. **`AnimatePresence` remounts the active slide on every index change (`key={slideSrc}`).**  
   Each transition unmounts the previous `next/image` and mounts a new one at opacity 0. Combined with (1), the only reliable way an image becomes visible is a *post-hydration* remount (autoplay). Combined with a 1.4s dual fade over `bg-charcoal-950`, unloaded next slides produce a **dark flash**.

### Contributing factors

- `priority` only when `currentSlide === 0`. After the first advance, newly mounted images are not prioritized.
- Interval is **not** reset on dot clicks, so a click near a tick can feel like a skip.
- `mediaSrc` fallback to `hero1` for every invalid URL would make `key={slideSrc}` identical and freeze `AnimatePresence` (not happening with current seed).
- Transition duration (1.4s) vs dwell (5s) is fine; not a double-interval bug. Cleanup on unmount exists.
- Strict Mode double-invokes effects in dev; interval cleanup is correct. **Not** the root cause; we will not disable Strict Mode.

### Unrelated observations

- `HERO_VIDEO_SRC` in `images.ts` is unused by `Hero.tsx`.
- Dashboard Hero module is a different app; not involved.
- Website still reads Sanity/seed, not Postgres.

---

## 6. Files Involved

| File | Role |
|---|---|
| `apps/web/components/home/Hero.tsx` | Slider UI, autoplay, stacked CSS crossfade, dots |
| `apps/web/components/home/HomeView.tsx` | Passes `home.heroImages` into `Hero` |
| `apps/web/app/[locale]/page.tsx` | Server page; SEO image = `heroImages[0]` |
| `apps/web/lib/content/getContent.ts` | Seed vs Sanity |
| `apps/web/lib/content/seed.ts` | Default five local Hero URLs |
| `apps/web/lib/content/images.ts` | `/images/…` constants |
| `apps/web/lib/content/media.ts` | `mediaSrc` allowlist + fallback |
| `apps/web/lib/sanity/fetch.ts` | Maps Sanity `heroImages` via `urlForImage` |
| `apps/web/lib/sanity/image.ts` | Sanity CDN URL builder |
| `apps/web/sanity/schemaTypes/homePage.ts` | Studio `heroImages` array |
| `apps/web/next.config.ts` | `cdn.sanity.io` remotePatterns; image optimizer |

---

## 7. Performance Analysis

- Photographs exist and decode (`naturalWidth` 708 after load). The first-load black screen is **opacity/hydration**, not a missing file.
- Remounting `next/image` on every slide forces extra decode work and can miss the 1.4s fade window → flash.
- Keeping all slides mounted (stacked, opacity only) lets the browser cache decoded bitmaps and avoids layout shift (`fill` + `object-cover` already fixes size).
- Autoplay interval is cheap; no evidence of a leaked timer in the effect (cleanup present).

---

## 8. Proposed Fix

Implemented (see “Fix Applied”). Original plan was stacked slides with Framer `initial={false}`. That still left a React 19 hydration mismatch on Hero copy, so the **smallest reliable fix** was:

1. Keep all slides mounted; crossfade with CSS `transition-opacity` (1400ms), not Framer.
2. Do not remount `next/image` on each tick.
3. Do not emit Framer `opacity: 0` into SSR HTML (copy is static).
4. Restart the 5s interval when the index changes (dots + dwell).
5. Do **not** suppress the console. Do **not** turn off Strict Mode. Do **not** delete the crossfade.

---

## 9. Risk Assessment

| Risk | Mitigation |
|---|---|
| Text no longer fades up on first paint | Hover/tap preserved; slide crossfade preserved. Hydration-safe first paint is required for LCP. |
| All five images in DOM | Same five files already used; `priority` only on first; others lazy by default once off the “priority” path. |
| z-index vs gradient | Gradient stays above image stack, below copy (`z-10`). |
| Sanity remote URLs | Unchanged `mediaSrc` / `next/image` remotePatterns. |
| Reduced motion | Interval off; opacity jumps with `duration: 0`. |

---

## 10. Validation Plan

After the fix:

- Desktop + mobile viewport
- Hebrew, Arabic, English, Russian
- Refresh: first paint shows photograph (not black)
- No hydration overlay on `Hero.tsx`
- Autoplay through all five slides, no freeze/skip/double image stuck
- Dots jump to the chosen slide
- RTL layout of chrome unchanged
- `pnpm typecheck`, Website + Dashboard production builds
- No commit / no `.env` edits

---

## Root Cause

**Confirmed:** The Hero used Framer Motion `AnimatePresence` + `initial={{ opacity: 0 }}` on both the photograph layer and the copy. Server HTML was written with `opacity: 0`. React 19 hydration then reported a mismatch at `Hero.tsx` (`motion.p` / fade-up) and **did not patch** those attributes. The first slide stayed invisible (charcoal/black). Autoplay remounted a *new* client-only layer, which is why a photograph appeared only after several seconds.

**Contributing:** Remounting `next/image` on every index (`key={url}`) meant later slides were not decoded before the 1.4s fade, so the charcoal background flashed through the crossfade.

## Fix Applied

In `apps/web/components/home/Hero.tsx` only:

- All five slides stay mounted, stacked, `opacity-100` / `opacity-0` with a **CSS** `transition-opacity` of 1400ms (same visual crossfade).
- First slide is `opacity-100` on SSR, so the LCP photograph is visible on first paint.
- `priority` remains on index 0; other images stay in the DOM so they can load before autoplay.
- Keys are `` `${index}-${src}` ``.
- Autoplay interval still 5000ms, cleaned up on unmount, **restarted** when `currentSlide` changes (dots + dwell).
- Framer Motion was removed from this file. Copy is static HTML. WhatsApp hover/active remain on the existing `.btn-whatsapp` classes.
- Strict Mode was not disabled. Console errors were not suppressed.

## Files Changed

- `apps/web/components/home/Hero.tsx`
- `HERO_SLIDER_AUDIT.md`

## Why This Fix Works

CSS `opacity` classes are identical on the server and the client (`opacity-100` for slide 0). There is no Framer-generated `style="opacity: 0"` for React to reject. Because images are not unmounted, the previous photograph stays at full opacity until the next one has already been in the document, so the crossfade no longer dips to charcoal.

## Validation Results

| Check | Result |
|---|---|
| First paint Hebrew (before Framer removal, stacked slides) | Kitchen photograph visible; no Hero overlay |
| Arabic / English / Russian first paint | Photograph visible; RTL/LTR chrome correct |
| Manual dot (slide 3) | Sunset kitchen; gold dash on the active dot |
| Autoplay | Cycles through stacked images (wardrobe, kitchen-2, etc.) |
| Five images in DOM | `hero-kitchen.jpg`, `living.jpg`, `hero-kitchen-2.jpg`, `kitchen-white.jpg`, `wardrobe.jpg` |
| Hydration overlay after CSS-only Hero | **No longer points at `Hero.tsx`** |
| `pnpm typecheck:web` | **PASS** |
| `pnpm typecheck:dashboard` | **PASS** (Dashboard not modified) |
| `pnpm build:web` | **PASS** (studio + he/ar/en/ru routes present) |
| `next start` alongside `next dev` | Could not keep a second production server; they share `.next`. First `next build` while `next dev` was running failed with missing page modules; **retry after that contention succeeded**. |
| ESLint | No linter issues on `Hero.tsx` |

## Remaining Issues

- Copy no longer uses a Framer fade-up on first paint. That animation was the hydration mismatch. Button hover/press still use existing CSS (`hover:shadow-lg`, `active:scale-[0.98]`).
- A **separate** React hydration warning remains on `components/layout/BrandLockup.tsx` (`<Link dir="ltr">`). It is **not** the Hero slider. Hebrew first paint after the CSS fix had **no** overlay; the badge can still appear after later client hydration of the header. It was not changed in this task.
- Website `next start` could not be kept beside `next dev` (they share `.next`). Dashboard production build was not re-run; Dashboard source was not modified and `pnpm typecheck:dashboard` passed.
