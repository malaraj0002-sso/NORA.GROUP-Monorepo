import type { Role } from '@/lib/auth/session';
import { hasMinRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/db/prisma';

export const PERMISSION_CODES = [
  'cms.read',
  'cms.write',
  'cms.delete',
  'media.upload',
  'users.manage',
  'translations.manage',
  'audit.read',
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

/** Used only when RolePermission rows are missing (unseeded local DB). */
const RANK_FALLBACK: Record<PermissionCode, Role> = {
  'cms.read': 'editor',
  'cms.write': 'editor',
  'cms.delete': 'admin',
  'media.upload': 'editor',
  'users.manage': 'owner',
  'translations.manage': 'editor',
  'audit.read': 'admin',
};

export async function roleHasPermission(role: Role, code: PermissionCode): Promise<boolean> {
  try {
    const row = await prisma.role.findUnique({
      where: { name: role },
      include: { permissions: { include: { permission: true } } },
    });
    if (row && row.permissions.length > 0) {
      return row.permissions.some((item: { permission: { code: string } }) => item.permission.code === code);
    }
  } catch {
    /* unseeded or unreachable — use rank fallback */
  }
  return hasMinRole(role, RANK_FALLBACK[code]);
}
