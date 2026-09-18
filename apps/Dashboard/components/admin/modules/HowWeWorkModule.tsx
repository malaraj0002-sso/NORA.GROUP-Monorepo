'use client';

import { ListOrdered } from 'lucide-react';
import { useAdminData } from '@/lib/AdminDataContext';
import { GlassCard, SectionHeader, FieldLabel } from '../shared';
import { LanguageTabs, LocalizedInput } from '../LanguageTabs';
import { CmsNotice } from '@/components/admin/CmsNotice';
import { compactLocale, postCms } from '@/lib/cms-client';
import { Input } from '@/components/ui/input';
import { useUiI18n } from '@/lib/i18n/UiI18nProvider';

export function HowWeWorkModule() {
  const { data, source, updateHowWeWorkStep } = useAdminData();
  const { t } = useUiI18n();

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t('howWeWork.title')}
        subtitle={t('howWeWork.subtitle')}
        icon={ListOrdered}
        action={
          <CmsNotice
            onSave={async () => {
              const result = await postCms({
                resource: 'howWeWork',
                op: 'patch',
                data: {
                  steps: data.howWeWorkSteps.map((step) => ({
                    id: step.id,
                    number: step.number,
                    title: compactLocale(step.title),
                    description: compactLocale(step.description),
                  })),
                },
              });
              if (!result.ok) throw new Error(result.error);
            }}
          />
        }
      />
      {source === 'mock' || source === 'unavailable' ? (
        <p className="text-xs text-muted-foreground">{t('common.sanityDisconnected')}</p>
      ) : null}
      <div className="flex justify-end">
        <LanguageTabs />
      </div>
      {data.howWeWorkSteps.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('howWeWork.empty')}</p>
      ) : (
        data.howWeWorkSteps.map((step) => (
          <GlassCard key={step.id}>
            <FieldLabel>{t('howWeWork.stepNumber')}</FieldLabel>
            <Input
              value={step.number}
              onChange={(e) => updateHowWeWorkStep(step.id, { number: e.target.value })}
              className="mb-3 max-w-[8rem] bg-background/50"
            />
            <LocalizedInput value={step.title} onChange={(v) => updateHowWeWorkStep(step.id, { title: v })} label={t('field.title')} />
            <div className="mt-3">
              <LocalizedInput
                value={step.description}
                onChange={(v) => updateHowWeWorkStep(step.id, { description: v })}
                label={t('field.description')}
                textarea
              />
            </div>
          </GlassCard>
        ))
      )}
    </div>
  );
}
