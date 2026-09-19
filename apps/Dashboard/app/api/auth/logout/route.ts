import { readRawSessionCookie } from '@/lib/auth/session';
import { resolveDatabaseSession, revokeSessionByToken } from '@/lib/auth/session-store';
import { applySessionCookie, assertSameOrigin, jsonError } from '@/lib/server/http';
import { requestAuditContext, writeAuditLog } from '@/lib/server/audit';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError('Invalid origin', 403);
  const token = readRawSessionCookie(request.headers.get('cookie'));
  const session = await resolveDatabaseSession(token);
  await revokeSessionByToken(token);
  if (session) {
    await writeAuditLog({
      session,
      action: 'logout',
      entity: 'auth',
      entityId: session.sub,
      ...requestAuditContext(request),
    });
  }
  const response = NextResponse.json({ ok: true });
  return applySessionCookie(response, null, process.env.NODE_ENV === 'production');
}
