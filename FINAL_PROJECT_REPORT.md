# Final project report

> **Stale relative to current `main` (18 Sep 2026).** This report describes 14 Sep work at `de76db4`. Later commits added Prisma, a Website PostgreSQL mapper (unwired), and Dashboard CMS on PostgreSQL (`99f8eb5`). For the live audit and the no-Sanity plan, use [`CURRENT_STATE_AUDIT.md`](./CURRENT_STATE_AUDIT.md).

Date: 2026-09-14  
Git HEAD (committed): `de76db4` — `chore: clean monorepo workspace and package management`  
Working tree: **uncommitted** Phase 2B–16 foundation plus a hardening pass.  
Nothing was deployed.

This report describes **work actually present in the working tree and commands actually run**. It does not claim live CMS, login, or browser verification.

## Architecture

Monorepo (`pnpm@9.15.0`): `@nora/web` (`apps/web`), `@nora/dashboard` (`apps/Dashboard`).

```
Public users → Website (apps/web) → Sanity CDN reads
Dashboard users → login cookie → Route Handlers → Sanity mutate API → optional WEBSITE_REVALIDATE_URL
```

Sanity remains the Website content source of truth. Dashboard mock data is fallback only when Sanity is unread. Luxury Doors was removed from mock and remains rejected on service mutations.

## Authentication

Custom HMAC-SHA256 session cookie `nora_session` (HttpOnly, SameSite=Lax, Secure in production). Signing uses Web Crypto (Edge-compatible middleware).

Owner authenticates against `DASHBOARD_OWNER_EMAIL` / `DASHBOARD_OWNER_PASSWORD` (server env only). A failed Owner password does **not** fall through to file users. Additional users: scrypt hashes in `.data/users.json` (gitignored). **Not stored in Sanity.**

Login: `POST /api/auth/login` (origin/referer check, in-memory rate limit). Logout: `POST /api/auth/logout`. Middleware blocks unauthenticated pages except `/login`, login API, and static file extensions.

**Not tested live** with real credentials in this session.

Password reset/email invite: **not implemented**.

## Authorization (RBAC)

Roles: `owner` > `admin` > `editor` > `employee`. Enforced on the server (`requireRole` via `lib/auth/rbac.ts`).

- CMS mutations: editor+
- Deletes: admin+
- User list/create/patch: owner only
- Cannot create or promote Owner via API
- Patch/delete verifies Sanity `_type` for the supplied id (parameterized GROQ)

UI hiding is not the control plane.

## Sanity / content management

Reads: HTTP GROQ to `*.apicdn.sanity.io` (no write token).  
Writes: HTTP mutate API with `SANITY_API_WRITE_TOKEN` (server-only). Locale patches set `*.he` / `*.ar` / `*.en` only — **`ru` is never sent**. Empty strings are not written (cannot blank a locale by accident).

| Module | Dashboard status |
|--------|------------------|
| Projects | View + patch/create/delete via CMS save (website categories) |
| Services | View + patch/delete; door titles/slugs rejected; allowlisted slugs only |
| Materials | View + patch; name/description locales |
| Homepage | `homePage` hero/intro/CTA locales |
| Hero media | Images from `homePage.heroImages`; save writes `image-*` asset ids; `/api/media` magic-byte sniff |
| About | `aboutPage.body` only |
| How We Work | Existing step field patches by `_key` |
| Testimonials / FAQ / Blog | Patch/create/delete |
| Site settings | brandName, tagline, email, address |
| Nav / footer / social | **Not in Sanity** — local UI only |
| About vision/mission/banners, service steps, material spec sheet | **Not in Sanity schema** — local UI only |

No production documents were deleted or bulk-overwritten in this session.

## Localization / RTL

Website: he (default), ar, en, ru; locale layout already sets `html lang`/`dir`.  
Dashboard: ar/he/en UI; `DocumentLang` sets `lang`/`dir`. Russian editing is not offered.

**Browser locale routes were not successfully verified in this pass** (dev server hung/500 after production build). Production SSG did generate `/he`, `/ar`, `/en`, `/ru` routes.

## AI translation

`/api/translate` uses `TRANSLATION_API_KEY` server-side. Drafts go to `.data/translation-reviews.json`. Marking reviewed **does not** patch Sanity. Targets: he/ar/en only. HTTPS URL allowlist + in-memory rate limit. **Live provider call not tested.**

## Security (verified vs not)

Verified in code / production build:

- Write token / AI key / AUTH_SECRET are server env names only (not `NEXT_PUBLIC_`)
- Mutations require session + role + origin/referer + document type check
- Media types sniffed, not trusted from client MIME; SVG not accepted
- Doors rejected on service mutations; Luxury Doors removed from mock
- Marketing CSP in production: no `unsafe-eval`; Studio route still has `unsafe-eval`
- Dashboard CSP + `X-Frame-Options: DENY` + `robots: noindex`
- `projectId === 'placeholder'` is treated as unconfigured
- `node:crypto` appears in Dashboard **server** login/users bundles only, not `.next/static`
- Unauthenticated Dashboard layout no longer embeds CMS/mock content
- Tracked env files: `apps/web/.env.example` only (contains public project id, not write secrets)

Not claimed:

- No pentest
- Login brute-force limit is in-memory
- CSRF is same-origin checks, not a CSRF token
- Live mutation IDOR tests not run
- Browser/E2E not passed

## Dependencies

No new packages in this hardening pass. Prior work: website ESLint; removed unused `@supabase/supabase-js`; Dashboard React 19. `@netlify/plugin-nextjs` remains listed and unused for Vercel.

## Environment variable names only

Website: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, `SANITY_REVALIDATE_SECRET`, `NEXT_PUBLIC_SITE_URL`

Dashboard: the public Sanity names plus `AUTH_SECRET`, `DASHBOARD_OWNER_EMAIL`, `DASHBOARD_OWNER_PASSWORD`, `SANITY_API_WRITE_TOKEN`, `SANITY_REVALIDATE_SECRET`, `WEBSITE_REVALIDATE_URL`, `TRANSLATION_API_KEY`, `TRANSLATION_API_URL`, `TRANSLATION_MODEL`

## Testing

See IMPLEMENTATION_LOG.md tables. Typecheck, lint, and production builds **succeeded** for both apps after this pass. Browser/E2E and live CMS writes: **Not passed / not tested**.

## Vercel

Website and Dashboard are Next.js 15 apps suitable for Vercel **if** env vars are set. Extra Dashboard users **will not persist** on serverless without a database. Do not deploy until Owner env and write token are configured. **Not deployed.**

Remaining blockers to production: durable user store; live CMS/auth verification after a clean `pnpm dev` restart; Studio origin decision; replace in-memory rate limits for multi-instance.

## Remaining issues / future

Durable user store; password reset; move Studio off the marketing origin; complete website dark theme; CMS for nav/footer; live Dashboard→Sanity→Website verification; replace in-memory rate limits; optional field-unset API if editors must clear copy.

## Hard-stop issues encountered

None of the destructive/history/secret-in-git conditions occurred. Live mutation verification is **blocked pending operator-controlled testing**, not a history/credential rewrite halt.
