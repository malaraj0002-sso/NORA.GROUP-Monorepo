'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE = 'nora-theme';

/** Follows `html.dark` after mount. Starts light to match SSR (no class on `<html>`). */
export function useHtmlDark() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains('dark'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return dark;
}

export function ThemeToggle({ transparent }: { transparent?: boolean }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE);
    const next = stored === 'dark';
    document.documentElement.classList.toggle('dark', next);
    setDark(next);
    setMounted(true);
  }, []);

  if (!mounted) return <span className="inline-block h-10 w-10" />;

  return (
    <button
      type="button"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${
        transparent ? 'text-warm-50/90 hover:bg-white/10' : 'text-foreground hover:bg-foreground/10'
      }`}
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle('dark', next);
        window.localStorage.setItem(STORAGE, next ? 'dark' : 'light');
      }}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
