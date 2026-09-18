import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { REVALIDATE_TAGS } from '@/lib/constants';

export const runtime = 'nodejs';

const MAX_SECRET_BYTES = 256;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;
const hits = new Map<string, number[]>();

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return ip.slice(0, 64);
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || a.length === 0 || a.length > MAX_SECRET_BYTES) return false;
  return timingSafeEqual(a, b);
}

function unauthorized() {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}

function revalidateSecret(): string {
  return process.env.REVALIDATE_SECRET?.trim() || process.env.SANITY_REVALIDATE_SECRET?.trim() || '';
}

/**
 * Dashboard (and operators) POST with header `x-revalidate-secret`.
 * Empty secret rejects every request (fail closed).
 */
export async function POST(request: Request) {
  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ message: 'Too Many Requests' }, { status: 429 });
  }

  const expected = revalidateSecret();
  const provided = request.headers.get('x-revalidate-secret') ?? '';

  if (!expected || expected.length > MAX_SECRET_BYTES || provided.length > MAX_SECRET_BYTES) {
    return unauthorized();
  }

  if (!secretMatches(provided, expected)) {
    return unauthorized();
  }

  for (const tag of Object.values(REVALIDATE_TAGS)) {
    revalidateTag(tag);
  }

  return NextResponse.json({ revalidated: true, now: Date.now() });
}

export function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405, headers: { Allow: 'POST' } });
}
