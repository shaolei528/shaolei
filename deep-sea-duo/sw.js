const CACHE_NAME = 'deep-sea-duo-static-audit-a1-v1';
const CORE_ASSETS = [
  './index.html',
  './manifest.webmanifest',
  './src/build.js',
  './src/main.js',
  './src/pwa.js',
  './src/i18n.js',
  './src/styles.css',
  './src/lobby.css',
  './src/app/game-session.js',
  './src/audio/audio.js',
  './src/ui/hud.js',
  './src/ui/lobby.js',
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
  './src/network/signaling.js',
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

async function fetchAndRefresh(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const copy = response.clone();
      void caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
    }
    return response;
  } catch {
    return caches.match(request);
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/room') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html')),
    );
    return;
  }

  const isRuntimeCode = ['script', 'style', 'manifest'].includes(request.destination)
    || url.pathname.endsWith('.js')
    || url.pathname.endsWith('.css')
    || url.pathname.endsWith('.webmanifest');

  if (isRuntimeCode) {
    event.respondWith(fetchAndRefresh(request));
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached ?? fetchAndRefresh(request)),
  );
});
