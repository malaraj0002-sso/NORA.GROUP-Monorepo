import type {
  AdminData,
  BlogPost,
  FAQItem,
  HomePageContent,
  HowWeWorkStep,
  LocalizedText,
  Material,
  MaterialSpec,
  Project,
  Service,
  SiteSettings,
  Testimonial,
} from '@/lib/types';
import type {
  SanityAboutPage,
  SanityBlogPost,
  SanityDashboardQueryResult,
  SanityFaqItem,
  SanityHomePage,
  SanityHowWeWorkPage,
  SanityLocale,
  SanityMaterial,
  SanityProject,
  SanityService,
  SanitySiteSettings,
  SanityTestimonial,
} from './readTypes';

export const emptyLocalized: LocalizedText = { ar: '', he: '', en: '' };

const emptySpec: MaterialSpec = {
  hardness: '',
  density: '',
  origin: '',
  finishType: '',
  durability: '',
  sustainability: '',
  moistureContent: '',
  grainPattern: '',
  colorTone: '',
  maintenance: '',
  jankaRating: '',
  weight: '',
};

const emptySiteSettings: SiteSettings = {
  logoUrl: '',
  siteName: '',
  tagline: { ...emptyLocalized },
  contactEmail: '',
  contactPhone: '',
  contactAddress: { ...emptyLocalized },
  navItems: [],
  footerCopyright: { ...emptyLocalized },
  footerLinks: [],
  socialLinks: [],
};

/** Copy he/ar/en only. Never copy `ru` into Dashboard models. */
export function toDashboardLocale(value: SanityLocale | null | undefined): LocalizedText {
  return {
    he: value?.he?.trim() || '',
    ar: value?.ar?.trim() || '',
    en: value?.en?.trim() || '',
  };
}

/** Display string from a localized Sanity field. Does not invent Russian or concatenate locales. */
export function localeDisplayName(value: SanityLocale | null | undefined): string {
  const he = value?.he?.trim();
  if (he) return he;
  const ar = value?.ar?.trim();
  if (ar) return ar;
  return value?.en?.trim() || '';
}

export function isForbiddenDoorService(input: {
  id?: string | null;
  slug?: string | null;
  icon?: string | null;
  title?: LocalizedText | SanityLocale | null;
}): boolean {
  if (input.id === 'svc-3') return true;
  if (input.icon === 'door-open') return true;
  const slug = (input.slug || '').toLowerCase();
  if (slug.includes('door')) return true;
  const title = input.title;
  const text = [title?.he, title?.ar, title?.en].filter(Boolean).join(' ');
  return /door|דלת|باب/i.test(text);
}

function isSafeSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export function mapSiteSettings(doc: SanitySiteSettings | null | undefined): SiteSettings {
  if (!doc) return { ...emptySiteSettings };
  return {
    ...emptySiteSettings,
    siteName: typeof doc.brandName === 'string' ? doc.brandName : '',
    tagline: toDashboardLocale(doc.tagline),
    contactEmail: typeof doc.email === 'string' ? doc.email : '',
    contactPhone: typeof doc.phoneDisplay === 'string' ? doc.phoneDisplay : '',
    contactAddress: toDashboardLocale(doc.address),
    logoUrl: typeof doc.logoUrl === 'string' ? doc.logoUrl : '',
  };
}

export function mapAboutStory(doc: SanityAboutPage | null | undefined) {
  return {
    story: toDashboardLocale(doc?.body),
    vision: { ...emptyLocalized },
    mission: { ...emptyLocalized },
    featureBanners: [] as AdminData['aboutSettings']['featureBanners'],
  };
}

export function mapHomePage(doc: SanityHomePage | null | undefined): HomePageContent {
  return {
    heroTitle: toDashboardLocale(doc?.heroTitle),
    heroSubtitle: toDashboardLocale(doc?.heroSubtitle),
    introTitle: toDashboardLocale(doc?.introTitle),
    introDescription: toDashboardLocale(doc?.introDescription),
    ctaTitle: toDashboardLocale(doc?.ctaTitle),
    ctaSubtitle: toDashboardLocale(doc?.ctaSubtitle),
  };
}

export function mapHowWeWork(doc: SanityHowWeWorkPage | null | undefined): HowWeWorkStep[] {
  const steps = doc?.steps;
  if (!Array.isArray(steps)) return [];
  return steps
    .map((step, index): HowWeWorkStep | null => {
      const id = typeof step._key === 'string' && step._key ? step._key : '';
      if (!id) return null;
      return {
        id,
        number: typeof step.number === 'string' ? step.number : String(index + 1),
        title: toDashboardLocale(step.title),
        description: toDashboardLocale(step.description),
      };
    })
    .filter((s): s is HowWeWorkStep => s !== null);
}

export function mapHeroFromHome(doc: SanityHomePage | null | undefined): AdminData['heroSlides'] {
  const images = doc?.heroImages;
  if (!Array.isArray(images)) return [];
  return images
    .map((img, index) => {
      const url = typeof img?.url === 'string' ? img.url : '';
      const assetId = typeof img?.assetId === 'string' ? img.assetId : '';
      if (!url && !assetId) return null;
      return {
        id: assetId || `hero-${index}`,
        imageUrl: url,
        title: toDashboardLocale(doc?.heroTitle),
        subtitle: toDashboardLocale(doc?.heroSubtitle),
        ctaText: { ...emptyLocalized },
        ctaLink: '/projects',
        order: index,
        published: true,
      };
    })
    .filter((s): s is AdminData['heroSlides'][number] => s !== null);
}

export function mapProject(doc: SanityProject): Project | null {
  const id = typeof doc._id === 'string' && doc._id ? doc._id : '';
  if (!id) return null;
  const gallery = asStringArray(doc.galleryUrls);
  const galleryAssetIds = asStringArray(doc.galleryAssetIds);
  return {
    id,
    title: toDashboardLocale(doc.title),
    category: typeof doc.category === 'string' ? doc.category : '',
    imageUrl: gallery[0] || '',
    galleryImages: gallery,
    description: toDashboardLocale(doc.description),
    woodTypes: asStringArray(doc.materials),
    published: doc.visible !== false,
    featured: false,
    completedDate: '',
    slug: typeof doc.slug === 'string' ? doc.slug : '',
    imageAssetId: galleryAssetIds[0],
    galleryAssetIds,
  };
}

export function mapMaterial(doc: SanityMaterial): Material | null {
  const id = typeof doc._id === 'string' && doc._id ? doc._id : '';
  if (!id) return null;
  return {
    id,
    name: localeDisplayName(doc.name),
    nameLocales: toDashboardLocale(doc.name),
    type: '',
    textureImageUrl: typeof doc.imageUrl === 'string' ? doc.imageUrl : '',
    description: toDashboardLocale(doc.description),
    specifications: { ...emptySpec },
    published: doc.visible !== false,
  };
}

export function mapService(doc: SanityService): Service | null {
  const id = typeof doc._id === 'string' && doc._id ? doc._id : '';
  if (!id) return null;
  const title = toDashboardLocale(doc.title);
  if (isForbiddenDoorService({ id, slug: doc.slug, title })) return null;
  return {
    id,
    title,
    icon: '',
    imageUrl: typeof doc.imageUrl === 'string' ? doc.imageUrl : '',
    description: toDashboardLocale(doc.description),
    steps: [],
    published: doc.visible !== false,
    slug: typeof doc.slug === 'string' ? doc.slug : '',
  };
}

export function mapTestimonial(doc: SanityTestimonial): Testimonial | null {
  const id = typeof doc._id === 'string' && doc._id ? doc._id : '';
  if (!id) return null;
  const rating = Number(doc.rating);
  return {
    id,
    clientName: typeof doc.name === 'string' ? doc.name : '',
    clientTitle: '',
    avatarUrl: '',
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, rating)) : 5,
    text: toDashboardLocale(doc.review),
    published: doc.visible !== false,
  };
}

export function mapFaq(doc: SanityFaqItem, index: number): FAQItem | null {
  const id = typeof doc._id === 'string' && doc._id ? doc._id : '';
  if (!id) return null;
  const order = Number(doc.order);
  return {
    id,
    question: toDashboardLocale(doc.question),
    answer: toDashboardLocale(doc.answer),
    order: Number.isFinite(order) ? order : index,
    published: doc.visible !== false,
  };
}

export function mapBlogPost(doc: SanityBlogPost): BlogPost | null {
  const id = typeof doc._id === 'string' && doc._id ? doc._id : '';
  if (!id) return null;
  const slug = typeof doc.slug === 'string' ? doc.slug : '';
  if (slug && !isSafeSlug(slug)) return null;
  return {
    id,
    title: toDashboardLocale(doc.title),
    slug,
    excerpt: toDashboardLocale(doc.excerpt),
    content: toDashboardLocale(doc.content),
    featuredImageUrl: typeof doc.imageUrl === 'string' ? doc.imageUrl : '',
    author: typeof doc.author === 'string' && doc.author.trim() ? doc.author : 'Nora Group',
    publishedAt: typeof doc.date === 'string' ? doc.date : '',
    published: doc.visible !== false,
    tags: [],
  };
}

/** Sanity-only AdminData: unmapped modules are empty, never filled from mock. */
export function mapQueryResultToAdminData(result: SanityDashboardQueryResult | null | undefined): AdminData {
  const projectDocs = result?.projects;
  const materialDocs = result?.materials;
  const serviceDocs = result?.services;
  const testimonialDocs = result?.testimonials;
  const faqDocs = result?.faqItems;
  const blogDocs = result?.blogPosts;

  const projects = Array.isArray(projectDocs)
    ? projectDocs.map(mapProject).filter((p): p is Project => p !== null)
    : [];
  const materials = Array.isArray(materialDocs)
    ? materialDocs.map(mapMaterial).filter((m): m is Material => m !== null)
    : [];
  const services = Array.isArray(serviceDocs)
    ? serviceDocs.map(mapService).filter((s): s is Service => s !== null)
    : [];
  const testimonials = Array.isArray(testimonialDocs)
    ? testimonialDocs.map(mapTestimonial).filter((t): t is Testimonial => t !== null)
    : [];
  const faqs = Array.isArray(faqDocs)
    ? faqDocs.map((f, i) => mapFaq(f, i)).filter((f): f is FAQItem => f !== null)
    : [];
  const blogPosts = Array.isArray(blogDocs)
    ? blogDocs.map(mapBlogPost).filter((b): b is BlogPost => b !== null)
    : [];

  return {
    siteSettings: mapSiteSettings(result?.siteSettings),
    homePage: mapHomePage(result?.homePage),
    howWeWorkSteps: mapHowWeWork(result?.howWeWorkPage),
    heroSlides: mapHeroFromHome(result?.homePage),
    aboutSettings: mapAboutStory(result?.aboutPage),
    projects,
    materials,
    services,
    testimonials,
    faqs,
    blogPosts,
  };
}
