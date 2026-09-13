import type { Metadata } from 'next';
import { LegalView } from '@/components/pages/LegalView';
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
    path: '/terms',
    title: brandedTitle(t(content.legal.terms.title, locale), content.settings.brandName),
    description: t(content.legal.terms.intro, locale),
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, content } = await loadLocalePage(params);
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: content.nav[locale].home, path: '/' },
          { name: content.ui[locale].terms, path: '/terms' },
        ])}
      />
      <LegalView locale={locale} page={content.legal.terms} eyebrow={content.ui[locale].legalTitle} />
    </>
  );
}
