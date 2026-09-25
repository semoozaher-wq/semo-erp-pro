const CACHE_NAME = 'semoo-frp-v4';
const APP_SHELL = [
  './', './index.html', './manifest.json', './css/main.css',
  './js/config.js', './js/firebase.js', './js/gemini.js', './js/app.js',
  './logo-primary.png', './logo-lockup.png', './icon-192.png', './icon-512.png',
  './404.html', './error.html'
];

// الملفات الثابتة: تُخدم من الكاش فورًا ثم تُحدَّث في الخلفية (stale-while-revalidate)
// حتى تصل تحديثات app.js للعملاء دون أن يعلقوا على نسخة قديمة.
const STATIC_PATTERN = /\.(?:css|js|png|jpg|jpeg|svg|woff2?|ico)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(async (cache) => {
    await Promise.all(APP_SHELL.map((asset) => cache.add(asset).catch(() => undefined)));
    await self.skipWaiting();
  }));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // لا نعترض Firebase أو مكتبات CDN الخارجية: تخزينها قد يعرض بيانات قديمة أو يكسر المزامنة.
  if (url.origin !== self.location.origin) return;

  const isStatic = STATIC_PATTERN.test(url.pathname) || url.pathname.endsWith('manifest.json');
  if (isStatic) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const network = fetch(event.request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match('./index.html'))
  );
});
