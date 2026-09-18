import { mutationSchema } from '@/lib/server/content/schema';
import { applyMutation } from '@/lib/server/content/postgres/mutate';
import { assertSameOrigin, jsonError, requirePermission, requireSession } from '@/lib/server/http';

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError('Invalid origin', 403);

  const session = await requireSession(request);
  if (session instanceof Response) return session;

  let payload: unknown;
  try {
    const text = await request.text();
    if (!text.trim()) return jsonError('Empty body', 400);
    payload = JSON.parse(text);
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = mutationSchema.safeParse(payload);
  if (!parsed.success) return jsonError('Invalid mutation', 400);

  const needed = parsed.data.op === 'delete' ? 'cms.delete' : 'cms.write';
  const allowed = await requirePermission(session, needed);
  if (allowed instanceof Response) return allowed;

  const result = await applyMutation(parsed.data, {
    session,
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    userAgent: request.headers.get('user-agent'),
  });
  if (!result.ok) {
    return jsonError(result.error, result.status ?? 500);
  }
  return Response.json({
    ok: true,
    data: { id: result.id, revalidated: result.revalidated },
    id: result.id,
    revalidated: result.revalidated,
  });
}
