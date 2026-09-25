# سجل التغييرات — جهوزية الإنتاج

قائمة **كل** ملف مُعدّل أو مُضاف. فُكّ الأرشيف فوق جذر المشروع (المسارات النسبية محفوظة).

## ملفات مُعدّلة

| الملف | سبب التعديل |
| --- | --- |
| `firebase.json` | `public: "."` كان ينشر المجلد كاملًا بلا استثناءات، فتُتاح ملفات داخلية للجمهور (`scripts/secure-realtime-db.py`, `functions/index.js`, `package.json`, `README.md`). أُضيفت قائمة `ignore` موسّعة، وترويسات أمان، وترويسات كاش. |
| `service-worker.js` | `gemini.js` كان ناقصًا من `APP_SHELL` فيفشل المساعد بلا اتصال. أُضيفت ملفات الواجهة الناقصة (14 عنصرًا)، والكاش إلى `semoo-frp-v4`، والإستراتيجية stale-while-revalidate حتى تصل تحديثات `app.js`. |
| `js/app.js` | **سطر واحد فقط**: `vapidKey: 'YOUR_VAPID_KEY_HERE'` — قيمة بديلة لم تُستبدل قط، وهي السبب الفعلي في تعطّل الإشعارات. صارت تقرأ المفتاح من `window.SEMOO_CONFIG.vapidKey` وتُعطّل الإشعارات بهدوء إن كان فارغًا. |
| `js/config.js` | أُضيف المفتاح `vapidKey: ""` مع تعليق يشرح كيفية إنشائه من Firebase Console. اتركه فارغًا حتى تُنشئه. |
| `package.json` | أُضيفت سكربتات التحقق: `check:deploy`, `check:placeholders`, `check:logic`, `check:smoke`, `check`, `check:all`, و`serve`، و`playwright` كاعتماد تطوير. |
| `manifest.json` | أُضيف `id`، وصار `start_url` هو `./` بدل `./index.html` (شرط تثبيت PWA صحيح)، مع `display_override` — دون تغيير الاسم أو الأيقونات أو اللون. |
| `robots.txt` | كان يوجّه لنطاق GitHub Pages القديم → صار نطاق Firebase، مع `Allow: /$` لتفادي فهرسة مسارات الإدارة. |
| `sitemap.xml` | نفس السبب: `loc` كان نطاق GitHub Pages قديمًا. |

## ملفات مُضافة

| الملف | الغرض |
| --- | --- |
| `CHANGES.md` | هذا الملف. |
| `DEPLOY.md` | دليل التشغيل والنشر: خطوات Firebase Console، النشر اليدوي والآلي، خطوات التحقق الإلزامية بعد النشر، وقائمة الفجوات المتبقية. |
| `.firebaserc` | يثبّت مشروع `semo-erp-pro13` حتى لا يُنشر إلى مشروع خطأ. |
| `.gitignore` | لم يكن موجودًا؛ يستثني الأسرار و`node_modules` والنسخ الاحتياطية، مع استثناء `!.env.example` ليُرفع فعلًا. |
| `.env.example` | يوضّح أن `GEMINI_API_KEY` في Firebase Secret Manager، ومكان سرّ `FIREBASE_SERVICE_ACCOUNT`، ومكان `vapidKey`. |
| `.github/workflows/firebase-hosting.yml` | فحوصات آلية على كل Push/PR، ونشر مشروط بوجود السر: عند غيابه تنجح الفحوصات مع تحذير ويُتخطى النشر بدل فشل الـ workflow. |
| `scripts/verify-deploy-assets.mjs` | يمنع نشر الملفات الداخلية، ويتأكد من ترويسات الأمان، ومن أن كل ملف محلي في `index.html` مذكور في `APP_SHELL` وموجود على القرص، ومن صلاحية `manifest.json`. |
| `scripts/verify-placeholders.mjs` | يفشل الفحص إذا بقي أي placeholder (`YOUR_VAPID_KEY_HERE`, `REPLACE_ME`...) داخل ملفات تُنشر — وهو ما كشف تعطّل الإشعارات. |
| `scripts/verify-critical-logic.mjs` | يختبر منطق المبيعات والمخزون **المستخرَج من `js/app.js` نفسه** (مجموع السلة، الإجمالي، تطبيع مفاتيح الاستيراد، توقع النفاد، وحفظ عقد الدوال) — أي تغيير في السلوك يُفشل الفحص. |
| `scripts/browser-smoke.mjs` | فحص تشغيلي بمتصفح: تهيئة Firebase، خلو الكونسول من الأخطاء، وتسجيل Service Worker، وأن كل معالج حدث في `index.html` معرّف فعلًا (منع الأزرار الميتة). يتخطّى نفسه بنجاح إن لم تكن Playwright مثبّتة. |

## ما لم يُعدَّل (بقصد)

`index.html` و`js/firebase.js` و`js/gemini.js` و`css/main.css` و`firebase.rules.json` و`storage.rules` و`firebase-messaging-sw.js` و`functions/index.js` — لم تُمس، والتعديل الوحيد في `js/app.js` كان سطر مفتاح VAPID لأنه كان قيمة بديلة معطّلة.

## التحقق قبل التسليم

```bash
npm run check:all
```

يجب أن يمرّ: JSON + صياغة JavaScript + قواعد الأمان + ملفات النشر + القيم البديلة + منطق المبيعات + الفحص التشغيلي في المتصفح.
