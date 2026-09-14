import 'server-only';
import { fetchSanityDocumentType } from '@/lib/sanity/fetch';
import { getSanityApiVersion, getSanityDataset, getSanityProjectId } from '@/lib/sanity/env';
import type { MutationInput } from '@/lib/server/content/schema';
import { rejectDoorMutation } from '@/lib/server/content/schema';

function writeToken(): string | undefined {
  return process.env.SANITY_API_WRITE_TOKEN?.trim();
}

function localeSet(prefix: string, locale?: { he?: string; ar?: string; en?: string }): Record<string, string> {
  const set: Record<string, string> = {};
  if (!locale) return set;
  if (typeof locale.he === 'string') set[`${prefix}.he`] = locale.he;
  if (typeof locale.ar === 'string') set[`${prefix}.ar`] = locale.ar;
  if (typeof locale.en === 'string') set[`${prefix}.en`] = locale.en;
  return set;
}

function firstLocaleValue(locale?: { he?: string; ar?: string; en?: string }): string {
  return locale?.he?.trim() || locale?.ar?.trim() || locale?.en?.trim() || '';
}

function slugify(raw: string, fallback: string): string {
  const ascii = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return ascii.length >= 2 ? ascii : fallback;
}

function galleryFromAssets(assetIds: string[] | undefined) {
  if (!assetIds?.length) return undefined;
  return assetIds.map((assetId, index) => ({
    _type: 'image',
    _key: `img${index}`,
    asset: { _type: 'reference', _ref: assetId },
  }));
}

function imageFromAssets(assetIds: string[] | undefined) {
  if (!assetIds?.[0]) return undefined;
  return { _type: 'image', asset: { _type: 'reference', _ref: assetIds[0] } };
}

type MutateOk = { ok: true; id?: string };
type MutateErr = { ok: false; error: string };

async function mutate(mutations: unknown[]): Promise<MutateOk | MutateErr> {
  const projectId = getSanityProjectId();
  const token = writeToken();
  if (!projectId || !token) {
    return { ok: false, error: 'Sanity write is not configured' };
  }

  const dataset = encodeURIComponent(getSanityDataset());
  const apiVersion = encodeURIComponent(getSanityApiVersion());
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}?returnIds=true`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({ mutations }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return { ok: false, error: 'Sanity mutation request failed' };
  }

  let body = '';
  try {
    body = await response.text();
  } catch {
    return { ok: false, error: 'Sanity mutation response was empty' };
  }

  if (!body.trim()) {
    return { ok: false, error: 'Sanity mutation returned an empty response' };
  }

  let parsed: { results?: Array<{ id?: string }>; error?: { description?: string } };
  try {
    parsed = JSON.parse(body) as { results?: Array<{ id?: string }>; error?: { description?: string } };
  } catch {
    return { ok: false, error: 'Sanity mutation returned non-JSON' };
  }

  if (!response.ok) {
    const desc = parsed.error?.description;
    if (typeof desc === 'string' && desc.length > 0 && desc.length < 240 && !/token|secret|bearer|authorization/i.test(desc)) {
      return { ok: false, error: desc };
    }
    return { ok: false, error: 'Sanity mutation was rejected' };
  }

  const id = parsed.results?.find((row) => typeof row.id === 'string' && row.id)?.id;
  return { ok: true, id };
}

function isSafeRevalidateUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol === 'https:') return true;
    if (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
      return process.env.NODE_ENV !== 'production';
    }
    return false;
  } catch {
    return false;
  }
}

async function revalidateWebsite(): Promise<boolean> {
  const secret = process.env.SANITY_REVALIDATE_SECRET?.trim();
  const target = process.env.WEBSITE_REVALIDATE_URL?.trim();
  if (!secret || !target || !isSafeRevalidateUrl(target)) return false;
  try {
    const response = await fetch(target, {
      method: 'POST',
      headers: { 'x-revalidate-secret': secret },
      signal: AbortSignal.timeout(8000),
    });
    return response.ok;
  } catch {
    console.error('[cms] website revalidate failed');
    return false;
  }
}

async function commit(mutations: unknown[]): Promise<ApplyMutationResult> {
  const result = await mutate(mutations);
  if (!result.ok) return result;
  const revalidated = await revalidateWebsite();
  return { ok: true, id: result.id, revalidated };
}

const RESOURCE_DOCUMENT_TYPE: Record<string, string> = {
  project: 'project',
  service: 'service',
  material: 'material',
  testimonial: 'testimonial',
  faq: 'faqItem',
  blog: 'blogPost',
};

async function assertDocumentType(
  id: string,
  resource: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const expected = RESOURCE_DOCUMENT_TYPE[resource];
  if (!expected) return { ok: false, error: 'Unsupported resource', status: 400 };
  const actual = await fetchSanityDocumentType(id);
  if (!actual) return { ok: false, error: 'Document not found', status: 404 };
  if (actual !== expected) return { ok: false, error: 'Document type mismatch', status: 403 };
  return { ok: true };
}

export type ApplyMutationResult =
  | { ok: true; id?: string; revalidated: boolean }
  | { ok: false; error: string; status?: number };

export async function applyMutation(input: MutationInput): Promise<ApplyMutationResult> {
  const door = rejectDoorMutation(input);
  if (door) return { ok: false, error: door, status: 400 };

  if (input.op === 'delete') {
    if (!('id' in input) || !input.id) {
      return { ok: false, error: 'Invalid delete', status: 400 };
    }
    const typed = await assertDocumentType(input.id, input.resource);
    if (!typed.ok) return typed;
    const result = await commit([{ delete: { id: input.id } }]);
    return result;
  }

  if (input.resource === 'site' && input.op === 'patch') {
    const set: Record<string, unknown> = {
      ...(typeof input.data.siteName === 'string' ? { brandName: input.data.siteName } : {}),
      ...localeSet('tagline', input.data.tagline),
      ...(typeof input.data.contactEmail === 'string' ? { email: input.data.contactEmail } : {}),
      ...localeSet('address', input.data.contactAddress),
      ...(typeof input.data.contactPhone === 'string' ? { phoneDisplay: input.data.contactPhone } : {}),
      ...(typeof input.data.phoneTel === 'string' ? { phoneTel: input.data.phoneTel } : {}),
      ...(typeof input.data.whatsappE164 === 'string' ? { whatsappE164: input.data.whatsappE164 } : {}),
    };
    const logo = imageFromAssets(input.data.assetIds);
    if (logo) set.logo = logo;
    const result = await commit([{ patch: { id: 'siteSettings', set } }]);
    return result;
  }

  if (input.resource === 'about' && input.op === 'patch') {
    const set = localeSet('body', input.data.story);
    const result = await commit([{ patch: { id: 'aboutPage', set } }]);
    return result;
  }

  if (input.resource === 'homepage' && input.op === 'patch') {
    const set = {
      ...localeSet('heroTitle', input.data.heroTitle),
      ...localeSet('heroSubtitle', input.data.heroSubtitle),
      ...localeSet('introTitle', input.data.introTitle),
      ...localeSet('introDescription', input.data.introDescription),
      ...localeSet('ctaTitle', input.data.ctaTitle),
      ...localeSet('ctaSubtitle', input.data.ctaSubtitle),
    };
    if (!Object.keys(set).length) return { ok: false, error: 'Nothing to patch', status: 400 };
    const result = await commit([{ patch: { id: 'homePage', set } }]);
    return result;
  }

  if (input.resource === 'hero' && input.op === 'patch') {
    const heroImages = input.data.assetIds.map((assetId, index) => ({
      _type: 'image',
      _key: `hero${index}`,
      asset: { _type: 'reference', _ref: assetId },
    }));
    const result = await commit([{ patch: { id: 'homePage', set: { heroImages } } }]);
    return result;
  }

  if (input.resource === 'howWeWork' && input.op === 'patch') {
    const set: Record<string, unknown> = {};
    for (const step of input.data.steps) {
      if (typeof step.number === 'string') set[`steps[_key=="${step.id}"].number`] = step.number;
      Object.assign(set, localeSet(`steps[_key=="${step.id}"].title`, step.title));
      Object.assign(set, localeSet(`steps[_key=="${step.id}"].description`, step.description));
    }
    if (!Object.keys(set).length) return { ok: false, error: 'Nothing to patch', status: 400 };
    const result = await commit([{ patch: { id: 'howWeWorkPage', set } }]);
    return result;
  }

  if (input.op === 'create') {
    const created = buildCreate(input);
    if (!created.ok) return created;
    const result = await commit([{ create: created.doc }]);
    return result;
  }

  if (input.op === 'patch') {
    if (!('id' in input) || !input.id) return { ok: false, error: 'Missing id', status: 400 };
    const typed = await assertDocumentType(input.id, input.resource);
    if (!typed.ok) return typed;
    const set = buildPatchSet(input);
    if (!set) return { ok: false, error: 'Nothing to patch', status: 400 };
    const result = await commit([{ patch: { id: input.id, set } }]);
    return result;
  }

  return { ok: false, error: 'Unsupported operation', status: 400 };
}

function buildPatchSet(input: MutationInput): Record<string, unknown> | null {
  const set: Record<string, unknown> = {};
  if (input.resource === 'project' && input.data) {
    Object.assign(set, localeSet('title', input.data.title));
    Object.assign(set, localeSet('description', input.data.description));
    if (input.data.category) set.category = input.data.category;
    if (input.data.woodTypes) set.materials = input.data.woodTypes;
    if (typeof input.data.published === 'boolean') set.visible = input.data.published;
    const gallery = galleryFromAssets(input.data.assetIds);
    if (gallery) set.gallery = gallery;
  }
  if (input.resource === 'service' && input.data) {
    Object.assign(set, localeSet('title', input.data.title));
    Object.assign(set, localeSet('description', input.data.description));
    if (typeof input.data.published === 'boolean') set.visible = input.data.published;
    const image = imageFromAssets(input.data.assetIds);
    if (image) set.image = image;
    if (input.data.features) {
      set.features = input.data.features.map((feature, index) => ({
        _key: `feature${index}`,
        he: feature.he || '',
        ar: feature.ar || '',
        en: feature.en || '',
      }));
    }
  }
  if (input.resource === 'material' && input.data) {
    if (typeof input.data.nameHe === 'string') set['name.he'] = input.data.nameHe;
    if (typeof input.data.nameAr === 'string') set['name.ar'] = input.data.nameAr;
    if (typeof input.data.nameEn === 'string') set['name.en'] = input.data.nameEn;
    Object.assign(set, localeSet('description', input.data.description));
    Object.assign(set, localeSet('characteristics', input.data.characteristics));
    Object.assign(set, localeSet('applications', input.data.applications));
    Object.assign(set, localeSet('finishes', input.data.finishes));
    if (typeof input.data.published === 'boolean') set.visible = input.data.published;
    const image = imageFromAssets(input.data.assetIds);
    if (image) set.image = image;
  }
  if (input.resource === 'testimonial' && input.data) {
    if (typeof input.data.clientName === 'string') set.name = input.data.clientName;
    if (typeof input.data.rating === 'number') set.rating = input.data.rating;
    Object.assign(set, localeSet('review', input.data.text));
    Object.assign(set, localeSet('project', input.data.project));
    if (typeof input.data.published === 'boolean') set.visible = input.data.published;
  }
  if (input.resource === 'faq' && input.data) {
    Object.assign(set, localeSet('question', input.data.question));
    Object.assign(set, localeSet('answer', input.data.answer));
    if (typeof input.data.order === 'number') set.order = input.data.order;
    if (typeof input.data.published === 'boolean') set.visible = input.data.published;
    if (typeof input.data.category === 'string') set.category = input.data.category;
  }
  if (input.resource === 'blog' && input.data) {
    Object.assign(set, localeSet('title', input.data.title));
    Object.assign(set, localeSet('excerpt', input.data.excerpt));
    Object.assign(set, localeSet('content', input.data.content));
    if (typeof input.data.author === 'string') set.author = input.data.author;
    if (typeof input.data.publishedAt === 'string') set.date = input.data.publishedAt;
    if (typeof input.data.published === 'boolean') set.visible = input.data.published;
    if (typeof input.data.category === 'string') set.category = input.data.category;
    const image = imageFromAssets(input.data.assetIds);
    if (image) set.image = image;
  }
  return Object.keys(set).length ? set : null;
}

function buildCreate(
  input: MutationInput,
): { ok: true; doc: Record<string, unknown> } | { ok: false; error: string; status: number } {
  if (input.resource === 'project') {
    const he = firstLocaleValue(input.data?.title);
    if (!he) return { ok: false, error: 'Project requires a title in Hebrew, Arabic, or English', status: 400 };
    const slug =
      input.data?.slug ||
      slugify(input.data?.title?.en || input.data?.title?.he || input.data?.title?.ar || '', `project-${Date.now()}`);
    const gallery = galleryFromAssets(input.data?.assetIds);
    return {
      ok: true,
      doc: {
        _type: 'project',
        title: {
          he,
          ar: input.data?.title?.ar || '',
          en: input.data?.title?.en || '',
        },
        description: {
          he: input.data?.description?.he || '',
          ar: input.data?.description?.ar || '',
          en: input.data?.description?.en || '',
        },
        category: input.data?.category || 'furniture',
        slug: { _type: 'slug', current: slug },
        visible: input.data?.published ?? true,
        materials: input.data?.woodTypes || [],
        order: 0,
        ...(gallery ? { gallery } : {}),
      },
    };
  }
  if (input.resource === 'service') {
    const slug = input.data?.slug;
    const he = firstLocaleValue(input.data?.title);
    if (!slug || !he) return { ok: false, error: 'Service requires an allowed slug and a title', status: 400 };
    const image = imageFromAssets(input.data?.assetIds);
    return {
      ok: true,
      doc: {
        _type: 'service',
        title: { he, ar: input.data?.title?.ar || '', en: input.data?.title?.en || '' },
        description: {
          he: input.data?.description?.he || '',
          ar: input.data?.description?.ar || '',
          en: input.data?.description?.en || '',
        },
        slug: { _type: 'slug', current: slug },
        visible: input.data?.published ?? true,
        order: 0,
        ...(image ? { image } : {}),
      },
    };
  }
  if (input.resource === 'material') {
    const he = input.data?.nameHe?.trim() || input.data?.nameAr?.trim() || input.data?.nameEn?.trim() || '';
    if (!he) return { ok: false, error: 'Material requires a name in Hebrew, Arabic, or English', status: 400 };
    const slug =
      input.data?.slug || slugify(input.data?.nameEn || input.data?.nameHe || input.data?.nameAr || '', `material-${Date.now()}`);
    const image = imageFromAssets(input.data?.assetIds);
    return {
      ok: true,
      doc: {
        _type: 'material',
        name: { he, ar: input.data?.nameAr || '', en: input.data?.nameEn || '' },
        description: {
          he: input.data?.description?.he || '',
          ar: input.data?.description?.ar || '',
          en: input.data?.description?.en || '',
        },
        slug: { _type: 'slug', current: slug },
        visible: input.data?.published ?? true,
        order: 0,
        ...(image ? { image } : {}),
      },
    };
  }
  if (input.resource === 'testimonial') {
    const he = firstLocaleValue(input.data?.text);
    const name = input.data?.clientName?.trim();
    if (!he || !name) return { ok: false, error: 'Testimonial requires name and a review', status: 400 };
    return {
      ok: true,
      doc: {
        _type: 'testimonial',
        name,
        rating: input.data?.rating ?? 5,
        review: { he, ar: input.data?.text?.ar || '', en: input.data?.text?.en || '' },
        project: {
          he: input.data?.project?.he || '',
          ar: input.data?.project?.ar || '',
          en: input.data?.project?.en || '',
        },
        visible: input.data?.published ?? true,
        order: 0,
      },
    };
  }
  if (input.resource === 'faq') {
    const he = firstLocaleValue(input.data?.question);
    if (!he) return { ok: false, error: 'FAQ requires a question', status: 400 };
    return {
      ok: true,
      doc: {
        _type: 'faqItem',
        question: { he, ar: input.data?.question?.ar || '', en: input.data?.question?.en || '' },
        answer: {
          he: input.data?.answer?.he || '',
          ar: input.data?.answer?.ar || '',
          en: input.data?.answer?.en || '',
        },
        category: input.data?.category || '',
        visible: input.data?.published ?? true,
        order: input.data?.order ?? 0,
      },
    };
  }
  if (input.resource === 'blog') {
    const he = firstLocaleValue(input.data?.title);
    if (!he) return { ok: false, error: 'Blog post requires a title', status: 400 };
    const slug =
      input.data?.slug ||
      slugify(input.data?.title?.en || input.data?.title?.he || input.data?.title?.ar || '', `blog-${Date.now()}`);
    const image = imageFromAssets(input.data?.assetIds);
    return {
      ok: true,
      doc: {
        _type: 'blogPost',
        title: { he, ar: input.data?.title?.ar || '', en: input.data?.title?.en || '' },
        excerpt: {
          he: input.data?.excerpt?.he || '',
          ar: input.data?.excerpt?.ar || '',
          en: input.data?.excerpt?.en || '',
        },
        content: {
          he: input.data?.content?.he || '',
          ar: input.data?.content?.ar || '',
          en: input.data?.content?.en || '',
        },
        slug: { _type: 'slug', current: slug },
        author: input.data?.author || 'Nora Group',
        date: input.data?.publishedAt,
        category: input.data?.category || '',
        visible: input.data?.published ?? true,
        ...(image ? { image } : {}),
      },
    };
  }
  return { ok: false, error: 'Create is not supported for this resource', status: 400 };
}
