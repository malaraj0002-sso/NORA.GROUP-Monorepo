'use client';

import dynamic from 'next/dynamic';

/**
 * Load Studio only in the browser. SSR of Sanity's plugin graph hangs
 * the Next 15 dev server on this machine.
 */
const Studio = dynamic(() => import('./Studio'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'Cairo, system-ui, sans-serif',
        background: '#0c0c0c',
        color: '#cda845',
      }}
    >
      Nora Group Studio…
    </div>
  ),
});

export default function StudioPage() {
  return <Studio />;
}
