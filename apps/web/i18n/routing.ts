import { defineRouting } from 'next-intl/routing';
import { DEFAULT_LOCALE, LOCALES } from '@/lib/constants';

export const routing = defineRouting({
  locales: [...LOCALES],
  defaultLocale: DEFAULT_LOCALE, // Hebrew — unprefixed `/`
  localePrefix: 'as-needed',
  // Don't redirect `/` to /en|/ar|/ru based on the browser language
  localeDetection: false,
});
