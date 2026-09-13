import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import {
  metadata as studioMetadata,
  viewport as studioViewport,
} from 'next-sanity/studio';

export const metadata: Metadata = {
  ...studioMetadata,
  title: 'Nora Group Studio',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  ...studioViewport,
  interactiveWidget: 'resizes-content',
};

/**
 * Isolated document shell for Studio — no site Header/Footer/Tailwind globals.
 */
export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
