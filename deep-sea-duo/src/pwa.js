const IMMUTABLE_TEST_HOSTS = new Set(['rawcdn.githack.com', 'cdn.jsdelivr.net']);

async function clearTestHostCaches() {
  try {
    const registrations = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((registrations ?? [])
      .filter(registration => registration.scope.includes('/deep-sea-duo/'))
      .map(registration => registration.unregister()));
  } catch {}

  try {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('deep-sea-duo-static-'))
      .map(key => caches.delete(key)));
  } catch {}
}

export function registerOfflineCache() {
  if (!('serviceWorker' in navigator) || !globalThis.isSecureContext) return;

  // Every GitHack/jsDelivr test URL already pins a Git commit. A service worker
  // there only creates a risk of testing stale JavaScript, so explicitly remove
  // old Deep Sea Duo workers/caches. Keep PWA caching for the eventual real host.
  if (IMMUTABLE_TEST_HOSTS.has(location.hostname)) {
    window.addEventListener('load', () => { void clearTestHostCaches(); }, { once: true });
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
  }, { once: true });
}

registerOfflineCache();
