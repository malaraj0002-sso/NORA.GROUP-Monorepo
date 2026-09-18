import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { jsonError, requirePermission, requireSession } from '@/lib/server/http';
import { prisma } from '@/lib/db/prisma';

const MEDIA_DIR = path.join(process.cwd(), '.data', 'media');

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const allowed = await requirePermission(session, 'cms.read');
  if (allowed instanceof Response) return allowed;

  const { id } = await context.params;
  if (!id || !/^[a-zA-Z0-9._-]+$/.test(id) || id.includes('..')) {
    return jsonError('Invalid id', 400);
  }

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media?.objectKey || media.provider !== 'LOCAL') {
    return jsonError('Not found', 404);
  }

  const filename = path.basename(media.objectKey);
  try {
    const bytes = await readFile(path.join(MEDIA_DIR, filename));
    return new Response(bytes, {
      headers: {
        'Content-Type': media.mimeType || 'application/octet-stream',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return jsonError('Not found', 404);
  }
}
