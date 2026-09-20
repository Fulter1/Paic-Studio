import {CONFIG} from './config.js';
const read=(key,fallback)=>{try{const v=localStorage.getItem(key);return v===null?fallback:JSON.parse(v)}catch{return fallback}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`;
const normalize=r=>({...r,id:r.id||uid(),updatedAt:r.updatedAt||new Date().toISOString(),createdAt:r.createdAt||r.updatedAt||new Date().toISOString()});
function migrate(){if(localStorage.getItem(CONFIG.storage.records))return;const old=read('paic-studio-v2-records',[]);if(Array.isArray(old)&&old.length)write(CONFIG.storage.records,old.map(normalize));const draft=read('paic-studio-v2-draft',null);if(draft)write(CONFIG.storage.draft,draft);const theme=localStorage.getItem('paic-studio-v2-theme');if(theme)localStorage.setItem(CONFIG.storage.theme,theme);const snippets=read('paic-studio-v2-snippets',{});if(Object.keys(snippets).length)write(CONFIG.storage.snippets,snippets)}
migrate();
export const store={
 records(){const r=read(CONFIG.storage.records,[]);return Array.isArray(r)?r.map(normalize):[]},
 saveRecords(v){return write(CONFIG.storage.records,v.map(normalize))},
 draft(){return read(CONFIG.storage.draft,null)},
 saveDraft(v){return write(CONFIG.storage.draft,v)},
 clearDraft(){try{localStorage.removeItem(CONFIG.storage.draft)}catch{}},
 theme(){return localStorage.getItem(CONFIG.storage.theme)||'system'},
 setTheme(v){try{localStorage.setItem(CONFIG.storage.theme,v)}catch{}},
 snippets(){const v=read(CONFIG.storage.snippets,{});return v&&typeof v==='object'?v:{}},
 saveSnippets(v){return write(CONFIG.storage.snippets,v)},
 session(){return read(CONFIG.storage.session,null)},
 saveSession(v){return write(CONFIG.storage.session,v)},
 clearSession(){try{localStorage.removeItem(CONFIG.storage.session)}catch{}},
 newId:uid
};
