'use client';

import { UiLangSwitcher } from '@/components/admin/UiLangSwitcher';
import { useUiI18n } from '@/lib/i18n/UiI18nProvider';

export function UserMenu() {
  const { t } = useUiI18n();

  return (
    <details className="relative">
      <summary
        className="flex items-center gap-2 ps-3 border-s border-border/50 cursor-pointer list-none rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 [&::-webkit-details-marker]:hidden"
        aria-label={t('chrome.admin')}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gold/30 to-gold/5 border border-gold/30 text-gold text-xs font-bold">
          N
        </div>
        <div className="hidden sm:block text-start">
          <p className="text-xs font-medium text-foreground">{t('chrome.admin')}</p>
          <p className="text-[10px] text-muted-foreground">Nora Group</p>
        </div>
      </summary>
      <div className="absolute end-0 mt-2 w-56 rounded-lg border border-border/50 bg-background p-3 shadow-lg z-50 space-y-3">
        <UiLangSwitcher />
        <button
          type="button"
          className="w-full text-start text-xs text-muted-foreground hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded-md py-1"
          onClick={async () => {
            await fetch('/api/auth/logout', {
              method: 'POST',
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json' },
              body: '{}',
            });
            window.location.assign('/login');
          }}
        >
          {t('chrome.signOut')}
        </button>
      </div>
    </details>
  );
}
