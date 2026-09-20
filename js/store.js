import {CONFIG} from './config.js';
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
export const store={
 records(){return read(CONFIG.storageKey,[])}, saveRecords(v){write(CONFIG.storageKey,v)}, draft(){return read(CONFIG.draftKey,null)}, saveDraft(v){write(CONFIG.draftKey,v)}, clearDraft(){localStorage.removeItem(CONFIG.draftKey)},
 theme(){return localStorage.getItem(CONFIG.themeKey)||'system'}, setTheme(v){localStorage.setItem(CONFIG.themeKey,v)}
};
