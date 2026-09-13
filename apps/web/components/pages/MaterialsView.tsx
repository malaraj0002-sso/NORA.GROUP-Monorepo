import Image from 'next/image';
import { Sparkles, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import type { AppLocale } from '@/lib/constants';
import { mediaSrc } from '@/lib/content/media';
import type { SiteContent } from '@/lib/content/types';
import { t } from '@/lib/i18n/locale';

export function MaterialsView({ locale, content }: { locale: AppLocale; content: SiteContent }) {
  const materials = content.materials.filter((m) => m.visible);

  return (
    <>
      <PageHero
        eyebrow={t(content.home.materialsEyebrow, locale)}
        title={t(content.home.materialsTitle, locale)}
        subtitle={t(content.home.materialsSubtitle, locale)}
        image={materials[0]?.image}
      />

      <section className="section-padding bg-warm-50/60">
        <div className="container-luxury grid gap-8 md:grid-cols-2">
          {materials.map((m, i) => (
            <Reveal key={m.slug} delay={i * 50}>
              <article className="group relative grid overflow-hidden rounded-2xl border border-gold-200/50 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-400 hover:shadow-2xl hover:shadow-gold-500/15 sm:grid-cols-2">
                
                {/* حاوية الصورة مع التدرج والأيقونة الفاخرة */}
                <div className="relative min-h-[220px] overflow-hidden bg-charcoal-900">
                  <Image
                    src={mediaSrc(m.image)}
                    alt={t(m.name, locale)}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:opacity-90"
                    sizes="(max-width:768px) 100vw, 40vw"
                  />
                  
                  {/* تدرج ظلي سينمائي */}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/70 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />

                  {/* وسام جودة الخامة */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                    <Sparkles className="h-3 w-3 text-gold-400" />
                    <span>{locale === 'ar' ? 'خامة فاخرة' : 'Premium Material'}</span>
                  </div>
                </div>

                {/* التفاصيل والمواصفات */}
                <div className="flex flex-col justify-between p-6">
                  <div>
                    <div className="flex items-center gap-1.5 text-gold-600 mb-1.5">
                      <Layers className="h-4 w-4" />
                      <span className="text-xs font-semibold tracking-wider uppercase">
                        {locale === 'ar' ? 'جودة المواصفات' : 'Wood Specs'}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-charcoal-900 transition-colors duration-300 group-hover:text-gold-600">
                      {t(m.name, locale)}
                    </h2>

                    <p className="mt-2.5 text-sm leading-relaxed text-charcoal-600 line-clamp-3">
                      {t(m.description, locale)}
                    </p>

                    {/* خصائص الخامة */}
                    {m.characteristics && (
                      <div className="mt-3 flex items-start gap-2 text-xs text-charcoal-700 bg-gold-50/50 p-2.5 rounded-lg border border-gold-100/60">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-gold-600 mt-0.5" />
                        <span>{t(m.characteristics, locale)}</span>
                      </div>
                    )}

                    {/* استخدامات الخامة */}
                    {m.applications && (
                      <div className="mt-2 flex items-start gap-2 text-xs text-charcoal-500">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-gold-500 mt-0.5" />
                        <span>{t(m.applications, locale)}</span>
                      </div>
                    )}
                  </div>

                  {/* شريط الإضاءة السفلي التفاعلي */}
                  <div className="absolute bottom-0 right-0 left-0 h-1 w-0 bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-500 group-hover:w-full" />
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}