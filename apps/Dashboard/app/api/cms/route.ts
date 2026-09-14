import { mutationSchema } from '@/lib/server/content/schema';
import { applyMutation } from '@/lib/server/content/mutate';
import { assertSameOrigin, jsonError, requireRole, requireSession } from '@/lib/server/http';

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError('Invalid origin', 403);

  const session = await requireSession(request);
  if (session instanceof Response) return session;

  const allowed = requireRole(session, 'editor');
  if (allowed instanceof Response) return allowed;

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

  if (parsed.data.op === 'delete') {
    const del = requireRole(session, 'admin');
    if (del instanceof Response) return del;
  }

  const result = await applyMutation(parsed.data);
  if (!result.ok) {
    return jsonError(result.error, result.status ?? 502);
  }
  return Response.json({
    ok: true,
    id: result.id,
    revalidated: result.revalidated,
  });
}
