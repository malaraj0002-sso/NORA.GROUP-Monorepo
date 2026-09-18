import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assertSameOrigin, jsonError, requirePermission, requireSession } from '@/lib/server/http';
import { prisma } from '@/lib/db/prisma';
import { writeAuditLog } from '@/lib/server/audit';

const MAX_BYTES = 8 * 1024 * 1024;
const MEDIA_DIR = path.join(process.cwd(), '.data', 'media');

function sniffType(bytes: Uint8Array): { mime: string; ext: string } | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { mime: 'image/png', ext: 'png' };
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  return null;
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError('Invalid origin', 403);
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const allowed = await requirePermission(session, 'media.upload');
  if (allowed instanceof Response) return allowed;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError('Invalid form data', 400);
  }

  const file = form.get('file');
  if (!(file instanceof File)) return jsonError('Missing file', 400);
  if (file.size > MAX_BYTES) return jsonError('File too large', 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffType(new Uint8Array(buffer));
  if (!sniffed) return jsonError('Unsupported image type', 400);

  try {
    const media = await prisma.media.create({
      data: {
        provider: 'LOCAL',
        mimeType: sniffed.mime,
        sizeBytes: buffer.length,
        filename: `upload.${sniffed.ext}`,
        alt: { he: '', ar: '', en: '', ru: '' },
      },
    });
    await mkdir(MEDIA_DIR, { recursive: true });
    const objectKey = `${media.id}.${sniffed.ext}`;
    await writeFile(path.join(MEDIA_DIR, objectKey), buffer);
    const url = `/api/media/${media.id}`;
    const updated = await prisma.media.update({
      where: { id: media.id },
      data: { objectKey, url },
    });
    await writeAuditLog({
      session,
      action: 'create',
      entity: 'media',
      entityId: updated.id,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      userAgent: request.headers.get('user-agent'),
    });
    return Response.json({
      ok: true,
      data: { assetId: updated.id, url: updated.url },
      assetId: updated.id,
      url: updated.url,
    });
  } catch {
    console.error('[media] local upload failed');
    return jsonError('Upload failed', 500);
  }
}
