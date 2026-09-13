# Nora Group website

Marketing site for **Nora Group** (נגרות ועיצוב פנים) — custom carpentry and interior design in Migdal Oz.

**Live domain (when deployed):** [https://officialnoragroup.com](https://officialnoragroup.com)  
**Repo:** [github.com/yousefhedmi3/NoraGroupWebsite](https://github.com/yousefhedmi3/NoraGroupWebsite)

Hebrew is the default language (`/`). Arabic, English, and Russian use prefixes: `/ar`, `/en`, `/ru`.

This is a **contact site**, not a quote funnel. CTAs are phone and WhatsApp only. The company does **not** make doors — do not add door copy or services.

---

## Quick start

You need **Node.js 20+** and npm.

```bash
git clone git@github.com:yousefhedmi3/NoraGroupWebsite.git
cd NoraGroupWebsite
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, copy env with:

```powershell
copy .env.example .env.local
```

Then open:

| What | URL |
|---|---|
| Hebrew home | http://localhost:3001 |
| English | http://localhost:3001/en |
| Arabic | http://localhost:3001/ar |
| Russian | http://localhost:3001/ru |
| Sanity Studio | http://localhost:3001/studio |

The first page load in dev can take a while (Turbopack compile). Later loads are faster.

If `npm run dev` is flaky:

```bash
npm run dev:webpack
```

Standalone Studio (optional):

```bash
npm run studio
```

Then open http://localhost:3333

---

## What you should see

The site always renders. If Sanity is missing or down, **seed content** (Hebrew / Arabic / English / Russian) is used so pages are never empty.

Contact defaults (overridable in Studio):

- Phone / WhatsApp: 052-465-9510 → `+972524659510`
- Email: official.noragroup@gmail.com
- Address: Migdal Oz

Footer credit **Made by lazaCore** is hardcoded. It is not editable in the CMS.

---

## Environment variables

Copy `.env.example` → `.env.local`. Never commit `.env.local`.

| Variable | Required? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | For live CMS | Sanity project (`g32xvgua` in the example) |
| `NEXT_PUBLIC_SANITY_DATASET` | No (defaults to `production`) | Dataset name |
| `NEXT_PUBLIC_SANITY_API_VERSION` | No | API version date |
| `SANITY_REVALIDATE_SECRET` | For production webhooks | Shared secret; empty = all revalidate calls return 401 |
| `NEXT_PUBLIC_SITE_URL` | For SEO on deploy | Canonical site URL |

`NEXT_PUBLIC_*` values are visible in the browser. Only put public IDs there.

### Studio login locally

In [sanity.io/manage](https://www.sanity.io/manage) → project → **API → CORS origins**, add with **Allow credentials**:

- `http://localhost:3001`
- `http://127.0.0.1:3001`

Production origin: `https://officialnoragroup.com`

---

## Useful commands

```bash
npm run dev          # Next.js on port 3001 (Turbopack)
npm run dev:webpack  # Same, Webpack
npm run studio       # Sanity Studio on port 3333
npm run build        # Production build
npm run start        # Serve the production build
npm run typecheck    # TypeScript (no emit)
```

`npm run lint` is **not configured** (the old Vite ESLint file was removed with the rewrite). Do not treat a lint failure as a product bug until ESLint is added back for Next.js.

---

## How the code is organized

```
app/[locale]/          Public pages (thin route files)
app/studio/            Embedded Sanity Studio (no site header/footer)
app/api/revalidate/    Sanity webhook → cache refresh
components/            UI (layout, home, pages, seo)
lib/content/           Types, seed copy, getSiteContent()
lib/sanity/            Fetch + image URLs
lib/seo/               Metadata, hreflang, JSON-LD
sanity/schemaTypes/    CMS document types
docs/                  Studio handoff + code-review notes
public/                Logos, photos, hero.mp4
```

**Data flow:** locale layout loads `getSiteContent()` once (Sanity, or seed on failure) → Header/Footer get a small chrome slice → each page view gets the content it needs.

**Locales:** field-level `{ he, ar, en, ru }`. Missing translations fall back to Hebrew.

---

## Public pages

`/`, `/about`, `/services`, `/services/[slug]`, `/projects`, `/projects/[slug]`, `/materials`, `/how-we-work`, `/testimonials`, `/blog`, `/blog/[slug]`, `/faq`, `/contact`

Hidden CMS items (`visible: false`) must not appear in nav, sitemaps, or static params.

---

## Deploy (Vercel)

1. Import this GitHub repo into Vercel.
2. Set the env vars from `.env.example` (plus a real `SANITY_REVALIDATE_SECRET`).
3. Attach domain `officialnoragroup.com`.
4. In Sanity, add a webhook: `POST https://officialnoragroup.com/api/revalidate` with header `x-revalidate-secret: <same secret>`.

---

## Docs

- **Code reviewers:** [docs/CODE-REVIEW.md](docs/CODE-REVIEW.md)
- **Studio editors (Hebrew):** [docs/STUDIO-HANDOFF.he.md](docs/STUDIO-HANDOFF.he.md)
