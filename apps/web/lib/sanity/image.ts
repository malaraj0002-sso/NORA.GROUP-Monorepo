import createImageUrlBuilder from '@sanity/image-url';
import { getSanityDataset, getSanityProjectId, isSanityConfigured } from './env';

const builder = isSanityConfigured()
  ? createImageUrlBuilder({
      projectId: getSanityProjectId()!,
      dataset: getSanityDataset(),
    })
  : null;

/** Accept Sanity image objects or null; never throw into page render. */
export function urlForImage(source: unknown): string | null {
  if (!source || !builder) return null;
  try {
    return builder.image(source as Parameters<typeof builder.image>[0]).auto('format').url();
  } catch {
    return null;
  }
}
