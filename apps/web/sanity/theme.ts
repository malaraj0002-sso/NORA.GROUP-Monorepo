import { buildLegacyTheme } from 'sanity';

/** Dark gold Studio chrome — matches the Nora Group site. */
export const noraStudioTheme = buildLegacyTheme({
  '--black': '#0c0c0c',
  '--white': '#f7f4ea',
  '--gray': '#8a8680',
  '--gray-base': '#6b6560',
  '--component-bg': '#141414',
  '--component-text-color': '#f7f4ea',
  '--brand-primary': '#cda845',
  '--default-button-color': '#3a3a3a',
  '--default-button-primary-color': '#cda845',
  '--main-navigation-color': '#0c0c0c',
  '--main-navigation-color--inverted': '#f7f4ea',
  '--focus-color': '#cda845',
});
