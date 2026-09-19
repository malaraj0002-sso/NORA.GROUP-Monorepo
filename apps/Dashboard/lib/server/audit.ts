import type { Session } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function writeAuditLog(input: {
  session?: Session | null;
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, string>;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const actorId = input.actorId ?? input.session?.sub ?? null;
  const metadata: Record<string, string> = {
    ...(input.session
      ? { email: input.session.email, role: input.session.role }
      : {}),
    ...(input.metadata && typeof input.metadata === 'object' ? input.metadata : {}),
  };

  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        metadata: Object.keys(metadata).length ? metadata : undefined,
        ipAddress: input.ipAddress || undefined,
        userAgent: input.userAgent || undefined,
      },
    });
  } catch {
    if (!actorId) {
      console.error('[audit] failed to write audit log');
      return;
    }
    try {
      await prisma.auditLog.create({
        data: {
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          metadata: Object.keys(metadata).length ? metadata : undefined,
          ipAddress: input.ipAddress || undefined,
          userAgent: input.userAgent || undefined,
        },
      });
    } catch {
      console.error('[audit] failed to write audit log');
    }
  }
}

export function requestAuditContext(request: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    userAgent: request.headers.get('user-agent'),
  };
}
