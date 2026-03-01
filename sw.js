// ===== ExtensionMaster - Service Worker (Network-First) =====
const CACHE_NAME = 'ext-master-v2';
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
    // API 요청은 서비스워커가 관여하지 않음
    if (e.request.url.includes('/api/')) return;

    // GET 요청만 처리
    if (e.request.method !== 'GET') return;

    // http/https 요청만 처리 (chrome-extension 등 제외)
    if (!e.request.url.startsWith('http')) return;

    // Network-First: 항상 네트워크에서 먼저 가져오고, 실패 시 캐시 사용
    e.respondWith(
        fetch(e.request).then(function(res) {
            if (!res || res.status !== 200 || res.type === 'opaque') return res;
            var clone = res.clone();
            caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
            return res;
        }).catch(function() {
            // 오프라인: 캐시에서 제공
            return caches.match(e.request);
        })
    );
});
