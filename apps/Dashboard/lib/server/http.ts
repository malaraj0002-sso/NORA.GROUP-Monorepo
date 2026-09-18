import { NextResponse } from 'next/server';
import { getAuthSecret, readSession, sessionCookieOptions, SESSION_COOKIE, type Role, type Session } from '@/lib/auth/session';
import { hasMinRole } from '@/lib/auth/rbac';
import { roleHasPermission, type PermissionCode } from '@/lib/server/permissions';

export function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function hostname(hostHeader: string): string {
  return hostHeader.trim().toLowerCase();
}

function isLoopbackHost(hostHeader: string): boolean {
  const host = hostname(hostHeader).replace(/^\[|\]$/g, '');
  const name = host.startsWith('::1') ? '::1' : host.split(':')[0];
  return name === 'localhost' || name === '127.0.0.1' || name === '::1';
}

function hostsMatch(left: string, right: string): boolean {
  return hostname(left) === hostname(right);
}

export function assertSameOrigin(request: Request): boolean {
  const host = request.headers.get('host');
  if (!host) return false;
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      return hostsMatch(new URL(origin).host, host);
    } catch {
      return false;
    }
  }
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return hostsMatch(new URL(referer).host, host);
    } catch {
      return false;
    }
  }
  return process.env.NODE_ENV !== 'production' && isLoopbackHost(host);
}

export function applySessionCookie(response: NextResponse, token: string | null, secure: boolean): NextResponse {
  const opts = sessionCookieOptions(secure);
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token ?? '',
    httpOnly: true,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
    maxAge: token ? opts.maxAge : 0,
  });
  return response;
}

export async function getSessionFromRequest(request: Request): Promise<Session | null> {
  const secret = getAuthSecret();
  if (!secret) return null;
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.split(';').map((p) => p.trim()).find((p) => p.startsWith('nora_session='));
  const raw = match?.slice('nora_session='.length);
  if (!raw) return null;
  try {
    return await readSession(decodeURIComponent(raw), secret);
  } catch {
    return await readSession(raw, secret);
  }
}

export async function requireSession(request: Request): Promise<Session | NextResponse> {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError('Unauthorized', 401);
  return session;
}

export function requireRole(session: Session, min: Role): true | NextResponse {
  if (!hasMinRole(session.role, min)) return jsonError('Forbidden', 403);
  return true;
}

export async function requirePermission(
  session: Session,
  code: PermissionCode,
): Promise<true | NextResponse> {
  const allowed = await roleHasPermission(session.role, code);
  if (!allowed) return jsonError('Forbidden', 403);
  return true;
}
