import { fail, int, normalizeEmail, now, ok, readJson, str, validatePassword } from '../lib/http.js';
import { ALL_RECORD_TYPES, appSecret, audit, decryptValue, encryptValue, getPlans, getSettings, saveSettings } from '../lib/db.js';
import { hashPassword, maskSecret, randomCode, randomPassword } from '../lib/crypto.js';
import { inspectToken, listZones } from '../lib/cf.js';
import { forgetToken, purgeSubdomains } from '../lib/dns.js';
import { getMailConfig, listInbox, readMessage, sendMail } from '../lib/mail.js';

/* ---------- 概览 ---------- */

export async function stats({ env }) {
  const t = now();
  const row = await env.DB.prepare(
    `SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM users WHERE created_at > ?1) AS users_today,
      (SELECT COUNT(*) FROM users WHERE status = 'banned') AS banned,
      (SELECT COUNT(*) FROM users WHERE plan_level > 0 AND (plan_expires IS NULL OR plan_expires > ?2)) AS members,
      (SELECT COUNT(*) FROM subdomains) AS subdomains,
      (SELECT COUNT(*) FROM records) AS records,
      (SELECT COUNT(*) FROM domains WHERE enabled = 1) AS domains_enabled,
      (SELECT COUNT(*) FROM domains) AS domains,
      (SELECT COUNT(*) FROM cf_tokens) AS tokens,
      (SELECT COUNT(*) FROM redeem_codes WHERE enabled = 1 AND used_count < max_uses) AS codes_available,
      (SELECT COALESCE(SUM(c.price), 0) FROM redemptions r JOIN redeem_codes c ON c.id = r.code_id) AS revenue`,
  )
    .bind(t - 86400, t)
    .first();
  const settings = await getSettings(env);
  const { results: recent } = await env.DB.prepare(
    `SELECT l.action, l.detail, l.created_at, u.email FROM audit_logs l LEFT JOIN users u ON u.id = l.user_id ORDER BY l.id DESC LIMIT 8`,
  ).all();
  return ok({
    stats: row,
    recent,
    checklist: {
      mail: !!(settings.mail_user && settings.mail_pass_enc),
      token: row.tokens > 0,
      domain: row.domains_enabled > 0,
    },
  });
}

/* ---------- 用户 ---------- */

export async function listUsers({ env, url }) {
  const q = str(url.searchParams.get('q'), 100);
  const status = url.searchParams.get('status');
  const page = int(url.searchParams.get('page'), 1, 1, 10000);
  const size = 20;
  const where = [];
  const binds = [];
  if (q) {
    where.push('u.email LIKE ?');
    binds.push(`%${q}%`);
  }
  if (status === 'banned' || status === 'active') {
    where.push('u.status = ?');
    binds.push(status);
  }
  if (status === 'member') where.push(`u.plan_level > 0 AND (u.plan_expires IS NULL OR u.plan_expires > ${now()})`);
  if (status === 'admin') where.push(`u.role = 'admin'`);
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [list, total] = await env.DB.batch([
    env.DB.prepare(
      `SELECT u.id, u.email, u.role, u.status, u.ban_reason, u.plan_level, u.plan_expires, u.created_at, u.last_login_at, u.last_login_ip,
        (SELECT COUNT(*) FROM subdomains s WHERE s.user_id = u.id) AS subdomains,
        (SELECT COUNT(*) FROM records r WHERE r.user_id = u.id) AS records
       FROM users u ${clause} ORDER BY u.id DESC LIMIT ${size} OFFSET ${(page - 1) * size}`,
    ).bind(...binds),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM users u ${clause}`).bind(...binds),
  ]);
  return ok({ users: list.results, total: total.results[0].n, page, size });
}

async function targetUser(env, id, actor) {
  const user = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(int(id)).first();
  if (!user) fail(404, '用户不存在');
  if (user.id === actor.id) fail(400, '不能对自己执行该操作');
  return user;
}

export async function banUser({ request, env, user: actor, params, ip, exec }) {
  const target = await targetUser(env, params.id, actor);
  if (target.role === 'admin') fail(400, '不能封禁管理员');
  const body = await readJson(request);
  const reason = str(body.reason, 200);
  await env.DB.prepare(`UPDATE users SET status = 'banned', ban_reason = ?, token_version = token_version + 1 WHERE id = ?`).bind(reason, target.id).run();
  let removed = 0;
  if (body.purge) {
    const { results } = await env.DB.prepare(`SELECT id FROM subdomains WHERE user_id = ?`).bind(target.id).all();
    removed = (await purgeSubdomains(env, results.map((r) => r.id))).removed;
  }
  audit(env, exec, actor.id, 'admin_ban', `${target.email} ${reason}${body.purge ? `（清除 ${removed} 条解析）` : ''}`, ip);
  return ok({ message: `已封禁 ${target.email}` });
}

export async function unbanUser({ env, user: actor, params, ip, exec }) {
  const target = await targetUser(env, params.id, actor);
  await env.DB.prepare(`UPDATE users SET status = 'active', ban_reason = NULL WHERE id = ?`).bind(target.id).run();
  audit(env, exec, actor.id, 'admin_unban', target.email, ip);
  return ok({ message: `已解封 ${target.email}` });
}

export async function resetUserPassword({ request, env, user: actor, params, ip, exec }) {
  const target = await targetUser(env, params.id, actor);
  const body = await readJson(request);
  const password = body.password ? validatePassword(body.password) : randomPassword();
  const hash = await hashPassword(password, appSecret(env));
  await env.DB.prepare(`UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?`).bind(hash, target.id).run();
  let mailed = false;
  if (body.notify) {
    const settings = await getSettings(env);
    await sendMail(env, {
      to: target.email,
      subject: `【${settings.site_name}】您的密码已被管理员重置`,
      text: `您的账号密码已被管理员重置。\n新密码：${password}\n请登录后尽快修改密码。`,
      html: `<p>您的账号密码已被管理员重置。</p><p>新密码：<b style="font-size:18px">${password}</b></p><p>请登录后尽快修改密码。</p>`,
    });
    mailed = true;
  }
  audit(env, exec, actor.id, 'admin_reset_password', target.email, ip);
  return ok({ password, mailed, message: mailed ? '密码已重置并邮件通知用户' : '密码已重置' });
}

export async function setUserPlan({ request, env, user: actor, params, ip, exec }) {
  const target = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(int(params.id)).first();
  if (!target) fail(404, '用户不存在');
  const body = await readJson(request);
  const level = int(body.level, 0, 0, 2);
  const days = int(body.days, 0, 0, 36500);
  const expires = level === 0 ? null : days === 0 ? null : now() + days * 86400;
  const role = body.role === 'admin' ? 'admin' : body.role === 'user' ? 'user' : target.role;
  if (target.id === actor.id && role !== 'admin') fail(400, '不能取消自己的管理员权限');
  await env.DB.prepare(`UPDATE users SET plan_level = ?, plan_expires = ?, role = ? WHERE id = ?`).bind(level, expires, role, target.id).run();
  audit(env, exec, actor.id, 'admin_set_plan', `${target.email} → L${level} ${days ? `${days}天` : '永久'} ${role}`, ip);
  return ok({ message: '会员信息已更新' });
}

export async function deleteUser({ env, user: actor, params, ip, exec }) {
  const target = await targetUser(env, params.id, actor);
  const { results } = await env.DB.prepare(`SELECT id FROM subdomains WHERE user_id = ?`).bind(target.id).all();
  const { removed } = await purgeSubdomains(env, results.map((r) => r.id));
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM redemptions WHERE user_id = ?`).bind(target.id),
    env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(target.id),
  ]);
  audit(env, exec, actor.id, 'admin_delete_user', `${target.email}（清除 ${results.length} 个域名 / ${removed} 条解析）`, ip);
  return ok({ message: `已删除 ${target.email}` });
}

export async function createUser({ request, env, user: actor, ip, exec }) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = body.password ? validatePassword(body.password) : randomPassword();
  const hash = await hashPassword(password, appSecret(env));
  const created = await env.DB.prepare(`INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING RETURNING id`)
    .bind(email, hash, now())
    .first();
  if (!created) fail(409, '该邮箱已存在');
  audit(env, exec, actor.id, 'admin_create_user', email, ip);
  return ok({ password, message: `已创建用户 ${email}` });
}

/* ---------- 会员套餐 ---------- */

export async function updatePlans({ request, env, user, ip, exec }) {
  const body = await readJson(request);
  if (!Array.isArray(body.plans)) fail(400, '参数错误');
  const statements = body.plans.slice(0, 3).map((p) => {
    const level = int(p.level, -1, 0, 2);
    if (level < 0) fail(400, '等级错误');
    const types = (Array.isArray(p.recordTypes) ? p.recordTypes : []).map((t) => String(t).toUpperCase()).filter((t) => ALL_RECORD_TYPES.includes(t));
    if (!types.length) fail(400, '至少选择一种记录类型');
    return env.DB.prepare(
      `UPDATE plans SET name = ?, max_subdomains = ?, max_records = ?, record_types = ?, allow_proxy = ?, min_prefix_len = ?, price_text = ?, description = ? WHERE level = ?`,
    ).bind(
      str(p.name, 20) || `等级 ${level}`,
      int(p.maxSubdomains, 1, 0, 10000),
      int(p.maxRecords, 1, 0, 1000),
      types.join(','),
      p.allowProxy ? 1 : 0,
      int(p.minPrefixLen, 1, 1, 63),
      str(p.priceText, 40),
      str(p.description, 120),
      level,
    );
  });
  await env.DB.batch(statements);
  audit(env, exec, user.id, 'admin_update_plans', '', ip);
  return ok({ plans: await getPlans(env), message: '会员套餐已保存' });
}

/* ---------- 兑换码 ---------- */

export async function listCodes({ env, url }) {
  const q = str(url.searchParams.get('q'), 64).toUpperCase();
  const filter = url.searchParams.get('filter');
  const page = int(url.searchParams.get('page'), 1, 1, 10000);
  const size = 30;
  const where = [];
  const binds = [];
  if (q) {
    where.push('(code LIKE ? OR batch LIKE ? OR note LIKE ?)');
    binds.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (filter === 'available') where.push(`enabled = 1 AND used_count < max_uses AND (expires_at IS NULL OR expires_at > ${now()})`);
  if (filter === 'used') where.push('used_count > 0');
  if (filter === 'disabled') where.push('enabled = 0');
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [list, total] = await env.DB.batch([
    env.DB.prepare(`SELECT * FROM redeem_codes ${clause} ORDER BY id DESC LIMIT ${size} OFFSET ${(page - 1) * size}`).bind(...binds),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM redeem_codes ${clause}`).bind(...binds),
  ]);
  return ok({ codes: list.results, total: total.results[0].n, page, size });
}

export async function createCodes({ request, env, user, ip, exec }) {
  const body = await readJson(request);
  const level = int(body.planLevel, 1, 1, 2);
  const days = int(body.days, 30, 0, 36500);
  const count = int(body.count, 1, 1, 200);
  const maxUses = int(body.maxUses, 1, 1, 100000);
  const price = Math.max(0, Math.min(1e6, Number(body.price) || 0));
  const validDays = int(body.validDays, 0, 0, 3650);
  const prefix = str(body.prefix, 8).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const note = str(body.note, 100);
  const batch = `B${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${randomCode(3)}`;
  const expiresAt = validDays ? now() + validDays * 86400 : null;
  const codes = Array.from({ length: count }, () => `${prefix ? `${prefix}-` : ''}${randomCode(4)}-${randomCode(4)}-${randomCode(4)}`);
  await env.DB.batch(
    codes.map((code) =>
      env.DB.prepare(
        `INSERT OR IGNORE INTO redeem_codes (code, plan_level, days, max_uses, price, expires_at, batch, note, created_at) VALUES (?,?,?,?,?,?,?,?,?)`,
      ).bind(code, level, days, maxUses, price, expiresAt, batch, note, now()),
    ),
  );
  audit(env, exec, user.id, 'admin_create_codes', `${count} 个 L${level} ${days || '永久'}天 批次 ${batch}`, ip);
  return ok({ codes, batch, message: `已生成 ${count} 个兑换码` });
}

export async function toggleCode({ env, params, user, ip, exec }) {
  const row = await env.DB.prepare(`UPDATE redeem_codes SET enabled = 1 - enabled WHERE id = ? RETURNING code, enabled`).bind(int(params.id)).first();
  if (!row) fail(404, '兑换码不存在');
  audit(env, exec, user.id, 'admin_toggle_code', `${row.code} ${row.enabled ? '启用' : '停用'}`, ip);
  return ok({ message: row.enabled ? '已启用' : '已停用' });
}

export async function deleteCode({ env, params, user, ip, exec }) {
  const row = await env.DB.prepare(`DELETE FROM redeem_codes WHERE id = ? AND used_count = 0 RETURNING code`).bind(int(params.id)).first();
  if (!row) fail(400, '已被使用的兑换码不能删除，可改为停用');
  audit(env, exec, user.id, 'admin_delete_code', row.code, ip);
  return ok({ message: '已删除' });
}

/* ---------- Cloudflare Token ---------- */

function formatToken(t, domainCount = 0) {
  return {
    id: t.id,
    name: t.name,
    hint: t.token_hint,
    cfTokenId: t.cf_token_id,
    cfUserId: t.cf_user_id,
    cfUserEmail: t.cf_user_email,
    accounts: JSON.parse(t.accounts || '[]'),
    status: t.status,
    expiresOn: t.expires_on,
    lastCheckedAt: t.last_checked_at,
    createdAt: t.created_at,
    domainCount,
  };
}

export async function listTokens({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT t.*, (SELECT COUNT(*) FROM domains d WHERE d.token_id = t.id) AS domain_count FROM cf_tokens t ORDER BY t.id`,
  ).all();
  return ok({ tokens: results.map((t) => formatToken(t, t.domain_count)) });
}

export async function previewToken({ request }) {
  const body = await readJson(request);
  const token = str(body.token, 200);
  if (!token) fail(400, '请输入 API Token');
  return ok({ info: await inspectToken(token) });
}

async function syncZonesForToken(env, tokenRow, token) {
  const zones = await listZones(token);
  if (!zones.length) return 0;
  const t = now();
  await env.DB.batch(
    zones.map((z) =>
      env.DB.prepare(
        `INSERT INTO domains (zone_id, name, token_id, account_id, account_name, zone_status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)
         ON CONFLICT(zone_id) DO UPDATE SET name = excluded.name, token_id = excluded.token_id, account_id = excluded.account_id,
           account_name = excluded.account_name, zone_status = excluded.zone_status, updated_at = excluded.updated_at`,
      ).bind(z.id, z.name, tokenRow.id, z.accountId, z.accountName, z.status, t, t),
    ),
  );
  return zones.length;
}

export async function addToken({ request, env, user, ip, exec }) {
  const body = await readJson(request);
  const token = str(body.token, 200);
  if (!token) fail(400, '请输入 API Token');
  const info = await inspectToken(token);
  const dup = await env.DB.prepare(`SELECT id FROM cf_tokens WHERE cf_token_id = ?`).bind(info.tokenId).first();
  if (dup) fail(409, '该 Token 已添加过');
  const name = str(body.name, 40) || info.accounts[0]?.name || info.user?.email || `Token ${info.tokenId.slice(0, 6)}`;
  const row = await env.DB.prepare(
    `INSERT INTO cf_tokens (name, token_enc, token_hint, cf_token_id, cf_user_id, cf_user_email, accounts, status, expires_on, last_checked_at, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?) RETURNING *`,
  )
    .bind(name, await encryptValue(env, token), maskSecret(token), info.tokenId, info.user?.id || null, info.user?.email || null, JSON.stringify(info.accounts), 'active', info.expiresOn, now(), now())
    .first();
  const zoneCount = await syncZonesForToken(env, row, token).catch(() => 0);
  audit(env, exec, user.id, 'admin_add_token', `${name}（${zoneCount} 个域名）`, ip);
  return ok({ token: formatToken(row), message: `已添加，同步到 ${zoneCount} 个域名（默认未开放，请在域名管理中启用）` });
}

export async function verifyToken({ env, params, user, ip, exec }) {
  const row = await env.DB.prepare(`SELECT * FROM cf_tokens WHERE id = ?`).bind(int(params.id)).first();
  if (!row) fail(404, 'Token 不存在');
  const token = await decryptValue(env, row.token_enc);
  forgetToken(row.id);
  try {
    const info = await inspectToken(token);
    await env.DB.prepare(`UPDATE cf_tokens SET status = 'active', cf_user_id = ?, cf_user_email = ?, accounts = ?, expires_on = ?, last_checked_at = ? WHERE id = ?`)
      .bind(info.user?.id || row.cf_user_id, info.user?.email || row.cf_user_email, JSON.stringify(info.accounts), info.expiresOn, now(), row.id)
      .run();
    const zoneCount = await syncZonesForToken(env, row, token);
    audit(env, exec, user.id, 'admin_verify_token', row.name, ip);
    return ok({ message: `Token 正常，已同步 ${zoneCount} 个域名` });
  } catch (err) {
    await env.DB.prepare(`UPDATE cf_tokens SET status = 'invalid', last_checked_at = ? WHERE id = ?`).bind(now(), row.id).run();
    throw err;
  }
}

export async function renameToken({ request, env, params }) {
  const body = await readJson(request);
  const name = str(body.name, 40);
  if (!name) fail(400, '名称不能为空');
  await env.DB.prepare(`UPDATE cf_tokens SET name = ? WHERE id = ?`).bind(name, int(params.id)).run();
  return ok({ message: '已重命名' });
}

export async function deleteToken({ env, params, user, ip, exec }) {
  const id = int(params.id);
  const used = await env.DB.prepare(`SELECT COUNT(*) AS n FROM subdomains s JOIN domains d ON d.id = s.domain_id WHERE d.token_id = ?`).bind(id).first();
  if (used.n > 0) fail(400, `该 Token 下仍有 ${used.n} 个用户域名，请先在域名管理中处理`);
  const [, deleted] = await env.DB.batch([
    env.DB.prepare(`DELETE FROM domains WHERE token_id = ?`).bind(id),
    env.DB.prepare(`DELETE FROM cf_tokens WHERE id = ? RETURNING name`).bind(id),
  ]);
  const row = deleted.results[0];
  if (!row) fail(404, 'Token 不存在');
  forgetToken(id);
  audit(env, exec, user.id, 'admin_delete_token', row.name, ip);
  return ok({ message: '已删除 Token 及其域名' });
}

/* ---------- 域名 ---------- */

export async function listDomainsAdmin({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT d.*, t.name AS token_name, t.cf_user_email, t.status AS token_status,
       (SELECT COUNT(*) FROM subdomains s WHERE s.domain_id = d.id) AS subdomain_count
     FROM domains d LEFT JOIN cf_tokens t ON t.id = d.token_id ORDER BY d.enabled DESC, d.name`,
  ).all();
  const settings = await getSettings(env);
  return ok({ domains: results, defaults: { min: int(settings.prefix_min, 3), max: int(settings.prefix_max, 32) } });
}

export async function syncDomains({ env, user, ip, exec }) {
  const { results } = await env.DB.prepare(`SELECT * FROM cf_tokens WHERE status = 'active'`).all();
  let total = 0;
  const errors = [];
  for (const row of results) {
    try {
      total += await syncZonesForToken(env, row, await decryptValue(env, row.token_enc));
    } catch (err) {
      errors.push(`${row.name}：${err.message}`);
    }
  }
  audit(env, exec, user.id, 'admin_sync_domains', `${total} 个`, ip);
  return ok({ message: `同步完成，共 ${total} 个域名${errors.length ? `；失败：${errors.join('；')}` : ''}` });
}

export async function updateDomain({ request, env, params, user, ip, exec }) {
  const body = await readJson(request);
  const nullableLen = (v) => (v === '' || v == null ? null : int(v, null, 1, 63));
  const minLen = nullableLen(body.minLen);
  const maxLen = nullableLen(body.maxLen);
  if (minLen && maxLen && minLen > maxLen) fail(400, '最短长度不能大于最长长度');
  const row = await env.DB.prepare(`UPDATE domains SET enabled = ?, min_level = ?, min_len = ?, max_len = ?, note = ?, updated_at = ? WHERE id = ? RETURNING name`)
    .bind(body.enabled ? 1 : 0, int(body.minLevel, 0, 0, 2), minLen, maxLen, str(body.note, 60), now(), int(params.id))
    .first();
  if (!row) fail(404, '域名不存在');
  audit(env, exec, user.id, 'admin_update_domain', `${row.name} ${body.enabled ? '开放' : '关闭'} L${int(body.minLevel, 0)}`, ip);
  return ok({ message: `${row.name} 已保存` });
}

export async function listAllSubdomains({ env, url }) {
  const q = str(url.searchParams.get('q'), 100).toLowerCase();
  const page = int(url.searchParams.get('page'), 1, 1, 10000);
  const size = 30;
  const clause = q ? `WHERE s.fqdn LIKE ?1 OR u.email LIKE ?1` : '';
  const binds = q ? [`%${q}%`] : [];
  const [list, total] = await env.DB.batch([
    env.DB.prepare(
      `SELECT s.id, s.fqdn, s.created_at, u.email, u.id AS user_id, (SELECT COUNT(*) FROM records r WHERE r.subdomain_id = s.id) AS record_count
       FROM subdomains s LEFT JOIN users u ON u.id = s.user_id ${clause} ORDER BY s.id DESC LIMIT ${size} OFFSET ${(page - 1) * size}`,
    ).bind(...binds),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM subdomains s LEFT JOIN users u ON u.id = s.user_id ${clause}`).bind(...binds),
  ]);
  return ok({ subdomains: list.results, total: total.results[0].n, page, size });
}

export async function deleteSubdomainAdmin({ env, params, user, ip, exec }) {
  const sub = await env.DB.prepare(`SELECT id, fqdn FROM subdomains WHERE id = ?`).bind(int(params.id)).first();
  if (!sub) fail(404, '域名不存在');
  await purgeSubdomains(env, [sub.id]);
  audit(env, exec, user.id, 'admin_delete_subdomain', sub.fqdn, ip);
  return ok({ message: `${sub.fqdn} 已回收` });
}

/* ---------- 系统设置 ---------- */

const SETTING_KEYS = ['site_name', 'site_desc', 'announcement', 'allow_register', 'contact', 'purchase_url', 'mail_user', 'mail_from_name', 'smtp_host', 'smtp_port', 'imap_host', 'imap_port', 'prefix_min', 'prefix_max', 'reserved_prefixes'];

export async function getSettingsAdmin({ env }) {
  const s = await getSettings(env, true);
  const out = {};
  for (const key of SETTING_KEYS) out[key] = s[key] ?? '';
  out.mail_pass_set = !!s.mail_pass_enc;
  return ok({ settings: out });
}

export async function updateSettings({ request, env, user, ip, exec }) {
  const body = await readJson(request);
  const values = {};
  for (const key of SETTING_KEYS) {
    if (key in body) values[key] = str(body[key], key === 'reserved_prefixes' || key === 'announcement' ? 4000 : 200);
  }
  if ('allow_register' in values) values.allow_register = values.allow_register === '1' ? '1' : '0';
  if ('mail_user' in values && values.mail_user) normalizeEmail(values.mail_user);
  for (const key of ['prefix_min', 'prefix_max']) if (key in values) values[key] = String(int(values[key], key === 'prefix_min' ? 3 : 32, 1, 63));
  if (values.prefix_min && values.prefix_max && Number(values.prefix_min) > Number(values.prefix_max)) fail(400, '最短前缀不能大于最长前缀');
  for (const key of ['smtp_port', 'imap_port']) if (key in values) values[key] = String(int(values[key], key === 'smtp_port' ? 465 : 993, 1, 65535));
  if (typeof body.mail_pass === 'string' && body.mail_pass.trim()) values.mail_pass_enc = await encryptValue(env, body.mail_pass.replace(/\s+/g, ''));
  await saveSettings(env, values);
  audit(env, exec, user.id, 'admin_update_settings', Object.keys(values).join(','), ip);
  return ok({ message: '设置已保存' });
}

export async function testMail({ request, env, user }) {
  const body = await readJson(request);
  const to = normalizeEmail(body.to || user.email);
  const cfg = await getMailConfig(env);
  const settings = await getSettings(env);
  await sendMail(
    env,
    {
      to,
      subject: `【${settings.site_name}】邮件配置测试`,
      text: '恭喜，邮件发送配置正常！',
      html: '<p style="font-size:15px">恭喜，<b>邮件发送配置正常</b>！</p>',
    },
    cfg,
  );
  return ok({ message: `测试邮件已发送至 ${to}` });
}

/* ---------- 收件箱（仅在管理员打开页面时按需读取） ---------- */

const MAIL_CACHE_SECONDS = 60;
const memoryCache = new Map();

// 先查内存（同一实例 0 延迟），再查边缘 Cache API（自定义域名下生效），都未命中才连接 IMAP
async function cached(key, ttl, exec, force, loader) {
  const mem = memoryCache.get(key);
  if (!force && mem && mem.exp > Date.now()) return { data: mem.data, cached: true };
  const cacheKey = new Request(`https://cfshare.internal/${key}`);
  if (!force) {
    const hit = await caches.default.match(cacheKey).catch(() => null);
    if (hit) {
      const data = await hit.json();
      memoryCache.set(key, { data, exp: Date.now() + ttl * 1000 });
      return { data, cached: true };
    }
  }
  const data = await loader();
  memoryCache.set(key, { data, exp: Date.now() + ttl * 1000 });
  if (memoryCache.size > 100) memoryCache.delete(memoryCache.keys().next().value);
  exec.waitUntil(caches.default.put(cacheKey, new Response(JSON.stringify(data), { headers: { 'cache-control': `max-age=${ttl}` } })).catch(() => {}));
  return { data, cached: false };
}

export async function inbox({ env, url, exec }) {
  const limit = int(url.searchParams.get('limit'), 20, 5, 50);
  const force = url.searchParams.get('refresh') === '1';
  const { data, cached: hit } = await cached(`inbox-${limit}`, MAIL_CACHE_SECONDS, exec, force, async () => ({ ...(await listInbox(env, limit)), fetchedAt: now() }));
  return ok({ ...data, cached: hit });
}

export async function inboxMessage({ env, params, exec }) {
  const uid = int(params.uid, 0, 1);
  if (!uid) fail(400, '参数错误');
  const { data } = await cached(`inbox-msg-${uid}`, 86400, exec, false, () => readMessage(env, uid));
  return ok({ message: data });
}

/* ---------- 日志 ---------- */

export async function listLogs({ env, url }) {
  const page = int(url.searchParams.get('page'), 1, 1, 10000);
  const q = str(url.searchParams.get('q'), 100);
  const size = 50;
  const clause = q ? `WHERE l.action LIKE ?1 OR l.detail LIKE ?1 OR u.email LIKE ?1 OR l.ip LIKE ?1` : '';
  const binds = q ? [`%${q}%`] : [];
  const [list, total] = await env.DB.batch([
    env.DB.prepare(
      `SELECT l.*, u.email FROM audit_logs l LEFT JOIN users u ON u.id = l.user_id ${clause} ORDER BY l.id DESC LIMIT ${size} OFFSET ${(page - 1) * size}`,
    ).bind(...binds),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM audit_logs l LEFT JOIN users u ON u.id = l.user_id ${clause}`).bind(...binds),
  ]);
  return ok({ logs: list.results, total: total.results[0].n, page, size });
}
