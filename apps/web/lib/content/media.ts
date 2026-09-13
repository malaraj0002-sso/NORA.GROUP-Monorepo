import { CONTACT_DEFAULTS } from '@/lib/constants';
import { images } from '@/lib/content/images';

function isAllowedAssetUrl(src: string): boolean {
  if (src.startsWith('//') || src.includes('\\') || src.includes('..')) return false;
  if (src.startsWith('/') && !src.startsWith('//')) return true;
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && url.hostname === 'cdn.sanity.io';
  } catch {
    return false;
  }
}

/**
 * Never pass an empty or attacker-controlled src to next/image.
 * Allows local /public paths and Sanity CDN only — blocks javascript:/data: URLs.
 */
export function mediaSrc(src: string | undefined | null, fallback: string = images.hero1): string {
  if (typeof src !== 'string') return fallback;
  const trimmed = src.trim();
  if (!trimmed || !isAllowedAssetUrl(trimmed)) return fallback;
  return trimmed;
}

export function logoSrc(src: string | undefined | null): string {
  return mediaSrc(src, CONTACT_DEFAULTS.logoPath);
}
