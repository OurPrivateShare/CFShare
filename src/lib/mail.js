import { connect } from 'cloudflare:sockets';
import { HttpError } from './http.js';
import { b64decode, b64utf8, binaryToBytes, bytesToBinary, randomToken } from './crypto.js';
import { decryptValue, getSettings } from './db.js';

const encoder = new TextEncoder();
const utf8 = new TextDecoder();
const TIMEOUT_MS = 15000;

class Connection {
  constructor(socket) {
    this.attach(socket);
  }

  attach(socket) {
    this.socket = socket;
    this.reader = socket.readable.getReader();
    this.writer = socket.writable.getWriter();
    this.buffer = new Uint8Array(0);
  }

  upgrade() {
    this.reader.releaseLock();
    this.writer.releaseLock();
    this.attach(this.socket.startTls());
  }

  async fill() {
    const { value, done } = await this.reader.read();
    if (done) throw new Error('连接被服务器关闭');
    const merged = new Uint8Array(this.buffer.length + value.length);
    merged.set(this.buffer);
    merged.set(value, this.buffer.length);
    this.buffer = merged;
  }

  async readLine() {
    for (;;) {
      for (let i = 0; i < this.buffer.length - 1; i++) {
        if (this.buffer[i] === 13 && this.buffer[i + 1] === 10) {
          const line = this.buffer.subarray(0, i);
          this.buffer = this.buffer.slice(i + 2);
          return utf8.decode(line);
        }
      }
      await this.fill();
    }
  }

  async readBytes(n) {
    while (this.buffer.length < n) await this.fill();
    const out = this.buffer.slice(0, n);
    this.buffer = this.buffer.slice(n);
    return out;
  }

  write(text) {
    return this.writer.write(encoder.encode(text));
  }

  async close() {
    try { await this.writer.close(); } catch {}
    try { await this.socket.close(); } catch {}
  }
}

function withTimeout(promise, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label}超时`)), TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timer));
}

export async function getMailConfig(env) {
  const s = await getSettings(env);
  if (!s.mail_user || !s.mail_pass_enc) throw new HttpError(503, '站点尚未配置邮箱，请联系管理员');
  return {
    user: s.mail_user,
    pass: (await decryptValue(env, s.mail_pass_enc)).replace(/\s+/g, ''),
    fromName: s.mail_from_name || s.site_name || 'CFShare',
    smtpHost: s.smtp_host || 'smtp.gmail.com',
    smtpPort: Number(s.smtp_port) || 465,
    imapHost: s.imap_host || 'imap.gmail.com',
    imapPort: Number(s.imap_port) || 993,
  };
}

/* ---------------- SMTP ---------------- */

async function smtpResponse(conn) {
  const lines = [];
  for (;;) {
    const line = await conn.readLine();
    lines.push(line);
    if (line.length < 4 || line[3] !== '-') break;
  }
  return { code: Number.parseInt(lines.at(-1).slice(0, 3), 10), text: lines.join(' | ') };
}

async function smtpExpect(conn, command, expected) {
  if (command) await conn.write(`${command}\r\n`);
  const res = await smtpResponse(conn);
  if (!expected.includes(res.code)) {
    const hint = res.code === 535 ? '（账号或应用专用密码错误）' : '';
    throw new Error(`SMTP ${res.code} ${res.text.slice(0, 200)}${hint}`);
  }
  return res;
}

const encodeHeader = (text) => (/^[\x20-\x7e]*$/.test(text) ? text : `=?UTF-8?B?${b64utf8(text)}?=`);
const wrap76 = (text) => text.replace(/.{1,76}/g, '$&\r\n');

function buildMessage(cfg, { to, subject, html, text }) {
  const boundary = `cfs_${randomToken(12)}`;
  const domain = cfg.user.split('@')[1] || 'cfshare.local';
  return [
    `From: ${encodeHeader(cfg.fromName)} <${cfg.user}>`,
    `To: <${to}>`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${randomToken(16)}@${domain}>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(b64utf8(text)),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(b64utf8(html)),
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

export async function sendMail(env, message, cfgOverride) {
  const cfg = cfgOverride || (await getMailConfig(env));
  const implicitTls = cfg.smtpPort === 465;
  const socket = connect({ hostname: cfg.smtpHost, port: cfg.smtpPort }, { secureTransport: implicitTls ? 'on' : 'starttls' });
  const conn = new Connection(socket);
  const run = async () => {
    await smtpExpect(conn, null, [220]);
    await smtpExpect(conn, 'EHLO cfshare.workers.dev', [250]);
    if (!implicitTls) {
      await smtpExpect(conn, 'STARTTLS', [220]);
      conn.upgrade();
      await smtpExpect(conn, 'EHLO cfshare.workers.dev', [250]);
    }
    await smtpExpect(conn, 'AUTH LOGIN', [334]);
    await smtpExpect(conn, b64utf8(cfg.user), [334]);
    await smtpExpect(conn, b64utf8(cfg.pass), [235]);
    await smtpExpect(conn, `MAIL FROM:<${cfg.user}>`, [250]);
    await smtpExpect(conn, `RCPT TO:<${message.to}>`, [250, 251]);
    await smtpExpect(conn, 'DATA', [354]);
    await conn.write(buildMessage(cfg, message));
    await smtpExpect(conn, '.', [250]);
    await conn.write('QUIT\r\n').catch(() => {});
  };
  try {
    await withTimeout(run(), '邮件发送');
  } catch (err) {
    throw new HttpError(502, `邮件发送失败：${err.message}`);
  } finally {
    await conn.close();
  }
}

export function codeEmail(siteName, title, code, tip) {
  const text = `${title}\n\n您的验证码是：${code}\n验证码 10 分钟内有效。${tip}\n\n如非本人操作请忽略此邮件。\n— ${siteName}`;
  const html = `<!doctype html><html><body style="margin:0;background:#f5f6f8;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
<tr><td style="padding:28px 28px 8px;font-size:18px;font-weight:600;color:#111827">${siteName}</td></tr>
<tr><td style="padding:0 28px;color:#374151;font-size:14px;line-height:1.7">${title}，您的验证码是：</td></tr>
<tr><td style="padding:16px 28px"><div style="font-size:32px;letter-spacing:8px;font-weight:700;color:#f38020;background:#fff7ed;border-radius:8px;padding:14px 0;text-align:center">${code}</div></td></tr>
<tr><td style="padding:0 28px 28px;color:#6b7280;font-size:13px;line-height:1.7">验证码 10 分钟内有效。${tip}<br>如非本人操作，请忽略此邮件。</td></tr>
</table></td></tr></table></body></html>`;
  return { text, html };
}

/* ---------------- IMAP ---------------- */

const quote = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

async function imapExec(conn, tag, command) {
  await conn.write(`${tag} ${command}\r\n`);
  const untagged = [];
  let current = null;
  for (;;) {
    const line = await conn.readLine();
    if (current) {
      current.text += line;
    } else if (line.startsWith('* ')) {
      current = { text: line, literals: [] };
    } else if (line.startsWith(`${tag} `)) {
      if (!line.startsWith(`${tag} OK`)) throw new Error(line.slice(tag.length + 1, 200));
      return untagged;
    } else {
      continue;
    }
    const literal = current.text.match(/\{(\d+)\}$/);
    if (literal) {
      current.literals.push(await conn.readBytes(Number(literal[1])));
      current.text += '\u0000';
      continue;
    }
    untagged.push(current);
    current = null;
  }
}

async function withImap(env, fn) {
  const cfg = await getMailConfig(env);
  const conn = new Connection(connect({ hostname: cfg.imapHost, port: cfg.imapPort }, { secureTransport: 'on' }));
  let seq = 0;
  const exec = (command) => imapExec(conn, `a${++seq}`, command);
  const run = async () => {
    const greeting = await conn.readLine();
    if (!greeting.startsWith('* OK')) throw new Error(greeting);
    await exec(`LOGIN ${quote(cfg.user)} ${quote(cfg.pass)}`);
    const result = await fn(exec);
    await conn.write(`a${++seq} LOGOUT\r\n`).catch(() => {});
    return result;
  };
  try {
    return await withTimeout(run(), '邮箱读取');
  } catch (err) {
    if (err instanceof HttpError) throw err;
    const hint = /AUTHENTICATIONFAILED|Invalid credentials/i.test(err.message) ? '（账号或应用专用密码错误，或未开启 IMAP）' : '';
    throw new HttpError(502, `IMAP 读取失败：${err.message}${hint}`);
  } finally {
    await conn.close();
  }
}

export async function listInbox(env, limit = 20) {
  return withImap(env, async (exec) => {
    const select = await exec('EXAMINE INBOX');
    const exists = Number(select.map((r) => r.text.match(/^\* (\d+) EXISTS/)?.[1]).find(Boolean) || 0);
    if (!exists) return { total: 0, messages: [] };
    const start = Math.max(1, exists - limit + 1);
    const rows = await exec(`FETCH ${start}:${exists} (UID FLAGS INTERNALDATE RFC822.SIZE BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)])`);
    const messages = rows
      .filter((r) => / FETCH \(/.test(r.text))
      .map((r) => {
        const headers = parseHeaderBlock(bytesToBinary(r.literals[0] || new Uint8Array()));
        return {
          uid: Number(r.text.match(/UID (\d+)/)?.[1]),
          seen: /\\Seen/.test(r.text.match(/FLAGS \(([^)]*)\)/)?.[1] || ''),
          size: Number(r.text.match(/RFC822\.SIZE (\d+)/)?.[1] || 0),
          date: r.text.match(/INTERNALDATE "([^"]+)"/)?.[1] || headers.date || '',
          from: decodeWords(headers.from || ''),
          subject: decodeWords(headers.subject || '(无主题)'),
        };
      })
      .sort((a, b) => b.uid - a.uid);
    return { total: exists, messages };
  });
}

export async function readMessage(env, uid) {
  return withImap(env, async (exec) => {
    await exec('EXAMINE INBOX');
    const rows = await exec(`UID FETCH ${uid} (UID BODY.PEEK[]<0.400000>)`);
    const row = rows.find((r) => r.literals.length);
    if (!row) throw new HttpError(404, '邮件不存在');
    const raw = bytesToBinary(row.literals[0]);
    const { headers, body } = splitMessage(raw);
    const parts = { text: '', html: '' };
    walkPart(headers, body, parts);
    return {
      uid,
      from: decodeWords(headers.from || ''),
      to: decodeWords(headers.to || ''),
      subject: decodeWords(headers.subject || '(无主题)'),
      date: headers.date || '',
      text: parts.text,
      html: parts.html,
    };
  });
}

/* ---------------- MIME ---------------- */

function parseHeaderBlock(raw) {
  const headers = {};
  const unfolded = raw.replace(/\r?\n[ \t]+/g, ' ');
  for (const line of unfolded.split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) {
      const key = line.slice(0, i).trim().toLowerCase();
      if (!(key in headers)) headers[key] = line.slice(i + 1).trim();
    }
  }
  return headers;
}

function splitMessage(raw) {
  const m = raw.match(/\r?\n\r?\n/);
  if (!m) return { headers: parseHeaderBlock(raw), body: '' };
  return { headers: parseHeaderBlock(raw.slice(0, m.index)), body: raw.slice(m.index + m[0].length) };
}

function decodeCharset(bytes, charset) {
  try {
    return new TextDecoder(charset || 'utf-8').decode(bytes);
  } catch {
    return utf8.decode(bytes);
  }
}

function qpToBytes(text) {
  const cleaned = text.replace(/=\r?\n/g, '');
  const out = [];
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(cleaned.slice(i + 1, i + 3))) {
      out.push(Number.parseInt(cleaned.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      out.push(cleaned.charCodeAt(i) & 0xff);
    }
  }
  return new Uint8Array(out);
}

function decodeWords(value) {
  const joined = value.replace(/\?=\s+=\?/g, '?==?');
  const decoded = joined.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, charset, enc, data) => {
    try {
      const bytes = enc.toUpperCase() === 'B' ? b64decode(data) : qpToBytes(data.replace(/_/g, ' '));
      return decodeCharset(bytes, charset);
    } catch {
      return data;
    }
  });
  return /[\x80-\xff]/.test(decoded) && !/=\?/.test(value) ? decodeCharset(binaryToBytes(decoded), 'utf-8') : decoded;
}

function param(header, name) {
  const m = header.match(new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|([^;\\s]+))`, 'i'));
  return m ? m[1] ?? m[2] : '';
}

function walkPart(headers, body, out, depth = 0) {
  if (depth > 6) return;
  const type = headers['content-type'] || 'text/plain';
  const mime = type.split(';')[0].trim().toLowerCase();
  if (mime.startsWith('multipart/')) {
    const boundary = param(type, 'boundary');
    if (!boundary) return;
    const sections = body.split(`--${boundary}`);
    for (const section of sections.slice(1)) {
      if (section.startsWith('--')) break;
      const part = splitMessage(section.replace(/^\r?\n/, ''));
      walkPart(part.headers, part.body, out, depth + 1);
    }
    return;
  }
  if (mime !== 'text/plain' && mime !== 'text/html') return;
  if (/attachment/i.test(headers['content-disposition'] || '')) return;
  const encoding = (headers['content-transfer-encoding'] || '').toLowerCase();
  let bytes;
  try {
    if (encoding === 'base64') bytes = b64decode(body.replace(/[^A-Za-z0-9+/=]/g, ''));
    else if (encoding === 'quoted-printable') bytes = qpToBytes(body);
    else bytes = binaryToBytes(body);
  } catch {
    bytes = binaryToBytes(body);
  }
  const text = decodeCharset(bytes, param(type, 'charset'));
  if (mime === 'text/html' && !out.html) out.html = text;
  if (mime === 'text/plain' && !out.text) out.text = text;
}
