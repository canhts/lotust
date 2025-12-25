
const CACHE_NAME = 'hoasen-cache-v1.0.27';
const DYNAMIC_CACHE_NAME = 'hoasen-dynamic-v1';

// Các file cốt lõi
const APP_ASSETS = [
  './',
  './index.html',
  './assets/logo.svg',
  './assets/version.json',
  './manifest.json'
];

// Tailwind và Icons vẫn dùng CDN
const EXTERNAL_LIBS = [
  'https://cdn.tailwindcss.com',
  'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons+Round'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching core assets...');
      return Promise.allSettled(
        [...APP_ASSETS, ...EXTERNAL_LIBS].map(url => 
          fetch(new Request(url, { mode: 'cors', credentials: 'omit' }))
            .then(response => {
              if (response.ok) return cache.put(url, response);
            })
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  
  const url = new URL(request.url);

  // Bỏ qua hot reload
  if (url.pathname.includes('browser-sync') || url.pathname.includes('ng-cli-ws')) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // 1. Ưu tiên cache
      if (cachedResponse) return cachedResponse;

      // 2. Tải mạng và lưu cache dynamic
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // 3. Offline fallback
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});