import 'server-only';
import argon2 from 'argon2';

export const PASSWORD_ALGO = 'argon2id' as const;

let dummyHashPromise: Promise<string> | null = null;

function dummyHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = argon2.hash('dummy-not-used-for-login', { type: argon2.argon2id });
  }
  return dummyHashPromise;
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}

/** Always performs a hash verify so unknown emails take a similar path. */
export async function verifyPasswordOrDummy(password: string, passwordHash?: string): Promise<boolean> {
  if (passwordHash) return verifyPassword(password, passwordHash);
  await verifyPassword(password, await dummyHash());
  return false;
}
