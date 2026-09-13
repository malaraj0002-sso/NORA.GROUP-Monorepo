import Image from 'next/image';
import { Link } from '@/i18n/navigation';

/**
 * Keep logo + English wordmark in LTR so RTL layouts never flip to "Group Nora".
 * The logo artwork already includes NORA GROUP; we still show a short text label for accessibility.
 */
export function BrandLockup({
  logoUrl,
  brandName,
  variant = 'light',
  compact = false,
  priority = false,
}: {
  logoUrl: string;
  brandName: string;
  variant?: 'light' | 'dark' | 'transparent';
  compact?: boolean;
  /** Keep false in chrome; hero/page banners own LCP */
  priority?: boolean;
}) {
  const textClass =
    variant === 'transparent'
      ? 'text-warm-50'
      : variant === 'dark'
        ? 'text-warm-50'
        : 'text-charcoal-900';

  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5 sm:gap-3.5"
      dir="ltr"
      aria-label={brandName}
    >
      {/* التحكم بحجم صورة اللوجو */}
      <Image
        src={logoUrl}
        alt={brandName}
        width={compact ? 56 : 64}
        height={compact ? 56 : 64}
        className={`${
          compact ? 'h-11 w-auto sm:h-12' : 'h-12 w-auto sm:h-14'
        } object-contain transition-transform duration-300 group-hover:scale-105`}
        priority={priority}
      />

      {/* التحكم بحجم وتنسيق الاسم المكتوب بجانب اللوجو */}
      <span
        className={`text-xl font-bold tracking-tight sm:text-2xl ${textClass}`}
      >
        {brandName}
      </span>
    </Link>
  );
}