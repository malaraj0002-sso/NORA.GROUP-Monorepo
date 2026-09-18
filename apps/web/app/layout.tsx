import type { ReactNode } from 'react';

/**
 * Root layout — locale routes set their own <html>/<body> in [locale]/layout.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
} 
