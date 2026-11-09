import { HttpError, fail, int, str } from './http.js';
import { ALL_RECORD_TYPES, decryptValue } from './db.js';
import { deleteRecords } from './cf.js';

const LABEL_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const HOST_LABEL_RE = /^(\*|_?[a-z0-9]([a-z0-9_-]{0,61}[a-z0-9])?)$/;
const HOSTNAME_RE = /^(?=.{1,253}\.?$)([a-z0-9_]([a-z0-9_-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\.?$/i;
const IPV4_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

const tokenCache = new Map();

export async function domainToken(env, tokenId) {
  const cached = tokenCache.get(tokenId);
  if (cached && Date.now() - cached.at < 60_000) return cached.token;
  const row = await env.DB.prepare(`SELECT token_enc, status FROM cf_tokens WHERE id = ?`).bind(tokenId).first();
  if (!row) throw new HttpError(503, '该域名的 API Token 已被移除，请联系管理员');
  if (row.status !== 'active') throw new HttpError(503, '该域名的 API Token 已失效，请联系管理员');
  const token = await decryptValue(env, row.token_enc);
  tokenCache.set(tokenId, { token, at: Date.now() });
  return token;
}

export const forgetToken = (tokenId) => tokenCache.delete(tokenId);

export function prefixRange(settings, domain, plan, isAdmin) {
  const globalMin = int(settings.prefix_min, 3, 1, 63);
  const globalMax = int(settings.prefix_max, 32, 1, 63);
  const domainMin = domain.min_len ?? globalMin;
  const max = domain.max_len ?? globalMax;
  const min = isAdmin ? 1 : Math.max(domainMin, plan?.minPrefixLen ?? 1);
  return { min: Math.min(min, max), max, domainMin };
}

export function validatePrefix(rawPrefix, settings, domain, plan, isAdmin) {
  const prefix = str(rawPrefix, 80).toLowerCase();
  if (!prefix) fail(400, '请输入域名前缀');
  if (!LABEL_RE.test(prefix)) fail(400, '前缀只能包含小写字母、数字和连字符，且不能以连字符开头或结尾');
  if (prefix.startsWith('xn--')) fail(400, '不支持 xn-- 开头的前缀');
  const { min, max, domainMin } = prefixRange(settings, domain, plan, isAdmin);
  if (prefix.length < min || prefix.length > max) {
    fail(400, `该域名前缀长度需为 ${min}-${max} 个字符${!isAdmin && prefix.length < min && min > domainMin ? '（升级会员可解锁更短前缀）' : ''}`);
  }
  if (!isAdmin) {
    const reserved = new Set(
      String(settings.reserved_prefixes || '')
        .split(/[\s,，]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    );
    if (reserved.has(prefix)) fail(400, '该前缀为系统保留，无法申请');
  }
  return prefix;
}

export function validateRecord(input, plan, fqdn, isAdmin, fixedType) {
  const type = fixedType || str(input.type, 10).toUpperCase();
  const allowed = isAdmin ? ALL_RECORD_TYPES : plan.recordTypes;
  if (!ALL_RECORD_TYPES.includes(type)) fail(400, '不支持的记录类型');
  if (!allowed.includes(type)) fail(403, `当前会员等级不支持 ${type} 记录，请升级会员`);

  let name = fqdn;
  const host = str(input.host, 200).toLowerCase().replace(/\.$/, '') || '@';
  if (host !== '@') {
    const labels = host.split('.');
    if (labels.some((l) => !HOST_LABEL_RE.test(l))) fail(400, '主机记录格式不正确');
    if (labels.slice(1).includes('*')) fail(400, '通配符只能位于最左侧');
    name = `${host}.${fqdn}`;
  }
  if (name.length > 253) fail(400, '完整域名过长');

  let content = str(input.content, 2048);
  if (!content) fail(400, '记录值不能为空');
  switch (type) {
    case 'A':
      if (!IPV4_RE.test(content)) fail(400, '请输入有效的 IPv4 地址');
      break;
    case 'AAAA':
      try {
        content = new URL(`http://[${content}]`).hostname.slice(1, -1);
      } catch {
        fail(400, '请输入有效的 IPv6 地址');
      }
      break;
    case 'CNAME':
    case 'NS':
    case 'MX':
      content = content.toLowerCase().replace(/\.$/, '');
      if (!HOSTNAME_RE.test(content)) fail(400, '请输入有效的目标域名');
      if (type === 'CNAME' && content === fqdn) fail(400, 'CNAME 不能指向自身');
      break;
    case 'TXT':
      if (content.length > 2048) fail(400, 'TXT 内容过长');
      break;
    case 'CAA':
      if (!/^\d{1,3}\s+(issue|issuewild|iodef)\s+"?[^"]+"?$/i.test(content)) fail(400, 'CAA 格式：0 issue "letsencrypt.org"');
      break;
  }

  let ttl = int(input.ttl, 1);
  if (ttl !== 1) ttl = Math.min(86400, Math.max(60, ttl));

  const canProxy = ['A', 'AAAA', 'CNAME'].includes(type);
  const proxied = canProxy && !!input.proxied;
  if (proxied && !isAdmin && !plan.allowProxy) fail(403, '当前会员等级不支持开启 CDN 代理');
  if (proxied && name.startsWith('*.') && !isAdmin) fail(400, '通配符记录不支持开启代理');

  const record = { type, name, content, ttl: proxied ? 1 : ttl, proxied };
  if (type === 'MX') record.priority = int(input.priority, 10, 0, 65535);
  if (type === 'CAA') {
    const [flags, tag, ...rest] = content.split(/\s+/);
    record.data = { flags: Number(flags), tag: tag.toLowerCase(), value: rest.join(' ').replace(/^"|"$/g, '') };
    delete record.content;
  }
  return record;
}

export function toCfPayload(record) {
  const payload = { type: record.type, name: record.name, ttl: record.ttl, proxied: record.proxied };
  if (record.data) payload.data = record.data;
  else payload.content = record.type === 'TXT' && !/^".*"$/.test(record.content) ? `"${record.content.replace(/"/g, '\\"')}"` : record.content;
  if (record.priority != null) payload.priority = record.priority;
  return payload;
}

export function recordContent(record) {
  if (record.data) return `${record.data.flags} ${record.data.tag} "${record.data.value}"`;
  return record.content;
}

export async function purgeSubdomains(env, subdomainIds) {
  if (!subdomainIds.length) return { removed: 0 };
  if (subdomainIds.length > 90) {
    let removed = 0;
    for (let i = 0; i < subdomainIds.length; i += 90) removed += (await purgeSubdomains(env, subdomainIds.slice(i, i + 90))).removed;
    return { removed };
  }
  const placeholders = subdomainIds.map(() => '?').join(',');
  const { results } = await env.DB.prepare(
    `SELECT r.cf_record_id, d.zone_id, d.token_id FROM records r
     JOIN subdomains s ON s.id = r.subdomain_id
     JOIN domains d ON d.id = s.domain_id
     WHERE r.subdomain_id IN (${placeholders})`,
  )
    .bind(...subdomainIds)
    .all();
  const groups = new Map();
  for (const row of results) {
    const key = `${row.token_id}|${row.zone_id}`;
    if (!groups.has(key)) groups.set(key, { tokenId: row.token_id, zoneId: row.zone_id, ids: [] });
    groups.get(key).ids.push(row.cf_record_id);
  }
  for (const group of groups.values()) {
    try {
      const token = await domainToken(env, group.tokenId);
      await deleteRecords(token, group.zoneId, group.ids);
    } catch {
      // Token 失效时仍清理本地数据，避免用户配额被占用
    }
  }
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM records WHERE subdomain_id IN (${placeholders})`).bind(...subdomainIds),
    env.DB.prepare(`DELETE FROM subdomains WHERE id IN (${placeholders})`).bind(...subdomainIds),
  ]);
  return { removed: results.length };
}
