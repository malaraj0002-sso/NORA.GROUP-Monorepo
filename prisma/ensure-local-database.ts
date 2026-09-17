import { PrismaClient } from '@prisma/client';
import { describeLocalDatabase, loadLocalDatabaseUrl } from '../apps/web/scripts/local-database-url';

function adminUrlFor(url: string): { adminUrl: string; database: string } {
  const parsed = new URL(url);
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, '') || 'nora_group');
  parsed.pathname = '/postgres';
  return { adminUrl: parsed.toString(), database };
}

async function main() {
  const url = loadLocalDatabaseUrl();
  const { host } = describeLocalDatabase(url);
  const { adminUrl, database } = adminUrlFor(url);
  process.stdout.write(`Ensuring LOCAL database host=${host} name=${database}\n`);

  const prisma = new PrismaClient({ datasources: { db: { url: adminUrl } } });
  try {
    const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ${database}) AS exists
    `;
    if (rows[0]?.exists) {
      process.stdout.write(`Database already exists: ${database}\n`);
      return;
    }
    const safeName = database.replace(/"/g, '');
    await prisma.$executeRawUnsafe(`CREATE DATABASE "${safeName}"`);
    process.stdout.write(`Created LOCAL database: ${safeName}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Could not ensure local database';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
