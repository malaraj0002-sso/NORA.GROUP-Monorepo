import 'server-only';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

function copyBytes(source: ArrayLike<number>): Uint8Array {
  const bytes = new Uint8Array(source.length);
  for (let i = 0; i < source.length; i += 1) bytes[i] = source[i];
  return bytes;
}

function toHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('invalid hex');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function hashPassword(password: string, salt: Uint8Array): string {
  return toHex(copyBytes(scryptSync(password, salt, 64)));
}

export function createPasswordRecord(password: string): { salt: string; hash: string } {
  const salt = copyBytes(randomBytes(16));
  return { salt: toHex(salt), hash: hashPassword(password, salt) };
}

export function verifyPassword(password: string, saltHex: string, hashHex: string): boolean {
  try {
    const actual = fromHex(hashPassword(password, fromHex(saltHex)));
    const expected = fromHex(hashHex);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function timingSafeStringEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  const size = Math.max(a.length, b.length, 1);
  const pa = new Uint8Array(size);
  const pb = new Uint8Array(size);
  pa.set(a);
  pb.set(b);
  return timingSafeEqual(pa, pb) && a.length === b.length;
}
