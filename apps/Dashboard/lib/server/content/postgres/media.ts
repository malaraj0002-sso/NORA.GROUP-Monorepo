import { prisma } from '@/lib/db/prisma';

export async function resolveMediaIds(ids: string[]): Promise<string[]> {
  const resolved: string[] = [];
  for (const id of ids) {
    const trimmed = id.trim();
    if (!trimmed) continue;
    const byId = await prisma.media.findUnique({ where: { id: trimmed } });
    if (byId) {
      resolved.push(byId.id);
      continue;
    }
    const byKey = await prisma.media.findFirst({ where: { objectKey: trimmed } });
    if (byKey) resolved.push(byKey.id);
  }
  return resolved;
}
