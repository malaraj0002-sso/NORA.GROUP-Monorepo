# Implementation Log

## 2026-09-14 — Phase 1: Monorepo hygiene and baseline cleanup

**Branch:** `main` (started at `e7b182f`, ahead of `origin/main`)  
**Scope:** Workspace naming, lockfile/package-manager consistency, gitignore, tracked OS junk.  
**Not in this phase:** authentication, RBAC, Dashboard redesign, Sanity architecture, AI translation, themes, website UI rewrite.

---

### Actions actually performed

1. Renamed workspace package `name` fields:
   - `apps/web`: `nora-group` → `@nora/web`
   - `apps/Dashboard`: `nextjs` → `@nora/dashboard`
2. Updated root scripts to `pnpm --filter @nora/web` and `@nora/dashboard`.
3. Added root scripts: `lint`, `lint:web`, `lint:dashboard`, `typecheck`, `typecheck:web`, `typecheck:dashboard`, `check`.
4. Set root `"packageManager": "pnpm@9.15.0"` (matches lockfile v9; Corepack used this version).
5. Removed redundant npm lockfiles (`apps/web/package-lock.json`, `apps/Dashboard/package-lock.json`). Authoritative lockfile remains `pnpm-lock.yaml`.
6. Removed tracked `desktop.ini`.
7. Expanded root `.gitignore` (`dist`, `build`, `coverage`, `.turbo`, `desktop.ini`, logs, `*.tsbuildinfo`, env rules as specified).
8. Added `.npmrc` with `dedupe-peer-dependents=false` to reduce React 18/19 type mixing on a future lockfile re-resolve. **Lockfile was not regenerated** (avoids in-range version drift).
9. Ran `pnpm install` (non-interactive `CI=true` after an interactive prompt interrupted the first attempt).
10. Ran website and dashboard production builds, lint, and typecheck.

No application source, Sanity schemas, or business content files were edited.  
`.env.local` files were not deleted, not read, and not printed.

---

### Files changed

| File | Change |
|------|--------|
| `package.json` | Filters, scripts, `packageManager` |
| `apps/web/package.json` | `name`: `@nora/web` |
| `apps/Dashboard/package.json` | `name`: `@nora/dashboard` |
| `.gitignore` | Broader ignore rules |
| `.npmrc` | New; peer-dedupe isolation (lockfile not rewritten) |

### Files removed

| File | Reason |
|------|--------|
| `apps/web/package-lock.json` | Redundant npm lockfile |
| `apps/Dashboard/package-lock.json` | Redundant npm lockfile |
| `desktop.ini` | Tracked Windows shell metadata |

### Package-name / workspace status

- Root: `nora-group-monorepo` (unchanged)
- Website: `@nora/web` at `apps/web`
- Dashboard: `@nora/dashboard` at `apps/Dashboard`
- `pnpm-workspace.yaml` still `packages: ["apps/*"]` — both apps listed by `pnpm list -r`
- No `packages/` or `apps/api/` added
- Apps do not import each other by package name

### Lockfile / dependency status

- `pnpm-lock.yaml` **not modified** (`Lockfile is up to date`)
- **No dependency version specifiers changed** in any `package.json`
- Nested `package-lock.json` files removed

### Environment / secrets

- Tracked env-related files remain `apps/web/.env.example` and code helpers (`lib/sanity/env.ts`, `sanity/env.ts`)
- No `.env` / `.env.local` in `git ls-files`
- No Sanity write tokens, API keys, or passwords found in tracked source (search was for names/patterns only)
- **No tracked secret requiring history cleanup**

---

### Commands executed

| Command | Result |
|---------|--------|
| `pnpm --version` | `9.15.0` (Corepack fetched this after `packageManager` was set) |
| `pnpm install` (first, interactive) | Prompted to recreate `node_modules`; not a complete install |
| `CI=true pnpm install` | **Success** (exit 0), ~26 min after modules purge; 1432 packages |
| `CI=true pnpm install` (after `.npmrc`) | **Success**; already up to date; lockfile unchanged |
| `pnpm typecheck` | **Failed** (exit 2) — website `tsc` passed; dashboard `tsc` failed (see below) |
| `pnpm --filter @nora/web build` | **Success** (exit 0) |
| `pnpm --filter @nora/dashboard build` | **Success** (exit 0) |
| `pnpm lint:web` | **Failed** (exit 1) — `next lint` has no ESLint config; interactive prompt; **no ESLint file was created** |
| `pnpm lint:dashboard` | **Success** — “No ESLint warnings or errors” |
| `pnpm check` | **Not run as a single command.** Equivalent parts: `typecheck:web` passed; both `build`s passed. Script is `pnpm typecheck:web && pnpm build`. |
| `pnpm dev` / browser | **Not tested.** |
| Lint/typecheck after further source edits | N/A — no app source edits |

### Errors encountered and what was done

1. **Interactive `pnpm install` purge prompt** — reran with `CI=true`.
2. **Dashboard `tsc --noEmit`** — many `TS2786` / `ReactNode` errors: Lucide/`@types/react@19` vs dashboard React 18. **Not caused by the package rename.** Pre-existing mixed React 18 (dashboard) / 19 (website) in one pnpm store. `.npmrc` added but lockfile **not** regenerated. **Not fixed in Phase 1** (would risk dependency resolution changes). Next.js dashboard **build** still type-checked and succeeded.
3. **Website `next lint`** — no ESLint config (known from audit). Failed with setup prompt. **Did not add ESLint packages** (out of Phase 1 scope).

### Remaining issues (real)

- Dashboard `pnpm typecheck` fails (React 18 vs 19 types). Next.js build for dashboard succeeds.
- Website `pnpm lint` fails until ESLint is configured (later phase).
- Root `pnpm lint` / `pnpm typecheck` therefore fail if run as combined scripts.
- Dashboard mock still includes doors content (product, not Phase 1).
- Auth / Dashboard→Sanity / unused Supabase — unchanged, later phases.
- `.npmrc` `dedupe-peer-dependents=false` has **no effect until** a lockfile re-resolve is approved.

### Git status at end of Phase 1

Working tree is **not clean** (changes not committed, as instructed):

- Modified: `.gitignore`, `package.json`, `apps/web/package.json`, `apps/Dashboard/package.json`
- Deleted: `desktop.ini`, both app `package-lock.json` files
- Untracked: `.npmrc`, `IMPLEMENTATION_LOG.md` (this file)

No Sanity, mock-data, or `.env` files in the Phase 1 diff.

**STOP.** Phase 2 not started.
