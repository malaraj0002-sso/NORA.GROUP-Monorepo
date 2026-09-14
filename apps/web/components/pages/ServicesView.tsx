import Image from 'next/image';
import { 
  ArrowLeft,
  ChefHat,
  Shirt,
  Bed,
  Briefcase,
  Building2,
  Sofa,
  Sparkles
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import type { AppLocale } from '@/lib/constants';
import { mediaSrc } from '@/lib/content/media';
import type { SiteContent } from '@/lib/content/types';
import { t } from '@/lib/i18n/locale';

export function ServicesView({ locale, content }: { locale: AppLocale; content: SiteContent }) {
  const services = content.services.filter((s) => s.visible);

  // مصفوفة أيقونات متناسقة مع الخدمات
  const serviceIcons = [ChefHat, Shirt, Bed, Briefcase, Building2, Sofa, Sparkles];

  return (
    <>
      <PageHero
        eyebrow={t(content.home.servicesEyebrow, locale)}
        title={t(content.home.servicesTitle, locale)}
        subtitle={t(content.home.servicesSubtitle, locale)}
        image={services[0]?.image}
      />

      <section className="section-padding bg-background">
        <div className="container-luxury grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((s, i) => {
            const Icon = serviceIcons[i % serviceIcons.length];

            return (
              <Reveal key={s.slug} delay={i * 50}>
                <Link 
                  href={`/services/${s.slug}`} 
                  prefetch={true}
                  className="group relative flex flex-col h-full overflow-hidden rounded-2xl border border-gold-200/50 bg-card shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-gold-400 hover:shadow-2xl hover:shadow-gold-500/15"
                >
                  {/* حاوية الصورة مع التدرج والأيقونة */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-charcoal-900">
                    <Image
                      src={mediaSrc(s.image)}
                      alt={t(s.title, locale)}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:opacity-90"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    
                    {/* تدرج ظلي خلف الأيقونة والصورة */}
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />

                    {/* أيقونة الخدمة في الزاوية */}
                    <div className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/80 text-gold-600 backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:border-gold-400 group-hover:bg-gold-500 group-hover:text-white shadow-lg">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  {/* تفاصيل النص والسهم */}
                  <div className="flex flex-col justify-between flex-1 p-6">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-xl font-bold text-foreground transition-colors duration-300 group-hover:text-gold-600">
                          {t(s.title, locale)}
                        </h2>
                        
                        {/* سهم تفاعلي يظهر عند تحريك الماوس */}
                        <div className="flex h-8 w-8 -translate-x-2 items-center justify-center rounded-full bg-gold-400/10 text-gold-600 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 rtl:translate-x-2 rtl:group-hover:translate-x-0">
                          <ArrowLeft className="h-4 w-4 rtl:rotate-0 rotate-180" />
                        </div>
                      </div>

                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                        {t(s.description, locale)}
                      </p>
                    </div>
                  </div>

                  {/* الخط الفاخر المتوهج في أسفل البطاقة */}
                  <div className="h-1 w-0 bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-500 group-hover:w-full" />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>
    </>
  );
}