import { z } from 'zod';
import { createUser, listUsers, updateUser, type Role } from '@/lib/auth/users';
import { assertSameOrigin, jsonError, requirePermission, requireSession } from '@/lib/server/http';

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const allowed = await requirePermission(session, 'users.manage');
  if (allowed instanceof Response) return allowed;
  const users = await listUsers();
  return Response.json({ users });
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError('Invalid origin', 403);
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const allowed = await requirePermission(session, 'users.manage');
  if (allowed instanceof Response) return allowed;

  let payload: unknown;
  try {
    const text = await request.text();
    if (!text.trim()) return jsonError('Empty body', 400);
    payload = JSON.parse(text);
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = z
    .object({
      email: z.string().email(),
      password: z.string().min(10).max(200),
      role: z.enum(['admin', 'editor', 'employee']),
    })
    .strict()
    .safeParse(payload);

  if (!parsed.success) return jsonError('Invalid user payload', 400);

  const created = await createUser(parsed.data);
  if (!created.ok) return jsonError(created.error, 400);
  return Response.json({ ok: true, id: created.id });
}

export async function PATCH(request: Request) {
  if (!assertSameOrigin(request)) return jsonError('Invalid origin', 403);
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const allowed = await requirePermission(session, 'users.manage');
  if (allowed instanceof Response) return allowed;

  let payload: unknown;
  try {
    const text = await request.text();
    if (!text.trim()) return jsonError('Empty body', 400);
    payload = JSON.parse(text);
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = z
    .object({
      id: z.string().regex(/^user-[a-f0-9]{16,64}$/),
      role: z.enum(['admin', 'editor', 'employee']).optional(),
      enabled: z.boolean().optional(),
    })
    .strict()
    .safeParse(payload);

  if (!parsed.success) return jsonError('Invalid patch', 400);
  const result = await updateUser(parsed.data.id, {
    role: parsed.data.role as Exclude<Role, 'owner'> | undefined,
    enabled: parsed.data.enabled,
  });
  if (!result.ok) return jsonError(result.error, 400);
  return Response.json({ ok: true });
}
