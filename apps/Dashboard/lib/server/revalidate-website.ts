/**
 * Tell the public website to drop cached SiteContent after a CMS write.
 * Fail closed and silent when URL/secret are unset (local Dashboard-only).
 */
export async function revalidateWebsite(): Promise<boolean> {
  const url = process.env.WEBSITE_REVALIDATE_URL?.trim();
  const secret =
    process.env.REVALIDATE_SECRET?.trim() || process.env.SANITY_REVALIDATE_SECRET?.trim();
  if (!url || !secret) return false;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'x-revalidate-secret': secret },
    });
    if (!response.ok) {
      console.error('[cms] website revalidate rejected');
      return false;
    }
    return true;
  } catch {
    console.error('[cms] website revalidate failed');
    return false;
  }
}
