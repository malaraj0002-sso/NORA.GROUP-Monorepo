import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { LOCALES, REVALIDATE_TAGS } from '@/lib/constants';
import { seedContent } from '@/lib/content/seed';
import type { BlogPostItem, SiteContent } from '@/lib/content/types';
import { isSafeSlug } from '@/lib/i18n/locale';
import { getSiteContentFromPostgres } from '@/lib/content/fromPostgres';

const postgresSiteContent = unstable_cache(
  async () => getSiteContentFromPostgres(),
  ['nora-site-content'],
  {
    tags: Object.values(REVALIDATE_TAGS),
    revalidate: 60,
  },
);

/**
 * Single entry for all public pages.
 * PostgreSQL is the source of truth. Seed is only used when the database
 * cannot be reached, so the marketing site never ships a blank page.
 *
 * Wrapped in React.cache() so layout + generateMetadata share one result per request.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  try {
    return await postgresSiteContent();
  } catch {
    console.error('[getSiteContent] PostgreSQL unavailable; using seed fallback');
    return seedContent;
  }
});

export const getBlogPost = cache(async (slug: string): Promise<BlogPostItem | null> => {
  if (!isSafeSlug(slug)) return null;

  const site = await getSiteContent();
  const post = site.blogPosts.find((b) => b.visible && b.slug === slug);
  return post ?? null;
});
