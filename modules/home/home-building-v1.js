(() => {
  'use strict';

  if (globalThis.ABYSSAL_HOME_BUILDING_V1?.version === 1) return;
  const data = globalThis.ABYSSAL_BUILDING_CONFIG_V1;
  const spatial = globalThis.ABYSSAL_WORLD_SPATIAL_V1;
  const save = globalThis.ABYSSAL_SAVE_EXTENSIONS_V1;
  const items = globalThis.ABYSSAL_INVENTORY_TRANSACTIONS_V1;
  if (data?.version !== 1 || !spatial || !save || !items) {
    throw new Error('HOME & Building requires its data, World, Save and Items owners.');
  }

  const definition = data.structures?.['wood-barricade'];
  if (!definition) throw new Error('HOME & Building has no starter structure.');
  const structures = new Map();
  const busy = new Set();
  let nextId = 1;
  let buildMode = false;
  let dismantleMode = false;
  let hud = null;
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const currentZoneKey = () => String(typeof currentZone === 'string' ? currentZone : me?.zone || '1:1');
  const geometryId = id => `home-building:${id}`;
  const validZone = zone => /^\d+:\d+$/.test(String(zone));
  const zoneBounds = zone => {
    if (!validZone(zone) || typeof WORLD === 'undefined') return null;
    const [zx, zy] = String(zone).split(':').map(Number);
    const size = number(WORLD.zone, 0), width = number(WORLD.w, 0), height = number(WORLD.h, 0);
    if (!(size > 0 && width > 0 && height > 0)) return null;
    return { left: zx * size, top: zy * size, right: Math.min(width, (zx + 1) * size), bottom: Math.min(height, (zy + 1) * size) };
  };
  const footprint = structure => {
    const horizontal = structure.axis === 'x';
    const width = horizontal ? number(definition.width, 64) : number(definition.depth, 20);
    const height = horizontal ? number(definition.depth, 20) : number(definition.width, 64);
    return { x: structure.x - width / 2, y: structure.y - height / 2, w: width, h: height };
  };
  function registerStructure(structure) {
    const box = footprint(structure);
    spatial.registerGeometry({ id: geometryId(structure.id), zone: structure.zone, colliders: [{ id: structure.id, kind: 'player-built-defense', ...box }] });
  }
  function cleanStructure(raw) {
    const id = String(raw?.id || ''), zone = String(raw?.zone || ''), x = Number(raw?.x), y = Number(raw?.y);
    if (!/^barrier-[a-z0-9-]{1,48}$/.test(id) || !validZone(zone) || !Number.isFinite(x) || !Number.isFinite(y) || !['x', 'y'].includes(raw?.axis)) return null;
    const bounds = zoneBounds(zone);
    if (!bounds || x < bounds.left + 40 || y < bounds.top + 40 || x > bounds.right - 40 || y > bounds.bottom - 40) return null;
    return { id, kind: 'wood-barricade', zone, x, y, axis: raw.axis, health: Math.max(1, Math.min(number(definition.health, 90), Math.floor(number(raw.health, definition.health)))) };
  }
  function snapshot() {
    return { version: 1, nextId, structures: [...structures.values()].map(item => ({ ...item })) };
  }
  function snapshotForZone(zone) {
    const key = String(zone || '');
    if (!validZone(key)) return null;
    return { version: 1, nextId, structures: [...structures.values()].filter(item => item.zone === key).map(item => ({ ...item })) };
  }
  function restore(state) {
    for (const item of structures.values()) spatial.unregisterGeometry(geometryId(item.id));
    structures.clear();
    if (state?.version !== 1 || !Array.isArray(state.structures)) return;
    nextId = Math.max(1, Math.floor(number(state.nextId, 1)));
    for (const raw of state.structures.slice(0, 72)) {
      const item = cleanStructure(raw);
      if (!item || structures.has(item.id)) continue;
      structures.set(item.id, item);
      registerStructure(item);
    }
  }
  function applyRemoteZoneSnapshot(zone, state) {
    const key = String(zone || '');
    if (!validZone(key) || state?.version !== 1 || !Array.isArray(state.structures)) return false;
    const before = snapshot();
    const incoming = state.structures.slice(0, 72).map(cleanStructure).filter(item => item && item.zone === key);
    const unique = [...new Map(incoming.map(item => [item.id, item])).values()];
    restore({ version: 1, nextId: Math.max(before.nextId, Math.floor(number(state.nextId, 1))), structures: [...before.structures.filter(item => item.zone !== key), ...unique] });
    let saved = false;
    try { saved = typeof saveLocal === 'function' && saveLocal() === true; } catch {}
    if (!saved) { restore(before); return false; }
    refresh();
    return true;
  }
  save.register('home.building.v1', { snapshot, restore });

  function all() { return [...structures.values()].map(item => ({ ...item })); }
  function inBounds(zone, box) {
    const bounds = zoneBounds(zone);
    return !!bounds && box.x >= bounds.left + 20 && box.y >= bounds.top + 20 && box.x + box.w <= bounds.right - 20 && box.y + box.h <= bounds.bottom - 20;
  }
  function intersectsExistingGeometry(zone, box) {
    for (let y = box.y + 3; y < box.y + box.h - 2; y += 8) {
      for (let x = box.x + 3; x < box.x + box.w - 2; x += 8) {
        if (spatial.isBlockedPoint(zone, x, y)) return true;
      }
    }
    return false;
  }
  function overlapsActor(box, actor) {
    if (!actor) return false;
    const x = number(actor.x, NaN), y = number(actor.y, NaN);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    const closestX = Math.max(box.x, Math.min(x, box.x + box.w));
    const closestY = Math.max(box.y, Math.min(y, box.y + box.h));
    return Math.hypot(x - closestX, y - closestY) < number(actor.r, 12) + 4;
  }
  function canPlace({ zone, x, y, axis, actor = typeof me !== 'undefined' ? me : null } = {}) {
    const key = String(zone || currentZoneKey()), px = Number(x), py = Number(y);
    if (!validZone(key) || !Number.isFinite(px) || !Number.isFinite(py) || !['x', 'y'].includes(axis)) return { ok: false, reason: 'invalid-placement' };
    const current = actor || {};
    const snapAllowance = Math.max(0, number(data.gridSize, 24) * Math.SQRT2 / 2 + 1);
    if (!actor || currentZoneKey() !== key || Math.hypot(px - number(current.x), py - number(current.y)) > number(data.placeDistance, 88) + snapAllowance) return { ok: false, reason: 'too-far' };
    const box = footprint({ x: px, y: py, axis });
    if (!inBounds(key, box)) return { ok: false, reason: 'zone-edge' };
    const zoneStructures = [...structures.values()].filter(item => item.zone === key);
    if (zoneStructures.length >= Math.max(1, Math.floor(number(data.maxPlacedPerZone, 24)))) return { ok: false, reason: 'zone-full' };
    if (intersectsExistingGeometry(key, box)) return { ok: false, reason: 'occupied' };
    if (overlapsActor(box, actor)) return { ok: false, reason: 'actor-overlap' };
    if (typeof mobs !== 'undefined' && mobs.some(mob => mob.hp > 0 && overlapsActor(box, mob))) return { ok: false, reason: 'creature-overlap' };
    if (typeof remotes !== 'undefined' && [...remotes.values()].some(remote => remote.hp !== 0 && overlapsActor(box, remote))) return { ok: false, reason: 'player-overlap' };
    return { ok: true, box };
  }
  function placeAt(x, y, axis = 'x', zone = currentZoneKey()) {
    if (typeof started !== 'undefined' && !started || typeof dead !== 'undefined' && dead) return { ok: false, reason: 'inactive' };
    const key = String(zone), valid = canPlace({ zone: key, x, y, axis });
    if (!valid.ok) return valid;
    const token = `${key}:${Math.round(Number(x))}:${Math.round(Number(y))}`;
    if (busy.has(token)) return { ok: false, reason: 'busy' };
    const bounds = zoneBounds(key), size = number(data.gridSize, 24);
    const snappedX = Math.round(Number(x) / size) * size, snappedY = Math.round(Number(y) / size) * size;
    const item = cleanStructure({ id: `barrier-${Date.now().toString(36)}-${(nextId++).toString(36)}`, kind: 'wood-barricade', zone: key, x: snappedX, y: snappedY, axis, health: definition.health });
    if (!item || !bounds) return { ok: false, reason: 'invalid-placement' };
    const snappedValidation = canPlace({ zone: key, x: item.x, y: item.y, axis, actor: me });
    if (!snappedValidation.ok) { nextId = Math.max(1, nextId - 1); return snappedValidation; }
    busy.add(token);
    structures.set(item.id, item);
    registerStructure(item);
    const result = items.commitItemExchange({ costs: { ...definition.cost }, grants: {} });
    if (!result?.ok) {
      structures.delete(item.id);
      spatial.unregisterGeometry(geometryId(item.id));
      nextId = Math.max(1, nextId - 1);
      busy.delete(token);
      return result || { ok: false, reason: 'inventory-unavailable' };
    }
    busy.delete(token);
    emit('abyssal:building-placed', item);
    refresh();
    return { ok: true, structure: { ...item } };
  }
  function nearest(actor = typeof me !== 'undefined' ? me : null, zone = currentZoneKey()) {
    if (!actor) return null;
    let target = null, distance = 86;
    for (const item of structures.values()) {
      if (item.zone !== String(zone)) continue;
      const d = Math.hypot(number(actor.x) - item.x, number(actor.y) - item.y);
      if (d < distance) { target = item; distance = d; }
    }
    return target ? { ...target, distance } : null;
  }
  function dismantle(id) {
    const item = structures.get(String(id || ''));
    if (!item || item.zone !== currentZoneKey() || Math.hypot(me.x - item.x, me.y - item.y) > 100) return { ok: false, reason: 'not-nearby' };
    if (busy.has(item.id)) return { ok: false, reason: 'busy' };
    busy.add(item.id);
    structures.delete(item.id);
    spatial.unregisterGeometry(geometryId(item.id));
    const result = items.commitItemExchange({ costs: {}, grants: { ...definition.refund } });
    if (!result?.ok) { structures.set(item.id, item); registerStructure(item); busy.delete(item.id); return result || { ok: false, reason: 'inventory-unavailable' }; }
    busy.delete(item.id);
    emit('abyssal:building-dismantled', item);
    refresh();
    return { ok: true, refund: { ...definition.refund } };
  }
  function emit(type, structure) {
    const event = { type, playerId: typeof SESSION_ID === 'string' ? SESSION_ID : '', zone: structure.zone, structureId: structure.id, kind: structure.kind, x: structure.x, y: structure.y };
    try { window.dispatchEvent(new CustomEvent(type, { detail: event })); } catch {}
  }
  function toastMessage(message) { try { if (typeof toast === 'function') toast(message); } catch {} }
  function statusText() {
    const inv = typeof inventory !== 'undefined' ? inventory : {};
    if (!buildMode) return `建造路障 · 木材 ${number(inv.wood)}/2 · 石料 ${number(inv.stone)}/1 · 点按或 V 开始`;
    return dismantleMode ? '拆除模式 · 点按或 E 拆除 · B 退出' : `建造模式 · 点按或 E 放置 · 木材 ${number(inv.wood)}/2 · 石料 ${number(inv.stone)}/1 · Q 拆除`;
  }
  function refresh() {
    if (!hud) return;
    hud.textContent = statusText();
    hud.dataset.active = String(buildMode);
    hud.style.background = buildMode ? '#9b7440' : '#15231ddf';
  }
  function toggleMode(force) {
    buildMode = typeof force === 'boolean' ? force : !buildMode;
    dismantleMode = false;
    refresh();
    toastMessage(buildMode ? '建造模式已开启：朝角色面前放置路障。' : '已退出建造模式。');
    return buildMode;
  }
  function toggleDismantle() {
    if (!buildMode) return false;
    dismantleMode = !dismantleMode;
    refresh();
    toastMessage(dismantleMode ? '拆除模式：靠近路障后按互动键。' : '建造模式：按互动键放置路障。');
    return true;
  }
  function placementInFront() {
    const angle = number(me?.dir, 0), dx = Math.cos(angle), dy = Math.sin(angle);
    const distance = number(data.placeDistance, 88), size = number(data.gridSize, 24);
    const axis = Math.abs(dx) >= Math.abs(dy) ? 'y' : 'x';
    const x = Math.round((me.x + dx * distance) / size) * size;
    const y = Math.round((me.y + dy * distance) / size) * size;
    return placeAt(x, y, axis, currentZoneKey());
  }
  function performAction() {
    if (dismantleMode) {
      const target = nearest();
      const result = target ? dismantle(target.id) : { ok: false, reason: 'not-nearby' };
      toastMessage(result.ok ? '路障已拆除 · 返还木材 ×1' : '靠近已建好的路障再拆除。');
      refresh();
      return true;
    }
    const result = placementInFront();
    if (result.ok) toastMessage('木制路障已放下，怪物会被它挡住。');
    else if (result.reason === 'materials-required') toastMessage('建造路障需要木材 ×2、石料 ×1。');
    else if (result.reason === 'occupied' || result.reason?.includes?.('overlap')) toastMessage('这里被地形、设施或角色占着，换个位置再放。');
    else if (result.reason === 'zone-full') toastMessage('这片区域的路障太多了。');
    else if (result.reason === 'save-failed') toastMessage('路障没有保存成功，材料已返还。');
    else toastMessage('这里放不下路障，朝空地再试一次。');
    refresh();
    return true;
  }
  function doInteraction(event) {
    if (!buildMode || event.target === hud || event.target?.closest?.('[data-home-building-toggle]')) return false;
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    return performAction();
  }
  function onKeyDown(event) {
    if (!event || event.target?.matches?.('input,textarea,[contenteditable="true"]')) return;
    const key = String(event.key || '').toLowerCase();
    if (key === 'v' && !event.repeat && started && !dead) { event.preventDefault(); event.stopImmediatePropagation(); toggleMode(); return; }
    if (!buildMode) return;
    if (key === 'q' && !event.repeat) { event.preventDefault(); event.stopImmediatePropagation(); toggleDismantle(); return; }
    if ((key === 'e' || key === 'enter') && !event.repeat) doInteraction(event);
    if (key === 'escape') toggleMode(false);
  }
  function mountHud() {
    if (hud || !globalThis.document?.body || !started) return;
    hud = document.createElement('button');
    hud.type = 'button';
    hud.dataset.homeBuildingToggle = 'true';
    hud.setAttribute('aria-label', '切换建造模式');
    Object.assign(hud.style, { position: 'fixed', zIndex: '1200', top: '12px', right: '12px', maxWidth: 'min(320px, calc(100vw - 24px))', padding: '8px 10px', border: '1px solid #b7c59b', borderRadius: '6px', color: '#f1edd8', background: '#15231ddf', font: 'bold 11px ui-monospace,monospace', textAlign: 'left', cursor: 'pointer', pointerEvents: 'auto' });
    hud.addEventListener('click', () => { if (!buildMode) toggleMode(true); else performAction(); });
    document.body.appendChild(hud);
    refresh();
  }
  window.addEventListener('keydown', onKeyDown, true);
  const interactionButton = document.getElementById('interactV12');
  interactionButton?.addEventListener('pointerdown', doInteraction, true);
  mountHud();
  setInterval(() => { if (!hud && started) mountHud(); refresh(); }, 500);

  globalThis.ABYSSAL_HOME_BUILDING_V1 = Object.freeze({
    version: 1,
    definition: Object.freeze({ ...definition, cost: Object.freeze({ ...definition.cost }), refund: Object.freeze({ ...definition.refund }) }),
    getSnapshot: all,
    snapshot,
    snapshotForZone,
    applyRemoteZoneSnapshot,
    canPlace,
    placeAt,
    nearest,
    dismantle,
    setBuildMode: toggleMode,
    isBuildMode: () => buildMode,
    isDismantleMode: () => dismantleMode
  });
})();
