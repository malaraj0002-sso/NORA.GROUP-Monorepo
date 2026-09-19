import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { hashPassword, PASSWORD_ALGO, verifyPasswordOrDummy } from './password';
import { isAssignableRole, type Role } from './session';
import { ROLE_RANK, hasMinRole } from './rbac';

export type { Role };
export { ROLE_RANK, hasMinRole };

export type PublicUser = {
  id: string;
  email: string;
  role: Role;
  enabled: boolean;
};

export async function authenticateUser(email: string, password: string): Promise<PublicUser | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) return null;

  const user = await prisma.user.findUnique({
    where: { email: normalized },
    include: { role: true },
  });

  const hash = user && user.enabled ? user.passwordHash : undefined;
  const valid = await verifyPasswordOrDummy(password, hash);
  if (!user || !user.enabled || !valid) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role.name,
    enabled: user.enabled,
  };
}

export async function listUsers(): Promise<PublicUser[]> {
  const rows = await prisma.user.findMany({
    include: { role: true },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role.name,
    enabled: row.enabled,
  }));
}

export async function createUser(input: {
  email: string;
  password: string;
  role: Role;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (input.role === 'owner' || !isAssignableRole(input.role)) {
    return { ok: false, error: 'Cannot create another Owner via the API' };
  }
  const email = input.email.trim().toLowerCase();
  if (!email.includes('@') || email.length > 254) return { ok: false, error: 'Invalid email' };
  if (input.password.length < 10 || input.password.length > 200) {
    return { ok: false, error: 'Password must be at least 10 characters' };
  }

  const role = await prisma.role.findUnique({ where: { name: input.role } });
  if (!role) return { ok: false, error: 'Role is not available' };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: 'User already exists' };

  const passwordHash = await hashPassword(input.password);
  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      passwordAlgo: PASSWORD_ALGO,
      roleId: role.id,
      enabled: true,
    },
  });
  return { ok: true, id: created.id };
}

export async function updateUser(
  id: string,
  patch: { role?: Role; enabled?: boolean },
): Promise<{ ok: true; disabled?: boolean; roleChanged?: boolean } | { ok: false; error: string }> {
  if (patch.role === 'owner') return { ok: false, error: 'Cannot promote to Owner' };
  if (patch.role && !isAssignableRole(patch.role)) return { ok: false, error: 'Invalid role' };

  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });
  if (!user) return { ok: false, error: 'User not found' };
  if (user.role.name === 'owner') return { ok: false, error: 'Cannot modify the Owner' };

  let nextRoleId = user.roleId;
  let roleChanged = false;
  if (patch.role && patch.role !== user.role.name) {
    const role = await prisma.role.findUnique({ where: { name: patch.role } });
    if (!role) return { ok: false, error: 'Role is not available' };
    nextRoleId = role.id;
    roleChanged = true;
  }

  const enabled = typeof patch.enabled === 'boolean' ? patch.enabled : user.enabled;
  const disabled = user.enabled && enabled === false;
  const shouldRevoke = disabled || roleChanged;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: {
        roleId: nextRoleId,
        enabled,
      },
    });
    if (shouldRevoke) {
      await tx.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  });

  return { ok: true, disabled, roleChanged };
}
