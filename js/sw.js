// Service Worker للتشغيل بدون إنترنت
const CACHE_NAME = 'semo-erp-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/dashboard.html'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
