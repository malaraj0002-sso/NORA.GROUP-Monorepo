'use client';

import { useState, createContext, useContext } from 'react';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LangCode } from '@/lib/types';
import { useUiI18n } from '@/lib/i18n/UiI18nProvider';

const LangContext = createContext<{
  lang: LangCode;
  setLang: (l: LangCode) => void;
}>({
  lang: 'en',
  setLang: () => {},
});

export function useLang() {
  return useContext(LangContext);
}

const LANGS: { code: LangCode; native: string }[] = [
  { code: 'en', native: 'English' },
  { code: 'ar', native: 'العربية' },
  { code: 'he', native: 'עברית' },
];

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LangCode>('en');
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function LanguageTabs() {
  const { lang, setLang } = useLang();
  const { t } = useUiI18n();
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-lg glass p-1" role="group" aria-label={t('contentLang.label')}>
      <Languages className="h-4 w-4 text-gold mx-1.5" aria-hidden="true" />
      <span className="sr-only">{t('contentLang.label')}</span>
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40',
            lang === l.code
              ? 'bg-gold/20 text-gold border border-gold/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          )}
        >
          {l.native}
        </button>
      ))}
    </div>
  );
}

export function LocalizedInput({
  value,
  onChange,
  label,
  textarea,
}: {
  value: { ar: string; he: string; en: string };
  onChange: (v: { ar: string; he: string; en: string }) => void;
  label?: string;
  textarea?: boolean;
  dir?: 'rtl' | 'ltr';
}) {
  const { lang } = useLang();
  const fieldDir = lang === 'en' ? 'ltr' : 'rtl';

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
      )}
      {textarea ? (
        <textarea
          dir={fieldDir}
          value={value[lang]}
          onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-2 text-start"
        />
      ) : (
        <input
          dir={fieldDir}
          value={value[lang]}
          onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-2 text-start"
        />
      )}
    </div>
  );
}
