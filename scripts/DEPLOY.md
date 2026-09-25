# دليل التشغيل والنشر (Production Runbook)

هذا الدليل يفترض أنك تنشر نسخة **جاهزة للعمل اليومي**. نفّذ الخطوات بالترتيب، ولا تخطِّ خطوة تحقق.

## 1. الفحوصات قبل أي نشر

```bash
npm run check:all
```

يشغّل خمسة فحوص: صلاحية JSON، صياغة JavaScript، قواعد الأمان وعزل البيانات، ملفات النشر وService Worker، ثم فحص تشغيلي حقيقي في متصفح (Playwright) يتأكد أن Firebase يتهيّأ وأن `console` نظيف.

لفحص الدالة وحدها:

```bash
cd functions && npm install && npm run check && cd ..
```

## 2. إعداد Firebase Console (مرة واحدة لكل مشروع)

المشروع المستخدم: `semo-erp-pro13`

1. **Authentication → Sign-in method**: فعّل Google.
2. **Authentication → Settings → Authorized domains**: أضف نطاق النشر (مثل `semo-erp-pro13.web.app` أو `semo-erp-pro13.firebaseapp.com` أو نطاقك المخصص). بدونه يفشل تسجيل الدخول في الإنتاج فقط.
3. **Realtime Database → Rules**: ارفع محتوى `firebase.rules.json` كاملًا.
4. **Storage → Rules**: ارفع محتوى `storage.rules`.
5. **Functions → Secret Manager**: أنشئ السر `GEMINI_API_KEY` قبل نشر الدالة، وإلا فشل `askGemini` عند أول استدعاء.

## 3. ربط المشروع محليًا

`.firebaserc` جاهز ويشير إلى `semo-erp-pro13`. تأكد بـ:

```bash
firebase login
firebase use
# يجب أن يطبع Active Project: semo-erp-pro13
```

## 4. النشر اليدوي

```bash
firebase deploy --only hosting,database,storage
# ولنشر الدالة (يحتاج السر من الخطوة 2.5):
firebase deploy --only functions:askGemini
```

## 5. النشر الآلي عبر GitHub Actions

الملف `.github/workflows/firebase-hosting.yml` يشغّل الفحوصات على كل Push وPull Request، وينشر تلقائيًا عند Push على `main` **فقط إذا** وُجد السر `FIREBASE_SERVICE_ACCOUNT`. عند غيابه تُنجح الفحوصات مع تحذير ويُتخطى النشر، بدل أن يفشل الـ workflow كاملًا.

لإضافة السر: `Settings → Secrets and variables → Actions → New repository secret` بالاسم `FIREBASE_SERVICE_ACCOUNT`، والقيمة هي محتوى ملف Service Account (أُنشئ من Firebase Console → Project settings → Service accounts → Generate new private key).

> لا ترفع ملف Service Account إلى المستودع مطلقًا. `.gitignore` يستثنيه تلقائيًا.

## 6. التحقق من نشر الإنتاج (إلزامي)

النشر الناجح لا يثبت أن التطبيق يعمل. افتح رابط الإنتاج ونفّذ:

1. الصفحة الرئيسية تُحمَّل ويظهر شعار SeMo0o بدون شاشة بيضاء.
2. افتح **Developer Tools → Console** وتأكد أنه **بلا أخطاء حمراء**، خصوصًا لا شيء مثل `PERMISSION_DENIED`.
3. سجّل الدخول بحساب Google، وتأكد من ظهور الصفحات بعد الدخول.
4. نفّذ عملية بيع تجريبية وتأكد أنها تُحفظ ثم تظهر في التقارير.
5. **تحديثات Service Worker**: افتح `DevTools → Application → Service Workers` وتأكد من تنشيط `semoo-frp-v4`. الكاش القديم (`v3`) يُحذف تلقائيًا عند التنشيط.

## 7. ما أُصلح في جهوزية الإنتاج

| المشكلة | الأثر قبل الإصلاح | الإصلاح |
| --- | --- | --- |
| Hosting ينشر المجلد كاملًا (`public: "."`) بلا استثناءات | ملفات داخلية تصل للجمهور عبر HTTPS مثل `scripts/secure-realtime-db.py` و`functions/index.js` و`package.json` و`README.md` | قائمة `ignore` موسّعة في `firebase.json` تستثني `scripts/**` و`functions/**` وملفات الحزمة والتوثيق |
| `gemini.js` مفقود من `APP_SHELL` | على الأعمال غير المتصلة/أول تحميل، فشل `askSeMoGemini` لأن الملف لم يُخزَّن | أُضيف `gemini.js` وباقي ملفات الواجهة إلى `APP_SHELL` |
| كاش Service Worker ثابت على `Cache First` فقط | تحديثات التطبيق لا تصل للعملاء المثبّتين حتى يمسحوا الكاش يدويًا | `stale-while-revalidate`: العرض فوري من الكاش والتحديث في الخلفية |
| لا يوجد `.firebaserc` | `firebase deploy` يطلب اختيار مشروع (احتمال نشر لمشروع خطأ) | أُضيف `.firebaserc` بمشروع `semo-erp-pro13` |
| لا يوجد `.github/workflows` رغم ذكر الـ README له | README يوجّه لملف غير موجود، ولا فحص آلي ولا نشر | أُضيف الـ workflow بالفحوصات والنشر المشروط وجود السر |
| لا يوجد `.gitignore` | احتمال رفع ملفات أسرار أو `node_modules` | أُضيف `.gitignore` يستثني الأسرار وملفات النظام |

## 8. فجوات متبقية تحتاج قرارك (لم أضفها لأتجنّب تغيير سلوك النظام)

- **الإشعارات لا تعمل فعليًا**: `firebase-messaging-sw.js` موجود، لكن لا يوجد استدعاء `getToken()` بمفتاح VAPID في الواجهة، ولا مرسل إشعارات في الخلفية. تفعيلها يحتاج خطوة منفصلة.
- **`domains` و`authorizedDomains`**: يجب تأكيد نطاق النشر في Firebase Console يدويًا؛ لا يمكن فعلها من الشيفرة.
- **مفاتيح API الأمامية عامة بطبيعتها**: `apiKey` الظاهر في `js/config.js` ليس سرًّا ويمكن رؤيته من المتصفح — وهذا طبيعي في Firebase، لكن الحماية الفعلية تعتمد كليًا على `firebase.rules.json` و`storage.rules`. تأكد من رفعهما كما في الخطوة 2.
- **النسخ الاحتياطي الآلي** غير موجود (التطبيق يوفر تصدير JSON يدويًا فقط)؛ الأتمتة تحتاج Cloud Scheduler + Function.
- **لا توجد اختبارات وحدة لمنطق البيع والمخزون** (`js/app.js` ملف واحد بحجم 4445 سطرًا). أي توسّع جدي يُستحسن أن يبدأ بتفكيكه إلى وحدات قبل إضافة اختبارات.
