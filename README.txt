PAIC Studio v9

النسخة الجديدة تفصل:
- index.html
- style.css
- content.js
- app.js
- supabase.sql
- assets/

التشغيل:
1) افتح index.html أو ارفع المجلد إلى GitHub ثم Vercel.
2) في Supabase شغّل supabase.sql.
3) من Supabase Dashboard فعّل Anonymous Sign-ins:
   Authentication -> Providers -> Anonymous Sign-ins -> Enable
4) Data API يجب أن تكون table paic_letters_v9 متاحة.

السحابة في v9 تستخدم Supabase Auth Anonymous + RLS بدلاً من client_id القابل للتخمين.
الـ publishable key مسموح في الواجهة. لا تضع secret/service_role key في الملفات.

PDF يستخدم نافذة الطباعة -> Save as PDF، ولا يحتاج jsPDF أو node_modules.
