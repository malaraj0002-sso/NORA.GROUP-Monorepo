import { readDashboardContent } from '@/lib/server/content/postgres/read';
import { jsonError, requirePermission, requireSession } from '@/lib/server/http';

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const allowed = await requirePermission(session, 'cms.read', request);
  if (allowed instanceof Response) return allowed;

  const bundle = await readDashboardContent();
  if (bundle.source === 'unavailable') {
    return jsonError(bundle.reason || 'PostgreSQL content is unavailable', 503);
  }
  return Response.json({
    ok: true,
    source: bundle.source,
    data: bundle.data,
    reason: bundle.reason,
  });
}
