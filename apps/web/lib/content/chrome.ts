import type { AppLocale, ServiceSlug } from '@/lib/constants';
import type { NavLabels, SiteContent, SiteSettings } from '@/lib/content/types';
import { t } from '@/lib/i18n/locale';

/**
 * Chrome-only slice for Header/Footer/WhatsApp.
 * Keeps the full SiteContent blob out of the client layout tree.
 */
export type SiteChrome = {
  locale: AppLocale;
  settings: SiteSettings;
  nav: NavLabels;
  ui: SiteContent['ui'][AppLocale];
  services: { slug: ServiceSlug; title: string }[];
  ctaSubtitle: string;
  showMaterials: boolean;
  showTestimonials: boolean;
  showBlog: boolean;
  showFaq: boolean;
};

export function toChrome(content: SiteContent, locale: AppLocale): SiteChrome {
  return {
    locale,
    settings: content.settings,
    nav: content.nav[locale],
    ui: content.ui[locale],
    services: content.services
      .filter((s) => s.visible)
      .map((s) => ({ slug: s.slug, title: t(s.title, locale) })),
    ctaSubtitle: t(content.home.ctaSubtitle, locale),
    showMaterials: content.materials.some((m) => m.visible),
    showTestimonials: content.testimonials.some((x) => x.visible),
    showBlog: content.blogPosts.some((b) => b.visible),
    showFaq: content.faq.some((f) => f.visible),
  };
}
