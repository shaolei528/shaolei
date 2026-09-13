export function registerOfflineCache() {
  if (!('serviceWorker' in navigator) || !globalThis.isSecureContext) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
  }, { once: true });
}

registerOfflineCache();
