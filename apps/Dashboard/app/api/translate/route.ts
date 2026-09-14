import { z } from 'zod';
import { assertSameOrigin, jsonError, requireRole, requireSession } from '@/lib/server/http';
import { applyMutation } from '@/lib/server/content/mutate';
import type { MutationInput } from '@/lib/server/content/schema';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const REVIEW_FILE = path.join(process.cwd(), '.data', 'translation-reviews.json');
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= 10) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function isAllowedTranslationUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    const isLoopback = host === 'localhost' || host === '127.0.0.1';
    if (url.protocol === 'https:') {
      if (isLoopback || host === '169.254.169.254' || host.endsWith('.internal')) return false;
      if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return false;
      return true;
    }
    if (
      process.env.NODE_ENV !== 'production' &&
      url.protocol === 'http:' &&
      isLoopback
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

const requestSchema = z
  .object({
    sourceLang: z.enum(['he', 'ar', 'en']),
    targets: z.array(z.enum(['he', 'ar', 'en'])).min(1).max(2),
    text: z.string().min(1).max(4000),
    resource: z.string().regex(/^[a-zA-Z0-9._-]{1,40}$/),
    field: z.string().regex(/^[a-zA-Z0-9._-]{1,80}$/),
    documentId: z.string().regex(/^[a-zA-Z0-9._-]{1,200}$/),
  })
  .strict();

type ReviewItem = {
  id: string;
  createdAt: string;
  sourceLang: string;
  target: string;
  sourceText: string;
  translatedText: string;
  resource: string;
  field: string;
  documentId: string;
  status: 'pending' | 'applied' | 'rejected';
};

async function loadReviews(): Promise<ReviewItem[]> {
  try {
    const raw = await readFile(REVIEW_FILE, 'utf8');
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ReviewItem[]) : [];
  } catch {
    return [];
  }
}

async function saveReviews(items: ReviewItem[]) {
  await mkdir(path.dirname(REVIEW_FILE), { recursive: true });
  await writeFile(REVIEW_FILE, JSON.stringify(items, null, 2), 'utf8');
}

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const allowed = requireRole(session, 'editor');
  if (allowed instanceof Response) return allowed;
  const items = await loadReviews();
  return Response.json({ items: items.filter((i) => i.status === 'pending') });
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError('Invalid origin', 403);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) return jsonError('Too many attempts', 429);

  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const allowed = requireRole(session, 'editor');
  if (allowed instanceof Response) return allowed;

  const apiKey = process.env.TRANSLATION_API_KEY?.trim();
  const apiUrl = process.env.TRANSLATION_API_URL?.trim() || 'https://api.openai.com/v1/chat/completions';
  if (!apiKey) return jsonError('Translation is not configured', 503);
  if (!isAllowedTranslationUrl(apiUrl)) return jsonError('Translation endpoint is not allowed', 503);

  let payload: unknown;
  try {
    const text = await request.text();
    if (!text.trim()) return jsonError('Empty body', 400);
    payload = JSON.parse(text);
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) return jsonError('Invalid translation request', 400);
  if (parsed.data.targets.includes(parsed.data.sourceLang)) {
    return jsonError('Target languages must differ from the source', 400);
  }

  const reviews = await loadReviews();
  const created: ReviewItem[] = [];

  for (const target of parsed.data.targets) {
    let translated = '';
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.TRANSLATION_MODEL || 'gpt-4o-mini',
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content:
                'Translate luxury carpentry marketing copy. Preserve placeholders. Do not invent Russian. Return only the translation.',
            },
            {
              role: 'user',
              content: `Source language: ${parsed.data.sourceLang}. Target language: ${target}.\n\n${parsed.data.text}`,
            },
          ],
        }),
        signal: AbortSignal.timeout(20000),
      });
      const body = await response.text();
      if (!body.trim()) return jsonError('Empty translation response', 502);
      let json: { choices?: { message?: { content?: string } }[] };
      try {
        json = JSON.parse(body) as { choices?: { message?: { content?: string } }[] };
      } catch {
        return jsonError('Translation returned non-JSON', 502);
      }
      translated = json.choices?.[0]?.message?.content?.trim() || '';
      if (!response.ok || !translated) return jsonError('Translation provider rejected the request', 502);
    } catch {
      return jsonError('Translation request failed', 502);
    }

    created.push({
      id: `tr-${Date.now()}-${target}`,
      createdAt: new Date().toISOString(),
      sourceLang: parsed.data.sourceLang,
      target,
      sourceText: parsed.data.text,
      translatedText: translated,
      resource: parsed.data.resource,
      field: parsed.data.field,
      documentId: parsed.data.documentId,
      status: 'pending',
    });
  }

  reviews.push(...created);
  try {
    await saveReviews(reviews);
  } catch {
    return jsonError('Review store is not writable on this host', 503);
  }

  return Response.json({ ok: true, reviews: created });
}

export async function PATCH(request: Request) {
  if (!assertSameOrigin(request)) return jsonError('Invalid origin', 403);
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const allowed = requireRole(session, 'editor');
  if (allowed instanceof Response) return allowed;

  let payload: unknown;
  try {
    const text = await request.text();
    if (!text.trim()) return jsonError('Empty body', 400);
    payload = JSON.parse(text);
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = z
    .object({
      id: z.string().regex(/^tr-[0-9]+-(he|ar|en)$/),
      status: z.enum(['rejected', 'applied']),
    })
    .strict()
    .safeParse(payload);
  if (!parsed.success) return jsonError('Invalid review patch', 400);

  const reviews = await loadReviews();
  const idx = reviews.findIndex((r) => r.id === parsed.data.id);
  if (idx < 0) return jsonError('Review not found', 404);

  if (parsed.data.status === 'applied') {
    const applied = await applyReviewToSanity(reviews[idx]);
    if (!applied.ok) return jsonError(applied.error, applied.status ?? 400);
  }

  reviews[idx].status = parsed.data.status;
  try {
    await saveReviews(reviews);
  } catch {
    return jsonError('Review store is not writable on this host', 503);
  }
  return Response.json({ ok: true, item: reviews[idx] });
}

function localePatch(target: string, text: string) {
  if (target === 'he') return { he: text };
  if (target === 'ar') return { ar: text };
  return { en: text };
}

async function applyReviewToSanity(
  item: ReviewItem,
): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
  if (/^(proj|mat|svc|test|faq|blog)-/.test(item.documentId)) {
    return { ok: false, error: 'Save the document to Sanity before applying a translation', status: 400 };
  }

  const loc = localePatch(item.target, item.translatedText);
  const field = item.field;
  let input: MutationInput | null = null;

  if (item.resource === 'project' && (field === 'title' || field === 'description')) {
    input = { resource: 'project', op: 'patch', id: item.documentId, data: { [field]: loc } };
  } else if (item.resource === 'service' && (field === 'title' || field === 'description')) {
    input = { resource: 'service', op: 'patch', id: item.documentId, data: { [field]: loc } };
  } else if (item.resource === 'material' && field === 'description') {
    input = { resource: 'material', op: 'patch', id: item.documentId, data: { description: loc } };
  } else if (item.resource === 'material' && field === 'name') {
    input = {
      resource: 'material',
      op: 'patch',
      id: item.documentId,
      data:
        item.target === 'he'
          ? { nameHe: item.translatedText }
          : item.target === 'ar'
            ? { nameAr: item.translatedText }
            : { nameEn: item.translatedText },
    };
  } else if (item.resource === 'testimonial' && (field === 'text' || field === 'review')) {
    input = { resource: 'testimonial', op: 'patch', id: item.documentId, data: { text: loc } };
  } else if (item.resource === 'faq' && (field === 'question' || field === 'answer')) {
    input = { resource: 'faq', op: 'patch', id: item.documentId, data: { [field]: loc } };
  } else if (item.resource === 'blog' && (field === 'title' || field === 'excerpt' || field === 'content')) {
    input = { resource: 'blog', op: 'patch', id: item.documentId, data: { [field]: loc } };
  } else if (item.resource === 'homepage') {
    const allowed = ['heroTitle', 'heroSubtitle', 'introTitle', 'introDescription', 'ctaTitle', 'ctaSubtitle'] as const;
    if ((allowed as readonly string[]).includes(field)) {
      input = { resource: 'homepage', op: 'patch', data: { [field]: loc } };
    }
  } else if (item.resource === 'about' && (field === 'story' || field === 'body')) {
    input = { resource: 'about', op: 'patch', data: { story: loc } };
  }

  if (!input) {
    return { ok: false, error: 'This field cannot be applied automatically', status: 400 };
  }

  const result = await applyMutation(input);
  if (!result.ok) return { ok: false, error: result.error, status: result.status };
  return { ok: true };
}
