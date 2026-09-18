import { PrismaClient } from '@prisma/client';
import { ensureDatabaseUrl } from './loadDatabaseUrl';

const globalForPrisma = globalThis as unknown as { noraDashboardPrisma?: PrismaClient };

function createClient(): PrismaClient {
  ensureDatabaseUrl();
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.noraDashboardPrisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.noraDashboardPrisma = prisma;
}
