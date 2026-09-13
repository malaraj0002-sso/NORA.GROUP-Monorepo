import { Award, Sparkles } from 'lucide-react';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import type { AppLocale } from '@/lib/constants';
import type { SiteContent } from '@/lib/content/types';
import { t } from '@/lib/i18n/locale';

export function AboutView({ locale, content }: { locale: AppLocale; content: SiteContent }) {
  const page = content.about;

  return (
    <>
      <PageHero
        eyebrow={t(page.eyebrow, locale)}
        title={t(page.title, locale)}
        subtitle={t(page.subtitle, locale)}
        image={page.image}
      />

      <section className="section-padding bg-warm-50/60 relative overflow-hidden">
        <div className="container-luxury max-w-4xl space-y-12">
          
          {/* النص التعريفي الرئيسي */}
          <Reveal>
            <div className="group relative rounded-2xl border border-gold-200/60 bg-white p-8 sm:p-10 shadow-sm transition-all duration-500 hover:border-gold-300 hover:shadow-xl hover:shadow-gold-500/5">
              
              {/* شارة علوية */}
              <div className="inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50/80 px-3.5 py-1 text-xs font-semibold text-gold-700 mb-6">
                <Sparkles className="h-3.5 w-3.5 text-gold-500" />
                <span>{locale === 'ar' ? 'رؤيتنا ورسالتنا' : 'Our Vision & Mission'}</span>
              </div>

              <p className="text-base sm:text-lg leading-relaxed text-charcoal-800 font-medium whitespace-pre-line">
                {t(page.body, locale)}
              </p>

              {/* شريط الإضاءة الذهبي السفلي */}
              <div className="absolute bottom-0 left-0 right-0 h-1 w-0 rounded-b-2xl bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-500 group-hover:w-full" />
            </div>
          </Reveal>

          {/* قسم قيم الشركة */}
          {page.values && page.values.length > 0 && (
            <div className="pt-4">
              <Reveal delay={100}>
                <div className="mb-8 text-center sm:text-start">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold-600">
                    {locale === 'ar' ? 'مبادئنا الأساسية' : 'Core Principles'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-charcoal-900 mt-1">
                    {t(page.valuesTitle, locale)}
                  </h2>
                </div>
              </Reveal>

              <div className="grid gap-6 sm:grid-cols-3">
                {page.values.map((v, index) => (
                  <Reveal key={t(v.title, locale)} delay={120 + index * 50}>
                    <div className="group relative flex flex-col justify-between h-full rounded-2xl border border-gold-200/60 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-gold-400 hover:shadow-xl hover:shadow-gold-500/10">
                      <div>
                        {/* أيقونة القيمة */}
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-gold-200 bg-gold-50/80 text-gold-600 transition-colors duration-300 group-hover:bg-gold-500 group-hover:text-white">
                          <Award className="h-5 w-5" />
                        </div>

                        <h3 className="text-lg font-bold text-charcoal-900 transition-colors duration-300 group-hover:text-gold-600">
                          {t(v.title, locale)}
                        </h3>

                        <p className="mt-2 text-sm leading-relaxed text-charcoal-600">
                          {t(v.desc, locale)}
                        </p>
                      </div>

                      {/* شريط الإضاءة السفلي */}
                      <div className="mt-6 h-1 w-0 bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-500 group-hover:w-full" />
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>
    </>
  );
}