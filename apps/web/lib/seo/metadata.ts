import type { Metadata } from 'next';
import { LOCALE_META, type AppLocale } from '@/lib/constants';
import { absoluteUrl, hreflangMap, toAbsoluteAsset } from '@/lib/seo/urls';

export function brandedTitle(title: string, brand: string): string {
  const trimmed = title.trim();
  if (!trimmed) return brand;
  if (trimmed.includes(brand)) return trimmed;
  return `${trimmed} | ${brand}`;
}

export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  image,
  ogType = 'website',
}: {
  locale: AppLocale;
  path: string;
  title: string;
  description: string;
  image?: string;
  ogType?: 'website' | 'article';
}): Metadata {
  const url = absoluteUrl(locale, path);
  const ogImage = toAbsoluteAsset(image);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: hreflangMap(path),
    },
    openGraph: {
      title,
      description,
      url,
      locale: LOCALE_META[locale].htmlLang,
      type: ogType,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}
