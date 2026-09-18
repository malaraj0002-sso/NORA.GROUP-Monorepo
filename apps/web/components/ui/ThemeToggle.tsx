'use client';

import { Moon, Sun } from 'lucide-react';
import { useSiteTheme } from '@/components/providers/ThemeProvider';

export { useHtmlDark } from '@/components/providers/ThemeProvider';

export function ThemeToggle({ transparent }: { transparent?: boolean }) {
  const { dark, toggleTheme } = useSiteTheme();

  return (
    <button
      type="button"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 ${
        transparent ? 'text-warm-50/90 hover:bg-white/10' : 'text-foreground hover:bg-foreground/10'
      }`}
      onClick={toggleTheme}
    >
      {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}
