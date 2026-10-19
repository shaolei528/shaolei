(() => {
  'use strict';
  if (window.AW_SUCCESSOR_GRAYBOX_CONTINUITY !== true) return;

  const baseHitsRequired = Object.freeze({ wood: 3, stone: 4 });
  const progress = new Map();

  function hitsFor(resource) {
    const base = baseHitsRequired[resource?.type];
    if (!base) return 0;
    // The starter bone knife doubles as a field cutter: it shortens wood work,
    // while stone still needs the same four deliberate strikes.
    const knifeWoodHits = Number(globalThis.ABYSSAL_CRAFTING_RECIPES_V1?.recipes?.knife?.gathering?.woodHits);
    return resource.type === 'wood' && inventory?.knife === true
      ? Math.max(1, Math.floor(knifeWoodHits) || base)
      : base;
  }

  window.addEventListener('abyssal:resource-work-intent', event => {
    const resource = event.detail;
    const total = hitsFor(resource);
    if (!total || !resource?.id) return;

    const now = Date.now();
    const previous = progress.get(resource.id);
    if (previous && now - previous.at < 140) { event.preventDefault(); return; }
    const hit = previous && now - previous.at < 10000 ? previous.hit + 1 : 1;
    const complete = hit >= total;
    if (complete) progress.delete(resource.id);
    else progress.set(resource.id, { hit, at: now });
    window.dispatchEvent(new CustomEvent('abyssal:resource-work-feedback', {
      detail: { ...resource, hit, total, remaining: total - hit, complete }
    }));
    if (!complete) event.preventDefault();
  });

  window.ABYSSAL_RESOURCE_WORK_V1 = Object.freeze({
    progressFor(id) { return progress.get(String(id))?.hit || 0; }
  });
})();
