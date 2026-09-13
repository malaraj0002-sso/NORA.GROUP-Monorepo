import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Cairo, Inter, Noto_Sans_Hebrew } from 'next/font/google';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { CookieNotice } from '@/components/ui/CookieNotice';
import { FloatingWhatsApp } from '@/components/ui/FloatingWhatsApp';
import { SiteProvider } from '@/components/providers/SiteProvider';
import { toChrome } from '@/lib/content/chrome';
import { getSiteContent } from '@/lib/content/getContent';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_META,
  SITE_URL,
  type AppLocale,
} from '@/lib/constants';
import { isAppLocale } from '@/lib/i18n/locale';
import { t } from '@/lib/i18n/locale';
import '../globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const notoHebrew = Noto_Sans_Hebrew({
  subsets: ['hebrew'],
  variable: '--font-noto-hebrew',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
  weight: ['300', '400', '600', '700'],
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isAppLocale(raw) ? raw : DEFAULT_LOCALE;
  const content = await getSiteContent();
  const title = t(content.settings.seoTitle, locale);
  const description = t(content.settings.seoDescription, locale);

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    openGraph: {
      siteName: content.settings.brandName,
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;

  if (!isAppLocale(raw)) notFound();

  const locale = raw as AppLocale;

  setRequestLocale(locale);

  const messages = await getMessages();
  const content = await getSiteContent();
  const dir = LOCALE_META[locale].dir;

  const fontClass =
    locale === 'he'
      ? `${inter.variable} ${notoHebrew.variable}`
      : locale === 'ar'
        ? `${inter.variable} ${cairo.variable}`
        : inter.variable;

  return (
    <html
      lang={LOCALE_META[locale].htmlLang}
      dir={dir}
      className={`${fontClass}${locale === 'ar' ? ' font-arabic' : locale === 'he' ? ' font-hebrew' : ''}`}
    >
      <body className="min-h-screen overflow-x-hidden">
        <NextIntlClientProvider messages={messages}>
          <SiteProvider chrome={toChrome(content, locale)}>
            <Header />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <CookieNotice />
            <FloatingWhatsApp />
          </SiteProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}