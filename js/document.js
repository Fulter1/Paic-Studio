import {TEMPLATES} from './templates.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
export const blank=()=>({id:'',number:'',template:'classic',size:'a4',recipient:'',recipientName:'',eventName:'',date:new Date().toISOString().slice(0,10),extraParam:'',value:'',message:'',prName:'',prContact:'',prEmail:'',digitalStamp:true,createdAt:'',updatedAt:''});
export const defaults=v=>({...blank(),...v});
export const validate=r=>{const e=[];if(!r.recipient.trim())e.push('الجهة');if(!r.eventName.trim())e.push('الموضوع');if(!r.date)e.push('التاريخ');if(!r.message.trim())e.push('نص الخطاب');if(r.prEmail&&!/^\S+@\S+\.\S+$/.test(r.prEmail))e.push('البريد الإلكتروني');return e};
export const plainText=r=>[`جامعة الطائف — كلية الحاسبات وتقنية المعلومات`,`نادي البرمجة والذكاء الاصطناعي`,`رقم الخطاب: ${r.number||'—'}`,`التاريخ: ${r.date||'—'}`,`الجهة: ${r.recipient||'—'}`,r.recipientName&&`عناية: ${r.recipientName}`,`الموضوع: ${r.eventName||'—'}`,'',r.message,r.extraParam&&`نوع الخطاب: ${r.extraParam}`,r.value&&`القيمة / الدعم: ${r.value}`,'',r.prName&&`مسؤول العلاقات العامة: ${r.prName}`,r.prContact&&`التواصل: ${r.prContact}`,r.prEmail&&`البريد: ${r.prEmail}`].filter(Boolean).join('\n');
export function paper(r){
 const t=TEMPLATES[r.template]||TEMPLATES.classic; const square=r.size==='square';
 const message=r.message?.trim()||'نص الخطاب سيظهر هنا بعد إدخاله من المحرر.';
 const lines=esc(message).replace(/\n/g,'<br>');
 const details=(r.extraParam||r.value)?`<div class="paper-details">${r.extraParam?`<span><b>نوع الخطاب</b>${esc(r.extraParam)}</span>`:''}${r.value?`<span><b>القيمة / الدعم</b>${esc(r.value)}</span>`:''}</div>`:'';
 const recipient=esc(r.recipient||'الجهة المستهدفة');
 return `<div class="paper paper-${r.template} ${square?'paper-square':''}" style="--paper-accent:${t.accent};--paper-ink:${t.ink};--paper-bg:${t.paper}">
  <div class="paper-deco paper-deco-a"></div><div class="paper-deco paper-deco-b"></div><div class="paper-top-accent"></div>
  <div class="paper-watermark">PAIC</div>
  <header class="paper-header">
   <div class="paper-org"><img src="assets/logo-university.svg" alt="جامعة الطائف"><span>جامعة الطائف<br><b>كلية الحاسبات وتقنية المعلومات</b></span></div>
   <div class="paper-club"><img src="assets/logo-club.svg" alt="نادي البرمجة والذكاء الاصطناعي"><span>نادي البرمجة<br><b>والذكاء الاصطناعي</b></span></div>
  </header>
  <div class="paper-rule"></div>
  <div class="paper-meta"><span>رقم الخطاب <b>${esc(r.number||'—')}</b></span><span>التاريخ <b>${esc(r.date||'—')}</b></span></div>
  <main>
   <div class="paper-recipient"><span>السادة /</span> <b>${recipient}</b>${r.recipientName?`<small>عناية / ${esc(r.recipientName)}</small>`:''}</div>
   <div class="paper-greeting">السلام عليكم ورحمة الله وبركاته، وبعد،</div>
   <div class="paper-subject-label">الموضوع</div><h1>${esc(r.eventName||'عنوان الخطاب الرسمي')}</h1>
   <div class="paper-divider"></div>
   <div class="paper-message">${lines}</div>
   ${details}
   <div class="paper-closing">وتفضلوا بقبول خالص التحية والتقدير.</div>
  </main>
  <footer>
   <div class="sign"><span class="stamp ${r.digitalStamp?'':'hidden'}"><b>PAIC</b><small>OFFICIAL</small></span><div><b>${esc(r.prName||'مسؤول العلاقات العامة')}</b><small>${esc(r.prContact||'')} ${r.prEmail?` · ${esc(r.prEmail)}`:''}</small></div></div>
   <div class="paper-footer-note">نادي البرمجة والذكاء الاصطناعي<br><span>جامعة الطائف · كلية الحاسبات وتقنية المعلومات</span></div>
  </footer>
 </div>`;
}
