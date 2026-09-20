import {CONFIG} from './data.js';
const read=(k,f)=>{try{const v=localStorage.getItem(k);return v===null?f:JSON.parse(v)}catch{return f}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const now=()=>new Date().toISOString();
export const storage={
 get(){return read(CONFIG.key,[])}, set(v){return write(CONFIG.key,v)}, draft(){return read(CONFIG.draftKey,null)}, saveDraft(v){return write(CONFIG.draftKey,v)}, clearDraft(){localStorage.removeItem(CONFIG.draftKey)},
 nextNumber(){let n=Number(localStorage.getItem(CONFIG.sequenceKey)||0)+1;localStorage.setItem(CONFIG.sequenceKey,String(n));return `PAIC-${new Date().getFullYear()}-${String(n).padStart(4,'0')}`},
 syncSequence(records){let max=0;for(const r of records){const m=String(r.letter_number||r.number||'').match(/-(\d{4,})$/);if(m)max=Math.max(max,Number(m[1]))}if(max>Number(localStorage.getItem(CONFIG.sequenceKey)||0))localStorage.setItem(CONFIG.sequenceKey,String(max))},
 migrate(){let current=this.get();if(current.length)return current;for(const k of CONFIG.legacyKeys){const old=read(k,[]);if(Array.isArray(old)&&old.length){current=old;this.set(current);this.syncSequence(current);return current}}return []},
 upsert(record){const list=this.get();const i=list.findIndex(x=>x.id===record.id);if(i<0)list.unshift(record);else list[i]={...list[i],...record,updated_at:record.updated_at||now()};list.sort((a,b)=>new Date(b.updated_at||0)-new Date(a.updated_at||0));this.set(list);return list},
 remove(id){const list=this.get().filter(x=>x.id!==id);this.set(list);return list},
 clear(){localStorage.removeItem(CONFIG.key);localStorage.removeItem(CONFIG.draftKey);localStorage.removeItem(CONFIG.sequenceKey)}
};
