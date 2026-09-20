import {CONFIG} from './config.js';
const read=(k,f)=>{try{const x=localStorage.getItem(k);return x===null?f:JSON.parse(x)}catch{return f}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const id=()=>globalThis.crypto?.randomUUID?.()||`p-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const normalize=r=>({...r,id:r?.id||id(),createdAt:r?.createdAt||r?.updatedAt||new Date().toISOString(),updatedAt:r?.updatedAt||new Date().toISOString()});
function migrate(){
 if(localStorage.getItem(CONFIG.storage.records))return;
 let old=[];for(const k of CONFIG.legacy){const x=read(k,null);if(Array.isArray(x)&&x.length){old=x;break}}
 if(old.length)write(CONFIG.storage.records,old.map(normalize));
 for(const kind of ['draft','theme','snippets']){
   const target=CONFIG.storage[kind];if(localStorage.getItem(target))continue;
   for(const prefix of ['v5','v4','v3','v2']){const k=`paic-studio-${prefix}-${kind}`;const raw=localStorage.getItem(k);if(raw!==null){localStorage.setItem(target,raw);break}}
 }
}
migrate();
export const store={
 records(){const x=read(CONFIG.storage.records,[]);return Array.isArray(x)?x.map(normalize):[]},
 saveRecords(x){return write(CONFIG.storage.records,x.map(normalize))},
 draft(){return read(CONFIG.storage.draft,null)}, saveDraft(x){return write(CONFIG.storage.draft,x)}, clearDraft(){try{localStorage.removeItem(CONFIG.storage.draft)}catch{}},
 theme(){return localStorage.getItem(CONFIG.storage.theme)||'system'}, setTheme(x){try{localStorage.setItem(CONFIG.storage.theme,x)}catch{}},
 snippets(){const x=read(CONFIG.storage.snippets,{});return x&&typeof x==='object'?x:{}}, saveSnippets(x){return write(CONFIG.storage.snippets,x)},
 newId:id
};
