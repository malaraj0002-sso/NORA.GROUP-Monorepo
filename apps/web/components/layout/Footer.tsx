'use client';

import Image from 'next/image';
import { Mail, MapPin, MessageCircle, Sparkles, Code2 } from 'lucide-react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { BrandLockup } from '@/components/layout/BrandLockup';
import { useSite } from '@/components/providers/SiteProvider';
import { LAZACORE, LOCALES, LOCALE_META } from '@/lib/constants';
import { getMailtoLink, getWhatsAppLink } from '@/lib/contact';
import { logoSrc, mediaSrc } from '@/lib/content/media';
import { t } from '@/lib/i18n/locale';
import { getSiteNavLinks } from '@/lib/nav';

export function Footer() {
  const chrome = useSite();
  const { locale, nav, ui, settings } = chrome;
  const router = useRouter();
  const pathname = usePathname();

  const logo = logoSrc(settings.logoDarkUrl || settings.logoUrl);

  const navLinks = getSiteNavLinks(nav, {
    showMaterials: chrome.showMaterials,
    showTestimonials: chrome.showTestimonials,
    showBlog: chrome.showBlog,
    showFaq: chrome.showFaq,
  });

  const whatsapp = getWhatsAppLink(
    settings.whatsappE164,
    t(settings.whatsappMessage, locale)
  );

  return (
    <footer className="relative bg-charcoal-950 text-warm-50 overflow-hidden border-t border-gold-500/20">
      {/* خلفية التوهج الذهبي الضوئية */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-gold-400 blur-3xl" />
        <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-gold-500 blur-3xl" />
      </div>

      {/* قسم الدعوة للعمل Call To Action العلوي */}
      <div className="border-b border-charcoal-800/80 relative z-10">
        <div className="container-luxury flex flex-col items-start justify-between gap-6 py-12 sm:py-16 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl text-white tracking-wide">
              {ui.footerCta}
            </h2>
            <p className="mt-2 text-base text-warm-50/70 sm:text-lg font-light">
              {chrome.ctaSubtitle}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:from-gold-600 hover:to-gold-700 hover:shadow-gold-500/20 active:scale-[0.99]"
            >
              <MessageCircle className="h-5 w-5" />
              <span>{nav.whatsapp}</span>
            </a>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي للفوتر */}
      <div className="container-luxury relative z-10 grid grid-cols-1 gap-10 py-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-12 lg:py-16">
        
        {/* العمود الأول: الهوية وشعار الماركة الجديد */}
        <div className="space-y-4">
          <div className="inline-flex items-center transition-transform duration-300 hover:scale-105">
            <BrandLockup
              logoUrl={logo}
              brandName={settings.brandName}
              variant="dark"
            />
          </div>
          <p className="text-sm leading-relaxed text-warm-50/70 font-light">
            {ui.footerTagline}
          </p>
          {settings.pillars && (
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-300">
              <Sparkles className="h-3 w-3 text-gold-400" />
              <span>{t(settings.pillars, locale)}</span>
            </div>
          )}
        </div>

        {/* العمود الثاني: الخدمات */}
        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gold-400 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            {ui.servicesTitle}
          </h3>
          <ul className="space-y-2.5">
            {chrome.services.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/services/${s.slug}`}
                  className="text-sm text-warm-50/60 transition-colors duration-300 hover:text-gold-300"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* العمود الثالث: روابط التنقل الفعالة */}
        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gold-400 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            {ui.navTitle}
          </h3>
          <ul className="space-y-2.5">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-warm-50/60 transition-colors duration-300 hover:text-gold-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* العمود الرابع: التواصل، الـ QR Code، ومبدل اللغات */}
        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gold-400 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            {ui.contactTitle}
          </h3>
          
          <ul className="space-y-3 text-sm text-warm-50/70">
            <li className="flex items-start gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-gold-500/20 bg-gold-500/10 text-gold-400 shrink-0">
                <MessageCircle className="h-3.5 w-3.5" />
              </div>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-300 hover:text-gold-300"
              >
                {nav.whatsapp}
              </a>
            </li>
            
            <li className="flex items-start gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-gold-500/20 bg-gold-500/10 text-gold-400 shrink-0">
                <Mail className="h-3.5 w-3.5" />
              </div>
              <a
                href={getMailtoLink(settings.email)}
                className="break-all transition-colors duration-300 hover:text-gold-300"
              >
                {settings.email}
              </a>
            </li>

            <li className="flex items-start gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-gold-500/20 bg-gold-500/10 text-gold-400 shrink-0 mt-0.5">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <span className="leading-relaxed">{t(settings.address, locale)}</span>
            </li>
          </ul>

          {/* صورة الـ QR Code الفاخرة */}
          <div className="mt-5 flex flex-col items-start gap-2">
            <div className="overflow-hidden rounded-xl border border-gold-500/30 bg-white/95 p-2 shadow-lg backdrop-blur-md transition-transform duration-300 hover:scale-105">
              <Image
                src={mediaSrc(settings.qrUrl, '/qr.jpg')}
                alt="WhatsApp QR Code"
                width={100}
                height={100}
                className="h-20 w-20 object-contain"
              />
            </div>
          </div>

          {/* مبدل اللغات الفاخر */}
          <div className="mt-6 pt-4 border-t border-charcoal-800">
            <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gold-400">
              {ui.languagesTitle}
            </h4>
            <div className="flex flex-wrap gap-2">
              {LOCALES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => router.replace(pathname, { locale: code })}
                  className={`min-h-8 rounded-lg px-3 py-1 text-xs font-bold transition-all duration-300 ${
                    locale === code
                      ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-md shadow-gold-500/20'
                      : 'border border-charcoal-800 bg-charcoal-900 text-warm-50/60 hover:border-gold-500/40 hover:text-warm-50'
                  }`}
                >
                  {LOCALE_META[code].label}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* الشريط السفلي للحقوق وتوقيع المطور المميز */}
      <div className="border-t border-charcoal-800/80 relative z-10 bg-charcoal-950/80">
        <div className="container-luxury flex flex-col items-center justify-between gap-4 py-6 text-xs text-warm-50/50 sm:flex-row sm:flex-wrap">
          <p>
            © {new Date().getFullYear()} {settings.brandName}. {ui.allRightsReserved}
          </p>

          <nav aria-label={ui.legalTitle} className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/privacy" className="transition-colors duration-300 hover:text-gold-300">
              {ui.privacy}
            </Link>
            <Link href="/cookies" className="transition-colors duration-300 hover:text-gold-300">
              {ui.cookies}
            </Link>
            <Link href="/terms" className="transition-colors duration-300 hover:text-gold-300">
              {ui.terms}
            </Link>
          </nav>
          
          {/* شارة Lazacore الفاخرة المضيئة */}
          <a
            href={LAZACORE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gradient-to-r from-gold-500/15 via-gold-400/5 to-transparent px-4 py-1.5 shadow-sm transition-all duration-500 hover:border-gold-400 hover:bg-gold-500/20 hover:shadow-lg hover:shadow-gold-500/20 active:scale-95"
          >
            <span className="text-warm-50/70 transition-colors duration-300 group-hover:text-warm-50">
              {ui.madeBy}
            </span>

            <div className="flex items-center gap-1.5 font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-gold-200 group-hover:from-gold-200 group-hover:to-gold-400">
              <Code2 className="h-3.5 w-3.5 text-gold-400 transition-transform duration-300 group-hover:rotate-12" />
              <span>{LAZACORE.name}</span>
            </div>

            {/* توهج سفلي دقيق عند التحويم */}
            <span className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </a>
        </div>
      </div>
    </footer>
  );
}