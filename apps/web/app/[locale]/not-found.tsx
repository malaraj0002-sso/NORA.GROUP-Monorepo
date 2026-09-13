import { NotFoundView } from '@/components/pages/NotFoundView';
import { getSiteContent } from '@/lib/content/getContent';
import { parseLocale } from '@/lib/i18n/locale';
import { getLocale } from 'next-intl/server';

export default async function NotFound() {
  const locale = parseLocale(await getLocale());
  const content = await getSiteContent();
  return <NotFoundView locale={locale} content={content} />;
}
