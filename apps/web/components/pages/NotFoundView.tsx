import { Compass, Home } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Reveal } from '@/components/ui/Reveal';
import type { AppLocale } from '@/lib/constants';
import type { SiteContent } from '@/lib/content/types';

export function NotFoundView({ locale, content }: { locale: AppLocale; content: SiteContent }) {
  const ui = content.ui[locale];
  const nav = content.nav[locale];

  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-warm-50/60 py-20">
      {/* خلفية جمالية ضوئية */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
        <div className="h-[380px] w-[380px] rounded-full bg-gold-300/20 blur-3xl" />
      </div>

      <div className="container-luxury relative z-10 max-w-xl text-center">
        <Reveal>
          <div className="group relative rounded-3xl border border-gold-200/60 bg-white p-10 shadow-xl shadow-gold-500/5 overflow-hidden">
            
            {/* أيقونة البوصلة التفاعلية */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-gold-200 bg-gold-50/80 text-gold-600 shadow-inner">
              <Compass className="h-10 w-10 animate-spin-slow" />
            </div>

            {/* رقم 404 الشفاف */}
            <span className="text-7xl font-extrabold tracking-widest text-gold-500/15 select-none block mb-2">
              404
            </span>

            {/* العناوين من content.ui */}
            <h1 className="text-2xl font-bold text-charcoal-900 sm:text-3xl">
              {ui.notFoundTitle}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-charcoal-600 sm:text-base">
              {ui.notFoundBody}
            </p>

            {/* زر العودة إلى الرئيسية من content.nav */}
            <div className="mt-8 flex justify-center">
              <Link
                href="/"
                className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:from-gold-600 hover:to-gold-700 hover:shadow-gold-500/25 active:scale-[0.99]"
              >
                <Home className="h-4 w-4" />
                <span>{nav.backHome}</span>
              </Link>
            </div>

            {/* شريط الإضاءة الذهبي السفلي */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 rounded-b-3xl" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}