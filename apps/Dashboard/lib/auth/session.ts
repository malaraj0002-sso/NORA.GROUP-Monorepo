export type Role = 'owner' | 'admin' | 'editor' | 'employee';

/** Request context built from PostgreSQL User + Session. Never trusted from the cookie body. */
export type Session = {
  sub: string;
  email: string;
  role: Role;
  exp: number;
};

export const SESSION_COOKIE = 'nora_session';
export const SESSION_MS = 8 * 60 * 60 * 1000;

export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MS / 1000,
  };
}

export function readRawSessionCookie(cookieHeader: string | undefined | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  const raw = match?.slice(`${SESSION_COOKIE}=`.length);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function hashSessionToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex: string[] = [];
  for (const byte of new Uint8Array(digest)) {
    hex.push(byte.toString(16).padStart(2, '0'));
  }
  return hex.join('');
}

export function isAssignableRole(role: string): role is Exclude<Role, 'owner'> {
  return role === 'admin' || role === 'editor' || role === 'employee';
}

export function isRole(value: string): value is Role {
  return value === 'owner' || isAssignableRole(value);
}
