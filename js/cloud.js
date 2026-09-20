import { CONFIG } from './data.js';
import { clearSession, getSession, saveSession } from './storage.js';

let session = null;

function authBase() { return `${CONFIG.supabase.url}/auth/v1`; }
function restBase() { return `${CONFIG.supabase.url}/rest/v1/${CONFIG.supabase.table}`; }

async function request(url, options = {}, timeout = CONFIG.requestTimeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function authHeaders(extra = {}) {
  return { apikey: CONFIG.supabase.key, ...extra };
}

export function getUserId() { return session?.user?.id || ''; }

export async function authenticate() {
  if (session?.access_token) return session;
  const stored = getSession();

  if (stored?.access_token) {
    session = stored;
    try {
      const response = await request(`${authBase()}/user`, { headers: authHeaders({ Authorization: `Bearer ${session.access_token}` }) });
      if (response.ok) {
        session.user = await response.json();
        saveSession(session);
        return session;
      }
    } catch {}

    if (stored.refresh_token) {
      try {
        const response = await request(`${authBase()}/token?grant_type=refresh_token`, {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ refresh_token: stored.refresh_token })
        });
        if (response.ok) {
          session = await response.json();
          saveSession(session);
          return session;
        }
      } catch {}
    }
    clearSession();
    session = null;
  }

  const response = await request(`${authBase()}/signup`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: '{}'
  });
  if (!response.ok) throw new Error('تعذر إنشاء جلسة مجهولة');
  session = await response.json();
  saveSession(session);
  return session;
}

export async function requestCloud(path = '', options = {}, allowAuthRetry = true) {
  await authenticate();
  if (!session?.access_token) throw new Error('لا توجد جلسة سحابية');

  const headers = {
    apikey: CONFIG.supabase.key,
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await request(`${restBase()}${path}`, { ...options, headers });

  if (response.status === 401 && allowAuthRetry) {
    clearSession();
    session = null;
    await authenticate();
    return requestCloud(path, options, false);
  }

  if (!response.ok) throw new Error(await response.text());
  const text = await response.text();
  return text ? JSON.parse(text) : [];
}
