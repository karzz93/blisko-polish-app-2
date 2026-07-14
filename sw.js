const CACHE_NAME = 'blisko-shell-flat-v1.2.1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest?v=1.2.1',
  './styles.css?v=1.2.1',
  './data.js?v=1.2.1',
  './storage.js?v=1.2.1',
  './engine.js?v=1.2.1',
  './tutor.js?v=1.2.1',
  './app.js?v=1.2.1',
  './icon.svg?v=1.2.1',
  './icon-192.png?v=1.2.1',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cached) => {
        const update = fetch(request)
          .then((response) => {
            if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', response.clone()));
            return response;
          })
          .catch(() => cached);
        return cached || update;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const update = fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => cached);
      return cached || update;
    })
  );
});
