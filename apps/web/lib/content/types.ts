import type { AppLocale, ProjectCategory, ServiceSlug } from '@/lib/constants';

/** Field-level localization shape used in seed + Sanity */
export type LocalizedString = Record<AppLocale, string>;

export interface SiteSettings {
  brandName: string;
  tagline: LocalizedString;
  pillars: LocalizedString;
  phoneDisplay: string;
  phoneTel: string;
  whatsappE164: string;
  email: string;
  address: LocalizedString;
  workingHours: LocalizedString;
  whatsappMessage: LocalizedString;
  logoUrl: string;
  logoDarkUrl: string;
  qrUrl: string;
  seoTitle: LocalizedString;
  seoDescription: LocalizedString;
}

export interface NavLabels {
  home: string;
  about: string;
  services: string;
  projects: string;
  materials: string;
  howWeWork: string;
  testimonials: string;
  blog: string;
  faq: string;
  contact: string;
  callUs: string;
  whatsapp: string;
  viewWork: string;
  learnMore: string;
  viewAll: string;
  viewProject: string;
  readMore: string;
  backHome: string;
  all: string;
}

export interface HomeContent {
  heroTitle: LocalizedString;
  heroSubtitle: LocalizedString;
  introEyebrow: LocalizedString;
  introTitle: LocalizedString;
  introDescription: LocalizedString;
  introFeatures: { title: LocalizedString; desc: LocalizedString }[];
  whyEyebrow: LocalizedString;
  whyTitle: LocalizedString;
  whySubtitle: LocalizedString;
  whyItems: { title: LocalizedString; desc: LocalizedString }[];
  processEyebrow: LocalizedString;
  processTitle: LocalizedString;
  processSubtitle: LocalizedString;
  ctaTitle: LocalizedString;
  ctaSubtitle: LocalizedString;
  heroImages: string[];
  servicesEyebrow: LocalizedString;
  servicesTitle: LocalizedString;
  servicesSubtitle: LocalizedString;
  projectsEyebrow: LocalizedString;
  projectsTitle: LocalizedString;
  projectsSubtitle: LocalizedString;
  materialsEyebrow: LocalizedString;
  materialsTitle: LocalizedString;
  materialsSubtitle: LocalizedString;
  testimonialsEyebrow: LocalizedString;
  testimonialsTitle: LocalizedString;
  testimonialsSubtitle: LocalizedString;
}

export interface PageHero {
  eyebrow: LocalizedString;
  title: LocalizedString;
  subtitle: LocalizedString;
  image?: string;
}

export interface AboutContent extends PageHero {
  body: LocalizedString;
  valuesTitle: LocalizedString;
  values: { title: LocalizedString; desc: LocalizedString }[];
}

export interface HowWeWorkContent extends PageHero {
  steps: {
    number: string;
    title: LocalizedString;
    description: LocalizedString;
  }[];
}

export interface ServiceItem {
  slug: ServiceSlug;
  title: LocalizedString;
  description: LocalizedString;
  image: string;
  features: LocalizedString[];
  visible: boolean;
}

export interface ProjectItem {
  slug: string;
  title: LocalizedString;
  description: LocalizedString;
  category: ProjectCategory;
  images: string[];
  materials: string[];
  visible: boolean;
}

export interface MaterialItem {
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
  characteristics: LocalizedString;
  applications: LocalizedString;
  finishes: LocalizedString;
  image: string;
  visible: boolean;
}

export interface TestimonialItem {
  id: string;
  name: string;
  rating: number;
  review: LocalizedString;
  project: LocalizedString;
  visible: boolean;
}

export interface BlogPostItem {
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  content: LocalizedString;
  category: string;
  author: string;
  date: string;
  image: string;
  visible: boolean;
}

export interface FaqItem {
  id: string;
  category: string;
  question: LocalizedString;
  answer: LocalizedString;
  visible: boolean;
}

export interface LegalSection {
  heading: LocalizedString;
  body: LocalizedString;
}

export interface LegalPage {
  title: LocalizedString;
  updated: LocalizedString;
  intro: LocalizedString;
  sections: LegalSection[];
}

export interface SiteContent {
  settings: SiteSettings;
  nav: Record<AppLocale, NavLabels>;
  home: HomeContent;
  about: AboutContent;
  howWeWork: HowWeWorkContent;
  contactPage: PageHero;
  categoryLabels: Record<AppLocale, Record<ProjectCategory | 'all', string>>;
  services: ServiceItem[];
  projects: ProjectItem[];
  materials: MaterialItem[];
  testimonials: TestimonialItem[];
  blogPosts: BlogPostItem[];
  faq: FaqItem[];
  legal: {
    privacy: LegalPage;
    cookies: LegalPage;
    terms: LegalPage;
  };
  ui: Record<
    AppLocale,
    {
      footerCta: string;
      footerTagline: string;
      servicesTitle: string;
      navTitle: string;
      contactTitle: string;
      languagesTitle: string;
      madeBy: string;
      allRightsReserved: string;
      notFoundTitle: string;
      notFoundBody: string;
      relatedProjects: string;
      demoNotice: string;
      privacy: string;
      cookies: string;
      terms: string;
      cookieNotice: string;
      cookieAccept: string;
      legalTitle: string;
    }
  >;
}
