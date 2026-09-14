import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import type { AppLocale } from '@/lib/constants';
import type { SiteContent } from '@/lib/content/types';
import { t } from '@/lib/i18n/locale';

export function ServiceDetailView({
  locale,
  content,
  slug,
}: {
  locale: AppLocale;
  content: SiteContent;
  slug: string;
}) {
  const service = content.services.find((s) => s.slug === slug && s.visible);
  if (!service) return null;
  const nav = content.nav[locale];

  return (
    <>
      <PageHero
        eyebrow={nav.services}
        title={t(service.title, locale)}
        subtitle={t(service.description, locale)}
        image={service.image}
      />

      <section className="section-padding bg-background relative overflow-hidden">
        <div className="container-luxury max-w-4xl">
          <Reveal>
            <div className="rounded-2xl border border-gold-200/60 bg-card p-8 shadow-sm relative overflow-hidden">
              
              {/* شارة علوية */}
              <div className="inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-400/10 px-3.5 py-1 text-xs font-semibold text-gold-600 mb-6">
                <Sparkles className="h-3.5 w-3.5 text-gold-500" />
                <span>{locale === 'ar' ? 'مميزات الخدمة الفاخرة' : 'Service Features'}</span>
              </div>

              {/* قائمة المميزات الفاخرة */}
              <ul className="grid gap-4 sm:grid-cols-2">
                {service.features.map((f, index) => (
                  <Reveal key={t(f, locale)} delay={index * 40}>
                    <li className="group flex items-start gap-3.5 rounded-xl border border-gold-100 bg-background p-4 transition-all duration-300 hover:border-gold-300 hover:bg-gold-400/10 hover:shadow-md">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gold-200 bg-gold-400/10 text-gold-600 transition-colors duration-300 group-hover:bg-gold-500 group-hover:text-white">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-foreground leading-relaxed pt-0.5">
                        {t(f, locale)}
                      </span>
                    </li>
                  </Reveal>
                ))}
              </ul>

              {/* زر العودة إلى صفحة الخدمات */}
              <div className="mt-10 pt-6 border-t border-gold-100 flex items-center justify-between">
                <Link
                  href="/services"
                  className="group inline-flex items-center gap-2.5 rounded-xl border border-gold-300 bg-card px-6 py-3 text-sm font-bold text-foreground shadow-sm transition-all duration-300 hover:border-gold-500 hover:bg-gold-400/10 hover:text-gold-600 hover:shadow-md"
                >
                  <ArrowRight className="h-4 w-4 rotate-180 rtl:rotate-0 transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                  <span>{nav.services}</span>
                </Link>
              </div>

              {/* شريط سفلي مضيء */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-400 to-gold-600" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}