import type { Session } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { asLocale, firstLocaleValue, mergeLocale } from '@/lib/db/locale';
import {
  isForbiddenDoorService,
  isOfficialServiceSlug,
  WEBSITE_TO_PRISMA_SLUG,
} from '@/lib/db/services';
import { writeAuditLog } from '@/lib/server/audit';
import type { MutationInput } from '@/lib/server/content/schema';
import { rejectDoorMutation } from '@/lib/server/content/schema';
import { resolveMediaIds } from '@/lib/server/content/postgres/media';
import { revalidateWebsite } from '@/lib/server/revalidate-website';

type Tx = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;

export type ApplyMutationContext = {
  session: Session;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type ApplyMutationResult =
  | { ok: true; id?: string; revalidated: boolean }
  | { ok: false; error: string; status?: number };

function slugify(raw: string, fallback: string): string {
  const ascii = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return ascii.length >= 2 ? ascii : fallback;
}

async function audit(
  ctx: ApplyMutationContext,
  action: string,
  entity: string,
  entityId?: string,
): Promise<void> {
  await writeAuditLog({
    session: ctx.session,
    action,
    entity,
    entityId,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });
}

export async function applyMutation(
  input: MutationInput,
  ctx: ApplyMutationContext,
): Promise<ApplyMutationResult> {
  const door = rejectDoorMutation(input);
  if (door) return { ok: false, error: door, status: 400 };

  try {
    if (input.op === 'delete') {
      if (!('id' in input) || !input.id) return { ok: false, error: 'Invalid delete', status: 400 };
      const result = await deleteResource(input.resource, input.id);
      if (!result.ok) return result;
      await audit(ctx, 'delete', input.resource, input.id);
      return { ok: true, id: input.id, revalidated: await revalidateWebsite() };
    }

    if (input.op === 'create') {
      const created = await createResource(input);
      if (!created.ok) return created;
      await audit(ctx, 'create', input.resource, created.id);
      return { ok: true, id: created.id, revalidated: await revalidateWebsite() };
    }

    if (input.op === 'patch') {
      const patched = await patchResource(input);
      if (!patched.ok) return patched;
      await audit(ctx, 'update', input.resource, patched.id);
      return { ok: true, id: patched.id, revalidated: await revalidateWebsite() };
    }

    return { ok: false, error: 'Unsupported operation', status: 400 };
  } catch (error) {
    console.error('[cms] postgres mutation failed');
    return { ok: false, error: 'Save failed', status: 500 };
  }
}

async function deleteResource(
  resource: MutationInput['resource'],
  id: string,
): Promise<ApplyMutationResult> {
  if (resource === 'service') {
    const row = await prisma.service.findUnique({ where: { id } });
    if (!row) return { ok: false, error: 'Document not found', status: 404 };
    if (isForbiddenDoorService({ id, slug: row.slug, title: asLocale(row.title) })) {
      return { ok: false, error: 'Door services are not permitted', status: 400 };
    }
    await prisma.$transaction(async (tx: Tx) => {
      await tx.serviceFeature.deleteMany({ where: { serviceId: id } });
      await tx.serviceMedia.deleteMany({ where: { serviceId: id } });
      await tx.service.delete({ where: { id } });
    });
    return { ok: true, id, revalidated: false };
  }
  if (resource === 'project') {
    const row = await prisma.project.findUnique({ where: { id } });
    if (!row) return { ok: false, error: 'Document not found', status: 404 };
    await prisma.$transaction(async (tx: Tx) => {
      await tx.projectMedia.deleteMany({ where: { projectId: id } });
      await tx.project.delete({ where: { id } });
    });
    return { ok: true, id, revalidated: false };
  }
  if (resource === 'material') {
    const row = await prisma.material.findUnique({ where: { id } });
    if (!row) return { ok: false, error: 'Document not found', status: 404 };
    await prisma.$transaction(async (tx: Tx) => {
      await tx.materialMedia.deleteMany({ where: { materialId: id } });
      await tx.material.delete({ where: { id } });
    });
    return { ok: true, id, revalidated: false };
  }
  if (resource === 'testimonial') {
    const row = await prisma.testimonial.findUnique({ where: { id } });
    if (!row) return { ok: false, error: 'Document not found', status: 404 };
    await prisma.testimonial.delete({ where: { id } });
    return { ok: true, id, revalidated: false };
  }
  if (resource === 'faq') {
    const row = await prisma.faqItem.findUnique({ where: { id } });
    if (!row) return { ok: false, error: 'Document not found', status: 404 };
    await prisma.faqItem.delete({ where: { id } });
    return { ok: true, id, revalidated: false };
  }
  if (resource === 'blog') {
    const row = await prisma.blogPost.findUnique({ where: { id } });
    if (!row) return { ok: false, error: 'Document not found', status: 404 };
    await prisma.blogPost.delete({ where: { id } });
    return { ok: true, id, revalidated: false };
  }
  return { ok: false, error: 'Delete is not supported for this resource', status: 400 };
}

async function createResource(input: MutationInput): Promise<ApplyMutationResult> {
  if (input.resource === 'service') {
    const slug = input.data?.slug;
    const titleValue = firstLocaleValue(input.data?.title);
    if (!slug || !isOfficialServiceSlug(slug) || !titleValue) {
      return { ok: false, error: 'Service requires an allowed slug and a title', status: 400 };
    }
    if (isForbiddenDoorService({ slug, title: input.data?.title })) {
      return { ok: false, error: 'Door services are not permitted', status: 400 };
    }
    const prismaSlug = WEBSITE_TO_PRISMA_SLUG[slug];
    const existing = await prisma.service.findUnique({ where: { slug: prismaSlug } });
    if (existing) return { ok: false, error: 'Service slug already exists', status: 409 };
    const mediaIds = input.data?.assetIds?.length ? await resolveMediaIds(input.data.assetIds) : [];
    const created = await prisma.$transaction(async (tx: Tx) => {
      const service = await tx.service.create({
        data: {
          slug: prismaSlug,
          title: mergeLocale(undefined, input.data?.title),
          description: mergeLocale(undefined, input.data?.description),
          published: input.data?.published ?? true,
          sortOrder: 0,
        },
      });
      if (input.data?.features?.length) {
        await tx.serviceFeature.createMany({
          data: input.data.features.map((text, index) => ({
            serviceId: service.id,
            sortOrder: index,
            text: mergeLocale(undefined, text),
          })),
        });
      }
      if (mediaIds[0]) {
        await tx.serviceMedia.create({ data: { serviceId: service.id, mediaId: mediaIds[0], sortOrder: 0 } });
      }
      return service;
    });
    return { ok: true, id: created.id, revalidated: false };
  }

  if (input.resource === 'project') {
    const titleValue = firstLocaleValue(input.data?.title);
    if (!titleValue) return { ok: false, error: 'Project requires a title', status: 400 };
    const slug =
      input.data?.slug ||
      slugify(input.data?.title?.en || input.data?.title?.he || input.data?.title?.ar || '', `project-${Date.now()}`);
    const mediaIds = input.data?.assetIds?.length ? await resolveMediaIds(input.data.assetIds) : [];
    const created = await prisma.$transaction(async (tx: Tx) => {
      const project = await tx.project.create({
        data: {
          slug,
          title: mergeLocale(undefined, input.data?.title),
          description: mergeLocale(undefined, input.data?.description),
          category: input.data?.category || 'furniture',
          woodTypes: input.data?.woodTypes || [],
          published: input.data?.published ?? true,
        },
      });
      if (mediaIds.length) {
        await tx.projectMedia.createMany({
          data: mediaIds.map((mediaId, index) => ({ projectId: project.id, mediaId, sortOrder: index })),
        });
      }
      return project;
    });
    return { ok: true, id: created.id, revalidated: false };
  }

  if (input.resource === 'material') {
    const namePatch = {
      he: input.data?.nameHe,
      ar: input.data?.nameAr,
      en: input.data?.nameEn,
    };
    const nameValue = firstLocaleValue(namePatch);
    if (!nameValue) return { ok: false, error: 'Material requires a name', status: 400 };
    const slug =
      input.data?.slug || slugify(input.data?.nameEn || input.data?.nameHe || input.data?.nameAr || '', `material-${Date.now()}`);
    const mediaIds = input.data?.assetIds?.length ? await resolveMediaIds(input.data.assetIds) : [];
    const created = await prisma.$transaction(async (tx: Tx) => {
      const material = await tx.material.create({
        data: {
          slug,
          name: mergeLocale(undefined, namePatch),
          description: mergeLocale(undefined, input.data?.description),
          characteristics: mergeLocale(undefined, input.data?.characteristics),
          applications: mergeLocale(undefined, input.data?.applications),
          finishes: mergeLocale(undefined, input.data?.finishes),
          published: input.data?.published ?? true,
        },
      });
      if (mediaIds[0]) {
        await tx.materialMedia.create({ data: { materialId: material.id, mediaId: mediaIds[0], sortOrder: 0 } });
      }
      return material;
    });
    return { ok: true, id: created.id, revalidated: false };
  }

  if (input.resource === 'testimonial') {
    const text = firstLocaleValue(input.data?.text);
    const name = input.data?.clientName?.trim();
    if (!text || !name) return { ok: false, error: 'Testimonial requires name and a review', status: 400 };
    const created = await prisma.testimonial.create({
      data: {
        name,
        rating: input.data?.rating ?? 5,
        review: mergeLocale(undefined, input.data?.text),
        project: mergeLocale(undefined, input.data?.project),
        published: input.data?.published ?? true,
      },
    });
    return { ok: true, id: created.id, revalidated: false };
  }

  if (input.resource === 'faq') {
    const question = firstLocaleValue(input.data?.question);
    if (!question) return { ok: false, error: 'FAQ requires a question', status: 400 };
    const created = await prisma.faqItem.create({
      data: {
        question: mergeLocale(undefined, input.data?.question),
        answer: mergeLocale(undefined, input.data?.answer),
        category: input.data?.category || '',
        published: input.data?.published ?? true,
        sortOrder: input.data?.order ?? 0,
      },
    });
    return { ok: true, id: created.id, revalidated: false };
  }

  if (input.resource === 'blog') {
    const titleValue = firstLocaleValue(input.data?.title);
    if (!titleValue) return { ok: false, error: 'Blog post requires a title', status: 400 };
    const slug =
      input.data?.slug ||
      slugify(input.data?.title?.en || input.data?.title?.he || input.data?.title?.ar || '', `blog-${Date.now()}`);
    const mediaIds = input.data?.assetIds?.length ? await resolveMediaIds(input.data.assetIds) : [];
    const created = await prisma.blogPost.create({
      data: {
        slug,
        title: mergeLocale(undefined, input.data?.title),
        excerpt: mergeLocale(undefined, input.data?.excerpt),
        content: mergeLocale(undefined, input.data?.content),
        author: input.data?.author || 'Nora Group',
        publishedAt: input.data?.publishedAt ? new Date(input.data.publishedAt) : null,
        published: input.data?.published ?? true,
        category: input.data?.category || '',
        featuredMediaId: mediaIds[0] || null,
      },
    });
    return { ok: true, id: created.id, revalidated: false };
  }

  return { ok: false, error: 'Create is not supported for this resource', status: 400 };
}

async function patchResource(input: MutationInput): Promise<ApplyMutationResult> {
  if (input.resource === 'site') {
    const current = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    if (!current) return { ok: false, error: 'Site settings not found', status: 404 };
    const mediaIds = input.data.assetIds?.length ? await resolveMediaIds(input.data.assetIds) : [];
    await prisma.siteSettings.update({
      where: { id: 'default' },
      data: {
        ...(typeof input.data.siteName === 'string' ? { brandName: input.data.siteName } : {}),
        ...(input.data.tagline ? { tagline: mergeLocale(current.tagline, input.data.tagline) } : {}),
        ...(typeof input.data.contactEmail === 'string' ? { email: input.data.contactEmail } : {}),
        ...(input.data.contactAddress ? { address: mergeLocale(current.address, input.data.contactAddress) } : {}),
        ...(typeof input.data.contactPhone === 'string' ? { phoneDisplay: input.data.contactPhone } : {}),
        ...(typeof input.data.phoneTel === 'string' ? { phoneTel: input.data.phoneTel } : {}),
        ...(typeof input.data.whatsappE164 === 'string' ? { whatsappE164: input.data.whatsappE164 } : {}),
        ...(mediaIds[0] ? { logoMediaId: mediaIds[0] } : {}),
      },
    });
    return { ok: true, id: 'default', revalidated: false };
  }

  if (input.resource === 'homepage') {
    const current = await prisma.homePage.findUnique({ where: { id: 'default' } });
    if (!current) return { ok: false, error: 'Home page not found', status: 404 };
    const data: {
      heroTitle?: ReturnType<typeof mergeLocale>;
      heroSubtitle?: ReturnType<typeof mergeLocale>;
      introTitle?: ReturnType<typeof mergeLocale>;
      introDescription?: ReturnType<typeof mergeLocale>;
      ctaTitle?: ReturnType<typeof mergeLocale>;
      ctaSubtitle?: ReturnType<typeof mergeLocale>;
    } = {};
    if (input.data.heroTitle) data.heroTitle = mergeLocale(current.heroTitle, input.data.heroTitle);
    if (input.data.heroSubtitle) data.heroSubtitle = mergeLocale(current.heroSubtitle, input.data.heroSubtitle);
    if (input.data.introTitle) data.introTitle = mergeLocale(current.introTitle, input.data.introTitle);
    if (input.data.introDescription) {
      data.introDescription = mergeLocale(current.introDescription, input.data.introDescription);
    }
    if (input.data.ctaTitle) data.ctaTitle = mergeLocale(current.ctaTitle, input.data.ctaTitle);
    if (input.data.ctaSubtitle) data.ctaSubtitle = mergeLocale(current.ctaSubtitle, input.data.ctaSubtitle);
    if (!Object.keys(data).length) return { ok: false, error: 'Nothing to patch', status: 400 };
    await prisma.homePage.update({ where: { id: 'default' }, data });
    return { ok: true, id: 'default', revalidated: false };
  }

  if (input.resource === 'hero') {
    const home = await prisma.homePage.findUnique({ where: { id: 'default' } });
    if (!home) return { ok: false, error: 'Home page not found', status: 404 };
    const mediaIds = await resolveMediaIds(input.data.assetIds);
    await prisma.$transaction(async (tx: Tx) => {
      await tx.homeHeroMedia.deleteMany({ where: { homePageId: 'default' } });
      if (mediaIds.length) {
        await tx.homeHeroMedia.createMany({
          data: mediaIds.map((mediaId, index) => ({ homePageId: 'default', mediaId, sortOrder: index })),
        });
      }
    });
    return { ok: true, id: 'default', revalidated: false };
  }

  if (input.resource === 'about') {
    const current = await prisma.aboutPage.findUnique({ where: { id: 'default' } });
    if (!current) return { ok: false, error: 'About page not found', status: 404 };
    await prisma.aboutPage.update({
      where: { id: 'default' },
      data: { body: mergeLocale(current.body, input.data.story) },
    });
    return { ok: true, id: 'default', revalidated: false };
  }

  if (input.resource === 'howWeWork') {
    await prisma.$transaction(async (tx: Tx) => {
      for (const step of input.data.steps) {
        const current = await tx.howWeWorkStep.findUnique({ where: { id: step.id } });
        if (!current) continue;
        await tx.howWeWorkStep.update({
          where: { id: step.id },
          data: {
            ...(typeof step.number === 'string' ? { number: step.number } : {}),
            ...(step.title ? { title: mergeLocale(current.title, step.title) } : {}),
            ...(step.description ? { description: mergeLocale(current.description, step.description) } : {}),
          },
        });
      }
    });
    return { ok: true, id: 'default', revalidated: false };
  }

  if (input.resource === 'contact') {
    const current = await prisma.contactPage.findUnique({ where: { id: 'default' } });
    if (!current) return { ok: false, error: 'Contact page not found', status: 404 };
    await prisma.contactPage.update({
      where: { id: 'default' },
      data: {
        ...(input.data.eyebrow ? { eyebrow: mergeLocale(current.eyebrow, input.data.eyebrow) } : {}),
        ...(input.data.title ? { title: mergeLocale(current.title, input.data.title) } : {}),
        ...(input.data.subtitle ? { subtitle: mergeLocale(current.subtitle, input.data.subtitle) } : {}),
      },
    });
    return { ok: true, id: 'default', revalidated: false };
  }

  if (input.resource === 'uiCopy') {
    await prisma.uiCopy.upsert({
      where: {
        locale_namespace_key: {
          locale: input.data.locale,
          namespace: input.data.namespace,
          key: input.data.key,
        },
      },
      create: {
        locale: input.data.locale,
        namespace: input.data.namespace,
        key: input.data.key,
        value: input.data.value,
      },
      update: { value: input.data.value },
    });
    return { ok: true, id: `${input.data.locale}:${input.data.namespace}:${input.data.key}`, revalidated: false };
  }

  if (input.resource === 'legal') {
    const current = await prisma.legalDocument.findUnique({
      where: { slug: input.data.slug },
      include: { sections: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!current) return { ok: false, error: 'Legal document not found', status: 404 };
    await prisma.$transaction(async (tx: Tx) => {
      await tx.legalDocument.update({
        where: { id: current.id },
        data: {
          ...(input.data.title ? { title: mergeLocale(current.title, input.data.title) } : {}),
          ...(input.data.updated ? { updated: mergeLocale(current.updated, input.data.updated) } : {}),
          ...(input.data.intro ? { intro: mergeLocale(current.intro, input.data.intro) } : {}),
        },
      });
      if (input.data.sections) {
        await tx.legalSection.deleteMany({ where: { documentId: current.id } });
        await tx.legalSection.createMany({
          data: input.data.sections.map((section, index) => ({
            documentId: current.id,
            sortOrder: index,
            heading: mergeLocale(undefined, section.heading),
            body: mergeLocale(undefined, section.body),
          })),
        });
      }
    });
    return { ok: true, id: current.id, revalidated: false };
  }

  if (!('id' in input) || !input.id) return { ok: false, error: 'Missing id', status: 400 };

  if (input.resource === 'service') {
    const row = await prisma.service.findUnique({
      where: { id: input.id },
      include: { features: true },
    });
    if (!row) return { ok: false, error: 'Document not found', status: 404 };
    if (isForbiddenDoorService({ id: row.id, slug: row.slug, title: mergeLocale(row.title, input.data?.title) })) {
      return { ok: false, error: 'Door services are not permitted', status: 400 };
    }
    if (input.data?.slug && !isOfficialServiceSlug(input.data.slug)) {
      return { ok: false, error: 'Invalid service slug', status: 400 };
    }
    const mediaIds = input.data?.assetIds?.length ? await resolveMediaIds(input.data.assetIds) : [];
    await prisma.$transaction(async (tx: Tx) => {
      await tx.service.update({
        where: { id: row.id },
        data: {
          ...(input.data?.title ? { title: mergeLocale(row.title, input.data.title) } : {}),
          ...(input.data?.description ? { description: mergeLocale(row.description, input.data.description) } : {}),
          ...(typeof input.data?.published === 'boolean' ? { published: input.data.published } : {}),
          ...(input.data?.slug ? { slug: WEBSITE_TO_PRISMA_SLUG[input.data.slug] } : {}),
        },
      });
      if (input.data?.features) {
        await tx.serviceFeature.deleteMany({ where: { serviceId: row.id } });
        await tx.serviceFeature.createMany({
          data: input.data.features.map((text, index) => ({
            serviceId: row.id,
            sortOrder: index,
            text: mergeLocale(undefined, text),
          })),
        });
      }
      if (mediaIds[0]) {
        await tx.serviceMedia.deleteMany({ where: { serviceId: row.id } });
        await tx.serviceMedia.create({ data: { serviceId: row.id, mediaId: mediaIds[0], sortOrder: 0 } });
      }
    });
    return { ok: true, id: row.id, revalidated: false };
  }

  if (input.resource === 'project') {
    const row = await prisma.project.findUnique({ where: { id: input.id } });
    if (!row) return { ok: false, error: 'Document not found', status: 404 };
    const mediaIds = input.data?.assetIds?.length ? await resolveMediaIds(input.data.assetIds) : [];
    await prisma.$transaction(async (tx: Tx) => {
      await tx.project.update({
        where: { id: row.id },
        data: {
          ...(input.data?.title ? { title: mergeLocale(row.title, input.data.title) } : {}),
          ...(input.data?.description ? { description: mergeLocale(row.description, input.data.description) } : {}),
          ...(input.data?.category ? { category: input.data.category } : {}),
          ...(input.data?.woodTypes ? { woodTypes: input.data.woodTypes } : {}),
          ...(typeof input.data?.published === 'boolean' ? { published: input.data.published } : {}),
        },
      });
      if (mediaIds.length) {
        await tx.projectMedia.deleteMany({ where: { projectId: row.id } });
        await tx.projectMedia.createMany({
          data: mediaIds.map((mediaId, index) => ({ projectId: row.id, mediaId, sortOrder: index })),
        });
      }
    });
    return { ok: true, id: row.id, revalidated: false };
  }

  if (input.resource === 'material') {
    const row = await prisma.material.findUnique({ where: { id: input.id } });
    if (!row) return { ok: false, error: 'Document not found', status: 404 };
    const namePatch = {
      he: input.data?.nameHe,
      ar: input.data?.nameAr,
      en: input.data?.nameEn,
    };
    const mediaIds = input.data?.assetIds?.length ? await resolveMediaIds(input.data.assetIds) : [];
    await prisma.$transaction(async (tx: Tx) => {
      await tx.material.update({
        where: { id: row.id },
        data: {
          name: mergeLocale(row.name, namePatch),
          ...(input.data?.description ? { description: mergeLocale(row.description, input.data.description) } : {}),
          ...(input.data?.characteristics
            ? { characteristics: mergeLocale(row.characteristics, input.data.characteristics) }
            : {}),
          ...(input.data?.applications ? { applications: mergeLocale(row.applications, input.data.applications) } : {}),
          ...(input.data?.finishes ? { finishes: mergeLocale(row.finishes, input.data.finishes) } : {}),
          ...(typeof input.data?.published === 'boolean' ? { published: input.data.published } : {}),
        },
      });
      if (mediaIds[0]) {
        await tx.materialMedia.deleteMany({ where: { materialId: row.id } });
        await tx.materialMedia.create({ data: { materialId: row.id, mediaId: mediaIds[0], sortOrder: 0 } });
      }
    });
    return { ok: true, id: row.id, revalidated: false };
  }

  if (input.resource === 'testimonial') {
    const row = await prisma.testimonial.findUnique({ where: { id: input.id } });
    if (!row) return { ok: false, error: 'Document not found', status: 404 };
    await prisma.testimonial.update({
      where: { id: row.id },
      data: {
        ...(typeof input.data?.clientName === 'string' ? { name: input.data.clientName } : {}),
        ...(typeof input.data?.rating === 'number' ? { rating: input.data.rating } : {}),
        ...(input.data?.text ? { review: mergeLocale(row.review, input.data.text) } : {}),
        ...(input.data?.project ? { project: mergeLocale(row.project, input.data.project) } : {}),
        ...(typeof input.data?.published === 'boolean' ? { published: input.data.published } : {}),
      },
    });
    return { ok: true, id: row.id, revalidated: false };
  }

  if (input.resource === 'faq') {
    const row = await prisma.faqItem.findUnique({ where: { id: input.id } });
    if (!row) return { ok: false, error: 'Document not found', status: 404 };
    await prisma.faqItem.update({
      where: { id: row.id },
      data: {
        ...(input.data?.question ? { question: mergeLocale(row.question, input.data.question) } : {}),
        ...(input.data?.answer ? { answer: mergeLocale(row.answer, input.data.answer) } : {}),
        ...(typeof input.data?.order === 'number' ? { sortOrder: input.data.order } : {}),
        ...(typeof input.data?.published === 'boolean' ? { published: input.data.published } : {}),
        ...(typeof input.data?.category === 'string' ? { category: input.data.category } : {}),
      },
    });
    return { ok: true, id: row.id, revalidated: false };
  }

  if (input.resource === 'blog') {
    const row = await prisma.blogPost.findUnique({ where: { id: input.id } });
    if (!row) return { ok: false, error: 'Document not found', status: 404 };
    const mediaIds = input.data?.assetIds?.length ? await resolveMediaIds(input.data.assetIds) : [];
    await prisma.blogPost.update({
      where: { id: row.id },
      data: {
        ...(input.data?.title ? { title: mergeLocale(row.title, input.data.title) } : {}),
        ...(input.data?.excerpt ? { excerpt: mergeLocale(row.excerpt, input.data.excerpt) } : {}),
        ...(input.data?.content ? { content: mergeLocale(row.content, input.data.content) } : {}),
        ...(typeof input.data?.author === 'string' ? { author: input.data.author } : {}),
        ...(typeof input.data?.publishedAt === 'string' ? { publishedAt: new Date(input.data.publishedAt) } : {}),
        ...(typeof input.data?.published === 'boolean' ? { published: input.data.published } : {}),
        ...(typeof input.data?.category === 'string' ? { category: input.data.category } : {}),
        ...(mediaIds[0] ? { featuredMediaId: mediaIds[0] } : {}),
      },
    });
    return { ok: true, id: row.id, revalidated: false };
  }

  return { ok: false, error: 'Unsupported operation', status: 400 };
}
