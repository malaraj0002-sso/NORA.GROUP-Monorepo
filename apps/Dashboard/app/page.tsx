'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Menu } from 'lucide-react';
import { Sidebar, type AdminModule } from '@/components/admin/Sidebar';
import { LanguageProvider } from '@/components/admin/LanguageTabs';
import { OverviewModule } from '@/components/admin/modules/OverviewModule';
import { SiteModule } from '@/components/admin/modules/SiteModule';
import { HeroModule } from '@/components/admin/modules/HeroModule';
import { AboutModule } from '@/components/admin/modules/AboutModule';
import { ProjectsModule } from '@/components/admin/modules/ProjectsModule';
import { MaterialsModule } from '@/components/admin/modules/MaterialsModule';
import { ServicesModule } from '@/components/admin/modules/ServicesModule';
import { TestimonialsFaqModule } from '@/components/admin/modules/TestimonialsFaqModule';
import { BlogModule } from '@/components/admin/modules/BlogModule';
import { HomepageModule } from '@/components/admin/modules/HomepageModule';
import { HowWeWorkModule } from '@/components/admin/modules/HowWeWorkModule';
import { UsersModule } from '@/components/admin/modules/UsersModule';
import { TranslationModule } from '@/components/admin/modules/TranslationModule';
import { ThemeToggle } from '@/components/admin/ThemeToggle';
import { UserMenu } from '@/components/admin/UserMenu';
import { Input } from '@/components/ui/input';
import { useUiI18n } from '@/lib/i18n/UiI18nProvider';

export default function Home() {
  const [activeModule, setActiveModule] = useState<AdminModule>('overview');
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useUiI18n();

  const renderModule = () => {
    switch (activeModule) {
      case 'overview': return <OverviewModule onNavigate={setActiveModule} />;
      case 'homepage': return <HomepageModule />;
      case 'site': return <SiteModule />;
      case 'hero': return <HeroModule />;
      case 'about': return <AboutModule />;
      case 'howWeWork': return <HowWeWorkModule />;
      case 'projects': return <ProjectsModule />;
      case 'materials': return <MaterialsModule />;
      case 'services': return <ServicesModule />;
      case 'testimonials': return <TestimonialsFaqModule />;
      case 'blog': return <BlogModule />;
      case 'users': return <UsersModule />;
      case 'translation': return <TranslationModule />;
      default: return <OverviewModule onNavigate={setActiveModule} />;
    }
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background">
        <Sidebar
          active={activeModule}
          onSelect={setActiveModule}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />

        <div
          className="transition-all duration-300"
          style={{ marginInlineStart: collapsed ? 80 : 256 }}
        >
          <header className="sticky top-0 z-30 glass-strong border-b border-border/50 px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <button
                type="button"
                aria-label={t('chrome.toggleNav')}
                onClick={() => setCollapsed(!collapsed)}
                className="text-muted-foreground hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded-md"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden md:flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    aria-label={t('chrome.search')}
                    placeholder={t('chrome.search')}
                    className="ps-9 w-64 bg-background/50 border-border/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <ThemeToggle />
              <button
                type="button"
                aria-label={t('chrome.search')}
                className="relative text-muted-foreground hover:text-gold transition-colors p-2 rounded-lg hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-gold" />
              </button>
              <UserMenu />
            </div>
          </header>

          <main className="p-6 max-w-[1400px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderModule()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </LanguageProvider>
  );
}
