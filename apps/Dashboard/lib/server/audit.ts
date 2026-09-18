import type { Session } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function writeAuditLog(input: {
  session: Session;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, string>;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        metadata: {
          email: input.session.email,
          role: input.session.role,
          ...(input.metadata && typeof input.metadata === 'object' ? input.metadata : {}),
        },
        ipAddress: input.ipAddress || undefined,
        userAgent: input.userAgent || undefined,
      },
    });
  } catch (error) {
    console.error('[audit] failed to write audit log');
  }
}
