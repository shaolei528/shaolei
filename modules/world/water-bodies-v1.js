(() => {
  'use strict';
  if (globalThis.ABYSSAL_WATER_BODIES_V1?.version === 1) return;
  const config = globalThis.ABYSSAL_WATER_BODIES_CONFIG_V1;
  const spatial = globalThis.ABYSSAL_WORLD_SPATIAL_V1;
  if (config?.version !== 1 || !Array.isArray(config.bodies) || !spatial || typeof CAMP === 'undefined') {
    throw new Error('World Water V1 requires body data, Camp anchor and World Spatial.');
  }

  const bodies = new Map();
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  for (const def of config.bodies) {
    const id = String(def?.id || ''), zone = String(def?.zone || '');
    if (!/^[a-z0-9-]{1,48}$/.test(id) || !/^\d+:\d+$/.test(zone) || !['camp', 'world'].includes(def.anchor)) throw new Error(`Invalid water body: ${id || '(unnamed)'}`);
    let cx, cy;
    if (def.anchor === 'camp') {
      cx = finite(CAMP.x) + finite(def.offset?.x);
      cy = finite(CAMP.y) + finite(def.offset?.y);
    } else {
      cx = Number(def.position?.x); cy = Number(def.position?.y);
      if (![cx, cy].every(Number.isFinite)) throw new Error(`World water body ${id} requires a finite position.`);
      const zoneSize = typeof WORLD !== 'undefined' ? Number(WORLD.zone) : 0;
      if (Number.isFinite(zoneSize) && zoneSize > 0) {
        const expectedZone = `${Math.floor(cx / zoneSize)}:${Math.floor(cy / zoneSize)}`;
        if (zone !== expectedZone) throw new Error(`World water body ${id} is assigned to ${zone}, but its position belongs to ${expectedZone}.`);
      }
    }
    const halfWidth = Math.max(8, finite(def.halfWidth, 54)), halfHeight = Math.max(8, finite(def.halfHeight, 54));
    const collisionPadding = Math.max(0, Math.min(128, finite(def.collisionPadding, 0)));
    const bounds = {
      x: cx - halfWidth - collisionPadding,
      y: cy - halfHeight - collisionPadding,
      w: (halfWidth + collisionPadding) * 2,
      h: (halfHeight + collisionPadding) * 2
    };
    let access = null;
    if (def.accessPoint) {
      const offset = def.accessPoint.offset || {};
      const accessX = cx + finite(offset.x), accessY = cy + finite(offset.y);
      const clearanceX = Math.max(bounds.x - accessX, 0, accessX - (bounds.x + bounds.w));
      const clearanceY = Math.max(bounds.y - accessY, 0, accessY - (bounds.y + bounds.h));
      const accessClearance = Math.hypot(clearanceX, clearanceY);
      const minAccessClearance = Math.max(0, finite(def.accessPoint.minClearance, 48));
      if (accessClearance < minAccessClearance) throw new Error(`Water body ${id} access point is too close to its dry bank (${Math.round(accessClearance)} < ${minAccessClearance}).`);
      access = { x: accessX, y: accessY, interactionRange: Math.max(24, finite(def.accessPoint.interactionRange, 54)) };
    }
    const body = {
      id, zone, cx, cy, halfWidth, halfHeight, collisionPadding, surface: String(def.surface || 'water'), access
    };
    spatial.registerGeometry({
      id: `water-body:${id}`, zone,
      colliders: [{ id: `${id}:water`, kind: 'water', ...bounds }]
    });
    bodies.set(id, body);
  }

  const clone = body => body ? { ...body, access: body.access ? { ...body.access } : null } : null;
  function getBody(id) { return clone(bodies.get(String(id || ''))); }
  function getAccessPoint(id) { return clone(bodies.get(String(id || '')))?.access || null; }
  function isInWater(zone, x, y) {
    for (const body of bodies.values()) {
      if (body.zone !== String(zone)) continue;
      if (x >= body.cx - body.halfWidth && y >= body.cy - body.halfHeight && x < body.cx + body.halfWidth && y < body.cy + body.halfHeight) return true;
    }
    return false;
  }

  function blockedByBody(body, px, py, radius) {
    const halfWidth = body.halfWidth + body.collisionPadding;
    const halfHeight = body.halfHeight + body.collisionPadding;
    const closestX = Math.max(body.cx - halfWidth, Math.min(px, body.cx + halfWidth));
    const closestY = Math.max(body.cy - halfHeight, Math.min(py, body.cy + halfHeight));
    const dx = px - closestX, dy = py - closestY;
    return dx * dx + dy * dy <= radius * radius;
  }

  function normalizedCircle(x, y, radius) {
    const px = Number(x), py = Number(y), rawRadius = Number(radius);
    if (![px, py, rawRadius].every(Number.isFinite)) return null;
    return { px, py, radius: Math.max(0, Math.min(18, rawRadius)) };
  }

  function isBlockedCircle(zone, x, y, radius = 10) {
    const circle = normalizedCircle(x, y, radius);
    if (!circle) return true;
    for (const body of bodies.values()) {
      if (body.zone === String(zone) && blockedByBody(body, circle.px, circle.py, circle.radius)) return true;
    }
    return false;
  }

  // Movement uses global world coordinates. A body's visual footprint can
  // extend across a zone seam even though its center belongs to one zone.
  function isBlockedWorldCircle(x, y, radius = 10) {
    const circle = normalizedCircle(x, y, radius);
    if (!circle) return true;
    for (const body of bodies.values()) {
      if (blockedByBody(body, circle.px, circle.py, circle.radius)) return true;
    }
    return false;
  }

  globalThis.ABYSSAL_WATER_BODIES_V1 = Object.freeze({ version: 1, getBody, getAccessPoint, isInWater, isBlockedCircle, isBlockedWorldCircle, snapshot: () => [...bodies.values()].map(clone) });
})();
