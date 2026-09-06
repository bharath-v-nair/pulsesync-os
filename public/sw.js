/**
 * PulseSync OS service worker (Stabilization: Vite `dist/`-aware).
 *
 * Lives in `public/` so Vite copies it verbatim to `dist/sw.js`.
 * - Precaches the app shell (versioned; old caches purged on activate).
 * - Navigation requests: network-first with offline fallback to index.html.
 * - Hashed Vite assets under `/assets/`: cache-first (immutable filenames).
 * - Cross-origin requests (fonts/CDN): network-only, never cached here.
 */
const SHELL_CACHE = 'pulsesync-shell-v8';
const ASSET_CACHE = 'pulsesync-assets-v8';
const PRECACHE = ['/', '/index.html'];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // App navigation: network-first, offline falls back to cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Vite hashed bundles: cache-first, populate on first hit.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(ASSET_CACHE).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
        )
      )
    );
  }
});
