/**
 * Public Sanity identifiers only. No write tokens.
 * Dashboard Next.js does not load apps/web/.env.local — copy public vars here.
 */

export function getSanityProjectId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
  if (!id || id === 'placeholder') return undefined;
  return id;
}

export function getSanityDataset(): string {
  return process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || 'production';
}

export function getSanityApiVersion(): string {
  return process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || '2025-01-01';
}

export function isSanityConfigured(): boolean {
  return Boolean(getSanityProjectId());
}
