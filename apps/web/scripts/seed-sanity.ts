/**
 * Bootstrap the Sanity dataset with the Website's existing published content.
 *
 * Why: the Website renders `lib/content/seed.ts` whenever Sanity has no documents.
 * The Dashboard writes to Sanity. Until Sanity holds the same content, the two apps
 * do not share a source of truth. This script copies the seed (the real Nora Group
 * content that is live today) into Sanity exactly once.
 *
 * Safety:
 *   - Uses `createIfNotExists` only. Existing documents (including Dashboard edits) are never touched.
 *   - Deterministic `_id`s so re-running is a no-op and so the Dashboard's singleton patches
 *     (`siteSettings`, `homePage`, `aboutPage`, `howWeWorkPage`) resolve.
 *   - Local images in /public are uploaded once; Sanity de-duplicates identical files by hash.
 *   - `--dry-run` prints the plan and writes nothing.
 *
 * Run from apps/web:  pnpm cms:bootstrap [-- --dry-run]
 * Env (names only):   NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET,
 *                     NEXT_PUBLIC_SANITY_API_VERSION, SANITY_API_WRITE_TOKEN
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { seedContent } from '@/lib/content/seed';
import type { LocalizedString } from '@/lib/content/types';
import { LOCALES } from '@/lib/constants';

const DRY_RUN = process.argv.includes('--dry-run');

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || 'production';
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || '2025-01-01';
const token = process.env.SANITY_API_WRITE_TOKEN?.trim();

if (!projectId || projectId === 'placeholder') {
  console.error('NEXT_PUBLIC_SANITY_PROJECT_ID is not set.');
  process.exit(1);
}
if (!token && !DRY_RUN) {
  console.error('SANITY_API_WRITE_TOKEN is not set (required unless --dry-run).');
  process.exit(1);
}

const API = `https://${projectId}.api.sanity.io/v${apiVersion}`;
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

type SanityImage = { _type: 'image'; _key?: string; asset: { _type: 'reference'; _ref: string } };
type Doc = Record<string, unknown> & { _id: string; _type: string };

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const assetCache = new Map<string, string>();

async function uploadLocalImage(publicPath: string): Promise<string | null> {
  if (!publicPath.startsWith('/')) return null;
  const cached = assetCache.get(publicPath);
  if (cached) return cached;

  const filePath = path.join(PUBLIC_DIR, publicPath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext];
  if (!mime) {
    console.warn(`skip (unsupported type): ${publicPath}`);
    return null;
  }

  let bytes: Buffer;
  try {
    bytes = await readFile(filePath);
  } catch {
    console.warn(`skip (missing file): ${publicPath}`);
    return null;
  }

  if (DRY_RUN) {
    const fake = `image-dryrun-${path.basename(filePath, ext)}`;
    assetCache.set(publicPath, fake);
    return fake;
  }

  const url = new URL(`${API}/assets/images/${encodeURIComponent(dataset)}`);
  url.searchParams.set('filename', path.basename(filePath));
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': mime, Authorization: `Bearer ${token}` },
    body: new Uint8Array(bytes),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`asset upload failed for ${publicPath}: HTTP ${response.status}`);
  }
  const parsed = JSON.parse(text) as { document?: { _id?: string } };
  const id = parsed.document?._id;
  if (!id) throw new Error(`asset upload returned no id for ${publicPath}`);
  assetCache.set(publicPath, id);
  return id;
}

async function img(publicPath: string | undefined, key?: string): Promise<SanityImage | undefined> {
  if (!publicPath) return undefined;
  const ref = await uploadLocalImage(publicPath);
  if (!ref) return undefined;
  return { _type: 'image', ...(key ? { _key: key } : {}), asset: { _type: 'reference', _ref: ref } };
}

function loc(value: LocalizedString): LocalizedString {
  return { he: value.he, ar: value.ar, en: value.en, ru: value.ru };
}

function key(prefix: string, index: number): string {
  return `${prefix}-${String(index + 1).padStart(2, '0')}`;
}

function idFor(type: string, slugOrId: string): string {
  return `${type}-${slugOrId.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
}

async function buildDocuments(): Promise<Doc[]> {
  const s = seedContent;
  const docs: Doc[] = [];

  docs.push({
    _id: 'siteSettings',
    _type: 'siteSettings',
    brandName: s.settings.brandName,
    tagline: loc(s.settings.tagline),
    pillars: loc(s.settings.pillars),
    phoneDisplay: s.settings.phoneDisplay,
    phoneTel: s.settings.phoneTel,
    whatsappE164: s.settings.whatsappE164,
    email: s.settings.email,
    address: loc(s.settings.address),
    workingHours: loc(s.settings.workingHours),
    whatsappMessage: loc(s.settings.whatsappMessage),
    logo: await img(s.settings.logoUrl),
    logoDark: await img(s.settings.logoDarkUrl),
    contactQr: await img(s.settings.qrUrl),
    seoTitle: loc(s.settings.seoTitle),
    seoDescription: loc(s.settings.seoDescription),
  });

  const heroImages: SanityImage[] = [];
  for (let i = 0; i < s.home.heroImages.length; i++) {
    const image = await img(s.home.heroImages[i], key('hero', i));
    if (image) heroImages.push(image);
  }
  docs.push({
    _id: 'homePage',
    _type: 'homePage',
    heroTitle: loc(s.home.heroTitle),
    heroSubtitle: loc(s.home.heroSubtitle),
    heroImages,
    introEyebrow: loc(s.home.introEyebrow),
    introTitle: loc(s.home.introTitle),
    introDescription: loc(s.home.introDescription),
    introFeatures: s.home.introFeatures.map((f, i) => ({
      _key: key('feature', i),
      title: loc(f.title),
      desc: loc(f.desc),
    })),
    whyEyebrow: loc(s.home.whyEyebrow),
    whyTitle: loc(s.home.whyTitle),
    whySubtitle: loc(s.home.whySubtitle),
    whyItems: s.home.whyItems.map((f, i) => ({ _key: key('why', i), title: loc(f.title), desc: loc(f.desc) })),
    processEyebrow: loc(s.home.processEyebrow),
    processTitle: loc(s.home.processTitle),
    processSubtitle: loc(s.home.processSubtitle),
    servicesEyebrow: loc(s.home.servicesEyebrow),
    servicesTitle: loc(s.home.servicesTitle),
    servicesSubtitle: loc(s.home.servicesSubtitle),
    projectsEyebrow: loc(s.home.projectsEyebrow),
    projectsTitle: loc(s.home.projectsTitle),
    projectsSubtitle: loc(s.home.projectsSubtitle),
    materialsEyebrow: loc(s.home.materialsEyebrow),
    materialsTitle: loc(s.home.materialsTitle),
    materialsSubtitle: loc(s.home.materialsSubtitle),
    testimonialsEyebrow: loc(s.home.testimonialsEyebrow),
    testimonialsTitle: loc(s.home.testimonialsTitle),
    testimonialsSubtitle: loc(s.home.testimonialsSubtitle),
    ctaTitle: loc(s.home.ctaTitle),
    ctaSubtitle: loc(s.home.ctaSubtitle),
  });

  docs.push({
    _id: 'aboutPage',
    _type: 'aboutPage',
    eyebrow: loc(s.about.eyebrow),
    title: loc(s.about.title),
    subtitle: loc(s.about.subtitle),
    image: await img(s.about.image),
    body: loc(s.about.body),
    valuesTitle: loc(s.about.valuesTitle),
    values: s.about.values.map((v, i) => ({ _key: key('value', i), title: loc(v.title), desc: loc(v.desc) })),
  });

  docs.push({
    _id: 'howWeWorkPage',
    _type: 'howWeWorkPage',
    eyebrow: loc(s.howWeWork.eyebrow),
    title: loc(s.howWeWork.title),
    subtitle: loc(s.howWeWork.subtitle),
    image: await img(s.howWeWork.image),
    steps: s.howWeWork.steps.map((st, i) => ({
      _key: key('step', i),
      number: st.number,
      title: loc(st.title),
      description: loc(st.description),
    })),
  });

  docs.push({
    _id: 'contactPage',
    _type: 'contactPage',
    eyebrow: loc(s.contactPage.eyebrow),
    title: loc(s.contactPage.title),
    subtitle: loc(s.contactPage.subtitle),
    image: await img(s.contactPage.image),
  });

  for (const locale of LOCALES) {
    const nav = s.nav[locale];
    const ui = s.ui[locale];
    docs.push({
      _id: `uiLabels-${locale}`,
      _type: 'uiLabels',
      locale,
      home: nav.home,
      about: nav.about,
      services: nav.services,
      projects: nav.projects,
      materials: nav.materials,
      howWeWork: nav.howWeWork,
      testimonials: nav.testimonials,
      blog: nav.blog,
      faq: nav.faq,
      contact: nav.contact,
      callUs: nav.callUs,
      whatsapp: nav.whatsapp,
      viewWork: nav.viewWork,
      learnMore: nav.learnMore,
      viewAll: nav.viewAll,
      viewProject: nav.viewProject,
      readMore: nav.readMore,
      backHome: nav.backHome,
      all: nav.all,
      footerCta: ui.footerCta,
      footerTagline: ui.footerTagline,
      servicesTitle: ui.servicesTitle,
      navTitle: ui.navTitle,
      contactTitle: ui.contactTitle,
      languagesTitle: ui.languagesTitle,
      notFoundTitle: ui.notFoundTitle,
      notFoundBody: ui.notFoundBody,
      relatedProjects: ui.relatedProjects,
    });
  }

  for (let i = 0; i < s.services.length; i++) {
    const svc = s.services[i];
    docs.push({
      _id: idFor('service', svc.slug),
      _type: 'service',
      slug: { _type: 'slug', current: svc.slug },
      title: loc(svc.title),
      description: loc(svc.description),
      image: await img(svc.image),
      features: svc.features.map((f, j) => ({ _key: key('feature', j), ...loc(f) })),
      order: i,
      visible: svc.visible,
    });
  }

  for (let i = 0; i < s.projects.length; i++) {
    const p = s.projects[i];
    const gallery: SanityImage[] = [];
    for (let j = 0; j < p.images.length; j++) {
      const image = await img(p.images[j], key('img', j));
      if (image) gallery.push(image);
    }
    docs.push({
      _id: idFor('project', p.slug),
      _type: 'project',
      slug: { _type: 'slug', current: p.slug },
      title: loc(p.title),
      description: loc(p.description),
      category: p.category,
      gallery,
      materials: p.materials,
      order: i,
      visible: p.visible,
    });
  }

  for (let i = 0; i < s.materials.length; i++) {
    const m = s.materials[i];
    docs.push({
      _id: idFor('material', m.slug),
      _type: 'material',
      slug: { _type: 'slug', current: m.slug },
      name: loc(m.name),
      description: loc(m.description),
      characteristics: loc(m.characteristics),
      applications: loc(m.applications),
      finishes: loc(m.finishes),
      image: await img(m.image),
      order: i,
      visible: m.visible,
    });
  }

  for (let i = 0; i < s.testimonials.length; i++) {
    const t = s.testimonials[i];
    docs.push({
      _id: idFor('testimonial', t.id),
      _type: 'testimonial',
      name: t.name,
      rating: t.rating,
      review: loc(t.review),
      project: loc(t.project),
      order: i,
      visible: t.visible,
    });
  }

  for (let i = 0; i < s.faq.length; i++) {
    const f = s.faq[i];
    docs.push({
      _id: idFor('faqItem', f.id),
      _type: 'faqItem',
      category: f.category,
      question: loc(f.question),
      answer: loc(f.answer),
      order: i,
      visible: f.visible,
    });
  }

  for (const b of s.blogPosts) {
    docs.push({
      _id: idFor('blogPost', b.slug),
      _type: 'blogPost',
      slug: { _type: 'slug', current: b.slug },
      title: loc(b.title),
      excerpt: loc(b.excerpt),
      content: loc(b.content),
      category: b.category,
      author: b.author,
      date: b.date,
      image: await img(b.image),
      visible: b.visible,
    });
  }

  return docs;
}

async function main() {
  console.log(`Sanity bootstrap → project ${projectId} / dataset ${dataset}${DRY_RUN ? ' (dry run)' : ''}`);
  const docs = await buildDocuments();

  const byType = new Map<string, number>();
  for (const d of docs) byType.set(d._type, (byType.get(d._type) ?? 0) + 1);
  console.log(`Prepared ${docs.length} documents, ${assetCache.size} unique images:`);
  for (const [type, count] of byType) console.log(`  ${type}: ${count}`);

  if (DRY_RUN) {
    console.log('Dry run complete. Nothing was written.');
    return;
  }

  const mutations = docs.map((doc) => ({ createIfNotExists: doc }));
  const response = await fetch(`${API}/data/mutate/${encodeURIComponent(dataset)}?returnIds=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mutations }),
  });
  const text = await response.text();
  if (!response.ok) {
    let description = '';
    try {
      description = (JSON.parse(text) as { error?: { description?: string } }).error?.description ?? '';
    } catch {
      /* non-JSON */
    }
    throw new Error(`mutation failed: HTTP ${response.status}${description ? ` — ${description}` : ''}`);
  }
  const result = JSON.parse(text) as { results?: Array<{ id: string; operation: string }> };
  const created = (result.results ?? []).filter((r) => r.operation === 'create').length;
  const skipped = docs.length - created;
  console.log(`Done. Created ${created}, already existed ${skipped}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
