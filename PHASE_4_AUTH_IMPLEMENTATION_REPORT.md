# Phase 4A — PostgreSQL Authentication Implementation Report

**Date:** 19 September 2026  
**Repository:** Nora Group monorepo  
**Mode:** Implementation and verification. No commit. No push.  
**Secrets:** Variable names only. No passwords, hashes, tokens, cookie values, or `DATABASE_URL` contents are printed.

Related audit: `PHASE_4_AUTH_RBAC_AUDIT.md` (treated as current-repo evidence).

---

## 1. Executive summary

Dashboard authentication now uses PostgreSQL Prisma `User` and `Session`.

| Layer | Phase 4A result |
|---|---|
| Identity | Prisma `User` only |
| Passwords | Argon2id. Hash in `User.passwordHash`. `passwordAlgo = "argon2id"`. Never plaintext |
| Session | Opaque `nora_session` cookie. SHA-256 `Session.tokenHash`. 8h. Revocable |
| RBAC | `User` → `Role` → `RolePermission` → `Permission` (rank fallback only if RolePermission rows are missing) |
| Audit | `AuditLog.actorId` set from the Prisma user id when a session exists |
| Owner bootstrap | One-time `pnpm bootstrap:owner`. Not automatic |
| Removed at runtime | `DASHBOARD_OWNER_PASSWORD`, `.data/users.json`, HMAC/`AUTH_SECRET` sessions |

Website visual design, Hero, Theme, Header, Footer, R2, and Sanity-removal work were not touched. Prisma schema was not changed.

---

## 2. Dependency approval — `argon2`

### Before install

| Check | Result |
|---|---|
| Package manager | `pnpm@9.15.0` (`packageManager` in root `package.json`) |
| Workspace | `pnpm-workspace.yaml` → `apps/*` |
| Target package | `@nora/dashboard` (`apps/Dashboard`) |
| `@nora/web` | No `argon2` then or now |
| Extra auth libraries | None added (no NextAuth, Lucia, JWT, bcrypt) |

### Install

```bash
pnpm --filter @nora/dashboard add argon2
```

| Item | Value |
|---|---|
| Specifier in `@nora/dashboard` | `^0.45.1` |
| **Exact installed version** | **`0.45.1`** |
| Lockfile | `pnpm-lock.yaml` updated (`argon2@0.45.1`) |
| `@nora/web` | Not installed |
| Prisma schema | Unchanged |

`argon2` is imported only from Dashboard server modules (`password.ts`, `bootstrap-owner.ts`, local check script). Client components do not import it.

---

## 3. What was implemented

### 3.1 PostgreSQL User authentication

`authenticateUser()` loads a Prisma `User` by normalized email, includes `role`, and verifies Argon2id. Disabled users and unknown emails take the dummy-hash verify path so the timing is similar. No env Owner compare. No JSON file.

New hashes always use `argon2.hash(..., { type: argon2.argon2id })` and store `passwordAlgo = "argon2id"`.

### 3.2 One-time Owner bootstrap

`scripts/bootstrap-owner.ts` via root `pnpm bootstrap:owner`.

- Requires `OWNER_BOOTSTRAP_PASSWORD` (10–200 characters).
- Refuses `NORA_BOOTSTRAP_OWNER_AUTO=1`.
- Refuses a second Owner.
- Writes only the Argon2id hash. Never prints the password.
- Not invoked from Next.js startup or request handlers.

`scripts/bootstrap-local.ts` no longer writes `AUTH_SECRET` or `DASHBOARD_OWNER_*` into Dashboard env.

### 3.3 Session: opaque cookie + SHA-256 hash

- Login creates a 32-byte base64url token.
- PostgreSQL stores `SHA-256(token)` in `Session.tokenHash`, plus `expiresAt`, optional IP/UA.
- Cookie `nora_session`: HttpOnly, SameSite=Lax, Path=/, Secure in production, 8 hours.
- Raw token is never stored.

### 3.4 Database-backed validation

`resolveDatabaseSession()` hashes the cookie, then requires:

- matching `Session` row
- `revokedAt` is null
- `expiresAt` > now
- `User.enabled`
- live role name from `User.role`

Role in the cookie body is not trusted. Middleware (Edge) only checks cookie **presence**. Prisma Node validation runs in route handlers and `app/layout.tsx`.

### 3.5 Revocation

| Event | Behavior |
|---|---|
| Logout | `revokedAt` set; cookie cleared |
| Disable user | All active sessions revoked in the same transaction |
| Role change | All active sessions revoked in the same transaction |

### 3.6 `/api/users`

Prisma create / list / patch. `listUsers()` returns `{ id, email, role, enabled }` only.

- Cannot create Owner.
- Cannot promote to Owner.
- Cannot modify the Owner row.

### 3.7 RBAC

`requirePermission()` reads `RolePermission` for the session user's live role. Rank fallback remains only when those rows are missing.

Wired with request + `authorization_denied` audit on `/api/cms`, `/api/content`, `/api/users`, `/api/media`, `/api/translate`.

### 3.8 AuditLog `actorId`

`writeAuditLog()` sets `actorId` from `session.sub` or an explicit `actorId`. Login, logout, failed login, user create/disable/role change, and CMS authorization denials are logged.

### 3.9 UI

Dashboard shell, login page layout, and Users module structure are unchanged. Users copy now says PostgreSQL + Argon2id (ar / he / en). Owner row stays non-editable.

---

## 4. Runtime removals

| Former dependency | Runtime status |
|---|---|
| `DASHBOARD_OWNER_PASSWORD` | Not read by application code |
| `DASHBOARD_OWNER_EMAIL` | Not read by application code |
| `.data/users.json` | No file exists; no code reads it |
| `AUTH_SECRET` HMAC sessions | Session code no longer uses it |

Leftover names may still exist in an operator's gitignored `.env`. They are unused. Values were not printed or deleted.

---

## 5. Files changed (application)

- `apps/Dashboard/lib/auth/password.ts`
- `apps/Dashboard/lib/auth/users.ts`
- `apps/Dashboard/lib/auth/session.ts`
- `apps/Dashboard/lib/auth/session-store.ts` (new)
- `apps/Dashboard/lib/server/http.ts`
- `apps/Dashboard/lib/server/audit.ts`
- `apps/Dashboard/middleware.ts`
- `apps/Dashboard/app/layout.tsx`
- `apps/Dashboard/app/api/auth/login/route.ts`
- `apps/Dashboard/app/api/auth/logout/route.ts`
- `apps/Dashboard/app/api/users/route.ts`
- `apps/Dashboard/app/api/cms/route.ts`, `content/route.ts`, `media/route.ts`, `translate/route.ts` (`requirePermission(..., request)`)
- `apps/Dashboard/components/admin/modules/UsersModule.tsx`
- `apps/Dashboard/lib/i18n/messages.ts`
- `apps/Dashboard/package.json` (`argon2`)
- `pnpm-lock.yaml`
- `scripts/bootstrap-owner.ts` (new)
- `scripts/bootstrap-local.ts`
- `apps/Dashboard/.env.example`, `.env.example`, `README.md`, `LOCAL_SETUP.md`
- `apps/Dashboard/scripts/phase4-auth-check.ts` (local matrix only)

**Not changed:** `prisma/schema.prisma`, Website UI, Hero, Header, Footer, Theme, R2, Sanity-removal, CMS models, service catalog.

---

## 6. Verification

### 6.1 Tooling

| Command | Result |
|---|---|
| `pnpm typecheck:dashboard` | PASS (re-run after the check script) |
| `pnpm --filter @nora/dashboard lint` | PASS (after auth implementation) |
| `pnpm build` (web + dashboard) | PASS (after auth implementation) |

### 6.2 Auth matrix

Method: in-process Dashboard route handlers + Edge `middleware()` against local PostgreSQL (`tsx --conditions react-server scripts/phase4-auth-check.ts`). Production `next start` was not used.

The check created an ephemeral Owner only because none existed, then **deleted** that Owner and the `phase4a-*@localhost` users. An existing Owner password is never rotated.

| # | Check | Result |
|---|---|---|
| 1 | Unknown email → 401 | **PASS** |
| 2 | Wrong password → 401 | **PASS** |
| 3 | Valid Owner login → cookie + `sessions` row | **PASS** |
| 4 | `tokenHash` ≠ raw cookie | **PASS** |
| 5 | Owner `passwordHash` present and Argon2-encoded (not plaintext) | **PASS** |
| 6 | Middleware `/` without cookie → 307 `/login` | **PASS** |
| 7 | `POST /api/cms` without session → 401/403 | **PASS** |
| 8 | Employee `cms.read` 200 | **PASS** |
| 9 | Employee `cms.write` 403 | **PASS** |
| 10 | Editor write allowed (200 or validation 400) | **PASS** |
| 11 | Editor delete 403 | **PASS** |
| 12 | Admin `users.manage` 403 | **PASS** |
| 13 | Admin has `cms.delete` in RolePermission | **PASS** |
| 14 | Owner `GET /api/users` 200 | **PASS** |
| 15 | Users JSON has no `passwordHash` / `passwordAlgo` / `tokenHash` | **PASS** |
| 16 | Logout 200 + `revokedAt` set | **PASS** |
| 17 | Replay cookie after logout → 401 | **PASS** |
| 18 | Disable user 200 + sessions revoked | **PASS** |
| 19 | Disabled user login → 401 | **PASS** |
| 20 | Role change 200 + sessions revoked | **PASS** |
| 21 | Audit row with `actorId` | **PASS** |
| 22 | `DASHBOARD_OWNER_PASSWORD` unused (no runtime reads) | **PASS** (static) |
| 23 | `.data/users.json` unused (no file, no reads) | **PASS** (static) |
| — | Live `GET /` through `next start` | **NOT RUN** — production server start was blocked; middleware unit used instead |
| — | Browser login / Users UI click-through | **NOT RUN** — no persistent Owner left after cleanup |
| — | Admin live CMS delete mutation | **NOT RUN** — permission checked; CMS rows were not deleted |
| — | API create-Owner rejection | **NOT RUN** as HTTP; `createUser` rejects `owner` in code |

### 6.3 Website / CMS regression (read-only)

| Check | Result |
|---|---|
| Seven official services | **PASS** |
| No door slugs | **PASS** |
| `HomeHeroMedia` rows present | **PASS** |
| Website imports Dashboard auth | **PASS** (none) |
| Website visual / Hero / Header / Footer / Theme | **NOT RUN** — no Website code change |

---

## 7. Local operator note

After the auth check, the ephemeral Owner was removed. Local login requires a real Owner:

```bash
OWNER_BOOTSTRAP_EMAIL=owner@localhost OWNER_BOOTSTRAP_PASSWORD=******** pnpm bootstrap:owner
```

The password is hashed into PostgreSQL and is not written to `.env`.

---

## 8. Status labels

| Label | Value |
|---|---|
| **AUTHENTICATION STATUS** | FUNCTIONAL — PostgreSQL `User` + Argon2id |
| **SESSION STATUS** | FUNCTIONAL — opaque cookie + SHA-256 `Session.tokenHash` |
| **RBAC STATUS** | FUNCTIONAL — User → Role → RolePermission → Permission |
| **API PROTECTION** | FUNCTIONAL — Node `requireSession` / `requirePermission` |
| **PASSWORD SECURITY** | FUNCTIONAL — Argon2id only; no plaintext store |
| **AUDIT LOGGING** | FUNCTIONAL — `actorId` on authenticated actions |
| **OVERALL** | Phase 4A complete for the approved scope |

---

## 9. Out of scope / leftover

- No commit. No push.
- Existing gitignored env files were not rewritten.
- HMAC/`AUTH_SECRET` leftovers in old env files are unused.
- Password reset / invite / email verification were not added.
- Rank fallback remains for an unseeded RolePermission table.
- Website production UI was not re-opened in a browser in this phase.
