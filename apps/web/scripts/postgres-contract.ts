import { SERVICE_SLUGS } from '@/lib/constants';
import type { ServiceItem } from '@/lib/content/types';
import { EMPTY_LOCALE, mapPostgresToSiteContent, type PostgresSitePayload } from '@/lib/content/postgres/map';
import { assertSiteContentContract, formatParityReport } from '@/lib/content/siteContentContract';

function serviceRow(slug: string, index: number): PostgresSitePayload['services'][number] {
  return {
    slug,
    title: { he: `שירות ${index + 1}`, ar: `خدمة ${index + 1}`, en: `Service ${index + 1}`, ru: `Услуга ${index + 1}` },
    description: { ...EMPTY_LOCALE, en: 'Existing website structure only' },
    published: true,
    sortOrder: index,
    features: [],
    media: [{ sortOrder: 0, media: { url: `/images/${slug}.jpg` } }],
  };
}

function fixture(services: PostgresSitePayload['services']): PostgresSitePayload {
  return {
    settings: null,
    home: null,
    about: null,
    howWeWork: null,
    contact: null,
    services,
    projects: [],
    materials: [],
    testimonials: [],
    blogPosts: [],
    faq: [],
    uiCopy: [],
    legal: [],
  };
}

function main() {
  const prismaSlugs = [
    'kitchens',
    'bedrooms',
    'wardrobes',
    'walkInClosets',
    'customFurniture',
    'offices',
    'commercial',
  ];
  const official = mapPostgresToSiteContent(fixture(prismaSlugs.map(serviceRow)));
  const officialIssues = assertSiteContentContract(official);
  const officialErrors = officialIssues.filter((issue) => issue.severity === 'error');
  process.stdout.write('--- official seven services ---\n');
  process.stdout.write(`${formatParityReport(officialIssues)}\n`);
  process.stdout.write(`mapped slugs: ${official.services.map((service) => service.slug).join(', ')}\n`);
  if (official.services.map((service) => service.slug).join(',') !== SERVICE_SLUGS.join(',')) {
    process.stderr.write('Mapped service slugs do not match SERVICE_SLUGS\n');
    process.exitCode = 1;
    return;
  }

  const droppedDoors = mapPostgresToSiteContent(
    fixture([...prismaSlugs.map(serviceRow), serviceRow('doors', 99), serviceRow('luxury-doors', 100)]),
  );
  if (droppedDoors.services.some((service) => /door/i.test(service.slug))) {
    process.stderr.write('Mapper leaked a door slug into SiteContent\n');
    process.exitCode = 1;
    return;
  }
  process.stdout.write('Mapper dropped unknown door slugs: PASS\n');

  const doorService: ServiceItem = {
    slug: 'doors' as ServiceItem['slug'],
    title: { he: 'דלתות', ar: 'أبواب', en: 'Doors', ru: 'Двери' },
    description: { ...EMPTY_LOCALE },
    image: '/images/doors.jpg',
    features: [],
    visible: true,
  };
  const forcedDoor = assertSiteContentContract({
    ...official,
    services: [...official.services, doorService],
  });
  const doorFailed =
    forcedDoor.some((issue) => issue.message.includes('Door service')) ||
    forcedDoor.some((issue) => issue.message.includes('Expected exactly'));
  process.stdout.write('--- injected door service must fail ---\n');
  process.stdout.write(`${formatParityReport(forcedDoor)}\n`);
  if (!doorFailed) {
    process.stderr.write('Door service did not fail validation\n');
    process.exitCode = 1;
    return;
  }

  if (officialErrors.length) {
    process.exitCode = 1;
    return;
  }
  process.stdout.write('Contract fixture: PASS\n');
}

main();
