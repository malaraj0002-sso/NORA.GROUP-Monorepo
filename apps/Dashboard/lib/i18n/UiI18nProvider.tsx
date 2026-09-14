'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { translate, type MessageKey } from './messages';
import { persistUiLang, uiDir, type UiLang } from './ui-lang';

type UiI18nValue = {
  lang: UiLang;
  dir: 'rtl' | 'ltr';
  setLang: (lang: UiLang) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const UiI18nContext = createContext<UiI18nValue | null>(null);

export function UiI18nProvider({
  initialLang,
  children,
}: {
  initialLang: UiLang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<UiLang>(initialLang);

  const setLang = useCallback((next: UiLang) => {
    setLangState(next);
    persistUiLang(next);
    const html = document.documentElement;
    html.lang = next;
    html.dir = uiDir(next);
  }, []);

  const value = useMemo<UiI18nValue>(
    () => ({
      lang,
      dir: uiDir(lang),
      setLang,
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang, setLang],
  );

  return <UiI18nContext.Provider value={value}>{children}</UiI18nContext.Provider>;
}

export function useUiI18n(): UiI18nValue {
  const ctx = useContext(UiI18nContext);
  if (!ctx) {
    throw new Error('useUiI18n must be used within UiI18nProvider');
  }
  return ctx;
}
