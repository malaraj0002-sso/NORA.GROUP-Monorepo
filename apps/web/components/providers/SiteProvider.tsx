'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { SiteChrome } from '@/lib/content/chrome';

const SiteContext = createContext<SiteChrome | null>(null);

export function SiteProvider({
  chrome,
  children,
}: {
  chrome: SiteChrome;
  children: ReactNode;
}) {
  return <SiteContext.Provider value={chrome}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteChrome {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}
