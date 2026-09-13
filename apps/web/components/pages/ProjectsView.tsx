import { PageHero } from '@/components/ui/PageHero';
import { ProjectsGrid } from '@/components/pages/ProjectsGrid';
import type { AppLocale } from '@/lib/constants';
import type { SiteContent } from '@/lib/content/types';
import { t } from '@/lib/i18n/locale';

export function ProjectsView({ locale, content }: { locale: AppLocale; content: SiteContent }) {
  const visible = content.projects.filter((p) => p.visible);
  
  return (
    <>
      <PageHero
        eyebrow={t(content.home.projectsEyebrow, locale)}
        title={t(content.home.projectsTitle, locale)}
        subtitle={t(content.home.projectsSubtitle, locale)}
        image={visible[0]?.images[0]}
      />
      <section className="section-padding bg-warm-50">
        <div className="container-luxury">
          <ProjectsGrid
            labels={content.categoryLabels[locale]}
            projects={visible.map((p) => ({
              slug: p.slug,
              title: t(p.title, locale),
              description: t(p.description, locale), // تم إضافة الوصف هنا لعرضه داخل البطاقات
              category: p.category,
              image: p.images[0],
            }))}
          />
        </div>
      </section>
    </>
  );
}