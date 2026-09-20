export const CONFIG=Object.freeze({
 version:'3.0.0',
 storage:{records:'paic-studio-v3-records',draft:'paic-studio-v3-draft',theme:'paic-studio-v3-theme',snippets:'paic-studio-v3-snippets',session:'paic-studio-v3-session'},
 legacyStorage:['paic-studio-v2-records','paic-studio-v2-draft','paic-studio-v2-theme','paic-studio-v2-snippets'],
 supabase:{url:'https://ddwekucnbmzktbzaoxmj.supabase.co',key:'sb_publishable_bPLVqBXOMQc0DZj3UIz2tg_o0KR8llE',table:'paic_letters_v13'},
 paper:{a4:{w:794,h:1123},square:{w:794,h:794}},
 zoom:{min:.38,max:.92,default:.58},
 timeouts:{request:9000}
});
