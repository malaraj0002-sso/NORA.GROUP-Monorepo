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

function candidateEnvPaths(): string[] {
  const cwd = process.cwd();
  return [
    resolve(cwd, '.env'),
    resolve(cwd, '../../.env'),
    resolve(cwd, '../.env'),
  ];
}

export function describeLocalDatabase(url: string): { host: string; database: string } {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    database: decodeURIComponent(parsed.pathname.replace(/^\//, '') || ''),
  };
}

export function assertLocalPostgresUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('DATABASE_URL is not a valid URL');
  }
  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error('DATABASE_URL must use the postgres/postgresql protocol');
  }
  const host = parsed.hostname.toLowerCase();
  if (host !== 'localhost' && host !== '127.0.0.1') {
    throw new Error(`Refusing to use a non-local PostgreSQL host (${host})`);
  }
  return url;
}

/** Loads gitignored root/app .env DATABASE_URL if needed. Never logs the URL. */
export function loadLocalDatabaseUrl(): string {
  if (!process.env.DATABASE_URL?.trim()) {
    for (const path of candidateEnvPaths()) {
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
    throw new Error(
      'DATABASE_URL is not set. Create a gitignored root .env with a LOCAL PostgreSQL URL (do not use production).',
    );
  }
  return assertLocalPostgresUrl(url);
}
