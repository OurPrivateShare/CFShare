import { HttpError, now } from './http.js';
import { decrypt, encrypt } from './crypto.js';

const SCHEMA_VERSION = '1';

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '')`,
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    status TEXT NOT NULL DEFAULT 'active',
    ban_reason TEXT,
    plan_level INTEGER NOT NULL DEFAULT 0,
    plan_expires INTEGER,
    token_version INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    last_login_at INTEGER,
    last_login_ip TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS plans (
    level INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    max_subdomains INTEGER NOT NULL,
    max_records INTEGER NOT NULL,
    record_types TEXT NOT NULL,
    allow_proxy INTEGER NOT NULL DEFAULT 1,
    min_prefix_len INTEGER NOT NULL DEFAULT 1,
    price_text TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS cf_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    token_enc TEXT NOT NULL,
    token_hint TEXT NOT NULL DEFAULT '',
    cf_token_id TEXT,
    cf_user_id TEXT,
    cf_user_email TEXT,
    accounts TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'active',
    expires_on TEXT,
    last_checked_at INTEGER,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    token_id INTEGER NOT NULL,
    account_id TEXT,
    account_name TEXT,
    zone_status TEXT,
    enabled INTEGER NOT NULL DEFAULT 0,
    min_level INTEGER NOT NULL DEFAULT 0,
    min_len INTEGER,
    max_len INTEGER,
    note TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS subdomains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    domain_id INTEGER NOT NULL,
    prefix TEXT NOT NULL,
    fqdn TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_subdomains_user ON subdomains(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_subdomains_domain ON subdomains(domain_id)`,
  `CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subdomain_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    cf_record_id TEXT NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    ttl INTEGER NOT NULL DEFAULT 1,
    proxied INTEGER NOT NULL DEFAULT 0,
    priority INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_records_sub ON records(subdomain_id)`,
  `CREATE INDEX IF NOT EXISTS idx_records_user ON records(user_id)`,
  `CREATE TABLE IF NOT EXISTS redeem_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    plan_level INTEGER NOT NULL,
    days INTEGER NOT NULL,
    max_uses INTEGER NOT NULL DEFAULT 1,
    used_count INTEGER NOT NULL DEFAULT 0,
    price REAL NOT NULL DEFAULT 0,
    expires_at INTEGER,
    enabled INTEGER NOT NULL DEFAULT 1,
    batch TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    plan_level INTEGER NOT NULL,
    days INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(code_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS email_codes (
    email TEXT NOT NULL,
    purpose TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (email, purpose)
  )`,
  `CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    ip TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_logs_time ON audit_logs(created_at)`,
];

export const DEFAULT_PLANS = [
  [0, '普通会员', 2, 5, 'A,AAAA,CNAME,TXT', 1, 5, '免费', '注册即享，适合个人体验'],
  [1, '高级会员', 10, 20, 'A,AAAA,CNAME,TXT,MX', 1, 3, '¥19.9 / 年', '更多域名与记录，支持 MX 邮件解析'],
  [2, '特级会员', 50, 50, 'A,AAAA,CNAME,TXT,MX,NS,CAA', 1, 1, '¥49.9 / 年', '全部记录类型，支持 NS 委派与超短前缀'],
];

export const ALL_RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'CAA'];

const DEFAULT_SETTINGS = {
  site_name: 'CFShare',
  site_desc: '免费、稳定的二级域名分发平台',
  announcement: '',
  allow_register: '1',
  contact: '',
  purchase_url: '',
  mail_user: '',
  mail_pass_enc: '',
  mail_from_name: '',
  smtp_host: 'smtp.gmail.com',
  smtp_port: '465',
  imap_host: 'imap.gmail.com',
  imap_port: '993',
  prefix_min: '3',
  prefix_max: '32',
  reserved_prefixes: 'www,mail,email,smtp,imap,pop,pop3,ftp,admin,administrator,root,api,ns,ns1,ns2,ns3,dns,mx,webmail,cpanel,whm,blog,shop,store,support,help,status,cdn,static,assets,dev,test,localhost,autodiscover,autoconfig,_dmarc,_domainkey',
};

let schemaReady = false;
let settingsCache = null;
let settingsCachedAt = 0;
const SETTINGS_TTL = 30_000;

export async function ensureSchema(env) {
  if (schemaReady) return;
  try {
    const row = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'schema_version'`).first();
    if (row?.value === SCHEMA_VERSION) {
      schemaReady = true;
      return;
    }
  } catch {
    // 首次部署时表不存在，继续执行建表
  }
  const db = env.DB;
  const statements = SCHEMA.map((sql) => db.prepare(sql));
  for (const plan of DEFAULT_PLANS) {
    statements.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO plans (level, name, max_subdomains, max_records, record_types, allow_proxy, min_prefix_len, price_text, description) VALUES (?,?,?,?,?,?,?,?,?)`,
        )
        .bind(...plan),
    );
  }
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    statements.push(db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).bind(key, value));
  }
  statements.push(db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('schema_version', ?)`).bind(SCHEMA_VERSION));
  await db.batch(statements);
  schemaReady = true;
}

export async function getSettings(env, force = false) {
  if (!force && settingsCache && Date.now() - settingsCachedAt < SETTINGS_TTL) return settingsCache;
  const { results } = await env.DB.prepare(`SELECT key, value FROM settings`).all();
  const settings = { ...DEFAULT_SETTINGS };
  for (const row of results) settings[row.key] = row.value;
  settingsCache = settings;
  settingsCachedAt = Date.now();
  return settings;
}

export async function saveSettings(env, values) {
  const entries = Object.entries(values);
  if (!entries.length) return;
  await env.DB.batch(
    entries.map(([key, value]) =>
      env.DB.prepare(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`).bind(key, String(value)),
    ),
  );
  settingsCache = null;
}

export const MIN_SECRET_LENGTH = 16;

export function appSecret(env) {
  const secret = env.APP_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) throw new HttpError(500, `未配置 APP_SECRET（至少 ${MIN_SECRET_LENGTH} 位），请在 Worker 的 Variables and Secrets 中添加`);
  return secret;
}

export async function encryptValue(env, value) {
  return encrypt(appSecret(env), value);
}

export async function decryptValue(env, value) {
  try {
    return await decrypt(appSecret(env), value);
  } catch {
    throw new HttpError(500, '密钥解密失败：APP_SECRET 可能已被修改，请重新填写相关凭据');
  }
}

export async function rateLimit(env, key, limit, windowSec, message = '操作过于频繁，请稍后再试') {
  const t = now();
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (key, count, reset_at) VALUES (?1, 1, ?2)
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN reset_at < ?3 THEN 1 ELSE count + 1 END,
       reset_at = CASE WHEN reset_at < ?3 THEN ?2 ELSE reset_at END
     RETURNING count, reset_at`,
  )
    .bind(key, t + windowSec, t)
    .first();
  if (row.count > limit) {
    const wait = Math.max(1, row.reset_at - t);
    throw new HttpError(429, `${message}（${wait < 120 ? `${wait} 秒` : `${Math.ceil(wait / 60)} 分钟`}后可重试）`);
  }
}

export function audit(env, ctx, userId, action, detail = '', ip = null) {
  const task = env.DB.prepare(`INSERT INTO audit_logs (user_id, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)`)
    .bind(userId ?? null, action, String(detail).slice(0, 500), ip, now())
    .run()
    .catch(() => {});
  if (ctx?.waitUntil) ctx.waitUntil(task);
  return task;
}

export function effectiveLevel(user) {
  if (!user) return 0;
  if (user.plan_level > 0 && (user.plan_expires == null || user.plan_expires > now())) return user.plan_level;
  return 0;
}

export async function getPlans(env) {
  const { results } = await env.DB.prepare(`SELECT * FROM plans ORDER BY level`).all();
  return results.map(formatPlan);
}

export function formatPlan(p) {
  return {
    level: p.level,
    name: p.name,
    maxSubdomains: p.max_subdomains,
    maxRecords: p.max_records,
    recordTypes: p.record_types.split(',').filter(Boolean),
    allowProxy: !!p.allow_proxy,
    minPrefixLen: p.min_prefix_len,
    priceText: p.price_text,
    description: p.description,
  };
}

export async function cleanup(env) {
  const t = now();
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM email_codes WHERE expires_at < ?`).bind(t),
    env.DB.prepare(`DELETE FROM rate_limits WHERE reset_at < ?`).bind(t),
    env.DB.prepare(`DELETE FROM audit_logs WHERE created_at < ?`).bind(t - 90 * 86400),
  ]);
}
