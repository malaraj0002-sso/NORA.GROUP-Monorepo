'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Reveal } from '@/components/ui/Reveal';
import type { ProjectCategory } from '@/lib/constants';
import { mediaSrc } from '@/lib/content/media';

export type ProjectCard = {
  slug: string;
  title: string;
  category: ProjectCategory;
  image: string;
  description?: string;
};

export function ProjectsGrid({
  labels,
  projects,
}: {
  labels: Record<ProjectCategory | 'all', string>;
  projects: ProjectCard[];
}) {
  const [filter, setFilter] = useState<ProjectCategory | 'all'>('all');
  
  const categories = useMemo(
    () => ['all' as const, ...Array.from(new Set(projects.map((p) => p.category)))],
    [projects],
  );

  const filtered = projects.filter((p) => filter === 'all' || p.category === filter);

  return (
    <div className="space-y-12">
      {/* أزرار الفلترة الفاخرة */}
      <div className="flex flex-wrap justify-center gap-3">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`min-h-11 rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300 ${
              filter === cat
                ? 'bg-gold-500 text-white shadow-lg shadow-gold-500/25 scale-105'
                : 'bg-white text-charcoal-700 border border-gold-200/60 hover:border-gold-400 hover:text-gold-600'
            }`}
          >
            {labels[cat]}
          </button>
        ))}
      </div>

      {/* شبكة البطاقات الفاخرة */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p, i) => (
          <Reveal key={p.slug} delay={i * 40}>
            <Link
              href={`/projects/${p.slug}`}
              prefetch={true}
              className="group relative flex flex-col h-full overflow-hidden rounded-2xl border border-gold-200/50 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-gold-400 hover:shadow-2xl hover:shadow-gold-500/20"
            >
              {/* حاوية الصورة وتأثيرات التحويم */}
              <div className="relative aspect-[16/11] w-full overflow-hidden bg-charcoal-900">
                <Image
                  src={mediaSrc(p.image)}
                  alt={p.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:opacity-90"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                
                {/* تدرج ظلي خلف النصوص */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-charcoal-950/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />

                {/* وسام اسم القسم */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                  <Sparkles className="h-3 w-3 text-gold-400" />
                  <span>{labels[p.category]}</span>
                </div>

                {/* زر الفتح العائم */}
                <div className="absolute bottom-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:bg-gold-500 group-hover:border-gold-400 shadow-md">
                  <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:rotate-45" />
                </div>
              </div>

              {/* تفاصيل المشروع */}
              <div className="flex flex-col justify-between flex-1 p-6">
                <div>
                  <h3 className="text-xl font-bold text-charcoal-900 transition-colors duration-300 group-hover:text-gold-600">
                    {p.title}
                  </h3>

                  {p.description && (
                    <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-charcoal-600">
                      {p.description}
                    </p>
                  )}
                </div>

                {/* زر الذهاب بالتفاصيل */}
                <div className="mt-6 flex items-center text-sm font-semibold text-gold-600 transition-all duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                  <span>عرض التفاصيل</span>
                  <ArrowLeft className="mr-2 h-4 w-4 rtl:rotate-0 rotate-180 transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </div>
              </div>

              {/* خط التوهج الذهبي السفلي */}
              <div className="h-1 w-0 bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-500 group-hover:w-full" />
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}