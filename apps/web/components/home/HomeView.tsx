import Image from 'next/image';
import { 
  ArrowRight, 
  ArrowLeft,
  MessageCircle, 
  Star, 
  Sparkles, 
  Layers, 
  Ruler, 
  PhoneCall, 
  Wrench, 
  ShieldCheck,
  PenTool,
  Compass,
  Gem,
  CheckCircle2,
  ChefHat,
  Shirt,
  Bed,
  Briefcase,
  Building2,
  Sofa,
  Eye,
  Layers3
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Hero } from '@/components/home/Hero';
import { Reveal } from '@/components/ui/Reveal';
import type { AppLocale } from '@/lib/constants';
import { getWhatsAppLink } from '@/lib/contact';
import type { SiteContent } from '@/lib/content/types';
import { mediaSrc } from '@/lib/content/media';
import { t } from '@/lib/i18n/locale';

export function HomeView({ locale, content }: { locale: AppLocale; content: SiteContent }) {
  const home = content.home;
  const nav = content.nav[locale];
  const settings = content.settings;

  const whatsapp = getWhatsAppLink(settings.whatsappE164, t(settings.whatsappMessage, locale));
  const services = content.services.filter((s) => s.visible).slice(0, 7);
  const projects = content.projects.filter((p) => p.visible).slice(0, 6);
  const materials = content.materials.filter((m) => m.visible).slice(0, 4);
  const testimonials = content.testimonials.filter((x) => x.visible).slice(0, 3);

  // أيقونات قسم "لماذا نحن"
  const whyIcons = [Sparkles, Layers, Ruler, PhoneCall, Wrench, ShieldCheck];

  // أيقونات للمربعات الأربعة
  const introIcons = [PenTool, Compass, Gem, CheckCircle2];

  // أيقونات مخصصة للخدمات
  const serviceIcons = [ChefHat, Shirt, Bed, Briefcase, Building2, Sofa, Sparkles];

  return (
    <>
      <Hero
        title={t(home.heroTitle, locale)}
        subtitle={t(home.heroSubtitle, locale)}
        pillars={t(settings.pillars, locale)}
        slides={home.heroImages}
        whatsapp={whatsapp}
        whatsappLabel={nav.whatsapp}
        viewWorkLabel={nav.viewWork}
      />

      {/* قسم المقدمة والمربعات الأربعة */}
      <section className="section-padding bg-warm-50">
        <div className="container-luxury grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="heading-eyebrow">{t(home.introEyebrow, locale)}</p>
            <h2 className="text-section text-charcoal-900">{t(home.introTitle, locale)}</h2>
            <p className="mt-5 text-lg leading-relaxed text-charcoal-600">
              {t(home.introDescription, locale)}
            </p>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2">
            {home.introFeatures.map((f, i) => {
              const Icon = introIcons[i % introIcons.length];
              return (
                <Reveal key={i} delay={i * 80}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-gold-300/40 bg-gradient-to-br from-white via-white to-warm-100/50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-gold-400 hover:shadow-2xl hover:shadow-gold-500/15">
                    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gold-400/10 blur-xl transition-all duration-500 group-hover:bg-gold-400/25" />

                    <div className="relative mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-gold-300/50 bg-gradient-to-tr from-gold-100/80 to-gold-50 text-gold-600 shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:border-gold-500 group-hover:bg-gradient-to-tr group-hover:from-gold-500 group-hover:to-gold-400 group-hover:text-white group-hover:shadow-lg group-hover:shadow-gold-500/30">
                      <Icon className="h-7 w-7 transition-transform duration-300 group-hover:rotate-6" />
                    </div>

                    <h3 className="relative text-xl font-bold text-charcoal-900 transition-colors duration-300 group-hover:text-gold-600">
                      {t(f.title, locale)}
                    </h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-charcoal-600">
                      {t(f.desc, locale)}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* قسم الخدمات */}
      <section className="section-padding bg-white">
        <div className="container-luxury">
          <Reveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="heading-eyebrow">{t(home.servicesEyebrow, locale)}</p>
              <h2 className="text-section text-charcoal-900">{t(home.servicesTitle, locale)}</h2>
              <p className="mt-4 text-charcoal-600">{t(home.servicesSubtitle, locale)}</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {services.map((s, i) => {
              const Icon = serviceIcons[i % serviceIcons.length];
              return (
                <Reveal key={s.slug} delay={i * 60}>
                  <Link 
                    href={`/services/${s.slug}`} 
                    className="group relative block overflow-hidden rounded-2xl border border-gold-200/50 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-gold-400 hover:shadow-2xl hover:shadow-gold-500/15"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-charcoal-900">
                      <Image
                        src={mediaSrc(s.image)}
                        alt={t(s.title, locale)}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:opacity-90"
                        sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 25vw"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />

                      <div className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/80 text-gold-600 backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:border-gold-400 group-hover:bg-gold-500 group-hover:text-white shadow-lg">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xl font-bold text-charcoal-900 transition-colors duration-300 group-hover:text-gold-600">
                          {t(s.title, locale)}
                        </h3>
                        
                        <div className="flex h-8 w-8 -translate-x-2 items-center justify-center rounded-full bg-gold-50 text-gold-600 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 rtl:translate-x-2 rtl:group-hover:translate-x-0">
                          <ArrowLeft className="h-4 w-4 rtl:rotate-0 rotate-180" />
                        </div>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-charcoal-600">
                        {t(s.description, locale)}
                      </p>
                    </div>

                    <div className="h-1 w-0 bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-500 group-hover:w-full" />
                  </Link>
                </Reveal>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link href="/services" className="btn-secondary group inline-flex items-center gap-2">
              {nav.viewAll}
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* قسم المشاريع (أعمالنا) */}
      <section className="section-padding bg-warm-50">
        <div className="container-luxury">
          <Reveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="heading-eyebrow">{t(home.projectsEyebrow, locale)}</p>
              <h2 className="text-section text-charcoal-900">{t(home.projectsTitle, locale)}</h2>
              <p className="mt-4 text-charcoal-600">{t(home.projectsSubtitle, locale)}</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <Reveal key={p.slug} delay={i * 60}>
                <Link 
                  href={`/projects/${p.slug}`} 
                  className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-gold-300/30 bg-charcoal-900 shadow-md transition-all duration-500 hover:-translate-y-2 hover:border-gold-400 hover:shadow-2xl hover:shadow-gold-500/20"
                >
                  <Image
                    src={mediaSrc(p.images[0])}
                    alt={t(p.title, locale)}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    sizes="(max-width:768px) 100vw, 33vw"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/40 to-transparent transition-opacity duration-300 group-hover:from-charcoal-950/95" />

                  <div className="absolute top-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all duration-300 group-hover:border-gold-400 group-hover:bg-gold-500 group-hover:text-charcoal-950">
                    <Eye className="h-5 w-5" />
                  </div>

                  <div className="absolute inset-x-0 bottom-0 z-10 p-6">
                    <div className="mb-2 inline-block rounded-full bg-gold-400/20 px-3 py-1 border border-gold-400/40 backdrop-blur-md">
                      <span className="text-xs font-semibold text-gold-300 uppercase tracking-wider">
                        {content.categoryLabels[locale][p.category]}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white transition-colors duration-300 group-hover:text-gold-300">
                      {t(p.title, locale)}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-warm-100/80 transition-opacity duration-300 group-hover:text-white">
                      {t(p.description, locale)}
                    </p>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-gold-400 to-gold-600 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </Link>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/projects" className="btn-primary inline-flex items-center gap-2">
              {nav.viewWork}
              <ArrowRight className="h-5 w-5 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      {/* قسم: لماذا نحن */}
      <section className="section-padding bg-charcoal-950 text-warm-50">
        <div className="container-luxury text-center">
          <Reveal>
            <div className="mx-auto mb-12 max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold-400 sm:text-sm">
                {t(home.whyEyebrow, locale)}
              </p>
              <h2 className="text-3xl font-extrabold text-warm-50 sm:text-4xl lg:text-5xl">
                {t(home.whyTitle, locale)}
              </h2>
              <p className="mt-4 text-base text-warm-50/70 sm:text-lg">
                {t(home.whySubtitle, locale)}
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {home.whyItems.map((item, i) => {
              const Icon = whyIcons[i % whyIcons.length];
              return (
                <Reveal key={i} delay={i * 60}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-7 text-right transition-all duration-300 hover:-translate-y-2 hover:border-gold-400/50 hover:bg-charcoal-800/80 hover:shadow-2xl hover:shadow-gold-500/10">
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold-400/5 blur-2xl transition-all duration-500 group-hover:bg-gold-400/20" />

                    <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gold-400/10 text-gold-400 transition-transform duration-300 group-hover:scale-110 group-hover:bg-gold-400 group-hover:text-charcoal-950">
                      <Icon className="h-7 w-7" />
                    </div>

                    <h3 className="text-xl font-bold text-warm-50 transition-colors duration-300 group-hover:text-gold-300 sm:text-2xl">
                      {t(item.title, locale)}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-warm-50/70 sm:text-base">
                      {t(item.desc, locale)}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* قسم مراحل العمل */}
      <section className="section-padding bg-white">
        <div className="container-luxury">
          <Reveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="heading-eyebrow">{t(home.processEyebrow, locale)}</p>
              <h2 className="text-section">{t(home.processTitle, locale)}</h2>
              <p className="mt-4 text-charcoal-600">{t(home.processSubtitle, locale)}</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {content.howWeWork.steps.map((step, i) => (
              <Reveal key={step.number} delay={i * 40}>
                <div className="rounded-2xl bg-warm-50 p-4 text-center border border-gold-200/30 transition-all hover:border-gold-400 hover:shadow-md">
                  <p className="text-sm font-bold text-gold-500">{step.number}</p>
                  <h3 className="mt-2 text-sm font-semibold">{t(step.title, locale)}</h3>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* قسم الخامات المختارة بعناية المحدث */}
      {materials.length > 0 && (
        <section className="section-padding bg-warm-50">
          <div className="container-luxury">
            <Reveal>
              <div className="mx-auto mb-12 max-w-2xl text-center">
                <p className="heading-eyebrow">{t(home.materialsEyebrow, locale)}</p>
                <h2 className="text-section text-charcoal-900">{t(home.materialsTitle, locale)}</h2>
                <p className="mt-4 text-charcoal-600">{t(home.materialsSubtitle, locale)}</p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {materials.map((m, i) => (
                <Reveal key={m.slug} delay={i * 50}>
                  <div className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-gold-300/30 bg-charcoal-900 shadow-md transition-all duration-500 hover:-translate-y-2 hover:border-gold-400 hover:shadow-2xl hover:shadow-gold-500/20">
                    {/* الصورة الخلفية للخامة */}
                    <Image
                      src={mediaSrc(m.image)}
                      alt={t(m.name, locale)}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      sizes="(max-width:768px) 100vw, 25vw"
                    />

                    {/* التدرج الداكن لقراءة النص */}
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/30 to-transparent transition-opacity duration-300 group-hover:from-charcoal-950/95" />

                    {/* أيقونة أعلى البطاقة */}
                    <div className="absolute top-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all duration-300 group-hover:border-gold-400 group-hover:bg-gold-500 group-hover:text-charcoal-950">
                      <Layers3 className="h-5 w-5" />
                    </div>

                    {/* عنوان ووصف الخامة مدمجان فوق الصورة */}
                    <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-center">
                      <h3 className="text-xl font-bold text-white transition-colors duration-300 group-hover:text-gold-300">
                        {t(m.name, locale)}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-warm-100/80 transition-opacity duration-300 group-hover:text-white">
                        {t(m.description, locale)}
                      </p>
                    </div>

                    {/* شريط توهج ذهبي سفلي */}
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-gold-400 to-gold-600 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* قسم التقييمات */}
      {testimonials.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container-luxury">
            <Reveal>
              <div className="mx-auto mb-12 max-w-2xl text-center">
                <p className="heading-eyebrow">{t(home.testimonialsEyebrow, locale)}</p>
                <h2 className="text-section">{t(home.testimonialsTitle, locale)}</h2>
                <p className="mt-4 text-charcoal-600">{t(home.testimonialsSubtitle, locale)}</p>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.map((item, i) => (
                <Reveal key={item.id} delay={i * 60}>
                  <div className="card-luxury h-full p-6">
                    <div className="mb-3 flex gap-1 text-gold-400">
                      {Array.from({ length: item.rating }).map((_, idx) => (
                        <Star key={idx} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-charcoal-700">{t(item.review, locale)}</p>
                    <p className="mt-4 font-semibold">{item.name}</p>
                    <p className="text-sm text-charcoal-500">{t(item.project, locale)}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* دعوة للتواصل */}
      <section className="section-padding bg-charcoal-900 text-warm-50">
        <div className="container-luxury text-center">
          <Reveal>
            <h2 className="text-section text-warm-50">{t(home.ctaTitle, locale)}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-warm-50/70">{t(home.ctaSubtitle, locale)}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                <MessageCircle className="h-5 w-5" />
                {nav.whatsapp}
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}