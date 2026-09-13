import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectDetailView } from '@/components/pages/ProjectDetailView';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteContent } from '@/lib/content/getContent';
import { loadSlugPage } from '@/lib/i18n/loadPage';
import { localeSlugStaticParams } from '@/lib/i18n/staticParams';
import { t } from '@/lib/i18n/locale';
import { breadcrumbJsonLd } from '@/lib/seo/jsonld';
import { brandedTitle, buildPageMetadata } from '@/lib/seo/metadata';

export async function generateStaticParams() {
  const content = await getSiteContent();
  return localeSlugStaticParams(content.projects.filter((p) => p.visible).map((p) => p.slug));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, content, slug } = await loadSlugPage(params);
  const project = content.projects.find((p) => p.visible && p.slug === slug);
  if (!project) return {};
  return buildPageMetadata({
    locale,
    path: `/projects/${slug}`,
    title: brandedTitle(t(project.title, locale), content.settings.brandName),
    description: t(project.description, locale),
    image: project.images[0],
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, content, slug } = await loadSlugPage(params);
  const project = content.projects.find((p) => p.visible && p.slug === slug);
  if (!project) notFound();
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: content.nav[locale].home, path: '/' },
          { name: content.nav[locale].projects, path: '/projects' },
          { name: t(project.title, locale), path: `/projects/${slug}` },
        ])}
      />
      <ProjectDetailView locale={locale} content={content} slug={slug} />
    </>
  );
}
