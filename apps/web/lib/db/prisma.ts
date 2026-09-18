import 'server-only';

import { PrismaClient } from '@prisma/client';
import { ensureDatabaseUrl } from '@/lib/db/loadDatabaseUrl';

/**
 * Server-only Prisma singleton. Do not import from Client Components.
 * DATABASE_URL is read on the server; it must never be NEXT_PUBLIC_*.
 */

const globalForPrisma = globalThis as unknown as { noraPrisma?: PrismaClient };

function createClient(): PrismaClient {
  ensureDatabaseUrl();
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.noraPrisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.noraPrisma = prisma;
}
