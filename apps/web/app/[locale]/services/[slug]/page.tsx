import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ServiceDetailView } from '@/components/pages/ServiceDetailView';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteContent } from '@/lib/content/getContent';
import { loadSlugPage } from '@/lib/i18n/loadPage';
import { localeSlugStaticParams } from '@/lib/i18n/staticParams';
import { t } from '@/lib/i18n/locale';
import { breadcrumbJsonLd } from '@/lib/seo/jsonld';
import { brandedTitle, buildPageMetadata } from '@/lib/seo/metadata';

export async function generateStaticParams() {
  const content = await getSiteContent();
  return localeSlugStaticParams(content.services.filter((s) => s.visible).map((s) => s.slug));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, content, slug } = await loadSlugPage(params);
  const service = content.services.find((s) => s.visible && s.slug === slug);
  if (!service) return {};
  return buildPageMetadata({
    locale,
    path: `/services/${slug}`,
    title: brandedTitle(t(service.title, locale), content.settings.brandName),
    description: t(service.description, locale),
    image: service.image,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, content, slug } = await loadSlugPage(params);
  const service = content.services.find((s) => s.visible && s.slug === slug);
  if (!service) notFound();
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: content.nav[locale].home, path: '/' },
          { name: content.nav[locale].services, path: '/services' },
          { name: t(service.title, locale), path: `/services/${slug}` },
        ])}
      />
      <ServiceDetailView locale={locale} content={content} slug={slug} />
    </>
  );
}
