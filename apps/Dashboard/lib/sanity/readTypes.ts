/** Sanity locale object. `ru` is never copied into Dashboard models. */
export type SanityLocale = {
  he?: string | null;
  ar?: string | null;
  en?: string | null;
  ru?: string | null;
};

export type SanitySiteSettings = {
  brandName?: string | null;
  tagline?: SanityLocale | null;
  email?: string | null;
  address?: SanityLocale | null;
  phoneDisplay?: string | null;
  logoUrl?: string | null;
};

export type SanityAboutPage = {
  body?: SanityLocale | null;
};

export type SanityProject = {
  _id?: string | null;
  title?: SanityLocale | null;
  description?: SanityLocale | null;
  category?: string | null;
  materials?: string[] | null;
  visible?: boolean | null;
  slug?: string | null;
  galleryUrls?: (string | null)[] | null;
  galleryAssetIds?: (string | null)[] | null;
};

export type SanityMaterial = {
  _id?: string | null;
  name?: SanityLocale | null;
  description?: SanityLocale | null;
  visible?: boolean | null;
  imageUrl?: string | null;
};

export type SanityService = {
  _id?: string | null;
  title?: SanityLocale | null;
  description?: SanityLocale | null;
  visible?: boolean | null;
  slug?: string | null;
  imageUrl?: string | null;
};

export type SanityTestimonial = {
  _id?: string | null;
  name?: string | null;
  rating?: number | null;
  review?: SanityLocale | null;
  visible?: boolean | null;
};

export type SanityFaqItem = {
  _id?: string | null;
  question?: SanityLocale | null;
  answer?: SanityLocale | null;
  order?: number | null;
  visible?: boolean | null;
};

export type SanityBlogPost = {
  _id?: string | null;
  title?: SanityLocale | null;
  excerpt?: SanityLocale | null;
  content?: SanityLocale | null;
  author?: string | null;
  date?: string | null;
  visible?: boolean | null;
  category?: string | null;
  slug?: string | null;
  imageUrl?: string | null;
};

export type SanityHeroImage = {
  url?: string | null;
  assetId?: string | null;
};

export type SanityHomePage = {
  heroTitle?: SanityLocale | null;
  heroSubtitle?: SanityLocale | null;
  introTitle?: SanityLocale | null;
  introDescription?: SanityLocale | null;
  ctaTitle?: SanityLocale | null;
  ctaSubtitle?: SanityLocale | null;
  heroImages?: SanityHeroImage[] | null;
};

export type SanityHowWeWorkStep = {
  _key?: string | null;
  number?: string | null;
  title?: SanityLocale | null;
  description?: SanityLocale | null;
};

export type SanityHowWeWorkPage = {
  steps?: SanityHowWeWorkStep[] | null;
};

export type SanityDashboardQueryResult = {
  siteSettings?: SanitySiteSettings | null;
  aboutPage?: SanityAboutPage | null;
  homePage?: SanityHomePage | null;
  howWeWorkPage?: SanityHowWeWorkPage | null;
  projects?: SanityProject[] | null;
  materials?: SanityMaterial[] | null;
  services?: SanityService[] | null;
  testimonials?: SanityTestimonial[] | null;
  faqItems?: SanityFaqItem[] | null;
  blogPosts?: SanityBlogPost[] | null;
};
