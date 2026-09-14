'use client';

import { ThemeProvider } from 'next-themes';
import { AdminDataProvider } from '@/lib/AdminDataContext';
import type { AdminData } from '@/lib/types';
import type { ContentSource } from '@/lib/AdminDataContext';
import { UiI18nProvider } from '@/lib/i18n/UiI18nProvider';
import type { UiLang } from '@/lib/i18n/ui-lang';

export function AppProviders({
  children,
  initialData,
  source,
  initialUiLang,
}: {
  children: React.ReactNode;
  initialData: AdminData;
  source: ContentSource;
  initialUiLang: UiLang;
}) {
  return (
    <UiI18nProvider initialLang={initialUiLang}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AdminDataProvider initialData={initialData} source={source}>
          {children}
        </AdminDataProvider>
      </ThemeProvider>
    </UiI18nProvider>
  );
}
