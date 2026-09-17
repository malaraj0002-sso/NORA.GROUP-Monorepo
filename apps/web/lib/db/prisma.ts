import 'server-only';
import { PrismaClient } from '@prisma/client';

/**
 * Server-only Prisma singleton. Do not import from Client Components.
 * DATABASE_URL is read by Prisma on the server; it must never be NEXT_PUBLIC_*.
 */

const globalForPrisma = globalThis as unknown as { noraPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.noraPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.noraPrisma = prisma;
}
