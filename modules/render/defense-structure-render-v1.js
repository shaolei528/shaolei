(() => {
  'use strict';

  if (globalThis.ABYSSAL_DEFENSE_STRUCTURE_RENDER_V1?.version === 1) return;
  function polygon(ctx, points, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(Math.round(points[0].x), Math.round(points[0].y));
    for (let i = 1; i < points.length; i++) ctx.lineTo(Math.round(points[i].x), Math.round(points[i].y));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function draw(ctx, project, item, selected = false) {
    if (!ctx || typeof project !== 'function' || !item || item.kind !== 'wood-barricade') return false;
    const alongX = item.axis === 'x', width = alongX ? 64 : 20, depth = alongX ? 20 : 64, height = 13;
    const world = [
      { x: item.x - width / 2, y: item.y - depth / 2 },
      { x: item.x + width / 2, y: item.y - depth / 2 },
      { x: item.x + width / 2, y: item.y + depth / 2 },
      { x: item.x - width / 2, y: item.y + depth / 2 }
    ];
    const ground = world.map(point => project(point.x, point.y));
    const top = ground.map(point => ({ x: point.x, y: point.y - height }));
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#10191355';
    ctx.beginPath();
    ctx.ellipse(Math.round(project(item.x, item.y).x), Math.round(project(item.x, item.y).y + 3), alongX ? 23 : 9, alongX ? 8 : 20, 0, 0, Math.PI * 2);
    ctx.fill();
    polygon(ctx, [ground[2], ground[3], top[3], top[2]], '#594333', selected ? '#f0d58b' : '#72563c');
    polygon(ctx, [ground[1], ground[2], top[2], top[1]], '#49382d');
    polygon(ctx, top, '#9a754a', selected ? '#f4d795' : '#4b3d2d');
    for (let index = 0; index < 4; index++) {
      const t = (index + 1) / 5;
      const a = top[0], b = top[1];
      if (!alongX) { const p = top[index]; ctx.fillStyle = index % 2 ? '#604832' : '#725438'; ctx.fillRect(Math.round(p.x - 2), Math.round(p.y - 2), 4, 5); }
      else { const x = Math.round(a.x + (b.x - a.x) * t); ctx.fillStyle = index % 2 ? '#745237' : '#60442f'; ctx.fillRect(x - 2, Math.round(a.y - 1), 3, 8); }
    }
    ctx.restore();
    return true;
  }
  globalThis.ABYSSAL_DEFENSE_STRUCTURE_RENDER_V1 = Object.freeze({ version: 1, draw });
})();
