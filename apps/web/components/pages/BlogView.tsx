import Image from 'next/image';
import { ArrowRight, ArrowUpRight, BookOpen, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import type { AppLocale } from '@/lib/constants';
import { mediaSrc } from '@/lib/content/media';
import type { SiteContent } from '@/lib/content/types';
import { t } from '@/lib/i18n/locale';

export function BlogView({ locale, content }: { locale: AppLocale; content: SiteContent }) {
  const posts = content.blogPosts.filter((b) => b.visible);
  const nav = content.nav[locale];

  return (
    <>
      <PageHero
        eyebrow={nav.blog}
        title={nav.blog}
        subtitle=""
        image={posts[0]?.image}
      />

      <section className="section-padding bg-warm-50/60 relative overflow-hidden">
        <div className="container-luxury grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post.slug} delay={i * 40}>
              <Link
                href={`/blog/${post.slug}`}
                prefetch={true}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-gold-200/60 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-gold-400 hover:shadow-2xl hover:shadow-gold-500/15 h-full"
              >
                {/* حاوية الصورة مع تدرج ورابط عائم */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-charcoal-900">
                  <Image
                    src={mediaSrc(post.image)}
                    alt={t(post.title, locale)}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    sizes="(max-width:768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/70 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />

                  {/* أيقونة فتح المقال العائمة */}
                  <div className="absolute bottom-3 left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:bg-gold-500 group-hover:border-gold-400">
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
                  </div>
                </div>

                {/* المحتوى النصي للمقال */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* شارة مقال فاخرة */}
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-gold-200/80 bg-gold-50/80 px-3 py-1 text-xs font-semibold text-gold-700 mb-3">
                      <BookOpen className="h-3 w-3 text-gold-500" />
                      <span>{locale === 'ar' ? 'مقال' : 'Article'}</span>
                    </div>

                    <h2 className="text-xl font-bold text-charcoal-900 transition-colors duration-300 group-hover:text-gold-600 line-clamp-2">
                      {t(post.title, locale)}
                    </h2>

                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-charcoal-600">
                      {t(post.excerpt, locale)}
                    </p>
                  </div>

                  {/* رابط قراءة المزيد */}
                  <div className="mt-6 pt-4 border-t border-gold-100 flex items-center text-sm font-bold text-gold-600 transition-all duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                    <span>{nav.readMore}</span>
                    <ArrowRight className="mr-2 h-4 w-4 rotate-180 rtl:rotate-0 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                  </div>
                </div>

                {/* شريط الإضاءة الذهبي السفلي */}
                <div className="h-1 w-0 bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-500 group-hover:w-full" />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}