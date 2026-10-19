(() => {
  'use strict';

  const existing = globalThis.ABYSSAL_SURVIVAL_HURT_GRACE_V1;
  if (existing?.bound) return;

  const WINDOW_MS = 800;
  let hurtUntil = 0;
  let suppressedHits = 0;
  const baseOnMobHit = onMobHit;

  onMobHit = function (payload) {
    if (!payload || payload.target !== SESSION_ID) {
      return baseOnMobHit.apply(this, arguments);
    }

    const now = Date.now();
    if (now < hurtUntil) {
      suppressedHits += 1;
      // Keep the mob's authoritative cooldown snapshot current while rejecting
      // only the duplicate local health change during this short hurt window.
      return baseOnMobHit.call(this, { ...payload, target: '__hurt-grace__' });
    }

    const hpBefore = Number(me?.hp);
    const result = baseOnMobHit.apply(this, arguments);
    if (Number(me?.hp) < hpBefore) hurtUntil = now + WINDOW_MS;
    return result;
  };

  globalThis.ABYSSAL_SURVIVAL_HURT_GRACE_V1 = Object.freeze({
    version: 1,
    bound: true,
    windowMs: WINDOW_MS,
    snapshot() {
      return {
        remainingMs: Math.max(0, hurtUntil - Date.now()),
        suppressedHits
      };
    }
  });
})();
