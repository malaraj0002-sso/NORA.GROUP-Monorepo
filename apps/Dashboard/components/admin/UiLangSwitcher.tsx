'use client';

import { UI_LANGS, UI_LANG_LABELS, type UiLang } from '@/lib/i18n/ui-lang';
import { useUiI18n } from '@/lib/i18n/UiI18nProvider';

export function UiLangSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useUiI18n();

  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
      {compact ? (
        <span className="sr-only">{t('lang.label')}</span>
      ) : (
        <span className="hidden sm:inline whitespace-nowrap">{t('lang.label')}</span>
      )}
      <select
        aria-label={t('lang.label')}
        value={lang}
        onChange={(event) => setLang(event.target.value as UiLang)}
        className="h-9 max-w-[10rem] rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
      >
        {UI_LANGS.map((code) => (
          <option key={code} value={code}>
            {UI_LANG_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
