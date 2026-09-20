import { CONFIG, PAIC_CONTENT } from './data.js';
import { FIELD_IDS, buildPaper, buildRecord, copyText, validateRecord } from './document.js';
import { authenticate, getUserId, requestCloud } from './cloud.js';
import { clearDraft, dequeueDelete, getDeleteQueue, getDraft, getRecords, migrateLegacyStorage, nextLetterNumber, queueDelete, removeRecord, saveDraft, saveRecords, syncSequence, upsertRecord } from './storage.js';


const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function isValidEmail(value) { return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function todayRiyadh() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function createUI({ getState, getValue, content, callbacks }) {
  let toastTimer;
  const toast = message => {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  };
  const setCloudStatus = (label, type = 'ok') => {
    const el = $('#saveStatus');
    el.innerHTML = `<i class="${type}"></i><span>${escapeHtml(label)}</span>`;
  };
  const renderTemplates = () => {
    const state = getState();
    const numbers = { sponsorship: '01', partnership: '02', invitation: '03', thanks: '04' };
    $('#templateGrid').innerHTML = Object.entries(content.templates).map(([key, template]) => `
      <button type="button" class="template-card ${key === state.template ? 'active' : ''}" data-template="${key}">
        <span class="template-index ${template.tone}">${numbers[key]}</span>
        <span class="template-copy"><strong>${escapeHtml(template.name)}</strong><small>${escapeHtml(template.desc)}</small></span>
        <span class="template-arrow">↗</span>
      </button>`).join('');
    $$('.template-card').forEach(button => button.addEventListener('click', () => callbacks.changeTemplate(button.dataset.template)));
  };
  const renderSteps = () => {
    const current = getState().step;
    $$('.step').forEach(step => step.classList.toggle('active', Number(step.dataset.step) === current));
    $$('.editor-pane').forEach(pane => pane.classList.toggle('active', Number(pane.dataset.pane) === current));
    $('#previousStep').hidden = current === 1;
    $('#nextStep').innerHTML = current === 3 ? 'حفظ <span>↗</span>' : 'التالي <span>←</span>';
  };
  const renderSize = () => {
    const size = getState().size;
    $$('[data-size]').forEach(button => button.classList.toggle('active', button.dataset.size === size));
  };
  const renderMeta = () => {
    const state = getState();
    const template = content.templates[state.template];
    $('#previewMeta').textContent = `${state.size === 'a4' ? 'A4' : 'مربع'} · ${template.name}`;
    $('#extraLabel').textContent = template.label;
  };
  const applyZoom = () => {
    const state = getState();
    const paper = $('#paper');
    const frame = $('#paperFrame');
    if (!paper || !frame) return;
    state.zoom = clamp(state.zoom, CONFIG.zoom.min, CONFIG.zoom.max);
    const height = state.size === 'a4' ? CONFIG.paper.a4Height : CONFIG.paper.squareHeight;
    paper.style.transform = `scale(${state.zoom})`;
    frame.style.width = `${CONFIG.paper.width * state.zoom}px`;
    frame.style.height = `${height * state.zoom}px`;
    $('#zoomValue').textContent = `${Math.round(state.zoom * 100)}%`;
  };
  const fitPreview = () => {
    const state = getState();
    const stage = $('#paperStage');
    if (!stage) return;
    const height = state.size === 'a4' ? CONFIG.paper.a4Height : CONFIG.paper.squareHeight;
    const horizontalPadding = window.innerWidth <= 650 ? 20 : 56;
    const verticalPadding = window.innerWidth <= 650 ? 24 : 54;
    const widthRatio = Math.max(220, stage.clientWidth - horizontalPadding) / CONFIG.paper.width;
    const heightRatio = Math.max(260, stage.clientHeight - verticalPadding) / height;
    state.zoom = clamp(Math.min(widthRatio, heightRatio, 1), CONFIG.zoom.min, CONFIG.zoom.max);
    applyZoom();
  };
  const renderPaper = html => {
    const state = getState();
    const paper = $('#paper');
    paper.className = `paper paper-${state.size}`;
    paper.innerHTML = html;
    renderMeta();
    applyZoom();
  };
  const setTheme = theme => {
    document.body.classList.toggle('light', theme === 'light');
    localStorage.setItem(CONFIG.themeKey, theme);
  };
  const scrollToSection = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const bind = () => {
    if (localStorage.getItem(CONFIG.themeKey) === 'light') setTheme('light');
    $$('.step').forEach(button => button.addEventListener('click', () => callbacks.setStep(Number(button.dataset.step))));
    $$('[data-size]').forEach(button => button.addEventListener('click', () => callbacks.changeSize(button.dataset.size)));
    $('#nextStep').addEventListener('click', callbacks.nextStep);
    $('#previousStep').addEventListener('click', () => callbacks.setStep(getState().step - 1));
    $('#saveButton').addEventListener('click', callbacks.save);
    $('#newButton').addEventListener('click', callbacks.newLetter);
    $('#heroCreate').addEventListener('click', callbacks.newLetter);
    $('#heroLibrary').addEventListener('click', () => scrollToSection('library'));
    $('#copyButton').addEventListener('click', callbacks.copy);
    $('#printButton').addEventListener('click', callbacks.print);
    $('#pdfButton').addEventListener('click', callbacks.print);
    $('#zoomIn').addEventListener('click', () => { getState().zoom += 0.05; applyZoom(); });
    $('#zoomOut').addEventListener('click', () => { getState().zoom -= 0.05; applyZoom(); });
    $('#fitButton').addEventListener('click', fitPreview);
    $('#themeButton').addEventListener('click', () => setTheme(document.body.classList.contains('light') ? 'dark' : 'light'));
    $('#librarySearch').addEventListener('input', callbacks.renderLibrary);
    $('#refreshButton').addEventListener('click', callbacks.refreshCloud);
    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => fitPreview(), 120); });
    window.addEventListener('hashchange', callbacks.updateNavigation);
  };
  return { bind, renderTemplates, renderSteps, renderSize, renderMeta, renderPaper, applyZoom, fitPreview, setCloudStatus, toast, scrollToSection };
}

const content = PAIC_CONTENT;
const state = {
  template: 'sponsorship', size: 'a4', step: 1, zoom: CONFIG.zoom.default,
  id: null, number: null, records: [], saving: false
};

const value = id => $(`#${id}`)?.value || '';
const setValue = (id, valueToSet) => { const element = $(`#${id}`); if (element) element.value = valueToSet ?? ''; };

const ui = createUI({
  getState: () => state,
  getValue: value,
  setValue,
  content,
  callbacks: {
    changeTemplate,
    changeSize,
    setStep,
    nextStep,
    save,
    newLetter,
    copy: copyLetter,
    print: printLetter,
    renderLibrary,
    refreshCloud: loadCloud,
    updateNavigation
  }
});

function fillDefaults() {
  if (!value('date')) setValue('date', todayRiyadh());
  const template = content.templates[state.template];
  if (!value('message')) setValue('message', state.template === 'sponsorship' ? content.sponsorshipText : content.defaults[state.template]);
  if (!value('extraParam')) setValue('extraParam', template.defaultExtra);
  $('#extraLabel').textContent = template.label;
}

function currentRecord() {
  return buildRecord(state, value, getUserId());
}

function render() {
  ui.renderTemplates();
  ui.renderSteps();
  ui.renderSize();
  ui.renderMeta();
  ui.renderPaper(buildPaper(currentRecord(), content));
}

function persistDraft() {
  saveDraft(currentRecord());
}

function nextStep() {
  if (state.step < 3) {
    setStep(state.step + 1);
    return;
  }
  save();
}

function setStep(step) {
  state.step = Math.max(1, Math.min(3, step));
  ui.renderSteps();
}

function changeTemplate(template) {
  if (!content.templates[template]) return;
  state.template = template;
  setValue('message', '');
  setValue('extraParam', '');
  fillDefaults();
  render();
  persistDraft();
}

function changeSize(size) {
  if (!['a4', 'square'].includes(size)) return;
  state.size = size;
  ui.renderSize();
  ui.renderPaper(buildPaper(currentRecord(), content));
  persistDraft();
}

function updateNavigation() {
  const hash = location.hash.replace('#', '');
  $$('.nav-link').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${hash || 'home'}`));
}

function newLetter() {
  state.id = null;
  state.number = nextLetterNumber();
  state.template = 'sponsorship';
  state.size = 'a4';
  FIELD_IDS.forEach(id => setValue(id, ''));
  setValue('prName', 'قسم العلاقات العامة');
  $('#digitalStamp').checked = true;
  fillDefaults();
  setStep(1);
  render();
  persistDraft();
  ui.scrollToSection('create');
}

function restoreDraft() {
  const draft = getDraft();
  if (!draft?.id || !draft?.letter_number) return false;
  state.id = draft.id;
  state.number = draft.letter_number;
  state.template = content.templates[draft.template] ? draft.template : 'sponsorship';
  state.size = draft.size === 'square' ? 'square' : 'a4';
  FIELD_IDS.forEach(id => setValue(id, draft[id] ?? ''));
  $('#digitalStamp').checked = draft.digital_stamp !== false;
  return true;
}

function validateBeforeSave(record) {
  const error = validateRecord(record);
  if (error) {
    ui.toast(error);
    if (!record.message) setStep(3);
    else if (!record.recipient || !record.date || !record.event_name) setStep(2);
    else if (!isValidEmail(record.pr_email)) setStep(3);
    return false;
  }
  return true;
}

async function save() {
  if (state.saving) return;

  const draftRecord = currentRecord();
  if (!validateBeforeSave(draftRecord)) return;

  state.saving = true;
  let record = draftRecord;

  try {
    ui.setCloudStatus('جاري الحفظ', 'busy');
    try {
      await authenticate();
      record = currentRecord();
    } catch {
      record = draftRecord;
    }

    upsertRecord(record);
    state.id = record.id;
    state.number = record.letter_number;
    state.records = getRecords();
    renderLibrary();

    if (!record.owner_id) {
      ui.setCloudStatus('محفوظ محليًا', 'warn');
      ui.toast('تم حفظ الخطاب محليًا');
      return;
    }

    try {
      await requestCloud(`?on_conflict=id`, {
        method: 'POST',
        headers: { Prefer: 'return=minimal,resolution=merge-duplicates' },
        body: JSON.stringify(record)
      });
      clearDraft();
      ui.setCloudStatus('متزامن مع السحابة', 'ok');
      ui.toast('تم حفظ الخطاب بنجاح');
    } catch {
      ui.setCloudStatus('محفوظ محليًا', 'warn');
      ui.toast('حُفظ محليًا — ستتم المزامنة عند توفر السحابة');
    }
  } finally {
    state.saving = false;
  }
}
function renderLibrary() {
  const query = value('librarySearch').trim().toLocaleLowerCase('ar');
  const records = state.records
    .filter(record => `${record.recipient} ${record.letter_number} ${record.event_name}`.toLocaleLowerCase('ar').includes(query))
    .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));

  $('#recordsList').innerHTML = records.length ? records.map(record => `
    <article class="record-card">
      <div class="record-main"><span class="record-number">${escapeRecord(record.letter_number)}</span><strong>${escapeRecord(record.recipient || 'بدون جهة')}</strong><small>${escapeRecord(record.event_name || '')}</small></div>
      <div class="record-actions"><button class="button button-secondary" type="button" data-open="${escapeRecord(record.id)}">فتح</button><button class="button button-danger" type="button" data-delete="${escapeRecord(record.id)}">حذف</button></div>
    </article>`).join('') : `
    <div class="empty-state"><strong>${query ? 'لا توجد نتائج' : 'لا توجد خطابات محفوظة'}</strong><span>${query ? 'جرّب كلمة بحث أخرى.' : 'ابدأ بإنشاء خطابك الأول.'}</span></div>`;

  $$('[data-open]').forEach(button => button.addEventListener('click', () => openRecord(button.dataset.open)));
  $$('[data-delete]').forEach(button => button.addEventListener('click', () => deleteRecord(button.dataset.delete)));
}

function escapeRecord(valueToEscape) {
  return String(valueToEscape ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function openRecord(id) {
  const record = state.records.find(item => item.id === id);
  if (!record) return;
  state.id = record.id;
  state.number = record.letter_number;
  state.template = content.templates[record.template] ? record.template : 'sponsorship';
  state.size = record.size === 'square' ? 'square' : 'a4';
  FIELD_IDS.forEach(id => setValue(id, record[id] ?? ''));
  $('#digitalStamp').checked = record.digital_stamp !== false;
  setStep(2);
  render();
  location.hash = 'create';
  ui.scrollToSection('create');
  ui.toast('تم فتح الخطاب');
}

async function deleteRecord(id) {
  queueDelete(id);
  state.records = removeRecord(id);
  renderLibrary();
  try {
    await requestCloud(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
    dequeueDelete(id);
    ui.toast('تم حذف الخطاب');
  } catch {
    ui.toast('تم حذفه من هذا الجهاز وستتم المزامنة لاحقًا');
  }
}

async function flushDeleteQueue() {
  for (const id of getDeleteQueue()) {
    try {
      await requestCloud(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
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
    const remote = await requestCloud('?select=*&order=updated_at.desc');
    const deleted = new Set(getDeleteQueue());
    const local = getRecords();
    const merged = new Map();
    [...local, ...remote].forEach(record => { if (!deleted.has(record.id)) merged.set(record.id, record); });
    state.records = [...merged.values()];
    syncSequence(state.records);
    saveRecords(state.records);
    ui.setCloudStatus('السحابة متصلة', 'ok');
    renderLibrary();
  } catch {
    state.records = getRecords();
    ui.setCloudStatus('محلي', 'warn');
    renderLibrary();
  }
}

async function copyLetter() {
  const text = copyText(currentRecord());
  try {
    await navigator.clipboard.writeText(text);
    ui.toast('تم نسخ نص الخطاب');
  } catch {
    ui.toast('تعذر النسخ من المتصفح');
  }
}

function printLetter() {
  document.body.classList.add(`printing-${state.size}`);
  const cleanup = () => document.body.classList.remove(`printing-${state.size}`);
  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
  setTimeout(cleanup, 5000);
}

function bindFields() {
  FIELD_IDS.forEach(id => {
    const element = $(`#${id}`);
    element?.addEventListener('input', () => {
      ui.renderPaper(buildPaper(currentRecord(), content));
      persistDraft();
    });
  });
  $('#digitalStamp')?.addEventListener('change', () => {
    ui.renderPaper(buildPaper(currentRecord(), content));
    persistDraft();
  });
}

function boot() {
  migrateLegacyStorage();
  state.records = getRecords();
  const restored = restoreDraft();
  if (!restored) newLetter();
  else {
    fillDefaults();
    render();
  }
  bindFields();
  ui.bind();
  updateNavigation();
  renderLibrary();
  requestAnimationFrame(() => ui.fitPreview());
  loadCloud();
}

document.addEventListener('DOMContentLoaded', boot);
