import { readServerEnv } from './env';

export type Role = 'owner' | 'admin' | 'editor' | 'employee';

export type Session = {
  sub: string;
  email: string;
  role: Role;
  exp: number;
};

export const SESSION_COOKIE = 'nora_session';
const SESSION_MS = 8 * 60 * 60 * 1000;

export function getAuthSecret(): string | undefined {
  const secret = readServerEnv('AUTH_SECRET');
  if (!secret || secret.length < 32) return undefined;
  return secret;
}

function utf8ToBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUtf8(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function hmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const bytes = new Uint8Array(signature);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function signSession(session: Omit<Session, 'exp'>, secret: string): Promise<string> {
  const payload: Session = { ...session, exp: Date.now() + SESSION_MS };
  const body = utf8ToBase64Url(JSON.stringify(payload));
  const sig = await hmacSha256(secret, body);
  return `${body}.${sig}`;
}

export async function readSession(token: string | undefined, secret: string): Promise<Session | null> {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = await hmacSha256(secret, body);
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const parsed = JSON.parse(base64UrlToUtf8(body)) as Session;
    if (!parsed?.email || !parsed.role || !parsed.exp) return null;
    if (parsed.exp < Date.now()) return null;
    if (
      parsed.role !== 'owner' &&
      parsed.role !== 'admin' &&
      parsed.role !== 'editor' &&
      parsed.role !== 'employee'
    ) {
      return null;
    }
    if (typeof parsed.sub !== 'string' || !parsed.sub) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MS / 1000,
  };
}
