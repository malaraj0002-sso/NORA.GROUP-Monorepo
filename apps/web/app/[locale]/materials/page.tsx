import type { Metadata } from 'next';
import { MaterialsView } from '@/components/pages/MaterialsView';
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
    path: '/materials',
    title: brandedTitle(t(content.home.materialsTitle, locale), content.settings.brandName),
    description: t(content.home.materialsSubtitle, locale),
    image: content.materials.find((m) => m.visible)?.image,
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, content } = await loadLocalePage(params);
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: content.nav[locale].home, path: '/' },
          { name: content.nav[locale].materials, path: '/materials' },
        ])}
      />
      <MaterialsView locale={locale} content={content} />
    </>
  );
}
