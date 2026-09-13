'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useSite } from '@/components/providers/SiteProvider';
import {
  readCookieNoticeAccepted,
  writeCookieNoticeAccepted,
} from '@/lib/cookies/notice';

export function CookieNotice() {
  const { ui } = useSite();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!readCookieNoticeAccepted());
  }, []);

  useEffect(() => {
    document.body.style.paddingBottom = visible ? '7.5rem' : '';
    return () => {
      document.body.style.paddingBottom = '';
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={ui.cookies}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gold-500/25 bg-charcoal-950/95 text-warm-50 shadow-[0_-8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md"
    >
      <div className="container-luxury flex flex-col items-start justify-between gap-4 py-4 sm:flex-row sm:items-center">
        <p className="max-w-2xl text-sm leading-relaxed text-warm-50/85">
          {ui.cookieNotice}{' '}
          <Link href="/cookies" className="font-semibold text-gold-300 underline-offset-2 hover:underline">
            {ui.cookies}
          </Link>
        </p>
        <button
          type="button"
          onClick={() => {
            writeCookieNoticeAccepted();
            setVisible(false);
          }}
          className="min-h-11 shrink-0 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-gold-600 hover:to-gold-700 active:scale-[0.99]"
        >
          {ui.cookieAccept}
        </button>
      </div>
    </div>
  );
}
