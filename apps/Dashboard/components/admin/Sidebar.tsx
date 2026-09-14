'use client';

import { motion } from 'framer-motion';
import {
  LayoutDashboard, Settings, Image, Info, FolderKanban, Layers,
  Wrench, MessageSquare, FileText, Hammer, ChevronLeft, Home, ListOrdered, Users, Languages,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminData } from '@/lib/AdminDataContext';
import { useUiI18n } from '@/lib/i18n/UiI18nProvider';
import type { MessageKey } from '@/lib/i18n/messages';

export type AdminModule =
  | 'overview'
  | 'site'
  | 'hero'
  | 'homepage'
  | 'about'
  | 'howWeWork'
  | 'projects'
  | 'materials'
  | 'services'
  | 'testimonials'
  | 'blog'
  | 'users'
  | 'translation';

const NAV_ITEMS: { id: AdminModule; labelKey: MessageKey; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', labelKey: 'nav.overview', icon: LayoutDashboard },
  { id: 'homepage', labelKey: 'nav.homepage', icon: Home },
  { id: 'site', labelKey: 'nav.site', icon: Settings },
  { id: 'hero', labelKey: 'nav.hero', icon: Image },
  { id: 'about', labelKey: 'nav.about', icon: Info },
  { id: 'howWeWork', labelKey: 'nav.howWeWork', icon: ListOrdered },
  { id: 'projects', labelKey: 'nav.projects', icon: FolderKanban },
  { id: 'materials', labelKey: 'nav.materials', icon: Layers },
  { id: 'services', labelKey: 'nav.services', icon: Wrench },
  { id: 'testimonials', labelKey: 'nav.testimonials', icon: MessageSquare },
  { id: 'blog', labelKey: 'nav.blog', icon: FileText },
  { id: 'translation', labelKey: 'nav.translation', icon: Languages },
  { id: 'users', labelKey: 'nav.users', icon: Users },
];

export function Sidebar({
  active,
  onSelect,
  collapsed,
  onToggleCollapse,
}: {
  active: AdminModule;
  onSelect: (id: AdminModule) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const { data } = useAdminData();
  const { t } = useUiI18n();

  return (
    <aside
      className={cn(
        'fixed start-0 top-0 z-40 h-screen glass-strong border-e border-border/50 transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 px-4 py-6 border-b border-border/50">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30">
            <Hammer className="h-5 w-5 text-gold" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-foreground whitespace-nowrap" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                {data.siteSettings.siteName}
              </h1>
              <p className="text-[10px] text-gold/70 whitespace-nowrap">{t('chrome.adminSubtitle')}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto luxury-scroll px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all w-full text-start',
                  isActive
                    ? 'text-gold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-gold/10 border border-gold/20"
                    transition={{ type: 'spring', duration: 0.3 }}
                  />
                )}
                <Icon className="h-5 w-5 shrink-0 relative z-10" />
                {!collapsed && <span className="relative z-10 whitespace-nowrap">{t(item.labelKey)}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border/50 p-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-gold transition-colors w-full text-start"
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 shrink-0 transition-transform',
                collapsed ? 'rotate-180 rtl:rotate-0' : 'rtl:rotate-180'
              )}
            />
            {!collapsed && <span>{t('nav.collapse')}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
