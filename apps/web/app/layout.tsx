import type { ReactNode } from 'react';

/**
 * Root layout — locale routes set their own <html>/<body> in [locale]/layout,
 * and Studio sets its own in studio/layout. Keep this passthrough so Studio
 * does not inherit the marketing-site Chrome or globals.css.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
} 
