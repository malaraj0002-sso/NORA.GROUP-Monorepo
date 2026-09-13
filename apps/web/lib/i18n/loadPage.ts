import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getSiteContent } from '@/lib/content/getContent';
import { isAppLocale, isSafeSlug } from '@/lib/i18n/locale';

export async function loadLocalePage(params: Promise<{ locale: string }>) {
  const { locale: raw } = await params;
  if (!isAppLocale(raw)) notFound();
  setRequestLocale(raw);
  const content = await getSiteContent();
  return { locale: raw, content };
}

export async function loadSlugPage(params: Promise<{ locale: string; slug: string }>) {
  const { locale: raw, slug } = await params;
  if (!isAppLocale(raw) || !isSafeSlug(slug)) notFound();
  setRequestLocale(raw);
  const content = await getSiteContent();
  return { locale: raw, content, slug };
}
