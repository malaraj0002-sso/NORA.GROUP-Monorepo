'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { GlassCard, SectionHeader } from '../shared';
import { useUiI18n } from '@/lib/i18n/UiI18nProvider';
import type { MessageKey } from '@/lib/i18n/messages';

type UserRow = { id: string; email: string; role: string; enabled: boolean };

const ROLE_KEYS: Record<string, MessageKey> = {
  owner: 'role.owner',
  admin: 'role.admin',
  editor: 'role.editor',
  employee: 'role.employee',
};

export function UsersModule() {
  const { t } = useUiI18n();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('editor');

  async function load() {
    const response = await fetch('/api/users');
    const text = await response.text();
    let payload: { users?: UserRow[]; error?: string } = {};
    if (text.trim()) {
      try {
        payload = JSON.parse(text) as { users?: UserRow[]; error?: string };
      } catch {
        setError(t('users.loadFailed'));
        return;
      }
    }
    if (!response.ok) {
      setError(t('users.loadFailed'));
      return;
    }
    setUsers(payload.users || []);
    setError('');
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    if (!response.ok) {
      setError(t('users.createFailed'));
      return;
    }
    setEmail('');
    setPassword('');
    await load();
  }

  async function patchUser(id: string, body: { enabled?: boolean; role?: string }) {
    const response = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...body }),
    });
    if (!response.ok) {
      setError(t('users.updateFailed'));
      return;
    }
    await load();
  }

  return (
    <div className="space-y-6">
      <SectionHeader title={t('users.title')} subtitle={t('users.subtitle')} icon={Users} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <GlassCard>
        <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-4 items-end">
          <label className="text-xs space-y-1">
            {t('login.email')}
            <input className="w-full h-10 rounded-md border border-input bg-background px-3" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="text-xs space-y-1">
            {t('users.tempPassword')}
            <input className="w-full h-10 rounded-md border border-input bg-background px-3" type="password" minLength={10} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label className="text-xs space-y-1">
            {t('users.role')}
            <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="admin">{t('role.admin')}</option>
              <option value="editor">{t('role.editor')}</option>
              <option value="employee">{t('role.employee')}</option>
            </select>
          </label>
          <button type="submit" className="h-10 rounded-md bg-gold/20 text-gold border border-gold/30 text-sm">
            {t('users.create')}
          </button>
        </form>
        <p className="text-[11px] text-muted-foreground mt-2">{t('users.fileNote')}</p>
      </GlassCard>
      <GlassCard>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-start text-muted-foreground">
              <th className="py-2 text-start">{t('login.email')}</th>
              <th className="text-start">{t('users.role')}</th>
              <th className="text-start">{t('users.status')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-border/40">
                <td className="py-2">{user.email}</td>
                <td>{t(ROLE_KEYS[user.role] ?? 'role.editor')}</td>
                <td>{user.enabled ? t('common.enabled') : t('common.disabled')}</td>
                <td className="text-end">
                  {user.id !== 'env-owner' ? (
                    <button
                      type="button"
                      className="text-xs text-gold"
                      onClick={() => patchUser(user.id, { enabled: !user.enabled })}
                    >
                      {user.enabled ? t('users.disable') : t('users.enable')}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('users.envOwner')}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
