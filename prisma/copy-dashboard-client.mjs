import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const pnpmDir = join(root, 'node_modules', '.pnpm');
if (!existsSync(pnpmDir)) {
  process.stderr.write('[prisma] node_modules/.pnpm not found; run pnpm install\n');
  process.exit(1);
}

function hasQueryEngine(dir) {
  if (!existsSync(dir)) return false;
  return readdirSync(dir).some(
    (name) =>
      name.includes('query_engine') ||
      name.includes('libquery_engine') ||
      name.includes('query-engine') ||
      name.endsWith('.node'),
  );
}

const clientDirs = readdirSync(pnpmDir).filter((name) => name.startsWith('@prisma+client@6.16.3'));
const generated = clientDirs
  .map((name) => join(pnpmDir, name, 'node_modules', '.prisma', 'client'))
  .filter(hasQueryEngine);

if (generated.length === 0) {
  process.stderr.write('[prisma] generated client with query engine not found; run prisma generate\n');
  process.exit(1);
}

const source = generated[0];
const targets = new Set(
  clientDirs.map((name) => join(pnpmDir, name, 'node_modules', '.prisma', 'client')),
);
targets.add(join(root, 'apps/Dashboard/node_modules/.prisma/client'));
targets.add(join(root, 'apps/web/node_modules/.prisma/client'));
targets.add(join(root, 'node_modules/.prisma/client'));

for (const to of targets) {
  if (to === source) continue;
  mkdirSync(dirname(to), { recursive: true });
  rmSync(to, { recursive: true, force: true });
  cpSync(source, to, { recursive: true });
}

process.stdout.write(`Copied Prisma client to ${targets.size} locations\n`);
