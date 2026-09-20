const CAMEL_TO_SNAKE = value => value.replace(/[A-Z]/g, char => `_${char.toLowerCase()}`);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export const FIELD_IDS = Object.freeze([
  'recipient', 'recipientName', 'date', 'eventName', 'extraParam', 'value',
  'message', 'prName', 'prContact', 'prEmail'
]);

export function readFields(getValue) {
  return Object.fromEntries(FIELD_IDS.map(id => [id, getValue(id)]));
}

export function resolveText(text, getValue) {
  const replacements = {
    '[اسم الجهة]': getValue('recipient') || 'اسم الجهة',
    '[اسم المسؤول]': getValue('recipientName') || 'المسؤول المختص',
    '[التاريخ]': formatDate(getValue('date')) || 'التاريخ',
    '[اسم الفعالية/المبادرة]': getValue('eventName') || 'الفعالية / المبادرة',
    '[نوع/شكل الرعاية أو المساهمة]': getValue('extraParam') || 'نوع الرعاية أو المساهمة',
    '[نوع/شكل الرعاية]': getValue('extraParam') || 'نوع الرعاية',
    '[مجال الشراكة]': getValue('extraParam') || 'مجال الشراكة',
    '[طبيعة المشاركة]': getValue('extraParam') || 'طبيعة المشاركة',
    '[سبب التكريم]': getValue('extraParam') || 'سبب التكريم',
    '[القيمة إن وجدت]': getValue('value') || 'القيمة',
    '[القيمة]': getValue('value') || 'القيمة'
  };

  return Object.entries(replacements).reduce(
    (result, [token, replacement]) => result.replaceAll(token, replacement),
    String(text || '')
  );
}

export function getRecordValue(record, field) {
  return record?.[field] ?? record?.[CAMEL_TO_SNAKE(field)] ?? '';
}

export function buildRecord(state, getValue, ownerId) {
  return {
    id: state.id || createId(),
    owner_id: ownerId || '',
    letter_number: state.number || '',
    template: state.template,
    size: state.size,
    recipient: getValue('recipient').trim(),
    recipient_name: getValue('recipientName').trim(),
    date: getValue('date'),
    event_name: getValue('eventName').trim(),
    extra_param: getValue('extraParam').trim(),
    value: getValue('value').trim(),
    message: getValue('message').trim(),
    pr_name: getValue('prName').trim(),
    pr_contact: getValue('prContact').trim(),
    pr_email: getValue('prEmail').trim(),
    digital_stamp: document.querySelector('#digitalStamp')?.checked !== false,
    updated_at: new Date().toISOString()
  };
}

export function validateRecord(record) {
  if (!record.recipient || !record.date || !record.event_name || !record.message) {
    return 'أكمل الجهة والتاريخ والفعالية ونص الخطاب';
  }
  if (record.message.length > 12000) return 'نص الخطاب طويل جدًا';
  if (record.pr_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.pr_email)) {
    return 'تحقق من البريد الإلكتروني';
  }
  return '';
}

export function buildPaper(record, content) {
  const template = content.templates[record.template] || content.templates.sponsorship;
  const resolvedMessage = resolveText(record.message, field => getRecordValue(record, field));
  const paragraphs = resolvedMessage
    .split(/\n\s*\n+/)
    .filter(Boolean)
    .map(paragraph => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`)
    .join('');

  const recipient = escapeHtml(record.recipient || 'اسم الجهة');
  const recipientName = escapeHtml(record.recipient_name);
  const date = escapeHtml(formatDate(record.date) || 'التاريخ');
  const number = escapeHtml(record.letter_number || '—');
  const event = escapeHtml(record.event_name || 'اسم الفعالية / المبادرة');
  const extra = escapeHtml(record.extra_param || template.defaultExtra);
  const value = escapeHtml(record.value);
  const contact = escapeHtml(record.pr_contact);
  const email = escapeHtml(record.pr_email);
  const prName = escapeHtml(record.pr_name || 'قسم العلاقات العامة');

  return `<div class="document ${template.tone}">
    <div class="document-shape shape-one"></div>
    <div class="document-shape shape-two"></div>
    <div class="document-topline"><span>جامعة الطائف</span><span>كلية الحاسبات وتقنية المعلومات</span><span>PAIC</span></div>
    <header class="document-header">
      <img src="assets/logo-university.svg" alt="جامعة الطائف">
      <div class="document-number"><small>PAIC · DOCUMENT</small><strong>${number}</strong><span>${date}</span></div>
      <img src="assets/logo-club.svg" alt="نادي البرمجة والذكاء الاصطناعي">
    </header>
    <div class="document-accent"></div>
    <div class="document-recipient"><span>إلى</span><strong>${recipient}</strong>${recipientName ? `<em>${recipientName}</em>` : ''}</div>
    <div class="document-title"><small>${escapeHtml(template.english)}</small><h1>${escapeHtml(template.name)}</h1><strong>${event}</strong></div>
    <div class="document-content">${paragraphs}</div>
    <div class="document-details"><div><small>${escapeHtml(template.label)}</small><strong>${extra}</strong></div>${value ? `<div><small>القيمة</small><strong>${value}</strong></div>` : ''}</div>
    <footer class="document-footer"><div><strong>${prName}</strong>${contact ? `<span>${contact}</span>` : ''}${email ? `<span>${email}</span>` : ''}</div>${record.digital_stamp !== false ? `<div class="document-stamp"><span>PAIC</span><strong>${number}</strong><small>DIGITAL</small></div>` : ''}</footer>
  </div>`;
}

export function copyText(record) {
  return resolveText(record.message, field => getRecordValue(record, field));
}
