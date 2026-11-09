const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Workers 免费版单次请求 CPU 上限 10ms，PBKDF2 迭代次数需在安全与 CPU 之间平衡，并叠加服务端 pepper
const PBKDF2_ITERATIONS = 30000;

export function bytesToBinary(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    out += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return out;
}

export function binaryToBytes(binary) {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i) & 0xff;
  return bytes;
}

export const b64encode = (bytes) => btoa(bytesToBinary(new Uint8Array(bytes)));
export const b64decode = (text) => binaryToBytes(atob(text));
export const b64utf8 = (text) => b64encode(encoder.encode(text));

export const b64url = (bytes) => b64encode(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export function b64urlDecode(text) {
  const normalized = text.replace(/-/g, '+').replace(/_/g, '/');
  return b64decode(normalized + '='.repeat((4 - (normalized.length % 4)) % 4));
}

export const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n));
export const randomToken = (n = 32) => b64url(randomBytes(n));

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function randomCode(length) {
  let out = '';
  for (const b of randomBytes(length)) out += CODE_ALPHABET[b % 32];
  return out;
}

export function randomDigits(length = 6) {
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(values, (v) => v % 10).join('');
}

export function randomPassword() {
  return `${randomCode(4)}-${randomCode(4)}-${randomDigits(4)}`.toLowerCase().replace(/^./, (c) => c.toUpperCase());
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const hmacKeys = new Map();
async function hmacKey(secret) {
  if (!hmacKeys.has(secret)) {
    hmacKeys.set(
      secret,
      crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']),
    );
  }
  return hmacKeys.get(secret);
}

export async function hmacSign(secret, data) {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(data));
  return b64url(sig);
}

export async function hmacVerify(secret, data, signature) {
  try {
    return await crypto.subtle.verify('HMAC', await hmacKey(secret), b64urlDecode(signature), encoder.encode(data));
  } catch {
    return false;
  }
}

export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2(password, salt, iterations, pepper) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password + pepper), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password, pepper) {
  const salt = randomBytes(16);
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS, pepper);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64url(salt)}$${b64url(hash)}`;
}

export async function verifyPassword(password, stored, pepper) {
  const [scheme, iter, salt, hash] = String(stored || '').split('$');
  if (scheme !== 'pbkdf2' || !hash) return false;
  const computed = await pbkdf2(password, b64urlDecode(salt), Number(iter), pepper);
  return safeEqual(b64url(computed), hash);
}

const aesKeys = new Map();
async function aesKey(secret) {
  if (!aesKeys.has(secret)) {
    aesKeys.set(
      secret,
      crypto.subtle
        .digest('SHA-256', encoder.encode(`cfshare-aes:${secret}`))
        .then((raw) => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])),
    );
  }
  return aesKeys.get(secret);
}

export async function encrypt(secret, plaintext) {
  if (!plaintext) return '';
  const iv = randomBytes(12);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(secret), encoder.encode(plaintext));
  return `${b64url(iv)}.${b64url(data)}`;
}

export async function decrypt(secret, payload) {
  if (!payload) return '';
  const [iv, data] = payload.split('.');
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64urlDecode(iv) }, await aesKey(secret), b64urlDecode(data));
  return decoder.decode(plain);
}

export function maskSecret(value) {
  if (!value) return '';
  if (value.length <= 8) return '••••••';
  return `${value.slice(0, 4)}••••••${value.slice(-4)}`;
}
