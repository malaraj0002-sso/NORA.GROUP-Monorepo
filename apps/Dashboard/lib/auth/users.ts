import 'server-only';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readServerEnv } from './env';
import { createPasswordRecord, timingSafeStringEqual, verifyPassword } from './password';
import { ROLE_RANK, hasMinRole } from './rbac';
import type { Role } from './session';
import { randomBytes } from 'node:crypto';

export type { Role };
export { ROLE_RANK, hasMinRole };

export type StoredUser = {
  id: string;
  email: string;
  role: Role;
  enabled: boolean;
  salt: string;
  hash: string;
};

const DATA_FILE = path.join(process.cwd(), '.data', 'users.json');
const USER_ID_RE = /^user-[a-f0-9]{16,64}$/;
const DUMMY = createPasswordRecord('dummy-not-used-for-login');

let writeChain: Promise<unknown> = Promise.resolve();

function withUserLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function loadFileUsers(): Promise<StoredUser[]> {
  try {
    const raw = await readFile(DATA_FILE, 'utf8');
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((u): u is StoredUser => {
      return (
        !!u &&
        typeof u === 'object' &&
        typeof (u as StoredUser).id === 'string' &&
        USER_ID_RE.test((u as StoredUser).id) &&
        typeof (u as StoredUser).email === 'string' &&
        typeof (u as StoredUser).hash === 'string' &&
        typeof (u as StoredUser).salt === 'string' &&
        typeof (u as StoredUser).role === 'string' &&
        (u as StoredUser).role !== 'owner'
      );
    });
  } catch {
    return [];
  }
}

async function saveFileUsers(users: StoredUser[]): Promise<void> {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function envOwner(): { email: string; password: string } | null {
  const email = readServerEnv('DASHBOARD_OWNER_EMAIL')?.toLowerCase();
  const password = readServerEnv('DASHBOARD_OWNER_PASSWORD');
  if (!email || !password) return null;
  return { email, password };
}

export async function authenticateUser(email: string, password: string): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) return null;

  const owner = envOwner();
  if (owner && normalized === owner.email) {
    if (timingSafeStringEqual(password, owner.password)) {
      return {
        id: 'env-owner',
        email: owner.email,
        role: 'owner',
        enabled: true,
        salt: '',
        hash: '',
      };
    }
    return null;
  }

  const users = await loadFileUsers();
  const found = users.find((u) => u.email === normalized);
  if (!found || !found.enabled) {
    verifyPassword(password, DUMMY.salt, DUMMY.hash);
    return null;
  }
  if (!verifyPassword(password, found.salt, found.hash)) return null;
  return found;
}

export async function listUsers(): Promise<Omit<StoredUser, 'salt' | 'hash'>[]> {
  const users = await loadFileUsers();
  const owner = envOwner();
  const rows = users.map(({ salt, hash, ...rest }) => rest);
  if (owner && !rows.some((u) => u.email === owner.email)) {
    rows.unshift({
      id: 'env-owner',
      email: owner.email,
      role: 'owner',
      enabled: true,
    });
  }
  return rows;
}

export async function createUser(input: {
  email: string;
  password: string;
  role: Role;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  return withUserLock(async () => {
    if (input.role === 'owner') return { ok: false, error: 'Cannot create another Owner via the API' };
    if (input.role !== 'admin' && input.role !== 'editor' && input.role !== 'employee') {
      return { ok: false, error: 'Invalid role' };
    }
    const email = input.email.trim().toLowerCase();
    if (!email.includes('@') || email.length > 254) return { ok: false, error: 'Invalid email' };
    if (input.password.length < 10 || input.password.length > 200) {
      return { ok: false, error: 'Password must be at least 10 characters' };
    }
    const owner = envOwner();
    if (owner && email === owner.email) return { ok: false, error: 'Email is reserved' };
    const users = await loadFileUsers();
    if (users.some((u) => u.email === email)) return { ok: false, error: 'User already exists' };
    const { salt, hash } = createPasswordRecord(input.password);
    const user: StoredUser = {
      id: `user-${randomBytes(16).toString('hex')}`,
      email,
      role: input.role,
      enabled: true,
      salt,
      hash,
    };
    users.push(user);
    try {
      await saveFileUsers(users);
    } catch {
      return { ok: false, error: 'User store is not writable on this host' };
    }
    return { ok: true, id: user.id };
  });
}

export async function updateUser(
  id: string,
  patch: { role?: Role; enabled?: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  return withUserLock(async () => {
    if (id === 'env-owner') return { ok: false, error: 'Cannot modify the environment Owner' };
    if (!USER_ID_RE.test(id)) return { ok: false, error: 'User not found' };
    if (patch.role === 'owner') return { ok: false, error: 'Cannot promote to Owner' };
    if (patch.role && patch.role !== 'admin' && patch.role !== 'editor' && patch.role !== 'employee') {
      return { ok: false, error: 'Invalid role' };
    }
    const users = await loadFileUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx < 0) return { ok: false, error: 'User not found' };
    if (patch.role) users[idx].role = patch.role;
    if (typeof patch.enabled === 'boolean') users[idx].enabled = patch.enabled;
    try {
      await saveFileUsers(users);
    } catch {
      return { ok: false, error: 'User store is not writable on this host' };
    }
    return { ok: true };
  });
}
