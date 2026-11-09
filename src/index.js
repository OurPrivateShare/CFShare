import { HttpError, Router, clientIp, json } from './lib/http.js';
import { appSecret, cleanup, ensureSchema } from './lib/db.js';
import { loadUser, requireRole } from './lib/auth.js';
import * as auth from './routes/auth.js';
import * as user from './routes/user.js';
import * as admin from './routes/admin.js';

const router = new Router()
  .get('/api/bootstrap', auth.bootstrap)
  .post('/api/setup', auth.setup)
  .post('/api/auth/send-code', auth.sendCode)
  .post('/api/auth/register', auth.register)
  .post('/api/auth/login', auth.login)
  .post('/api/auth/reset', auth.resetPassword)
  .post('/api/auth/logout', auth.logout)
  .post('/api/me/password', auth.changePassword, 'user')

  .get('/api/me', user.me, 'user')
  .get('/api/domains', user.listDomains, 'user')
  .get('/api/check', user.checkAvailability, 'user')
  .get('/api/subdomains', user.listSubdomains, 'user')
  .post('/api/subdomains', user.createSubdomain, 'user')
  .delete('/api/subdomains/:id', user.deleteSubdomain, 'user')
  .get('/api/subdomains/:id/records', user.listRecords, 'user')
  .post('/api/subdomains/:id/records', user.createRecordRoute, 'user')
  .put('/api/records/:id', user.updateRecordRoute, 'user')
  .delete('/api/records/:id', user.deleteRecordRoute, 'user')
  .post('/api/redeem', user.redeem, 'user')

  .get('/api/admin/stats', admin.stats, 'admin')
  .get('/api/admin/users', admin.listUsers, 'admin')
  .post('/api/admin/users', admin.createUser, 'admin')
  .post('/api/admin/users/:id/ban', admin.banUser, 'admin')
  .post('/api/admin/users/:id/unban', admin.unbanUser, 'admin')
  .post('/api/admin/users/:id/reset-password', admin.resetUserPassword, 'admin')
  .post('/api/admin/users/:id/plan', admin.setUserPlan, 'admin')
  .delete('/api/admin/users/:id', admin.deleteUser, 'admin')
  .put('/api/admin/plans', admin.updatePlans, 'admin')
  .get('/api/admin/codes', admin.listCodes, 'admin')
  .post('/api/admin/codes', admin.createCodes, 'admin')
  .post('/api/admin/codes/:id/toggle', admin.toggleCode, 'admin')
  .delete('/api/admin/codes/:id', admin.deleteCode, 'admin')
  .get('/api/admin/tokens', admin.listTokens, 'admin')
  .post('/api/admin/tokens/preview', admin.previewToken, 'admin')
  .post('/api/admin/tokens', admin.addToken, 'admin')
  .post('/api/admin/tokens/:id/verify', admin.verifyToken, 'admin')
  .put('/api/admin/tokens/:id', admin.renameToken, 'admin')
  .delete('/api/admin/tokens/:id', admin.deleteToken, 'admin')
  .get('/api/admin/domains', admin.listDomainsAdmin, 'admin')
  .post('/api/admin/domains/sync', admin.syncDomains, 'admin')
  .put('/api/admin/domains/:id', admin.updateDomain, 'admin')
  .get('/api/admin/subdomains', admin.listAllSubdomains, 'admin')
  .delete('/api/admin/subdomains/:id', admin.deleteSubdomainAdmin, 'admin')
  .get('/api/admin/settings', admin.getSettingsAdmin, 'admin')
  .put('/api/admin/settings', admin.updateSettings, 'admin')
  .post('/api/admin/settings/test-mail', admin.testMail, 'admin')
  .get('/api/admin/mail', admin.inbox, 'admin')
  .get('/api/admin/mail/:uid', admin.inboxMessage, 'admin')
  .get('/api/admin/logs', admin.listLogs, 'admin');

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'SAMEORIGIN',
};

async function handle(request, env, exec) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

  if (!env.DB) return json({ ok: false, error: '未绑定 D1 数据库（binding 名称需为 DB）' }, 500);
  appSecret(env);

  const match = router.match(request.method, url.pathname);
  if (!match) return json({ ok: false, error: '接口不存在' }, 404);
  if (match.methodNotAllowed) return json({ ok: false, error: '请求方法不允许' }, 405);

  // 写操作必须带自定义头，配合 SameSite Cookie 防御 CSRF
  if (request.method !== 'GET' && request.headers.get('x-requested-with') !== 'cfshare') {
    return json({ ok: false, error: '非法请求来源' }, 403);
  }

  await ensureSchema(env);
  const needsUser = match.route.auth || url.pathname === '/api/bootstrap';
  const currentUser = needsUser ? await loadUser(request, env) : null;
  if (match.route.auth) requireRole(currentUser, match.route.auth);

  return match.route.handler({ request, env, exec, url, params: match.params, user: currentUser, ip: clientIp(request) });
}

export default {
  async fetch(request, env, exec) {
    let response;
    try {
      response = await handle(request, env, exec);
    } catch (err) {
      if (err instanceof HttpError) {
        response = json({ ok: false, error: err.message }, err.status);
      } else {
        console.error('Unhandled error', err?.stack || err);
        response = json({ ok: false, error: '服务器内部错误，请稍后重试' }, 500);
      }
    }
    if (new URL(request.url).pathname.startsWith('/api/')) {
      const headers = new Headers(response.headers);
      for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
      return new Response(response.body, { status: response.status, headers });
    }
    return response;
  },

  async scheduled(_event, env, exec) {
    exec.waitUntil(ensureSchema(env).then(() => cleanup(env)));
  },
};
