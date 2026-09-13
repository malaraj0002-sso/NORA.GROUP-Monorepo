import type { Metadata } from 'next';
import { ServicesView } from '@/components/pages/ServicesView';
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
    path: '/services',
    title: brandedTitle(t(content.home.servicesTitle, locale), content.settings.brandName),
    description: t(content.home.servicesSubtitle, locale),
    image: content.services.find((s) => s.visible)?.image,
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, content } = await loadLocalePage(params);
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: content.nav[locale].home, path: '/' },
          { name: content.nav[locale].services, path: '/services' },
        ])}
      />
      <ServicesView locale={locale} content={content} />
    </>
  );
}
