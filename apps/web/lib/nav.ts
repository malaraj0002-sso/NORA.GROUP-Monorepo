import type { NavLabels } from '@/lib/content/types';

export type NavLink = { href: string; label: string };

export type NavVisibility = {
  showMaterials: boolean;
  showTestimonials: boolean;
  showBlog: boolean;
  showFaq: boolean;
};

/** Full IA — used by footer and the mobile menu. */
export function getSiteNavLinks(nav: NavLabels, visibility: NavVisibility): NavLink[] {
  return [
    { href: '/', label: nav.home },
    { href: '/about', label: nav.about },
    { href: '/services', label: nav.services },
    { href: '/projects', label: nav.projects },
    ...(visibility.showMaterials ? [{ href: '/materials', label: nav.materials }] : []),
    { href: '/how-we-work', label: nav.howWeWork },
    ...(visibility.showTestimonials ? [{ href: '/testimonials', label: nav.testimonials }] : []),
    ...(visibility.showBlog ? [{ href: '/blog', label: nav.blog }] : []),
    ...(visibility.showFaq ? [{ href: '/faq', label: nav.faq }] : []),
    { href: '/contact', label: nav.contact },
  ];
}

const DESKTOP_HREFS = new Set([
  '/',
  '/about',
  '/services',
  '/projects',
  '/materials',
  '/how-we-work',
  '/contact',
]);

/** Core links that fit the header; hidden collections stay in the mobile/footer lists. */
export function getDesktopNavLinks(nav: NavLabels, visibility: NavVisibility): NavLink[] {
  return getSiteNavLinks(nav, visibility).filter((link) => DESKTOP_HREFS.has(link.href));
}
