const BUILD = '1.7';
const SCOPE_PATH = new URL(self.registration.scope).pathname;
const SCOPE_KEY = SCOPE_PATH
  .replace(/^\/+|\/+$/g, '')
  .replace(/[^a-z0-9_-]+/gi, '-')
  .toLowerCase() || 'root';
const CACHE_PREFIX = `blisko-${SCOPE_KEY}-`;
const CACHE_NAME = `${CACHE_PREFIX}shell-v${BUILD}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-v${BUILD}`;
const VERSION_QUERY = `v=${BUILD}`;
const LEGACY_CACHE_PATTERN = /^blisko-(?:shell-flat|runtime)-v/i;

const APP_SHELL = [
  './',
  './index.html',
  `./manifest.webmanifest?${VERSION_QUERY}`,
  `./styles.css?${VERSION_QUERY}`,
  `./data.js?${VERSION_QUERY}`,
  `./storage.js?${VERSION_QUERY}`,
  `./engine.js?${VERSION_QUERY}`,
  `./tutor.js?${VERSION_QUERY}`,
  `./polish.js?${VERSION_QUERY}`,
  `./app.js?${VERSION_QUERY}`,
  `./icon.svg?${VERSION_QUERY}`,
  `./icon-192.png?${VERSION_QUERY}`,
  './icon-512.png',
  './icon-maskable-512.png',
  './BUILD.txt',
];

const shellRequest = (path) => new Request(new URL(path, self.registration.scope), {
  cache: 'reload',
  credentials: 'same-origin',
});

const installVerifiedShell = async () => {
  const cache = await caches.open(CACHE_NAME);
  // cache.addAll is deliberately atomic: a partial deployment never becomes
  // the active offline app. A failed file keeps the previous worker in place.
  await cache.addAll(APP_SHELL.map(shellRequest));
};

self.addEventListener('install', (event) => {
  event.waitUntil(installVerifiedShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(async (key) => {
      if (key.startsWith(CACHE_PREFIX) && ![CACHE_NAME, RUNTIME_CACHE].includes(key)) {
        await caches.delete(key);
        return;
      }
      // Older builds used origin-wide cache names. Remove only entries that
      // belong to this service-worker scope so another GitHub Pages app on the
      // same username.github.io origin is never damaged by this update.
      if (LEGACY_CACHE_PATTERN.test(key)) {
        const cache = await caches.open(key);
        const requests = await cache.keys();
        await Promise.all(requests
          .filter((request) => request.url.startsWith(self.registration.scope))
          .map((request) => cache.delete(request)));
        if (!(await cache.keys()).length) await caches.delete(key);
      }
    }));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.disable(); } catch { /* optional API */ }
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'GET_VERSION') {
    const payload = { type: 'BLISKO_VERSION', build: BUILD, cache: CACHE_NAME };
    if (event.ports?.[0]) event.ports[0].postMessage(payload);
    else event.source?.postMessage?.(payload);
  }
});

const matchShell = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const exact = await cache.match(request);
  if (exact) return exact;
  return cache.match(request, { ignoreSearch: true });
};

const navigationResponse = async (request) => {
  // The active worker serves one immutable, verified build. A newly installed
  // worker replaces the whole shell and triggers one controlled restart.
  const cached = await matchShell(new Request(new URL('./index.html', self.registration.scope)));
  if (cached) return cached;
  try {
    return await fetch(request, { cache: 'no-store' });
  } catch {
    return new Response('Blisko is offline and the verified app shell is unavailable.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
};

const shellOrNetwork = async (request) => {
  const cached = await matchShell(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response?.ok) {
    const runtime = await caches.open(RUNTIME_CACHE);
    runtime.put(request, response.clone()).catch(() => null);
  }
  return response;
};

const networkWithRuntimeFallback = async (request) => {
  const runtime = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response?.ok) runtime.put(request, response.clone()).catch(() => null);
    return response;
  } catch (error) {
    const cached = await runtime.match(request);
    if (cached) return cached;
    throw error;
  }
};

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigationResponse(request));
    return;
  }

  const withinScope = url.href.startsWith(self.registration.scope);
  const isShellType = ['script', 'style', 'manifest', 'image', 'font'].includes(request.destination)
    || url.searchParams.get('v') === BUILD
    || APP_SHELL.some((path) => new URL(path, self.registration.scope).pathname === url.pathname);

  if (withinScope && isShellType) {
    event.respondWith(shellOrNetwork(request));
    return;
  }

  event.respondWith(networkWithRuntimeFallback(request));
});
