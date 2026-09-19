/**
 * Local Phase 4A auth checks. Never prints passwords, hashes, or tokens.
 */
import { randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { ensureDatabaseUrl } from '../lib/db/loadDatabaseUrl';
import { prisma } from '../lib/db/prisma';
import { hashSessionToken } from '../lib/auth/session';
import { createSessionToken } from '../lib/auth/session-store';
import { roleHasPermission } from '../lib/server/permissions';

import { NextRequest } from 'next/server';
import { POST as loginPost } from '../app/api/auth/login/route';
import { POST as logoutPost } from '../app/api/auth/logout/route';
import { GET as usersGet, PATCH as usersPatch } from '../app/api/users/route';
import { GET as contentGet } from '../app/api/content/route';
import { POST as cmsPost } from '../app/api/cms/route';
import { middleware } from '../middleware';

const BASE = 'http://localhost:3000';

function cookieHeader(token: string) {
  return `nora_session=${token}`;
}

function apiRequest(path: string, init?: RequestInit) {
  return new Request(`${BASE}${path}`, {
    ...init,
    headers: {
      Host: 'localhost:3000',
      Origin: BASE,
      ...(init?.headers || {}),
    },
  });
}

function pass(name: string) {
  process.stdout.write(`PASS ${name}\n`);
}
function fail(name: string, reason: string): never {
  process.stderr.write(`FAIL ${name}: ${reason}\n`);
  throw new Error(name);
}
function skip(name: string, reason: string) {
  process.stdout.write(`NOT RUN ${name}: ${reason}\n`);
}

async function json(res: Response) {
  const text = await res.text();
  if (!text.trim()) return {};
  return JSON.parse(text) as Record<string, unknown>;
}

function forbiddenSecrets(payload: unknown): string[] {
  const raw = JSON.stringify(payload);
  const hits: string[] = [];
  for (const key of ['passwordHash', 'passwordAlgo', 'tokenHash']) {
    if (raw.includes(key)) hits.push(key);
  }
  return hits;
}

async function login(email: string, password: string) {
  return loginPost(
    new Request(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Host: 'localhost:3000', Origin: BASE },
      body: JSON.stringify({ email, password }),
    }),
  );
}

async function main() {
  ensureDatabaseUrl();
  const url = new URL(process.env.DATABASE_URL || 'postgresql://localhost');
  if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    throw new Error('Refusing to run auth checks against a non-local database');
  }

  const services = await prisma.service.findMany({ select: { slug: true } });
  const slugs = services.map((row) => String(row.slug));
  if (slugs.includes('doors') || slugs.some((slug) => slug.toLowerCase().includes('door'))) {
    fail('regression-no-doors', 'door slug present');
  }
  if (services.length !== 7) fail('regression-services', `expected 7 services, got ${services.length}`);
  pass('regression-seven-services');
  pass('regression-no-doors');
  const hero = await prisma.homeHeroMedia.count();
  if (hero < 1) skip('regression-hero-media', 'no HomeHeroMedia rows');
  else pass('regression-hero-media');

  const ownerRole = await prisma.role.findUnique({ where: { name: 'owner' } });
  if (!ownerRole) throw new Error('Owner role missing — seed first');
  const owners = await prisma.user.findMany({ where: { roleId: ownerRole.id } });

  const password = `${randomBytes(18).toString('base64url')}Aa1`;
  let ownerEmail = 'owner@localhost';
  let createdOwner = false;
  if (owners.length === 0) {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const created = await prisma.user.create({
      data: {
        email: ownerEmail,
        passwordHash,
        passwordAlgo: 'argon2id',
        roleId: ownerRole.id,
        enabled: true,
      },
    });
    owners.push(created);
    createdOwner = true;
  } else {
    ownerEmail = owners[0].email;
  }

  const owner = await prisma.user.findUniqueOrThrow({ where: { id: owners[0].id } });
  if (!owner.passwordHash) fail('owner-hash-present', 'empty passwordHash');
  pass('owner-user-exists');
  pass('owner-hash-present');
  if (owner.passwordHash === password || owner.passwordHash.length < 20) {
    fail('owner-hash-not-plaintext', 'hash looks like plaintext');
  }
  if (!owner.passwordHash.startsWith('$argon2')) fail('owner-hash-not-plaintext', 'hash is not argon2 encoded');
  pass('owner-hash-not-plaintext');

  const unknown = await login(`unknown-${randomBytes(4).toString('hex')}@localhost`, password);
  if (unknown.status !== 401) fail('unknown-email', `status ${unknown.status}`);
  pass('unknown-email');

  const wrong = await login(ownerEmail, `${password}x`);
  if (wrong.status !== 401) fail('wrong-password', `status ${wrong.status}`);
  pass('wrong-password');

  let ownerCookie = '';
  if (createdOwner) {
    const ok = await login(ownerEmail, password);
    const body = await json(ok);
    if (ok.status !== 200 || body.ok !== true) fail('owner-login', `status ${ok.status}`);
    const setCookie = ok.headers.get('set-cookie') || '';
    const match = setCookie.match(/nora_session=([^;]+)/);
    if (!match) fail('owner-login', 'no session cookie');
    ownerCookie = decodeURIComponent(match[1]);
    pass('owner-login');
  } else {
    skip('owner-login', 'Owner already existed; password was not rotated');
    const token = createSessionToken();
    await prisma.session.create({
      data: {
        userId: owner.id,
        tokenHash: await hashSessionToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    ownerCookie = token;
  }

  const sessionRow = await prisma.session.findFirst({
    where: { userId: owner.id, revokedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (!sessionRow) fail('session-row', 'no session row');
  pass('session-row');
  if (sessionRow.tokenHash === ownerCookie) fail('token-hash-differs', 'raw token stored');
  pass('token-hash-differs');

  const noCookie = await cmsPost(apiRequest('/api/cms', { method: 'POST' }));
  if (noCookie.status !== 401 && noCookie.status !== 403) fail('cms-unauthenticated', `status ${noCookie.status}`);
  pass('cms-unauthenticated');

  const page = middleware(new NextRequest(`${BASE}/`));
  if (page.status !== 307 && page.status !== 308) fail('dashboard-no-cookie', `status ${page.status}`);
  pass('dashboard-no-cookie');

  async function makeUser(role: 'admin' | 'editor' | 'employee') {
    const roleRow = await prisma.role.findUniqueOrThrow({ where: { name: role } });
    const email = `phase4a-${role}-${randomBytes(3).toString('hex')}@localhost`;
    const pwd = `${randomBytes(18).toString('base64url')}Aa1`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await argon2.hash(pwd, { type: argon2.argon2id }),
        passwordAlgo: 'argon2id',
        roleId: roleRow.id,
        enabled: true,
      },
    });
    const res = await login(email, pwd);
    const body = await json(res);
    if (res.status !== 200) throw new Error(`${role} login failed`);
    const cookie = (res.headers.get('set-cookie') || '').match(/nora_session=([^;]+)/)?.[1];
    if (!cookie) throw new Error(`${role} cookie missing`);
    return { user, email, password: pwd, cookie: decodeURIComponent(cookie), body };
  }

  const employee = await makeUser('employee');
  const editor = await makeUser('editor');
  const admin = await makeUser('admin');

  const empRead = await contentGet(apiRequest('/api/content', { headers: { cookie: cookieHeader(employee.cookie) } }));
  if (empRead.status !== 200) fail('employee-read', `status ${empRead.status}`);
  pass('employee-read');
  const empWrite = await cmsPost(
    apiRequest('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: cookieHeader(employee.cookie) },
      body: JSON.stringify({ resource: 'about', op: 'patch', data: { story: { en: 'x' } } }),
    }),
  );
  if (empWrite.status !== 403) fail('employee-write', `status ${empWrite.status}`);
  pass('employee-write');

  const edWrite = await cmsPost(
    apiRequest('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: cookieHeader(editor.cookie) },
      body: JSON.stringify({ resource: 'about', op: 'patch', data: {} }),
    }),
  );
  if (edWrite.status !== 200 && edWrite.status !== 400) fail('editor-write', `status ${edWrite.status}`);
  pass('editor-write');
  const edDelete = await cmsPost(
    apiRequest('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: cookieHeader(editor.cookie) },
      body: JSON.stringify({ resource: 'faq', op: 'delete', id: 'missing-id' }),
    }),
  );
  if (edDelete.status !== 403) fail('editor-delete', `status ${edDelete.status}`);
  pass('editor-delete');

  const adUsers = await usersGet(apiRequest('/api/users', { headers: { cookie: cookieHeader(admin.cookie) } }));
  if (adUsers.status !== 403) fail('admin-users', `status ${adUsers.status}`);
  pass('admin-users');
  if (!(await roleHasPermission('admin', 'cms.delete'))) fail('admin-delete-perm', 'admin missing cms.delete');
  pass('admin-delete-perm');

  const ownerUsers = await usersGet(apiRequest('/api/users', { headers: { cookie: cookieHeader(ownerCookie) } }));
  const ownerUsersBody = await json(ownerUsers);
  if (ownerUsers.status !== 200) fail('owner-users', `status ${ownerUsers.status}`);
  const leaked = forbiddenSecrets(ownerUsersBody);
  if (leaked.length) fail('no-secret-fields', leaked.join(','));
  pass('owner-users');
  pass('no-secret-fields');

  const logout = await logoutPost(
    apiRequest('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: cookieHeader(employee.cookie) },
      body: '{}',
    }),
  );
  if (logout.status !== 200) fail('logout', `status ${logout.status}`);
  const empSession = await prisma.session.findFirst({
    where: { userId: employee.user.id },
    orderBy: { createdAt: 'desc' },
  });
  if (!empSession?.revokedAt) fail('logout-revoked', 'revokedAt empty');
  pass('logout');
  pass('logout-revoked');
  const replay = await contentGet(apiRequest('/api/content', { headers: { cookie: cookieHeader(employee.cookie) } }));
  if (replay.status !== 401) fail('replay-after-logout', `status ${replay.status}`);
  pass('replay-after-logout');

  const disable = await usersPatch(
    apiRequest('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', cookie: cookieHeader(ownerCookie) },
      body: JSON.stringify({ id: editor.user.id, enabled: false }),
    }),
  );
  if (disable.status !== 200) fail('disable-user', `status ${disable.status}`);
  const editorSessions = await prisma.session.count({
    where: { userId: editor.user.id, revokedAt: null },
  });
  if (editorSessions !== 0) fail('disable-revokes', 'active sessions remain');
  pass('disable-user');
  pass('disable-revokes');
  const disabledLogin = await login(editor.email, editor.password);
  if (disabledLogin.status !== 401) fail('disabled-login', `status ${disabledLogin.status}`);
  pass('disabled-login');

  const roleChange = await usersPatch(
    apiRequest('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', cookie: cookieHeader(ownerCookie) },
      body: JSON.stringify({ id: admin.user.id, role: 'editor' }),
    }),
  );
  if (roleChange.status !== 200) fail('role-change', `status ${roleChange.status}`);
  const adminSessions = await prisma.session.count({
    where: { userId: admin.user.id, revokedAt: null },
  });
  if (adminSessions !== 0) fail('role-change-revokes', 'active sessions remain');
  pass('role-change');
  pass('role-change-revokes');

  const audit = await prisma.auditLog.findFirst({
    where: { actorId: owner.id },
    orderBy: { createdAt: 'desc' },
  });
  if (!audit?.actorId) fail('audit-actor', 'no actorId');
  pass('audit-actor');

  await prisma.session.deleteMany({
    where: { userId: { in: [employee.user.id, editor.user.id, admin.user.id] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [employee.user.id, editor.user.id, admin.user.id] } },
  });
  if (createdOwner) {
    await prisma.session.deleteMany({ where: { userId: owner.id } });
    await prisma.user.delete({ where: { id: owner.id } });
  }

  process.stdout.write('phase4-auth-check complete\n');
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'check failed'}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
