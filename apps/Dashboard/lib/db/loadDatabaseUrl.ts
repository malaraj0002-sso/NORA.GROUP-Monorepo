import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
  if (!process.env.DATABASE_URL?.trim()) {
    for (const path of [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')]) {
      if (!existsSync(path)) continue;
      const parsed = parseEnvFile(readFileSync(path, 'utf8'));
      if (parsed.DATABASE_URL?.trim()) {
        process.env.DATABASE_URL = parsed.DATABASE_URL.trim();
        break;
      }
    }
  }
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return url;
}
