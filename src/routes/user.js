import { fail, int, now, ok, readJson, str } from '../lib/http.js';
import { audit, getPlans, getSettings, rateLimit } from '../lib/db.js';
import { publicUser } from '../lib/auth.js';
import { createRecord, deleteRecord, findRecords, updateRecord } from '../lib/cf.js';
import { domainToken, prefixRange, purgeSubdomains, recordContent, toCfPayload, validatePrefix, validateRecord } from '../lib/dns.js';

async function userPlan(env, user) {
  const plans = await getPlans(env);
  return plans.find((p) => p.level === user.level) || plans[0];
}

async function usage(env, userId) {
  const row = await env.DB.prepare(
    `SELECT (SELECT COUNT(*) FROM subdomains WHERE user_id = ?1) AS subdomains, (SELECT COUNT(*) FROM records WHERE user_id = ?1) AS records`,
  )
    .bind(userId)
    .first();
  return { subdomains: row.subdomains, records: row.records };
}

async function ownedSubdomain(env, user, id) {
  const sub = await env.DB.prepare(
    `SELECT s.*, d.zone_id, d.token_id, d.name AS domain_name, d.enabled AS domain_enabled FROM subdomains s JOIN domains d ON d.id = s.domain_id WHERE s.id = ?`,
  )
    .bind(int(id))
    .first();
  if (!sub || (sub.user_id !== user.id && !user.isAdmin)) fail(404, '域名不存在');
  return sub;
}

export async function me({ env, user }) {
  const [plan, used, history] = await Promise.all([
    userPlan(env, user),
    usage(env, user.id),
    env.DB.prepare(
      `SELECT r.created_at, r.plan_level, r.days, c.code FROM redemptions r JOIN redeem_codes c ON c.id = r.code_id WHERE r.user_id = ? ORDER BY r.id DESC LIMIT 10`,
    )
      .bind(user.id)
      .all(),
  ]);
  return ok({ user: publicUser(user), plan, usage: used, redemptions: history.results.map((r) => ({ ...r, code: `${r.code.slice(0, 4)}****${r.code.slice(-4)}` })) });
}

export async function listDomains({ env, user }) {
  const [settings, plan, { results }] = await Promise.all([
    getSettings(env),
    userPlan(env, user),
    env.DB.prepare(`SELECT id, name, min_level, min_len, max_len, note FROM domains WHERE enabled = 1 ORDER BY min_level, name`).all(),
  ]);
  return ok({
    domains: results.map((d) => ({
      id: d.id,
      name: d.name,
      minLevel: d.min_level,
      note: d.note,
      locked: !user.isAdmin && d.min_level > user.level,
      prefix: prefixRange(settings, d, plan, user.isAdmin),
    })),
  });
}

async function loadDomainForApply(env, user, domainId) {
  const domain = await env.DB.prepare(`SELECT * FROM domains WHERE id = ? AND enabled = 1`).bind(int(domainId)).first();
  if (!domain) fail(404, '域名不存在或未开放');
  if (!user.isAdmin && domain.min_level > user.level) fail(403, '该域名需要更高会员等级，请先升级');
  return domain;
}

export async function checkAvailability({ env, user, url, ip }) {
  await rateLimit(env, `check:${user.id}`, 60, 600, '查询过于频繁');
  const domain = await loadDomainForApply(env, user, url.searchParams.get('domain'));
  const [settings, plan] = await Promise.all([getSettings(env), userPlan(env, user)]);
  const prefix = validatePrefix(url.searchParams.get('prefix'), settings, domain, plan, user.isAdmin);
  const fqdn = `${prefix}.${domain.name}`;
  const taken = await env.DB.prepare(`SELECT 1 FROM subdomains WHERE fqdn = ?`).bind(fqdn).first();
  if (taken) return ok({ available: false, fqdn, reason: '已被其他用户注册' });
  const token = await domainToken(env, domain.token_id);
  const existing = await findRecords(token, domain.zone_id, fqdn);
  if (existing.length) return ok({ available: false, fqdn, reason: '该名称已被系统占用' });
  return ok({ available: true, fqdn });
}

export async function listSubdomains({ env, user }) {
  const { results } = await env.DB.prepare(
    `SELECT s.id, s.prefix, s.fqdn, s.created_at, d.name AS domain, d.enabled AS domain_enabled,
       (SELECT COUNT(*) FROM records r WHERE r.subdomain_id = s.id) AS record_count
     FROM subdomains s JOIN domains d ON d.id = s.domain_id WHERE s.user_id = ? ORDER BY s.id DESC`,
  )
    .bind(user.id)
    .all();
  return ok({ subdomains: results });
}

export async function createSubdomain({ request, env, user, ip, exec }) {
  await rateLimit(env, `apply:${user.id}`, 20, 3600, '申请过于频繁');
  const body = await readJson(request);
  const domain = await loadDomainForApply(env, user, body.domainId);
  const [settings, plan, used] = await Promise.all([getSettings(env), userPlan(env, user), usage(env, user.id)]);
  if (!user.isAdmin && used.subdomains >= plan.maxSubdomains) fail(403, `${plan.name}最多可申请 ${plan.maxSubdomains} 个域名，升级会员可获得更多额度`);
  const prefix = validatePrefix(body.prefix, settings, domain, plan, user.isAdmin);
  const fqdn = `${prefix}.${domain.name}`;
  if (await env.DB.prepare(`SELECT 1 FROM subdomains WHERE fqdn = ?`).bind(fqdn).first()) fail(409, '该域名已被注册');
  const token = await domainToken(env, domain.token_id);
  if ((await findRecords(token, domain.zone_id, fqdn)).length) fail(409, '该名称已被系统占用');
  const sub = await env.DB.prepare(`INSERT INTO subdomains (user_id, domain_id, prefix, fqdn, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(fqdn) DO NOTHING RETURNING *`)
    .bind(user.id, domain.id, prefix, fqdn, now())
    .first();
  if (!sub) fail(409, '该域名已被注册');
  audit(env, exec, user.id, 'subdomain_create', fqdn, ip);
  return ok({ subdomain: sub, message: `${fqdn} 申请成功，现在可以添加解析记录了` });
}

export async function deleteSubdomain({ env, user, params, ip, exec }) {
  const sub = await ownedSubdomain(env, user, params.id);
  await purgeSubdomains(env, [sub.id]);
  audit(env, exec, user.id, 'subdomain_delete', sub.fqdn, ip);
  return ok({ message: `${sub.fqdn} 已删除` });
}

export async function listRecords({ env, user, params }) {
  const sub = await ownedSubdomain(env, user, params.id);
  const [{ results }, plan] = await Promise.all([
    env.DB.prepare(`SELECT id, type, name, content, ttl, proxied, priority, created_at, updated_at FROM records WHERE subdomain_id = ? ORDER BY type, name`).bind(sub.id).all(),
    userPlan(env, user),
  ]);
  return ok({
    subdomain: { id: sub.id, fqdn: sub.fqdn, prefix: sub.prefix, domain: sub.domain_name, createdAt: sub.created_at, domainEnabled: !!sub.domain_enabled },
    records: results,
    plan,
  });
}

export async function createRecordRoute({ request, env, user, params, ip, exec }) {
  await rateLimit(env, `record:${user.id}`, 60, 3600, '修改解析过于频繁');
  const sub = await ownedSubdomain(env, user, params.id);
  const plan = await userPlan(env, user);
  const count = await env.DB.prepare(`SELECT COUNT(*) AS n FROM records WHERE subdomain_id = ?`).bind(sub.id).first();
  if (!user.isAdmin && count.n >= plan.maxRecords) fail(403, `${plan.name}每个域名最多 ${plan.maxRecords} 条解析记录`);
  const record = validateRecord(await readJson(request), plan, sub.fqdn, user.isAdmin);
  const token = await domainToken(env, sub.token_id);
  const created = await createRecord(token, sub.zone_id, { ...toCfPayload(record), comment: `CFShare uid:${sub.user_id}` });
  const row = await env.DB.prepare(
    `INSERT INTO records (subdomain_id, user_id, cf_record_id, type, name, content, ttl, proxied, priority, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?) RETURNING *`,
  )
    .bind(sub.id, sub.user_id, created.id, record.type, record.name, recordContent(record), record.ttl, record.proxied ? 1 : 0, record.priority ?? null, now(), now())
    .first();
  audit(env, exec, user.id, 'record_create', `${record.type} ${record.name} → ${recordContent(record)}`, ip);
  return ok({ record: row, message: '解析记录已添加，通常 1 分钟内全球生效' });
}

async function ownedRecord(env, user, id) {
  const rec = await env.DB.prepare(
    `SELECT r.*, s.fqdn, s.user_id AS owner_id, d.zone_id, d.token_id FROM records r JOIN subdomains s ON s.id = r.subdomain_id JOIN domains d ON d.id = s.domain_id WHERE r.id = ?`,
  )
    .bind(int(id))
    .first();
  if (!rec || (rec.owner_id !== user.id && !user.isAdmin)) fail(404, '记录不存在');
  return rec;
}

export async function updateRecordRoute({ request, env, user, params, ip, exec }) {
  await rateLimit(env, `record:${user.id}`, 60, 3600, '修改解析过于频繁');
  const rec = await ownedRecord(env, user, params.id);
  const plan = await userPlan(env, user);
  const record = validateRecord(await readJson(request), plan, rec.fqdn, user.isAdmin, rec.type);
  const token = await domainToken(env, rec.token_id);
  await updateRecord(token, rec.zone_id, rec.cf_record_id, toCfPayload(record));
  const row = await env.DB.prepare(`UPDATE records SET name = ?, content = ?, ttl = ?, proxied = ?, priority = ?, updated_at = ? WHERE id = ? RETURNING *`)
    .bind(record.name, recordContent(record), record.ttl, record.proxied ? 1 : 0, record.priority ?? null, now(), rec.id)
    .first();
  audit(env, exec, user.id, 'record_update', `${record.type} ${record.name} → ${recordContent(record)}`, ip);
  return ok({ record: row, message: '解析记录已更新' });
}

export async function deleteRecordRoute({ env, user, params, ip, exec }) {
  const rec = await ownedRecord(env, user, params.id);
  const token = await domainToken(env, rec.token_id);
  await deleteRecord(token, rec.zone_id, rec.cf_record_id);
  await env.DB.prepare(`DELETE FROM records WHERE id = ?`).bind(rec.id).run();
  audit(env, exec, user.id, 'record_delete', `${rec.type} ${rec.name}`, ip);
  return ok({ message: '解析记录已删除' });
}

export async function redeem({ request, env, user, ip, exec }) {
  await rateLimit(env, `redeem:${user.id}`, 10, 3600, '兑换尝试过多');
  const body = await readJson(request);
  const code = str(body.code, 64).toUpperCase().replace(/\s+/g, '');
  if (!code) fail(400, '请输入兑换码');
  const row = await env.DB.prepare(`SELECT * FROM redeem_codes WHERE code = ?`).bind(code).first();
  if (!row || !row.enabled) fail(400, '兑换码无效');
  if (row.expires_at && row.expires_at < now()) fail(400, '兑换码已过期');
  if (row.used_count >= row.max_uses) fail(400, '兑换码已被使用完');
  if (await env.DB.prepare(`SELECT 1 FROM redemptions WHERE code_id = ? AND user_id = ?`).bind(row.id, user.id).first()) fail(400, '您已使用过该兑换码');

  const current = user.level;
  if (row.plan_level < current) fail(400, '您当前的会员等级高于该兑换码等级，无需兑换');
  const permanent = row.days === 0;
  let expires;
  if (permanent) expires = null;
  else if (row.plan_level === current && current > 0) {
    if (user.plan_expires == null) fail(400, '您已是永久会员，无需续期');
    expires = Math.max(user.plan_expires, now()) + row.days * 86400;
  } else expires = now() + row.days * 86400;

  const claim = await env.DB.prepare(`UPDATE redeem_codes SET used_count = used_count + 1 WHERE id = ? AND used_count < max_uses AND enabled = 1 RETURNING id`).bind(row.id).first();
  if (!claim) fail(400, '兑换码已被使用完');
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO redemptions (code_id, user_id, plan_level, days, created_at) VALUES (?, ?, ?, ?, ?)`).bind(row.id, user.id, row.plan_level, row.days, now()),
    env.DB.prepare(`UPDATE users SET plan_level = ?, plan_expires = ? WHERE id = ?`).bind(row.plan_level, expires, user.id),
  ]);
  const plans = await getPlans(env);
  const plan = plans.find((p) => p.level === row.plan_level);
  audit(env, exec, user.id, 'redeem', `${code} → ${plan?.name} ${permanent ? '永久' : `${row.days} 天`}`, ip);
  return ok({ message: `兑换成功！已升级为${plan?.name || '会员'}，${permanent ? '永久有效' : `有效期至 ${new Date(expires * 1000).toLocaleDateString('zh-CN')}`}` });
}
