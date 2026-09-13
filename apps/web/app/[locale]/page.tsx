import type { Metadata } from 'next';
import { HomeView } from '@/components/home/HomeView';
import { JsonLd } from '@/components/seo/JsonLd';
import { loadLocalePage } from '@/lib/i18n/loadPage';
import { t } from '@/lib/i18n/locale';
import { localBusinessGraph } from '@/lib/seo/jsonld';
import { buildPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale, content } = await loadLocalePage(params);
  return buildPageMetadata({
    locale,
    path: '/',
    title: t(content.settings.seoTitle, locale),
    description: t(content.settings.seoDescription, locale),
    image: content.home.heroImages[0] || content.settings.logoUrl,
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, content } = await loadLocalePage(params);
  return (
    <>
      <JsonLd data={localBusinessGraph(content, locale)} />
      <HomeView locale={locale} content={content} />
    </>
  );
}
