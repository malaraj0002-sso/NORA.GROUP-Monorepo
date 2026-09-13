import type { Metadata } from 'next';
import { HowWeWorkView } from '@/components/pages/HowWeWorkView';
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
    path: '/how-we-work',
    title: brandedTitle(t(content.howWeWork.title, locale), content.settings.brandName),
    description: t(content.howWeWork.subtitle, locale),
    image: content.howWeWork.image,
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, content } = await loadLocalePage(params);
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: content.nav[locale].home, path: '/' },
          { name: content.nav[locale].howWeWork, path: '/how-we-work' },
        ])}
      />
      <HowWeWorkView locale={locale} content={content} />
    </>
  );
}
