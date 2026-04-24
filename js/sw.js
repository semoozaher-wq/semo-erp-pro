const cacheName = 'semo-erp-v2'; // قمنا بتغيير الإصدار لتحديث الذاكرة
const assets = [
  './',
  './index.html',
  './dashboard.html',
  './manifest.json'
];

// تثبيت ملف الـ Service Worker وحفظ الملفات الأساسية في الذاكرة
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log('جاري حفظ ملفات النظام في الذاكرة...');
      return cache.addAll(assets);
    })
  );
});

// تفعيل الملف وحذف الكاش القديم إن وجد
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== cacheName)
        .map(key => caches.delete(key))
      );
    })
  );
});

// جلب الملفات من الذاكرة عند انقطاع الإنترنت لضمان عمل التطبيق
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request);
    })
  );
});
