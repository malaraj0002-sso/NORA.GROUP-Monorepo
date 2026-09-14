'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useUiI18n } from '@/lib/i18n/UiI18nProvider';

export function ThemeToggle() {
  const { t } = useUiI18n();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <span className="h-8 w-8" />;

  const dark = (resolvedTheme || theme) === 'dark';
  return (
    <button
      type="button"
      aria-label={dark ? t('theme.toLight') : t('theme.toDark')}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="p-2 rounded-lg text-muted-foreground hover:text-gold hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
