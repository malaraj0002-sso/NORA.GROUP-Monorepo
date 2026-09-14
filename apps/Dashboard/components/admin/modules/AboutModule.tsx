'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Info, Award, Leaf, Users, Clock, Star, Heart, Shield, Zap, Sparkles } from 'lucide-react';
import { useAdminData } from '@/lib/AdminDataContext';
import { GlassCard, SectionHeader, FieldLabel, AddButton, DeleteButton, ItemRow } from '../shared';
import { LocalizedInput, LanguageTabs } from '../LanguageTabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CmsNotice } from '@/components/admin/CmsNotice';
import { compactLocale, postCms } from '@/lib/cms-client';
import { useUiI18n } from '@/lib/i18n/UiI18nProvider';

const ICON_OPTIONS = [
  { value: 'award', label: 'Award', icon: Award },
  { value: 'leaf', label: 'Leaf', icon: Leaf },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'clock', label: 'Clock', icon: Clock },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'shield', label: 'Shield', icon: Shield },
  { value: 'zap', label: 'Zap', icon: Zap },
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
];

function getIcon(name: string) {
  return ICON_OPTIONS.find((o) => o.value === name)?.icon || Award;
}

export function AboutModule() {
  const { data, updateAboutSettings, addAboutFeature, updateAboutFeature, deleteAboutFeature } = useAdminData();
  const { aboutSettings } = data;
  const { t } = useUiI18n();

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t('about.title')}
        subtitle={t('about.subtitle')}
        icon={Info}
        action={
          <CmsNotice
            onSave={async () => {
              const result = await postCms({
                resource: 'about',
                op: 'patch',
                data: { story: compactLocale(aboutSettings.story) },
              });
              if (!result.ok) throw new Error(result.error);
            }}
          />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">{t('about.story')}</h3>
            <LanguageTabs />
          </div>
          <LocalizedInput
            value={aboutSettings.story}
            onChange={(v) => updateAboutSettings({ story: v })}
            textarea
          />
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">{t('about.vision')}</h3>
            <LanguageTabs />
          </div>
          <LocalizedInput
            value={aboutSettings.vision}
            onChange={(v) => updateAboutSettings({ vision: v })}
            textarea
          />
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">{t('about.mission')}</h3>
          <LanguageTabs />
        </div>
        <LocalizedInput
          value={aboutSettings.mission}
          onChange={(v) => updateAboutSettings({ mission: v })}
          textarea
        />
      </GlassCard>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">{t('about.banners')}</h3>
          <AddButton onClick={addAboutFeature} label={t('about.addFeature')} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {aboutSettings.featureBanners.map((feature) => {
              const Icon = getIcon(feature.icon);
              return (
                <ItemRow key={feature.id}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 border border-gold/20">
                          <Icon className="h-4 w-4 text-gold" />
                        </div>
                        <Select value={feature.icon} onValueChange={(v) => updateAboutFeature(feature.id, { icon: v })}>
                          <SelectTrigger className="w-36 h-8 bg-background/50 text-xs">
                            <SelectValue placeholder={t('field.icon')} />
                          </SelectTrigger>
                          <SelectContent>
                            {ICON_OPTIONS.map((opt) => {
                              const OptIcon = opt.icon;
                              return (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <div className="flex items-center gap-2">
                                    <OptIcon className="h-3 w-3" /> {opt.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <DeleteButton onClick={() => deleteAboutFeature(feature.id)} />
                    </div>
                    <div className="flex items-center justify-end">
                      <LanguageTabs />
                    </div>
                    <LocalizedInput
                      value={feature.title}
                      onChange={(v) => updateAboutFeature(feature.id, { title: v })}
                      label={t('field.title')}
                    />
                    <LocalizedInput
                      value={feature.description}
                      onChange={(v) => updateAboutFeature(feature.id, { description: v })}
                      label={t('field.description')}
                      textarea
                    />
                  </div>
                </ItemRow>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
