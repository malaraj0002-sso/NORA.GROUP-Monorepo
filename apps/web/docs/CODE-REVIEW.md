# Code review guide — Nora Group website

Use this if you are reviewing the repo, not editing marketing copy in Studio.

## How to run before you review 

```bash
npm install 
cp .env.example .env.local
npm run dev
```

Open http://localhost:3001 (Hebrew) and http://localhost:3001/en.

You do **not** need a working Sanity login to review the marketing site. Seed content should fill every page.

Studio: http://localhost:3001/studio — first load is slow; CORS must allow `http://localhost:3001` (credentials) or login will fail.

## Product rules (do not “fix” these)

- Hebrew is default. URLs are unprefixed for `he` (`/about`, not `/he/about`).
- No quote / lead form. Contact is phone + WhatsApp only.
- No doors in copy, services, or projects.
- Footer **Made by lazaCore** is hardcoded on purpose.
- If Sanity is unset or fails, the site must still render from `lib/content/seed.ts`.

## What to look at

### Architecture
- Route files under `app/[locale]/` should stay thin (load locale + metadata + view).
- `components/providers/SiteProvider.tsx` should hold **chrome** (nav, contact, visibility flags), not the entire CMS blob.
- Interactive bits only: Header, Footer language switch, Hero video, project filters, Reveal motion.

### i18n / RTL
- `he` and `ar` are RTL; `en` and `ru` are LTR.
- Brand lockup (`BrandLockup`) stays `dir="ltr"` so the name does not flip to “Group Nora”.
- `t()` in `lib/i18n/locale.ts` falls back Hebrew → any non-empty locale.

### SEO
- Each important route should have its own title/description, canonical, and hreflang (`he` / `ar` / `en` / `ru` / `x-default`).
- Home JSON-LD: `HomeAndConstructionBusiness` + `WebSite`.
- Inner pages: `BreadcrumbList`. FAQ: `FAQPage`. Blog posts: `Article`.
- `/studio` and `/api/` are disallowed in `app/robots.ts`. Studio should be `noindex`.

### Security
- `POST /api/revalidate` without header `x-revalidate-secret`, or with a wrong/empty secret, must be **401**.
- No secrets in client bundles. `.env.local` must not be in git.
- JSON-LD is escaped so CMS text cannot break out of `<script>`.

### Content flags
- `visible: false` items must not show in lists, footer, sitemap, or `generateStaticParams`.
- Unknown slugs (`/services/not-a-real-slug`) must be **404**, not a soft 200.

## Suggested click-through

1. Home (Hebrew) — hero, services, projects, WhatsApp/call CTAs.
2. Switch language (header) — `/en`, `/ar`; layout direction should change.
3. `/services/kitchens`, `/projects/...`, `/blog/...` — unique `<title>` vs home.
4. `/contact` — phone, WhatsApp, email, QR.
5. Bad slug → not-found page.
6. `/studio` — loading shell, then Studio (if CORS + login work).

## Known gaps (not review blockers unless you are signing off production)

- `npm run lint` has no ESLint config after the Vite → Next rewrite.
- Production webhook secret may still be empty until deploy.
- Until editors publish in Studio, public copy is **seed / demo**.
- Vercel + custom domain + Sanity CORS for production are deploy steps, not in this PR/repo snapshot.

## Files that are easy to get wrong

| File | Why it matters |
|---|---|
| `lib/content/getContent.ts` | CMS fail-open |
| `lib/sanity/fetch.ts` | GROQ + cache tags |
| `app/api/revalidate/route.ts` | Webhook auth |
| `lib/seo/metadata.ts` | Titles, canonical, hreflang |
| `middleware.ts` | Locale routing; skips `api` and `studio` |
| `sanity/structure.ts` | Studio desk (Hebrew); lists need `id`s |
| `app/studio/layout.tsx` | Isolated document; no marketing CSS |

## Review comments that are out of scope

- Restyling the luxury look
- Adding extra locales
- Adding a quote wizard or contact form
- Rewriting seed marketing copy (unless there is a factual error)
