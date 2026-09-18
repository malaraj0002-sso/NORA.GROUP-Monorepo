import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function isUsableDatabaseUrl(raw: string | undefined): boolean {
  const value = raw?.trim();
  if (!value) return false;
  if (/USER:PASSWORD|\/\/USER[:@]/i.test(value)) return false;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') return false;
    return Boolean(parsed.username);
  } catch {
    return false;
  }
}

function parseEnvFile(contents: string): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

/** Load DATABASE_URL from process env or gitignored .env files. Never logs the URL. */
export function ensureDatabaseUrl(): string {
  if (!isUsableDatabaseUrl(process.env.DATABASE_URL)) {
    for (const envPath of [
      resolve(process.cwd(), '.env.local'),
      resolve(process.cwd(), '.env'),
      resolve(process.cwd(), '../../.env'),
    ]) {
      if (!existsSync(envPath)) continue;
      const parsed = parseEnvFile(readFileSync(envPath, 'utf8'));
      if (isUsableDatabaseUrl(parsed.DATABASE_URL)) {
        process.env.DATABASE_URL = parsed.DATABASE_URL.trim();
        break;
      }
    }
  }
  const url = process.env.DATABASE_URL?.trim();
  if (!isUsableDatabaseUrl(url)) {
    throw new Error('DATABASE_URL is not set');
  }
  return url as string;
}
