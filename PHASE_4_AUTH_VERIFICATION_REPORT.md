# Phase 4A — Final Authentication Verification Report

**Date:** 19 September 2026  
**Repository:** Nora Group monorepo (current working tree is authoritative)  
**Mode:** Verification only. No application-code changes. No Prisma schema change. No database reset. No Owner created. No existing Owner modified. No commit. No push.

Related documents: `PHASE_4_AUTH_RBAC_AUDIT.md`, `PHASE_4_AUTH_IMPLEMENTATION_REPORT.md`

---

## Executive Summary

**VERIFIED WITH NOTES**

PostgreSQL `User` + Argon2id + opaque SHA-256 `Session` authentication is in place and held under runtime checks. Privileged Dashboard APIs do not execute on cookie presence alone. A production `next start` Dashboard confirmed `/login` loads, unauthenticated `/` redirects to `/login`, and fake cookies do not authenticate APIs or the protected page.

Notes (not current security failures):

1. No Owner row exists locally. Owner-only HTTP `/api/users` was not exercised. Owner creation was forbidden for this task. `createUser({ role: 'owner' })` and `updateUser(..., { role: 'owner' })` were rejected in-process.
2. Rank fallback is unused when seeded `RolePermission` rows exist. It cannot escalate vs the current seed. See Rank Fallback.
3. `GET /api/media/[id]` does not call `requireSession`. Middleware requires any cookie; a fake cookie can reach the handler. The same local files are already served publicly by Website `GET /api/media/[id]`. Privileged upload remains `POST /api/media` with a real session + `media.upload`.
4. The existing `scripts/phase4-auth-check.ts` was **not** run because it creates an Owner when none exists.

---

## Authentication

| Check | Result |
|---|---|
| `authenticateUser()` reads Prisma `User` by normalized email | **PASS** |
| Email `trim().toLowerCase()` | **PASS** |
| `User.enabled` enforced (dummy verify path when disabled/missing) | **PASS** |
| Live `User.role` loaded from PostgreSQL | **PASS** |
| Verify uses `argon2.verify` on stored hash | **PASS** |
| New hashes `argon2.hash(..., { type: argon2.argon2id })` | **PASS** |
| `passwordAlgo = "argon2id"` on create | **PASS** |
| Temp user hashes `$argon2…`, not plaintext | **PASS** |
| Password / hash not logged in auth modules | **PASS** |
| Login / content / users JSON omit `passwordHash`, `passwordAlgo`, `tokenHash` | **PASS** |
| `DASHBOARD_OWNER_PASSWORD` unused in Dashboard runtime | **PASS** |
| `DASHBOARD_OWNER_EMAIL` unused in Dashboard runtime | **PASS** |
| `.data/users.json` unused (no code, no file) | **PASS** |
| HMAC / `AUTH_SECRET` session unused | **PASS** |
| Unknown email → 401 | **PASS** |
| Wrong password → 401 | **PASS** |

Repo-wide Dashboard `*.ts` / `*.tsx` search found no `DASHBOARD_OWNER_*`, `users.json`, `AUTH_SECRET`, `signSession`, or `scrypt` in runtime code.

---

## Session Security

| Check | Result |
|---|---|
| Token is `randomBytes(32)` base64url | **PASS** |
| Cookie name `nora_session` | **PASS** |
| Raw token only in `Set-Cookie`, not in JSON body | **PASS** |
| `Session.tokenHash` = SHA-256(token), not the raw token | **PASS** |
| `expiresAt` enforced (`<= now` → no session) | **PASS** |
| `revokedAt` enforced | **PASS** |
| `User.enabled` checked on every `resolveDatabaseSession` | **PASS** |
| Role taken from live `User.role`, not cookie body | **PASS** |
| Cookie is opaque (no role/email payload) | **PASS** |
| HttpOnly | **PASS** (login `Set-Cookie`) |
| SameSite=Lax | **PASS** |
| Path=/ | **PASS** |
| Max-Age 28800 (8 hours) | **PASS** |
| Secure in production | **PASS** (code: `NODE_ENV === 'production'`; local start was not production HTTPS) |
| Secret fields not in client JSON | **PASS** |

---

## Middleware

Design: Edge middleware checks cookie **presence** only. Node `resolveDatabaseSession()` runs in every privileged API via `requireSession` and in `app/layout.tsx` for pages.

There is no `/dashboard` route. The protected page is `GET /`.

| Case | Expected | Result |
|---|---|---|
| 1. `GET /` no cookie | 307 → `/login` | **PASS** — middleware (in-process and `next start`) |
| 2. `GET /` fake `nora_session` | Auth must fail | **PASS** — middleware allows presence; layout rejects; production `next start` returned 307 `/login` |
| 3. Protected API no cookie | 401 | **PASS** — `/api/content`, `POST /api/cms`, production `/api/content` |
| 4. Protected API fake cookie | 401 | **PASS** — `/api/content`, `/api/users` |
| 5. Expired session | 401 | **PASS** |
| 6. Revoked session | 401 | **PASS** |
| 7. Valid session, disabled user | 401 | **PASS** — login and replay of old cookie |

Privileged routes traced:

| Route | Node gate |
|---|---|
| `POST /api/auth/login` | Public + origin + rate limit |
| `POST /api/auth/logout` | Origin; revokes if token present |
| `GET /api/content` | `requireSession` + `cms.read` |
| `POST /api/cms` | `requireSession` + `cms.write` / `cms.delete` |
| `GET/POST/PATCH /api/users` | `requireSession` + `users.manage` |
| `POST /api/media` | `requireSession` + `media.upload` |
| `GET/POST /api/translate` | `requireSession` + `translations.manage` |
| `GET /` (page) | Layout `resolveDatabaseSession`; redirect if invalid |
| `GET /login` | Public |
| `GET /api/media/[id]` | No `requireSession` (see Executive Summary note 3) |

A fake cookie cannot render live CMS into the Dashboard shell: layout loads `emptyAdminData` only when session is null, and redirects when `x-nora-pathname` is a protected page.

---

## RBAC

Seeded path: `User` → `Role` → `RolePermission` → `Permission`. Seed rows were not modified.

| Role | Permission | Expected | Result |
|---|---|---|---|
| employee | `cms.read` | ALLOW | **PASS** (`GET /api/content` 200) |
| employee | `cms.write` | DENY | **PASS** (403 + `authorization_denied`) |
| employee | `cms.delete` | DENY | **PASS** (seed + `roleHasPermission`) |
| employee | `users.manage` | DENY | **PASS** (`GET /api/users` 403) |
| editor | `cms.read` | ALLOW | **PASS** (seed) |
| editor | `cms.write` | ALLOW | **PASS** (handler not 403; empty patch 400, no CMS row changed) |
| editor | `cms.delete` | DENY | **PASS** (403) |
| admin | `cms.read` / `cms.write` / `cms.delete` | ALLOW | **PASS** (delete of missing id 404, not 403) |
| admin | `users.manage` | DENY | **PASS** (403) |
| owner | `users.manage` | ALLOW | **PASS** (seeded RolePermission + `roleHasPermission`) |

Owner HTTP `/api/users` **NOT RUN** — no Owner row; none created.

---

## Rank Fallback

**PASS WITH NOTE**

`roleHasPermission()` uses Prisma assignments when that role has `permissions.length > 0`. Otherwise (empty assignments or query throw) it uses `hasMinRole` against `RANK_FALLBACK`.

| Question | Finding |
|---|---|
| 1. RolePermission rows exist normally? | Fallback is **not** consulted. Missing code on that role is **DENY**. |
| 2. One permission row missing? | Still DENY for that code. No fallback while other rows exist. |
| 3. RolePermission table empty? | Fallback applies. Vs current seed: employee **loses** `cms.read`; editor / admin / owner match seed. No extra grants. |
| 4. Accidental grant of an unassigned permission? | Not under a seeded role (length > 0). Only if that role’s assignments are empty or the lookup throws. |
| 5. Silent escalation from a DB config problem? | Empty table does not escalate vs current seed. A future stricter seed could diverge if the table were emptied. |

Not removed. Not a current seeded-database failure.

---

## Revocation

| Check | Result |
|---|---|
| Logout identifies session, sets `revokedAt`, clears cookie (`Max-Age=0`) | **PASS** |
| Replay after logout → 401 | **PASS** |
| Disable temp editor → `enabled = false`, sessions revoked, login 401, old cookie 401 | **PASS** |
| Role change temp admin → editor, sessions revoked, new login role `editor` | **PASS** |
| Real Owner modified | **N/A** — no Owner row |

Disable / role change were executed through `updateUser()` (the same function `PATCH /api/users` calls). HTTP PATCH was not used because it requires Owner `users.manage`.

---

## Audit Logging

`writeAuditLog()` sets `actorId` from `session.sub` or explicit `actorId`. Metadata is email / role / permission codes only.

| Event | Result |
|---|---|
| Successful login | **PASS** — `actorId` = Prisma user id |
| Failed login | **PASS** — row written; email only; no password |
| Logout | **PASS** — `actorId` set |
| User creation via API | **NOT RUN** — Owner HTTP required |
| User disable | **NOT RUN** as HTTP audit; disable used `updateUser()` directly |
| Role change | **NOT RUN** as HTTP audit; same as disable |
| CMS authorization denial | **PASS** — `actorId` set, no secrets |
| Authenticated CMS mutation | **PASS** (code: `applyMutation` → `writeAuditLog({ session })`). Live write **NOT RUN** — existing CMS rows were not changed |

---

## User API

| Check | Result |
|---|---|
| `listUsers()` fields: `id`, `email`, `role`, `enabled` only | **PASS** (code) |
| HTTP GET `/api/users` as Owner | **NOT RUN** — no Owner |
| HTTP GET as employee / admin | **PASS** — 403 |
| Zod + `createUser` reject `role = owner` | **PASS** |
| `updateUser` reject promote to Owner | **PASS** |
| `updateUser` reject modifying Owner | **PASS** (code; no Owner row to PATCH) |
| Server-side `users.manage` | **PASS** |

---

## Production-like Runtime

**PASS**

Commands:

- `pnpm build` — PASS (Website + Dashboard)
- `pnpm --filter @nora/dashboard start` — existing script `next start`, port 3000
- Server stopped after checks

| Check | Result |
|---|---|
| Dashboard starts | **PASS** |
| `GET /login` | **200** |
| `GET /` no cookie | **307** `/login` |
| `GET /api/content` no cookie | **401** |
| `POST /api/cms` no cookie | **401** |
| Fake cookie `GET /api/content` | **401** |
| Fake cookie `GET /api/users` | **401** |
| Fake cookie `GET /` | **307** `/login` |
| Owner created / rotated | **NO** |

Existing `phase4-auth-check.ts` **NOT RUN** (would create an Owner if none exists).

Equivalent in-process command used instead (temporary script, then deleted):

`pnpm --filter @nora/dashboard exec tsx --conditions react-server scripts/phase4-auth-verify.ts`

Also run:

- `pnpm typecheck:dashboard` — PASS
- `pnpm --filter @nora/dashboard lint` — PASS

---

## Regression Protection

| Area | Result |
|---|---|
| `prisma/schema.prisma` | Unchanged (`git diff` empty) |
| `apps/web/**` | Unchanged (`git diff` empty) |
| Hero / Header / Footer / Theme | Not modified |
| R2 / Sanity-removal | Not modified |
| Seven services | **PASS** — Prisma slugs: kitchens, bedrooms, wardrobes, walkInClosets, customFurniture, offices, commercial (website: walk-in-closets, custom-furniture) |
| doors / luxury-doors | **PASS** — none |

---

## Test Data Cleanup

Temporary users created for this verification:

- `phase4verify-employee@localhost`
- `phase4verify-editor@localhost`
- `phase4verify-admin@localhost`

No Owner was created. `phase4verify-owner-reject@localhost` was not inserted (`createUser` rejected).

After cleanup: `tempVerifyUsers=0`, `ownerUsers=0`.

Sessions for those users were deleted. Existing CMS rows were not deleted.

---

## Tooling

| Command | Result |
|---|---|
| `pnpm typecheck:dashboard` | PASS |
| `pnpm --filter @nora/dashboard lint` | PASS |
| `pnpm build` | PASS |
| Existing `phase4-auth-check.ts` | NOT RUN (Owner-create side effect) |
| Production `next start` HTTP matrix | PASS |

---

## Final status

Phase 4A Verification: **VERIFIED WITH NOTES**

Application code changed: **NO**

Prisma schema changed: **NO**

Database reset: **NO**

Owner created: **NO**

Existing Owner modified: **NO**

Temporary users removed: **YES**

Commit: **NO**

Push: **NO**
