'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { images } from '@/lib/content/images';
import { mediaSrc } from '@/lib/content/media';

const FALLBACK_SLIDES = [
  images.hero1,
  images.hero2,
  images.hero3,
  images.kitchen2,
  images.wardrobe1,
];

export function Hero({
  title,
  subtitle,
  pillars,
  slides,
  whatsapp,
  whatsappLabel,
  viewWorkLabel,
}: {
  title: string;
  subtitle: string;
  pillars: string;
  slides: string[];
  whatsapp: string;
  whatsappLabel: string;
  viewWorkLabel: string;
}) {
  // Do not call framer-motion's useReducedMotion() during render: it reads
  // matchMedia on the client while SSR keeps `null`, which can change motion
  // props on the first client paint and desync hydration further down the page.
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const rawSlides = slides && slides.length > 0 ? slides : FALLBACK_SLIDES;
  const activeSlides = rawSlides.map((s) => mediaSrc(s)).filter(Boolean);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setCurrentSlide((prev) => (prev >= activeSlides.length ? 0 : prev));
  }, [activeSlides.length]);

  useEffect(() => {
    if (reduceMotion || activeSlides.length < 2) return;
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [reduceMotion, activeSlides.length]);

  const slideSrc = activeSlides[currentSlide] ?? activeSlides[0];

  const fadeUp = (delay: number) =>
    reduceMotion
      ? { initial: false as const, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 40 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section className="relative flex min-h-[88vh] items-end overflow-hidden pb-16 pt-28 sm:min-h-screen sm:pb-24 sm:pt-32 bg-charcoal-950">
      
      {/* خلفية السلايدر بألوان الصور الأصلية 100% */}
      <div className="pointer-events-none absolute inset-0">
        <AnimatePresence mode="sync">
          <motion.div
            key={slideSrc}
            className="absolute inset-0"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
          >
            {slideSrc ? (
              <Image
                src={slideSrc}
                alt=""
                fill
                priority={currentSlide === 0}
                className="object-cover object-center"
                sizes="100vw"
              />
            ) : null}
          </motion.div>
        </AnimatePresence>

        {/* تعتيم خفيف جداً يغطي فقط المنطقة السفلى خلف النصوص دون التغطية على ألوان باقي الصورة */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/70 via-charcoal-950/20 to-transparent" />
      </div>

      {/* المحتوى النصي مع حماية الوضوح عبر drop-shadow */}
      <div className="container-luxury relative z-10 max-w-4xl">
        <motion.p
          className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-gold-300 drop-shadow"
          {...fadeUp(0.08)}
        >
          {pillars}
        </motion.p>
        <motion.h1 
          className="text-hero font-bold text-balance text-warm-50 drop-shadow-md" 
          {...fadeUp(0.2)}
        >
          {title}
        </motion.h1>
        <motion.p
          className="mt-5 max-w-2xl text-base text-warm-50 sm:text-lg lg:text-xl drop-shadow"
          {...fadeUp(0.34)}
        >
          {subtitle}
        </motion.p>

        {/* أزرار الدعوة للعمل */}
        <motion.div
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
          {...fadeUp(0.48)}
        >
          <motion.a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp shadow-md"
            whileHover={reduceMotion ? undefined : { scale: 1.03, y: -2 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          >
            <MessageCircle className="h-5 w-5" />
            {whatsappLabel}
          </motion.a>
          <Link
            href="/projects"
            className="btn-secondary border-warm-50 text-warm-50 hover:bg-warm-50 hover:text-charcoal-900 shadow-md"
          >
            {viewWorkLabel}
          </Link>
        </motion.div>

        {/* مؤشرات التنقل بين الصور (Dots) */}
        {activeSlides.length > 1 && (
          <div className="mt-12 flex items-center gap-2">
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 pointer-events-auto ${
                  idx === currentSlide
                    ? 'w-8 bg-gold-400'
                    : 'w-2 bg-warm-50/50 hover:bg-warm-50/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}