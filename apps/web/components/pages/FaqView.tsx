import { ChevronDown, HelpCircle } from 'lucide-react';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import type { AppLocale } from '@/lib/constants';
import type { SiteContent } from '@/lib/content/types';
import { t } from '@/lib/i18n/locale';

export function FaqView({ locale, content }: { locale: AppLocale; content: SiteContent }) {
  const items = content.faq.filter((f) => f.visible);
  const nav = content.nav[locale];

  return (
    <>
      <PageHero eyebrow={nav.faq} title={nav.faq} subtitle="" />

      <section className="section-padding bg-warm-50/60 relative overflow-hidden">
        <div className="container-luxury max-w-3xl space-y-4">
          {items.map((item, i) => (
            <Reveal key={item.id} delay={i * 30}>
              <details className="group relative rounded-2xl border border-gold-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:border-gold-400 hover:shadow-md [&[open]]:border-gold-400 [&[open]]:bg-white [&[open]]:shadow-lg">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-bold text-charcoal-900 list-none select-none transition-colors group-hover:text-gold-600 [&::-webkit-details-marker]:hidden">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gold-200 bg-gold-50/80 text-gold-600 transition-colors group-hover:bg-gold-500 group-hover:text-white">
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <span className="text-base sm:text-lg leading-snug">
                      {t(item.question, locale)}
                    </span>
                  </div>

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-200 bg-warm-50 text-gold-600 transition-transform duration-300 group-[&[open]]:rotate-180 group-[&[open]]:bg-gold-500 group-[&[open]]:text-white">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </summary>

                <div className="mt-4 pt-4 border-t border-gold-100 text-sm sm:text-base leading-relaxed text-charcoal-600">
                  <p>{t(item.answer, locale)}</p>
                </div>

                {/* شريط الإضاءة الذهبي السفلي */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl bg-gradient-to-r from-gold-400 to-gold-600 opacity-0 transition-opacity duration-300 group-[&[open]]:opacity-100" />
              </details>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}