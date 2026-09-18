import 'server-only';

import type { SiteContent } from '@/lib/content/types';
import { prisma } from '@/lib/db/prisma';
import { loadPostgresSitePayload } from '@/lib/content/postgres/load';
import { mapPostgresToSiteContent } from '@/lib/content/postgres/map';

/** Assembles the public Website SiteContent shape from PostgreSQL. */
export async function getSiteContentFromPostgres(): Promise<SiteContent> {
  const payload = await loadPostgresSitePayload(prisma);
  return mapPostgresToSiteContent(payload);
}
