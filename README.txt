PAIC Studio v20

نسخة نظيفة وخفيفة لمنصة إنشاء الخطابات الرسمية لنادي البرمجة والذكاء الاصطناعي بجامعة الطائف.

المزايا
- HTML + CSS + JavaScript Modules فقط
- حفظ محلي تلقائي
- Supabase Anonymous Auth + RLS للمزامنة السحابية
- أربعة قوالب رسمية
- A4 ومربع
- معاينة مباشرة + Zoom + Fit
- طباعة / حفظ PDF من المتصفح
- بحث وفتح وحذف من المحفوظات
- Dark / Light + Responsive

إعداد Supabase
1. افتح مشروع Supabase.
2. من Authentication ثم Providers فعّل Anonymous Sign-Ins.
3. افتح SQL Editor وشغّل ملف supabase.sql كاملًا.
4. تأكد أن publishable key الموجود في js/data.js يطابق مشروعك.
5. ارفع المشروع إلى GitHub ثم اربطه بـ Vercel.

الأمان
- لا يوجد secret/service key في الواجهة.
- RLS مقيد بالمالك وبـ is_anonymous.
- المفتاح الموجود في المتصفح Publishable key مخصص للتطبيقات العامة مع RLS.
- لا توجد حسابات أو صلاحيات داخل التطبيق.

ملاحظة
المزامنة السحابية تحتاج تفعيل Anonymous Sign-Ins وتشغيل SQL مرة واحدة. إذا كانت السحابة غير متاحة يستمر التطبيق محليًا ويحافظ على المسودات.
