# Phase 2A — Dashboard → existing Sanity schema mapping

**Date:** 2026-09-14  
**Status:** Documentation only. **No implementation.** Schemas, source, env, and packages were not modified.  
**Rule:** Existing Sanity schemas are the source of truth. Dashboard must adapt. No schema extensions in this slice.

**Locale objects**

| Surface | Keys |
|---------|------|
| Sanity `localeString` / `localeText` | `he`, `ar`, `en`, `ru` |
| Dashboard `LocalizedText` | `he`, `ar`, `en` (**no `ru`**) |

**Mandatory locale merge (future reads/writes)**

- When **reading** Sanity → Dashboard: map `he`/`ar`/`en`; keep `ru` only on the server/document, not in the current Dashboard type.
- When **writing** (later phase, not now): never send `ru: ""`. If Dashboard has no Russian field, **omit `ru`** from the patch so approved Sanity `ru` is unchanged.
- Do not invent Russian copy.

**Identity**

- Dashboard list `id` is a client-generated string. Sanity uses `_id`. After a future read, Dashboard ids must become Sanity `_id`.
- Dashboard `published` ↔ Sanity `visible` (boolean). Invert nothing; both mean “show on the public site.”
- Images: Dashboard stores URL strings. Sanity stores `image` assets. Mapping is URL ← `asset->url` on read; writes need server-side asset upload later (not this slice).

**Doors:** mock service `svc-3` / title Luxury Doors / icon `door-open` is **excluded from all mapping and migration**. See §6.

---

## Shared helpers (apply to every localized field)

| Direction | Rule |
|-----------|------|
| Sanity → Dashboard | `{ he, ar, en }` from document; ignore `ru` in UI |
| Dashboard → Sanity (later) | Patch `{ he, ar, en }` only; **do not include `ru`** |
| Empty Dashboard string | Do not use empty `he`/`ar`/`en` to wipe Sanity if the field was never edited (implementation detail later). Never invent `ru`. |

---

# Per-module mapping

## A. Site module → `siteSettings` (singleton)

**Dashboard type:** `SiteSettings` (`lib/types.ts`)  
**Sanity type:** `siteSettings`  
**Locale:** field-level `localeString` / `localeText` (`he, ar, en, ru`)

| Dashboard field | Sanity field | Match |
|-----------------|--------------|--------|
| `siteName` | `brandName` (string) | Direct (rename) |
| `tagline` (`he,ar,en`) | `tagline` (`localeString`) | Direct + omit `ru` on write |
| `contactEmail` | `email` | Direct |
| `contactAddress` | `address` (`localeString`) | Direct + omit `ru` |
| `logoUrl` | `logo` (image) | Partial (URL vs asset) |
| — | `logoDark` | Sanity-only; Dashboard has one logo |
| `contactPhone` (one string) | `phoneDisplay`, `phoneTel`, `whatsappE164` | **Conflict** — three Sanity fields vs one Dashboard phone |
| — | `pillars`, `workingHours`, `whatsappMessage`, `contactQr`, `seoTitle`, `seoDescription` | Sanity-only; no Dashboard UI |
| `navItems[]` | *(none)* | Unmapped |
| `footerLinks[]` | *(none)* | Unmapped |
| `socialLinks[]` | *(none)* | Unmapped |
| `footerCopyright` | *(none)* | Unmapped (website footer copyright is generated, not CMS) |

**Remove from Dashboard model (for this schema-true slice):** `navItems`, `footerLinks`, `socialLinks`, `footerCopyright` as CMS-backed fields (keep UI only as local chrome, or hide until a future schema).

**Future schema (not now):** nav/social/footer documents; split phone fields in the Dashboard UI; `logoDark`; SEO fields; WhatsApp defaults.

**Migration approach:** Read singleton `siteSettings` (Studio structure id `siteSettings`). Map brand/tagline/email/address/logo only. **Do not write** a single phone into all three Sanity phone fields. Do not import mock Dubai phone/address over production Israel contact data.

**Website consumption:** Yes (`fetchSanityContent` settings slice).

---

## B. Hero module → `homePage` (singleton)

**Dashboard type:** `HeroSlide[]`  
**Sanity type:** `homePage`  
**Locale:** `localeString` / `localeText` / image array

| Dashboard (`HeroSlide`) | Sanity (`homePage`) | Match |
|-------------------------|---------------------|--------|
| Many slides (`id`, `order`, `published`) | **No slide documents** | **Conflict** — 1:N vs singleton |
| `title` per slide | `heroTitle` (one) | Partial: at most **first published slide** → `heroTitle` |
| `subtitle` per slide | `heroSubtitle` | Same |
| `imageUrl` per slide | `heroImages[]` (image array, no per-image title/CTA) | Partial: ordered images only |
| `ctaText`, `ctaLink` | *(none on hero)*; site CTAs are WhatsApp/phone | Unmapped |
| `published` per slide | *(no per-image visible)* | Unmapped |
| — | intro/why/process/services/projects/materials/testimonials/cta copy | Sanity-only; **no Hero module fields** |

**Remove from Dashboard model (schema-true):** per-slide CTA, per-slide publish, treating hero as a slider.

**Future schema (not now):** `heroSlides[]` object array with title, subtitle, image, CTA, order, visible.

**Migration approach:** **Do not migrate Pexels mock slides into Sanity.** For a later **read**, show `heroTitle` / `heroSubtitle` / `heroImages` as a **single hero** (or a flattened image list without per-slide copy). Do not invent slides from `heroImages`.

**Website consumption:** Yes (`home.heroTitle`, `heroSubtitle`, `heroImages`).

---

## C. About module → `aboutPage` (singleton)

**Dashboard type:** `AboutSettings`  
**Sanity type:** `aboutPage`

| Dashboard | Sanity | Match |
|-----------|--------|--------|
| `story` | `body` (`localeText`) | Direct (rename) + omit `ru` |
| `featureBanners[]`.title / description | `values[]`.title / desc | Partial (list of title+text) |
| `featureBanners[]`.icon | *(none)* | Unmapped |
| `featureBanners[]`.id | ephemeral | Use array index / key |
| `vision` | *(none)* | Unmapped |
| `mission` | *(none)* | Unmapped |
| — | `eyebrow`, `title`, `subtitle`, `image`, `valuesTitle` | Sanity-only; no About UI |

**Remove from Dashboard model (schema-true):** `icon` on features; treat vision/mission as **non-persisted** until schema exists.

**Future schema (not now):** `vision`, `mission` (`localeText`); optional `icon` on values.

**Migration approach:** Map story→`body`, banners→`values` (drop icons). **Do not** write vision/mission into `body` (would destroy story). Do not import mock About copy over CMS.

**Website consumption:** Yes. Note: `fetch.ts` maps about hero + body + valuesTitle + image; **values array mapping in fetch was not fully applied in the inspected merge** (`about.values` may remain seed unless added later). Mapping still targets the **schema**, which has `values`.

---

## D. Projects module → `project` (list)

**Dashboard type:** `Project`  
**Sanity type:** `project`

| Dashboard | Sanity | Match |
|-----------|--------|--------|
| `id` | `_id` | After read, use `_id` |
| `title` | `title` (`localeString`, required) | Direct + omit `ru` |
| `description` | `description` (`localeText`) | Direct + omit `ru` |
| `galleryImages[]` | `gallery[]` (images + `alt` localeString) | Partial (URLs vs assets; alt unused in Dashboard) |
| `imageUrl` | `gallery[0]` | Partial (cover = first gallery image on website) |
| `woodTypes[]` | `materials[]` (strings) | Direct (rename) |
| `published` | `visible` | Direct |
| `category` | `category` enum | **Conflict** — see below |
| `featured` | *(none)* | Unmapped |
| `completedDate` | *(none)* | Unmapped |
| — | `slug` (required, read-only once set, from `title.he`) | Sanity-required; Dashboard has **no slug** |
| — | `order` | Sanity-only |
| — | `gallery[].alt` | Sanity-only |

**Category conflict**

| Dashboard `CATEGORIES` | Sanity / website |
|------------------------|------------------|
| Residential, Commercial, Hospitality, Retail, Custom | `kitchens`, `bedrooms`, `wardrobes`, `furniture`, `commercial` |

`Commercial` is the only overlapping **word**; values are not equivalent (`Commercial` vs `commercial`). Invalid Sanity values would break website filters/`ProjectCategory`.

**Remove from Dashboard model (schema-true):** `featured`, `completedDate` as persisted fields; free-form category labels.

**Future schema (not now):** `featured`, `completedAt`; only if product needs them.

**Migration approach:** **Do not bulk-import mock projects** (Pexels, Dubai-style names, wrong categories). Future read: map Sanity category enum into Dashboard; change Dashboard select to website enum. Generate slug from Hebrew title on **create** only (server). Cover image = `gallery[0]`.

**Website consumption:** Yes.

---

## E. Materials module → `material` (list)

**Dashboard type:** `Material` + `MaterialSpec`  
**Sanity type:** `material`

| Dashboard | Sanity | Match |
|-----------|--------|--------|
| `id` | `_id` | After read |
| `description` | `description` (`localeText`) | Direct + omit `ru` |
| `textureImageUrl` | `image` | Partial (URL vs asset) |
| `published` | `visible` | Direct |
| `name` (**string**, not localized) | `name` (`localeString`, required) | **Conflict** |
| `type` (string, e.g. species class) | *(none)* | Unmapped |
| `specifications.*` (12 keys: hardness, density, origin, … janka, weight) | *(none)* | Unmapped |
| — | `characteristics`, `applications`, `finishes` (`localeText`) | Sanity-only; no Dashboard fields |
| — | `slug` (from `name.he`, then read-only) | Sanity-required |
| — | `order` | Sanity-only |

**Remove from Dashboard model (schema-true):** `specifications` object; `type` as CMS field; monolingual `name` (replace with `localeString`).

**Future schema (not now):** structured spec object or `type` string — **only if** product still wants a spec sheet on the website (website today uses characteristics/applications/finishes, not Janka fields).

**Migration approach:** Read Sanity `name`/`description`/`characteristics`/`applications`/`finishes`/`image`/`visible`. Put `name.he` (or `t()`) into current `name` string for display until types gain locales. **Do not** flatten specs into `description`. **Do not** import mock material specs into Sanity.

**Website consumption:** Yes.

---

## F. Services module → `service` (list)

**Dashboard type:** `Service` + `ServiceStep[]`  
**Sanity type:** `service`

| Dashboard | Sanity | Match |
|-----------|--------|--------|
| `id` | `_id` | After read |
| `title` | `title` (`localeString`) | Direct + omit `ru` |
| `description` | `description` (`localeText`) | Direct + omit `ru` |
| `imageUrl` | `image` | Partial |
| `published` | `visible` | Direct |
| `icon` | *(none)* | Unmapped (`door-open` must never be stored as a service identity) |
| `steps[]` | *(none)* | Unmapped — **not** `features[]` |
| — | `features[]` (`localeString` array) | Sanity-only; website uses these as service bullets |
| — | `imageAlt` | Sanity-only |
| — | `slug` (required, from `title.he`, then read-only) | Must be one of website `SERVICE_SLUGS` or site 404 / type mismatch |
| — | `order` | Sanity-only |

**Website slugs (no doors):** `kitchens`, `bedrooms`, `wardrobes`, `walk-in-closets`, `custom-furniture`, `offices`, `commercial`.

**Conflict:** Dashboard mock services are “Custom Furniture”, “Interior Finishing”, “Luxury Doors” — **not** the website slug set. Importing mock services would create wrong IA.

**Remove from Dashboard model (schema-true):** `icon`; `steps` as persisted CMS (website process lives on `howWeWorkPage` and home `process*` copy). Optional later: map `steps` titles into `features` **only** if product agrees (lossy: drops step descriptions/order semantics).

**Future schema (not now):** `icon`; `steps[]`; **never** a doors service type.

**Migration approach:** Read existing Sanity services only. Filter **out** any document whose slug/title/icon is door-related. Do not create services from mock. Dashboard create (later) must set slug from allowlist.

**Website consumption:** Yes.

---

## G. Testimonials → `testimonial` (list)

**Dashboard type:** `Testimonial`  
**Sanity type:** `testimonial`

| Dashboard | Sanity | Match |
|-----------|--------|--------|
| `id` | `_id` | After read |
| `clientName` | `name` (string, required) | Direct (rename) |
| `rating` (number) | `rating` (1–5, required) | Direct (clamp 1–5) |
| `text` | `review` (`localeText`, required) | Direct (rename) + omit `ru` |
| `published` | `visible` | Direct |
| `clientTitle` | *(none)* | Unmapped |
| `avatarUrl` | *(none)* | Unmapped |
| — | `project` (`localeString`, project **type** copy) | Sanity-only; Dashboard has no field |
| — | `order` | Sanity-only |

**Remove from Dashboard model (schema-true):** `clientTitle`, `avatarUrl` as persisted.

**Future schema (not now):** `clientTitle`, `avatar`.

**Migration approach:** Read name/rating/review/visible/project. Do not import mock testimonials (fictional names). Do not put `clientTitle` into `project`.

**Website consumption:** Yes.

---

## H. FAQ → `faqItem` (list)

**Dashboard type:** `FAQItem`  
**Sanity type:** `faqItem`

| Dashboard | Sanity | Match |
|-----------|--------|--------|
| `id` | `_id` | After read |
| `question` | `question` (`localeString`, required) | Direct + omit `ru` |
| `answer` | `answer` (`localeText`, required) | Direct + omit `ru` |
| `order` | `order` (number) | Direct |
| `published` | `visible` | Direct |
| — | `category` (string) | Sanity-only; Dashboard has no category |

**Remove from Dashboard model:** none required; add `category` later as optional UI bound to existing field.

**Future schema:** none required for FAQ.

**Migration approach:** Strongest list mapping. **Do not** import mock FAQs over CMS. Read Sanity FAQ; preserve `category` on write by not sending empty category.

**Website consumption:** Yes.

---

## I. Blog → `blogPost` (list)

**Dashboard type:** `BlogPost`  
**Sanity type:** `blogPost`

| Dashboard | Sanity | Match |
|-----------|--------|--------|
| `id` | `_id` | After read |
| `title` | `title` (`localeString`) | Direct + omit `ru` |
| `slug` (string) | `slug.current` (from `title.he`, then read-only) | Direct on read; create-only on write |
| `excerpt` | `excerpt` (`localeText`) | Direct + omit `ru` |
| `content` | `content` (`localeText`) | Direct + omit `ru` |
| `featuredImageUrl` | `image` | Partial |
| `author` | `author` (string, default Nora Group) | Direct |
| `publishedAt` | `date` (`date`) | Direct (rename; date-only) |
| `published` | `visible` | Direct |
| `tags[]` | *(none)* | Unmapped |
| — | `category` (string) | Sanity-only; Dashboard uses `tags` instead |

**Conflict:** `tags[]` vs `category` (single string). Do not join tags into category without a rule.

**Remove from Dashboard model (schema-true):** `tags` as persisted.

**Future schema (not now):** `tags` array **or** keep single `category` and add a Dashboard category field.

**Migration approach:** Best overall document mapping. Website list GROQ omits `content`; detail uses `fetchBlogPostContent($slug)`. Future Dashboard read should fetch `content` for the editor. Do not import mock blog posts. Slug: allowlist `isSafeSlug`.

**Website consumption:** Yes.

---

## J. How We Work — **no Dashboard module**

**Sanity type:** `howWeWorkPage` (singleton: eyebrow, title, subtitle, image, `steps[]` with `number`, `title`, `description`)  
**Website:** Yes (`/how-we-work`).  
**Dashboard:** Missing.

This is an **existing Sanity capability**, not a Dashboard feature. Service **steps** in the Dashboard are a different shape and must not be written here unless a product decision maps them (not recommended: how-we-work is company process; service steps are per-service).

**Future:** add a Dashboard module bound to `howWeWorkPage`, or leave Studio-only.

---

## K. UI labels — **no Dashboard module**

**Sanity type:** `uiLabels` — **one document per locale** (`locale`: `he` \| `ar` \| `en` \| `ru`) plus string fields (`home`, `about`, … `relatedProjects`).  
**Not** a `localeString` object.  
**Website:** Yes (nav + some footer/404 strings). Hardcoded on website: `madeBy`, legal cookie strings, etc.  
**Dashboard:** Nav labels are a **different** model (`navItems` href list).

**Do not** map `navItems` ↔ `uiLabels` without a dedicated design: `uiLabels` does not store `href` or order; website hrefs are **hardcoded** in `lib/nav.ts`.

---

## L. Contact page hero — **no Dashboard module**

**Sanity:** `contactPage` (eyebrow, title, subtitle, image).  
Contact **numbers** belong to `siteSettings`, not this document.

---

## M. Overview module

Aggregates counts from in-memory `AdminData`. No Sanity type. Future: derive from list query counts. No migration of mock totals.

---

# Summary sections (required)

## 1. Direct mappings

These can bind to existing fields with rename + locale omit-`ru` only:

| Area | Dashboard → Sanity |
|------|-------------------|
| Site | `siteName`→`brandName`, `tagline`, `contactEmail`→`email`, `contactAddress`→`address` |
| About | `story`→`body` |
| Projects | `title`, `description`, `woodTypes`→`materials`, `published`→`visible` |
| Materials | `description`, `published`→`visible` |
| Services | `title`, `description`, `published`→`visible` |
| Testimonials | `clientName`→`name`, `rating`, `text`→`review`, `published`→`visible` |
| FAQ | `question`, `answer`, `order`, `published`→`visible` |
| Blog | `title`, `slug`, `excerpt`, `content`, `author`, `publishedAt`→`date`, `published`→`visible` |

Images are “direct” only after an asset↔URL adapter.

---

## 2. Partial mappings

| Area | Why partial |
|------|-------------|
| Site phones / logos | 1 phone vs 3 fields; 1 logo vs `logo`+`logoDark` |
| Hero | Slider vs singleton `heroTitle`/`heroSubtitle`/`heroImages` |
| About banners | `values[]` without icons; missing page hero fields |
| Projects gallery / cover / category | Assets + **enum mismatch** + no slug in Dashboard |
| Materials name | string vs `localeString`; unused Sanity copy fields |
| Services image | no slug/features in Dashboard |
| Testimonials | no `project` type field |
| Blog image | `tags` vs `category` |
| FAQ | missing `category` in Dashboard |

---

## 3. Unmapped Dashboard features

- Navbar link CRUD (`navItems`)
- Footer link CRUD + `footerCopyright`
- Social links
- Hero as multiple CTA slides (`ctaText`, `ctaLink`, per-slide `published`)
- About `vision`, `mission`, feature `icon`
- Project `featured`, `completedDate`, Dashboard category list
- Material `type` + entire `MaterialSpec`
- Service `icon` + `steps[]`
- Testimonial `clientTitle`, `avatarUrl`
- Blog `tags[]`
- Overview metrics from mock

---

## 4. Existing Sanity capabilities with no Dashboard module

| Type | Website |
|------|---------|
| `homePage` intro/why/process/section titles/CTA | Home |
| `howWeWorkPage` | `/how-we-work` |
| `contactPage` | `/contact` hero |
| `uiLabels` (per locale) | Nav/chrome strings |
| `siteSettings` pillars, hours, WhatsApp message, QR, SEO, `logoDark`, split phones | Contact/SEO |
| `service.features`, `service.imageAlt`, `service.slug`, `order` | Services |
| `material.characteristics`, `applications`, `finishes`, `slug` | Materials |
| `project.slug`, `order`, gallery `alt` | Projects |
| `testimonial.project`, `order` | Testimonials |
| `faqItem.category` | FAQ grouping |
| `blogPost.category` | Blog |
| Legal pages | **Not CMS** (`lib/content/legal.ts`) |

Studio remains the editor for these until Dashboard modules exist.

---

## 5. Potential future schema extensions (not in 2A)

Only if product later **approves** schema changes:

- `heroSlides[]` on `homePage` or a `heroSlide` type
- Nav / social / footer types
- `aboutPage.vision` / `mission`; value `icon`
- `project.featured`, `completedAt`
- `material` spec object or `type`
- `service.icon`, `service.steps`
- `testimonial.clientTitle`, `avatar`
- `blogPost.tags`
- **Never:** doors as a service

Until then, Dashboard should **drop or localize-only** those fields.

---

## 6. Items that must NOT be migrated

| Item | Reason |
|------|--------|
| **Luxury Doors** (`svc-3`, icon `door-open`, AR/HE/EN door copy) | Nora Group does not sell doors |
| Entire `mock-data.ts` as a Sanity import | Wrong geography/phone, Pexels URLs, wrong categories, fictional clients, doors |
| Empty `ru` patches | Would wipe approved Russian |
| Invented Russian | Forbidden |
| Dashboard `Residential`/`Hospitality`/… categories written to `project.category` | Invalid vs website enum |
| Mock nav/social URLs | Not in schema; would not appear on website |
| Per-slide hero CTAs written into `heroTitle` in a loop | Would destroy singleton home hero |

**Doors filter (future code):** exclude if `icon === 'door-open'` OR slug/title matches door/דלת/باب (any locale). Prefer **never reading mock services into a write path**.

---

## 7. Localization risks

1. Dashboard has **no `ru`**. Writes that set `localeString` as `{he,ar,en,ru:''}` **overwrite** approved Russian. **Omit `ru` in patches.**
2. Monolingual Dashboard `Material.name` cannot round-trip `name.ar` / `name.ru`.
3. `uiLabels` is **per-document locale**, not field-level — different from every other type and from Dashboard `LocalizedText`.
4. Website `t()` falls back to Hebrew; Dashboard shows only the active tab language — editors may think AR/EN/RU are empty when Hebrew is serving the site.
5. Hebrew is required on several Sanity fields (`localeString.he`). Dashboard can save empty `he` in mock; that would fail Sanity validation on write.
6. Do not change existing approved localized CMS content in this phase (no writes).

---

## 8. Recommended implementation order (later; not this document’s job to code)

Still **no mutations, no auth** until those phases. Suggested **read-mapping** order once approved:

1. Locale helper: Sanity `{he,ar,en,ru}` → Dashboard `{he,ar,en}`; reverse patch **omits `ru`**.
2. **FAQ** (cleanest list).
3. **Blog** (strong match; fetch body).
4. **Testimonials** (drop title/avatar in UI persistence).
5. **Projects** (fix category enum in UI to Sanity values; slug read-only).
6. **Materials** (localized name; hide spec sheet from persistence).
7. **Services** (allowlist slugs; **exclude doors**; hide steps/icon from persistence).
8. **Site settings** subset (brand, email, address, logo) — never clobber phones without a three-field UI.
9. **About** story + values only.
10. **Hero** as read-only singleton (not slider persist).
11. Leave How We Work, UI labels, contact hero, nav/footer/social to Studio or a later approved schema/UI.

**STOP.** No source or schema changes in 2A.
