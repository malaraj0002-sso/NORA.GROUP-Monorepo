import { seedContent } from '@/lib/content/seed';
import type { LocalizedString, SiteContent } from '@/lib/content/types';
import { REVALIDATE_TAGS } from '@/lib/constants';
import { client } from '@/sanity/lib/client';
import { urlForImage } from './image';
import { isSanityConfigured } from './env';
import { isSafeSlug } from '@/lib/i18n/locale';

function asLocale(value: Partial<LocalizedString> | undefined, fallback: LocalizedString): LocalizedString {
  return {
    he: value?.he?.trim() || fallback.he,
    ar: value?.ar?.trim() || fallback.ar,
    en: value?.en?.trim() || fallback.en,
    ru: value?.ru?.trim() || fallback.ru,
  };
}

/**
 * Pull published CMS documents and merge onto seed defaults.
 *
 * If `siteSettings` exists, Sanity is the source of truth for each collection
 * that loaded successfully (including empty arrays).
 * If it does not, CMS documents overlay seed by slug/id so a Dashboard-created
 * project can appear without wiping the live seed catalogue.
 */
/** Safety-net revalidate if webhooks are misconfigured (tags still preferred). */
const FETCH_OPTS = (tags: string[]) => ({
  next: { tags, revalidate: 3600 as const },
});

function mergeByKey<T>(seed: T[], cms: T[], keyOf: (item: T) => string): T[] {
  if (!cms.length) return seed;
  const byKey = new Map<string, T>();
  for (const item of seed) {
    const key = keyOf(item);
    if (key) byKey.set(key, item);
  }
  for (const item of cms) {
    const key = keyOf(item);
    if (key) byKey.set(key, item);
  }
  return [...byKey.values()];
}

function settled<T>(result: PromiseSettledResult<T>, label: string): T | null {
  if (result.status === 'fulfilled') return result.value;
  console.error(`[fetchSanityContent] ${label} failed; keeping seed for that slice`);
  return null;
}

export async function fetchSanityContent(): Promise<SiteContent | null> {
  if (!isSanityConfigured() || !client) return null;

  const [
    settingsRes,
    homeRes,
    aboutRes,
    howWeWorkRes,
    contactPageRes,
    servicesRes,
    projectsRes,
    materialsRes,
    testimonialsRes,
    blogPostsRes,
    faqRes,
    uiDocsRes,
  ] = await Promise.allSettled([
    client.fetch(`*[_type == "siteSettings"][0]`, {}, FETCH_OPTS([REVALIDATE_TAGS.siteSettings, REVALIDATE_TAGS.all])),
    client.fetch(`*[_type == "homePage"][0]`, {}, FETCH_OPTS([REVALIDATE_TAGS.home, REVALIDATE_TAGS.all])),
    client.fetch(`*[_type == "aboutPage"][0]`, {}, FETCH_OPTS([REVALIDATE_TAGS.pages, REVALIDATE_TAGS.all])),
    client.fetch(`*[_type == "howWeWorkPage"][0]`, {}, FETCH_OPTS([REVALIDATE_TAGS.pages, REVALIDATE_TAGS.all])),
    client.fetch(`*[_type == "contactPage"][0]`, {}, FETCH_OPTS([REVALIDATE_TAGS.pages, REVALIDATE_TAGS.all])),
    client.fetch(
      `*[_type == "service" && visible != false] | order(order asc){
          "slug": slug.current, title, description, features, visible,
          "image": image.asset->url
        }`,
      {},
      FETCH_OPTS([REVALIDATE_TAGS.services, REVALIDATE_TAGS.all]),
    ),
    client.fetch(
      `*[_type == "project" && visible != false] | order(order asc){
          "slug": slug.current, title, description, category, materials, visible,
          "images": gallery[].asset->url
        }`,
      {},
      FETCH_OPTS([REVALIDATE_TAGS.projects, REVALIDATE_TAGS.all]),
    ),
    client.fetch(
      `*[_type == "material" && visible != false] | order(order asc){
          "slug": slug.current, name, description, characteristics, applications, finishes, visible,
          "image": image.asset->url
        }`,
      {},
      FETCH_OPTS([REVALIDATE_TAGS.materials, REVALIDATE_TAGS.all]),
    ),
    client.fetch(
      `*[_type == "testimonial" && visible != false] | order(order asc){
          "id": _id, name, rating, review, project, visible
        }`,
      {},
      FETCH_OPTS([REVALIDATE_TAGS.testimonials, REVALIDATE_TAGS.all]),
    ),
    client.fetch(
      `*[_type == "blogPost" && visible != false] | order(date desc){
          "slug": slug.current, title, excerpt, category, author, date, visible,
          "image": image.asset->url
        }`,
      {},
      FETCH_OPTS([REVALIDATE_TAGS.blog, REVALIDATE_TAGS.all]),
    ),
    client.fetch(
      `*[_type == "faqItem" && visible != false] | order(order asc){
          "id": _id, category, question, answer, visible
        }`,
      {},
      FETCH_OPTS([REVALIDATE_TAGS.faq, REVALIDATE_TAGS.all]),
    ),
    client.fetch(`*[_type == "uiLabels"]`, {}, FETCH_OPTS([REVALIDATE_TAGS.all])),
  ]);

  const settings = settled(settingsRes, 'siteSettings');
  const home = settled(homeRes, 'homePage');
  const about = settled(aboutRes, 'aboutPage');
  const howWeWork = settled(howWeWorkRes, 'howWeWorkPage');
  const contactPage = settled(contactPageRes, 'contactPage');
  const services = settled(servicesRes, 'services');
  const projects = settled(projectsRes, 'projects');
  const materials = settled(materialsRes, 'materials');
  const testimonials = settled(testimonialsRes, 'testimonials');
  const blogPosts = settled(blogPostsRes, 'blogPosts');
  const faq = settled(faqRes, 'faq');
  const uiDocs = settled(uiDocsRes, 'uiLabels');

  const base = structuredClone(seedContent);
  /** Singleton present → dataset is the live CMS; empty lists are real, not "not yet seeded". */
  const cmsLive = Boolean(settings);

  if (settings) {
    base.settings = {
      ...base.settings,
      brandName: settings.brandName || base.settings.brandName,
      tagline: asLocale(settings.tagline, base.settings.tagline),
      pillars: asLocale(settings.pillars, base.settings.pillars),
      phoneDisplay: settings.phoneDisplay || base.settings.phoneDisplay,
      phoneTel: settings.phoneTel || base.settings.phoneTel,
      whatsappE164: settings.whatsappE164 || base.settings.whatsappE164,
      email: settings.email || base.settings.email,
      address: asLocale(settings.address, base.settings.address),
      workingHours: asLocale(settings.workingHours, base.settings.workingHours),
      whatsappMessage: asLocale(settings.whatsappMessage, base.settings.whatsappMessage),
      logoUrl: urlForImage(settings.logo) || base.settings.logoUrl,
      logoDarkUrl: urlForImage(settings.logoDark) || base.settings.logoDarkUrl,
      qrUrl: urlForImage(settings.contactQr) || base.settings.qrUrl,
      seoTitle: asLocale(settings.seoTitle, base.settings.seoTitle),
      seoDescription: asLocale(settings.seoDescription, base.settings.seoDescription),
    };
  }

  if (home) {
    base.home = {
      ...base.home,
      heroTitle: asLocale(home.heroTitle, base.home.heroTitle),
      heroSubtitle: asLocale(home.heroSubtitle, base.home.heroSubtitle),
      introEyebrow: asLocale(home.introEyebrow, base.home.introEyebrow),
      introTitle: asLocale(home.introTitle, base.home.introTitle),
      introDescription: asLocale(home.introDescription, base.home.introDescription),
      whyEyebrow: asLocale(home.whyEyebrow, base.home.whyEyebrow),
      whyTitle: asLocale(home.whyTitle, base.home.whyTitle),
      whySubtitle: asLocale(home.whySubtitle, base.home.whySubtitle),
      processEyebrow: asLocale(home.processEyebrow, base.home.processEyebrow),
      processTitle: asLocale(home.processTitle, base.home.processTitle),
      processSubtitle: asLocale(home.processSubtitle, base.home.processSubtitle),
      servicesEyebrow: asLocale(home.servicesEyebrow, base.home.servicesEyebrow),
      servicesTitle: asLocale(home.servicesTitle, base.home.servicesTitle),
      servicesSubtitle: asLocale(home.servicesSubtitle, base.home.servicesSubtitle),
      projectsEyebrow: asLocale(home.projectsEyebrow, base.home.projectsEyebrow),
      projectsTitle: asLocale(home.projectsTitle, base.home.projectsTitle),
      projectsSubtitle: asLocale(home.projectsSubtitle, base.home.projectsSubtitle),
      materialsEyebrow: asLocale(home.materialsEyebrow, base.home.materialsEyebrow),
      materialsTitle: asLocale(home.materialsTitle, base.home.materialsTitle),
      materialsSubtitle: asLocale(home.materialsSubtitle, base.home.materialsSubtitle),
      testimonialsEyebrow: asLocale(home.testimonialsEyebrow, base.home.testimonialsEyebrow),
      testimonialsTitle: asLocale(home.testimonialsTitle, base.home.testimonialsTitle),
      testimonialsSubtitle: asLocale(home.testimonialsSubtitle, base.home.testimonialsSubtitle),
      ctaTitle: asLocale(home.ctaTitle, base.home.ctaTitle),
      ctaSubtitle: asLocale(home.ctaSubtitle, base.home.ctaSubtitle),
      heroImages:
        home.heroImages?.map((img: unknown) => urlForImage(img as never)).filter(Boolean).length
          ? home.heroImages.map((img: unknown) => urlForImage(img as never)!).filter(Boolean)
          : base.home.heroImages,
      introFeatures: home.introFeatures?.length
        ? home.introFeatures.map((f: { title?: LocalizedString; desc?: LocalizedString }, i: number) => ({
            title: asLocale(f.title, base.home.introFeatures[i]?.title || base.home.introFeatures[0].title),
            desc: asLocale(f.desc, base.home.introFeatures[i]?.desc || base.home.introFeatures[0].desc),
          }))
        : base.home.introFeatures,
      whyItems: home.whyItems?.length
        ? home.whyItems.map((f: { title?: LocalizedString; desc?: LocalizedString }, i: number) => ({
            title: asLocale(f.title, base.home.whyItems[i]?.title || base.home.whyItems[0].title),
            desc: asLocale(f.desc, base.home.whyItems[i]?.desc || base.home.whyItems[0].desc),
          }))
        : base.home.whyItems,
    };
  }

  if (about) {
    base.about = {
      ...base.about,
      eyebrow: asLocale(about.eyebrow, base.about.eyebrow),
      title: asLocale(about.title, base.about.title),
      subtitle: asLocale(about.subtitle, base.about.subtitle),
      body: asLocale(about.body, base.about.body),
      valuesTitle: asLocale(about.valuesTitle, base.about.valuesTitle),
      image: urlForImage(about.image) || base.about.image,
    };
  }

  if (howWeWork) {
    base.howWeWork = {
      ...base.howWeWork,
      eyebrow: asLocale(howWeWork.eyebrow, base.howWeWork.eyebrow),
      title: asLocale(howWeWork.title, base.howWeWork.title),
      subtitle: asLocale(howWeWork.subtitle, base.howWeWork.subtitle),
      image: urlForImage(howWeWork.image) || base.howWeWork.image,
      steps: howWeWork.steps?.length
        ? howWeWork.steps.map(
            (
              s: { number?: string; title?: LocalizedString; description?: LocalizedString },
              i: number,
            ) => ({
              number: s.number || String(i + 1).padStart(2, '0'),
              title: asLocale(s.title, base.howWeWork.steps[i]?.title || base.howWeWork.steps[0].title),
              description: asLocale(
                s.description,
                base.howWeWork.steps[i]?.description || base.howWeWork.steps[0].description,
              ),
            }),
          )
        : base.howWeWork.steps,
    };
  }

  if (contactPage) {
    base.contactPage = {
      ...base.contactPage,
      eyebrow: asLocale(contactPage.eyebrow, base.contactPage.eyebrow),
      title: asLocale(contactPage.title, base.contactPage.title),
      subtitle: asLocale(contactPage.subtitle, base.contactPage.subtitle),
      image: urlForImage(contactPage.image) || base.contactPage.image,
    };
  }

  if (services) {
    const mapped = services
      .map((s: Record<string, unknown>) => ({
        slug: s.slug as SiteContent['services'][number]['slug'],
        title: asLocale(s.title as LocalizedString, Lempty()),
        description: asLocale(s.description as LocalizedString, Lempty()),
        image: (s.image as string) || imagesFallback(),
        features: Array.isArray(s.features)
          ? (s.features as LocalizedString[]).map((f) => asLocale(f, Lempty()))
          : [],
        visible: s.visible !== false,
      }))
      .filter((s: { slug: string }) => isSafeSlug(s.slug));
    base.services = cmsLive ? mapped : mergeByKey(base.services, mapped, (s) => s.slug);
  }

  if (projects) {
    const mapped = projects
      .map((p: Record<string, unknown>) => ({
        slug: String(p.slug),
        title: asLocale(p.title as LocalizedString, Lempty()),
        description: asLocale(p.description as LocalizedString, Lempty()),
        category: p.category as SiteContent['projects'][number]['category'],
        images: Array.isArray(p.images) && p.images.length ? (p.images as string[]) : [imagesFallback()],
        materials: Array.isArray(p.materials) ? (p.materials as string[]) : [],
        visible: p.visible !== false,
      }))
      .filter((p: { slug: string }) => isSafeSlug(p.slug));
    base.projects = cmsLive ? mapped : mergeByKey(base.projects, mapped, (p) => p.slug);
  }

  if (materials) {
    const mapped = materials
      .map((m: Record<string, unknown>) => ({
        slug: String(m.slug),
        name: asLocale(m.name as LocalizedString, Lempty()),
        description: asLocale(m.description as LocalizedString, Lempty()),
        characteristics: asLocale(m.characteristics as LocalizedString, Lempty()),
        applications: asLocale(m.applications as LocalizedString, Lempty()),
        finishes: asLocale(m.finishes as LocalizedString, Lempty()),
        image: (m.image as string) || imagesFallback(),
        visible: m.visible !== false,
      }))
      .filter((m: { slug: string }) => isSafeSlug(m.slug));
    base.materials = cmsLive ? mapped : mergeByKey(base.materials, mapped, (m) => m.slug);
  }

  if (testimonials) {
    const mapped = testimonials.map((t: Record<string, unknown>) => ({
      id: String(t.id),
      name: String(t.name || ''),
      rating: Math.min(5, Math.max(1, Number(t.rating) || 5)),
      review: asLocale(t.review as LocalizedString, Lempty()),
      project: asLocale(t.project as LocalizedString, Lempty()),
      visible: t.visible !== false,
    }));
    base.testimonials = cmsLive ? mapped : mergeByKey(base.testimonials, mapped, (t) => t.id);
  }

  if (blogPosts) {
    const mapped = blogPosts
      .map((b: Record<string, unknown>) => ({
        slug: String(b.slug),
        title: asLocale(b.title as LocalizedString, Lempty()),
        excerpt: asLocale(b.excerpt as LocalizedString, Lempty()),
        content: Lempty(),
        category: String(b.category || ''),
        author: String(b.author || 'Nora Group'),
        date: String(b.date || ''),
        image: (b.image as string) || imagesFallback(),
        visible: b.visible !== false,
      }))
      .filter((b: { slug: string }) => isSafeSlug(b.slug));
    base.blogPosts = cmsLive ? mapped : mergeByKey(base.blogPosts, mapped, (b) => b.slug);
  }

  if (faq) {
    const mapped = faq.map((f: Record<string, unknown>) => ({
      id: String(f.id),
      category: String(f.category || ''),
      question: asLocale(f.question as LocalizedString, Lempty()),
      answer: asLocale(f.answer as LocalizedString, Lempty()),
      visible: f.visible !== false,
    }));
    base.faq = cmsLive ? mapped : mergeByKey(base.faq, mapped, (f) => f.id);
  }

  if (uiDocs?.length) {
    for (const doc of uiDocs as Array<Record<string, string>>) {
      const locale = doc.locale as keyof typeof base.nav;
      if (!locale || !base.nav[locale]) continue;
      base.nav[locale] = {
        ...base.nav[locale],
        home: doc.home || base.nav[locale].home,
        about: doc.about || base.nav[locale].about,
        services: doc.services || base.nav[locale].services,
        projects: doc.projects || base.nav[locale].projects,
        materials: doc.materials || base.nav[locale].materials,
        howWeWork: doc.howWeWork || base.nav[locale].howWeWork,
        testimonials: doc.testimonials || base.nav[locale].testimonials,
        blog: doc.blog || base.nav[locale].blog,
        faq: doc.faq || base.nav[locale].faq,
        contact: doc.contact || base.nav[locale].contact,
        callUs: doc.callUs || base.nav[locale].callUs,
        whatsapp: doc.whatsapp || base.nav[locale].whatsapp,
        viewWork: doc.viewWork || base.nav[locale].viewWork,
        learnMore: doc.learnMore || base.nav[locale].learnMore,
        viewAll: doc.viewAll || base.nav[locale].viewAll,
        viewProject: doc.viewProject || base.nav[locale].viewProject,
        readMore: doc.readMore || base.nav[locale].readMore,
        backHome: doc.backHome || base.nav[locale].backHome,
        all: doc.all || base.nav[locale].all,
      };
      base.ui[locale] = {
        ...base.ui[locale],
        footerCta: doc.footerCta || base.ui[locale].footerCta,
        footerTagline: doc.footerTagline || base.ui[locale].footerTagline,
        servicesTitle: doc.servicesTitle || base.ui[locale].servicesTitle,
        navTitle: doc.navTitle || base.ui[locale].navTitle,
        contactTitle: doc.contactTitle || base.ui[locale].contactTitle,
        languagesTitle: doc.languagesTitle || base.ui[locale].languagesTitle,
        notFoundTitle: doc.notFoundTitle || base.ui[locale].notFoundTitle,
        notFoundBody: doc.notFoundBody || base.ui[locale].notFoundBody,
        relatedProjects: doc.relatedProjects || base.ui[locale].relatedProjects,
        madeBy: base.ui[locale].madeBy,
        allRightsReserved: base.ui[locale].allRightsReserved,
        demoNotice: base.ui[locale].demoNotice,
        privacy: base.ui[locale].privacy,
        cookies: base.ui[locale].cookies,
        terms: base.ui[locale].terms,
        cookieNotice: base.ui[locale].cookieNotice,
        cookieAccept: base.ui[locale].cookieAccept,
        legalTitle: base.ui[locale].legalTitle,
      };
    }
  }

  return base;
}

export async function fetchBlogPostContent(slug: string): Promise<LocalizedString | null> {
  if (!isSanityConfigured() || !client || !isSafeSlug(slug)) return null;
  const doc = await client.fetch(
    `*[_type == "blogPost" && slug.current == $slug && visible != false][0]{ content }`,
    { slug },
    FETCH_OPTS([REVALIDATE_TAGS.blog, REVALIDATE_TAGS.all]),
  );
  if (!doc?.content) return null;
  return asLocale(doc.content as LocalizedString, Lempty());
}

function Lempty(): LocalizedString {
  return { he: '', ar: '', en: '', ru: '' };
}

function imagesFallback(): string {
  return seedContent.home.heroImages[0];
}
