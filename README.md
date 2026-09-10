# SeMo0o FRP

## الملفات المطلوبة

ارفع **كل الملفات الموجودة في هذا المجلد** إلى نفس مستوى `index.html` في مستودع GitHub Pages:

- `index.html`
- `manifest.json`
- `service-worker.js`
- `logo-primary.png`
- `logo-lockup.png`
- `icon-192.png`
- `icon-512.png`
- `firebase.rules.json` (يتم رفعه إلى Firebase Rules، وليس ضرورياً أن يكون عاماً على GitHub)

## تشغيل GitHub Pages

من إعدادات المستودع اختر **Settings → Pages → Deploy from branch → main / root**. افتح رابط HTTPS الناتج، وليس رابط GitHub الخاص بالملفات.

## التثبيت على الهاتف

على Android سيظهر زر التثبيت داخل التطبيق أو من قائمة المتصفح. على iPhone افتح الرابط من Safari ثم اختر **مشاركة → إضافة إلى الشاشة الرئيسية**.

## Firebase Rules

انسخ محتوى `firebase.rules.json` إلى **Realtime Database → Rules** في Firebase، ثم اضغط Publish.

## ملاحظات

يجب أن تكون الملفات في المجلد الرئيسي نفسه؛ لا تضع الصور داخل مجلد فرعي إلا إذا عدّلت المسارات داخل `index.html` و`manifest.json`.
