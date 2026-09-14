'use client';

import { useState } from 'react';
import { useUiI18n } from '@/lib/i18n/UiI18nProvider';

export function CmsNotice({
  onSave,
  label,
}: {
  onSave: () => Promise<void> | void;
  label?: string;
}) {
  const { t } = useUiI18n();
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState(false);
  const saveLabel = label ?? t('common.saveSanity');

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setStatus('');
          try {
            await onSave();
            setStatus(t('common.saved'));
          } catch (e) {
            setStatus(e instanceof Error ? e.message : t('common.saveFailed'));
          } finally {
            setPending(false);
          }
        }}
        className="h-9 px-3 rounded-md bg-gold/20 text-gold border border-gold/30 text-xs font-medium disabled:opacity-50"
      >
        {pending ? t('common.saving') : saveLabel}
      </button>
      {status ? <span className="text-xs text-muted-foreground">{status}</span> : null}
    </div>
  );
}
