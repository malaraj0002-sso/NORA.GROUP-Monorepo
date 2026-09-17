# Phase 1 — PostgreSQL foundation report

**Date:** 17 September 2026  
**Checkpoint before this phase:** `56212d5`  
**This phase:** Prisma + PostgreSQL schema only. No data migration. No Sanity deletion. No commit.

PostgreSQL is **not** the live source of truth yet. The public website still reads seed + Sanity. The Dashboard still writes Sanity.

---

## 1. Current architecture discovered

The monorepo remains two Next.js 15 apps under pnpm (`apps/web`, `apps/Dashboard`).

| Layer | Current behaviour |
|---|---|
| Website content | `getSiteContent()` in `apps/web/lib/content/getContent.ts` returns `SiteContent` from TypeScript seed, optionally overlaid with Sanity GROQ |
| Dashboard CMS | `POST /api/cms` mutates Sanity; reads GROQ or mock |
| Auth | HMAC cookie `nora_session`; Owner from env (plaintext); extra users in `.data/users.json` with scrypt |
| RBAC | Role ranks `employee < editor < admin < owner` on API routes; no permission table |
| Media | Sanity asset API + `/public/images` |
| Locales | Website `he`, `ar`, `en`, `ru`; Dashboard models omit `ru` |
| Services | Website seed has the seven official slugs; Prisma did not exist |

There was **no** Prisma schema, **no** PostgreSQL client, and **no** `DATABASE_URL` before this phase.

Website contract that a future repository must return: `apps/web/lib/content/types.ts` (`SiteContent`).

---

## 2. PostgreSQL architecture created

- Provider: **PostgreSQL** (not SQLite, not Supabase).
- Location: `prisma/schema.prisma` at the **repository root**.
- Prisma: **6.16.3** (`prisma` + `@prisma/client`), pinned after pnpm initially resolved an unwanted 8.x RC.
- Apps are **not** imported against Prisma yet. Sanity runtime is unchanged.

Localized copy uses PostgreSQL **JSONB** with the existing website shape:

```json
{ "he": "", "ar": "", "en": "", "ru": "" }
```

This avoids duplicating whole tables per language and can be assembled into `LocalizedString` without changing the website UI.

UI chrome (`nav`, `ui`, `category` labels) uses a normalized `UiCopy` table: one row per `(locale, namespace, key)`.

---

## 3. Prisma models created

**Auth / RBAC**

- `User` — `passwordHash` + `passwordAlgo` (`argon2id` default). No plaintext password column.
- `Role` — `RoleName`: `owner`, `admin`, `editor`, `employee`
- `Permission` — string `code` (extensible without a new enum)
- `RolePermission`
- `Session` — `tokenHash` (not the raw cookie), `expiresAt`, optional `revokedAt`

**Audit**

- `AuditLog` — actor, action, entity, entityId, metadata JSON, IP, user agent, createdAt

**Media**

- `Media` — provider (`R2` / `LOCAL` / `EXTERNAL`), objectKey, url, filename, mime, size, width, height, localized alt JSON

**Site / pages**

- `SiteSettings` (singleton)
- `HomePage` (singleton) + `HomeIntroFeature`, `HomeWhyItem`, `HomeHeroMedia`
- `AboutPage` + `AboutValue`
- `HowWeWorkPage` + `HowWeWorkStep`
- `ContactPage`
- `UiCopy`
- `LegalDocument` + `LegalSection` (website contract; not in Sanity today)

**Catalog**

- `Service` + `ServiceFeature` + `ServiceMedia`
- `Project` + `ProjectMedia`
- `Material` + `MaterialMedia`
- `Testimonial`
- `BlogPost`
- `FaqItem`

---

## 4. Relations

- `User` → `Role` (Restrict)
- `User` → `Session` (Cascade)
- `User` → `AuditLog` (SetNull so logs remain)
- `Role` ↔ `Permission` via `RolePermission` (Cascade)
- Page/catalog rows → `Media` (`SetNull` on optional singles; `Restrict` on join tables so assets are not deleted from under content)
- Ordered join tables: `ServiceMedia`, `ProjectMedia`, `MaterialMedia`, `HomeHeroMedia`
- Child collections cascade with their parent page/document

Indexes cover slug uniqueness, `(published, sortOrder)`, category, session expiry, and audit lookups.

---

## 5. Localization strategy

| Kind | Storage | Maps to |
|---|---|---|
| Field-level copy | JSONB `{ he, ar, en, ru }` | `LocalizedString` |
| UI labels / nav / category names | `UiCopy` rows | `SiteContent.nav`, `.ui`, `.categoryLabels` |
| Locale enum | `he \| ar \| en \| ru` | `AppLocale` |

Russian is required in the JSON contract. Dashboard currently edits only he/ar/en; that is a later wiring gap, not a schema gap.

---

## 6. Authentication schema

The schema can replace env/file users later:

- Unique email
- Hash only (`passwordHash`), algorithm name stored
- Sessions stored hashed, revocable, with expiry
- No password-reset table yet (out of this phase)

Nothing in this phase logs users in via Postgres. Existing HMAC + `users.json` still run.

---

## 7. RBAC schema

Roles are first-class rows, not UI-only.

Intended permission codes (to seed in a later phase, not now):

- `cms.read`
- `cms.write`
- `cms.delete`
- `media.upload`
- `users.manage`
- `translations.manage`
- `audit.read`

These match current Dashboard API gates. No permission rows were inserted.

---

## 8. Audit log schema

`AuditLog` records actor (optional User), action, entity, entityId, JSON metadata, IP, user agent, createdAt. No writers exist yet.

---

## 9. Media / R2 preparation

`Media.provider` can be `R2`. Fields exist for object key, public URL, mime, size, dimensions, localized alt.

This phase:

- does **not** upload to R2
- does **not** insert fake R2 URLs
- does **not** change Sanity asset uploads

`EXTERNAL` / `LOCAL` exist for a later import of existing `/public/images` or CDN URLs.

---

## 10. Service validation

Closed PostgreSQL enum `ServiceSlug` (DB values):

1. `kitchens`
2. `bedrooms`
3. `wardrobes`
4. `walk-in-closets`
5. `custom-furniture`
6. `offices`
7. `commercial`

There is **no** `doors` / `luxury-doors` member. A door service cannot be stored without a future schema change.

`Service.slug` is unique, so at most one row per official slug.

**Project categories** were **not** rewritten to the seven services. They match `apps/web/lib/constants.ts` `PROJECT_CATEGORIES`:

`kitchens`, `bedrooms`, `wardrobes`, `furniture`, `commercial`

Documented mapping (not applied as data):

| ProjectCategory | Official service |
|---|---|
| kitchens | kitchens |
| bedrooms | bedrooms |
| wardrobes | wardrobes |
| furniture | custom-furniture (offices and walk-in-closets have no project category today) |
| commercial | commercial |

Door-related **validation code** in the Dashboard (`isForbiddenDoorService`, `rejectDoorMutation`) was left in place.

---

## 11. Sanity components intentionally preserved

Do **not** remove these until a later cutover phase:

- `apps/web` packages: `sanity`, `next-sanity`, `@sanity/icons`, `@sanity/image-url`, `@sanity/vision`
- `apps/web/app/studio/**`
- `apps/web/sanity/**`, `sanity.config.ts`, `sanity.cli.ts`
- `apps/web/lib/sanity/**`, `scripts/seed-sanity.ts`
- `apps/web/app/api/revalidate/route.ts`
- Dashboard `lib/sanity/**`, `lib/server/content/mutate.ts`, `app/api/cms/route.ts`, `app/api/media/route.ts`
- Env names: `NEXT_PUBLIC_SANITY_*`, `SANITY_API_WRITE_TOKEN`, `SANITY_REVALIDATE_SECRET`

Sanity remains the live CMS. It is **not** the target architecture.

---

## 12. Files created

| Path | Purpose |
|---|---|
| `prisma/schema.prisma` | PostgreSQL data model |
| `prisma/migrations/20260917220000_init/migration.sql` | Initial migration SQL (not applied) |
| `prisma/migrations/migration_lock.toml` | Prisma lock (`postgresql`) |
| `.env.example` | Root `DATABASE_URL=` placeholder |
| `PHASE_1_POSTGRES_FOUNDATION_REPORT.md` | This report |

---

## 13. Files modified

| Path | Change |
|---|---|
| `package.json` | Prisma 6.16.3, `@prisma/client` 6.16.3, `prisma:*` scripts |
| `pnpm-lock.yaml` | Lockfile updated by pnpm |
| `apps/web/.env.example` | `DATABASE_URL=` |
| `apps/Dashboard/.env.example` | `DATABASE_URL=` |

No website views, Dashboard UI, Sanity schemas, or API runtime behaviour were changed.

---

## 14. Commands executed

```text
pnpm add -w @prisma/client
pnpm add -wD prisma
```

Those first resolved `@prisma/client@7` and `prisma@8.0.0-rc.15`. They were **replaced** with pinned 6.16.3:

```text
pnpm install
```

(after editing `package.json` to `prisma@6.16.3` and `@prisma/client@6.16.3`)

Validation (placeholder URL only; **no connection to a real/production database**):

```text
DATABASE_URL=postgresql://localhost:5432/nora_group  pnpm prisma validate
DATABASE_URL=postgresql://localhost:5432/nora_group  pnpm exec prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
DATABASE_URL=postgresql://localhost:5432/nora_group  pnpm prisma generate
pnpm typecheck
```

**Not run:** `prisma migrate dev`, `prisma migrate deploy`, `prisma db push`, `migrate reset`, seed, DROP/TRUNCATE.

---

## 15. Validation results

| Command | Result |
|---|---|
| `pnpm prisma validate` | Pass — schema valid |
| `prisma migrate diff --from-empty` | Pass — SQL generated; ServiceSlug has the seven values only |
| `pnpm prisma generate` | Pass — client v6.16.3 |
| `pnpm typecheck` | Pass — `@nora/web` and `@nora/dashboard` |

`DATABASE_URL` is still empty in examples. No production database was used.

To apply this migration later on a **local** Postgres (not production):

1. Put a real local URL in a gitignored root `.env` (`DATABASE_URL=...`).
2. Run: `pnpm prisma migrate deploy`

---

## 16. Known limitations

- Apps still talk to Sanity / seed / `users.json`. Prisma is unused at runtime.
- No role/permission/service rows were seeded (by design).
- Auth is not switched to Argon2id or Postgres sessions yet.
- Dashboard still cannot edit `ru`; the schema can store it.
- `ContentStatus` enum was **not** added; the website uses `visible`/`published` booleans.
- Translation review JSON file was **not** modeled (later phase).
- R2 is schema-only.
- Initial `pnpm add prisma` briefly pulled Prisma 8 RC; the tree is pinned to 6.16.3.
- Applying the migration needs a local Postgres that does not exist in this phase.

---

## 17. Exact next recommended phase

**Phase 2 — Local database + repository (still no Sanity deletion):**

1. Create a local PostgreSQL database and set gitignored `DATABASE_URL`.
2. Run `pnpm prisma migrate deploy` against that local database only.
3. Seed **roles, permissions, and the seven services** (no doors, no fake customers).
4. Add a server-only `getSiteContentFromPostgres()` that returns the existing `SiteContent` shape — **do not switch the website to it until parity is proven**.
5. Keep Sanity as the live path until that repository is complete.

Do **not** yet: migrate production content, rewrite Dashboard CRUD, upload R2, or delete Studio.

---

## Claims this report does **not** make

- Data has been migrated.
- PostgreSQL is the live source of truth.
- Authentication now uses the database.
- Sanity has been removed.
