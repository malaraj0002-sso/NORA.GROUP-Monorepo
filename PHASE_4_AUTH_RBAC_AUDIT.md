# Phase 4 — Authentication and RBAC Audit

**Date:** 19 September 2026  
**Repository:** Nora Group monorepo (current working tree is authoritative)  
**Scope:** Audit only. No application, Prisma, migration, data, or dependency changes. No commit. No push.  
**Secrets:** Variable names only. No passwords, `DATABASE_URL` values, tokens, or cookie secrets are printed.

---

## 1. Executive Summary

Dashboard login **works today**, but it does **not** use the PostgreSQL auth models that already exist in Prisma.

| Layer | Current state |
|---|---|
| Identity | Environment Owner (`DASHBOARD_OWNER_EMAIL` / `DASHBOARD_OWNER_PASSWORD`) plus optional file users in `.data/users.json` |
| Passwords | Owner: **plaintext env compare**. Extra users: Node `scrypt` hashes in JSON |
| Session | HMAC-signed cookie `nora_session` (Web Crypto). **Not** Prisma `Session` |
| RBAC roles | Cookie embeds `owner` / `admin` / `editor` / `employee` |
| Permission checks | Server-side on mutation APIs. Codes come from Prisma `Role`/`Permission` when seeded; otherwise rank fallback |
| Audit | Prisma `AuditLog` on CMS/media writes. `actorId` is never set. Login/user-admin not logged |
| Website | Public read of PostgreSQL content. No Dashboard login. No privileged write API |

**Target architecture is designed in the schema and not wired in runtime auth.**

The next implementation phase should move login, password hashes, and sessions onto Prisma `User` / `Session`, then remove env-plaintext Owner and JSON user storage.

---

## 2. Current Authentication Architecture

```
Browser (apps/Dashboard /login)
  → POST /api/auth/login
  → authenticateUser()  [apps/Dashboard/lib/auth/users.ts]
        ├─ if email == DASHBOARD_OWNER_EMAIL
        │     timingSafeStringEqual(password, DASHBOARD_OWNER_PASSWORD)   ← plaintext env
        └─ else
              load .data/users.json
              scrypt verify salt+hash
  → signSession({ sub, email, role })  [HMAC-SHA256, AUTH_SECRET]
  → Set-Cookie nora_session (HttpOnly, SameSite=Lax, Secure in production, 8h)
  → middleware + requireSession() verify HMAC
  → requirePermission() reads Prisma RolePermission (or rank fallback)
  → applyMutation() / Prisma CMS writes
```

PostgreSQL `users` / `sessions` tables exist and are **unused by this path**.

Sanity is **not** used for authentication. Leftover Sanity env names and unused `apps/Dashboard/lib/sanity/*` files remain; they are not the login store.

---

## 3. Database Auth Model

Source: `prisma/schema.prisma` and `prisma/migrations/20260917220000_init/migration.sql`.

### 3.1 `User` → table `users`

| Item | Current definition |
|---|---|
| Primary key | `id` String `@default(cuid())` |
| Fields | `email` unique; `passwordHash`; `passwordAlgo` default `"argon2id"`; `roleId`; `enabled` default true; `createdAt`; `updatedAt` |
| Foreign keys | `roleId` → `Role.id` (`onDelete: Restrict`) |
| Indexes | `email` unique; `roleId`; `enabled` |
| Relations | `role`, `sessions[]`, `auditLogs[]` |
| Nullable | none of the auth fields |
| Security-sensitive | `passwordHash`, `passwordAlgo` |

Comment in schema: password hashes only; Argon2id intended later. **No runtime code writes or reads this model.** Seed (`apps/web/scripts/seed-postgres.ts`) does not create User rows.

### 3.2 `Role` → table `roles`

| Item | Current definition |
|---|---|
| Primary key | `id` cuid |
| Fields | `name` enum `RoleName` unique (`owner`, `admin`, `editor`, `employee`); `description?`; timestamps |
| Relations | `users[]`, `permissions` via `RolePermission` |

Seed upserts all four role names.

### 3.3 `Permission` → table `permissions`

| Item | Current definition |
|---|---|
| Primary key | `id` cuid |
| Fields | `code` unique string (not a DB enum); `description?`; `createdAt` |
| Intended codes | `cms.read`, `cms.write`, `cms.delete`, `media.upload`, `users.manage`, `translations.manage`, `audit.read` |

### 3.4 `RolePermission` → table `role_permissions`

| Item | Current definition |
|---|---|
| Primary key | composite `[roleId, permissionId]` |
| Fields | `assignedAt` |
| FKs | role Cascade, permission Cascade |
| Index | `permissionId` |

### 3.5 `Session` → table `sessions`

| Item | Current definition |
|---|---|
| Primary key | `id` cuid |
| Fields | `userId`; `tokenHash` unique; `expiresAt`; `revokedAt?`; `ipAddress?`; `userAgent?`; `createdAt` |
| FK | `userId` → `User.id` Cascade |
| Indexes | `userId`, `expiresAt` |
| Design intent | store a **hash** of the cookie token, never the raw value |

**Unused at runtime.** Live sessions are HMAC cookies only.

### 3.6 `AuditLog` → table `audit_logs`

| Item | Current definition |
|---|---|
| Primary key | `id` cuid |
| Fields | `actorId?`; `action`; `entity`; `entityId?`; `metadata` Json?; `ipAddress?`; `userAgent?`; `createdAt` |
| FK | `actorId` → `User.id` SetNull |
| Indexes | `[actorId, createdAt]`, `[entity, entityId]`, `createdAt` |

Used by `writeAuditLog()` for CMS/media mutations. `actorId` is omitted because there is no Prisma User id for the env Owner.

### 3.7 Schema sufficiency vs target

| Capability | Schema ready? | Runtime uses it? |
|---|---|---|
| Login | Yes (`User.email`) | No — env + JSON |
| Password authentication | Yes (`passwordHash` / `passwordAlgo`) | No — scrypt JSON / plaintext env |
| Session management | Yes (`Session`) | No — HMAC cookie |
| Role assignment | Yes (`User.roleId` → `Role`) | Partial — role string in cookie |
| Permission checks | Yes (`RolePermission`) | Yes — lookup + fallback |
| Session revocation | Yes (`revokedAt`) | No |
| Audit logging | Yes | Partial — writes without `actorId` |

The schema is sufficient for Phase 4. The gap is application wiring, not missing tables.

---

## 4. Password Security

### Answers

| Question | Finding |
|---|---|
| 1. Is password authentication implemented? | **Yes**, server-side, two stores |
| 2. Where are hashes stored? | Extra users: `.data/users.json` (`salt`, `hash`). Prisma `User.passwordHash` unused |
| 3. Are plaintext passwords stored anywhere? | **Yes** — `DASHBOARD_OWNER_PASSWORD` in server env (and documented local default name in README / bootstrap). Not written to Prisma |
| 4. Is there an environment-variable Owner account? | **Yes** — `DASHBOARD_OWNER_EMAIL` + `DASHBOARD_OWNER_PASSWORD` |
| 5. Is `.data/users.json` still used? | **Yes** — `apps/Dashboard/lib/auth/users.ts` `DATA_FILE` |
| 6. Fallback authentication? | Owner email match does **not** fall through to the file store. Other emails use the file store only. No Sanity/Postgres User fallback |
| 7. Hashing algorithm | File users: Node `scryptSync(password, salt, 64)` (default N=16384, r=8, p=1), 16-byte random salt, hex encode. Schema default name `argon2id` is unused |
| 8. Verification server-side only? | **Yes.** `password.ts` and `users.ts` import `server-only` |
| 9. Can the client receive a hash? | **No.** `listUsers()` strips `salt`/`hash`. Login JSON is `{ ok, role }` |

### Implementation files

- `apps/Dashboard/lib/auth/password.ts` — `hashPassword`, `createPasswordRecord`, `verifyPassword`, `timingSafeStringEqual`
- `apps/Dashboard/lib/auth/users.ts` — `authenticateUser`, `createUser`, `updateUser`, `listUsers`, `envOwner()`
- `apps/Dashboard/app/api/auth/login/route.ts` — calls `authenticateUser`

### Weaknesses (concrete)

1. **Owner plaintext in env** (`users.ts` `envOwner` / `authenticateUser`). Process dumps, mis-copied env files, or host env leakage yield the live Owner password.
2. **Prisma `passwordHash` unused.** Target store is empty.
3. **File store** is not durable on serverless; hashes live on disk next to the Dashboard cwd.
4. **Owner miss timing:** wrong Owner password returns immediately; unknown emails run a dummy `scrypt` (`DUMMY` record). Owner email existence is distinguishable by timing.
5. **No password reset / rotation / lockout** beyond an in-memory login rate limit.
6. **Documented local default** `nora-local-owner` in `README.md` / `scripts/bootstrap-local.ts` if that value is reused outside local.

`.data/` is gitignored (`.gitignore`). `users.json` is not in git.

---

## 5. Login Flow

### Pieces

| Step | Location |
|---|---|
| Login page | `apps/Dashboard/app/login/page.tsx` — client form, `fetch('/api/auth/login')`, `credentials: 'same-origin'`, then `window.location.assign('/')` |
| Login API | `apps/Dashboard/app/api/auth/login/route.ts` `POST` |
| Credential validation | `authenticateUser` |
| Session creation | `signSession({ sub: user.id, email, role }, AUTH_SECRET)` — `exp = now + 8h` |
| Cookie | `applySessionCookie` in `apps/Dashboard/lib/server/http.ts` |
| Logout | `POST /api/auth/logout` — clears cookie (`maxAge: 0`). No DB revoke |
| Session validation | Middleware HMAC + `requireSession` on APIs |
| Refresh / rotation | **None** |
| Invalid credentials | Generic `Invalid credentials` 401 |
| Rate limit | In-memory `Map`, 8 attempts / 60s / IP (`x-forwarded-for` first hop) |
| CSRF / origin | `assertSameOrigin` on login (Origin/Referer host must match `Host`; production requires one of them) |
| Redirect | Unauthenticated pages → `/login`. Successful login → `/` |
| Protected routes | Middleware matcher (see §12) |

### End-to-end

```
Browser
  → GET /login (public)
  → POST /api/auth/login { email, password }
  → Server: origin + rate limit + AUTH_SECRET
  → authenticateUser (env Owner or users.json)     ← not PostgreSQL User
  → HMAC cookie nora_session
  → GET /  (middleware requires valid cookie)
  → layout.tsx readSession + readDashboardContent()
  → Dashboard UI
```

**Missing vs target:** User lookup in PostgreSQL, password hash verify against `User.passwordHash`, insert hashed `Session`, bind `actorId`, rotate/revoke.

Login does not write an audit row.

---

## 6. Session Security

Source: `apps/Dashboard/lib/auth/session.ts`, `apps/Dashboard/lib/server/http.ts`.

| Property | Current |
|---|---|
| Token generation | Base64url(JSON payload) + HMAC-SHA256 (`AUTH_SECRET`) |
| Storage | Browser cookie only. Prisma `sessions` unused |
| Token hashing | **Not stored.** Schema `tokenHash` unused |
| Cookie name | `nora_session` |
| HttpOnly | **Yes** |
| Secure | **Yes in production** (`NODE_ENV === 'production'`) |
| SameSite | `Lax` |
| Path | `/` |
| Max-Age | 28800 seconds (8 hours) |
| Expiration | Payload `exp` checked in `readSession` |
| Revocation | **None** |
| Logout | Cookie emptied; token remains valid if copied |
| Fixation | New token issued on login (overwrites cookie). Prior tokens stay valid until `exp` |
| Reuse after logout | **Yes**, if the raw cookie value is retained |
| Secret rule | `AUTH_SECRET` must be ≥ 32 characters or `getAuthSecret()` returns undefined (login 503, middleware treats site as unauthenticated) |

Payload is signed, **not encrypted**. `sub`, `email`, and `role` are readable from the cookie body.

`readSession` rejects unknown roles and missing `sub`.

**Production suitability against the target:** not suitable as the final session design. As a same-site HMAC cookie it is internally consistent, but it cannot revoke, cannot honor `User.enabled`, and cannot pick up a role change until expiry.

---

## 7. RBAC

### Roles present

Enum `RoleName` and cookie type `Role`: `owner`, `admin`, `editor`, `employee`.

### Seeded permission assignments

From `apps/web/scripts/seed-postgres.ts` `ROLE_PERMISSIONS` (current seed, not a redesign):

| Role | Permissions |
|---|---|
| owner | `cms.read`, `cms.write`, `cms.delete`, `media.upload`, `users.manage`, `translations.manage`, `audit.read` |
| admin | `cms.read`, `cms.write`, `cms.delete`, `media.upload`, `translations.manage`, `audit.read` |
| editor | `cms.read`, `cms.write`, `media.upload`, `translations.manage` |
| employee | `cms.read` |

### Enforcement layers

| Layer | Enforced? | Notes |
|---|---|---|
| A. UI | **No** | `Sidebar.tsx` shows Users and Translation to every logged-in visitor. `UsersModule` always mounts. API 403 is the real gate |
| B. API / server | **Yes** | `requireSession` + `requirePermission` on CMS, content, media upload, users, translate |
| C. Database | **Partial** | Permission rows are consulted. Mutations are not row-level RLS. `applyMutation` itself does not re-check permissions |

`apps/Dashboard/lib/auth/rbac.ts` defines `ROLE_RANK` / `hasMinRole`. Used as **fallback** in `roleHasPermission` when Prisma role rows are missing or have zero permissions (`apps/Dashboard/lib/server/permissions.ts` `RANK_FALLBACK`).

`requireRole` exists in `http.ts` and is **unused** by routes (permission codes are used instead).

Session `role` is **not** re-read from Prisma `User` on each request.

---

## 8. API Authorization

Dashboard API surface:

| Route | Methods | AuthN | AuthZ | Origin check | Notes |
|---|---|---|---|---|---|
| `/api/auth/login` | POST | Public | — | Yes | Rate limited |
| `/api/auth/logout` | POST | Public (middleware excluded) | — | Yes | Clears cookie |
| `/api/content` | GET | Session | `cms.read` | No | Read bundle |
| `/api/cms` | POST | Session | `cms.write` or `cms.delete` | Yes | All CMS mutations |
| `/api/media` | POST | Session | `media.upload` | Yes | Local image upload |
| `/api/media/[id]` | GET | Session (middleware only) | none | No | Bytes for LOCAL media |
| `/api/users` | GET | Session | `users.manage` | No | Strips hashes |
| `/api/users` | POST/PATCH | Session | `users.manage` | Yes | Create / enable / role |
| `/api/translate` | GET/POST/PATCH | Session | `translations.manage` | POST/PATCH yes | File review store |

Website APIs (not Dashboard):

| Route | Protection |
|---|---|
| `apps/web/app/api/revalidate/route.ts` | Shared secret header `x-revalidate-secret` vs `REVALIDATE_SECRET` (fail closed if empty). Alias `SANITY_REVALIDATE_SECRET` still accepted |
| `apps/web/app/api/media/[id]/route.ts` | **Public GET** of LOCAL media by id (published-site asset serving) |

Middleware on Dashboard also returns 401 for any other `/api/*` without a valid cookie.

---

## 9. Resource Authorization

All CMS writes go through `POST /api/cms` → `mutationSchema` → `applyMutation` (`apps/Dashboard/lib/server/content/postgres/mutate.ts`).

Typical mutation path:

```
Request
  → middleware HMAC session
  → assertSameOrigin (POST)
  → requireSession (HMAC again)
  → Zod mutationSchema
  → requirePermission(cms.write | cms.delete)
  → applyMutation → Prisma
  → writeAuditLog (email/role in metadata, no actorId)
```

| Operation | AuthN | Permission | Notes |
|---|---|---|---|
| Create/edit service | Yes | `cms.write` | Door slugs rejected |
| Delete service | Yes | `cms.delete` | |
| Create/edit/delete project | Yes | write / delete | |
| Upload media | Yes | `media.upload` | No dedicated delete-media API |
| Delete media row | — | — | **Not implemented** |
| Edit homepage / hero / about / how-we-work / contact / site / legal / uiCopy | Yes | `cms.write` | patch only |
| Create/edit/delete materials, testimonials, FAQ, blog | Yes | write / delete | |
| Publish flags | Yes | same write/delete | `published` is a field on those resources |
| Manage users | Yes | `users.manage` | File store, not Prisma User |
| Manage roles | — | — | **No API** to edit RolePermission |
| Translations | Yes | `translations.manage` | Apply path calls `applyMutation` without a second `cms.write` check (role that has translations.manage is assumed able to patch) |

**Mutations callable without authentication:** none of the Dashboard CMS/user/media-upload routes. Website `/api/media/[id]` is a public read. Website `/api/revalidate` is secret-header, not session.

**Authenticated but no permission check:** Dashboard `GET /api/media/[id]` (any valid session). Root `layout.tsx` loads full CMS for any valid session (employee seed includes `cms.read`).

`applyMutation` trusts the caller to have already authorized. `apps/Dashboard/scripts/phase3-postgres-check.ts` builds an in-process fake owner session for local checks only; that script is not an HTTP endpoint.

---

## 10. Audit Logging

Implementation: `apps/Dashboard/lib/server/audit.ts` → `prisma.auditLog.create`.

| Field | Written? |
|---|---|
| action | Yes (`create` / `update` / `delete`) |
| entity | Yes (resource name or `media`) |
| entityId | Yes when available |
| metadata | `email`, `role`, optional extra |
| ipAddress | Yes (first `x-forwarded-for` hop) |
| userAgent | Yes |
| timestamp | `createdAt` default |
| actorId | **Never set** |
| success/failure | Failures are not logged; only successful mutations |

**Logged:** CMS create/update/delete via `applyMutation`; media upload.

**Not logged:** login, logout, failed login, user create/update, translation request, permission denials.

**Who can modify logs:** no Dashboard API reads or deletes `AuditLog`. `audit.read` is seeded and documented as prepared; no live audit API. Normal users cannot delete logs through the UI.

---

## 11. User Management

| Operation | Exists? | Protected? |
|---|---|---|
| Create user | Yes — `POST /api/users` + `UsersModule` | `users.manage` + origin |
| Edit user (enable / role) | Yes — `PATCH /api/users` | `users.manage` + origin |
| Disable user | Yes — `enabled: false` in file store | Same. **Existing HMAC session still works** |
| Delete user | **No** | — |
| Reset password | **No** | — |
| Change role | API yes (`admin`/`editor`/`employee`). UI only toggles enabled | Cannot promote to `owner`; cannot modify `env-owner` |
| Revoke sessions | **No** | — |

Owner cannot be created via API. Extra users cannot have role `owner`. File store may be unwritable on serverless (`User store is not writable on this host`).

---

## 12. Middleware / Route Protection

`apps/Dashboard/middleware.ts`:

- **Public / skipped:** `/_next`, `/api/auth/login`, `/api/auth/logout`, `/login`, static extensions.
- **If `AUTH_SECRET` missing:** `/api/*` → 503; other pages → `/login`.
- **If cookie invalid/expired:** `/api/*` → 401 JSON; pages → 307 `/login`.
- **If cookie valid:** next.
- Matcher: `/((?!_next/static|_next/image|favicon.ico).*)`.

Protection is **server-side** (Edge middleware + route `requireSession`). Calling `/api/cms` without a cookie is rejected by middleware and again by `requireSession`. Permission still required after that.

Bypass analysis (static only):

- Direct API call without cookie: 401.
- Forged cookie without `AUTH_SECRET`: signature fail.
- Stolen cookie: valid until `exp` (8h), including after logout/disable.
- `/login` is always reachable (no “already signed in” redirect).
- Website middleware (`apps/web/middleware.ts`) is next-intl only — not Dashboard auth.

`apps/Dashboard/app/layout.tsx` also reads the session to decide whether to load Postgres content vs mock. It is not the security boundary.

`apps/Dashboard/app/robots.ts` disallows `/`.

No `"use server"` actions exist in the Dashboard. Mutations are API routes.

---

## 13. Website Security Boundary

| Check | Result |
|---|---|
| Public Website routes | App Router `[locale]/*` — marketing only |
| Dashboard routes | Separate app `@nora/dashboard` port 3000 |
| Website privileged Dashboard APIs | **None** |
| Website DB utilities | `apps/web/lib/content/fromPostgres.ts` is `server-only` **read** |
| Website writes | Seed/scripts only; not request handlers |
| Client imports of auth/password | Dashboard password/users are `server-only`. Website has no auth modules |
| Privileged credentials in browser bundles | `AUTH_SECRET`, `DASHBOARD_OWNER_*`, `DATABASE_URL` are not `NEXT_PUBLIC_`. Website `NEXT_PUBLIC_SITE_URL` is public by design |

Leftover `NEXT_PUBLIC_SANITY_*` names still appear in local env files and unused Sanity helpers. They are not the CMS write path.

Website `GET /api/media/[id]` serves LOCAL objects by id without a session (expected for public images). Guessable cuids are the residual risk.

---

## 14. Environment Variables

Names and purpose only.

| Name | Where used | Required today? | Keep for target? | Obsolete? |
|---|---|---|---|---|
| `DATABASE_URL` | Prisma (root, both apps) | Yes | **Yes** | No |
| `AUTH_SECRET` | HMAC sessions (`session.ts`) | Yes (≥32 chars) | Replace or reuse as cookie-signing/pepper after DB sessions | No |
| `DASHBOARD_OWNER_EMAIL` | Env Owner (`users.ts`) | Yes for current login | **Remove** after Prisma Owner user exists | Becomes obsolete |
| `DASHBOARD_OWNER_PASSWORD` | Env Owner plaintext | Yes for current login | **Remove** | Becomes obsolete |
| `REVALIDATE_SECRET` | Website revalidate + Dashboard caller | Yes if revalidate used | Yes | No |
| `WEBSITE_REVALIDATE_URL` | Dashboard after CMS save | Optional | Yes | No |
| `NEXT_PUBLIC_SITE_URL` | Website SEO | Optional | Yes | No |
| `TRANSLATION_API_KEY` / `_URL` / `_MODEL` | `/api/translate` | Only if translation used | Yes if feature stays | No |
| `SANITY_REVALIDATE_SECRET` | Alias in revalidate helpers | No | **No** | **Yes** |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Leftover Sanity env helpers / local env | No for Postgres CMS | **No** | **Yes** |
| `NEXT_PUBLIC_SANITY_DATASET` | Same | No | **No** | **Yes** |
| `SANITY_API_WRITE_TOKEN` | Name present in Dashboard local env; no current Dashboard import of `@/lib/sanity` | No for Postgres CMS | **No** | **Yes** — leftover write token name |
| `POSTGRES_PASSWORD` | Root `.env.example` / compose | Docker only | Local infra only | N/A |
| JWT / next-auth secrets | — | Not used | — | — |

Local env files inspected for **keys only**. Values are not reported.

`scripts/bootstrap-local.ts` will fill empty `AUTH_SECRET`, `REVALIDATE_SECRET`, and a local Owner email/password if missing.

---

## 15. Authentication Dependencies

| Package / mechanism | Present? | Used for auth? |
|---|---|---|
| `bcrypt` / `bcryptjs` | No | — |
| `argon2` | No (name only in Prisma default) | — |
| `jose` / `jsonwebtoken` | No | — |
| `lucia` / `next-auth` / Auth.js | No | — |
| `next-themes` | Dashboard UI theme only | Not auth |
| Node `crypto.scryptSync` | Yes (`password.ts`) | File-user hashes |
| Web Crypto HMAC-SHA256 | Yes (`session.ts`) | Cookie sessions |
| Custom session | Yes | Current production path |
| `@prisma/client` | Yes | CMS + permissions + audit; **not** User/Session login |

No unused dedicated auth library to remove. The unused piece is the **Prisma auth models**, not an npm package.

---

## 16. Security Findings

### CRITICAL

**C1 — Login is not PostgreSQL User authentication**  
- File: `apps/Dashboard/lib/auth/users.ts` `authenticateUser`  
- Behavior: env Owner or `.data/users.json`. Prisma `User` never queried.  
- Implication: target identity store is empty; serverless/multi-instance extra users are lost; schema and runtime disagree.  
- Direction: authenticate against `User.email` + `passwordHash`; stop reading env password and JSON.

**C2 — Owner password is plaintext in environment**  
- File: `users.ts` `envOwner`, `authenticateUser` lines 66–89; env name `DASHBOARD_OWNER_PASSWORD`  
- Behavior: timing-safe string compare to env secret.  
- Implication: env leakage is full Owner takeover; contradicts “no environment-only Owner authentication”.  
- Direction: one-time bootstrap hash into `User`; delete the env password.

### HIGH

**H1 — Sessions cannot be revoked**  
- File: `apps/Dashboard/lib/auth/session.ts` `signSession` / `readSession`; `app/api/auth/logout/route.ts`  
- Behavior: logout clears cookie only. Prisma `Session.revokedAt` unused.  
- Implication: stolen cookie works for up to 8 hours after logout.  
- Direction: persist `tokenHash`, check revoke/expiry on every request, revoke on logout.

**H2 — Disable / role change do not affect live sessions**  
- File: `users.ts` `updateUser`; `session.ts` payload embeds `role`  
- Behavior: middleware never reloads the user.  
- Implication: disabled file users and role demotions stay privileged until `exp`.  
- Direction: load `User.enabled` and `Role` from DB (or revoke all sessions on those updates).

**H3 — File user store is not a production identity database**  
- File: `users.ts` `DATA_FILE`  
- Behavior: JSON on local disk; gitignored; may fail write on Vercel.  
- Implication: extra accounts disappear or cannot be created in production hosting.  
- Direction: Prisma `User` only.

### MEDIUM

**M1 — Login rate limit is per-instance memory**  
- File: `app/api/auth/login/route.ts` `hits` Map  
- Implication: ineffective across serverless instances.  
- Direction: shared store or edge rate limit.

**M2 — Owner email timing leak**  
- File: `authenticateUser` — Owner mismatch returns before dummy scrypt  
- Direction: always run a hash verify (or dummy hash) on every attempt.

**M3 — UI is not an authorization layer**  
- File: `components/admin/Sidebar.tsx`, `app/page.tsx`  
- Behavior: Users/Translation modules visible to every session.  
- Implication: confusing; not a bypass (API 403).  
- Direction: hide modules from `roleHasPermission` results **in addition to** server checks.

**M4 — Audit `actorId` unused; auth events unlogged**  
- File: `lib/server/audit.ts`  
- Direction: set `actorId` after Prisma users exist; log login success/failure and user-admin.

**M5 — `GET /api/media/[id]` (Dashboard) has no permission code**  
- File: `app/api/media/[id]/route.ts`  
- Any authenticated role can fetch uploads. Usually acceptable; document it.

**M6 — Hash algorithm mismatch**  
- Schema default `argon2id`; runtime `scrypt`.  
- Direction: pick one (Argon2id matches schema) and migrate hashes.

**M7 — Sanity leftover secret names**  
- `SANITY_REVALIDATE_SECRET` still accepted; local Dashboard env still has Sanity write-token **name**.  
- Direction: remove after confirming no caller; do not reintroduce Sanity.

### LOW

**L1 — Session payload is readable (email/role).** HMAC, not encrypted.  
**L2 — No session rotation / idle timeout.** Fixed 8h.  
**L3 — No user delete, password reset, or invite flow.**  
**L4 — `requireRole` dead code.**  
**L5 — `audit.read` has no API.**  
**L6 — Login page does not redirect an already-valid session.**  
**L7 — Documented local Owner password string in README / bootstrap** (local convenience; must not be used in production).

### INFORMATIONAL

**I1 — Client never receives password hashes.**  
**I2 — `server-only` on password/users.**  
**I3 — Cookie flags (HttpOnly, SameSite=Lax, Secure in prod) are set correctly for a first-party Dashboard.**  
**I4 — Origin check on state-changing auth/CMS routes.**  
**I5 — Website content loader is read-only `server-only`.**  
**I6 — Prisma auth tables and seed Role/Permission rows are ready for Phase 4.**  
**I7 — No next-auth / lucia / jwt library in play.**

---

## 17. Current vs Target Architecture

**Target**

```
Dashboard → Authentication → PostgreSQL User → Session → Role → Permission
  → Protected API → Prisma → PostgreSQL
```

Roles: Owner, Admin, Editor, Employee. PostgreSQL is source of truth.

**Current**

```
Dashboard → env Owner plaintext  OR  .data/users.json scrypt
  → HMAC cookie (role inside)
  → middleware
  → requirePermission → Prisma RolePermission (optional)
  → Prisma CMS writes
```

| Target rule | Current |
|---|---|
| No Sanity authentication | **Met** (leftover files/env names only) |
| No JSON user storage | **Failed** — `.data/users.json` |
| No plaintext passwords | **Failed** — Owner env |
| No client-only authorization | **Met** for APIs; UI hiding incomplete |
| No environment-only Owner | **Failed** |
| Postgres User/Session source of truth | **Failed** |

---

## 18. Recommended Phase 4 Implementation Plan

Do not implement in this audit. Suggested order:

1. **Confirm seed** Role + Permission + RolePermission rows (already in `seed-postgres.ts`).
2. **Choose Argon2id** (matches `passwordAlgo` default) or explicitly adopt scrypt and change the schema default later.
3. **Create the Owner `User` row** from a one-time hashed bootstrap (not a long-lived env password).
4. **Rewrite `authenticateUser`** to Prisma `User` (`enabled`, role include). Dummy-hash on unknown emails.
5. **On login:** create `Session` with `tokenHash` (SHA-256 of random token), `expiresAt`, IP/UA; set cookie to the raw token only.
6. **On each request:** resolve cookie → hash → `Session` where `revokedAt` is null and `expiresAt` > now → `User.enabled` → permissions.
7. **Logout / disable / role change:** set `revokedAt` (or delete sessions).
8. **Move `/api/users`** onto Prisma `User` (create, disable, role). Still forbid creating/promoting Owner unless an explicit Owner-only rule is added later. Do not rank roles in product copy.
9. **Point `writeAuditLog` at `actorId`.** Log login and user-admin.
10. **Remove** `DASHBOARD_OWNER_PASSWORD`, JSON file store, and Owner plaintext compare.
11. **Keep** HMAC or switch cookie to opaque token (opaque + DB hash is enough; HMAC becomes optional).
12. **Do not** reintroduce Sanity, change Hero/theme/Header/Footer, or implement R2 in this phase.

---

## 19. Files That Would Need Modification

Implementation files (future Phase 4 — not changed by this audit):

- `apps/Dashboard/lib/auth/users.ts`
- `apps/Dashboard/lib/auth/password.ts`
- `apps/Dashboard/lib/auth/session.ts`
- `apps/Dashboard/lib/server/http.ts`
- `apps/Dashboard/lib/server/audit.ts`
- `apps/Dashboard/lib/server/permissions.ts`
- `apps/Dashboard/middleware.ts`
- `apps/Dashboard/app/api/auth/login/route.ts`
- `apps/Dashboard/app/api/auth/logout/route.ts`
- `apps/Dashboard/app/api/users/route.ts`
- `apps/Dashboard/components/admin/modules/UsersModule.tsx` (store copy / fileNote)
- `apps/Dashboard/.env.example` / root `.env.example` (drop Owner password after cutover)
- Possibly `apps/web/scripts/seed-postgres.ts` (optional first Owner — only if explicitly approved)
- Docs: `README.md`, `LOCAL_SETUP.md`

Prisma schema / migrations: **only if** Argon2id parameters, password-reset tables, or extra session fields are required. Current models are already sufficient for the target flow.

---

## 20. Verification Plan

After a future implementation (not run in this audit):

1. Unknown email / wrong password → 401, no user enumeration in JSON; similar timing.
2. Valid Prisma Owner login → cookie set; `sessions` row with `tokenHash` ≠ raw cookie.
3. `GET /` without cookie → 307 `/login`.
4. `POST /api/cms` without cookie → 401.
5. Employee session → `cms.write` 403; `cms.read` 200.
6. Editor → write allowed, delete 403.
7. Admin → delete allowed, `users.manage` 403.
8. Owner → users create/disable; cannot create second Owner unless specified.
9. Logout → cookie cleared **and** `revokedAt` set; replay of old cookie → 401.
10. Disable user → existing cookie rejected.
11. Role change → new permission set on next request or sessions revoked.
12. Audit row has `actorId` for CMS writes and login.
13. No `DASHBOARD_OWNER_PASSWORD` required to log in.
14. No `.data/users.json` reads.
15. Client responses still contain no hashes.
16. `pnpm typecheck:dashboard`, Dashboard lint, `pnpm build`.
17. Static check that Website still has no Dashboard auth imports.

---

## Authentication status labels

**AUTHENTICATION STATUS:** PARTIAL

**SESSION STATUS:** FUNCTIONAL (HMAC cookie) — not PRODUCTION-READY vs target

**RBAC STATUS:** FUNCTIONAL (API permission codes + seed) — PARTIAL vs PostgreSQL User binding

**API PROTECTION:** FUNCTIONAL

**PASSWORD SECURITY:** PARTIAL

**AUDIT LOGGING:** PARTIAL

**OVERALL:** Implement Phase 4 by moving authentication and sessions onto Prisma `User` / `Session`, hashing the Owner credential, and removing env-plaintext Owner plus `.data/users.json`. Do not implement that in this audit.
