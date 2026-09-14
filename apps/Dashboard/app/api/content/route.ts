import { readDashboardContent } from '@/lib/sanity/read';
import { jsonError, requireRole, requireSession } from '@/lib/server/http';

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const allowed = requireRole(session, 'editor');
  if (allowed instanceof Response) return allowed;

  const bundle = await readDashboardContent();
  return Response.json({
    source: bundle.source,
    data: bundle.data,
    reason: bundle.reason,
  });
}
