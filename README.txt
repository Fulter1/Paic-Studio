PAIC Studio v19

نسخة خفيفة ونظيفة من منصة الخطابات الرسمية لنادي البرمجة والذكاء الاصطناعي بجامعة الطائف.

الهيكلة:
index.html
style.css
js/app.js        تشغيل التطبيق والواجهة والأحداث
js/data.js       الإعدادات والقوالب والنصوص
js/document.js   بناء الخطاب والتحقق والتنسيق
js/storage.js    التخزين المحلي والمسودات والترقيم
js/cloud.js      اتصال Supabase والجلسة
assets/          الشعارات
supabase.sql     جداول وسياسات Supabase
vercel.json      إعدادات Vercel

لا توجد مكتبات خارجية أو Frameworks.

التشغيل:
1. ارفع الملفات كما هي إلى GitHub.
2. اربط المستودع مع Vercel.
3. شغل supabase.sql في SQL Editor إذا لم تكن قاعدة البيانات والسياسات موجودة.
4. فعّل Anonymous Sign-Ins في Supabase Authentication.

المفتاح الموجود في الواجهة هو Publishable Key فقط، وليس Secret/Service Role Key. حماية البيانات تعتمد على RLS في Supabase.
