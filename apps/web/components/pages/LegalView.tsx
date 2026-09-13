import { PageHero } from '@/components/ui/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import type { AppLocale } from '@/lib/constants';
import type { LegalPage } from '@/lib/content/types';
import { t } from '@/lib/i18n/locale';

export function LegalView({
  locale,
  page,
  eyebrow,
}: {
  locale: AppLocale;
  page: LegalPage;
  eyebrow: string;
}) {
  return (
    <>
      <PageHero
        eyebrow={eyebrow}
        title={t(page.title, locale)}
        subtitle={t(page.updated, locale)}
      />

      <section className="section-padding bg-warm-50/60 relative overflow-hidden">
        <div className="container-luxury max-w-3xl space-y-8">
          <Reveal>
            <p className="text-base sm:text-lg leading-relaxed text-charcoal-800 whitespace-pre-line">
              {t(page.intro, locale)}
            </p>
          </Reveal>

          {page.sections.map((section, index) => (
            <Reveal key={`${index}-${t(section.heading, locale)}`} delay={40 + index * 20}>
              <article className="rounded-2xl border border-gold-200/60 bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">
                  {t(section.heading, locale)}
                </h2>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-charcoal-600 whitespace-pre-line">
                  {t(section.body, locale)}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
