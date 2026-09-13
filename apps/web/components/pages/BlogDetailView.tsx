import { ArrowRight, Calendar, User, BookOpen } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import type { AppLocale } from '@/lib/constants';
import type { BlogPostItem, SiteContent } from '@/lib/content/types';
import { t } from '@/lib/i18n/locale';

export function BlogDetailView({
  locale,
  content,
  post,
}: {
  locale: AppLocale;
  content: SiteContent;
  post: BlogPostItem;
}) {
  const nav = content.nav[locale];

  return (
    <>
      <PageHero
        eyebrow={post.category}
        title={t(post.title, locale)}
        subtitle={t(post.excerpt, locale)}
        image={post.image}
      />

      <section className="section-padding bg-warm-50/60 relative overflow-hidden">
        <article className="container-luxury max-w-4xl">
          <Reveal>
            <div className="group relative rounded-3xl border border-gold-200/60 bg-white p-8 sm:p-12 shadow-sm transition-all duration-500 hover:border-gold-300 hover:shadow-xl hover:shadow-gold-500/5">
              
              {/* شريط معلومات المقال (التاريخ والكاتب) */}
              <div className="mb-8 flex flex-wrap items-center gap-4 border-b border-gold-100 pb-6 text-xs sm:text-sm text-charcoal-600">
                {post.date && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-gold-200/80 bg-warm-50/80 px-3.5 py-1.5 font-medium text-charcoal-800">
                    <Calendar className="h-4 w-4 text-gold-500" />
                    <span>{post.date}</span>
                  </div>
                )}
                
                {post.author && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-gold-200/80 bg-warm-50/80 px-3.5 py-1.5 font-medium text-charcoal-800">
                    <User className="h-4 w-4 text-gold-500" />
                    <span>{post.author}</span>
                  </div>
                )}

                {post.category && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50/80 px-3.5 py-1.5 font-semibold text-gold-700">
                    <BookOpen className="h-3.5 w-3.5 text-gold-500" />
                    <span>{post.category}</span>
                  </div>
                )}
              </div>

              {/* نص المقال الرئيسي */}
              <div className="whitespace-pre-line text-base sm:text-lg leading-relaxed text-charcoal-800 font-normal">
                {t(post.content, locale)}
              </div>

              {/* زر العودة إلى مدونة الأخبار والمقالات */}
              <div className="mt-12 pt-8 border-t border-gold-100 flex items-center justify-between">
                <Link
                  href="/blog"
                  className="group inline-flex items-center gap-2.5 rounded-xl border border-gold-300 bg-white px-6 py-3 text-sm font-bold text-charcoal-800 shadow-sm transition-all duration-300 hover:border-gold-500 hover:bg-gold-50 hover:text-gold-700 hover:shadow-md"
                >
                  <ArrowRight className="h-4 w-4 rotate-180 rtl:rotate-0 transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                  <span>{nav.blog}</span>
                </Link>
              </div>

              {/* شريط التوهج الذهبي السفلي */}
              <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-3xl bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 transition-all duration-500 group-hover:h-1.5" />
            </div>
          </Reveal>
        </article>
      </section>
    </>
  );
}