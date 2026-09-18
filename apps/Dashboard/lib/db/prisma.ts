import { PrismaClient } from '@prisma/client';
import { ensureDatabaseUrl } from './loadDatabaseUrl';

const globalForPrisma = globalThis as unknown as { noraDashboardPrisma?: PrismaClient };

function getClient(): PrismaClient {
  if (!globalForPrisma.noraDashboardPrisma) {
    ensureDatabaseUrl();
    globalForPrisma.noraDashboardPrisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  return globalForPrisma.noraDashboardPrisma;
}

/** Lazy so `/login` can import server modules without constructing Prisma. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
