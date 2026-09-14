export const UI_LANGS = ['ar', 'he', 'en'] as const;
export type UiLang = (typeof UI_LANGS)[number];

export const DEFAULT_UI_LANG: UiLang = 'ar';
export const UI_LANG_COOKIE = 'nora_ui_lang';

export const UI_LANG_LABELS: Record<UiLang, string> = {
  ar: 'العربية',
  he: 'עברית',
  en: 'English',
};

export function parseUiLang(value: string | undefined | null): UiLang | null {
  if (value === 'ar' || value === 'he' || value === 'en') return value;
  return null;
}

export function uiDir(lang: UiLang): 'rtl' | 'ltr' {
  return lang === 'en' ? 'ltr' : 'rtl';
}

export function persistUiLang(lang: UiLang): void {
  document.cookie = `${UI_LANG_COOKIE}=${lang}; Path=/; SameSite=Lax; Max-Age=31536000`;
  try {
    localStorage.setItem(UI_LANG_COOKIE, lang);
  } catch {
    /* ignore quota / private mode */
  }
}
