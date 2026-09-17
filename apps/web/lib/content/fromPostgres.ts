import 'server-only';

import type { SiteContent } from '@/lib/content/types';
import { prisma } from '@/lib/db/prisma';
import { loadPostgresSitePayload } from '@/lib/content/postgres/load';
import { mapPostgresToSiteContent } from '@/lib/content/postgres/map';

/**
 * Assembles the existing Website SiteContent shape from local PostgreSQL.
 * Not used by getSiteContent() yet — Sanity remains the live source.
 */
export async function getSiteContentFromPostgres(): Promise<SiteContent> {
  const payload = await loadPostgresSitePayload(prisma);
  return mapPostgresToSiteContent(payload);
}
