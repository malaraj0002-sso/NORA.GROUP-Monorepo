import { LOCALES, LOCALE_META, SERVICE_SLUGS, type AppLocale } from '@/lib/constants';
import type { LocalizedString, SiteContent } from '@/lib/content/types';

export type ParityIssue = {
  path: string;
  message: string;
  severity: 'error' | 'warning';
};

const REQUIRED_SITE_KEYS: (keyof SiteContent)[] = [
  'settings',
  'nav',
  'home',
  'about',
  'howWeWork',
  'contactPage',
  'categoryLabels',
  'services',
  'projects',
  'materials',
  'testimonials',
  'blogPosts',
  'faq',
  'legal',
  'ui',
];

function isLocalized(value: unknown): value is LocalizedString {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return LOCALES.every((locale) => typeof record[locale] === 'string');
}

function looksLikeLocalized(value: object): boolean {
  const record = value as Record<string, unknown>;
  const localeValues = LOCALES.map((locale) => record[locale]);
  const hasLocale = localeValues.some((item) => typeof item === 'string');
  const onlyStrings = localeValues.every((item) => item === undefined || typeof item === 'string');
  return hasLocale && onlyStrings;
}

function walkLocalized(path: string, value: unknown, issues: ParityIssue[]) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkLocalized(`${path}[${index}]`, item, issues));
    return;
  }
  if (!value || typeof value !== 'object') return;
  if (isLocalized(value) || looksLikeLocalized(value)) {
    for (const locale of LOCALES) {
      if (typeof (value as Record<string, unknown>)[locale] !== 'string') {
        issues.push({ path: `${path}.${locale}`, message: 'Missing locale key', severity: 'error' });
      }
    }
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    walkLocalized(`${path}.${key}`, child, issues);
  }
}

export function assertSiteContentContract(content: SiteContent): ParityIssue[] {
  const issues: ParityIssue[] = [];

  for (const key of REQUIRED_SITE_KEYS) {
    if (!(key in content) || content[key] === undefined) {
      issues.push({ path: key, message: 'Missing SiteContent field', severity: 'error' });
    }
  }

  if (!Array.isArray(content.services)) {
    issues.push({ path: 'services', message: 'services must be an array', severity: 'error' });
    return issues;
  }

  const slugs = content.services.map((service) => service.slug);
  for (const expected of SERVICE_SLUGS) {
    if (!slugs.includes(expected)) {
      issues.push({ path: 'services', message: `Missing official service slug: ${expected}`, severity: 'error' });
    }
  }
  if (slugs.length !== SERVICE_SLUGS.length) {
    issues.push({
      path: 'services',
      message: `Expected exactly ${SERVICE_SLUGS.length} services, found ${slugs.length}`,
      severity: 'error',
    });
  }

  const doorPattern = /door|luxury-doors|דלת|باب/i;
  for (const service of content.services) {
    const haystack = `${service.slug} ${service.title.he} ${service.title.ar} ${service.title.en} ${service.title.ru}`;
    if (doorPattern.test(haystack)) {
      issues.push({
        path: `services.${service.slug}`,
        message: 'Door service is not permitted',
        severity: 'error',
      });
    }
    if (!service.image) {
      issues.push({ path: `services.${service.slug}.image`, message: 'Missing media URL', severity: 'warning' });
    } else if (!service.image.startsWith('/') && !service.image.startsWith('https://')) {
      issues.push({
        path: `services.${service.slug}.image`,
        message: 'Media URL must be a local path or https URL',
        severity: 'error',
      });
    }
    if (!Array.isArray(service.features)) {
      issues.push({ path: `services.${service.slug}.features`, message: 'features must be an array', severity: 'error' });
    }
  }

  for (const locale of LOCALES) {
    const dir = LOCALE_META[locale].dir;
    const expected = locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr';
    if (dir !== expected) {
      issues.push({
        path: `locale.${locale}.dir`,
        message: `Expected ${expected}, found ${dir}`,
        severity: 'error',
      });
    }
    if (!content.nav[locale]) {
      issues.push({ path: `nav.${locale}`, message: 'Missing nav locale', severity: 'error' });
    }
    if (!content.ui[locale]) {
      issues.push({ path: `ui.${locale}`, message: 'Missing UI locale', severity: 'error' });
    }
    if (!content.categoryLabels[locale]) {
      issues.push({ path: `categoryLabels.${locale}`, message: 'Missing category labels locale', severity: 'error' });
    }
  }

  for (const name of ['privacy', 'cookies', 'terms'] as const) {
    if (!content.legal[name]) {
      issues.push({ path: `legal.${name}`, message: 'Missing legal page', severity: 'error' });
    }
  }

  if (!Array.isArray(content.projects)) issues.push({ path: 'projects', message: 'must be an array', severity: 'error' });
  if (!Array.isArray(content.materials)) issues.push({ path: 'materials', message: 'must be an array', severity: 'error' });
  if (!Array.isArray(content.testimonials)) {
    issues.push({ path: 'testimonials', message: 'must be an array', severity: 'error' });
  }
  if (!Array.isArray(content.blogPosts)) issues.push({ path: 'blogPosts', message: 'must be an array', severity: 'error' });
  if (!Array.isArray(content.faq)) issues.push({ path: 'faq', message: 'must be an array', severity: 'error' });
  if (!Array.isArray(content.home.introFeatures)) {
    issues.push({ path: 'home.introFeatures', message: 'must be an array', severity: 'error' });
  }
  if (!Array.isArray(content.home.whyItems)) {
    issues.push({ path: 'home.whyItems', message: 'must be an array', severity: 'error' });
  }
  if (!Array.isArray(content.home.heroImages)) {
    issues.push({ path: 'home.heroImages', message: 'must be an array', severity: 'error' });
  }

  walkLocalized('content', content, issues);

  return issues;
}

export function formatParityReport(issues: ParityIssue[]): string {
  if (!issues.length) return 'SiteContent contract: PASS (no issues)';
  return issues.map((issue) => `[${issue.severity}] ${issue.path}: ${issue.message}`).join('\n');
}
