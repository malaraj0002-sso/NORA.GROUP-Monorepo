import { PrismaClient } from '@prisma/client';
import { loadPostgresSitePayload } from '../lib/content/postgres/load';
import { mapPostgresToSiteContent } from '../lib/content/postgres/map';
import { assertSiteContentContract, formatParityReport } from '../lib/content/siteContentContract';
import { describeLocalDatabase, loadLocalDatabaseUrl } from './local-database-url';

async function main() {
  const url = loadLocalDatabaseUrl();
  const { host, database } = describeLocalDatabase(url);
  process.stdout.write(`Parity against LOCAL PostgreSQL host=${host} database=${database}\n`);

  const prisma = new PrismaClient();
  try {
    const payload = await loadPostgresSitePayload(prisma);
    const content = mapPostgresToSiteContent(payload);
    const issues = assertSiteContentContract(content);
    const errors = issues.filter((issue) => issue.severity === 'error');
    process.stdout.write(`${formatParityReport(issues)}\n`);
    process.stdout.write(`services: ${content.services.map((service) => service.slug).join(', ')}\n`);
    process.stdout.write(
      `locales: he=${content.nav.he.home ? 'rtl-ready' : 'empty'} ar=${content.nav.ar.home ? 'rtl-ready' : 'empty'} en=${content.nav.en.home ? 'ltr-ready' : 'empty'} ru=${content.nav.ru.home ? 'ltr-ready' : 'empty'}\n`,
    );
    if (errors.length) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Parity failed';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
