import type { Metadata } from 'next';
import { FaqView } from '@/components/pages/FaqView';
import { JsonLd } from '@/components/seo/JsonLd';
import { loadLocalePage } from '@/lib/i18n/loadPage';
import { breadcrumbJsonLd, faqPageJsonLd } from '@/lib/seo/jsonld';
import { brandedTitle, buildPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale, content } = await loadLocalePage(params);
  const nav = content.nav[locale];
  return buildPageMetadata({
    locale,
    path: '/faq',
    title: brandedTitle(nav.faq, content.settings.brandName),
    description: content.ui[locale].footerTagline,
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, content } = await loadLocalePage(params);
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: content.nav[locale].home, path: '/' },
          { name: content.nav[locale].faq, path: '/faq' },
        ])}
      />
      <JsonLd data={faqPageJsonLd(locale, content.faq)} />
      <FaqView locale={locale} content={content} />
    </>
  );
}
