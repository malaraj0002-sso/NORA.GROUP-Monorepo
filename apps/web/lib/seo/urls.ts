import { DEFAULT_LOCALE, LOCALES, SITE_URL, type AppLocale } from '@/lib/constants';

export function localizedPath(locale: AppLocale, path: string): string {
  const clean = !path || path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean || '/';
  return `/${locale}${clean}`;
}

export function absoluteUrl(locale: AppLocale, path: string): string {
  const loc = localizedPath(locale, path);
  if (loc === '/') return SITE_URL;
  return `${SITE_URL}${loc}`;
}

export function toAbsoluteAsset(src: string | undefined | null): string | undefined {
  if (!src) return undefined;
  const trimmed = src.trim();
  if (!trimmed || trimmed.startsWith('//') || /[\s<>]/.test(trimmed)) return undefined;
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    try {
      const url = new URL(trimmed);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
      if (url.protocol === 'http:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
        return undefined;
      }
      return url.href;
    } catch {
      return undefined;
    }
  }
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return `${SITE_URL}${trimmed}`;
  }
  return undefined;
}

export function hreflangMap(path: string): Record<string, string> {
  const languages: Record<string, string> = {
    'x-default': absoluteUrl(DEFAULT_LOCALE, path),
  };
  for (const locale of LOCALES) {
    languages[locale] = absoluteUrl(locale, path);
  }
  return languages;
}
