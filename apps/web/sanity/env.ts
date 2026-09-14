const rawProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();

export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-01-01';

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

/** Empty when missing or the old placeholder — callers must not hit Sanity. */
export const projectId =
  rawProjectId && rawProjectId !== 'placeholder' ? rawProjectId : '';
