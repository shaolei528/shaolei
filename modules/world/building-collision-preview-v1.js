(() => {
  'use strict';
  if (window.AW_SUCCESSOR_PREVIEW !== true || window.AW_DEV_QA !== true || window.AW_SUCCESSOR_GRAYBOX_BUILDING !== true) return;

  function nearRect(x, y, rect, radius) {
    const dx = Math.max(rect.x - x, 0, x - rect.x - rect.w);
    const dy = Math.max(rect.y - y, 0, y - rect.y - rect.h);
    return dx * dx + dy * dy < radius * radius;
  }
  function createResolver(layout) {
    const room = layout.room;
    const blockers = layout.blockers;
    function collides(x, y, radius = 11) {
      const inDoorway = x >= room.doorLeft + radius && x <= room.doorRight - radius;
      if (x < room.wall + radius || x > room.width - room.wall - radius || y < room.wall + radius) return true;
      if (y > room.height - room.wall - radius && !inDoorway) return true;
      if (y > room.height - 6) return true;
      return blockers.some(rect => nearRect(x, y, rect, radius));
    }
    function resolveMove(fromX, fromY, dx, dy) {
      const distance = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(distance / 5));
      const sx = dx / steps, sy = dy / steps;
      let x = fromX, y = fromY, blocked = false;
      for (let index = 0; index < steps; index++) {
        if (!collides(x + sx, y + sy)) { x += sx; y += sy; continue; }
        blocked = true;
        let slid = false;
        if (Math.abs(sx) > 0.001 && !collides(x + sx, y)) { x += sx; slid = true; }
        if (Math.abs(sy) > 0.001 && !collides(x, y + sy)) { y += sy; slid = true; }
        if (!slid) break;
      }
      return { x, y, blocked };
    }
    return Object.freeze({ collides, resolveMove });
  }
  window.ABYSSAL_BUILDING_COLLISION_PREVIEW_V1 = Object.freeze({ version: 1, createResolver });
})();
