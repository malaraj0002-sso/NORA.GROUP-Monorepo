import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Layers, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import type { AppLocale } from '@/lib/constants';
import { mediaSrc } from '@/lib/content/media';
import type { SiteContent } from '@/lib/content/types';
import { t } from '@/lib/i18n/locale';

export function ProjectDetailView({
  locale,
  content,
  slug,
}: {
  locale: AppLocale;
  content: SiteContent;
  slug: string;
}) {
  const project = content.projects.find((p) => p.slug === slug && p.visible);
  if (!project) return null;

  const related = content.projects
    .filter((p) => p.visible && p.category === project.category && p.slug !== project.slug)
    .slice(0, 3);

  const materialName = (id: string) => {
    const match = content.materials.find((m) => m.slug === id);
    return match ? t(match.name, locale) : id;
  };

  return (
    <>
      <PageHero
        eyebrow={content.categoryLabels[locale][project.category]}
        title={t(project.title, locale)}
        subtitle={t(project.description, locale)}
        image={project.images[0]}
      />

      <section className="section-padding bg-warm-50/60 relative overflow-hidden">
        <div className="container-luxury space-y-12">
          
          {/* معرض صور المشروع الفاخر */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {project.images.map((src, i) => (
              <Reveal key={src} delay={i * 50}>
                <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-gold-200/50 bg-charcoal-900 shadow-sm transition-all duration-500 hover:border-gold-400 hover:shadow-xl hover:shadow-gold-500/10">
                  <Image
                    src={mediaSrc(src)}
                    alt={t(project.title, locale)}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width:768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
              </Reveal>
            ))}
          </div>

          {/* المواد المستخدمة في المشروع */}
          {project.materials.length > 0 && (
            <Reveal delay={100}>
              <div className="rounded-2xl border border-gold-200/60 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-gold-600 mb-4">
                  <Layers className="h-4 w-4" />
                  <span className="text-xs font-semibold tracking-wider uppercase">
                    {locale === 'ar' ? 'المواد والخامات المستخدمة' : 'Materials Used'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {project.materials.map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gold-200/80 bg-warm-50/80 px-4 py-2 text-sm font-semibold text-charcoal-800 backdrop-blur-sm transition-all duration-300 hover:border-gold-400 hover:bg-gold-50 hover:text-gold-700"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-gold-500" />
                      <span>{materialName(m)}</span>
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* المشاريع ذات الصلة */}
          {related.length > 0 && (
            <Reveal delay={150}>
              <div className="pt-8 border-t border-gold-200/60">
                <div className="mb-8">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold-600">
                    {locale === 'ar' ? 'استكشف المزيد' : 'Explore More'}
                  </span>
                  <h2 className="text-2xl font-bold text-charcoal-900 mt-1">
                    {content.ui[locale].relatedProjects}
                  </h2>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  {related.map((p, i) => (
                    <Reveal key={p.slug} delay={i * 40}>
                      <Link
                        href={`/projects/${p.slug}`}
                        prefetch={true}
                        className="group relative flex flex-col overflow-hidden rounded-2xl border border-gold-200/50 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-gold-400 hover:shadow-2xl hover:shadow-gold-500/15 h-full"
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-charcoal-900">
                          <Image
                            src={mediaSrc(p.images[0])}
                            alt={t(p.title, locale)}
                            fill
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                            sizes="(max-width: 640px) 100vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/70 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />
                          <div className="absolute bottom-3 left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:bg-gold-500 group-hover:border-gold-400">
                            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <h3 className="font-bold text-charcoal-900 transition-colors duration-300 group-hover:text-gold-600">
                            {t(p.title, locale)}
                          </h3>
                          <div className="mt-4 flex items-center text-xs font-semibold text-gold-600 transition-all duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                            <span>{locale === 'ar' ? 'عرض المشروع' : 'View Project'}</span>
                            <ArrowRight className="mr-1.5 h-3.5 w-3.5 rotate-180 rtl:rotate-0" />
                          </div>
                        </div>
                        <div className="h-1 w-0 bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-500 group-hover:w-full" />
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

        </div>
      </section>
    </>
  );
}