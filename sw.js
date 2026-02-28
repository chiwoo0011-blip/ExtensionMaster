// ===== ExtensionMaster - Service Worker =====
const CACHE_NAME = 'ext-master-v1';
const APP_SHELL  = ['/', '/app.js', '/style.css', '/manifest.json'];

self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(APP_SHELL);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(k) { return k !== CACHE_NAME; })
                    .map(function(k) { return caches.delete(k); })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function(e) {
    // API 요청은 서비스워커가 관여하지 않음 (ContactDB가 localStorage로 오프라인 관리)
    if (e.request.url.includes('/api/')) return;

    // GET 요청만 캐시
    if (e.request.method !== 'GET') return;

    e.respondWith(
        caches.match(e.request).then(function(cached) {
            if (cached) return cached;
            return fetch(e.request).then(function(res) {
                if (!res || res.status !== 200 || res.type === 'opaque') return res;
                var clone = res.clone();
                caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
                return res;
            });
        })
    );
});
