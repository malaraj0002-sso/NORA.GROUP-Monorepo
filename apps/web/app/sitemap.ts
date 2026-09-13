import type { MetadataRoute } from 'next';
import { LOCALES } from '@/lib/constants';
import { getSiteContent } from '@/lib/content/getContent';
import { absoluteUrl, hreflangMap } from '@/lib/seo/urls';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await getSiteContent();
  const staticPaths = [
    '/',
    '/about',
    '/services',
    '/projects',
    '/materials',
    '/how-we-work',
    '/testimonials',
    '/blog',
    '/faq',
    '/contact',
    '/privacy',
    '/cookies',
    '/terms',
  ];

  const entityPaths = [
    ...content.services.filter((x) => x.visible).map((s) => `/services/${s.slug}`),
    ...content.projects.filter((x) => x.visible).map((p) => `/projects/${p.slug}`),
    ...content.blogPosts.filter((x) => x.visible).map((b) => `/blog/${b.slug}`),
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const path of staticPaths) {
      entries.push({
        url: absoluteUrl(locale, path),
        changeFrequency: 'weekly',
        priority: path === '/' ? 1 : path === '/privacy' || path === '/cookies' || path === '/terms' ? 0.3 : 0.7,
        alternates: { languages: hreflangMap(path) },
      });
    }
    for (const path of entityPaths) {
      const blog = content.blogPosts.find((b) => b.visible && `/blog/${b.slug}` === path);
      entries.push({
        url: absoluteUrl(locale, path),
        changeFrequency: 'monthly',
        priority: 0.6,
        lastModified: blog?.date ? new Date(blog.date) : undefined,
        alternates: { languages: hreflangMap(path) },
      });
    }
  }

  return entries;
}
