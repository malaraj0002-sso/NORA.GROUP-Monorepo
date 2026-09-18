import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const pnpmDir = join(process.cwd(), 'node_modules', '.pnpm');
if (!existsSync(pnpmDir)) process.exit(0);

const dirs = readdirSync(pnpmDir);
const srcName = dirs.find((name) => name.startsWith('@prisma+client@6.16.3_') && name.includes('typescript@5.9.3'));
const dstName = dirs.find((name) => name.startsWith('@prisma+client@6.16.3_') && name.includes('typescript@5.2.2'));
if (!srcName || !dstName) process.exit(0);

const from = join(pnpmDir, srcName, 'node_modules', '.prisma', 'client');
const to = join(pnpmDir, dstName, 'node_modules', '.prisma', 'client');
if (!existsSync(from)) process.exit(0);
rmSync(to, { recursive: true, force: true });
cpSync(from, to, { recursive: true });
