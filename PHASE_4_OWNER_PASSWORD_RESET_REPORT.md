# Phase 4A — Owner Password Reset Report

**Date:** 19 September 2026  
**Mode:** Interactive local password replacement for `owner@localhost`. No application-code change. No Prisma schema change. No commit. No push.

The password was entered in a local PowerShell window with `Read-Host -AsSecureString`. It was never sent to chat, written to the repository, written to `.env`, printed, or recorded here.

---

## Owner

- email: `owner@localhost`
- role: owner
- enabled: true
- Owner count: 1

---

## Password Reset

- previous temporary password: unknown / not recovered
- new password entered interactively by operator: yes
- password persisted as plaintext: no
- password algorithm: Argon2id
- `passwordAlgo = argon2id`
- passwordHash present = yes
- passwordHash Argon2-encoded = yes
- password stored in repository: no
- password stored in `.env`: no
- password stored in `.env.example`: no (name only, empty)
- Git-tracked files: no password value

Update path: OS temp script (not in the repo) hashed with Dashboard `argon2@0.45.1` (`argon2.argon2id`) and wrote only `User.passwordHash` + `User.passwordAlgo` for `owner@localhost`. Email, role, and enabled were not changed.

---

## Session Security

| Check | Result |
|---|---|
| Previous sessions revoked at password change | **PASS** (1 active session revoked; 0 remained) |
| Old temporary credential tested | **NOT RUN** — unknown, not reconstructed |
| New login creates new session | **PASS** (cookie `nora_session` issued) |
| Logout clears cookie | **PASS** |
| Replay of logged-out cookie | **PASS** (401) |
| Leftover test session after logout | One active row remained after the PowerShell logout client; it was then revoked. Active now = 0 |

---

## Authentication

| Check | Result |
|---|---|
| New password login | **PASS** (`ok: true`, `role = owner`) |
| Wrong password | **PASS** (401) |
| Unauthenticated `GET /` | **PASS** (307 `/login`) |
| Unauthenticated `/api/content` | **PASS** (401) |
| Unauthenticated `/api/users` | **PASS** (401) |
| Fake cookie | **PASS** (401) |
| `GET /login` | **PASS** (200) |
| Authenticated `GET /` / `/api/content` / `/api/users` via PowerShell client | **NOT CONFIRMED** — login succeeded and a session cookie was issued; those follow-up GETs did not record HTTP 200 in the client |

---

## RBAC

| Check | Result |
|---|---|
| Owner role from login | **PASS** |
| Owner permissions (seeded RolePermission; not modified) | **PASS** |
| Server-side authorization | **PASS** (unauthenticated users API 401; login role from PostgreSQL User) |

---

## Audit Logging

No dedicated password-change audit action exists. The audit system was not redesigned.

| Event | Result |
|---|---|
| Successful login `actorId` | **PASS** (Owner Prisma user id) |
| Logout `actorId` | **PASS** |
| Failed login metadata | **PASS** (no password / hash / token) |

---

## Regression

- Prisma schema unchanged
- Website unchanged
- Hero / Header / Footer / Theme unchanged
- R2 unchanged
- Sanity not introduced
- Seven services unchanged
- No doors added

`git diff -- prisma/schema.prisma` empty. `git diff -- apps/web` empty.

---

## Tooling

| Item | Result |
|---|---|
| Interactive `Read-Host -AsSecureString` | Used |
| Dashboard `next start` | Started for confirmation tests; stopped afterward |
| Application code | Unchanged |
| Temp scripts | OS temp only; not added to the app |

---

## Final Status

**VERIFIED WITH NOTES**

Notes:

1. Live login with the operator-chosen password succeeded. Authenticated page/content/users GETs were not confirmed by the PowerShell HTTP client after that login.
2. Logout reported a cleared cookie and replay 401; one Session row was still active afterward and was revoked.
3. The previous Cursor temporary password was not available and was not tested.

Commit: **NO**  
Push: **NO**
