'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Languages } from 'lucide-react';
import { GlassCard, SectionHeader } from '../shared';
import { useUiI18n } from '@/lib/i18n/UiI18nProvider';

type Review = {
  id: string;
  sourceLang: string;
  target: string;
  sourceText: string;
  translatedText: string;
  resource: string;
  field: string;
  documentId: string;
  status: string;
};

export function TranslationModule() {
  const { t } = useUiI18n();
  const [items, setItems] = useState<Review[]>([]);
  const [error, setError] = useState('');
  const [sourceLang, setSourceLang] = useState('he');
  const [target, setTarget] = useState('en');
  const [text, setText] = useState('');
  const [resource, setResource] = useState('project');
  const [field, setField] = useState('title');
  const [documentId, setDocumentId] = useState('');

  async function load() {
    const response = await fetch('/api/translate');
    const text = await response.text();
    let payload: { items?: Review[]; error?: string } = {};
    if (text.trim()) {
      try {
        payload = JSON.parse(text) as { items?: Review[]; error?: string };
      } catch {
        setError(t('translation.loadFailed'));
        return;
      }
    }
    if (!response.ok) {
      setError(t('translation.loadFailed'));
      return;
    }
    setItems(payload.items || []);
    setError('');
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceLang,
        targets: [target],
        text,
        resource,
        field,
        documentId,
      }),
    });
    if (!response.ok) {
      setError(t('translation.failed'));
      return;
    }
    setText('');
    await load();
  }

  async function setStatus(id: string, status: 'applied' | 'rejected') {
    const response = await fetch('/api/translate', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (!response.ok) {
      setError(t('translation.updateFailed'));
      return;
    }
    await load();
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t('translation.title')}
        subtitle={t('translation.subtitle')}
        icon={Languages}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <GlassCard>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid md:grid-cols-4 gap-3">
            <label className="text-xs">
              {t('translation.source')}
              <select className="mt-1 w-full h-10 rounded-md border border-input bg-background px-2" value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                <option value="he">{t('lang.he')}</option>
                <option value="ar">{t('lang.ar')}</option>
                <option value="en">{t('lang.en')}</option>
              </select>
            </label>
            <label className="text-xs">
              {t('translation.target')}
              <select className="mt-1 w-full h-10 rounded-md border border-input bg-background px-2" value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="en">{t('lang.en')}</option>
                <option value="ar">{t('lang.ar')}</option>
                <option value="he">{t('lang.he')}</option>
              </select>
            </label>
            <label className="text-xs">
              {t('translation.resource')}
              <input className="mt-1 w-full h-10 rounded-md border border-input bg-background px-2" value={resource} onChange={(e) => setResource(e.target.value)} />
            </label>
            <label className="text-xs">
              {t('translation.documentId')}
              <input className="mt-1 w-full h-10 rounded-md border border-input bg-background px-2" value={documentId} onChange={(e) => setDocumentId(e.target.value)} />
            </label>
          </div>
          <label className="text-xs block">
            {t('translation.field')}
            <input className="mt-1 w-full h-10 rounded-md border border-input bg-background px-2" value={field} onChange={(e) => setField(e.target.value)} />
          </label>
          <textarea
            required
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('translation.placeholder')}
          />
          <button type="submit" className="h-9 px-3 rounded-md bg-gold/20 text-gold border border-gold/30 text-xs">
            {t('translation.createDraft')}
          </button>
        </form>
      </GlassCard>
      {items.map((item) => (
        <GlassCard key={item.id}>
          <p className="text-xs text-muted-foreground">
            {item.sourceLang} → {item.target} · {item.resource}/{item.field}
          </p>
          <p className="text-sm mt-2 whitespace-pre-wrap">{item.sourceText}</p>
          <p className="text-sm mt-2 text-gold whitespace-pre-wrap">{item.translatedText}</p>
          <div className="flex gap-2 mt-3">
            <button type="button" className="text-xs" onClick={() => setStatus(item.id, 'applied')}>
              {t('translation.markReviewed')}
            </button>
            <button type="button" className="text-xs text-destructive" onClick={() => setStatus(item.id, 'rejected')}>
              {t('translation.reject')}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            {t('translation.reviewNote')}
          </p>
        </GlassCard>
      ))}
    </div>
  );
}
