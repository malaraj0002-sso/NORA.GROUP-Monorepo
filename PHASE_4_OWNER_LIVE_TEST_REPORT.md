# Phase 4A — Owner Live Authentication Test Report

**Date:** 19 September 2026  
**Repository:** Nora Group monorepo  
**Mode:** Create one local Owner via existing `pnpm bootstrap:owner`, then live-test production Dashboard. No application-code change. No Prisma schema change. No commit. No push.

Secrets are not recorded: no password, hash, token, cookie, or `DATABASE_URL`.

---

## 1. Executive Summary

**VERIFIED**

A real local PostgreSQL Owner (`owner@localhost`) was created with the existing one-time bootstrap. Live login against `next start` on port 3000 succeeded. PostgreSQL stored an Argon2id password hash and a SHA-256 session `tokenHash`. Owner RBAC, logout revocation, replay failure, second login, wrong-password, and unknown-email checks all passed.

---

## 2. Owner Bootstrap

| Item | Result |
|---|---|
| Prior Owner | None (`owner-count=0`) |
| Mechanism | Existing `pnpm bootstrap:owner` (`scripts/bootstrap-owner.ts`) |
| Email | `owner@localhost` (normalized lowercase) |
| Role | `owner` |
| Enabled | `true` |
| `passwordAlgo` | `argon2id` |
| Password written to `.env` / docs / git | **No** |
| Password printed | **No** |

A first bootstrap created the Owner. That password stayed in a backgrounded shell and could not be reused. A second same-task `pnpm bootstrap:owner` (same email) set a retained local credential via the script’s existing update-same-email path so live login could run. There was no pre-existing operator Owner.

Environment variables `OWNER_BOOTSTRAP_EMAIL` and `OWNER_BOOTSTRAP_PASSWORD` were cleared after testing. The temporary credential file lived only under the OS temp directory (not the repo) and was removed.

---

## 3. PostgreSQL Verification

| Check | Result |
|---|---|
| Host | `localhost` |
| Database name | `nora_group` |
| Reachable / Prisma query | **PASS** |
| Tables | `users`, `sessions`, `roles` (4), `permissions` (7), `role_permissions` (18) |
| Owner role present | **PASS** |
| Owner permissions | `cms.read`, `cms.write`, `cms.delete`, `media.upload`, `users.manage`, `translations.manage`, `audit.read` |
| Exactly one Owner | **PASS** |
| `roleId` → Owner role | **PASS** |
| `passwordHash` present | **yes** |
| `passwordAlgo = argon2id` | **yes** |
| Plaintext password stored | **no** (hash is Argon2-encoded and ≠ password) |
| Runtime `users.json` | **not used** |
| Leftover `.data/users.json` on disk | Present locally; unused by runtime (not created by bootstrap) |

---

## 4. Login Test

Production-like Dashboard: existing `pnpm --filter @nora/dashboard start` (`next start`, port 3000).

| Check | Result |
|---|---|
| `GET /login` | **200** |
| `GET /` unauthenticated | **307** `/login` |
| Live Owner `POST /api/auth/login` | **PASS** (`ok: true`, `role: owner`) |
| Password / `passwordHash` in JSON | **none** |
| Cookie `nora_session` issued | **PASS** |
| HttpOnly | **PASS** |
| Path=/ | **PASS** |
| SameSite=Lax | **PASS** |
| Max-Age=28800 (8 hours) | **PASS** |
| Secure | **PASS** (`NODE_ENV=production` on `next start`) |
| Authenticated `GET /` | **200** (no redirect to login) |
| `GET /api/content` | **200** |
| `GET /api/users` | **200** — safe fields only (`id`, `email`, `role`, `enabled`) |

---

## 5. Session Security

| Check | Result |
|---|---|
| Session row for Owner `userId` | **PASS** |
| `tokenHash` is SHA-256 of the opaque cookie token | **PASS** |
| Raw token stored in PostgreSQL | **no** |
| `expiresAt` ~8 hours ahead | **PASS** |
| Active `revokedAt` | **null** |
| Logout `revokedAt` set + cookie `Max-Age=0` | **PASS** |
| Replay of revoked cookie | **401** |
| Second login | **PASS** — new `tokenHash`; old session stays revoked |
| Authenticated Dashboard after re-login | **PASS** |

IP / user-agent are optional on `Session` and taken from the request when present (`x-forwarded-for` / `user-agent`).

---

## 6. RBAC

Authorization uses the live PostgreSQL role from `User` → `Role` → `RolePermission` → `Permission`. The cookie is opaque and does not carry a trusted role.

| Permission | Owner |
|---|---|
| `cms.read` | ALLOW (live `GET /api/content`) |
| `cms.write` | ALLOW (seeded RolePermission; no CMS write performed) |
| `cms.delete` | ALLOW (seeded; no delete performed) |
| `media.upload` | ALLOW (seeded) |
| `users.manage` | ALLOW (live `GET /api/users`) |
| `translations.manage` | ALLOW (seeded) |
| `audit.read` | ALLOW (seeded) |

`POST /api/users` with `role: owner` returned **400**. Owner role was not modified. No extra users were created.

---

## 7. Negative Tests

| Test | Result |
|---|---|
| Wrong password, correct email | **401**; no new Session row; Owner still enabled |
| Unknown email | **401**; same error shape as wrong password |
| Revoked session replay | **401** |
| Unauthenticated API | **401** |
| Fake `nora_session` | **401** |

---

## 8. Audit Logging

| Event | `actorId` |
|---|---|
| Successful login | Owner Prisma `User.id` |
| Failed login | Row written; email only; no password |
| Logout | Owner Prisma `User.id` |

No password, hash, or token in audit metadata.

---

## 9. Security Checks

Runtime authentication does **not** use:

| Former mechanism | Used? |
|---|---|
| Plaintext Owner password / `DASHBOARD_OWNER_PASSWORD` | **NO** |
| `DASHBOARD_OWNER_EMAIL` | **NO** |
| `.data/users.json` | **NO** |
| HMAC `AUTH_SECRET` sessions | **NO** |
| scrypt for new PostgreSQL passwords | **NO** |

In use: Argon2id, PostgreSQL `User`, PostgreSQL `Session`, opaque cookie, SHA-256 `tokenHash`, logout revocation, live role.

`lib/auth/audit.ts` does not exist; audit is `apps/Dashboard/lib/server/audit.ts`.

---

## 10. Regression Protection

| Area | Result |
|---|---|
| Website | Unchanged (`git diff -- apps/web` empty) |
| Prisma schema | Unchanged (`git diff -- prisma/schema.prisma` empty) |
| Hero / Header / Footer / Theme | Unchanged |
| R2 / Sanity-removal | Unchanged |
| Seven services | Unchanged (kitchens, bedrooms, wardrobes, walk-in-closets, custom-furniture, offices, commercial) |
| doors / luxury-doors | Not added |

---

## 11. Tooling Results

| Command | Result |
|---|---|
| `pnpm typecheck:dashboard` | PASS |
| `pnpm --filter @nora/dashboard lint` | PASS |
| Production `next start` | PASS (existing Dashboard build on port 3000) |
| Live HTTP Owner matrix | PASS |
| `pnpm build` this session | Not re-run; used the existing production `.next` from the prior Phase 4A verification build |

---

## 12. Final Status

**VERIFIED**

Owner created: **yes** (new local Owner; no pre-existing Owner)  
Login: **PASS**  
PostgreSQL session: **PASS**  
RBAC: **PASS**  
Logout / revocation: **PASS**  
Negative authentication: **PASS**  
Audit logging: **PASS**

Commit: **NO**  
Push: **NO**
