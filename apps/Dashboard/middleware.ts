import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthSecret, readSession } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isStaticAsset = /\.(?:ico|png|jpe?g|gif|webp|svg|txt|xml|woff2?|css|js|map)$/i.test(pathname);

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname === '/login' ||
    isStaticAsset
  ) {
    return NextResponse.next();
  }

  const secret = getAuthSecret();
  if (!secret) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication is not configured' }, { status: 503 });
    }
    if (pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  const session = await readSession(request.cookies.get('nora_session')?.value, secret);
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
