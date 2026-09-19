import { authenticateUser } from '@/lib/auth/users';
import { createDatabaseSession } from '@/lib/auth/session-store';
import { applySessionCookie, assertSameOrigin, jsonError } from '@/lib/server/http';
import { requestAuditContext, writeAuditLog } from '@/lib/server/audit';
import { NextResponse } from 'next/server';

const hits = new Map<string, number[]>();

function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  return request.headers.get('x-real-ip')?.trim() || 'local';
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= 8) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError('Invalid origin', 403);
  if (rateLimited(clientKey(request))) return jsonError('Too many attempts', 429);

  const ctx = requestAuditContext(request);

  let payload: { email?: string; password?: string };
  try {
    const text = await request.text();
    if (!text.trim()) return jsonError('Empty body', 400);
    payload = JSON.parse(text) as { email?: string; password?: string };
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const email = String(payload.email || '');
  const user = await authenticateUser(email, String(payload.password || ''));
  if (!user) {
    await writeAuditLog({
      action: 'login_failed',
      entity: 'auth',
      metadata: { email: email.trim().toLowerCase().slice(0, 254) },
      ...ctx,
    });
    return jsonError('Invalid credentials', 401);
  }

  const { token } = await createDatabaseSession({
    userId: user.id,
    ...ctx,
  });
  await writeAuditLog({
    actorId: user.id,
    session: { sub: user.id, email: user.email, role: user.role, exp: Date.now() },
    action: 'login',
    entity: 'auth',
    entityId: user.id,
    ...ctx,
  });

  const response = NextResponse.json({ ok: true, role: user.role });
  return applySessionCookie(response, token, process.env.NODE_ENV === 'production');
}
