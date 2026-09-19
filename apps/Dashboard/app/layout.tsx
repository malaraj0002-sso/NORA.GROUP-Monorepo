import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import { AppProviders } from './providers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { resolveDatabaseSession } from '@/lib/auth/session-store';
import { emptyAdminData } from '@/lib/mock-data';
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
  const cookieStore = await cookies();
  const uiLang = parseUiLang(cookieStore.get(UI_LANG_COOKIE)?.value) ?? DEFAULT_UI_LANG;
  const pathname = (await headers()).get('x-nora-pathname') || '';
  const session = await resolveDatabaseSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (pathname && pathname !== '/login' && !pathname.startsWith('/api/') && !session) {
    redirect('/login');
  }
  const content = session
    ? await (await import('@/lib/server/content/postgres/read')).readDashboardContent()
    : { source: 'mock' as const, data: emptyAdminData };

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
