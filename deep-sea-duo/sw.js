const CACHE_NAME = 'deep-sea-duo-static-20260913-v1';
const CORE_ASSETS = [
  './index.html',
  './manifest.webmanifest',
  './src/styles.css',
  './src/main.js',
  './src/pwa.js',
  './src/i18n.js',
  './src/audio/audio.js',
  './src/ui/hud.js',
  './src/game/input.js',
  './src/game/simulation.js',
  './src/game/constants.js',
  './src/game/renderer.js',
  './src/game/boss.js',
  './src/game/enemies.js',
  './src/game/entities.js',
  './src/game/environment.js',
  './src/game/math.js',
  './src/game/powerups.js',
  './src/network/room.js',
  './src/network/manual-webrtc.js',
  './src/network/messages.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => response)
        .catch(() => caches.match('./index.html')),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
