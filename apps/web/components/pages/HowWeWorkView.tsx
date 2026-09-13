import { Sparkles } from 'lucide-react';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import type { AppLocale } from '@/lib/constants';
import type { SiteContent } from '@/lib/content/types';
import { t } from '@/lib/i18n/locale';

export function HowWeWorkView({ locale, content }: { locale: AppLocale; content: SiteContent }) {
  const page = content.howWeWork;

  return (
    <>
      <PageHero
        eyebrow={t(page.eyebrow, locale)}
        title={t(page.title, locale)}
        subtitle={t(page.subtitle, locale)}
        image={page.image}
      />

      <section className="section-padding bg-warm-50/60">
        <div className="container-luxury grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {page.steps.map((step, i) => (
            <Reveal key={step.number} delay={i * 40}>
              <div className="group relative flex flex-col justify-between h-full overflow-hidden rounded-2xl border border-gold-200/50 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-gold-400 hover:shadow-2xl hover:shadow-gold-500/15">
                
                {/* رقم الخطوة الخلفي العملاق الشفاف */}
                <span className="absolute -left-2 -top-2 text-7xl font-extrabold text-gold-500/10 transition-colors duration-500 group-hover:text-gold-500/20 select-none">
                  {step.number}
                </span>

                <div className="relative z-10">
                  {/* شارة الخطوة مع الأيقونة */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-200/80 bg-gold-50/80 px-3 py-1 text-xs font-bold text-gold-600 backdrop-blur-sm">
                      <Sparkles className="h-3 w-3 text-gold-500" />
                      <span>{step.number}</span>
                    </span>
                  </div>

                  {/* عنوان الخطوة والوصف */}
                  <h3 className="text-xl font-bold text-charcoal-900 transition-colors duration-300 group-hover:text-gold-600">
                    {t(step.title, locale)}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-charcoal-600">
                    {t(step.description, locale)}
                  </p>
                </div>

                {/* الشريط الذهبي التفاعلي السفلي */}
                <div className="absolute bottom-0 left-0 right-0 h-1 w-0 bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-500 group-hover:w-full" />
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}