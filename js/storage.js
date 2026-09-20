import { CONFIG } from './data.js';
function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const recordsKey = `${CONFIG.appKey}_records`;
const sessionKey = `${CONFIG.appKey}_session`;

function mergeRecords(current, incoming) {
  const map = new Map(current.map(item => [item.id, item]));
  incoming.forEach(item => map.set(item.id, { ...map.get(item.id), ...item }));
  return [...map.values()];
}

export function getRecords() {
  return readJson(recordsKey, []);
}

export function saveRecords(records) {
  writeJson(recordsKey, records);
}

export function upsertRecord(record) {
  const records = getRecords();
  const index = records.findIndex(item => item.id === record.id);
  if (index === -1) records.unshift(record);
  else records[index] = { ...records[index], ...record };
  saveRecords(records);
  return records;
}

export function removeRecord(id) {
  const records = getRecords().filter(item => item.id !== id);
  saveRecords(records);
  return records;
}

export function getDraft() { return readJson(CONFIG.draftKey, null); }
export function saveDraft(draft) { writeJson(CONFIG.draftKey, draft); }
export function clearDraft() { localStorage.removeItem(CONFIG.draftKey); }

export function getDeleteQueue() { return readJson(CONFIG.deleteQueueKey, []); }
export function queueDelete(id) {
  const queue = getDeleteQueue();
  if (!queue.includes(id)) queue.push(id);
  writeJson(CONFIG.deleteQueueKey, queue);
}
export function dequeueDelete(id) {
  writeJson(CONFIG.deleteQueueKey, getDeleteQueue().filter(item => item !== id));
}

export function getSession() { return readJson(sessionKey, null); }
export function saveSession(session) {
  if (!session?.access_token || !session?.refresh_token) return;
  writeJson(sessionKey, {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    user: session.user ?? null
  });
}
export function clearSession() { localStorage.removeItem(sessionKey); }

function sequenceFromRecords(records) {
  const year = new Date().getFullYear();
  return records.reduce((max, record) => {
    const match = String(record?.letter_number || '').match(new RegExp(`^PAIC-${year}-(\\d+)$`));
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
}

export function syncSequence(records = []) {
  const stored = Number(localStorage.getItem(CONFIG.sequenceKey) || 0);
  const detected = sequenceFromRecords(records);
  const current = Number.isFinite(stored) ? stored : 0;
  const nextBase = Math.max(current, detected);
  localStorage.setItem(CONFIG.sequenceKey, String(nextBase));
  return nextBase;
}

export function nextLetterNumber() {
  const next = syncSequence(getRecords()) + 1;
  localStorage.setItem(CONFIG.sequenceKey, String(next));
  return `PAIC-${new Date().getFullYear()}-${String(next).padStart(4, '0')}`;
}

export function migrateLegacyStorage() {
  const existing = getRecords();
  if (existing.length) return existing;
  const legacy = CONFIG.legacyKeys.flatMap(key => readJson(`${key}_records`, []) || []);
  if (!legacy.length) return [];
  const migrated = mergeRecords([], legacy);
  saveRecords(migrated);
  syncSequence(migrated);
  return migrated;
}
