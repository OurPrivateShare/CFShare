(() => {
  'use strict';

  /* ================= 基础工具 ================= */

  const ICONS = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    crown: '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
    ticket: '<path d="M2 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    server: '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    circle: '<circle cx="12" cy="12" r="10"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>',
    back: '<path d="m12 19-7-7 7-7M19 12H5"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  };

  const icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const pad = (n) => String(n).padStart(2, '0');

  function fmtDate(ts, withTime = true) {
    if (!ts) return '—';
    const d = new Date(ts * 1000);
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return withTime ? `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}` : date;
  }

  function fmtRelative(ts) {
    if (!ts) return '—';
    const diff = Date.now() / 1000 - ts;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`;
    return fmtDate(ts, false);
  }

  const S = { site: null, user: null, plans: [] };
  const planName = (level) => S.plans.find((p) => p.level === level)?.name || `L${level}`;
  const tierBadge = (level) => `<span class="badge tier-${level}">${level > 0 ? icon('crown') : ''}${esc(planName(level))}</span>`;

  function planExpiryText(u) {
    if (u.level === 0) return u.planLevel > 0 ? '会员已过期' : '永久免费';
    return u.planExpires ? `${fmtDate(u.planExpires, false)} 到期` : '永久有效';
  }

  class ApiError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }

  async function api(path, { method = 'GET', body } = {}) {
    const headers = { 'x-requested-with': 'cfshare' };
    if (body !== undefined) headers['content-type'] = 'application/json';
    let res;
    try {
      res = await fetch(`/api${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, credentials: 'same-origin' });
    } catch {
      throw new ApiError('网络连接失败，请检查网络', 0);
    }
    const data = await res.json().catch(() => ({ ok: false, error: `服务器响应异常（${res.status}）` }));
    if (!res.ok || data.ok === false) {
      if (res.status === 401 && S.user) {
        S.user = null;
        toast('登录已过期，请重新登录', 'error');
        go('/login');
      }
      throw new ApiError(data.error || '请求失败', res.status);
    }
    return data;
  }

  function toast(message, type = 'success') {
    const box = $('#toasts');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `${icon(type === 'error' ? 'alert' : 'checkCircle')}<div>${esc(message)}</div>`;
    box.appendChild(el);
    setTimeout(() => el.remove(), type === 'error' ? 5000 : 3000);
  }

  function setBusy(btn, busy) {
    if (!btn) return;
    if (busy) {
      btn.dataset.html = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner sm" aria-hidden="true"></span>${btn.textContent.trim() ? `<span>${esc(btn.textContent.trim())}</span>` : ''}`;
    } else {
      btn.disabled = false;
      if (btn.dataset.html) btn.innerHTML = btn.dataset.html;
    }
  }

  async function withBusy(btn, fn) {
    setBusy(btn, true);
    try {
      return await fn();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      if (btn?.isConnected) setBusy(btn, false);
    }
  }

  function formValues(form) {
    const out = {};
    for (const el of form.elements) {
      if (!el.name || el.disabled) continue;
      if (el.type === 'checkbox') {
        const group = form.querySelectorAll(`input[type=checkbox][name="${el.name}"]`);
        if (group.length > 1) {
          out[el.name] = out[el.name] || [];
          if (el.checked) out[el.name].push(el.value);
        } else out[el.name] = el.checked;
      } else if (el.type === 'radio') {
        if (el.checked) out[el.name] = el.value;
      } else out[el.name] = el.value;
    }
    return out;
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast('已复制到剪贴板');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      toast('已复制到剪贴板');
    }
  }

  function downloadText(filename, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const on = (root, selector, event, handler) =>
    root.addEventListener(event, (e) => {
      const target = e.target.closest(selector);
      if (target && root.contains(target)) handler(e, target);
    });

  const loadingHtml = () => '<div class="empty"><div class="spinner" style="margin:0 auto" aria-hidden="true"></div><p class="mt-8">加载中…</p></div>';
  const emptyHtml = (title, desc = '', iconName = 'globe', action = '') => `<div class="empty">${icon(iconName)}<h3>${esc(title)}</h3><p>${esc(desc)}</p>${action ? `<div class="mt-16">${action}</div>` : ''}</div>`;
  const errorHtml = (msg) => `<div class="card card-pad"><div class="alert alert-danger">${icon('alert')}<div>${esc(msg)}</div></div></div>`;

  function pageHead(title, desc = '', actions = '') {
    return `<div class="page-head"><div><h1>${esc(title)}</h1>${desc ? `<p>${desc}</p>` : ''}</div>${actions ? `<div class="row">${actions}</div>` : ''}</div>`;
  }

  function pager(total, page, size) {
    const pages = Math.max(1, Math.ceil(total / size));
    return `<div class="pager"><span class="muted small">共 ${total} 条 · 第 ${page}/${pages} 页</span><div class="row">
      <button class="btn btn-sm" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>上一页</button>
      <button class="btn btn-sm" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>下一页</button></div></div>`;
  }

  /* ================= 弹窗 ================= */

  function modal({ title, body, submit = '确定', cancel = '取消', wide = false, danger = false, onSubmit, onOpen, footer = true }) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      const id = `m${Math.random().toString(36).slice(2, 8)}`;
      overlay.innerHTML = `<form class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="${id}" novalidate>
        <div class="modal-head"><h2 id="${id}">${esc(title)}</h2><button type="button" class="btn btn-ghost btn-icon btn-sm" data-close aria-label="关闭">${icon('x')}</button></div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-foot">${cancel ? `<button type="button" class="btn" data-close>${esc(cancel)}</button>` : ''}${submit ? `<button type="submit" class="btn ${danger ? 'btn-danger-solid' : 'btn-primary'}">${esc(submit)}</button>` : ''}</div>` : ''}
      </form>`;
      const form = overlay.firstElementChild;
      const previous = document.activeElement;
      const close = (value) => {
        overlay.remove();
        document.removeEventListener('keydown', onKey);
        previous?.focus?.();
        resolve(value);
      };
      const onKey = (e) => {
        if (e.key === 'Escape') close(null);
      };
      document.addEventListener('keydown', onKey);
      overlay.addEventListener('mousedown', (e) => {
        if (e.target === overlay) close(null);
      });
      $$('[data-close]', overlay).forEach((b) => b.addEventListener('click', () => close(null)));
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!onSubmit) return close(true);
        const btn = $('button[type=submit]', form);
        setBusy(btn, true);
        try {
          const result = await onSubmit(formValues(form), form);
          if (result !== false) close(result ?? true);
        } catch (err) {
          toast(err.message, 'error');
        } finally {
          if (btn?.isConnected) setBusy(btn, false);
        }
      });
      document.body.appendChild(overlay);
      onOpen?.(form, close);
      ($('[autofocus]', form) || $('input:not([type=hidden]),select,textarea', form) || $('button[type=submit]', form))?.focus();
    });
  }

  const confirmBox = (message, { title = '请确认', confirm = '确定', danger = true } = {}) =>
    modal({ title, body: `<p>${message}</p>`, submit: confirm, danger });

  const closeMenus = (except) => {
    $$('.dropdown.open').forEach((d) => {
      if (d === except) return;
      d.classList.remove('open');
      d.querySelector('[data-menu]')?.setAttribute('aria-expanded', 'false');
    });
  };

  // Fixed positioning keeps the menu from being clipped by scrollable table containers.
  const placeMenu = (trigger, menu) => {
    const gap = 4;
    const rect = trigger.getBoundingClientRect();
    const { offsetWidth: w, offsetHeight: h } = menu;
    const fitsBelow = rect.bottom + gap + h <= window.innerHeight - 8;
    const top = fitsBelow || rect.top - gap - h < 8 ? rect.bottom + gap : rect.top - gap - h;
    const left = Math.min(Math.max(8, rect.right - w), window.innerWidth - w - 8);
    Object.assign(menu.style, { top: `${top}px`, left: `${left}px` });
  };

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-menu]');
    const dropdown = trigger?.parentElement;
    closeMenus(dropdown);
    if (!dropdown) return;
    const open = dropdown.classList.toggle('open');
    trigger.setAttribute('aria-expanded', String(open));
    if (open) placeMenu(trigger, dropdown.querySelector('.menu'));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenus();
  });
  window.addEventListener('resize', () => closeMenus());
  document.addEventListener('scroll', () => closeMenus(), true);

  /* ================= 路由 ================= */

  const routes = [];
  const route = (path, view, opts = {}) => {
    const keys = [];
    const re = new RegExp(`^${path.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)'))}$`);
    routes.push({ path, re, keys, view, ...opts });
  };

  const go = (path) => {
    if (location.hash !== `#${path}`) location.hash = path;
    else render();
  };

  let navToken = 0;

  async function render() {
    const path = location.hash.replace(/^#/, '') || '/';
    let match = null;
    let params = {};
    for (const r of routes) {
      const m = path.match(r.re);
      if (m) {
        match = r;
        r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
        break;
      }
    }
    if (!match) return go(S.user ? '/' : '/login');

    if (S.site?.needSetup && match.path !== '/setup') return go('/setup');
    if (!S.site?.needSetup && match.path === '/setup') return go('/');
    if (match.guest && S.user) return go(S.user.role === 'admin' ? '/admin' : '/');
    if (match.auth && !S.user) return go('/login');
    if (match.admin && S.user?.role !== 'admin') return go('/');

    const token = ++navToken;
    const app = $('#app');
    let container;
    if (match.guest || match.path === '/setup') {
      app.innerHTML = '<div class="auth-wrap"><div class="card auth-card" id="auth-view"></div></div>';
      container = $('#auth-view');
      document.title = `${match.title} - ${S.site.name}`;
    } else {
      ensureShell();
      updateNav(path);
      container = document.createElement('div');
      $('#content').replaceChildren(container);
      $('.shell').classList.remove('nav-open');
      document.title = `${match.title} - ${S.site.name}`;
      window.scrollTo(0, 0);
    }
    const ctx = { params, alive: () => token === navToken, el: container };
    try {
      await match.view(container, ctx);
    } catch (err) {
      if (ctx.alive() && err.status !== 401) container.innerHTML = errorHtml(err.message);
    }
  }

  const USER_NAV = [
    ['/', 'home', '概览'],
    ['/domains', 'globe', '我的域名'],
    ['/apply', 'plus', '申请域名'],
    ['/upgrade', 'crown', '会员升级'],
    ['/account', 'user', '账户设置'],
  ];
  const ADMIN_NAV = [
    ['/admin', 'chart', '控制台'],
    ['/admin/users', 'users', '用户管理'],
    ['/admin/plans', 'layers', '会员套餐'],
    ['/admin/codes', 'ticket', '兑换码'],
    ['/admin/tokens', 'key', 'API Token'],
    ['/admin/domains', 'server', '域名管理'],
    ['/admin/subdomains', 'list', '用户域名'],
    ['/admin/mail', 'mail', '邮箱收件'],
    ['/admin/settings', 'settings', '系统设置'],
    ['/admin/logs', 'file', '操作日志'],
  ];

  function ensureShell() {
    if ($('.shell')) return;
    const navLinks = (items) => items.map(([href, ic, label]) => `<a href="#${href}" data-nav="${href}">${icon(ic)}<span>${label}</span></a>`).join('');
    $('#app').innerHTML = `<div class="shell">
      <aside class="sidebar" aria-label="主导航">
        <a class="brand" href="#/"><span class="brand-mark">${icon('cloud')}</span><span class="truncate">${esc(S.site.name)}</span></a>
        <nav class="nav">
          <div class="nav-group"><div class="nav-label">域名服务</div>${navLinks(USER_NAV)}</div>
          ${S.user.role === 'admin' ? `<div class="nav-group"><div class="nav-label">管理后台</div>${navLinks(ADMIN_NAV)}</div>` : ''}
        </nav>
        <div class="sidebar-foot">
          <div class="user-chip"><span class="avatar">${esc(S.user.email[0])}</span><div class="meta"><div class="email" title="${esc(S.user.email)}">${esc(S.user.email)}</div><div>${tierBadge(S.user.level)}</div></div>
          <button class="btn btn-ghost btn-icon btn-sm" id="logout" aria-label="退出登录" title="退出登录">${icon('logout')}</button></div>
        </div>
      </aside>
      <div class="backdrop" id="backdrop"></div>
      <div class="main">
        <header class="topbar"><button class="btn btn-ghost btn-icon" id="nav-toggle" aria-label="打开菜单">${icon('menu')}</button>
          <a class="brand" href="#/" style="padding:0"><span class="brand-mark">${icon('cloud')}</span>${esc(S.site.name)}</a><span style="width:34px"></span></header>
        <main class="content" id="content"></main>
      </div></div>`;
    $('#nav-toggle').onclick = () => $('.shell').classList.add('nav-open');
    $('#backdrop').onclick = () => $('.shell').classList.remove('nav-open');
    $('#logout').onclick = logout;
  }

  function updateNav(path) {
    const section = path.startsWith('/domain/') ? '/domains' : path;
    $$('[data-nav]').forEach((a) => {
      const active = a.dataset.nav === section;
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function resetShell() {
    $('#app').innerHTML = '';
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    S.user = null;
    resetShell();
    go('/login');
  }

  async function bootstrap() {
    const data = await api('/bootstrap');
    S.site = data.site;
    S.user = data.user;
    S.plans = data.plans;
  }

  async function afterLogin(user) {
    S.user = user;
    await bootstrap();
    resetShell();
    go(S.user?.role === 'admin' ? '/admin' : '/');
  }

  /* ================= 认证页面 ================= */

  const brandHtml = () => `<div class="brand"><span class="brand-mark">${icon('cloud')}</span>${esc(S.site.name)}</div>`;

  function passwordField(name = 'password', label = '密码', autocomplete = 'current-password') {
    return `<div class="field"><label for="f-${name}">${label}</label><input class="input" id="f-${name}" name="${name}" type="password" autocomplete="${autocomplete}" required minlength="8" maxlength="72"></div>`;
  }

  function bindCodeButton(form, purpose) {
    const btn = $('[data-send-code]', form);
    btn.addEventListener('click', async () => {
      const email = form.email.value.trim();
      if (!email) return toast('请先填写邮箱', 'error');
      setBusy(btn, true);
      try {
        const res = await api('/auth/send-code', { method: 'POST', body: { email, purpose } });
        toast(res.message);
      } catch (err) {
        setBusy(btn, false);
        return toast(err.message, 'error');
      }
      setBusy(btn, false);
      let left = 60;
      btn.disabled = true;
      btn.textContent = `${left}s 后重发`;
      const timer = setInterval(() => {
        if (!btn.isConnected) return clearInterval(timer);
        btn.textContent = `${--left}s 后重发`;
        if (left <= 0) {
          clearInterval(timer);
          btn.disabled = false;
          btn.textContent = '重新获取';
        }
      }, 1000);
      form.code.focus();
    });
  }

  function submitHandler(form, fn) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      withBusy($('button[type=submit]', form), () => fn(formValues(form)));
    });
  }

  function viewSetup(el) {
    el.innerHTML = `${brandHtml()}<h1>初始化管理员</h1><p class="lead">首次部署，请创建超级管理员账号</p>
      <form class="stack" novalidate>
        <div class="field"><label for="f-email">管理员邮箱</label><input class="input" id="f-email" name="email" type="email" autocomplete="email" required></div>
        ${passwordField('password', '密码', 'new-password')}
        <p class="hint">至少 8 位，需包含字母与数字</p>
        <div class="field"><label for="f-key">初始化密钥</label><input class="input" id="f-key" name="setupKey" type="password" autocomplete="off" required><p class="hint">即部署时设置的 APP_SECRET</p></div>
        <button class="btn btn-primary btn-block" type="submit">创建并进入后台</button>
      </form>`;
    submitHandler($('form', el), async (v) => {
      const res = await api('/setup', { method: 'POST', body: v });
      toast('初始化完成');
      await afterLogin(res.user);
    });
  }

  function viewLogin(el) {
    el.innerHTML = `${brandHtml()}<h1>登录账号</h1><p class="lead">${esc(S.site.desc)}</p>
      <form class="stack" novalidate>
        <div class="field"><label for="f-email">邮箱</label><input class="input" id="f-email" name="email" type="email" autocomplete="email" required autofocus></div>
        <div class="field"><div class="row between"><label for="f-password" class="label">密码</label><a href="#/forgot" class="small">忘记密码？</a></div>
          <input class="input" id="f-password" name="password" type="password" autocomplete="current-password" required></div>
        <button class="btn btn-primary btn-block" type="submit">登录</button>
      </form>
      <p class="auth-foot">${S.site.allowRegister ? '还没有账号？<a href="#/register">免费注册</a>' : '本站暂未开放注册'}</p>`;
    submitHandler($('form', el), async (v) => {
      const res = await api('/auth/login', { method: 'POST', body: v });
      await afterLogin(res.user);
    });
  }

  function codeFields() {
    return `<div class="field"><label for="f-email">邮箱</label><input class="input" id="f-email" name="email" type="email" autocomplete="email" required autofocus></div>
      <div class="field"><label for="f-code">邮箱验证码</label><div class="input-group"><input class="input" id="f-code" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required placeholder="6 位数字">
      <button type="button" class="btn" data-send-code>获取验证码</button></div></div>`;
  }

  function viewRegister(el) {
    if (!S.site.allowRegister) {
      el.innerHTML = `${brandHtml()}<h1>暂未开放注册</h1><p class="lead">请联系管理员获取账号</p><a class="btn btn-block" href="#/login">返回登录</a>`;
      return;
    }
    el.innerHTML = `${brandHtml()}<h1>注册账号</h1><p class="lead">注册即可免费申请二级域名</p>
      ${S.site.mailReady ? '' : `<div class="alert alert-warning" style="margin-bottom:14px">${icon('alert')}<div>站点尚未配置发信邮箱，暂时无法发送验证码</div></div>`}
      <form class="stack" novalidate>${codeFields()}${passwordField('password', '设置密码', 'new-password')}
        <p class="hint">至少 8 位，需包含字母与数字</p>
        <button class="btn btn-primary btn-block" type="submit">注册</button></form>
      <p class="auth-foot">已有账号？<a href="#/login">直接登录</a></p>`;
    const form = $('form', el);
    bindCodeButton(form, 'register');
    submitHandler(form, async (v) => {
      const res = await api('/auth/register', { method: 'POST', body: v });
      toast('注册成功，欢迎使用！');
      await afterLogin(res.user);
    });
  }

  function viewForgot(el) {
    el.innerHTML = `${brandHtml()}<h1>重置密码</h1><p class="lead">通过邮箱验证码设置新密码</p>
      <form class="stack" novalidate>${codeFields()}${passwordField('password', '新密码', 'new-password')}
        <button class="btn btn-primary btn-block" type="submit">重置密码</button></form>
      <p class="auth-foot"><a href="#/login">返回登录</a></p>`;
    const form = $('form', el);
    bindCodeButton(form, 'reset');
    submitHandler(form, async (v) => {
      const res = await api('/auth/reset', { method: 'POST', body: v });
      toast(res.message);
      go('/login');
    });
  }

  /* ================= 用户页面 ================= */

  function usageBar(used, max) {
    const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 100;
    return `<div class="progress ${used >= max ? 'full' : ''}" role="progressbar" aria-valuenow="${used}" aria-valuemin="0" aria-valuemax="${max}"><span style="width:${pct}%"></span></div>`;
  }

  async function viewHome(el, { alive }) {
    el.innerHTML = loadingHtml();
    const [me, subs] = await Promise.all([api('/me'), api('/subdomains')]);
    if (!alive()) return;
    S.user = me.user;
    const { plan, usage } = me;
    const isAdmin = me.user.role === 'admin';
    const maxSub = isAdmin ? '∞' : plan.maxSubdomains;
    el.innerHTML = `${pageHead(`你好，${me.user.email.split('@')[0]}`, '在这里管理你的二级域名与解析记录')}
      ${S.site.announcement ? `<div class="alert alert-info" style="margin-bottom:16px">${icon('alert')}<div class="announce">${esc(S.site.announcement)}</div></div>` : ''}
      <div class="card hero"><div><div class="row">${tierBadge(me.user.level)}<span class="muted small">${planExpiryText(me.user)}</span></div>
        <h2 class="mt-8">${me.user.level < 2 ? '升级会员，解锁更多域名与高级记录类型' : '感谢支持，您已是最高等级会员'}</h2></div>
        <div class="row"><a class="btn btn-primary" href="#/apply">${icon('plus')}申请域名</a>${me.user.level < 2 ? `<a class="btn" href="#/upgrade">${icon('crown')}升级会员</a>` : ''}</div></div>
      <div class="grid grid-3 mt-16">
        <div class="card stat"><div class="label">已申请域名</div><div class="value">${usage.subdomains}<span class="muted" style="font-size:15px"> / ${maxSub}</span></div><div class="mt-8">${isAdmin ? '' : usageBar(usage.subdomains, plan.maxSubdomains)}</div></div>
        <div class="card stat"><div class="label">解析记录总数</div><div class="value">${usage.records}</div><div class="sub">每个域名最多 ${isAdmin ? '不限' : plan.maxRecords} 条</div></div>
        <div class="card stat"><div class="label">可用记录类型</div><div class="value" style="font-size:16px;margin-top:10px">${(isAdmin ? ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'CAA'] : plan.recordTypes).map((t) => `<span class="badge">${t}</span>`).join(' ')}</div><div class="sub mt-8">${plan.allowProxy || isAdmin ? '支持开启 Cloudflare CDN 代理' : '不支持 CDN 代理'}</div></div>
      </div>
      <div class="card mt-16"><div class="card-head"><h2>我的域名</h2><a href="#/domains" class="small">查看全部</a></div>
        ${subs.subdomains.length ? subdomainTable(subs.subdomains.slice(0, 5)) : emptyHtml('还没有域名', '选择一个后缀，几秒钟即可拥有你的专属域名', 'globe', '<a class="btn btn-primary" href="#/apply">立即申请</a>')}</div>`;
  }

  function subdomainTable(list) {
    return `<div class="table-wrap"><table><thead><tr><th>域名</th><th>解析记录</th><th>申请时间</th><th class="actions"><span class="sr-only">操作</span></th></tr></thead><tbody>
      ${list
        .map(
          (s) => `<tr><td><a href="#/domain/${s.id}" class="mono" style="font-weight:600">${esc(s.fqdn)}</a>${s.domain_enabled ? '' : ' <span class="badge badge-warning">后缀已停止开放</span>'}</td>
        <td>${s.record_count} 条</td><td class="muted">${fmtDate(s.created_at, false)}</td>
        <td class="actions"><a class="btn btn-sm" href="#/domain/${s.id}">管理解析</a></td></tr>`,
        )
        .join('')}</tbody></table></div>`;
  }

  async function viewDomains(el, { alive }) {
    el.innerHTML = loadingHtml();
    const data = await api('/subdomains');
    if (!alive()) return;
    el.innerHTML = `${pageHead('我的域名', '点击域名进入解析管理', `<a class="btn btn-primary" href="#/apply">${icon('plus')}申请域名</a>`)}
      <div class="card">${data.subdomains.length ? subdomainTable(data.subdomains) : emptyHtml('还没有域名', '申请一个属于你的二级域名吧', 'globe', '<a class="btn btn-primary" href="#/apply">立即申请</a>')}</div>`;
  }

  async function viewApply(el, { alive }) {
    el.innerHTML = loadingHtml();
    const [data, me] = await Promise.all([api('/domains'), api('/me')]);
    if (!alive()) return;
    const { plan, usage } = me;
    const isAdmin = me.user.role === 'admin';
    const full = !isAdmin && usage.subdomains >= plan.maxSubdomains;
    if (!data.domains.length) {
      el.innerHTML = `${pageHead('申请域名')}<div class="card">${emptyHtml('暂无可申请的域名', '管理员尚未开放任何域名后缀，请稍后再来', 'server')}</div>`;
      return;
    }
    const firstAvailable = data.domains.find((d) => !d.locked);
    el.innerHTML = `${pageHead('申请域名', `已使用 ${usage.subdomains} / ${isAdmin ? '∞' : plan.maxSubdomains} 个额度`)}
      ${full ? `<div class="alert alert-warning" style="margin-bottom:16px">${icon('alert')}<div>当前额度已用完，<a href="#/upgrade">升级会员</a> 可获得更多域名额度。</div></div>` : ''}
      <form class="card" novalidate><div class="card-body stack">
        <fieldset><legend class="label" style="margin-bottom:8px">1. 选择域名后缀</legend>
          <div class="choice-grid">${data.domains
            .map(
              (d) => `<label class="choice ${d.locked ? 'locked' : ''}"><input type="radio" name="domainId" value="${d.id}" ${d.locked ? 'disabled' : ''} ${firstAvailable?.id === d.id ? 'checked' : ''} data-min="${d.prefix.min}" data-max="${d.prefix.max}" data-name="${esc(d.name)}">
            <span class="name">.${esc(d.name)}</span>
            <span class="row small muted">${d.locked ? `${icon('lock', 'sr-icon')}需${esc(planName(d.minLevel))}` : `前缀 ${d.prefix.min}-${d.prefix.max} 位`}${d.minLevel > 0 ? ` ${tierBadge(d.minLevel)}` : ''}</span>
            ${d.note ? `<span class="small muted">${esc(d.note)}</span>` : ''}</label>`,
            )
            .join('')}</div></fieldset>
        <div class="field"><label for="f-prefix">2. 输入想要的前缀</label>
          <div class="input-group"><input class="input mono" id="f-prefix" name="prefix" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="例如 myblog" required><span class="addon" id="suffix">.${esc(firstAvailable?.name || '')}</span></div>
          <p class="hint" id="prefix-hint">仅支持小写字母、数字和连字符</p></div>
        <div id="check-result" aria-live="polite"></div>
        <div class="row"><button type="button" class="btn" id="btn-check">${icon('search')}检查是否可用</button><button type="submit" class="btn btn-primary" ${full || !firstAvailable ? 'disabled' : ''}>${icon('plus')}立即申请</button></div>
      </div></form>`;
    const form = $('form', el);
    const prefixInput = form.prefix;
    const updateHint = () => {
      const selected = $('input[name=domainId]:checked', form);
      if (!selected) return;
      $('#suffix', el).textContent = `.${selected.dataset.name}`;
      $('#prefix-hint', el).textContent = `长度 ${selected.dataset.min}-${selected.dataset.max} 位，仅支持小写字母、数字和连字符（当前 ${prefixInput.value.length} 位）`;
      $('#check-result', el).innerHTML = '';
    };
    form.addEventListener('change', updateHint);
    prefixInput.addEventListener('input', () => {
      prefixInput.value = prefixInput.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      updateHint();
    });
    updateHint();
    $('#btn-check', el).addEventListener('click', (e) =>
      withBusy(e.currentTarget, async () => {
        const v = formValues(form);
        if (!v.domainId) throw new Error('请选择域名后缀');
        const res = await api(`/check?domain=${encodeURIComponent(v.domainId)}&prefix=${encodeURIComponent(v.prefix)}`);
        $('#check-result', el).innerHTML = res.available
          ? `<div class="alert alert-success">${icon('checkCircle')}<div><b class="mono">${esc(res.fqdn)}</b> 可以申请</div></div>`
          : `<div class="alert alert-danger">${icon('alert')}<div><b class="mono">${esc(res.fqdn)}</b> ${esc(res.reason)}</div></div>`;
      }),
    );
    submitHandler(form, async (v) => {
      if (!v.domainId) throw new Error('请选择域名后缀');
      const res = await api('/subdomains', { method: 'POST', body: { domainId: Number(v.domainId), prefix: v.prefix } });
      toast(res.message);
      go(`/domain/${res.subdomain.id}`);
    });
  }

  const TTL_OPTIONS = [[1, '自动'], [60, '1 分钟'], [300, '5 分钟'], [600, '10 分钟'], [1800, '30 分钟'], [3600, '1 小时'], [86400, '1 天']];
  const CONTENT_PLACEHOLDER = { A: '例如 1.2.3.4', AAAA: '例如 2001:db8::1', CNAME: '例如 example.github.io', TXT: '任意文本，如验证字符串', MX: '例如 mx.example.com', NS: '例如 ns1.example.com', CAA: '0 issue "letsencrypt.org"' };
  const ALL_TYPES = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'CAA'];
  const ttlText = (ttl) => TTL_OPTIONS.find(([v]) => v === ttl)?.[1] || `${ttl} 秒`;
  const hostOf = (name, fqdn) => (name === fqdn ? '@' : name.slice(0, -(fqdn.length + 1)));

  async function viewDomainDetail(el, { params, alive }) {
    el.innerHTML = loadingHtml();
    const load = async () => {
      const data = await api(`/subdomains/${params.id}/records`);
      if (!alive()) return;
      const { subdomain: sub, records, plan } = data;
      const isAdmin = S.user.role === 'admin';
      const full = !isAdmin && records.length >= plan.maxRecords;
      el.innerHTML = `<a href="#/domains" class="row small muted" style="margin-bottom:10px;gap:4px">${icon('back', 'sr-icon')}返回我的域名</a>
        ${pageHead(sub.fqdn, `申请于 ${fmtDate(sub.createdAt, false)} · 解析记录 ${records.length} / ${isAdmin ? '∞' : plan.maxRecords}`, `<button class="btn" id="copy-fqdn">${icon('copy')}复制</button><button class="btn btn-danger" id="del-sub">${icon('trash')}删除域名</button>`)}
        ${sub.domainEnabled ? '' : `<div class="alert alert-warning" style="margin-bottom:16px">${icon('alert')}<div>该域名后缀已停止开放申请，现有解析仍可正常使用。</div></div>`}
        <div class="card"><div class="card-head"><h2>解析记录</h2><button class="btn btn-primary btn-sm" id="add-record" ${full ? 'disabled title="记录数已达上限"' : ''}>${icon('plus')}添加记录</button></div>
        ${
          records.length
            ? `<div class="table-wrap"><table><thead><tr><th>类型</th><th>主机记录</th><th>记录值</th><th>TTL</th><th>代理</th><th class="actions"><span class="sr-only">操作</span></th></tr></thead><tbody>
          ${records
            .map(
              (r) => `<tr><td><span class="badge badge-brand">${esc(r.type)}</span></td><td class="mono">${esc(hostOf(r.name, sub.fqdn))}</td>
            <td class="mono" style="max-width:320px;word-break:break-all">${r.priority != null ? `<span class="muted">${r.priority}</span> ` : ''}${esc(r.content)}</td><td class="muted">${ttlText(r.ttl)}</td>
            <td>${r.proxied ? `<span class="badge badge-warning">${icon('zap')}已代理</span>` : '<span class="muted small">仅 DNS</span>'}</td>
            <td class="actions"><button class="btn btn-sm" data-edit="${r.id}">编辑</button><button class="btn btn-sm btn-danger" data-del="${r.id}">删除</button></td></tr>`,
            )
            .join('')}</tbody></table></div>`
            : emptyHtml('暂无解析记录', '添加一条 A 或 CNAME 记录，让域名指向你的服务器', 'list')
        }</div>
        <div class="card card-pad mt-16"><h3 style="font-size:14px">使用提示</h3><ul class="muted small" style="margin:8px 0 0;padding-left:18px">
          <li>主机记录填 <code>@</code> 表示 ${esc(sub.fqdn)} 本身，填 <code>www</code> 表示 www.${esc(sub.fqdn)}</li>
          <li>开启「代理」后流量将经过 Cloudflare CDN，自动获得 HTTPS 与 DDoS 防护</li>
          <li>同一主机记录的 CNAME 不能与其他类型记录共存</li></ul></div>`;
      $('#copy-fqdn', el).onclick = () => copyText(sub.fqdn);
      $('#del-sub', el).onclick = async () => {
        if (!(await confirmBox(`确定删除 <b class="mono">${esc(sub.fqdn)}</b> 吗？其全部 ${records.length} 条解析记录将被同步删除，且该域名可能被他人注册。`, { confirm: '确认删除' }))) return;
        try {
          const res = await api(`/subdomains/${sub.id}`, { method: 'DELETE' });
          toast(res.message);
          go('/domains');
        } catch (err) {
          toast(err.message, 'error');
        }
      };
      $('#add-record', el).onclick = () => recordModal(sub, plan, null, load);
      on(el, '[data-edit]', 'click', (_, btn) => recordModal(sub, plan, records.find((r) => r.id === Number(btn.dataset.edit)), load));
      on(el, '[data-del]', 'click', async (_, btn) => {
        const rec = records.find((r) => r.id === Number(btn.dataset.del));
        if (!(await confirmBox(`确定删除 <b>${esc(rec.type)}</b> 记录 <span class="mono">${esc(rec.name)}</span> 吗？`, { confirm: '删除' }))) return;
        await withBusy(btn, async () => {
          const res = await api(`/records/${rec.id}`, { method: 'DELETE' });
          toast(res.message);
          await load();
        });
      });
    };
    await load();
  }

  function recordModal(sub, plan, record, reload) {
    const isAdmin = S.user.role === 'admin';
    const allowed = isAdmin ? ALL_TYPES : plan.recordTypes;
    const type = record?.type || allowed[0];
    const body = `
      <div class="field"><label for="r-type">记录类型</label><select class="select" id="r-type" name="type" ${record ? 'disabled' : ''}>
        ${ALL_TYPES.map((t) => `<option value="${t}" ${t === type ? 'selected' : ''} ${allowed.includes(t) ? '' : 'disabled'}>${t}${allowed.includes(t) ? '' : '（需升级会员）'}</option>`).join('')}</select></div>
      <div class="field"><label for="r-host">主机记录</label><div class="input-group"><input class="input mono" id="r-host" name="host" value="${esc(record ? hostOf(record.name, sub.fqdn) : '@')}" autocomplete="off" spellcheck="false"><span class="addon">.${esc(sub.fqdn)}</span></div><p class="hint">@ 表示域名本身，支持多级如 api.v2</p></div>
      <div class="field" data-for="MX"><label for="r-priority">优先级</label><input class="input" id="r-priority" name="priority" type="number" min="0" max="65535" value="${record?.priority ?? 10}"></div>
      <div class="field"><label for="r-content">记录值</label><input class="input mono" id="r-content" name="content" value="${esc(record?.content || '')}" required autocomplete="off" spellcheck="false"></div>
      <div class="grid grid-2">
        <div class="field"><label for="r-ttl">TTL</label><select class="select" id="r-ttl" name="ttl">${TTL_OPTIONS.map(([v, l]) => `<option value="${v}" ${(record?.ttl ?? 1) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field" data-for="A AAAA CNAME"><span class="label">CDN 代理</span><label class="switch" style="height:38px"><input type="checkbox" name="proxied" ${record?.proxied ? 'checked' : ''} ${plan.allowProxy || isAdmin ? '' : 'disabled'}><span class="small">经 Cloudflare 加速</span></label></div>
      </div>`;
    modal({
      title: record ? '编辑解析记录' : '添加解析记录',
      body,
      submit: record ? '保存' : '添加',
      onOpen: (form) => {
        const sync = () => {
          const t = record?.type || form.type.value;
          $$('[data-for]', form).forEach((f) => (f.style.display = f.dataset.for.split(' ').includes(t) ? '' : 'none'));
          form.content.placeholder = CONTENT_PLACEHOLDER[t] || '';
          form.ttl.disabled = false;
          const proxied = form.proxied;
          if (proxied?.checked && ['A', 'AAAA', 'CNAME'].includes(t)) form.ttl.value = '1';
        };
        form.addEventListener('change', sync);
        sync();
        if (record) setTimeout(() => form.content.focus(), 0);
      },
      onSubmit: async (v) => {
        const payload = { type: record?.type || v.type, host: v.host, content: v.content, ttl: Number(v.ttl), proxied: !!v.proxied, priority: Number(v.priority) };
        const res = record ? await api(`/records/${record.id}`, { method: 'PUT', body: payload }) : await api(`/subdomains/${sub.id}/records`, { method: 'POST', body: payload });
        toast(res.message);
        await reload();
      },
    });
  }

  function planFeatures(p) {
    return [
      `最多 <b>${p.maxSubdomains}</b> 个二级域名`,
      `每个域名 <b>${p.maxRecords}</b> 条解析记录`,
      `记录类型：${p.recordTypes.join(' / ')}`,
      p.allowProxy ? 'Cloudflare CDN 代理加速' : '仅 DNS 解析（无代理）',
      `前缀最短 <b>${p.minPrefixLen}</b> 位`,
    ];
  }

  async function viewUpgrade(el, { alive }) {
    el.innerHTML = loadingHtml();
    const me = await api('/me');
    if (!alive()) return;
    S.user = me.user;
    const level = me.user.level;
    el.innerHTML = `${pageHead('会员升级', `当前等级：${esc(planName(level))} · ${planExpiryText(me.user)}`)}
      <div class="grid grid-3">${S.plans
        .map(
          (p) => `<div class="card plan-card ${p.level === level ? 'current' : ''}">
        <div class="row between"><h2 style="font-size:16px">${esc(p.name)}</h2>${p.level === level ? '<span class="badge badge-brand">当前</span>' : ''}</div>
        <div class="price">${esc(p.priceText || '—')}</div><p class="muted small">${esc(p.description)}</p>
        <ul>${planFeatures(p).map((f) => `<li>${icon('check')}<span>${f}</span></li>`).join('')}</ul></div>`,
        )
        .join('')}</div>
      <div class="grid grid-2 mt-16">
        <form class="card" id="redeem-form" novalidate><div class="card-head"><h2>兑换码升级</h2></div><div class="card-body stack">
          <div class="field"><label for="f-code">兑换码</label><input class="input mono" id="f-code" name="code" placeholder="XXXX-XXXX-XXXX" autocomplete="off" required></div>
          <p class="hint">同等级兑换码可叠加续期；高等级兑换码将立即升级并重新计算有效期。</p>
          <div><button class="btn btn-primary" type="submit">${icon('ticket')}立即兑换</button></div></div></form>
        <div class="card"><div class="card-head"><h2>如何获取兑换码</h2></div><div class="card-body stack">
          ${S.site.contact ? `<p class="announce">${esc(S.site.contact)}</p>` : '<p class="muted">请联系站点管理员购买兑换码。</p>'}
          ${S.site.purchaseUrl ? `<div><a class="btn" href="${esc(S.site.purchaseUrl)}" target="_blank" rel="noopener noreferrer">${icon('external')}前往购买</a></div>` : ''}
        </div></div>
      </div>
      ${
        me.redemptions.length
          ? `<div class="card mt-16"><div class="card-head"><h2>兑换记录</h2></div><div class="table-wrap"><table><thead><tr><th>兑换码</th><th>等级</th><th>时长</th><th>时间</th></tr></thead><tbody>
        ${me.redemptions.map((r) => `<tr><td class="mono">${esc(r.code)}</td><td>${tierBadge(r.plan_level)}</td><td>${r.days ? `${r.days} 天` : '永久'}</td><td class="muted">${fmtDate(r.created_at)}</td></tr>`).join('')}</tbody></table></div></div>`
          : ''
      }`;
    submitHandler($('#redeem-form', el), async (v) => {
      const res = await api('/redeem', { method: 'POST', body: v });
      toast(res.message);
      await bootstrap();
      resetShell();
      render();
    });
  }

  async function viewAccount(el, { alive }) {
    el.innerHTML = loadingHtml();
    const me = await api('/me');
    if (!alive()) return;
    const u = me.user;
    el.innerHTML = `${pageHead('账户设置')}
      <div class="grid grid-2">
        <div class="card"><div class="card-head"><h2>账户信息</h2></div><div class="card-body"><dl class="kv">
          <dt>邮箱</dt><dd>${esc(u.email)}</dd><dt>角色</dt><dd>${u.role === 'admin' ? '<span class="badge badge-brand">管理员</span>' : '普通用户'}</dd>
          <dt>会员等级</dt><dd>${tierBadge(u.level)} <span class="muted small">${planExpiryText(u)}</span></dd>
          <dt>注册时间</dt><dd>${fmtDate(u.createdAt)}</dd><dt>上次登录</dt><dd>${fmtDate(u.lastLoginAt)}</dd></dl>
          <button class="btn btn-danger mt-24" id="logout-btn">${icon('logout')}退出登录</button></div></div>
        <form class="card" novalidate><div class="card-head"><h2>修改密码</h2></div><div class="card-body stack">
          ${passwordField('oldPassword', '当前密码')}${passwordField('password', '新密码', 'new-password')}
          <p class="hint">修改后其他设备上的登录将失效</p><div><button class="btn btn-primary" type="submit">保存新密码</button></div></div></form>
      </div>`;
    $('#logout-btn', el).onclick = logout;
    const form = $('form', el);
    submitHandler(form, async (v) => {
      const res = await api('/me/password', { method: 'POST', body: v });
      toast(res.message);
      form.reset();
    });
  }

  /* ================= 管理后台 ================= */

  const ACTION_LABELS = {
    setup: '系统初始化', register: '用户注册', login: '登录', reset_password: '找回密码', change_password: '修改密码',
    subdomain_create: '申请域名', subdomain_delete: '删除域名', record_create: '添加解析', record_update: '修改解析', record_delete: '删除解析', redeem: '兑换会员',
    admin_ban: '封禁用户', admin_unban: '解封用户', admin_reset_password: '重置密码', admin_set_plan: '设置会员', admin_delete_user: '删除用户', admin_create_user: '创建用户',
    admin_update_plans: '修改套餐', admin_create_codes: '生成兑换码', admin_toggle_code: '启停兑换码', admin_delete_code: '删除兑换码',
    admin_add_token: '添加 Token', admin_verify_token: '验证 Token', admin_delete_token: '删除 Token', admin_sync_domains: '同步域名', admin_update_domain: '修改域名',
    admin_delete_subdomain: '回收域名', admin_update_settings: '修改设置',
  };

  async function viewAdminHome(el, { alive }) {
    el.innerHTML = loadingHtml();
    const { stats: s, recent, checklist } = await api('/admin/stats');
    if (!alive()) return;
    const items = [
      [checklist.mail, '配置 Gmail 邮箱（用于发送注册 / 重置密码验证码）', '/admin/settings'],
      [checklist.token, '添加 Cloudflare API Token', '/admin/tokens'],
      [checklist.domain, '在域名管理中开放至少一个域名', '/admin/domains'],
    ];
    const allDone = items.every(([ok]) => ok);
    el.innerHTML = `${pageHead('控制台', '平台运行概况')}
      <div class="grid grid-4">
        <div class="card stat"><div class="label">注册用户</div><div class="value">${s.users}</div><div class="sub">今日新增 ${s.users_today} · 封禁 ${s.banned}</div></div>
        <div class="card stat"><div class="label">付费会员</div><div class="value">${s.members}</div><div class="sub">累计兑换金额 ¥${Number(s.revenue).toFixed(2)}</div></div>
        <div class="card stat"><div class="label">用户域名</div><div class="value">${s.subdomains}</div><div class="sub">解析记录 ${s.records} 条</div></div>
        <div class="card stat"><div class="label">开放后缀</div><div class="value">${s.domains_enabled}<span class="muted" style="font-size:15px"> / ${s.domains}</span></div><div class="sub">${s.tokens} 个 Token · ${s.codes_available} 个可用兑换码</div></div>
      </div>
      <div class="grid grid-2 mt-16">
        <div class="card"><div class="card-head"><h2>${allDone ? '配置状态' : '快速开始'}</h2>${allDone ? '<span class="badge badge-success">已就绪</span>' : '<span class="badge badge-warning">待完成</span>'}</div><div class="card-body"><ul class="checklist">
          ${items.map(([ok, text, href]) => `<li>${icon(ok ? 'checkCircle' : 'circle', ok ? 'check-ok' : 'check-no')}<span class="grow">${text}</span>${!ok && href ? `<a class="btn btn-sm" href="#${href}">去设置</a>` : ''}</li>`).join('')}
        </ul></div></div>
        <div class="card"><div class="card-head"><h2>最近动态</h2><a href="#/admin/logs" class="small">全部日志</a></div>
          ${recent.length ? `<div class="table-wrap"><table><tbody>${recent.map((l) => `<tr><td><span class="badge">${esc(ACTION_LABELS[l.action] || l.action)}</span></td><td class="small truncate" style="max-width:220px" title="${esc(l.detail)}">${esc(l.email || '—')} ${esc(l.detail)}</td><td class="muted small" style="white-space:nowrap">${fmtRelative(l.created_at)}</td></tr>`).join('')}</tbody></table></div>` : emptyHtml('暂无动态', '', 'file')}
        </div>
      </div>`;
  }

  async function viewAdminUsers(el, { alive }) {
    const state = { q: '', status: '', page: 1 };
    el.innerHTML = `${pageHead('用户管理', '管理注册用户、会员等级与账号状态', `<button class="btn btn-primary" id="new-user">${icon('plus')}新建用户</button>`)}
      <div class="card"><div class="card-head"><form class="row grow" id="filter" role="search"><input class="input" name="q" placeholder="搜索邮箱" style="max-width:260px" aria-label="搜索邮箱">
        <select class="select" name="status" style="width:auto" aria-label="筛选状态"><option value="">全部用户</option><option value="member">付费会员</option><option value="banned">已封禁</option><option value="admin">管理员</option></select>
        <button class="btn" type="submit">${icon('search')}搜索</button></form></div><div id="list">${loadingHtml()}</div></div>`;
    const list = $('#list', el);
    let users = [];
    const load = async () => {
      const qs = new URLSearchParams({ q: state.q, status: state.status, page: state.page });
      const data = await api(`/admin/users?${qs}`);
      if (!alive()) return;
      users = data.users;
      list.innerHTML = users.length
        ? `<div class="table-wrap"><table><thead><tr><th>用户</th><th>会员</th><th>状态</th><th>域名 / 记录</th><th>注册</th><th>最近登录</th><th class="actions"><span class="sr-only">操作</span></th></tr></thead><tbody>
        ${users
          .map((u) => {
            const lvl = u.plan_level > 0 && (u.plan_expires == null || u.plan_expires > Date.now() / 1000) ? u.plan_level : 0;
            return `<tr><td><div style="font-weight:500">${esc(u.email)}</div><div class="small muted">#${u.id} ${u.role === 'admin' ? '<span class="badge badge-brand">管理员</span>' : ''}</div></td>
          <td>${tierBadge(lvl)}<div class="small muted">${lvl ? (u.plan_expires ? `${fmtDate(u.plan_expires, false)} 到期` : '永久') : u.plan_level ? '已过期' : ''}</div></td>
          <td>${u.status === 'banned' ? `<span class="badge badge-danger" title="${esc(u.ban_reason || '')}">已封禁</span>` : '<span class="badge badge-success">正常</span>'}</td>
          <td>${u.subdomains} / ${u.records}</td><td class="muted small">${fmtDate(u.created_at, false)}</td><td class="muted small" title="${esc(u.last_login_ip || '')}">${fmtRelative(u.last_login_at)}</td>
          <td class="actions"><div class="dropdown"><button class="btn btn-sm btn-icon" data-menu aria-haspopup="menu" aria-expanded="false" aria-label="操作 ${esc(u.email)}">${icon('more')}</button>
            <div class="menu" role="menu"><button role="menuitem" data-act="plan" data-id="${u.id}">${icon('crown')}设置会员 / 角色</button><button role="menuitem" data-act="reset" data-id="${u.id}">${icon('key')}重置密码</button>
            ${u.status === 'banned' ? `<button role="menuitem" data-act="unban" data-id="${u.id}">${icon('shield')}解除封禁</button>` : `<button role="menuitem" data-act="ban" data-id="${u.id}">${icon('lock')}封禁账号</button>`}
            <hr><button role="menuitem" class="danger" data-act="delete" data-id="${u.id}">${icon('trash')}删除用户</button></div></div></td></tr>`;
          })
          .join('')}</tbody></table></div>${pager(data.total, data.page, data.size)}`
        : emptyHtml('没有找到用户', '', 'users');
    };
    $('#filter', el).addEventListener('submit', (e) => {
      e.preventDefault();
      Object.assign(state, formValues(e.target), { page: 1 });
      load().catch((err) => toast(err.message, 'error'));
    });
    $('#filter select', el).addEventListener('change', () => $('#filter', el).requestSubmit());
    on(list, '[data-page]', 'click', (_, b) => {
      state.page = Number(b.dataset.page);
      load();
    });
    on(list, '[data-act]', 'click', async (_, b) => {
      const u = users.find((x) => x.id === Number(b.dataset.id));
      const act = b.dataset.act;
      try {
        if (act === 'plan') {
          await modal({
            title: `设置会员 · ${u.email}`,
            body: `<div class="field"><label for="p-level">会员等级</label><select class="select" id="p-level" name="level">${S.plans.map((p) => `<option value="${p.level}" ${p.level === u.plan_level ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>
              <div class="field"><label for="p-days">有效天数</label><input class="input" id="p-days" name="days" type="number" min="0" value="${u.plan_expires ? Math.max(1, Math.ceil((u.plan_expires - Date.now() / 1000) / 86400)) : 0}"><p class="hint">从现在开始计算，0 表示永久</p></div>
              <div class="field"><label for="p-role">角色</label><select class="select" id="p-role" name="role"><option value="user" ${u.role === 'user' ? 'selected' : ''}>普通用户</option><option value="admin" ${u.role === 'admin' ? 'selected' : ''}>管理员</option></select></div>`,
            submit: '保存',
            onSubmit: async (v) => toast((await api(`/admin/users/${u.id}/plan`, { method: 'POST', body: v })).message),
          });
        } else if (act === 'reset') {
          const result = await modal({
            title: `重置密码 · ${u.email}`,
            body: `<div class="field"><label for="r-pass">新密码</label><input class="input" id="r-pass" name="password" placeholder="留空则自动生成随机密码" autocomplete="new-password"></div>
              <label class="check"><input type="checkbox" name="notify" ${S.site.mailReady ? 'checked' : 'disabled'}>通过邮件将新密码发送给用户</label>`,
            submit: '重置',
            onSubmit: (v) => api(`/admin/users/${u.id}/reset-password`, { method: 'POST', body: v }),
          });
          if (result?.password) {
            await modal({ title: '密码已重置', body: `<p>${esc(result.message)}，新密码：</p><div class="code-box">${esc(result.password)}</div>`, submit: '复制并关闭', cancel: '', onSubmit: () => copyText(result.password) });
          }
        } else if (act === 'ban') {
          await modal({
            title: `封禁账号 · ${u.email}`,
            body: `<div class="field"><label for="b-reason">封禁原因</label><input class="input" id="b-reason" name="reason" placeholder="将展示给用户" maxlength="200"></div>
              <label class="check"><input type="checkbox" name="purge">同时删除该用户全部域名与解析（${u.subdomains} 个域名）</label>`,
            submit: '确认封禁',
            danger: true,
            onSubmit: async (v) => toast((await api(`/admin/users/${u.id}/ban`, { method: 'POST', body: v })).message),
          });
        } else if (act === 'unban') {
          toast((await api(`/admin/users/${u.id}/unban`, { method: 'POST', body: {} })).message);
        } else if (act === 'delete') {
          if (!(await confirmBox(`确定删除用户 <b>${esc(u.email)}</b> 吗？其 ${u.subdomains} 个域名与 ${u.records} 条解析将从 Cloudflare 一并删除，且不可恢复。`, { confirm: '永久删除' }))) return;
          toast((await api(`/admin/users/${u.id}`, { method: 'DELETE' })).message);
        }
        await load();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    $('#new-user', el).onclick = async () => {
      const res = await modal({
        title: '新建用户',
        body: `<div class="field"><label for="n-email">邮箱</label><input class="input" id="n-email" name="email" type="email" required></div>
          <div class="field"><label for="n-pass">密码</label><input class="input" id="n-pass" name="password" placeholder="留空自动生成" autocomplete="new-password"></div>`,
        submit: '创建',
        onSubmit: (v) => api('/admin/users', { method: 'POST', body: v }),
      });
      if (res?.password) {
        await modal({ title: '用户已创建', body: `<p>${esc(res.message)}，初始密码：</p><div class="code-box">${esc(res.password)}</div>`, submit: '复制并关闭', cancel: '', onSubmit: () => copyText(res.password) });
        load();
      }
    };
    await load();
  }

  async function viewAdminPlans(el) {
    const typeChecks = (p) => ALL_TYPES.map((t) => `<label class="check"><input type="checkbox" name="types-${p.level}" value="${t}" ${p.recordTypes.includes(t) ? 'checked' : ''}>${t}</label>`).join('');
    el.innerHTML = `${pageHead('会员套餐', '配置不同等级会员的权益。域名开放等级向上兼容：开放给普通会员的域名，所有等级都可使用。')}
      <form novalidate><div class="grid grid-3">${S.plans
        .map(
          (p) => `<fieldset class="card"><div class="card-head"><legend style="float:left;font-weight:600">${tierBadge(p.level)} 等级 ${p.level}</legend></div><div class="card-body stack">
        <div class="field"><label for="n${p.level}">名称</label><input class="input" id="n${p.level}" name="name-${p.level}" value="${esc(p.name)}" maxlength="20"></div>
        <div class="field"><label for="pr${p.level}">价格展示</label><input class="input" id="pr${p.level}" name="price-${p.level}" value="${esc(p.priceText)}" maxlength="40" placeholder="如 ¥19.9 / 年"></div>
        <div class="field"><label for="d${p.level}">简介</label><input class="input" id="d${p.level}" name="desc-${p.level}" value="${esc(p.description)}" maxlength="120"></div>
        <div class="grid grid-2"><div class="field"><label for="ms${p.level}">域名数量</label><input class="input" id="ms${p.level}" type="number" min="0" name="maxSub-${p.level}" value="${p.maxSubdomains}"></div>
        <div class="field"><label for="mr${p.level}">每域名记录数</label><input class="input" id="mr${p.level}" type="number" min="0" name="maxRec-${p.level}" value="${p.maxRecords}"></div></div>
        <div class="field"><label for="mp${p.level}">前缀最短长度</label><input class="input" id="mp${p.level}" type="number" min="1" max="63" name="minLen-${p.level}" value="${p.minPrefixLen}"><p class="hint">与域名自身的长度限制取较严格者</p></div>
        <div class="field"><span class="label">允许的记录类型</span><div class="row" style="gap:12px">${typeChecks(p)}</div></div>
        <label class="switch"><input type="checkbox" name="proxy-${p.level}" ${p.allowProxy ? 'checked' : ''}><span>允许开启 CDN 代理</span></label>
      </div></fieldset>`,
        )
        .join('')}</div><div class="mt-16"><button class="btn btn-primary" type="submit">保存全部套餐</button></div></form>`;
    submitHandler($('form', el), async (v) => {
      const plans = S.plans.map((p) => ({
        level: p.level,
        name: v[`name-${p.level}`],
        priceText: v[`price-${p.level}`],
        description: v[`desc-${p.level}`],
        maxSubdomains: Number(v[`maxSub-${p.level}`]),
        maxRecords: Number(v[`maxRec-${p.level}`]),
        minPrefixLen: Number(v[`minLen-${p.level}`]),
        recordTypes: v[`types-${p.level}`] || [],
        allowProxy: !!v[`proxy-${p.level}`],
      }));
      const res = await api('/admin/plans', { method: 'PUT', body: { plans } });
      S.plans = res.plans;
      toast(res.message);
    });
  }

  async function viewAdminCodes(el, { alive }) {
    const state = { q: '', filter: '', page: 1 };
    el.innerHTML = `${pageHead('兑换码', '生成会员兑换码，可控制等级、时长、使用次数、面值与有效期', `<button class="btn btn-primary" id="gen">${icon('plus')}生成兑换码</button>`)}
      <div class="card"><div class="card-head card-head-tabs"><div class="tabs" role="tablist" aria-label="按状态筛选">${[['', '全部'], ['available', '可用'], ['used', '已使用'], ['disabled', '已停用']].map(([k, l]) => `<button type="button" role="tab" data-filter="${k}" class="${k === '' ? 'active' : ''}" aria-selected="${k === ''}">${l}</button>`).join('')}</div>
        <form class="row" id="search" role="search"><input class="input" name="q" placeholder="兑换码 / 批次 / 备注" style="width:220px" aria-label="搜索兑换码"><button class="btn btn-icon" type="submit" aria-label="搜索">${icon('search')}</button></form></div>
      <div id="list">${loadingHtml()}</div></div>`;
    const list = $('#list', el);
    let codes = [];
    const load = async () => {
      const data = await api(`/admin/codes?${new URLSearchParams(state)}`);
      if (!alive()) return;
      codes = data.codes;
      const nowTs = Date.now() / 1000;
      list.innerHTML = codes.length
        ? `<div class="table-wrap"><table><thead><tr><th>兑换码</th><th>等级</th><th>时长</th><th>使用</th><th>面值</th><th>有效期至</th><th>状态</th><th>批次 / 备注</th><th class="actions"><span class="sr-only">操作</span></th></tr></thead><tbody>
        ${codes
          .map((c) => {
            const expired = c.expires_at && c.expires_at < nowTs;
            const status = !c.enabled ? '<span class="badge">已停用</span>' : expired ? '<span class="badge badge-warning">已过期</span>' : c.used_count >= c.max_uses ? '<span class="badge badge-info">已用完</span>' : '<span class="badge badge-success">可用</span>';
            return `<tr><td><button class="btn btn-ghost btn-sm mono" style="margin-left:-10px" data-copy="${esc(c.code)}" title="点击复制">${esc(c.code)}</button></td><td>${tierBadge(c.plan_level)}</td><td>${c.days ? `${c.days} 天` : '永久'}</td>
          <td>${c.used_count} / ${c.max_uses}</td><td>¥${Number(c.price).toFixed(2)}</td><td class="muted small">${c.expires_at ? fmtDate(c.expires_at, false) : '长期'}</td><td>${status}</td>
          <td class="small"><div class="mono muted">${esc(c.batch)}</div>${esc(c.note)}</td>
          <td class="actions"><button class="btn btn-sm" data-toggle="${c.id}">${c.enabled ? '停用' : '启用'}</button>${c.used_count === 0 ? `<button class="btn btn-sm btn-danger" data-del="${c.id}" aria-label="删除">${icon('trash')}</button>` : ''}</td></tr>`;
          })
          .join('')}</tbody></table></div>${pager(data.total, data.page, data.size)}`
        : emptyHtml('暂无兑换码', '点击右上角生成兑换码', 'ticket');
    };
    on(el, '[data-filter]', 'click', (_, b) => {
      $$('[data-filter]', el).forEach((x) => {
        x.classList.toggle('active', x === b);
        x.setAttribute('aria-selected', String(x === b));
      });
      Object.assign(state, { filter: b.dataset.filter, page: 1 });
      load().catch((err) => toast(err.message, 'error'));
    });
    $('#search', el).addEventListener('submit', (e) => {
      e.preventDefault();
      Object.assign(state, { q: e.target.q.value, page: 1 });
      load();
    });
    on(list, '[data-page]', 'click', (_, b) => {
      state.page = Number(b.dataset.page);
      load();
    });
    on(list, '[data-copy]', 'click', (_, b) => copyText(b.dataset.copy));
    on(list, '[data-toggle]', 'click', (_, b) =>
      withBusy(b, async () => {
        toast((await api(`/admin/codes/${b.dataset.toggle}/toggle`, { method: 'POST', body: {} })).message);
        await load();
      }),
    );
    on(list, '[data-del]', 'click', async (_, b) => {
      if (!(await confirmBox('确定删除该兑换码吗？'))) return;
      await withBusy(b, async () => {
        toast((await api(`/admin/codes/${b.dataset.del}`, { method: 'DELETE' })).message);
        await load();
      });
    });
    $('#gen', el).onclick = async () => {
      const res = await modal({
        title: '生成兑换码',
        body: `<div class="grid grid-2"><div class="field"><label for="g-level">会员等级</label><select class="select" id="g-level" name="planLevel">${S.plans.filter((p) => p.level > 0).map((p) => `<option value="${p.level}">${esc(p.name)}</option>`).join('')}</select></div>
          <div class="field"><label for="g-days">会员时长</label><select class="select" id="g-days" name="days"><option value="30">30 天（月卡）</option><option value="90">90 天（季卡）</option><option value="365" selected>365 天（年卡）</option><option value="0">永久</option><option value="custom">自定义…</option></select></div></div>
          <div class="field" id="custom-days" style="display:none"><label for="g-cdays">自定义天数</label><input class="input" id="g-cdays" name="customDays" type="number" min="1" value="7"></div>
          <div class="grid grid-2"><div class="field"><label for="g-count">生成数量</label><input class="input" id="g-count" name="count" type="number" min="1" max="200" value="10"></div>
          <div class="field"><label for="g-uses">每码可用次数</label><input class="input" id="g-uses" name="maxUses" type="number" min="1" value="1"><p class="hint">大于 1 即为通用优惠码</p></div></div>
          <div class="grid grid-2"><div class="field"><label for="g-price">面值（元）</label><input class="input" id="g-price" name="price" type="number" min="0" step="0.01" value="0"><p class="hint">用于统计收入</p></div>
          <div class="field"><label for="g-valid">兑换码有效期（天）</label><input class="input" id="g-valid" name="validDays" type="number" min="0" value="0"><p class="hint">0 表示长期有效</p></div></div>
          <div class="grid grid-2"><div class="field"><label for="g-prefix">前缀（可选）</label><input class="input mono" id="g-prefix" name="prefix" maxlength="8" placeholder="如 VIP"></div>
          <div class="field"><label for="g-note">备注</label><input class="input" id="g-note" name="note" maxlength="100" placeholder="如 双十一活动"></div></div>`,
        submit: '生成',
        onOpen: (form) => form.days.addEventListener('change', () => ($('#custom-days', form).style.display = form.days.value === 'custom' ? '' : 'none')),
        onSubmit: (v) => api('/admin/codes', { method: 'POST', body: { ...v, days: v.days === 'custom' ? Number(v.customDays) : Number(v.days) } }),
      });
      if (!res?.codes) return;
      const text = res.codes.join('\n');
      await modal({
        title: `${res.message}（批次 ${res.batch}）`,
        body: `<textarea class="textarea mono" rows="10" readonly aria-label="兑换码列表">${esc(text)}</textarea>`,
        submit: '复制全部',
        cancel: '关闭',
        onOpen: (form) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn';
          btn.innerHTML = `${icon('download')}下载 TXT`;
          btn.onclick = () => downloadText(`cfshare-codes-${res.batch}.txt`, text);
          $('.modal-foot', form).prepend(btn);
        },
        onSubmit: () => copyText(text).then(() => false),
      });
      load();
    };
    await load();
  }

  async function viewAdminTokens(el, { alive }) {
    el.innerHTML = `${pageHead('Cloudflare API Token', '支持添加多个 Token（可来自不同 Cloudflare 账号），域名会自动同步并标注所属账号', `<button class="btn btn-primary" id="add">${icon('plus')}添加 Token</button>`)}<div id="list">${loadingHtml()}</div>`;
    const list = $('#list', el);
    let tokens = [];
    const load = async () => {
      const data = await api('/admin/tokens');
      if (!alive()) return;
      tokens = data.tokens;
      list.innerHTML = tokens.length
        ? `<div class="grid grid-2">${tokens
            .map(
              (t) => `<div class="card"><div class="card-head"><div class="row"><h3>${esc(t.name)}</h3>${t.status === 'active' ? '<span class="badge badge-success">正常</span>' : '<span class="badge badge-danger">失效</span>'}</div>
          <div class="row"><button class="btn btn-sm" data-verify="${t.id}">${icon('refresh')}验证并同步</button>
          <div class="dropdown"><button class="btn btn-sm btn-icon" data-menu aria-haspopup="menu" aria-expanded="false" aria-label="更多操作">${icon('more')}</button><div class="menu" role="menu"><button role="menuitem" data-rename="${t.id}">${icon('edit')}重命名</button><button role="menuitem" class="danger" data-del="${t.id}">${icon('trash')}删除</button></div></div></div></div>
          <div class="card-body"><dl class="kv">
            <dt>Cloudflare 用户</dt><dd>${t.cfUserEmail ? `${esc(t.cfUserEmail)}<div class="small muted mono">ID: ${esc(t.cfUserId)}</div>` : '<span class="muted small">Token 未授予 User Details 读取权限</span>'}</dd>
            <dt>所属账户</dt><dd>${t.accounts.length ? t.accounts.map((a) => `<div>${esc(a.name)}<div class="small muted mono">ID: ${esc(a.id)}</div></div>`).join('') : '<span class="muted small">未授予 Account 读取权限</span>'}</dd>
            <dt>Token</dt><dd class="mono small">${esc(t.hint)}<div class="muted">ID: ${esc(t.cfTokenId)}</div></dd>
            <dt>域名数量</dt><dd>${t.domainCount} 个 <a href="#/admin/domains" class="small">管理</a></dd>
            <dt>过期时间</dt><dd>${t.expiresOn ? esc(t.expiresOn.slice(0, 10)) : '永不过期'}</dd>
            <dt>最后验证</dt><dd class="muted">${fmtRelative(t.lastCheckedAt)}</dd></dl></div></div>`,
            )
            .join('')}</div>`
        : `<div class="card">${emptyHtml('尚未添加 Token', '添加 Cloudflare API Token 后即可同步域名', 'key', `<button class="btn btn-primary" id="add2">${icon('plus')}添加 Token</button>`)}</div>`;
      $('#add2', list)?.addEventListener('click', addToken);
    };
    const addToken = async () => {
      let verified = null;
      const ok = await modal({
        title: '添加 Cloudflare API Token',
        wide: true,
        body: `<div class="alert alert-info">${icon('alert')}<div>前往 <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" rel="noopener noreferrer">Cloudflare 控制台 → API 令牌</a> 创建令牌，选择「编辑区域 DNS」模板，并额外添加权限：<b>区域 → 区域 → 读取</b>、<b>用户 → 用户详细信息 → 读取</b>、<b>账户 → 账户设置 → 读取</b>（后两项用于显示用户与账户信息）。</div></div>
          <div class="field"><label for="t-name">备注名称（可选）</label><input class="input" id="t-name" name="name" maxlength="40" placeholder="默认使用账户名称"></div>
          <div class="field"><label for="t-token">API Token</label><div class="input-group"><input class="input mono" id="t-token" name="token" type="password" autocomplete="off" required><button type="button" class="btn" id="t-verify">验证</button></div></div>
          <div id="t-info"></div>`,
        submit: '确认添加',
        onOpen: (form) => {
          const submit = $('button[type=submit]', form);
          submit.disabled = true;
          form.token.addEventListener('input', () => {
            verified = null;
            submit.disabled = true;
            $('#t-info', form).innerHTML = '';
          });
          $('#t-verify', form).onclick = (e) =>
            withBusy(e.currentTarget, async () => {
              const { info } = await api('/admin/tokens/preview', { method: 'POST', body: { token: form.token.value } });
              verified = info;
              submit.disabled = false;
              $('#t-info', form).innerHTML = `<div class="card card-pad" style="background:var(--success-soft);border-color:#bbf7d0"><div class="row" style="margin-bottom:10px">${icon('checkCircle', 'check-ok')}<b>Token 有效</b></div><dl class="kv">
                <dt>用户</dt><dd>${info.user ? `${esc(info.user.email)}<div class="small muted mono">ID: ${esc(info.user.id)}</div>` : '<span class="muted">无权限读取</span>'}</dd>
                <dt>账户</dt><dd>${info.accounts.length ? info.accounts.map((a) => `<div>${esc(a.name)} <span class="small muted mono">ID: ${esc(a.id)}</span></div>`).join('') : '<span class="muted">无权限读取</span>'}</dd>
                <dt>Token ID</dt><dd class="mono small">${esc(info.tokenId)}</dd><dt>过期时间</dt><dd>${info.expiresOn ? esc(info.expiresOn) : '永不过期'}</dd></dl></div>`;
            });
        },
        onSubmit: async (v) => {
          if (!verified) throw new Error('请先验证 Token');
          const res = await api('/admin/tokens', { method: 'POST', body: v });
          toast(res.message);
        },
      });
      if (ok) load();
    };
    $('#add', el).onclick = addToken;
    on(list, '[data-verify]', 'click', (_, b) =>
      withBusy(b, async () => {
        try {
          toast((await api(`/admin/tokens/${b.dataset.verify}/verify`, { method: 'POST', body: {} })).message);
        } finally {
          await load();
        }
      }),
    );
    on(list, '[data-rename]', 'click', async (_, b) => {
      const t = tokens.find((x) => x.id === Number(b.dataset.rename));
      const ok = await modal({
        title: '重命名 Token',
        body: `<div class="field"><label for="rn">名称</label><input class="input" id="rn" name="name" value="${esc(t.name)}" maxlength="40" required></div>`,
        submit: '保存',
        onSubmit: (v) => api(`/admin/tokens/${t.id}`, { method: 'PUT', body: v }),
      });
      if (ok) load();
    });
    on(list, '[data-del]', 'click', async (_, b) => {
      const t = tokens.find((x) => x.id === Number(b.dataset.del));
      if (!(await confirmBox(`确定删除 Token「${esc(t.name)}」吗？其下 ${t.domainCount} 个域名将从平台移除（不会影响 Cloudflare 上的数据）。`))) return;
      try {
        toast((await api(`/admin/tokens/${t.id}`, { method: 'DELETE' })).message);
        load();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    await load();
  }

  const domainAccountKey = (d) => d.account_id || `token-${d.token_id}`;
  let selectedDomainAccount = '';

  async function viewAdminDomains(el, { alive }) {
    el.innerHTML = `${pageHead('域名管理', '域名默认不开放。开放等级向上兼容：设为「普通会员」则所有会员可用，设为「高级会员」则高级与特级可用。', `<button class="btn" id="sync">${icon('refresh')}从 Cloudflare 同步</button>`)}
      <div class="card"><div class="card-head">
        <select class="select" id="account" style="flex:1 1 320px;width:auto;min-width:0;max-width:640px" aria-label="Cloudflare 账号"><option value="">全部账号</option></select>
        <div class="row" style="margin-left:auto;flex-wrap:nowrap"><span class="muted small" id="count" aria-live="polite" style="white-space:nowrap"></span>
        <input class="input" id="filter" type="search" placeholder="筛选域名" style="width:200px" aria-label="筛选域名"></div></div><div id="list">${loadingHtml()}</div></div>`;
    const list = $('#list', el);
    const accountSelect = $('#account', el);
    let domains = [];
    let defaults = { min: 3, max: 32 };
    const drawAccounts = () => {
      const accounts = new Map();
      for (const d of domains) {
        const key = domainAccountKey(d);
        const entry = accounts.get(key) || { key, name: d.account_name || d.token_name || '未知账号', email: d.cf_user_email, total: 0 };
        entry.total++;
        accounts.set(key, entry);
      }
      if (selectedDomainAccount && !accounts.has(selectedDomainAccount)) selectedDomainAccount = '';
      accountSelect.innerHTML = `<option value="">全部账号（${domains.length}）</option>${[...accounts.values()]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((a) => `<option value="${esc(a.key)}" ${a.key === selectedDomainAccount ? 'selected' : ''}>${esc(a.name)}${a.email ? ` · ${esc(a.email)}` : ''}（${a.total}）</option>`)
        .join('')}`;
      accountSelect.disabled = accounts.size === 0;
    };
    const updateCount = (scope) => {
      $('#count', el).textContent = `共 ${scope.length} 个，已开放 ${scope.filter((d) => d.enabled).length} 个`;
    };
    const draw = () => {
      const f = $('#filter', el).value.trim().toLowerCase();
      const scope = selectedDomainAccount ? domains.filter((d) => domainAccountKey(d) === selectedDomainAccount) : domains;
      const shown = scope.filter((d) => !f || d.name.includes(f));
      updateCount(scope);
      list.innerHTML = shown.length
        ? `<div class="table-wrap"><table><thead><tr><th>域名</th><th>开放</th><th>最低等级</th><th>前缀长度</th><th>备注</th><th class="actions"><span class="sr-only">保存</span></th></tr></thead><tbody>
        ${shown
          .map(
            (d) => `<tr data-row="${d.id}"><td><div class="mono" style="font-weight:600">${esc(d.name)}</div><div class="small muted">${esc(d.account_name || '—')} · ${esc(d.token_name || 'Token 已删除')}${d.cf_user_email ? ` · ${esc(d.cf_user_email)}` : ''}</div>
          <div class="row small" style="gap:6px;margin-top:2px">${d.zone_status === 'active' ? '' : `<span class="badge badge-warning">${esc(d.zone_status)}</span>`}${d.token_status === 'active' ? '' : '<span class="badge badge-danger">Token 失效</span>'}<span class="muted">${d.subdomain_count} 个用户域名</span></div></td>
          <td><label class="switch"><input type="checkbox" name="enabled" ${d.enabled ? 'checked' : ''} aria-label="开放 ${esc(d.name)}"></label></td>
          <td><select class="select" name="minLevel" style="min-width:120px" aria-label="最低等级">${S.plans.map((p) => `<option value="${p.level}" ${p.level === d.min_level ? 'selected' : ''}>${esc(p.name)}${p.level < 2 ? '及以上' : '专属'}</option>`).join('')}</select></td>
          <td><div class="row" style="flex-wrap:nowrap;gap:6px"><input class="input" name="minLen" type="number" min="1" max="63" value="${d.min_len ?? ''}" placeholder="${defaults.min}" style="width:70px" aria-label="最短"><span class="muted">-</span><input class="input" name="maxLen" type="number" min="1" max="63" value="${d.max_len ?? ''}" placeholder="${defaults.max}" style="width:70px" aria-label="最长"></div></td>
          <td><input class="input" name="note" value="${esc(d.note)}" maxlength="60" placeholder="展示给用户" style="min-width:140px" aria-label="备注"></td>
          <td class="actions"><button class="btn btn-sm btn-primary" data-save="${d.id}">保存</button></td></tr>`,
          )
          .join('')}</tbody></table></div>`
        : emptyHtml(domains.length ? '没有匹配的域名' : '暂无域名', domains.length ? '' : '请先添加 Cloudflare API Token，域名会自动同步', 'server', domains.length ? '' : '<a class="btn btn-primary" href="#/admin/tokens">添加 Token</a>');
    };
    const load = async () => {
      const data = await api('/admin/domains');
      if (!alive()) return;
      domains = data.domains;
      defaults = data.defaults;
      drawAccounts();
      draw();
    };
    accountSelect.addEventListener('change', () => {
      selectedDomainAccount = accountSelect.value;
      draw();
    });
    $('#filter', el).addEventListener('input', draw);
    $('#sync', el).onclick = (e) =>
      withBusy(e.currentTarget, async () => {
        toast((await api('/admin/domains/sync', { method: 'POST', body: {} })).message);
        await load();
      });
    on(list, '[data-save]', 'click', (_, b) =>
      withBusy(b, async () => {
        const row = b.closest('tr');
        const v = {
          enabled: $('[name=enabled]', row).checked,
          minLevel: Number($('[name=minLevel]', row).value),
          minLen: $('[name=minLen]', row).value,
          maxLen: $('[name=maxLen]', row).value,
          note: $('[name=note]', row).value,
        };
        toast((await api(`/admin/domains/${b.dataset.save}`, { method: 'PUT', body: v })).message);
        const d = domains.find((x) => x.id === Number(b.dataset.save));
        Object.assign(d, { enabled: v.enabled ? 1 : 0, min_level: v.minLevel, min_len: v.minLen ? Number(v.minLen) : null, max_len: v.maxLen ? Number(v.maxLen) : null, note: v.note });
        updateCount(selectedDomainAccount ? domains.filter((x) => domainAccountKey(x) === selectedDomainAccount) : domains);
      }),
    );
    await load();
  }

  async function viewAdminSubdomains(el, { alive }) {
    const state = { q: '', page: 1 };
    el.innerHTML = `${pageHead('用户域名', '查看与回收所有用户申请的二级域名')}
      <div class="card"><div class="card-head"><form class="row" id="search" role="search"><input class="input" name="q" placeholder="搜索域名或邮箱" style="width:260px" aria-label="搜索"><button class="btn" type="submit">${icon('search')}搜索</button></form></div><div id="list">${loadingHtml()}</div></div>`;
    const list = $('#list', el);
    let items = [];
    const load = async () => {
      const data = await api(`/admin/subdomains?${new URLSearchParams(state)}`);
      if (!alive()) return;
      items = data.subdomains;
      list.innerHTML = items.length
        ? `<div class="table-wrap"><table><thead><tr><th>域名</th><th>所有者</th><th>记录</th><th>申请时间</th><th class="actions"><span class="sr-only">操作</span></th></tr></thead><tbody>
        ${items.map((s) => `<tr><td><a class="mono" href="#/domain/${s.id}" style="font-weight:600">${esc(s.fqdn)}</a></td><td>${esc(s.email || '已删除用户')}</td><td>${s.record_count}</td><td class="muted small">${fmtDate(s.created_at)}</td>
          <td class="actions"><a class="btn btn-sm" href="#/domain/${s.id}">解析</a><button class="btn btn-sm btn-danger" data-del="${s.id}">回收</button></td></tr>`).join('')}</tbody></table></div>${pager(data.total, data.page, data.size)}`
        : emptyHtml('暂无用户域名', '', 'list');
    };
    $('#search', el).addEventListener('submit', (e) => {
      e.preventDefault();
      Object.assign(state, { q: e.target.q.value, page: 1 });
      load();
    });
    on(list, '[data-page]', 'click', (_, b) => {
      state.page = Number(b.dataset.page);
      load();
    });
    on(list, '[data-del]', 'click', async (_, b) => {
      const s = items.find((x) => x.id === Number(b.dataset.del));
      if (!(await confirmBox(`确定回收 <b class="mono">${esc(s.fqdn)}</b> 吗？其 ${s.record_count} 条解析将从 Cloudflare 删除。`, { confirm: '回收' }))) return;
      await withBusy(b, async () => {
        toast((await api(`/admin/subdomains/${s.id}`, { method: 'DELETE' })).message);
        await load();
      });
    });
    await load();
  }

  async function viewAdminMail(el, { alive }) {
    el.innerHTML = `${pageHead('邮箱收件', '仅在打开本页时连接 IMAP 读取最新邮件，结果缓存 60 秒；离开页面即停止，不会后台轮询。', `<button class="btn" id="refresh">${icon('refresh')}刷新</button>`)}<div class="card" id="box">${loadingHtml()}</div>`;
    const box = $('#box', el);
    if (!S.site.mailReady) {
      box.innerHTML = emptyHtml('尚未配置邮箱', '请先在系统设置中填写 Gmail 邮箱与应用专用密码', 'mail', '<a class="btn btn-primary" href="#/admin/settings">去设置</a>');
      $('#refresh', el).remove();
      return;
    }
    let messages = [];
    const load = async (force = false) => {
      box.innerHTML = loadingHtml();
      const data = await api(`/admin/mail?limit=20${force ? '&refresh=1' : ''}`);
      if (!alive()) return;
      messages = data.messages;
      box.innerHTML = `<div class="card-head"><h2>收件箱</h2><span class="muted small">共 ${data.total} 封 · ${data.cached ? '缓存' : '实时'}读取于 ${fmtRelative(data.fetchedAt)}</span></div>
        ${messages.length ? messages.map((m) => `<button type="button" class="mail-item ${m.seen ? '' : 'unread'}" data-uid="${m.uid}"><span class="dot" aria-hidden="true"></span><div class="grow"><div class="row between"><span class="truncate small muted" style="max-width:60%">${esc(m.from)}</span><span class="small muted">${esc((m.date || '').slice(0, 17))}</span></div><div class="subj truncate">${esc(m.subject)}</div></div></button>`).join('') : emptyHtml('收件箱为空', '', 'mail')}`;
    };
    $('#refresh', el).onclick = (e) => withBusy(e.currentTarget, () => load(true));
    on(box, '[data-uid]', 'click', async (_, b) => {
      b.classList.remove('unread');
      const overlayBody = `<div id="mail-body">${loadingHtml()}</div>`;
      modal({
        title: messages.find((m) => m.uid === Number(b.dataset.uid))?.subject || '邮件',
        body: overlayBody,
        wide: true,
        submit: '',
        cancel: '关闭',
        onOpen: async (form) => {
          try {
            const { message: m } = await api(`/admin/mail/${b.dataset.uid}`);
            const target = $('#mail-body', form);
            if (!target) return;
            target.innerHTML = `<dl class="kv" style="margin-bottom:12px"><dt>发件人</dt><dd>${esc(m.from)}</dd><dt>收件人</dt><dd>${esc(m.to)}</dd><dt>时间</dt><dd>${esc(m.date)}</dd></dl>
              ${m.html ? '<iframe class="mail-frame" sandbox title="邮件内容"></iframe>' : `<pre class="code-box" style="white-space:pre-wrap;max-height:50vh;overflow:auto">${esc(m.text || '（无正文）')}</pre>`}`;
            if (m.html) $('iframe', target).srcdoc = m.html;
          } catch (err) {
            const target = $('#mail-body', form);
            if (target) target.innerHTML = `<div class="alert alert-danger">${icon('alert')}<div>${esc(err.message)}</div></div>`;
          }
        },
      });
    });
    try {
      await load();
    } catch (err) {
      box.innerHTML = `<div class="card-body"><div class="alert alert-danger">${icon('alert')}<div>${esc(err.message)}</div></div></div>`;
    }
  }

  async function viewAdminSettings(el, { alive }) {
    el.innerHTML = loadingHtml();
    const { settings: s } = await api('/admin/settings');
    if (!alive()) return;
    const field = (name, label, attrs = '', hint = '') => `<div class="field"><label for="s-${name}">${label}</label><input class="input" id="s-${name}" name="${name}" value="${esc(s[name])}" ${attrs}>${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
    el.innerHTML = `${pageHead('系统设置')}
      <div class="tabs" role="tablist">${[['site', '基本设置'], ['mail', '邮箱配置'], ['rules', '域名规则']].map(([k, l], i) => `<button type="button" role="tab" data-tab="${k}" class="${i === 0 ? 'active' : ''}" aria-selected="${i === 0}">${l}</button>`).join('')}</div>
      <form class="card" data-panel="site" novalidate><div class="card-body stack">
        ${field('site_name', '站点名称', 'maxlength="40"')}${field('site_desc', '站点简介', 'maxlength="100"')}
        <div class="field"><label for="s-ann">公告</label><textarea class="textarea" id="s-ann" name="announcement" maxlength="2000" placeholder="显示在用户概览页顶部，留空不显示">${esc(s.announcement)}</textarea></div>
        <label class="switch"><input type="checkbox" name="allow_register" ${s.allow_register === '1' ? 'checked' : ''}><span>开放用户注册</span></label>
        <div class="field"><label for="s-contact">购买说明</label><textarea class="textarea" id="s-contact" name="contact" maxlength="500" placeholder="如：添加微信 xxx 购买兑换码，年卡 19.9 元">${esc(s.contact)}</textarea><p class="hint">展示在会员升级页</p></div>
        ${field('purchase_url', '购买链接（可选）', 'type="url" placeholder="https://"', '如发卡网 / 店铺地址')}
        <div><button class="btn btn-primary" type="submit">保存</button></div></div></form>
      <form class="card" data-panel="mail" hidden novalidate><div class="card-body stack">
        <div class="alert alert-info">${icon('alert')}<div>仅需填写 Gmail 地址与应用专用密码，其余保持默认即可。<br>1. 开启 <a href="https://myaccount.google.com/signinoptions/twosv" target="_blank" rel="noopener noreferrer">两步验证</a>　2. 创建 <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">应用专用密码</a>　3. 确认已启用 <a href="https://mail.google.com/mail/u/0/#settings/fwdandpop" target="_blank" rel="noopener noreferrer">IMAP</a></div></div>
        ${field('mail_user', 'Gmail 邮箱', 'type="email" placeholder="you@gmail.com" autocomplete="off"')}
        <div class="field"><label for="s-pass">应用专用密码</label><input class="input mono" id="s-pass" name="mail_pass" type="password" autocomplete="new-password" placeholder="${s.mail_pass_set ? '已设置，留空则不修改' : '16 位应用专用密码'}"><p class="hint">使用 APP_SECRET 加密存储，空格会自动去除</p></div>
        ${field('mail_from_name', '发件人名称', 'maxlength="40" placeholder="默认使用站点名称"')}
        <details><summary>高级设置（SMTP / IMAP 服务器）</summary><div class="grid grid-2 mt-16">
          ${field('smtp_host', 'SMTP 服务器')}${field('smtp_port', 'SMTP 端口', 'type="number"', '465 为 SSL，587 为 STARTTLS')}
          ${field('imap_host', 'IMAP 服务器')}${field('imap_port', 'IMAP 端口', 'type="number"')}</div></details>
        <div class="row"><button class="btn btn-primary" type="submit">保存</button><span class="grow"></span>
          <input class="input" id="test-to" type="email" placeholder="测试收件邮箱（默认自己）" style="max-width:240px" aria-label="测试收件邮箱"><button class="btn" type="button" id="test-mail">${icon('mail')}发送测试邮件</button></div></div></form>
      <form class="card" data-panel="rules" hidden novalidate><div class="card-body stack">
        <div class="grid grid-2">${field('prefix_min', '默认最短前缀', 'type="number" min="1" max="63"')}${field('prefix_max', '默认最长前缀', 'type="number" min="1" max="63"')}</div>
        <p class="hint">可在域名管理中为单个域名覆盖；会员套餐中的「前缀最短长度」会与之取较严格者。</p>
        <div class="field"><label for="s-res">保留前缀</label><textarea class="textarea mono" id="s-res" name="reserved_prefixes" rows="5">${esc(s.reserved_prefixes)}</textarea><p class="hint">逗号或换行分隔，普通用户无法申请（管理员不受限）</p></div>
        <div><button class="btn btn-primary" type="submit">保存</button></div></div></form>`;
    on(el, '[data-tab]', 'click', (_, b) => {
      $$('[data-tab]', el).forEach((x) => {
        x.classList.toggle('active', x === b);
        x.setAttribute('aria-selected', String(x === b));
      });
      $$('[data-panel]', el).forEach((p) => (p.hidden = p.dataset.panel !== b.dataset.tab));
    });
    $$('form[data-panel]', el).forEach((form) =>
      submitHandler(form, async (v) => {
        if ('allow_register' in v) v.allow_register = v.allow_register ? '1' : '0';
        const res = await api('/admin/settings', { method: 'PUT', body: v });
        toast(res.message);
        if (form.mail_pass) form.mail_pass.value = '';
        await bootstrap();
        $('.brand .truncate') && ($('.brand .truncate').textContent = S.site.name);
      }),
    );
    $('#test-mail', el).onclick = (e) =>
      withBusy(e.currentTarget, async () => {
        toast((await api('/admin/settings/test-mail', { method: 'POST', body: { to: $('#test-to', el).value } })).message);
      });
  }

  async function viewAdminLogs(el, { alive }) {
    const state = { q: '', page: 1 };
    el.innerHTML = `${pageHead('操作日志', '保留最近 90 天的关键操作记录')}
      <div class="card"><div class="card-head"><form class="row" id="search" role="search"><input class="input" name="q" placeholder="搜索操作 / 用户 / IP" style="width:260px" aria-label="搜索日志"><button class="btn" type="submit">${icon('search')}搜索</button></form></div><div id="list">${loadingHtml()}</div></div>`;
    const list = $('#list', el);
    const load = async () => {
      const data = await api(`/admin/logs?${new URLSearchParams(state)}`);
      if (!alive()) return;
      list.innerHTML = data.logs.length
        ? `<div class="table-wrap"><table><thead><tr><th>时间</th><th>用户</th><th>操作</th><th>详情</th><th>IP</th></tr></thead><tbody>
        ${data.logs.map((l) => `<tr><td class="small muted" style="white-space:nowrap">${fmtDate(l.created_at)}</td><td class="small">${esc(l.email || '—')}</td><td><span class="badge">${esc(ACTION_LABELS[l.action] || l.action)}</span></td><td class="small" style="max-width:360px;word-break:break-all">${esc(l.detail)}</td><td class="mono small muted">${esc(l.ip || '')}</td></tr>`).join('')}</tbody></table></div>${pager(data.total, data.page, data.size)}`
        : emptyHtml('暂无日志', '', 'file');
    };
    $('#search', el).addEventListener('submit', (e) => {
      e.preventDefault();
      Object.assign(state, { q: e.target.q.value, page: 1 });
      load();
    });
    on(list, '[data-page]', 'click', (_, b) => {
      state.page = Number(b.dataset.page);
      load();
    });
    await load();
  }

  /* ================= 启动 ================= */

  route('/setup', viewSetup, { title: '初始化' });
  route('/login', viewLogin, { guest: true, title: '登录' });
  route('/register', viewRegister, { guest: true, title: '注册' });
  route('/forgot', viewForgot, { guest: true, title: '重置密码' });
  route('/', viewHome, { auth: true, title: '概览' });
  route('/domains', viewDomains, { auth: true, title: '我的域名' });
  route('/apply', viewApply, { auth: true, title: '申请域名' });
  route('/domain/:id', viewDomainDetail, { auth: true, title: '解析管理' });
  route('/upgrade', viewUpgrade, { auth: true, title: '会员升级' });
  route('/account', viewAccount, { auth: true, title: '账户设置' });
  route('/admin', viewAdminHome, { auth: true, admin: true, title: '控制台' });
  route('/admin/users', viewAdminUsers, { auth: true, admin: true, title: '用户管理' });
  route('/admin/plans', viewAdminPlans, { auth: true, admin: true, title: '会员套餐' });
  route('/admin/codes', viewAdminCodes, { auth: true, admin: true, title: '兑换码' });
  route('/admin/tokens', viewAdminTokens, { auth: true, admin: true, title: 'API Token' });
  route('/admin/domains', viewAdminDomains, { auth: true, admin: true, title: '域名管理' });
  route('/admin/subdomains', viewAdminSubdomains, { auth: true, admin: true, title: '用户域名' });
  route('/admin/mail', viewAdminMail, { auth: true, admin: true, title: '邮箱收件' });
  route('/admin/settings', viewAdminSettings, { auth: true, admin: true, title: '系统设置' });
  route('/admin/logs', viewAdminLogs, { auth: true, admin: true, title: '操作日志' });

  window.addEventListener('hashchange', render);

  bootstrap()
    .then(render)
    .catch((err) => {
      $('#app').innerHTML = `<div class="auth-wrap"><div class="card auth-card">${errorHtml(`系统加载失败：${err.message}`)}<button class="btn btn-block mt-16" onclick="location.reload()">重试</button></div></div>`;
    });
})();
