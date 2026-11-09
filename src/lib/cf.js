import { HttpError } from './http.js';

const API = 'https://api.cloudflare.com/client/v4';

export async function cfApi(token, path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(API + path, {
      method,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new HttpError(502, '无法连接 Cloudflare API');
  }
  let data;
  try {
    data = await res.json();
  } catch {
    throw new HttpError(502, `Cloudflare API 响应异常（HTTP ${res.status}）`);
  }
  if (!data.success) {
    const message = (data.errors || []).map((e) => `${e.message} (${e.code})`).join('；') || `HTTP ${res.status}`;
    const err = new HttpError(res.status >= 500 ? 502 : 400, `Cloudflare：${message}`);
    err.cfCodes = (data.errors || []).map((e) => e.code);
    throw err;
  }
  return data;
}

export async function inspectToken(token) {
  const accounts = await cfApi(token, '/accounts?per_page=50')
    .then((r) => r.result.map((a) => ({ id: a.id, name: a.name })))
    .catch(() => []);
  let verify = await cfApi(token, '/user/tokens/verify').catch(() => null);
  if (!verify) {
    for (const account of accounts) {
      verify = await cfApi(token, `/accounts/${account.id}/tokens/verify`).catch(() => null);
      if (verify) break;
    }
  }
  if (!verify) throw new HttpError(400, 'Token 无效、已过期或已被禁用');
  if (verify.result.status !== 'active') throw new HttpError(400, `Token 状态异常：${verify.result.status}`);
  const user = await cfApi(token, '/user')
    .then((r) => ({ id: r.result.id, email: r.result.email }))
    .catch(() => null);
  return {
    tokenId: verify.result.id,
    status: verify.result.status,
    expiresOn: verify.result.expires_on || null,
    accounts,
    user,
  };
}

export async function listZones(token) {
  const zones = [];
  for (let page = 1; page <= 20; page++) {
    const data = await cfApi(token, `/zones?per_page=50&page=${page}`);
    zones.push(
      ...data.result.map((z) => ({
        id: z.id,
        name: z.name,
        status: z.status,
        accountId: z.account?.id || '',
        accountName: z.account?.name || '',
      })),
    );
    if (page >= (data.result_info?.total_pages || 1)) break;
  }
  return zones;
}

export async function findRecords(token, zoneId, fqdn) {
  const [exact, nested] = await Promise.all([
    cfApi(token, `/zones/${zoneId}/dns_records?per_page=5&name=${encodeURIComponent(fqdn)}`),
    cfApi(token, `/zones/${zoneId}/dns_records?per_page=5&name.endswith=${encodeURIComponent(`.${fqdn}`)}`),
  ]);
  return [...exact.result, ...nested.result];
}

export async function createRecord(token, zoneId, record) {
  const data = await cfApi(token, `/zones/${zoneId}/dns_records`, { method: 'POST', body: record });
  return data.result;
}

export async function updateRecord(token, zoneId, recordId, record) {
  const data = await cfApi(token, `/zones/${zoneId}/dns_records/${recordId}`, { method: 'PATCH', body: record });
  return data.result;
}

export async function deleteRecord(token, zoneId, recordId) {
  try {
    await cfApi(token, `/zones/${zoneId}/dns_records/${recordId}`, { method: 'DELETE' });
  } catch (err) {
    if (err.cfCodes?.includes(81044) || err.status === 404) return;
    throw err;
  }
}

// 批量删除只占用 1 次子请求，避免免费版 50 次子请求上限
export async function deleteRecords(token, zoneId, recordIds) {
  if (!recordIds.length) return;
  for (let i = 0; i < recordIds.length; i += 200) {
    const chunk = recordIds.slice(i, i + 200);
    try {
      await cfApi(token, `/zones/${zoneId}/dns_records/batch`, { method: 'POST', body: { deletes: chunk.map((id) => ({ id })) } });
    } catch {
      for (const id of chunk.slice(0, 40)) await deleteRecord(token, zoneId, id).catch(() => {});
    }
  }
}
