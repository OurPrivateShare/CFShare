import { fail, json, normalizeEmail, now, ok, readJson, validatePassword } from '../lib/http.js';
import { appSecret, audit, getPlans, getSettings, rateLimit } from '../lib/db.js';
import { clearSessionCookie, consumeEmailCode, createSessionCookie, issueEmailCode, publicUser } from '../lib/auth.js';
import { hashPassword, safeEqual, verifyPassword } from '../lib/crypto.js';
import { codeEmail, sendMail } from '../lib/mail.js';

async function hasAdmin(env) {
  return !!(await env.DB.prepare(`SELECT 1 FROM users WHERE role = 'admin' LIMIT 1`).first());
}

function siteInfo(settings, needSetup) {
  return {
    name: settings.site_name,
    desc: settings.site_desc,
    announcement: settings.announcement,
    allowRegister: settings.allow_register === '1',
    contact: settings.contact,
    purchaseUrl: settings.purchase_url,
    mailReady: !!(settings.mail_user && settings.mail_pass_enc),
    needSetup,
  };
}

export async function bootstrap({ env, user }) {
  const settings = await getSettings(env);
  const needSetup = user ? false : !(await hasAdmin(env));
  const plans = await getPlans(env);
  return ok({ site: siteInfo(settings, needSetup), user: publicUser(user), plans });
}

export async function setup({ request, env, ip, exec }) {
  if (await hasAdmin(env)) fail(403, '系统已初始化');
  await rateLimit(env, `setup:${ip}`, 10, 3600);
  const body = await readJson(request);
  if (!safeEqual(String(body.setupKey || ''), appSecret(env))) fail(403, '初始化密钥（APP_SECRET）不正确');
  const email = normalizeEmail(body.email);
  const password = validatePassword(body.password);
  const hash = await hashPassword(password, appSecret(env));
  const user = await env.DB.prepare(
    `INSERT INTO users (email, password_hash, role, plan_level, created_at) VALUES (?, ?, 'admin', 2, ?)
     ON CONFLICT(email) DO UPDATE SET role = 'admin', password_hash = excluded.password_hash RETURNING *`,
  )
    .bind(email, hash, now())
    .first();
  audit(env, exec, user.id, 'setup', '初始化管理员', ip);
  return json({ ok: true, user: publicUser(user) }, 200, { 'set-cookie': await createSessionCookie(env, user, request) });
}

export async function sendCode({ request, env, ip }) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const purpose = body.purpose === 'reset' ? 'reset' : 'register';
  const settings = await getSettings(env);
  await rateLimit(env, `code-ip:${ip}`, 10, 3600, '验证码请求过多');

  const exists = await env.DB.prepare(`SELECT id, status FROM users WHERE email = ?`).bind(email).first();
  if (purpose === 'register') {
    if (settings.allow_register !== '1') fail(403, '本站暂未开放注册');
    if (exists) fail(409, '该邮箱已注册，请直接登录');
  } else if (!exists || exists.status !== 'active') {
    // 不泄露账号是否存在
    return ok({ message: '如果该邮箱已注册，验证码将在片刻后送达' });
  }

  await rateLimit(env, `code-mail:${email}`, 6, 3600, '该邮箱验证码请求过多');
  const code = await issueEmailCode(env, email, purpose);
  const title = purpose === 'register' ? '欢迎注册' : '您正在重置密码';
  const tip = purpose === 'register' ? '' : '重置成功后，所有已登录设备将自动退出。';
  await sendMail(env, { to: email, subject: `【${settings.site_name}】${purpose === 'register' ? '注册' : '重置密码'}验证码 ${code}`, ...codeEmail(settings.site_name, title, code, tip) });
  return ok({ message: '验证码已发送，请查收邮件（可能在垃圾箱中）' });
}

export async function register({ request, env, ip, exec }) {
  const settings = await getSettings(env);
  if (settings.allow_register !== '1') fail(403, '本站暂未开放注册');
  await rateLimit(env, `register:${ip}`, 5, 3600);
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = validatePassword(body.password);
  await consumeEmailCode(env, email, 'register', body.code);
  const hash = await hashPassword(password, appSecret(env));
  const user = await env.DB.prepare(`INSERT INTO users (email, password_hash, created_at, last_login_at, last_login_ip) VALUES (?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING RETURNING *`)
    .bind(email, hash, now(), now(), ip)
    .first();
  if (!user) fail(409, '该邮箱已注册');
  audit(env, exec, user.id, 'register', email, ip);
  return json({ ok: true, user: publicUser(user) }, 200, { 'set-cookie': await createSessionCookie(env, user, request) });
}

export async function login({ request, env, ip, exec }) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  await rateLimit(env, `login-ip:${ip}`, 30, 900, '登录尝试过多');
  await rateLimit(env, `login-mail:${email}`, 10, 900, '该账号登录尝试过多');
  const user = await env.DB.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first();
  const valid = user && (await verifyPassword(String(body.password || ''), user.password_hash, appSecret(env)));
  if (!valid) fail(401, '邮箱或密码错误');
  if (user.status === 'banned') fail(403, `账号已被封禁${user.ban_reason ? `：${user.ban_reason}` : ''}`);
  await env.DB.prepare(`UPDATE users SET last_login_at = ?, last_login_ip = ? WHERE id = ?`).bind(now(), ip, user.id).run();
  audit(env, exec, user.id, 'login', '', ip);
  return json({ ok: true, user: publicUser(user) }, 200, { 'set-cookie': await createSessionCookie(env, user, request) });
}

export async function resetPassword({ request, env, ip, exec }) {
  await rateLimit(env, `reset:${ip}`, 10, 3600);
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = validatePassword(body.password);
  await consumeEmailCode(env, email, 'reset', body.code);
  const hash = await hashPassword(password, appSecret(env));
  const user = await env.DB.prepare(`UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE email = ? AND status = 'active' RETURNING id`)
    .bind(hash, email)
    .first();
  if (!user) fail(400, '账号不存在或已被封禁');
  audit(env, exec, user.id, 'reset_password', '邮箱验证重置', ip);
  return ok({ message: '密码已重置，请使用新密码登录' });
}

export async function logout({ request }) {
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie(request) });
}

export async function changePassword({ request, env, user, ip, exec }) {
  const body = await readJson(request);
  const password = validatePassword(body.password);
  const secret = appSecret(env);
  if (!(await verifyPassword(String(body.oldPassword || ''), user.password_hash, secret))) fail(400, '当前密码不正确');
  const hash = await hashPassword(password, secret);
  const updated = await env.DB.prepare(`UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ? RETURNING *`).bind(hash, user.id).first();
  audit(env, exec, user.id, 'change_password', '', ip);
  return json({ ok: true, message: '密码已修改' }, 200, { 'set-cookie': await createSessionCookie(env, updated, request) });
}
