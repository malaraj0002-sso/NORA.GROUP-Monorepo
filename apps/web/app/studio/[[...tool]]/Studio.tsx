'use client';

import { NextStudio } from 'next-sanity/studio';
import config from '@/sanity.config';
import { projectId } from '@/sanity/env';

/** Client-only Studio mount — never evaluate Sanity plugins during SSR. */
export default function Studio() {
  if (!projectId) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0c0c0c', color: '#cda845', fontFamily: 'system-ui, sans-serif' }}>
        Studio is not configured. Set NEXT_PUBLIC_SANITY_PROJECT_ID.
      </div>
    );
  }
  return <NextStudio config={config} />;
}
