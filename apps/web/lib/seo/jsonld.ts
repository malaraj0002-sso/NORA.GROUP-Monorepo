import { SITE_URL, type AppLocale } from '@/lib/constants';
import type { SiteContent } from '@/lib/content/types';
import { t } from '@/lib/i18n/locale';
import { absoluteUrl, toAbsoluteAsset } from '@/lib/seo/urls';

/**
 * CMS copy can include `</script>` / U+2028 and break out of JSON-LD.
 * Unicode-escape those so dangerouslySetInnerHTML stays a JSON literal.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function localBusinessGraph(content: SiteContent, locale: AppLocale) {
  const { settings } = content;
  const logo = toAbsoluteAsset(settings.logoUrl) ?? `${SITE_URL}/logo.png`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HomeAndConstructionBusiness',
        '@id': `${SITE_URL}/#business`,
        name: settings.brandName,
        url: SITE_URL,
        telephone: settings.phoneTel,
        email: settings.email,
        image: logo,
        address: {
          '@type': 'PostalAddress',
          addressLocality: t(settings.address, locale),
          addressCountry: 'IL',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: settings.brandName,
        inLanguage: ['he', 'ar', 'en', 'ru'],
        publisher: { '@id': `${SITE_URL}/#business` },
      },
    ],
  };
}

export function breadcrumbJsonLd(
  locale: AppLocale,
  items: { name: string; path: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(locale, item.path),
    })),
  };
}

export function faqPageJsonLd(
  locale: AppLocale,
  items: SiteContent['faq'],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items
      .filter((item) => item.visible)
      .map((item) => ({
        '@type': 'Question',
        name: t(item.question, locale),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t(item.answer, locale),
        },
      })),
  };
}

export function articleJsonLd({
  locale,
  path,
  title,
  description,
  image,
  date,
  author,
}: {
  locale: AppLocale;
  path: string;
  title: string;
  description: string;
  image?: string;
  date?: string;
  author: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    mainEntityOfPage: absoluteUrl(locale, path),
    image: toAbsoluteAsset(image),
    datePublished: date || undefined,
    author: { '@type': 'Organization', name: author },
    publisher: { '@id': `${SITE_URL}/#business` },
  };
}
