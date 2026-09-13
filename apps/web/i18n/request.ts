import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { isAppLocale } from '@/lib/i18n/locale';
import { DEFAULT_LOCALE } from '@/lib/constants';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !isAppLocale(locale)) {
    locale = DEFAULT_LOCALE;
  }

  return {
    locale,
    // UI chrome labels live in seed content; next-intl only drives routing/dir.
    messages: {},
  };
});
