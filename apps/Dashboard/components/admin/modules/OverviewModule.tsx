'use client';

import { motion } from 'framer-motion';
import {
  FolderKanban, Layers, Wrench, FileText, MessageSquare,
  Image, Info, Settings, TrendingUp, Eye, CheckCircle2, Clock,
} from 'lucide-react';
import { useAdminData } from '@/lib/AdminDataContext';
import { GlassCard } from '../shared';
import type { AdminModule } from '../Sidebar';
import { useUiI18n } from '@/lib/i18n/UiI18nProvider';
import type { MessageKey } from '@/lib/i18n/messages';

export function OverviewModule({ onNavigate }: { onNavigate: (m: AdminModule) => void }) {
  const { data, source } = useAdminData();
  const { t } = useUiI18n();

  const stats: { labelKey: MessageKey; value: number; published: number; icon: typeof FolderKanban; module: AdminModule }[] = [
    { labelKey: 'nav.projects', value: data.projects.length, published: data.projects.filter(p => p.published).length, icon: FolderKanban, module: 'projects' },
    { labelKey: 'nav.materials', value: data.materials.length, published: data.materials.filter(m => m.published).length, icon: Layers, module: 'materials' },
    { labelKey: 'nav.services', value: data.services.length, published: data.services.filter(s => s.published).length, icon: Wrench, module: 'services' },
    { labelKey: 'overview.blogPosts', value: data.blogPosts.length, published: data.blogPosts.filter(b => b.published).length, icon: FileText, module: 'blog' },
    { labelKey: 'nav.testimonials', value: data.testimonials.length, published: data.testimonials.filter(x => x.published).length, icon: MessageSquare, module: 'testimonials' },
    { labelKey: 'overview.heroSlides', value: data.heroSlides.length, published: data.heroSlides.filter(h => h.published).length, icon: Image, module: 'hero' },
  ];

  const quickLinks: { labelKey: MessageKey; icon: typeof Settings; module: AdminModule }[] = [
    { labelKey: 'nav.site', icon: Settings, module: 'site' },
    { labelKey: 'overview.aboutUs', icon: Info, module: 'about' },
    { labelKey: 'nav.projects', icon: FolderKanban, module: 'projects' },
    { labelKey: 'nav.materials', icon: Layers, module: 'materials' },
    { labelKey: 'nav.services', icon: Wrench, module: 'services' },
    { labelKey: 'nav.blog', icon: FileText, module: 'blog' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-playfair), serif' }}>
          {t('overview.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('overview.welcome')}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {source === 'postgres'
            ? t('overview.sourcePostgres')
            : source === 'sanity'
              ? t('overview.sourceSanity')
              : source === 'unavailable'
                ? t('overview.sourceUnavailable')
                : t('overview.sourceMock')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.labelKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard hover className="cursor-pointer">
                <div onClick={() => onNavigate(stat.module)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 border border-gold/20">
                      <Icon className="h-4 w-4 text-gold" />
                    </div>
                    <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">{t(stat.labelKey)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle2 className="h-3 w-3 text-chart-2" />
                    <span className="text-[10px] text-muted-foreground">{t('overview.publishedCount', { n: stat.published })}</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gold" />
            {t('overview.quickActions')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.labelKey}
                  type="button"
                  onClick={() => onNavigate(link.module)}
                  className="flex flex-col items-center gap-2 rounded-lg glass p-4 hover:border-gold/20 hover:bg-gold/5 transition-all"
                >
                  <Icon className="h-6 w-6 text-gold/70" />
                  <span className="text-xs text-muted-foreground">{t(link.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4 text-gold" />
            {t('overview.siteStatus')}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('overview.siteName')}</span>
              <span className="text-sm font-medium text-foreground">{data.siteSettings.siteName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('overview.navItems')}</span>
              <span className="text-sm font-medium text-foreground">{data.siteSettings.navItems.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('overview.socialLinks')}</span>
              <span className="text-sm font-medium text-foreground">{data.siteSettings.socialLinks.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('overview.faqItems')}</span>
              <span className="text-sm font-medium text-foreground">{data.faqs.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('overview.featuredProjects')}</span>
              <span className="text-sm font-medium text-gold">{data.projects.filter(p => p.featured).length}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {t('overview.lastUpdated')}
              </span>
              <span className="text-xs text-foreground">{t('common.justNow')}</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
