import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@/lib/db/prisma';
import { localMediaDirectory } from '@/lib/storage/localMedia';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id || !/^[a-zA-Z0-9._-]+$/.test(id) || id.includes('..')) {
    return new Response('Not found', { status: 404 });
  }

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media?.objectKey || media.provider !== 'LOCAL') {
    return new Response('Not found', { status: 404 });
  }

  const filename = path.basename(media.objectKey);
  if (!filename.includes('.')) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const bytes = await readFile(path.join(localMediaDirectory(), filename));
    return new Response(bytes, {
      headers: {
        'Content-Type': media.mimeType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
