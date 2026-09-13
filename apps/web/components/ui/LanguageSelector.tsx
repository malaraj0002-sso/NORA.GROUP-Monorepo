'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { LOCALES, LOCALE_META, type AppLocale } from '@/lib/constants';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';

export function LanguageSelector({ light = false }: { light?: boolean }) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex min-h-11 min-w-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          light
            ? 'text-warm-50/90 hover:bg-white/10 hover:text-warm-50'
            : 'text-charcoal-700 hover:bg-charcoal-100'
        }`}
        aria-label="Language"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{LOCALE_META[locale].label}</span>
      </button>
      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 min-w-[150px] rounded-lg border border-charcoal-100 bg-white py-2 shadow-xl">
          {LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                router.replace(pathname, { locale: code });
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-charcoal-800 hover:bg-warm-100"
            >
              <span>{LOCALE_META[code].label}</span>
              {locale === code && <Check className="h-4 w-4 text-gold-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
