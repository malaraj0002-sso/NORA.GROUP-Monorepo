'use client';

import { NextStudio } from 'next-sanity/studio';
import config from '@/sanity.config';

/** Client-only Studio mount — never evaluate Sanity plugins during SSR. */
export default function Studio() {
  return <NextStudio config={config} />;
}
