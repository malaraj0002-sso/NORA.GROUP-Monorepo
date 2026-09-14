import type { LocalizedText } from '@/lib/types';
import type { MutationInput } from '@/lib/server/content/schema';

export function compactLocale(value: LocalizedText): { he?: string; ar?: string; en?: string } {
  const next: { he?: string; ar?: string; en?: string } = {};
  if (value.he.trim()) next.he = value.he;
  if (value.ar.trim()) next.ar = value.ar;
  if (value.en.trim()) next.en = value.en;
  return next;
}

export function isLocalDraftId(id: string): boolean {
  return /^(proj|mat|svc|test|faq|blog|hero|nav|af|ss)-/.test(id);
}

export function slugFromLocalized(value: LocalizedText, fallback: string): string {
  const raw = `${value.en} ${value.he} ${value.ar}`.trim();
  const ascii = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  if (ascii.length >= 2) return ascii;
  return fallback.replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || 'item';
}

export async function postCms(
  input: MutationInput,
): Promise<{ ok: true; id?: string; revalidated?: boolean } | { ok: false; error: string }> {
  const response = await fetch('/api/cms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const text = await response.text();
  let payload: { error?: string; id?: string; revalidated?: boolean } = {};
  if (text.trim()) {
    try {
      payload = JSON.parse(text) as { error?: string; id?: string; revalidated?: boolean };
    } catch {
      return { ok: false, error: 'Unexpected response' };
    }
  }
  if (!response.ok) return { ok: false, error: payload.error || 'Save failed' };
  return { ok: true, id: payload.id, revalidated: payload.revalidated };
}
