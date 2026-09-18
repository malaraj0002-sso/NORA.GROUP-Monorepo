export const THEME_COOKIE = 'nora-theme';
export const THEME_STORAGE_KEY = 'nora-theme';

export type ThemeName = 'light' | 'dark';

export function parseTheme(value: string | undefined | null): ThemeName {
  return value === 'dark' ? 'dark' : 'light';
}

/** Browser-only. `null` means the cookie is absent (legacy localStorage may still apply). */
export function readDocumentThemeCookie(): ThemeName | null {
  const match = document.cookie.match(/(?:^|; )nora-theme=(dark|light)(?:;|$)/);
  return match ? parseTheme(match[1]) : null;
}

export function themeCookieString(theme: ThemeName): string {
  return `${THEME_COOKIE}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
