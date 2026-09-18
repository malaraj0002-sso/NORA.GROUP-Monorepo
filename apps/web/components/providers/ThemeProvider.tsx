'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  THEME_STORAGE_KEY,
  readDocumentThemeCookie,
  themeCookieString,
  type ThemeName,
} from '@/lib/theme';

type ThemeContextValue = {
  theme: ThemeName;
  dark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeName) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.cookie = themeCookieString(theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode */
  }
}

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: ThemeName;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<ThemeName>(initialTheme);

  useEffect(() => {
    let next = readDocumentThemeCookie();
    if (next == null) {
      try {
        next = window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
      } catch {
        next = initialTheme;
      }
    }
    applyTheme(next);
    setTheme(next);
  }, [initialTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: ThemeName = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, dark: theme === 'dark', toggleTheme }),
    [theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useSiteTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useSiteTheme must be used within ThemeProvider');
  return ctx;
}

export function useHtmlDark(): boolean {
  return useSiteTheme().dark;
}
