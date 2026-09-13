import type { AppLocale } from '@/lib/constants';
import { DEFAULT_LOCALE, LOCALES, LOCALE_META } from '@/lib/constants';
import type { LocalizedString } from '@/lib/content/types';

export function isAppLocale(value: string): value is AppLocale {
  return (LOCALES as readonly string[]).includes(value);
}

export function isSafeSlug(slug: string): boolean {
  return (
    typeof slug === 'string' &&
    slug.length > 0 &&
    slug.length <= 120 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)
  );
}

export function parseLocale(value: string | undefined): AppLocale {
  return value && isAppLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Resolve a localized field: prefer active locale, then Hebrew (main market), then any non-empty value.
 */
export function t(
  value: LocalizedString | undefined | null,
  locale: AppLocale,
  fallback = '',
): string {
  if (!value) return fallback;
  const primary = value[locale]?.trim();
  if (primary) return primary;
  const hebrew = value[DEFAULT_LOCALE]?.trim();
  if (hebrew) return hebrew;
  for (const code of LOCALES) {
    const next = value[code]?.trim();
    if (next) return next;
  }
  return fallback;
}

export function localeDir(locale: AppLocale): 'rtl' | 'ltr' {
  return LOCALE_META[locale].dir;
}

export function L(he: string, ar: string, en: string, ru: string): LocalizedString {
  return { he, ar, en, ru };
}
