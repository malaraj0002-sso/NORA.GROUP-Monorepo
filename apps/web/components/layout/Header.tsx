'use client';

import { useEffect, useState } from 'react';
import { Menu, MessageCircle, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { BrandLockup } from '@/components/layout/BrandLockup';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ThemeToggle, useHtmlDark } from '@/components/ui/ThemeToggle';
import { useSite } from '@/components/providers/SiteProvider';
import { getWhatsAppLink } from '@/lib/contact';
import { logoSrc } from '@/lib/content/media';
import { t } from '@/lib/i18n/locale';
import { getDesktopNavLinks, getSiteNavLinks } from '@/lib/nav';

export function Header() {
  const pathname = usePathname();
  const chrome = useSite();
  const { locale, nav, settings } = chrome;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dark = useHtmlDark();

  const isHome = pathname === '/';
  const transparent = isHome && !scrolled;
  const visibility = {
    showMaterials: chrome.showMaterials,
    showTestimonials: chrome.showTestimonials,
    showBlog: chrome.showBlog,
    showFaq: chrome.showFaq,
  };
  const desktopItems = getDesktopNavLinks(nav, visibility);
  const mobileItems = getSiteNavLinks(nav, visibility);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const whatsapp = getWhatsAppLink(settings.whatsappE164, t(settings.whatsappMessage, locale));
  const logo = logoSrc(
    transparent || menuOpen || dark ? settings.logoDarkUrl || settings.logoUrl : settings.logoUrl,
  );

  const linkClass = (href: string) =>
    `relative z-10 whitespace-nowrap rounded-lg px-2.5 py-2.5 text-sm font-semibold transition-colors ${
      transparent
        ? 'text-warm-50/90 hover:bg-white/10 hover:text-warm-50'
        : 'text-foreground hover:bg-foreground/10 hover:text-foreground'
    } ${pathname === href ? (transparent ? 'text-warm-50' : 'text-foreground') : ''}`;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          transparent
            ? 'bg-gradient-to-b from-black/60 via-black/20 to-transparent'
            : 'border-b border-border bg-background/95 shadow-sm backdrop-blur-md'
        }`}
      >
        <div className="container-luxury grid h-20 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:h-24 sm:gap-4">
          
          <div className="relative z-20 flex shrink-0 items-center py-2">
            <BrandLockup
              logoUrl={logo}
              brandName={settings.brandName}
              variant={transparent ? 'transparent' : 'light'}
            />
          </div>

          <nav className="relative z-10 hidden min-w-0 items-center justify-center gap-1 xl:flex">
            {desktopItems.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="relative z-20 flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageSelector light={transparent} />
            <ThemeToggle transparent={transparent} />
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp hidden !min-h-12 !px-4 !py-2.5 text-base 2xl:inline-flex"
            >
              <MessageCircle className="h-5 w-5" />
              {nav.whatsapp}
            </a>
            <button
              type="button"
              className={`inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg xl:hidden ${
                transparent ? 'text-warm-50' : 'text-foreground'
              }`}
              onClick={() => setMenuOpen(true)}
              aria-label="Menu"
            >
              <Menu className="h-7 w-7" />
            </button>
          </div>
        </div>
      </header>

      {/* القائمة الجانبية في الشاشات الصغيرة */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-charcoal-950/95 text-warm-50 xl:hidden">
          <div className="container-luxury flex h-20 items-center justify-between sm:h-24">
            <div className="flex items-center">
              <BrandLockup
                logoUrl={logo}
                brandName={settings.brandName}
                variant="dark"
              />
            </div>
            <button
              type="button"
              className="inline-flex min-h-12 min-w-12 items-center justify-center"
              onClick={() => setMenuOpen(false)}
              aria-label="Close"
            >
              <X className="h-7 w-7" />
            </button>
          </div>
          <nav className="container-luxury flex flex-col gap-2 pb-10 pt-4">
            {mobileItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-3.5 text-xl font-medium hover:bg-white/10"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-6 flex flex-col gap-3">
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-whatsapp w-full !py-3 text-lg">
                <MessageCircle className="h-6 w-6" />
                {nav.whatsapp}
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}