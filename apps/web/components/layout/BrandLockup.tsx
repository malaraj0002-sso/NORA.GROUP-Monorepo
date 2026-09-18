import Image from 'next/image';
import { Link } from '@/i18n/navigation';

/**
 * Keep logo + English wordmark in LTR so RTL layouts never flip to "Group Nora".
 * dir="ltr" lives on an inner span, not the next-intl Link (avoids hydration mismatch).
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
        : 'text-foreground';

  return (
    <Link href="/" className="group inline-flex items-center" aria-label={brandName}>
      <span dir="ltr" className="flex items-center gap-2.5 sm:gap-3.5">
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
        <span className={`text-xl font-bold tracking-tight sm:text-2xl ${textClass}`}>{brandName}</span>
      </span>
    </Link>
  );
}
