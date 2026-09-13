/**
 * Sanity env helpers.
 * Site renders from seed fallbacks when project id is missing so local/dev never hard-crashes.
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
