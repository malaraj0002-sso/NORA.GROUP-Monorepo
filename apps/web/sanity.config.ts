'use client';

import { DashboardIcon } from '@sanity/icons';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { apiVersion, dataset, projectId } from './sanity/env';
import { Overview } from './sanity/overview/Overview';
import { schemaTypes } from './sanity/schemaTypes';
import { structure } from './sanity/structure';
import { noraStudioTheme } from './sanity/theme';

/**
 * Embedded Studio at /studio.
 * LazaCore footer credit is hardcoded in the Next.js site — not editable here.
 */
export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  title: 'Nora Group',
  theme: noraStudioTheme,
  schema: { types: schemaTypes },
  plugins: [
    structureTool({ name: 'structure', title: 'المحتوى', structure }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  tools: (prev) => {
    const overview = {
      name: 'overview',
      title: 'نظرة عامة',
      icon: DashboardIcon,
      component: Overview,
    };
    const rest =
      process.env.NODE_ENV === 'production' ? prev.filter((tool) => tool.name !== 'vision') : prev;
    return [overview, ...rest];
  },
});
