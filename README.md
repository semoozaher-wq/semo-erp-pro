# SeMo0o FRP

## ما تم تأمينه

التطبيق يعمل بتسجيل الدخول عبر Google Firebase، ويستخدم Realtime Database مع حفظ محلي وOffline Outbox. تم تعديل مسارات بيانات العمل لتصبح تحت مساحة المستخدم:

```text
users/{uid}/products
users/{uid}/customers
users/{uid}/sales
users/{uid}/expenses
users/{uid}/cashbox
```

لذلك لا يستطيع مستخدم قراءة أو تعديل بيانات مستخدم آخر. كما أصبحت صور المنتجات داخل `users/{uid}/product-images/`، مع منع المسار القديم العام.

## الملفات المطلوبة لـ GitHub Pages

ضع الملفات التالية في المجلد الرئيسي للمستودع: `index.html`، `manifest.json`، `service-worker.js`، `logo-primary.png`، `logo-lockup.png`، `icon-192.png`، `icon-512.png`، `firebase.json`، `.firebaserc`، `firebase.rules.json`، و`storage.rules`.

## إعداد Firebase Console

المشروع المستخدم في هذه النسخة هو `semo-erp-pro13`. من Firebase Console فعّل Google من Authentication → Sign-in method، ثم أضف نطاق GitHub Pages أو النطاق المخصص إلى Authentication → Settings → Authorized domains. ارفع `firebase.rules.json` إلى Realtime Database → Rules، وارفع `storage.rules` إلى Storage → Rules.

لا تخلط هذا المشروع مع `my-pos-system-11dee`. إذا أردت استخدام مشروع Firebase آخر، يجب تغيير كل قيم `firebaseConfig` مع تحديث `databaseURL` و`projectId` و`storageBucket` معًا.

## البيانات القديمة

البيانات القديمة التي كانت في المسارات العامة مثل `/products` و`/sales` لن تظهر بعد تفعيل العزل الجديد تلقائيًا. لترحيلها دون حذفها، ثبّت `firebase-admin` في بيئة آمنة، ثم شغّل:

```bash
npm install firebase-admin
FIREBASE_SERVICE_ACCOUNT_JSON=/secure/service-account.json TARGET_UID=GOOGLE_USER_UID node scripts/migrate-legacy-realtime-db.mjs
```

لا ترفع ملف Service Account إلى GitHub. السكربت لا يحذف البيانات القديمة؛ احذفها فقط بعد التأكد من نجاح الترحيل.

## الحفظ والمزامنة

يحفظ التطبيق البيانات في Firebase عند تنفيذ العملية، ويحتفظ بنسخة محلية في IndexedDB، ويضع العمليات الفاشلة في Offline Outbox حتى تعود الشبكة. عند عودة الاتصال تتم المزامنة تلقائيًا. كما تُحفظ المسودة عند `beforeunload` وعند انتقال الصفحة إلى حالة `hidden`.

## النشر

للنشر عبر Firebase CLI:

```bash
firebase login
firebase use semo-erp-pro13
firebase deploy --only hosting,database,storage
```

وللنشر من GitHub Actions، أضف Secret باسم `FIREBASE_SERVICE_ACCOUNT` في إعدادات المستودع. ملف `.github/workflows/firebase-hosting.yml` يشغّل فحص الأمان في كل Push، وينشر Hosting عند توفر الـ Secret.

لفحص القواعد محليًا:

```bash
node scripts/verify-security.mjs
```

## النسخ الاحتياطي

يوفر التطبيق تنزيل نسخة JSON واستعادتها من أدوات النسخ الاحتياطي. النسخ الآلي الكامل من Realtime Database يحتاج بيئة خادم أو Cloud Scheduler مع Service Account؛ لا تضع مفتاح Service Account داخل `index.html` أو داخل GitHub Pages.

## بنية الملفات

تم فصل المشروع إلى `css/main.css` و`js/config.js` و`js/firebase.js` و`js/app.js`. تم الحفاظ على ترتيب تحميل Firebase قبل منطق التطبيق حتى لا تتغير الوظائف الحالية.

أُضيف `firebase-messaging-sw.js` للإشعارات الخلفية. يجب تفعيل Firebase Cloud Messaging وإضافة VAPID Key قبل طلب صلاحية الإشعارات من المستخدم؛ وجود الملف وحده لا يرسل إشعارات.

تم تحديث `service-worker.js` ليستخدم Cache First للملفات الثابتة وNetwork First للصفحات. لا يتم اعتراض طلبات Firebase أو مكتبات CDN الخارجية، لأن تخزينها محليًا قد يعرض بيانات قديمة أو يكسر المزامنة.

أُضيفت صفحات `404.html` و`error.html` وملفات `robots.txt` و`sitemap.xml` و`.gitignore` و`LICENSE` و`package.json`. صفحة sitemap تحتوي الصفحة العامة فقط؛ بيانات ERP بعد تسجيل الدخول ليست محتوى عامًا مناسبًا لمحركات البحث.

## مساعد Gemini

أصبحت نافذة الدردشة تستدعي دالة Firebase callable باسم `askGemini`. مفتاح Gemini لا يوضع داخل `index.html` أو أي ملف JavaScript أمامي؛ بل يُحفظ في Firebase Functions Secret Manager.

لتثبيت الدالة ونشرها:

```bash
cd functions
npm install
cd ..
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only functions:askGemini
```

تتطلب الدالة تسجيل دخول المستخدم، وترسل للذكاء الاصطناعي ملخصًا محدودًا عن حالة النظام بدل إرسال قاعدة البيانات كاملة. كما أن المساعد يقدم اقتراحات للقراءة فقط ولا ينفذ عمليات مالية أو حذفًا أو تعديلًا.

للفحوص المحلية:

```bash
npm run check:json
npm run check:syntax
npm run check:security
cd functions && npm run check
```

لا تضع مفتاح Gemini في `js/config.js` أو `index.html` أو مستودع GitHub. إذا تم كشف المفتاح، أوقفه وأنشئ مفتاحًا جديدًا من Google AI Studio.
