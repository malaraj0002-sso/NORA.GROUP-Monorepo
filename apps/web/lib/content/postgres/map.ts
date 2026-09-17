import {
  LOCALES,
  PROJECT_CATEGORIES,
  SERVICE_SLUGS,
  type AppLocale,
  type ProjectCategory,
  type ServiceSlug,
} from '@/lib/constants';
import type {
  FaqItem,
  HomeContent,
  LegalPage,
  LocalizedString,
  MaterialItem,
  NavLabels,
  PageHero,
  ProjectItem,
  ServiceItem,
  SiteContent,
  SiteSettings,
} from '@/lib/content/types';

export const EMPTY_LOCALE: LocalizedString = { he: '', ar: '', en: '', ru: '' };

const NAV_KEYS: (keyof NavLabels)[] = [
  'home',
  'about',
  'services',
  'projects',
  'materials',
  'howWeWork',
  'testimonials',
  'blog',
  'faq',
  'contact',
  'callUs',
  'whatsapp',
  'viewWork',
  'learnMore',
  'viewAll',
  'viewProject',
  'readMore',
  'backHome',
  'all',
];

const UI_KEYS: (keyof SiteContent['ui'][AppLocale])[] = [
  'footerCta',
  'footerTagline',
  'servicesTitle',
  'navTitle',
  'contactTitle',
  'languagesTitle',
  'madeBy',
  'allRightsReserved',
  'notFoundTitle',
  'notFoundBody',
  'relatedProjects',
  'demoNotice',
  'privacy',
  'cookies',
  'terms',
  'cookieNotice',
  'cookieAccept',
  'legalTitle',
];

const PRISMA_SERVICE_SLUG: Record<string, ServiceSlug> = {
  kitchens: 'kitchens',
  bedrooms: 'bedrooms',
  wardrobes: 'wardrobes',
  walkInClosets: 'walk-in-closets',
  customFurniture: 'custom-furniture',
  offices: 'offices',
  commercial: 'commercial',
};

export function asLocale(value: unknown): LocalizedString {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    he: typeof record.he === 'string' ? record.he : '',
    ar: typeof record.ar === 'string' ? record.ar : '',
    en: typeof record.en === 'string' ? record.en : '',
    ru: typeof record.ru === 'string' ? record.ru : '',
  };
}

function mediaUrl(media: { url: string | null } | null | undefined): string {
  return media?.url?.trim() || '';
}

function emptyNav(): NavLabels {
  return {
    home: '',
    about: '',
    services: '',
    projects: '',
    materials: '',
    howWeWork: '',
    testimonials: '',
    blog: '',
    faq: '',
    contact: '',
    callUs: '',
    whatsapp: '',
    viewWork: '',
    learnMore: '',
    viewAll: '',
    viewProject: '',
    readMore: '',
    backHome: '',
    all: '',
  };
}

function emptyUi(): SiteContent['ui'][AppLocale] {
  return {
    footerCta: '',
    footerTagline: '',
    servicesTitle: '',
    navTitle: '',
    contactTitle: '',
    languagesTitle: '',
    madeBy: '',
    allRightsReserved: '',
    notFoundTitle: '',
    notFoundBody: '',
    relatedProjects: '',
    demoNotice: '',
    privacy: '',
    cookies: '',
    terms: '',
    cookieNotice: '',
    cookieAccept: '',
    legalTitle: '',
  };
}

function emptyLegalPage(): LegalPage {
  return { title: { ...EMPTY_LOCALE }, updated: { ...EMPTY_LOCALE }, intro: { ...EMPTY_LOCALE }, sections: [] };
}

function emptySettings(): SiteSettings {
  return {
    brandName: '',
    tagline: { ...EMPTY_LOCALE },
    pillars: { ...EMPTY_LOCALE },
    phoneDisplay: '',
    phoneTel: '',
    whatsappE164: '',
    email: '',
    address: { ...EMPTY_LOCALE },
    workingHours: { ...EMPTY_LOCALE },
    whatsappMessage: { ...EMPTY_LOCALE },
    logoUrl: '',
    logoDarkUrl: '',
    qrUrl: '',
    seoTitle: { ...EMPTY_LOCALE },
    seoDescription: { ...EMPTY_LOCALE },
  };
}

function emptyHome(): HomeContent {
  return {
    heroTitle: { ...EMPTY_LOCALE },
    heroSubtitle: { ...EMPTY_LOCALE },
    introEyebrow: { ...EMPTY_LOCALE },
    introTitle: { ...EMPTY_LOCALE },
    introDescription: { ...EMPTY_LOCALE },
    introFeatures: [],
    whyEyebrow: { ...EMPTY_LOCALE },
    whyTitle: { ...EMPTY_LOCALE },
    whySubtitle: { ...EMPTY_LOCALE },
    whyItems: [],
    processEyebrow: { ...EMPTY_LOCALE },
    processTitle: { ...EMPTY_LOCALE },
    processSubtitle: { ...EMPTY_LOCALE },
    ctaTitle: { ...EMPTY_LOCALE },
    ctaSubtitle: { ...EMPTY_LOCALE },
    heroImages: [],
    servicesEyebrow: { ...EMPTY_LOCALE },
    servicesTitle: { ...EMPTY_LOCALE },
    servicesSubtitle: { ...EMPTY_LOCALE },
    projectsEyebrow: { ...EMPTY_LOCALE },
    projectsTitle: { ...EMPTY_LOCALE },
    projectsSubtitle: { ...EMPTY_LOCALE },
    materialsEyebrow: { ...EMPTY_LOCALE },
    materialsTitle: { ...EMPTY_LOCALE },
    materialsSubtitle: { ...EMPTY_LOCALE },
    testimonialsEyebrow: { ...EMPTY_LOCALE },
    testimonialsTitle: { ...EMPTY_LOCALE },
    testimonialsSubtitle: { ...EMPTY_LOCALE },
  };
}

function emptyHero(): PageHero {
  return { eyebrow: { ...EMPTY_LOCALE }, title: { ...EMPTY_LOCALE }, subtitle: { ...EMPTY_LOCALE }, image: '' };
}

function copyFromUi(
  rows: Array<{ locale: string; namespace: string; key: string; value: string }>,
): Pick<SiteContent, 'nav' | 'ui' | 'categoryLabels'> {
  const nav = {
    he: emptyNav(),
    ar: emptyNav(),
    en: emptyNav(),
    ru: emptyNav(),
  };
  const ui = {
    he: emptyUi(),
    ar: emptyUi(),
    en: emptyUi(),
    ru: emptyUi(),
  };
  const categoryLabels: SiteContent['categoryLabels'] = {
    he: { all: '', kitchens: '', bedrooms: '', wardrobes: '', furniture: '', commercial: '' },
    ar: { all: '', kitchens: '', bedrooms: '', wardrobes: '', furniture: '', commercial: '' },
    en: { all: '', kitchens: '', bedrooms: '', wardrobes: '', furniture: '', commercial: '' },
    ru: { all: '', kitchens: '', bedrooms: '', wardrobes: '', furniture: '', commercial: '' },
  };

  for (const row of rows) {
    if (!LOCALES.includes(row.locale as AppLocale)) continue;
    const locale = row.locale as AppLocale;
    if (row.namespace === 'nav' && (NAV_KEYS as string[]).includes(row.key)) {
      nav[locale][row.key as keyof NavLabels] = row.value;
    }
    if (row.namespace === 'ui' && (UI_KEYS as string[]).includes(row.key)) {
      ui[locale][row.key as keyof SiteContent['ui'][AppLocale]] = row.value;
    }
    if (row.namespace === 'category') {
      if (row.key === 'all' || (PROJECT_CATEGORIES as readonly string[]).includes(row.key)) {
        categoryLabels[locale][row.key as ProjectCategory | 'all'] = row.value;
      }
    }
  }

  return { nav, ui, categoryLabels };
}

export type PostgresSitePayload = {
  settings: {
    brandName: string;
    tagline: unknown;
    pillars: unknown;
    phoneDisplay: string;
    phoneTel: string;
    whatsappE164: string;
    email: string;
    address: unknown;
    workingHours: unknown;
    whatsappMessage: unknown;
    seoTitle: unknown;
    seoDescription: unknown;
    logo: { url: string | null } | null;
    logoDark: { url: string | null } | null;
    qr: { url: string | null } | null;
  } | null;
  home: {
    heroTitle: unknown;
    heroSubtitle: unknown;
    introEyebrow: unknown;
    introTitle: unknown;
    introDescription: unknown;
    whyEyebrow: unknown;
    whyTitle: unknown;
    whySubtitle: unknown;
    processEyebrow: unknown;
    processTitle: unknown;
    processSubtitle: unknown;
    servicesEyebrow: unknown;
    servicesTitle: unknown;
    servicesSubtitle: unknown;
    projectsEyebrow: unknown;
    projectsTitle: unknown;
    projectsSubtitle: unknown;
    materialsEyebrow: unknown;
    materialsTitle: unknown;
    materialsSubtitle: unknown;
    testimonialsEyebrow: unknown;
    testimonialsTitle: unknown;
    testimonialsSubtitle: unknown;
    ctaTitle: unknown;
    ctaSubtitle: unknown;
    introFeatures: { sortOrder: number; title: unknown; description: unknown }[];
    whyItems: { sortOrder: number; title: unknown; description: unknown }[];
    heroMedia: { sortOrder: number; media: { url: string | null } }[];
  } | null;
  about: {
    eyebrow: unknown;
    title: unknown;
    subtitle: unknown;
    body: unknown;
    valuesTitle: unknown;
    image: { url: string | null } | null;
    values: { sortOrder: number; title: unknown; description: unknown }[];
  } | null;
  howWeWork: {
    eyebrow: unknown;
    title: unknown;
    subtitle: unknown;
    image: { url: string | null } | null;
    steps: { sortOrder: number; number: string; title: unknown; description: unknown }[];
  } | null;
  contact: {
    eyebrow: unknown;
    title: unknown;
    subtitle: unknown;
    image: { url: string | null } | null;
  } | null;
  services: Array<{
    slug: string;
    title: unknown;
    description: unknown;
    published: boolean;
    sortOrder: number;
    features: { sortOrder: number; text: unknown }[];
    media: { sortOrder: number; media: { url: string | null } }[];
  }>;
  projects: Array<{
    slug: string;
    title: unknown;
    description: unknown;
    category: string;
    woodTypes: string[];
    published: boolean;
    sortOrder: number;
    media: { sortOrder: number; media: { url: string | null } }[];
  }>;
  materials: Array<{
    slug: string;
    name: unknown;
    description: unknown;
    characteristics: unknown;
    applications: unknown;
    finishes: unknown;
    published: boolean;
    sortOrder: number;
    media: { sortOrder: number; media: { url: string | null } }[];
  }>;
  testimonials: Array<{
    id: string;
    name: string;
    rating: number;
    review: unknown;
    project: unknown;
    published: boolean;
    sortOrder: number;
  }>;
  blogPosts: Array<{
    slug: string;
    title: unknown;
    excerpt: unknown;
    content: unknown;
    category: string;
    author: string;
    published: boolean;
    publishedAt: Date | null;
    featuredMedia: { url: string | null } | null;
  }>;
  faq: Array<{
    id: string;
    category: string;
    question: unknown;
    answer: unknown;
    published: boolean;
    sortOrder: number;
  }>;
  uiCopy: Array<{ locale: string; namespace: string; key: string; value: string }>;
  legal: Array<{
    slug: string;
    title: unknown;
    updated: unknown;
    intro: unknown;
    sections: { sortOrder: number; heading: unknown; body: unknown }[];
  }>;
};

export function mapPostgresToSiteContent(payload: PostgresSitePayload): SiteContent {
  const settings = payload.settings
    ? {
        brandName: payload.settings.brandName,
        tagline: asLocale(payload.settings.tagline),
        pillars: asLocale(payload.settings.pillars),
        phoneDisplay: payload.settings.phoneDisplay,
        phoneTel: payload.settings.phoneTel,
        whatsappE164: payload.settings.whatsappE164,
        email: payload.settings.email,
        address: asLocale(payload.settings.address),
        workingHours: asLocale(payload.settings.workingHours),
        whatsappMessage: asLocale(payload.settings.whatsappMessage),
        logoUrl: mediaUrl(payload.settings.logo),
        logoDarkUrl: mediaUrl(payload.settings.logoDark),
        qrUrl: mediaUrl(payload.settings.qr),
        seoTitle: asLocale(payload.settings.seoTitle),
        seoDescription: asLocale(payload.settings.seoDescription),
      }
    : emptySettings();

  const home: HomeContent = payload.home
    ? {
        heroTitle: asLocale(payload.home.heroTitle),
        heroSubtitle: asLocale(payload.home.heroSubtitle),
        introEyebrow: asLocale(payload.home.introEyebrow),
        introTitle: asLocale(payload.home.introTitle),
        introDescription: asLocale(payload.home.introDescription),
        introFeatures: [...payload.home.introFeatures]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => ({ title: asLocale(item.title), desc: asLocale(item.description) })),
        whyEyebrow: asLocale(payload.home.whyEyebrow),
        whyTitle: asLocale(payload.home.whyTitle),
        whySubtitle: asLocale(payload.home.whySubtitle),
        whyItems: [...payload.home.whyItems]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => ({ title: asLocale(item.title), desc: asLocale(item.description) })),
        processEyebrow: asLocale(payload.home.processEyebrow),
        processTitle: asLocale(payload.home.processTitle),
        processSubtitle: asLocale(payload.home.processSubtitle),
        ctaTitle: asLocale(payload.home.ctaTitle),
        ctaSubtitle: asLocale(payload.home.ctaSubtitle),
        heroImages: [...payload.home.heroMedia]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => mediaUrl(item.media))
          .filter(Boolean),
        servicesEyebrow: asLocale(payload.home.servicesEyebrow),
        servicesTitle: asLocale(payload.home.servicesTitle),
        servicesSubtitle: asLocale(payload.home.servicesSubtitle),
        projectsEyebrow: asLocale(payload.home.projectsEyebrow),
        projectsTitle: asLocale(payload.home.projectsTitle),
        projectsSubtitle: asLocale(payload.home.projectsSubtitle),
        materialsEyebrow: asLocale(payload.home.materialsEyebrow),
        materialsTitle: asLocale(payload.home.materialsTitle),
        materialsSubtitle: asLocale(payload.home.materialsSubtitle),
        testimonialsEyebrow: asLocale(payload.home.testimonialsEyebrow),
        testimonialsTitle: asLocale(payload.home.testimonialsTitle),
        testimonialsSubtitle: asLocale(payload.home.testimonialsSubtitle),
      }
    : emptyHome();

  const about = payload.about
    ? {
        eyebrow: asLocale(payload.about.eyebrow),
        title: asLocale(payload.about.title),
        subtitle: asLocale(payload.about.subtitle),
        image: mediaUrl(payload.about.image) || undefined,
        body: asLocale(payload.about.body),
        valuesTitle: asLocale(payload.about.valuesTitle),
        values: [...payload.about.values]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => ({ title: asLocale(item.title), desc: asLocale(item.description) })),
      }
    : { ...emptyHero(), body: { ...EMPTY_LOCALE }, valuesTitle: { ...EMPTY_LOCALE }, values: [] };

  const howWeWork = payload.howWeWork
    ? {
        eyebrow: asLocale(payload.howWeWork.eyebrow),
        title: asLocale(payload.howWeWork.title),
        subtitle: asLocale(payload.howWeWork.subtitle),
        image: mediaUrl(payload.howWeWork.image) || undefined,
        steps: [...payload.howWeWork.steps]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((step) => ({
            number: step.number,
            title: asLocale(step.title),
            description: asLocale(step.description),
          })),
      }
    : { ...emptyHero(), steps: [] };

  const contactPage: PageHero = payload.contact
    ? {
        eyebrow: asLocale(payload.contact.eyebrow),
        title: asLocale(payload.contact.title),
        subtitle: asLocale(payload.contact.subtitle),
        image: mediaUrl(payload.contact.image) || undefined,
      }
    : emptyHero();

  const services: ServiceItem[] = [...payload.services]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((row) => {
      const slug = PRISMA_SERVICE_SLUG[row.slug];
      if (!slug || !(SERVICE_SLUGS as readonly string[]).includes(slug)) return [];
      const image = [...row.media].sort((a, b) => a.sortOrder - b.sortOrder).map((item) => mediaUrl(item.media))[0] || '';
      return [
        {
          slug,
          title: asLocale(row.title),
          description: asLocale(row.description),
          image,
          features: [...row.features]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((feature) => asLocale(feature.text)),
          visible: row.published,
        },
      ];
    });

  const projects: ProjectItem[] = [...payload.projects]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((row) => (PROJECT_CATEGORIES as readonly string[]).includes(row.category))
    .map((row) => ({
      slug: row.slug,
      title: asLocale(row.title),
      description: asLocale(row.description),
      category: row.category as ProjectCategory,
      images: [...row.media].sort((a, b) => a.sortOrder - b.sortOrder).map((item) => mediaUrl(item.media)).filter(Boolean),
      materials: row.woodTypes,
      visible: row.published,
    }));

  const materials: MaterialItem[] = [...payload.materials]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row) => ({
      slug: row.slug,
      name: asLocale(row.name),
      description: asLocale(row.description),
      characteristics: asLocale(row.characteristics),
      applications: asLocale(row.applications),
      finishes: asLocale(row.finishes),
      image: [...row.media].sort((a, b) => a.sortOrder - b.sortOrder).map((item) => mediaUrl(item.media))[0] || '',
      visible: row.published,
    }));

  const legal: SiteContent['legal'] = {
    privacy: emptyLegalPage(),
    cookies: emptyLegalPage(),
    terms: emptyLegalPage(),
  };
  for (const doc of payload.legal) {
    if (doc.slug !== 'privacy' && doc.slug !== 'cookies' && doc.slug !== 'terms') continue;
    legal[doc.slug] = {
      title: asLocale(doc.title),
      updated: asLocale(doc.updated),
      intro: asLocale(doc.intro),
      sections: [...doc.sections]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((section) => ({ heading: asLocale(section.heading), body: asLocale(section.body) })),
    };
  }

  const faq: FaqItem[] = [...payload.faq]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row) => ({
      id: row.id,
      category: row.category,
      question: asLocale(row.question),
      answer: asLocale(row.answer),
      visible: row.published,
    }));

  return {
    settings,
    ...copyFromUi(payload.uiCopy),
    home,
    about,
    howWeWork,
    contactPage,
    services,
    projects,
    materials,
    testimonials: [...payload.testimonials]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((row) => ({
        id: row.id,
        name: row.name,
        rating: row.rating,
        review: asLocale(row.review),
        project: asLocale(row.project),
        visible: row.published,
      })),
    blogPosts: payload.blogPosts.map((row) => ({
      slug: row.slug,
      title: asLocale(row.title),
      excerpt: asLocale(row.excerpt),
      content: asLocale(row.content),
      category: row.category,
      author: row.author,
      date: row.publishedAt ? row.publishedAt.toISOString().slice(0, 10) : '',
      image: mediaUrl(row.featuredMedia),
      visible: row.published,
    })),
    faq,
    legal,
  };
}
