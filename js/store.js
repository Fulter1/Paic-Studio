import {CONFIG} from './config.js';
const safeRead=(key,fallback)=>{try{const v=localStorage.getItem(key);return v===null?fallback:JSON.parse(v)}catch{return fallback}};
const safeWrite=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
const uid=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`;
export const store={
 records(){const v=safeRead(CONFIG.storage.records,[]);return Array.isArray(v)?v:[]},
 saveRecords(v){return safeWrite(CONFIG.storage.records,v)},
 draft(){return safeRead(CONFIG.storage.draft,null)},
 saveDraft(v){return safeWrite(CONFIG.storage.draft,v)},
 clearDraft(){localStorage.removeItem(CONFIG.storage.draft)},
 theme(){return localStorage.getItem(CONFIG.storage.theme)||'system'},
 setTheme(v){localStorage.setItem(CONFIG.storage.theme,v)},
 snippets(){const custom=safeRead(CONFIG.storage.snippets,{});return custom&&typeof custom==='object'?custom:{}},
 saveSnippets(v){return safeWrite(CONFIG.storage.snippets,v)},
 newId:uid
};
