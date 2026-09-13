/**
 * App-wide constants.
 * Contact defaults match the client flyer; Sanity Site settings can override at runtime.
 */

export const LOCALES = ['he', 'ar', 'en', 'ru'] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'he';

export const LOCALE_META: Record<
  AppLocale,
  { label: string; dir: 'rtl' | 'ltr'; htmlLang: string }
> = {
  he: { label: 'עברית', dir: 'rtl', htmlLang: 'he' },
  ar: { label: 'العربية', dir: 'rtl', htmlLang: 'ar' },
  en: { label: 'English', dir: 'ltr', htmlLang: 'en-US' },
  ru: { label: 'Русский', dir: 'ltr', htmlLang: 'ru' },
};

function publicSiteUrl(): string {
  const fallback = 'https://officialnoragroup.com';
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return fallback;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    const local = host === 'localhost' || host === '127.0.0.1';
    if (url.protocol === 'https:') return url.origin;
    if (url.protocol === 'http:' && local) return url.origin;
  } catch {
    /* invalid NEXT_PUBLIC_SITE_URL */
  }
  return fallback;
}

export const SITE_URL = publicSiteUrl();

/** Flyer defaults — also seeded into Sanity Site settings */
export const CONTACT_DEFAULTS = {
  brandName: 'Nora Group',
  phoneDisplay: '052-465-9510',
  phoneTel: '+972524659510',
  whatsappE164: '972524659510',
  email: 'official.noragroup@gmail.com',
  website: 'https://officialnoragroup.com',
  logoPath: '/logo.png',
  logoDarkPath: '/logo.png',
  qrPath: '/qr.jpg',
} as const;

export const PROJECT_CATEGORIES = [
  'kitchens',
  'bedrooms',
  'wardrobes',
  'furniture',
  'commercial',
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

/** Service slugs — doors intentionally omitted (company does not make doors) */
export const SERVICE_SLUGS = [
  'kitchens',
  'bedrooms',
  'wardrobes',
  'walk-in-closets',
  'custom-furniture',
  'offices',
  'commercial',
] as const;

export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

export const REVALIDATE_TAGS = {
  siteSettings: 'siteSettings',
  home: 'home',
  pages: 'pages',
  services: 'services',
  projects: 'projects',
  materials: 'materials',
  testimonials: 'testimonials',
  blog: 'blog',
  faq: 'faq',
  all: 'content',
} as const;

export const LAZACORE = {
  name: 'lazaCore',
  url: 'https://lazacore.site',
} as const;
