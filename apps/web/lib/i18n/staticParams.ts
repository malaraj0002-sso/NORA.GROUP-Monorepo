import { LOCALES } from '@/lib/constants';
import { isSafeSlug } from '@/lib/i18n/locale';

export function localeSlugStaticParams(slugs: string[]) {
  return LOCALES.flatMap((locale) =>
    slugs.filter(isSafeSlug).map((slug) => ({ locale, slug })),
  );
}
