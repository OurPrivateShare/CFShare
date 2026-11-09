import { HttpError, now } from './http.js';
import { appSecret, effectiveLevel } from './db.js';
import { hmacSign, hmacVerify, randomDigits, safeEqual, sha256Hex } from './crypto.js';

const COOKIE = 'cfs_session';
const SESSION_DAYS = 7;

export async function createSessionCookie(env, user, request) {
  const payload = { u: user.id, v: user.token_version, e: now() + SESSION_DAYS * 86400 };
  const body = btoa(JSON.stringify(payload)).replace(/=+$/, '');
  const signature = await hmacSign(appSecret(env), `session:${body}`);
  return cookieHeader(`${body}.${signature}`, SESSION_DAYS * 86400, request);
}

export function clearSessionCookie(request) {
  return cookieHeader('', 0, request);
}

function cookieHeader(value, maxAge, request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function readCookie(request) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === COOKIE) return rest.join('=');
  }
  return '';
}

export async function readSession(request, env) {
  const raw = readCookie(request);
  if (!raw) return null;
  const [body, signature] = raw.split('.');
  if (!body || !signature) return null;
  if (!(await hmacVerify(appSecret(env), `session:${body}`, signature))) return null;
  try {
    const payload = JSON.parse(atob(body));
    if (!payload.e || payload.e < now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function loadUser(request, env) {
  const session = await readSession(request, env);
  if (!session) return null;
  const user = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(session.u).first();
  if (!user || user.token_version !== session.v) return null;
  if (user.status !== 'active') return null;
  user.level = effectiveLevel(user);
  user.isAdmin = user.role === 'admin';
  return user;
}

export function requireRole(user, role) {
  if (!user) throw new HttpError(401, '请先登录');
  if (role === 'admin' && !user.isAdmin) throw new HttpError(403, '需要管理员权限');
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    level: effectiveLevel(user),
    planLevel: user.plan_level,
    planExpires: user.plan_expires,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
  };
}

const CODE_TTL = 10 * 60;
const MAX_ATTEMPTS = 5;

export async function issueEmailCode(env, email, purpose) {
  const existing = await env.DB.prepare(`SELECT created_at FROM email_codes WHERE email = ? AND purpose = ?`).bind(email, purpose).first();
  if (existing && now() - existing.created_at < 60) {
    throw new HttpError(429, `验证码发送过于频繁，请 ${60 - (now() - existing.created_at)} 秒后再试`);
  }
  const code = randomDigits(6);
  const hash = await sha256Hex(`${appSecret(env)}:${purpose}:${email}:${code}`);
  await env.DB.prepare(
    `INSERT INTO email_codes (email, purpose, code_hash, attempts, expires_at, created_at) VALUES (?, ?, ?, 0, ?, ?)
     ON CONFLICT(email, purpose) DO UPDATE SET code_hash = excluded.code_hash, attempts = 0, expires_at = excluded.expires_at, created_at = excluded.created_at`,
  )
    .bind(email, purpose, hash, now() + CODE_TTL, now())
    .run();
  return code;
}

export async function consumeEmailCode(env, email, purpose, code) {
  const row = await env.DB.prepare(`SELECT * FROM email_codes WHERE email = ? AND purpose = ?`).bind(email, purpose).first();
  if (!row || row.expires_at < now()) throw new HttpError(400, '验证码已过期，请重新获取');
  if (row.attempts >= MAX_ATTEMPTS) throw new HttpError(400, '验证码错误次数过多，请重新获取');
  const hash = await sha256Hex(`${appSecret(env)}:${purpose}:${email}:${String(code || '').trim()}`);
  if (!safeEqual(hash, row.code_hash)) {
    await env.DB.prepare(`UPDATE email_codes SET attempts = attempts + 1 WHERE email = ? AND purpose = ?`).bind(email, purpose).run();
    throw new HttpError(400, '验证码不正确');
  }
  await env.DB.prepare(`DELETE FROM email_codes WHERE email = ? AND purpose = ?`).bind(email, purpose).run();
}
