/**
 * One-time / local Owner bootstrap. Never run from Next.js startup.
 *
 * Usage (password is never printed or written to .env):
 *   OWNER_BOOTSTRAP_EMAIL=owner@localhost OWNER_BOOTSTRAP_PASSWORD=******** pnpm bootstrap:owner
 *
 * Optional: --email=owner@localhost
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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

function loadDatabaseUrl(): string {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  for (const relative of ['.env', 'apps/Dashboard/.env.local', 'apps/web/.env.local']) {
    const path = resolve(root, relative);
    if (!existsSync(path)) continue;
    const value = parseEnvFile(readFileSync(path, 'utf8')).DATABASE_URL?.trim();
    if (value) {
      process.env.DATABASE_URL = value;
      return value;
    }
  }
  throw new Error('DATABASE_URL is required');
}

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : undefined;
}

async function main() {
  if (process.env.NORA_BOOTSTRAP_OWNER_AUTO === '1') {
    throw new Error('Owner bootstrap refuses automatic startup invocation');
  }

  const email = (
    readArg('email') ||
    process.env.OWNER_BOOTSTRAP_EMAIL ||
    'owner@localhost'
  )
    .trim()
    .toLowerCase();
  const password = process.env.OWNER_BOOTSTRAP_PASSWORD || '';

  if (!email.includes('@') || email.length > 254) {
    throw new Error('Owner email is invalid');
  }
  if (password.length < 10 || password.length > 200) {
    process.stderr.write(
      'Set OWNER_BOOTSTRAP_PASSWORD (10–200 chars). The value is not stored and will not be printed.\n',
    );
    process.exitCode = 1;
    return;
  }

  loadDatabaseUrl();
  const prisma = new PrismaClient();
  try {
    const ownerRole = await prisma.role.findUnique({ where: { name: 'owner' } });
    if (!ownerRole) {
      throw new Error('Owner role is missing. Run pnpm prisma:seed first.');
    }

    const owners = await prisma.user.findMany({
      where: { roleId: ownerRole.id },
      select: { id: true, email: true },
    });
    if (owners.length > 1) {
      throw new Error('Multiple Owner users exist. Refusing to change them automatically.');
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    if (owners.length === 1 && owners[0].email !== email) {
      throw new Error(
        'An Owner already exists with a different email. Refusing to create a second Owner.',
      );
    }

    if (owners.length === 1) {
      await prisma.user.update({
        where: { id: owners[0].id },
        data: { passwordHash, passwordAlgo: 'argon2id', enabled: true },
      });
      process.stdout.write(`Updated the existing Owner user (${email}). Password was not printed.\n`);
      return;
    }

    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) {
      throw new Error('That email already belongs to a non-Owner user.');
    }

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        passwordAlgo: 'argon2id',
        roleId: ownerRole.id,
        enabled: true,
      },
    });
    process.stdout.write(`Created the Owner user (${email}). Password was not printed.\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Owner bootstrap failed';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
