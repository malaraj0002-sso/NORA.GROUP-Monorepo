'use client';

import { Home } from 'lucide-react';
import { useAdminData } from '@/lib/AdminDataContext';
import { GlassCard, SectionHeader } from '../shared';
import { LanguageTabs, LocalizedInput } from '../LanguageTabs';
import { CmsNotice } from '@/components/admin/CmsNotice';
import { compactLocale, postCms } from '@/lib/cms-client';
import { useUiI18n } from '@/lib/i18n/UiI18nProvider';

export function HomepageModule() {
  const { data, source, updateHomePage } = useAdminData();
  const { homePage } = data;
  const { t } = useUiI18n();

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t('homepage.title')}
        subtitle={t('homepage.subtitle')}
        icon={Home}
        action={
          <CmsNotice
            onSave={async () => {
              const result = await postCms({
                resource: 'homepage',
                op: 'patch',
                data: {
                  heroTitle: compactLocale(homePage.heroTitle),
                  heroSubtitle: compactLocale(homePage.heroSubtitle),
                  introTitle: compactLocale(homePage.introTitle),
                  introDescription: compactLocale(homePage.introDescription),
                  ctaTitle: compactLocale(homePage.ctaTitle),
                  ctaSubtitle: compactLocale(homePage.ctaSubtitle),
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
      <GlassCard>
        <LocalizedInput value={homePage.heroTitle} onChange={(v) => updateHomePage({ heroTitle: v })} label={t('field.heroTitle')} />
        <div className="mt-4">
          <LocalizedInput value={homePage.heroSubtitle} onChange={(v) => updateHomePage({ heroSubtitle: v })} label={t('field.heroSubtitle')} textarea />
        </div>
      </GlassCard>
      <GlassCard>
        <LocalizedInput value={homePage.introTitle} onChange={(v) => updateHomePage({ introTitle: v })} label={t('field.introTitle')} />
        <div className="mt-4">
          <LocalizedInput value={homePage.introDescription} onChange={(v) => updateHomePage({ introDescription: v })} label={t('field.introDescription')} textarea />
        </div>
      </GlassCard>
      <GlassCard>
        <LocalizedInput value={homePage.ctaTitle} onChange={(v) => updateHomePage({ ctaTitle: v })} label={t('field.ctaTitle')} />
        <div className="mt-4">
          <LocalizedInput value={homePage.ctaSubtitle} onChange={(v) => updateHomePage({ ctaSubtitle: v })} label={t('field.ctaSubtitle')} textarea />
        </div>
      </GlassCard>
    </div>
  );
}
