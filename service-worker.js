const CACHE_NAME = "semoo-frp-v2";
const APP_SHELL = ["./", "./index.html", "./manifest.json", "./logo-primary.png", "./logo-lockup.png", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE_NAME).then(async cache => { for (const asset of APP_SHELL) { try { await cache.add(asset); } catch (e) { console.warn("Cache skipped:", asset); } } await self.skipWaiting(); })); });
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => { const copy=response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)); return response; }).catch(() => caches.match("./index.html"))));
});
