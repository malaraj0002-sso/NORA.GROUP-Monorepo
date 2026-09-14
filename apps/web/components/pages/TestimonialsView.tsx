import { Quote, Star } from 'lucide-react';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import type { AppLocale } from '@/lib/constants';
import type { SiteContent } from '@/lib/content/types';
import { t } from '@/lib/i18n/locale';

export function TestimonialsView({ locale, content }: { locale: AppLocale; content: SiteContent }) {
  const items = content.testimonials.filter((x) => x.visible);

  return (
    <>
      <PageHero
        eyebrow={t(content.home.testimonialsEyebrow, locale)}
        title={t(content.home.testimonialsTitle, locale)}
        subtitle={t(content.home.testimonialsSubtitle, locale)}
      />

      <section className="section-padding bg-background relative overflow-hidden">
        <div className="container-luxury grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.id} delay={i * 40}>
              <div className="group relative flex flex-col justify-between h-full rounded-2xl border border-gold-200/60 bg-card p-7 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-gold-400 hover:shadow-xl hover:shadow-gold-500/10">
                
                <div>
                  {/* النجوم الذهبية وعلامة الاقتباس */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1 text-gold-500">
                      {Array.from({ length: item.rating }).map((_, idx) => (
                        <Star key={idx} className="h-4 w-4 fill-gold-500 text-gold-500" />
                      ))}
                    </div>
                    <Quote className="h-8 w-8 text-gold-200/60 transition-colors duration-300 group-hover:text-gold-400/40" />
                  </div>

                  {/* نص التقييم */}
                  <p className="text-sm sm:text-base leading-relaxed text-foreground italic font-medium">
                    &ldquo;{t(item.review, locale)}&rdquo;
                  </p>
                </div>

                {/* معلومات العميل والمشروع */}
                <div className="mt-6 pt-4 border-t border-gold-100/80">
                  <p className="font-bold text-foreground transition-colors duration-300 group-hover:text-gold-600">
                    {item.name}
                  </p>
                  <p className="text-xs font-semibold text-gold-600/90 mt-0.5">
                    {t(item.project, locale)}
                  </p>
                </div>

                {/* شريط التوهج الذهبي السفلي */}
                <div className="absolute bottom-0 left-0 right-0 h-1 w-0 rounded-b-2xl bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-500 group-hover:w-full" />
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}