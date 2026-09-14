'use client';

import { FormEvent, useState } from 'react';
import { UiLangSwitcher } from '@/components/admin/UiLangSwitcher';
import { useUiI18n } from '@/lib/i18n/UiI18nProvider';

export default function LoginPage() {
  const { t } = useUiI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });
      const text = await response.text();
      if (text.trim()) {
        try {
          JSON.parse(text);
        } catch {
          setError(t('common.unexpected'));
          return;
        }
      }
      if (!response.ok) {
        setError(t('login.failed'));
        return;
      }
      window.location.assign('/');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-xl border border-border/50 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('login.title')}</h1>
            <p className="text-xs text-muted-foreground mt-1">{t('login.subtitle')}</p>
          </div>
        </div>
        <UiLangSwitcher />
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">{t('login.email')}</span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">{t('login.password')}</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </label>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full h-10 rounded-md bg-gold/20 text-gold border border-gold/30 text-sm font-medium disabled:opacity-50"
        >
          {pending ? t('login.pending') : t('login.submit')}
        </button>
      </form>
    </div>
  );
}
