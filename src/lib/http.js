export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  });
}

export const ok = (data = {}) => json({ ok: true, ...data });

export function fail(status, message) {
  throw new HttpError(status, message);
}

export async function readJson(request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') throw new Error();
    return body;
  } catch {
    throw new HttpError(400, '请求格式错误');
  }
}

export const clientIp = (request) => request.headers.get('cf-connecting-ip') || '0.0.0.0';

export const now = () => Math.floor(Date.now() / 1000);

export function str(value, max = 255) {
  return String(value ?? '').trim().slice(0, max);
}

export function int(value, fallback = 0, min = -Infinity, max = Infinity) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

export function normalizeEmail(value) {
  const email = str(value, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) fail(400, '邮箱格式不正确');
  return email;
}

export function validatePassword(value) {
  const password = String(value ?? '');
  if (password.length < 8 || password.length > 72) fail(400, '密码长度需为 8-72 位');
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) fail(400, '密码需同时包含字母和数字');
  return password;
}

export class Router {
  constructor() {
    this.routes = [];
  }

  add(method, path, handler, auth = null) {
    const keys = [];
    const pattern = path.replace(/:(\w+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
    this.routes.push({ method, re: new RegExp(`^${pattern}$`), keys, handler, auth });
    return this;
  }

  get(path, handler, auth) { return this.add('GET', path, handler, auth); }
  post(path, handler, auth) { return this.add('POST', path, handler, auth); }
  put(path, handler, auth) { return this.add('PUT', path, handler, auth); }
  delete(path, handler, auth) { return this.add('DELETE', path, handler, auth); }

  match(method, pathname) {
    let pathMatched = false;
    for (const route of this.routes) {
      const m = pathname.match(route.re);
      if (!m) continue;
      pathMatched = true;
      if (route.method !== method) continue;
      const params = {};
      route.keys.forEach((key, i) => {
        params[key] = decodeURIComponent(m[i + 1]);
      });
      return { route, params };
    }
    return pathMatched ? { methodNotAllowed: true } : null;
  }
}
