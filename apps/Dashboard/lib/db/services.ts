import type { LocalePatch } from './locale';

export type PrismaServiceSlug =
  | 'kitchens'
  | 'bedrooms'
  | 'wardrobes'
  | 'walkInClosets'
  | 'customFurniture'
  | 'offices'
  | 'commercial';

export const OFFICIAL_SERVICE_SLUGS = [
  'kitchens',
  'bedrooms',
  'wardrobes',
  'walk-in-closets',
  'custom-furniture',
  'offices',
  'commercial',
] as const;

export type WebsiteServiceSlug = (typeof OFFICIAL_SERVICE_SLUGS)[number];

export const WEBSITE_TO_PRISMA_SLUG: Record<WebsiteServiceSlug, PrismaServiceSlug> = {
  kitchens: 'kitchens',
  bedrooms: 'bedrooms',
  wardrobes: 'wardrobes',
  'walk-in-closets': 'walkInClosets',
  'custom-furniture': 'customFurniture',
  offices: 'offices',
  commercial: 'commercial',
};

export const PRISMA_TO_WEBSITE_SLUG: Record<string, WebsiteServiceSlug> = {
  kitchens: 'kitchens',
  bedrooms: 'bedrooms',
  wardrobes: 'wardrobes',
  walkInClosets: 'walk-in-closets',
  customFurniture: 'custom-furniture',
  offices: 'offices',
  commercial: 'commercial',
};

const DOOR_PATTERN = /door|luxury-doors|door-service|דלת|باب/i;

export function isOfficialServiceSlug(value: string): value is WebsiteServiceSlug {
  return (OFFICIAL_SERVICE_SLUGS as readonly string[]).includes(value);
}

export function isForbiddenDoorService(input: {
  id?: string | null;
  slug?: string | null;
  title?: LocalePatch | { he?: string; ar?: string; en?: string; ru?: string } | null;
}): boolean {
  const slug = (input.slug || '').toLowerCase();
  if (slug.includes('door') || slug.includes('luxury-doors')) return true;
  const title = input.title;
  const text = [title?.he, title?.ar, title?.en, title?.ru, input.id].filter(Boolean).join(' ');
  return DOOR_PATTERN.test(text);
}
