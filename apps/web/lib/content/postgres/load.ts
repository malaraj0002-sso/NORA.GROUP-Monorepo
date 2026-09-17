import type { PrismaClient } from '@prisma/client';
import type { PostgresSitePayload } from './map';

export async function loadPostgresSitePayload(db: PrismaClient): Promise<PostgresSitePayload> {
  const [
    settings,
    home,
    about,
    howWeWork,
    contact,
    services,
    projects,
    materials,
    testimonials,
    blogPosts,
    faq,
    uiCopy,
    legal,
  ] = await Promise.all([
    db.siteSettings.findUnique({
      where: { id: 'default' },
      include: { logo: true, logoDark: true, qr: true },
    }),
    db.homePage.findUnique({
      where: { id: 'default' },
      include: {
        introFeatures: true,
        whyItems: true,
        heroMedia: { include: { media: true } },
      },
    }),
    db.aboutPage.findUnique({
      where: { id: 'default' },
      include: { image: true, values: true },
    }),
    db.howWeWorkPage.findUnique({
      where: { id: 'default' },
      include: { image: true, steps: true },
    }),
    db.contactPage.findUnique({
      where: { id: 'default' },
      include: { image: true },
    }),
    db.service.findMany({
      include: { features: true, media: { include: { media: true } } },
      orderBy: { sortOrder: 'asc' },
    }).then((rows) => {
      const leaked = rows.filter((row) => /door/i.test(String(row.slug)));
      if (leaked.length) {
        throw new Error(`PostgreSQL contains a forbidden door service: ${leaked.map((row) => row.slug).join(', ')}`);
      }
      return rows;
    }),
    db.project.findMany({
      include: { media: { include: { media: true } } },
      orderBy: { sortOrder: 'asc' },
    }),
    db.material.findMany({
      include: { media: { include: { media: true } } },
      orderBy: { sortOrder: 'asc' },
    }),
    db.testimonial.findMany({ orderBy: { sortOrder: 'asc' } }),
    db.blogPost.findMany({
      include: { featuredMedia: true },
      orderBy: { publishedAt: 'desc' },
    }),
    db.faqItem.findMany({ orderBy: { sortOrder: 'asc' } }),
    db.uiCopy.findMany(),
    db.legalDocument.findMany({ include: { sections: true } }),
  ]);

  return {
    settings,
    home,
    about,
    howWeWork,
    contact,
    services,
    projects,
    materials,
    testimonials,
    blogPosts,
    faq,
    uiCopy,
    legal,
  };
}
