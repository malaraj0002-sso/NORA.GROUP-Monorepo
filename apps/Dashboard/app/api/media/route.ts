import { assertSameOrigin, jsonError, requireRole, requireSession } from '@/lib/server/http';
import { getSanityApiVersion, getSanityDataset, getSanityProjectId } from '@/lib/sanity/env';

const MAX_BYTES = 8 * 1024 * 1024;

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
  const allowed = requireRole(session, 'editor');
  if (allowed instanceof Response) return allowed;

  const token = process.env.SANITY_API_WRITE_TOKEN?.trim();
  const projectId = getSanityProjectId();
  if (!token || !projectId) return jsonError('Sanity write is not configured', 503);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError('Invalid form data', 400);
  }

  const file = form.get('file');
  if (!(file instanceof File)) return jsonError('Missing file', 400);
  if (file.size > MAX_BYTES) return jsonError('File too large', 400);

  const buffer = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffType(buffer);
  if (!sniffed) return jsonError('Unsupported image type', 400);

  const dataset = encodeURIComponent(getSanityDataset());
  const apiVersion = encodeURIComponent(getSanityApiVersion());
  const filename = `upload.${sniffed.ext}`;
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/assets/images/${dataset}?filename=${encodeURIComponent(filename)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': sniffed.mime,
        Accept: 'application/json',
      },
      body: buffer,
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    return jsonError('Upload request failed', 502);
  }

  const text = await response.text();
  if (!text.trim()) return jsonError('Empty upload response', 502);
  let payload: { document?: { _id?: string; url?: string } };
  try {
    payload = JSON.parse(text) as { document?: { _id?: string; url?: string } };
  } catch {
    return jsonError('Upload returned non-JSON', 502);
  }
  if (!response.ok || !payload.document?._id) return jsonError('Upload was rejected', 502);

  return Response.json({
    ok: true,
    assetId: payload.document._id,
    url: payload.document.url || '',
  });
}
