import { applySessionCookie, assertSameOrigin, jsonError } from '@/lib/server/http';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError('Invalid origin', 403);
  const response = NextResponse.json({ ok: true });
  return applySessionCookie(response, null, process.env.NODE_ENV === 'production');
}
