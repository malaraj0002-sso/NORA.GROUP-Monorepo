import { NextResponse } from 'next/server';
import { ensureDatabaseUrl } from '../lib/db/loadDatabaseUrl';
import { prisma } from '../lib/db/prisma';
import { asLocale } from '../lib/db/locale';
import { OFFICIAL_SERVICE_SLUGS, PRISMA_TO_WEBSITE_SLUG, isForbiddenDoorService } from '../lib/db/services';
import { rejectDoorMutation } from '../lib/server/content/schema';
import { applyMutation } from '../lib/server/content/postgres/mutate';
import { roleHasPermission } from '../lib/server/permissions';
import { requireSession } from '../lib/server/http';
import type { Session } from '../lib/auth/session';

function assertLocalUrl(url: string) {
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase();
  if (host !== 'localhost' && host !== '127.0.0.1') {
    throw new Error('Refusing to run Phase 3 checks against a non-local database');
  }
  return {
    host,
    database: decodeURIComponent(parsed.pathname.replace(/^\//, '') || ''),
  };
}

const ownerSession: Session = {
  sub: 'phase3-check',
  email: 'phase3-check@localhost',
  role: 'owner',
  exp: Math.floor(Date.now() / 1000) + 3600,
};

async function fail(message: string): Promise<never> {
  process.stderr.write(`FAIL: ${message}\n`);
  await prisma.$disconnect();
  process.exit(1);
}

async function main() {
  const url = ensureDatabaseUrl();
  const { host, database } = assertLocalUrl(url);
  process.stdout.write(`Phase 3 check LOCAL host=${host} database=${database}\n`);

  const unauth = await requireSession(new Request('http://localhost/api/cms', { method: 'POST' }));
  if (!(unauth instanceof NextResponse) || unauth.status !== 401) {
    await fail('unauthenticated request was not rejected');
  }
  process.stdout.write('security unauthenticated: PASS\n');

  const employeeWrite = await roleHasPermission('employee', 'cms.write');
  const ownerWrite = await roleHasPermission('owner', 'cms.write');
  const editorDelete = await roleHasPermission('editor', 'cms.delete');
  const adminDelete = await roleHasPermission('admin', 'cms.delete');
  if (employeeWrite) await fail('employee unexpectedly has cms.write');
  if (!ownerWrite) await fail('owner missing cms.write');
  if (editorDelete) await fail('editor unexpectedly has cms.delete');
  if (!adminDelete) await fail('admin missing cms.delete');
  process.stdout.write('security permissions: PASS\n');

  const door = rejectDoorMutation({
    resource: 'service',
    op: 'create',
    data: {
      slug: 'kitchens',
      title: { he: 'דלתות', ar: 'أبواب', en: 'Doors', ru: 'Двери' },
    },
  });
  if (!door) await fail('door title was not rejected');
  process.stdout.write('services door rejection: PASS\n');

  const rows = await prisma.service.findMany({ orderBy: { sortOrder: 'asc' } });
  const slugs = rows.map((row: { slug: string }) => PRISMA_TO_WEBSITE_SLUG[row.slug] || String(row.slug));
  if (slugs.join(',') !== OFFICIAL_SERVICE_SLUGS.join(',')) {
    await fail(`expected official slugs, found ${slugs.join(',')}`);
  }
  if (
    rows.some((row: { id: string; slug: string; title: unknown }, index: number) =>
      isForbiddenDoorService({ id: row.id, slug: slugs[index], title: asLocale(row.title) }),
    )
  ) {
    await fail('door service present in database');
  }
  for (const row of rows as Array<{ slug: string; title: unknown }>) {
    const locale = asLocale(row.title);
    if (!('he' in locale) || !('ar' in locale) || !('en' in locale) || !('ru' in locale)) {
      await fail(`service ${row.slug} missing locale keys`);
    }
  }
  process.stdout.write(`services read: PASS (${slugs.join(', ')})\n`);
  process.stdout.write('localization he/ar/en/ru: PASS\n');

  const kitchen = (rows as Array<{ id: string; slug: string; description: unknown }>).find(
    (row: { slug: string }) => row.slug === 'kitchens',
  );
  if (!kitchen) {
    await fail('kitchens service missing');
    return;
  }
  const before = asLocale(kitchen.description);
  const marker = `phase3-${Date.now()}`;
  const update = await applyMutation(
    {
      resource: 'service',
      op: 'patch',
      id: kitchen.id,
      data: { description: { en: `${before.en} ${marker}` } },
    },
    { session: ownerSession },
  );
  if (!update.ok) await fail(update.error);
  const after = await prisma.service.findUnique({ where: { id: kitchen.id } });
  const afterLocale = asLocale(after?.description);
  if (!afterLocale.en.includes(marker)) await fail('service update did not persist');
  if (afterLocale.he !== before.he || afterLocale.ar !== before.ar || afterLocale.ru !== before.ru) {
    await fail('service update overwrote another locale');
  }
  const features = await prisma.serviceFeature.findMany({ where: { serviceId: kitchen.id } });
  await applyMutation(
    { resource: 'service', op: 'patch', id: kitchen.id, data: { description: { en: before.en } } },
    { session: ownerSession },
  );
  process.stdout.write(`service update: PASS (features=${features.length})\n`);

  const home = await applyMutation(
    { resource: 'homepage', op: 'patch', data: { heroTitle: { en: asLocale((await prisma.homePage.findUnique({ where: { id: 'default' } }))?.heroTitle).en } } },
    { session: ownerSession },
  );
  if (!home.ok) await fail(home.error);
  const about = await applyMutation(
    { resource: 'about', op: 'patch', data: { story: { en: asLocale((await prisma.aboutPage.findUnique({ where: { id: 'default' } }))?.body).en } } },
    { session: ownerSession },
  );
  if (!about.ok) await fail(about.error);
  const how = await prisma.howWeWorkStep.findFirst();
  if (how) {
    const howResult = await applyMutation(
      {
        resource: 'howWeWork',
        op: 'patch',
        data: { steps: [{ id: how.id, title: { en: asLocale(how.title).en } }] },
      },
      { session: ownerSession },
    );
    if (!howResult.ok) await fail(howResult.error);
  }
  const contact = await applyMutation(
    { resource: 'contact', op: 'patch', data: { title: { en: asLocale((await prisma.contactPage.findUnique({ where: { id: 'default' } }))?.title).en } } },
    { session: ownerSession },
  );
  if (!contact.ok) await fail(contact.error);
  const ui = await applyMutation(
    { resource: 'uiCopy', op: 'patch', data: { locale: 'en', namespace: 'nav', key: 'home', value: 'Home' } },
    { session: ownerSession },
  );
  if (!ui.ok) await fail(ui.error);
  process.stdout.write('page CRUD homepage/about/how-we-work/contact/uiCopy: PASS\n');

  const audits = await prisma.auditLog.findMany({ where: { entity: 'service' }, orderBy: { createdAt: 'desc' }, take: 1 });
  if (!audits.length) await fail('expected AuditLog row for service update');
  process.stdout.write('audit: PASS\n');

  if (await roleHasPermission('employee', 'cms.delete')) await fail('employee has cms.delete');
  process.stdout.write('security insufficient permission mapping: PASS\n');

  await prisma.$disconnect();
  process.stdout.write('Phase 3 postgres check: PASS\n');
}

main().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Phase 3 check failed';
  process.stderr.write(`${message}\n`);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
