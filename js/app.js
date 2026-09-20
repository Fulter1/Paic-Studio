import { CONFIG, PAIC_CONTENT } from './data.js';
import { FIELD_IDS, buildPaper, buildRecord, copyText, getRecordValue, validateRecord } from './document.js';
import { authenticate, getUserId, requestCloud } from './cloud.js';
import {
  clearDraft, dequeueDelete, getDeleteQueue, getDraft, getRecords, migrateLegacyStorage,
  nextLetterNumber, queueDelete, removeRecord, saveDraft, saveRecords, syncSequence, upsertRecord
} from './storage.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const isValidEmail = value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function todayRiyadh() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

function getValue(id) { return $(`#${id}`)?.value || ''; }
function setValue(id, value) { const element = $(`#${id}`); if (element) element.value = value ?? ''; }

const state = {
  template: 'sponsorship',
  size: 'a4',
  step: 1,
  zoom: CONFIG.zoom.default,
  id: null,
  number: null,
  records: [],
  saving: false,
  cloudReady: false
};

function currentRecord() {
  return buildRecord(state, getValue, getUserId());
}

function setCloudStatus(label, type = 'ok') {
  const element = $('#saveStatus');
  if (!element) return;
  element.innerHTML = `<i class="${type}"></i><span>${escapeHtml(label)}</span>`;
}

let toastTimer;
function toast(message) {
  const element = $('#toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 2600);
}

function renderTemplates() {
  const numbers = { sponsorship: '01', partnership: '02', invitation: '03', thanks: '04' };
  $('#templateGrid').innerHTML = Object.entries(PAIC_CONTENT.templates).map(([key, template]) => `
    <button type="button" class="template-card ${key === state.template ? 'active' : ''}" data-template="${key}">
      <span class="template-index ${template.tone}">${numbers[key]}</span>
      <span class="template-copy"><strong>${escapeHtml(template.name)}</strong><small>${escapeHtml(template.desc)}</small></span>
      <span class="template-arrow">↗</span>
    </button>`).join('');

  $$('.template-card').forEach(button => {
    button.addEventListener('click', () => changeTemplate(button.dataset.template));
  });
}

function renderSteps() {
  $$('.step').forEach(step => step.classList.toggle('active', Number(step.dataset.step) === state.step));
  $$('.editor-pane').forEach(pane => pane.classList.toggle('active', Number(pane.dataset.pane) === state.step));
  $('#previousStep').hidden = state.step === 1;
  $('#nextStep').innerHTML = state.step === 3 ? 'حفظ <span>↗</span>' : 'التالي <span>←</span>';
}

function renderSize() {
  $$('[data-size]').forEach(button => button.classList.toggle('active', button.dataset.size === state.size));
}

function renderMeta() {
  const template = PAIC_CONTENT.templates[state.template];
  $('#previewMeta').textContent = `${state.size === 'a4' ? 'A4' : 'مربع'} · ${template.name}`;
  $('#extraLabel').textContent = template.label;
}

function applyZoom() {
  const paper = $('#paper');
  const frame = $('#paperFrame');
  if (!paper || !frame) return;

  state.zoom = clamp(state.zoom, CONFIG.zoom.min, CONFIG.zoom.max);
  const height = state.size === 'a4' ? CONFIG.paper.a4Height : CONFIG.paper.squareHeight;
  paper.style.transform = `scale(${state.zoom})`;
  frame.style.width = `${CONFIG.paper.width * state.zoom}px`;
  frame.style.height = `${height * state.zoom}px`;
  $('#zoomValue').textContent = `${Math.round(state.zoom * 100)}%`;
}

function fitPreview() {
  const stage = $('#paperStage');
  if (!stage) return;

  const height = state.size === 'a4' ? CONFIG.paper.a4Height : CONFIG.paper.squareHeight;
  const padding = window.innerWidth <= 650 ? 28 : 64;
  const widthRatio = Math.max(220, stage.clientWidth - padding) / CONFIG.paper.width;
  const heightRatio = Math.max(260, stage.clientHeight - padding) / height;
  state.zoom = clamp(Math.min(widthRatio, heightRatio, 1), CONFIG.zoom.min, CONFIG.zoom.max);
  applyZoom();
}

function renderPaper() {
  const paper = $('#paper');
  paper.className = `paper paper-${state.size}`;
  paper.innerHTML = buildPaper(currentRecord(), PAIC_CONTENT);
  renderMeta();
  applyZoom();
}

function renderAll() {
  renderTemplates();
  renderSteps();
  renderSize();
  renderPaper();
}

function fillDefaults() {
  const template = PAIC_CONTENT.templates[state.template];
  if (!getValue('date')) setValue('date', todayRiyadh());
  if (!getValue('message')) {
    setValue('message', state.template === 'sponsorship'
      ? PAIC_CONTENT.sponsorshipText
      : PAIC_CONTENT.defaults[state.template]);
  }
  if (!getValue('extraParam')) setValue('extraParam', template.defaultExtra);
}

function persistDraft() {
  saveDraft(currentRecord());
}

function setStep(step) {
  state.step = clamp(Number(step) || 1, 1, 3);
  renderSteps();
}

function changeTemplate(template) {
  if (!PAIC_CONTENT.templates[template]) return;
  state.template = template;
  setValue('message', '');
  setValue('extraParam', '');
  fillDefaults();
  renderAll();
  persistDraft();
}

function changeSize(size) {
  if (!['a4', 'square'].includes(size)) return;
  state.size = size;
  renderSize();
  renderPaper();
  persistDraft();
  requestAnimationFrame(fitPreview);
}

function updateNavigation() {
  const current = location.hash.replace('#', '') || 'home';
  $$('.nav-link').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
}

function newLetter() {
  state.id = null;
  state.number = nextLetterNumber();
  state.template = 'sponsorship';
  state.size = 'a4';
  state.step = 1;
  FIELD_IDS.forEach(id => setValue(id, ''));
  setValue('prName', 'قسم العلاقات العامة');
  $('#digitalStamp').checked = true;
  fillDefaults();
  renderAll();
  persistDraft();
  location.hash = 'create';
  requestAnimationFrame(fitPreview);
}

function restoreDraft() {
  const draft = getDraft();
  if (!draft?.letter_number) return false;

  state.id = draft.id || null;
  state.number = draft.letter_number;
  state.template = PAIC_CONTENT.templates[draft.template] ? draft.template : 'sponsorship';
  state.size = draft.size === 'square' ? 'square' : 'a4';

  FIELD_IDS.forEach(id => setValue(id, getRecordValue(draft, id)));
  $('#digitalStamp').checked = draft.digital_stamp !== false;
  fillDefaults();
  return true;
}

function openRecord(id) {
  const record = state.records.find(item => item.id === id);
  if (!record) return;

  state.id = record.id;
  state.number = record.letter_number;
  state.template = PAIC_CONTENT.templates[record.template] ? record.template : 'sponsorship';
  state.size = record.size === 'square' ? 'square' : 'a4';

  FIELD_IDS.forEach(field => setValue(field, getRecordValue(record, field)));
  $('#digitalStamp').checked = record.digital_stamp !== false;
  fillDefaults();
  setStep(2);
  renderAll();
  persistDraft();
  location.hash = 'create';
  scrollToSection('create');
  toast('تم فتح الخطاب');
  requestAnimationFrame(fitPreview);
}

function validateBeforeSave(record) {
  const error = validateRecord(record);
  if (!error) return true;

  toast(error);
  if (!record.recipient || !record.date || !record.event_name) setStep(2);
  else if (!record.message || !isValidEmail(record.pr_email)) setStep(3);
  return false;
}

function mergeByLatest(local, remote) {
  const deleted = new Set(getDeleteQueue());
  const map = new Map();
  const time = record => Date.parse(record?.updated_at || record?.created_at || 0) || 0;

  for (const record of [...local, ...remote]) {
    if (deleted.has(record.id)) continue;
    const existing = map.get(record.id);
    if (!existing || time(record) >= time(existing)) map.set(record.id, record);
  }
  return [...map.values()].sort((a, b) => time(b) - time(a));
}

async function pushLocalRecords() {
  const userId = getUserId();
  if (!userId) return;

  const local = getRecords().filter(record => !record.owner_id || record.owner_id === userId);
  for (const record of local) {
    const payload = { ...record, owner_id: userId };
    try {
      await requestCloud('?on_conflict=id', {
        method: 'POST',
        headers: { Prefer: 'return=minimal,resolution=merge-duplicates' },
        body: JSON.stringify(payload)
      });
      upsertRecord(payload);
    } catch {
      // Keep the record local. The next sync attempt will retry it.
    }
  }
}

async function save() {
  if (state.saving) return;

  const draftRecord = currentRecord();
  if (!validateBeforeSave(draftRecord)) return;

  state.saving = true;
  try {
    setCloudStatus('جاري الحفظ', 'busy');

    let record = draftRecord;
    try {
      await authenticate();
      record = currentRecord();
    } catch {
      // Local-first mode remains usable when Supabase is unavailable.
    }

    upsertRecord(record);
    state.id = record.id;
    state.number = record.letter_number;
    state.records = getRecords();
    renderLibrary();

    if (!record.owner_id) {
      setCloudStatus('محفوظ محليًا', 'warn');
      toast('تم حفظ الخطاب محليًا');
      return;
    }

    try {
      await requestCloud('?on_conflict=id', {
        method: 'POST',
        headers: { Prefer: 'return=minimal,resolution=merge-duplicates' },
        body: JSON.stringify(record)
      });
      clearDraft();
      state.cloudReady = true;
      setCloudStatus('متزامن مع السحابة', 'ok');
      toast('تم حفظ الخطاب ومزامنته');
    } catch {
      setCloudStatus('محفوظ محليًا', 'warn');
      toast('تم الحفظ محليًا وستتم المزامنة لاحقًا');
    }
  } finally {
    state.saving = false;
  }
}

function renderLibrary() {
  const query = getValue('librarySearch').trim().toLocaleLowerCase('ar');
  const records = [...state.records]
    .filter(record => `${record.recipient || ''} ${record.letter_number || ''} ${record.event_name || ''}`.toLocaleLowerCase('ar').includes(query))
    .sort((a, b) => (Date.parse(b.updated_at || b.created_at || 0) || 0) - (Date.parse(a.updated_at || a.created_at || 0) || 0));

  $('#recordsList').innerHTML = records.length ? records.map(record => `
    <article class="record-card">
      <div class="record-main">
        <span class="record-number">${escapeHtml(record.letter_number)}</span>
        <strong>${escapeHtml(record.recipient || 'بدون جهة')}</strong>
        <small>${escapeHtml(record.event_name || '')}</small>
      </div>
      <div class="record-actions">
        <button class="button button-secondary" type="button" data-open="${escapeHtml(record.id)}">فتح</button>
        <button class="button button-danger" type="button" data-delete="${escapeHtml(record.id)}">حذف</button>
      </div>
    </article>`).join('') : `
      <div class="empty-state"><strong>${query ? 'لا توجد نتائج' : 'لا توجد خطابات محفوظة'}</strong><span>${query ? 'جرّب كلمة بحث أخرى.' : 'ابدأ بإنشاء خطابك الأول.'}</span></div>`;

  $$('[data-open]').forEach(button => button.addEventListener('click', () => openRecord(button.dataset.open)));
  $$('[data-delete]').forEach(button => button.addEventListener('click', () => deleteRecord(button.dataset.delete)));
}

async function deleteRecord(id) {
  const record = state.records.find(item => item.id === id);
  if (!record) return;

  queueDelete(id);
  state.records = removeRecord(id);
  renderLibrary();

  if (!record.owner_id) {
    dequeueDelete(id);
    toast('تم حذف الخطاب');
    return;
  }

  try {
    await requestCloud(`?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    dequeueDelete(id);
    toast('تم حذف الخطاب');
  } catch {
    toast('تم الحذف محليًا وستتم مزامنته لاحقًا');
  }
}

async function flushDeleteQueue() {
  for (const id of [...getDeleteQueue()]) {
    try {
      await requestCloud(`?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
      dequeueDelete(id);
    } catch {
      break;
    }
  }
}

async function loadCloud() {
  try {
    await authenticate();
    await flushDeleteQueue();
    await pushLocalRecords();

    const remote = await requestCloud('?select=*&order=updated_at.desc');
    state.records = mergeByLatest(getRecords(), remote);
    saveRecords(state.records);
    syncSequence(state.records);
    state.cloudReady = true;
    setCloudStatus('السحابة متصلة', 'ok');
    renderLibrary();
  } catch {
    state.cloudReady = false;
    state.records = getRecords();
    setCloudStatus('محفوظ محليًا', 'warn');
    renderLibrary();
  }
}

async function copyLetter() {
  const text = copyText(currentRecord());
  try {
    if (!navigator.clipboard?.writeText) throw new Error();
    await navigator.clipboard.writeText(text);
    toast('تم نسخ نص الخطاب');
  } catch {
    toast('تعذر النسخ من المتصفح');
  }
}

function printLetter() {
  document.body.classList.add(`printing-${state.size}`);
  const cleanup = () => document.body.classList.remove(`printing-${state.size}`);
  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
  setTimeout(cleanup, 5000);
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function bindFields() {
  FIELD_IDS.forEach(id => {
    $(`#${id}`)?.addEventListener('input', () => {
      renderPaper();
      persistDraft();
    });
  });

  $('#digitalStamp')?.addEventListener('change', () => {
    renderPaper();
    persistDraft();
  });
}

function bindUI() {
  $$('.step').forEach(button => button.addEventListener('click', () => setStep(button.dataset.step)));
  $$('[data-size]').forEach(button => button.addEventListener('click', () => changeSize(button.dataset.size)));
  $('#nextStep').addEventListener('click', () => state.step < 3 ? setStep(state.step + 1) : save());
  $('#previousStep').addEventListener('click', () => setStep(state.step - 1));
  $('#saveButton').addEventListener('click', save);
  $('#newButton').addEventListener('click', newLetter);
  $('#heroCreate').addEventListener('click', newLetter);
  $('#heroLibrary').addEventListener('click', () => scrollToSection('library'));
  $('#copyButton').addEventListener('click', copyLetter);
  $('#printButton').addEventListener('click', printLetter);
  $('#pdfButton').addEventListener('click', printLetter);
  $('#zoomIn').addEventListener('click', () => { state.zoom += .05; applyZoom(); });
  $('#zoomOut').addEventListener('click', () => { state.zoom -= .05; applyZoom(); });
  $('#fitButton').addEventListener('click', fitPreview);
  $('#themeButton').addEventListener('click', () => {
    const light = document.body.classList.toggle('light');
    localStorage.setItem(CONFIG.themeKey, light ? 'light' : 'dark');
  });
  $('#librarySearch').addEventListener('input', renderLibrary);
  $('#refreshButton').addEventListener('click', loadCloud);
  $$('.nav-link').forEach(link => link.addEventListener('click', () => setTimeout(updateNavigation, 0)));
  window.addEventListener('hashchange', updateNavigation);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fitPreview, 120);
  });
}

function restoreTheme() {
  const saved = localStorage.getItem(CONFIG.themeKey);
  const preferred = saved || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.body.classList.toggle('light', preferred === 'light');
}

function boot() {
  restoreTheme();
  migrateLegacyStorage();
  state.records = getRecords();

  if (!restoreDraft()) newLetter();
  else renderAll();

  bindFields();
  bindUI();
  updateNavigation();
  renderLibrary();
  requestAnimationFrame(fitPreview);
  loadCloud();
}

document.addEventListener('DOMContentLoaded', boot, { once: true });
