import {CONFIG} from './config.js';
let session=null;
async function request(path,opts={}){const res=await fetch(`${CONFIG.supabase.url}${path}`,{...opts,headers:{apikey:CONFIG.supabase.key,Authorization:`Bearer ${session?.access_token||CONFIG.supabase.key}`,'Content-Type':'application/json',...(opts.headers||{})}}); if(!res.ok)throw new Error(`cloud_${res.status}`); return res.status===204?null:res.json()}
export async function signIn(){if(session)return session; const data=await request('/auth/v1/signup',{method:'POST',body:'{}'}); if(!data?.access_token||!data?.user?.id)throw new Error('auth_failed'); session=data; return session}
export async function upsert(record){const s=await signIn(); return request(`/rest/v1/${CONFIG.supabase.table}?on_conflict=owner_id,letter_number`,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({...record,owner_id:s.user.id,is_anonymous:true})})}
export async function list(){await signIn();return request(`/rest/v1/${CONFIG.supabase.table}?select=*&order=updated_at.desc`)}
export async function remove(id){await signIn();return request(`/rest/v1/${CONFIG.supabase.table}?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}})}
