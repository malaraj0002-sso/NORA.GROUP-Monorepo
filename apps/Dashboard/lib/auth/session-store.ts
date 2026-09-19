import 'server-only';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db/prisma';
import { hashSessionToken, isRole, SESSION_MS, type Session } from './session';

export function createSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export async function createDatabaseSession(input: {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<{ token: string; expiresAt: Date }> {
  const token = createSessionToken();
  const tokenHash = await hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MS);
  await prisma.session.create({
    data: {
      userId: input.userId,
      tokenHash,
      expiresAt,
      ipAddress: input.ipAddress || undefined,
      userAgent: input.userAgent || undefined,
    },
  });
  return { token, expiresAt };
}

export async function resolveDatabaseSession(token: string | undefined | null): Promise<Session | null> {
  if (!token) return null;
  const tokenHash = await hashSessionToken(token);
  const row = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: { include: { role: true } },
    },
  });
  if (!row || row.revokedAt || row.expiresAt.getTime() <= Date.now()) return null;
  if (!row.user.enabled) return null;
  if (!isRole(row.user.role.name)) return null;
  return {
    sub: row.user.id,
    email: row.user.email,
    role: row.user.role.name,
    exp: row.expiresAt.getTime(),
  };
}

export async function revokeSessionByToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const tokenHash = await hashSessionToken(token);
  const result = await prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count > 0;
}

export async function revokeUserSessions(userId: string): Promise<number> {
  const result = await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count;
}
