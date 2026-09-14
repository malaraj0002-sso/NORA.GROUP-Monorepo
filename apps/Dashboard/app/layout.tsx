import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { cookies } from 'next/headers';
import { AppProviders } from './providers';
import { getAuthSecret, readSession } from '@/lib/auth/session';
import { emptyAdminData } from '@/lib/mock-data';
import { readDashboardContent } from '@/lib/sanity/read';
import { DEFAULT_UI_LANG, parseUiLang, UI_LANG_COOKIE, uiDir } from '@/lib/i18n/ui-lang';
import { translate } from '@/lib/i18n/messages';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const uiLang = parseUiLang(cookieStore.get(UI_LANG_COOKIE)?.value) ?? DEFAULT_UI_LANG;
  return {
    title: translate(uiLang, 'meta.title'),
    description: 'Nora Group admin',
    robots: { index: false, follow: false },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const secret = getAuthSecret();
  const cookieStore = await cookies();
  const uiLang = parseUiLang(cookieStore.get(UI_LANG_COOKIE)?.value) ?? DEFAULT_UI_LANG;
  const session = secret
    ? await readSession(cookieStore.get('nora_session')?.value, secret)
    : null;
  const content = session
    ? await readDashboardContent()
    : { data: emptyAdminData, source: 'mock' as const };

  return (
    <html lang={uiLang} dir={uiDir(uiLang)} suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-background text-foreground`} suppressHydrationWarning>
        <AppProviders initialData={content.data} source={content.source} initialUiLang={uiLang}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
