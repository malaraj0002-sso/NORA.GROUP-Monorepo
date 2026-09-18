import { PrismaClient } from '@prisma/client';
import { LOCALES, SERVICE_SLUGS, type AppLocale } from '@/lib/constants';
import { seedContent } from '@/lib/content/seed';
import type { LocalizedString, NavLabels, SiteContent } from '@/lib/content/types';
import { describeLocalDatabase, loadLocalDatabaseUrl } from './local-database-url';

const WEBSITE_TO_PRISMA_SLUG = {
  kitchens: 'kitchens',
  bedrooms: 'bedrooms',
  wardrobes: 'wardrobes',
  'walk-in-closets': 'walkInClosets',
  'custom-furniture': 'customFurniture',
  offices: 'offices',
  commercial: 'commercial',
} as const;

const PERMISSIONS = [
  { code: 'cms.read', description: 'Read CMS / site content (Dashboard content APIs)' },
  { code: 'cms.write', description: 'Create and update CMS documents (POST /api/cms, editor+)' },
  { code: 'cms.delete', description: 'Delete CMS documents (POST /api/cms op=delete, admin+)' },
  { code: 'media.upload', description: 'Upload media (POST /api/media, editor+)' },
  { code: 'users.manage', description: 'Create and update Dashboard users ( /api/users, owner only)' },
  { code: 'translations.manage', description: 'Manage translations ( /api/translate, editor+)' },
  { code: 'audit.read', description: 'Read audit history (prepared; no live audit API yet)' },
] as const;

const ROLE_PERMISSIONS: Record<'owner' | 'admin' | 'editor' | 'employee', readonly string[]> = {
  owner: PERMISSIONS.map((item) => item.code),
  admin: ['cms.read', 'cms.write', 'cms.delete', 'media.upload', 'translations.manage', 'audit.read'],
  editor: ['cms.read', 'cms.write', 'media.upload', 'translations.manage'],
  employee: ['cms.read'],
};

const NAV_KEYS: (keyof NavLabels)[] = [
  'home',
  'about',
  'services',
  'projects',
  'materials',
  'howWeWork',
  'testimonials',
  'blog',
  'faq',
  'contact',
  'callUs',
  'whatsapp',
  'viewWork',
  'learnMore',
  'viewAll',
  'viewProject',
  'readMore',
  'backHome',
  'all',
];

const UI_KEYS: (keyof SiteContent['ui'][AppLocale])[] = [
  'footerCta',
  'footerTagline',
  'servicesTitle',
  'navTitle',
  'contactTitle',
  'languagesTitle',
  'madeBy',
  'allRightsReserved',
  'notFoundTitle',
  'notFoundBody',
  'relatedProjects',
  'demoNotice',
  'privacy',
  'cookies',
  'terms',
  'cookieNotice',
  'cookieAccept',
  'legalTitle',
];

function mediaId(kind: string, key: string): string {
  return `local-${kind}-${key}`.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

async function upsertLocalMedia(
  prisma: PrismaClient,
  id: string,
  url: string,
  alt: LocalizedString,
) {
  const filename = url.split('/').filter(Boolean).pop() || null;
  await prisma.media.upsert({
    where: { id },
    create: {
      id,
      provider: 'LOCAL',
      objectKey: url.replace(/^\//, ''),
      url,
      filename,
      mimeType: url.endsWith('.png') ? 'image/png' : 'image/jpeg',
      alt,
    },
    update: {
      provider: 'LOCAL',
      objectKey: url.replace(/^\//, ''),
      url,
      filename,
      mimeType: url.endsWith('.png') ? 'image/png' : 'image/jpeg',
      alt,
    },
  });
  return id;
}

async function seedRolesAndPermissions(prisma: PrismaClient) {
  const permissionIds = new Map<string, string>();
  for (const permission of PERMISSIONS) {
    const row = await prisma.permission.upsert({
      where: { code: permission.code },
      create: { code: permission.code, description: permission.description },
      update: { description: permission.description },
    });
    permissionIds.set(permission.code, row.id);
  }

  const roleIds = new Map<string, string>();
  for (const name of ['owner', 'admin', 'editor', 'employee'] as const) {
    const row = await prisma.role.upsert({
      where: { name },
      create: { name, description: `Dashboard role: ${name}` },
      update: { description: `Dashboard role: ${name}` },
    });
    roleIds.set(name, row.id);
  }

  for (const [roleName, codes] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleIds.get(roleName);
    if (!roleId) continue;
    for (const code of codes) {
      const permissionId = permissionIds.get(code);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        create: { roleId, permissionId },
        update: {},
      });
    }
  }
}

async function seedUiCopy(prisma: PrismaClient) {
  const rows: { locale: AppLocale; namespace: string; key: string; value: string }[] = [];
  for (const locale of LOCALES) {
    for (const key of NAV_KEYS) {
      rows.push({ locale, namespace: 'nav', key, value: seedContent.nav[locale][key] });
    }
    for (const key of UI_KEYS) {
      rows.push({ locale, namespace: 'ui', key, value: seedContent.ui[locale][key] });
    }
    for (const [key, value] of Object.entries(seedContent.categoryLabels[locale])) {
      rows.push({ locale, namespace: 'category', key, value });
    }
  }
  for (const row of rows) {
    await prisma.uiCopy.upsert({
      where: {
        locale_namespace_key: { locale: row.locale, namespace: row.namespace, key: row.key },
      },
      create: row,
      update: { value: row.value },
    });
  }
}

async function seedSettingsAndPages(prisma: PrismaClient) {
  const { settings, home, about, howWeWork, contactPage, legal } = seedContent;
  const logoId = await upsertLocalMedia(prisma, mediaId('settings', 'logo'), settings.logoUrl, settings.brandName
    ? { he: settings.brandName, ar: settings.brandName, en: settings.brandName, ru: settings.brandName }
    : { he: '', ar: '', en: '', ru: '' });
  const logoDarkId = await upsertLocalMedia(
    prisma,
    mediaId('settings', 'logo-dark'),
    settings.logoDarkUrl,
    { he: settings.brandName, ar: settings.brandName, en: settings.brandName, ru: settings.brandName },
  );
  const qrId = await upsertLocalMedia(
    prisma,
    mediaId('settings', 'qr'),
    settings.qrUrl,
    { he: 'QR', ar: 'QR', en: 'QR', ru: 'QR' },
  );

  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      brandName: settings.brandName,
      tagline: settings.tagline,
      pillars: settings.pillars,
      phoneDisplay: settings.phoneDisplay,
      phoneTel: settings.phoneTel,
      whatsappE164: settings.whatsappE164,
      email: settings.email,
      address: settings.address,
      workingHours: settings.workingHours,
      whatsappMessage: settings.whatsappMessage,
      seoTitle: settings.seoTitle,
      seoDescription: settings.seoDescription,
      logoMediaId: logoId,
      logoDarkMediaId: logoDarkId,
      qrMediaId: qrId,
    },
    update: {
      brandName: settings.brandName,
      tagline: settings.tagline,
      pillars: settings.pillars,
      phoneDisplay: settings.phoneDisplay,
      phoneTel: settings.phoneTel,
      whatsappE164: settings.whatsappE164,
      email: settings.email,
      address: settings.address,
      workingHours: settings.workingHours,
      whatsappMessage: settings.whatsappMessage,
      seoTitle: settings.seoTitle,
      seoDescription: settings.seoDescription,
      logoMediaId: logoId,
      logoDarkMediaId: logoDarkId,
      qrMediaId: qrId,
    },
  });

  await prisma.homePage.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      heroTitle: home.heroTitle,
      heroSubtitle: home.heroSubtitle,
      introEyebrow: home.introEyebrow,
      introTitle: home.introTitle,
      introDescription: home.introDescription,
      whyEyebrow: home.whyEyebrow,
      whyTitle: home.whyTitle,
      whySubtitle: home.whySubtitle,
      processEyebrow: home.processEyebrow,
      processTitle: home.processTitle,
      processSubtitle: home.processSubtitle,
      servicesEyebrow: home.servicesEyebrow,
      servicesTitle: home.servicesTitle,
      servicesSubtitle: home.servicesSubtitle,
      projectsEyebrow: home.projectsEyebrow,
      projectsTitle: home.projectsTitle,
      projectsSubtitle: home.projectsSubtitle,
      materialsEyebrow: home.materialsEyebrow,
      materialsTitle: home.materialsTitle,
      materialsSubtitle: home.materialsSubtitle,
      testimonialsEyebrow: home.testimonialsEyebrow,
      testimonialsTitle: home.testimonialsTitle,
      testimonialsSubtitle: home.testimonialsSubtitle,
      ctaTitle: home.ctaTitle,
      ctaSubtitle: home.ctaSubtitle,
    },
    update: {
      heroTitle: home.heroTitle,
      heroSubtitle: home.heroSubtitle,
      introEyebrow: home.introEyebrow,
      introTitle: home.introTitle,
      introDescription: home.introDescription,
      whyEyebrow: home.whyEyebrow,
      whyTitle: home.whyTitle,
      whySubtitle: home.whySubtitle,
      processEyebrow: home.processEyebrow,
      processTitle: home.processTitle,
      processSubtitle: home.processSubtitle,
      servicesEyebrow: home.servicesEyebrow,
      servicesTitle: home.servicesTitle,
      servicesSubtitle: home.servicesSubtitle,
      projectsEyebrow: home.projectsEyebrow,
      projectsTitle: home.projectsTitle,
      projectsSubtitle: home.projectsSubtitle,
      materialsEyebrow: home.materialsEyebrow,
      materialsTitle: home.materialsTitle,
      materialsSubtitle: home.materialsSubtitle,
      testimonialsEyebrow: home.testimonialsEyebrow,
      testimonialsTitle: home.testimonialsTitle,
      testimonialsSubtitle: home.testimonialsSubtitle,
      ctaTitle: home.ctaTitle,
      ctaSubtitle: home.ctaSubtitle,
    },
  });

  await prisma.homeIntroFeature.deleteMany({ where: { homePageId: 'default' } });
  await prisma.homeWhyItem.deleteMany({ where: { homePageId: 'default' } });
  await prisma.homeHeroMedia.deleteMany({ where: { homePageId: 'default' } });

  await prisma.homeIntroFeature.createMany({
    data: home.introFeatures.map((item, index) => ({
      homePageId: 'default',
      sortOrder: index,
      title: item.title,
      description: item.desc,
    })),
  });
  await prisma.homeWhyItem.createMany({
    data: home.whyItems.map((item, index) => ({
      homePageId: 'default',
      sortOrder: index,
      title: item.title,
      description: item.desc,
    })),
  });
  for (const [index, url] of home.heroImages.entries()) {
    const id = mediaId('hero', String(index));
    await upsertLocalMedia(prisma, id, url, { he: '', ar: '', en: '', ru: '' });
    await prisma.homeHeroMedia.create({
      data: { homePageId: 'default', mediaId: id, sortOrder: index },
    });
  }

  const aboutImageId = about.image
    ? await upsertLocalMedia(prisma, mediaId('page', 'about'), about.image, about.title)
    : null;
  await prisma.aboutPage.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      eyebrow: about.eyebrow,
      title: about.title,
      subtitle: about.subtitle,
      body: about.body,
      valuesTitle: about.valuesTitle,
      imageMediaId: aboutImageId,
    },
    update: {
      eyebrow: about.eyebrow,
      title: about.title,
      subtitle: about.subtitle,
      body: about.body,
      valuesTitle: about.valuesTitle,
      imageMediaId: aboutImageId,
    },
  });
  await prisma.aboutValue.deleteMany({ where: { aboutPageId: 'default' } });
  await prisma.aboutValue.createMany({
    data: about.values.map((item, index) => ({
      aboutPageId: 'default',
      sortOrder: index,
      title: item.title,
      description: item.desc,
    })),
  });

  const howImageId = howWeWork.image
    ? await upsertLocalMedia(prisma, mediaId('page', 'how-we-work'), howWeWork.image, howWeWork.title)
    : null;
  await prisma.howWeWorkPage.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      eyebrow: howWeWork.eyebrow,
      title: howWeWork.title,
      subtitle: howWeWork.subtitle,
      imageMediaId: howImageId,
    },
    update: {
      eyebrow: howWeWork.eyebrow,
      title: howWeWork.title,
      subtitle: howWeWork.subtitle,
      imageMediaId: howImageId,
    },
  });
  await prisma.howWeWorkStep.deleteMany({ where: { howWeWorkPageId: 'default' } });
  await prisma.howWeWorkStep.createMany({
    data: howWeWork.steps.map((step, index) => ({
      howWeWorkPageId: 'default',
      number: step.number,
      sortOrder: index,
      title: step.title,
      description: step.description,
    })),
  });

  const contactImageId = contactPage.image
    ? await upsertLocalMedia(prisma, mediaId('page', 'contact'), contactPage.image, contactPage.title)
    : null;
  await prisma.contactPage.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      eyebrow: contactPage.eyebrow,
      title: contactPage.title,
      subtitle: contactPage.subtitle,
      imageMediaId: contactImageId,
    },
    update: {
      eyebrow: contactPage.eyebrow,
      title: contactPage.title,
      subtitle: contactPage.subtitle,
      imageMediaId: contactImageId,
    },
  });

  for (const slug of ['privacy', 'cookies', 'terms'] as const) {
    const doc = legal[slug];
    const saved = await prisma.legalDocument.upsert({
      where: { slug },
      create: { slug, title: doc.title, updated: doc.updated, intro: doc.intro },
      update: { title: doc.title, updated: doc.updated, intro: doc.intro },
    });
    await prisma.legalSection.deleteMany({ where: { documentId: saved.id } });
    await prisma.legalSection.createMany({
      data: doc.sections.map((section, index) => ({
        documentId: saved.id,
        sortOrder: index,
        heading: section.heading,
        body: section.body,
      })),
    });
  }
}

async function seedServices(prisma: PrismaClient) {
  const bySlug = new Map(seedContent.services.map((service) => [service.slug, service]));
  for (const [index, slug] of SERVICE_SLUGS.entries()) {
    const source = bySlug.get(slug);
    if (!source) {
      throw new Error(`Website seed is missing official service: ${slug}`);
    }
    const prismaSlug = WEBSITE_TO_PRISMA_SLUG[slug];
    const imageId = source.image
      ? await upsertLocalMedia(prisma, mediaId('service', slug), source.image, source.title)
      : null;
    const service = await prisma.service.upsert({
      where: { slug: prismaSlug },
      create: {
        slug: prismaSlug,
        title: source.title,
        description: source.description,
        published: source.visible,
        sortOrder: index,
      },
      update: {
        title: source.title,
        description: source.description,
        published: source.visible,
        sortOrder: index,
      },
    });
    await prisma.serviceFeature.deleteMany({ where: { serviceId: service.id } });
    await prisma.serviceFeature.createMany({
      data: source.features.map((text, featureIndex) => ({
        serviceId: service.id,
        sortOrder: featureIndex,
        text,
      })),
    });
    await prisma.serviceMedia.deleteMany({ where: { serviceId: service.id } });
    if (imageId) {
      await prisma.serviceMedia.create({
        data: { serviceId: service.id, mediaId: imageId, sortOrder: 0 },
      });
    }
  }
}

async function assertNoDoorService(prisma: PrismaClient) {
  const slugs = await prisma.service.findMany({ select: { slug: true } });
  const websiteSlugs = slugs.map((row) => {
    const match = Object.entries(WEBSITE_TO_PRISMA_SLUG).find(([, value]) => value === row.slug);
    return match?.[0] ?? String(row.slug);
  });
  if (websiteSlugs.some((slug) => /door/i.test(slug))) {
    throw new Error('Seed produced a door service — aborting');
  }
  if (websiteSlugs.length !== SERVICE_SLUGS.length) {
    throw new Error(`Expected ${SERVICE_SLUGS.length} services, found ${websiteSlugs.length}`);
  }
}

async function seedCatalog(prisma: PrismaClient) {
  for (const [index, material] of seedContent.materials.entries()) {
    const imageId = material.image
      ? await upsertLocalMedia(prisma, mediaId('material', material.slug), material.image, material.name)
      : null;
    const row = await prisma.material.upsert({
      where: { slug: material.slug },
      create: {
        slug: material.slug,
        name: material.name,
        description: material.description,
        characteristics: material.characteristics,
        applications: material.applications,
        finishes: material.finishes,
        published: material.visible,
        sortOrder: index,
      },
      update: {
        name: material.name,
        description: material.description,
        characteristics: material.characteristics,
        applications: material.applications,
        finishes: material.finishes,
        published: material.visible,
        sortOrder: index,
      },
    });
    await prisma.materialMedia.deleteMany({ where: { materialId: row.id } });
    if (imageId) {
      await prisma.materialMedia.create({
        data: { materialId: row.id, mediaId: imageId, sortOrder: 0 },
      });
    }
  }

  for (const [index, project] of seedContent.projects.entries()) {
    const row = await prisma.project.upsert({
      where: { slug: project.slug },
      create: {
        slug: project.slug,
        title: project.title,
        description: project.description,
        category: project.category,
        woodTypes: project.materials,
        published: project.visible,
        sortOrder: index,
      },
      update: {
        title: project.title,
        description: project.description,
        category: project.category,
        woodTypes: project.materials,
        published: project.visible,
        sortOrder: index,
      },
    });
    await prisma.projectMedia.deleteMany({ where: { projectId: row.id } });
    for (const [imageIndex, url] of project.images.entries()) {
      const imageId = await upsertLocalMedia(
        prisma,
        mediaId('project', `${project.slug}-${imageIndex}`),
        url,
        project.title,
      );
      await prisma.projectMedia.create({
        data: { projectId: row.id, mediaId: imageId, sortOrder: imageIndex },
      });
    }
  }

  for (const [index, item] of seedContent.testimonials.entries()) {
    await prisma.testimonial.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        name: item.name,
        rating: item.rating,
        review: item.review,
        project: item.project,
        published: item.visible,
        sortOrder: index,
      },
      update: {
        name: item.name,
        rating: item.rating,
        review: item.review,
        project: item.project,
        published: item.visible,
        sortOrder: index,
      },
    });
  }

  for (const post of seedContent.blogPosts) {
    const imageId = post.image
      ? await upsertLocalMedia(prisma, mediaId('blog', post.slug), post.image, post.title)
      : null;
    const publishedAt = post.date ? new Date(`${post.date}T00:00:00.000Z`) : null;
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      create: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        author: post.author,
        published: post.visible,
        publishedAt,
        featuredMediaId: imageId,
      },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        author: post.author,
        published: post.visible,
        publishedAt,
        featuredMediaId: imageId,
      },
    });
  }

  for (const [index, item] of seedContent.faq.entries()) {
    await prisma.faqItem.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        category: item.category,
        question: item.question,
        answer: item.answer,
        published: item.visible,
        sortOrder: index,
      },
      update: {
        category: item.category,
        question: item.question,
        answer: item.answer,
        published: item.visible,
        sortOrder: index,
      },
    });
  }
}

async function main() {
  const url = loadLocalDatabaseUrl();
  const { host, database } = describeLocalDatabase(url);
  process.stdout.write(`Seeding LOCAL PostgreSQL host=${host} database=${database}\n`);

  const prisma = new PrismaClient();
  try {
    await seedRolesAndPermissions(prisma);
    await seedUiCopy(prisma);
    await seedSettingsAndPages(prisma);
    await seedServices(prisma);
    await seedCatalog(prisma);
    await assertNoDoorService(prisma);
    process.stdout.write(
      `Seed complete: roles=${Object.keys(ROLE_PERMISSIONS).join(',')} permissions=${PERMISSIONS.map((item) => item.code).join(',')} services=${SERVICE_SLUGS.join(',')} projects=${seedContent.projects.length} materials=${seedContent.materials.length}\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Seed failed';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
