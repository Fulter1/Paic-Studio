import { CONFIG } from './data.js';
import { clearSession, getSession, saveSession } from './storage.js';

let session = null;
let authPromise = null;

const authBase = () => `${CONFIG.supabase.url}/auth/v1`;
const restBase = () => `${CONFIG.supabase.url}/rest/v1/${CONFIG.supabase.table}`;

async function request(url, options = {}, timeout = CONFIG.requestTimeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const baseHeaders = extra => ({ apikey: CONFIG.supabase.key, ...extra });

export function getUserId() {
  return session?.user?.id || '';
}

async function validateStoredSession(stored) {
  try {
    const response = await request(`${authBase()}/user`, {
      headers: baseHeaders({ Authorization: `Bearer ${stored.access_token}` })
    });
    if (!response.ok) return false;
    const user = await response.json();
    session = { ...stored, user };
    saveSession(session);
    return true;
  } catch {
    return false;
  }
}

async function refreshStoredSession(refreshToken) {
  try {
    const response = await request(`${authBase()}/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: baseHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (!response.ok) return false;
    session = await response.json();
    saveSession(session);
    return Boolean(session?.access_token && session?.user?.id);
  } catch {
    return false;
  }
}

async function createAnonymousSession() {
  const response = await request(`${authBase()}/signup`, {
    method: 'POST',
    headers: baseHeaders({ 'Content-Type': 'application/json' }),
    body: '{}'
  });
  if (!response.ok) throw new Error('ANONYMOUS_AUTH_DISABLED');
  session = await response.json();
  if (!session?.access_token || !session?.user?.id) throw new Error('INVALID_AUTH_SESSION');
  saveSession(session);
  return session;
}

export async function authenticate() {
  if (session?.access_token && session?.user?.id) return session;
  if (authPromise) return authPromise;

  authPromise = (async () => {
    const stored = getSession();
    if (stored?.access_token) {
      if (await validateStoredSession(stored)) return session;
      if (stored.refresh_token && await refreshStoredSession(stored.refresh_token)) return session;
      clearSession();
    }
    return createAnonymousSession();
  })();

  try {
    return await authPromise;
  } finally {
    authPromise = null;
  }
}

export async function requestCloud(path = '', options = {}, allowAuthRetry = true) {
  await authenticate();
  if (!session?.access_token) throw new Error('NO_SESSION');

  const headers = {
    apikey: CONFIG.supabase.key,
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await request(`${restBase()}${path}`, { ...options, headers });

  if (response.status === 401 && allowAuthRetry) {
    session = null;
    clearSession();
    await authenticate();
    return requestCloud(path, options, false);
  }

  if (!response.ok) {
    const error = new Error(`SUPABASE_${response.status}`);
    error.status = response.status;
    throw error;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : [];
}
