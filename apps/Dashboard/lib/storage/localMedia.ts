import { mkdir } from 'node:fs/promises';
import path from 'node:path';

/** Shared LOCAL upload directory (repo-root/storage/media). */
export function localMediaDirectory(): string {
  const fromEnv = process.env.MEDIA_DIR?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.resolve(process.cwd(), '../../storage/media');
}

export async function ensureLocalMediaDirectory(): Promise<string> {
  const dir = localMediaDirectory();
  await mkdir(dir, { recursive: true });
  return dir;
}
