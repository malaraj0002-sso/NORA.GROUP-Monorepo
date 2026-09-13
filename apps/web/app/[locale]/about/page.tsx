import type { Metadata } from 'next';
import { AboutView } from '@/components/pages/AboutView';
import { JsonLd } from '@/components/seo/JsonLd';
import { loadLocalePage } from '@/lib/i18n/loadPage';
import { t } from '@/lib/i18n/locale';
import { breadcrumbJsonLd } from '@/lib/seo/jsonld';
import { brandedTitle, buildPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale, content } = await loadLocalePage(params);
  return buildPageMetadata({
    locale,
    path: '/about',
    title: brandedTitle(t(content.about.title, locale), content.settings.brandName),
    description: t(content.about.subtitle, locale),
    image: content.about.image,
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, content } = await loadLocalePage(params);
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: content.nav[locale].home, path: '/' },
          { name: content.nav[locale].about, path: '/about' },
        ])}
      />
      <AboutView locale={locale} content={content} />
    </>
  );
}
