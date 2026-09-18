export type LocaleCode = 'he' | 'ar' | 'en' | 'ru';

export const LOCALES: LocaleCode[] = ['he', 'ar', 'en', 'ru'];

export type LocalizedString = Record<LocaleCode, string>;

export const EMPTY_LOCALE: LocalizedString = { he: '', ar: '', en: '', ru: '' };

export type LocalePatch = {
  he?: string;
  ar?: string;
  en?: string;
  ru?: string;
};

export function asLocale(value: unknown): LocalizedString {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    he: typeof record.he === 'string' ? record.he : '',
    ar: typeof record.ar === 'string' ? record.ar : '',
    en: typeof record.en === 'string' ? record.en : '',
    ru: typeof record.ru === 'string' ? record.ru : '',
  };
}

export function mergeLocale(existing: unknown, patch?: LocalePatch): LocalizedString {
  const base = asLocale(existing);
  if (!patch) return base;
  return {
    he: typeof patch.he === 'string' ? patch.he : base.he,
    ar: typeof patch.ar === 'string' ? patch.ar : base.ar,
    en: typeof patch.en === 'string' ? patch.en : base.en,
    ru: typeof patch.ru === 'string' ? patch.ru : base.ru,
  };
}

export function toDashboardLocale(value: unknown): { he: string; ar: string; en: string } {
  const locale = asLocale(value);
  return { he: locale.he, ar: locale.ar, en: locale.en };
}

export function firstLocaleValue(locale?: LocalePatch): string {
  if (!locale) return '';
  return locale.he?.trim() || locale.ar?.trim() || locale.en?.trim() || locale.ru?.trim() || '';
}
