import { localeString, localeText } from './localeString';
import { siteSettings } from './siteSettings';
import { homePage } from './homePage';
import { aboutPage, howWeWorkPage, contactPage, uiLabels } from './pages';
import { service } from './service';
import { project } from './project';
import { material } from './material';
import { testimonial } from './testimonial';
import { blogPost } from './blogPost';
import { faqItem } from './faqItem';

export const schemaTypes = [
  localeString,
  localeText,
  siteSettings,
  homePage,
  aboutPage,
  howWeWorkPage,
  contactPage,
  uiLabels,
  service,
  project,
  material,
  testimonial,
  blogPost,
  faqItem,
];
