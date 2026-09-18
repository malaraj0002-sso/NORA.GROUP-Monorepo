'use client';

import Image from 'next/image';
import { MessageCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const activeSlides = useMemo(() => {
    const raw = slides && slides.length > 0 ? slides : FALLBACK_SLIDES;
    return raw.map((s) => mediaSrc(s)).filter(Boolean);
  }, [slides]);

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
  }, [reduceMotion, activeSlides.length, currentSlide]);

  return (
    <section className="relative flex min-h-[88vh] items-end overflow-hidden pb-16 pt-28 sm:min-h-screen sm:pb-24 sm:pt-32 bg-charcoal-950">
      <div className="pointer-events-none absolute inset-0">
        {activeSlides.map((src, idx) => (
          <div
            key={`${idx}-${src}`}
            className={`absolute inset-0 ease-in-out ${
              reduceMotion ? '' : 'transition-opacity duration-[1400ms]'
            } ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            style={{ zIndex: idx === currentSlide ? 1 : 0 }}
          >
            <Image
              src={src}
              alt=""
              fill
              priority={idx === 0}
              className="object-cover object-center"
              sizes="100vw"
            />
          </div>
        ))}

        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-charcoal-950/70 via-charcoal-950/20 to-transparent" />
      </div>

      <div className="container-luxury relative z-10 max-w-4xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-gold-300 drop-shadow">
          {pillars}
        </p>
        <h1 className="text-hero font-bold text-balance text-warm-50 drop-shadow-md">{title}</h1>
        <p className="mt-5 max-w-2xl text-base text-warm-50 sm:text-lg lg:text-xl drop-shadow">
          {subtitle}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp shadow-md"
          >
            <MessageCircle className="h-5 w-5" />
            {whatsappLabel}
          </a>
          <Link
            href="/projects"
            className="btn-secondary border-warm-50 text-warm-50 hover:bg-warm-50 hover:text-charcoal-900 shadow-md"
          >
            {viewWorkLabel}
          </Link>
        </div>

        {activeSlides.length > 1 && (
          <div className="mt-12 flex items-center gap-2">
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={idx === currentSlide ? 'true' : undefined}
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
