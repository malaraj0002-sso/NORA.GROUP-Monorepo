/** Server-only env reads. Never log returned values. */
export function readServerEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (raw == null) return undefined;
  let value = raw.replace(/^\uFEFF/, '').replace(/\r/g, '').trim();
  const quoted =
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2);
  if (quoted) {
    value = value.slice(1, -1).replace(/\r/g, '').trim();
  }
  return value.length ? value : undefined;
}
