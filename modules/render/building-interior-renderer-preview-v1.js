(() => {
  'use strict';
  if (window.AW_SUCCESSOR_PREVIEW !== true || window.AW_DEV_QA !== true || window.AW_SUCCESSOR_GRAYBOX_BUILDING !== true) return;
  const layout = window.AW_MIRE_MART_INTERIOR_LAYOUT_PREVIEW_V1;
  if (!layout || window.ABYSSAL_BUILDING_RENDERER_PREVIEW_V1) return;
  const ROOM = Object.freeze({ ...layout.room });
  const SCALE_FROM_STORE = Number(layout.scaleFromStore) || 1.4;
  const doorCenter = (ROOM.doorLeft + ROOM.doorRight) / 2;
  const doorInsideY = ROOM.height - 64;
  const cabinet = layout.cabinet;
  let state = {};
  function distance(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
  function polygon(ctx, points, fill, stroke = '') {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(Math.round(points[0].x), Math.round(points[0].y));
    for (let index = 1; index < points.length; index++) ctx.lineTo(Math.round(points[index].x), Math.round(points[index].y));
    ctx.closePath(); ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function worldBox(ctx, project, rect, height, palette = ['#6c746c', '#515a55', '#3c4541']) {
    const a = project(rect.x, rect.y), b = project(rect.x + rect.w, rect.y), c = project(rect.x + rect.w, rect.y + rect.h), d = project(rect.x, rect.y + rect.h);
    const lift = Number(height) || 28;
    const at = point => ({ x: point.x, y: point.y - lift });
    const ta = at(a), tb = at(b), tc = at(c), td = at(d);
    polygon(ctx, [d, c, tc, td], palette[2]);
    polygon(ctx, [b, c, tc, tb], palette[1]);
    polygon(ctx, [ta, tb, tc, td], palette[0], '#303934');
    return { a, b, c, d, ta, tb, tc, td };
  }
  function roomObjects(ctx, project) {
    const objects = layout.objects.slice().sort((left, right) => left.x + left.y - right.x - right.y || left.id.localeCompare(right.id));
    for (const item of objects) {
      const faces = worldBox(ctx, project, item, item.lift, item.colors);
      if (item.id.startsWith('shelf')) {
        const center = project(item.x + item.w / 2, item.y + item.h / 2);
        ctx.fillStyle = '#a5aa9e'; ctx.fillRect(Math.round(center.x - 16), Math.round(center.y - item.lift + 4), 32, 3);
        ctx.fillStyle = '#555e58'; ctx.fillRect(Math.round(faces.ta.x + 5), Math.round(faces.ta.y + 7), 4, 4);
        ctx.fillRect(Math.round(faces.tb.x - 9), Math.round(faces.tb.y + 7), 4, 4);
      }
      if (item.id === 'counter') {
        const point = project(item.x + item.w * .70, item.y + item.h * .65);
        ctx.fillStyle = '#343d38'; ctx.fillRect(Math.round(point.x - 12), Math.round(point.y - 35), 24, 14);
        ctx.fillStyle = '#959b8e'; ctx.fillRect(Math.round(point.x - 8), Math.round(point.y - 32), 16, 2);
      }
    }
  }
  function drawGrayboxExterior({ ctx, width, height, project, store, entrance, player, preserveBackground = false }) {
    if (!store || !entrance) return;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    const x = store.x, y = store.y, right = x + store.w, bottom = y + store.h, lift = 74;
    const p = (wx, wy, z = 0) => { const point = project(wx, wy); return { x: point.x, y: point.y - z }; };
    if (!preserveBackground) { ctx.fillStyle = layout.materials.outside; ctx.fillRect(0, 0, width, height); }
    const floor = [p(x, y), p(right, y), p(right, bottom), p(x, bottom)];
    polygon(ctx, floor, '#747b73', '#c0c2b5');
    const local = (lx, ly, z = 0) => p(x + lx / SCALE_FROM_STORE, y + ly / SCALE_FROM_STORE, z / SCALE_FROM_STORE);
    const projectLocal = (lx, ly) => local(lx, ly, 0);
    roomObjects(ctx, projectLocal);
    const wall = (a, b, shade) => {
      const pa = p(a.x, a.y), pb = p(b.x, b.y), ta = { x: pa.x, y: pa.y - lift }, tb = { x: pb.x, y: pb.y - lift };
      polygon(ctx, [pa, pb, tb, ta], shade, '#414a45');
      ctx.fillStyle = '#a0a397'; ctx.beginPath(); ctx.moveTo(ta.x, ta.y); ctx.lineTo(tb.x, tb.y); ctx.lineTo(tb.x, tb.y + 3); ctx.lineTo(ta.x, ta.y + 3); ctx.closePath(); ctx.fill();
    };
    wall({ x, y }, { x: right, y }, '#68716b');
    wall({ x: right, y }, { x: right, y: bottom }, '#535c56');
    wall({ x, y: bottom }, { x: entrance.x, y: bottom }, '#59625c');
    wall({ x: entrance.x + entrance.w, y: bottom }, { x: right, y: bottom }, '#59625c');
    wall({ x, y: bottom }, { x, y }, '#626b64');
    const doorA = p(entrance.x, bottom), doorB = p(entrance.x + entrance.w, bottom), doorTopA = { x: doorA.x, y: doorA.y - lift + 6 }, doorTopB = { x: doorB.x, y: doorB.y - lift + 6 };
    polygon(ctx, [doorA, doorB, doorTopB, doorTopA], '#303936', '#9da397');
    ctx.fillStyle = '#a9b09f'; ctx.fillRect(Math.round(doorA.x + 3), Math.round(doorTopA.y), 3, Math.max(1, Math.round(lift - 7)));
    ctx.fillRect(Math.round(doorB.x - 6), Math.round(doorTopB.y), 3, Math.max(1, Math.round(lift - 7)));
    if (player && Math.hypot(player.x - (entrance.x + entrance.w / 2), player.y - entrance.y - 18) < 110) {
      const label = 'E 进入室内'; ctx.font = 'bold 10px ui-monospace,monospace'; ctx.textAlign = 'center';
      const point = p(entrance.x + entrance.w / 2, entrance.y - 14);
      ctx.fillStyle = '#202723'; const w = ctx.measureText(label).width + 16; ctx.fillRect(Math.round(point.x - w / 2), Math.round(point.y - 14), w, 19);
      ctx.strokeStyle = '#aeb5a5'; ctx.strokeRect(Math.round(point.x - w / 2) + .5, Math.round(point.y - 13.5), w - 1, 18);
      ctx.fillStyle = '#eceee2'; ctx.fillText(label, Math.round(point.x), Math.round(point.y));
    }
    ctx.restore();
  }
  function drawActor(ctx, point, moving, now, drawPixelActor, row = 0) {
    const x = Math.round(point.x), y = Math.round(point.y);
    if (typeof drawPixelActor === 'function') {
      const tick = Math.floor((Number(now) || 0) / 140), frame = moving ? (tick % 4 === 0 ? 0 : 1 + ((tick - 1) % 3)) : 0;
      drawPixelActor(ctx, { x, y, row, frame });
      return;
    }
    ctx.fillStyle = '#19201d88'; ctx.beginPath(); ctx.ellipse(x, y - 1, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
    const stride = moving ? Math.round(Math.sin(now / 75) * 2) : 0;
    ctx.fillStyle = '#343b37'; ctx.fillRect(x - 5, y - 11 + stride, 4, 10); ctx.fillRect(x + 1, y - 11 - stride, 4, 10);
    ctx.fillStyle = '#757f75'; ctx.fillRect(x - 7, y - 25, 14, 15);
    ctx.fillStyle = '#9b9a84'; ctx.fillRect(x - 5, y - 34, 10, 9);
    ctx.fillStyle = '#414941'; ctx.fillRect(x - 6, y - 36, 12, 5); ctx.fillRect(x - 7, y - 32, 3, 4);
    ctx.fillStyle = '#b6a987'; ctx.fillRect(x - 7, y - 24, 3, 7);
  }
  function drawInterior({ ctx, width, height, project, now = 0, drawPlayer, row = 0 }) {
    const W = Math.max(1, Math.round(width)), H = Math.max(1, Math.round(height));
    const zoom = Math.max(.68, Math.min(1.22, Math.min(W / 530, H / 330)));
    const center = project(state.x, state.y);
    const localProject = (x, y, lift = 0) => {
      const raw = project(x, y);
      return { x: Math.round(W / 2 + (raw.x - center.x) * zoom), y: Math.round(H * .54 + (raw.y - center.y) * zoom - lift * zoom) };
    };
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#303733'; ctx.fillRect(0, 0, W, H);
    const floorPoints = [[0, 0], [ROOM.width, 0], [ROOM.width, ROOM.height], [0, ROOM.height]].map(([x, y]) => localProject(x, y));
    polygon(ctx, floorPoints, layout.materials.floor, layout.materials.floorEdge);
    // A single continuous floor plane keeps the prototype focused on room scale and collision.
    const floorLineA = localProject(ROOM.width * .5, 20), floorLineB = localProject(ROOM.width * .5, ROOM.height - 28);
    ctx.strokeStyle = layout.materials.pathMark; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(floorLineA.x, floorLineA.y); ctx.lineTo(floorLineB.x, floorLineB.y); ctx.stroke();

    const north = { x: 0, y: 0, w: ROOM.width, h: ROOM.wall, lift: 102, colors: layout.materials.northWall };
    const east = { x: ROOM.width - ROOM.wall, y: 0, w: ROOM.wall, h: ROOM.height, lift: 102, colors: layout.materials.eastWall };
    worldBox(ctx, localProject, north, north.lift, north.colors);
    worldBox(ctx, localProject, east, east.lift, east.colors);
    roomObjects(ctx, localProject);
    const actorPoint = localProject(state.x, state.y);
    drawActor(ctx, actorPoint, state.moving, now, drawPlayer, row);
    const west = { x: 0, y: 0, w: ROOM.wall, h: ROOM.height, lift: 53, colors: layout.materials.westWall };
    const southLeft = { x: 0, y: ROOM.height - ROOM.wall, w: ROOM.doorLeft, h: ROOM.wall, lift: 53, colors: ['#777f76', '#525b55', '#424b46'] };
    const southRight = { x: ROOM.doorRight, y: ROOM.height - ROOM.wall, w: ROOM.width - ROOM.doorRight, h: ROOM.wall, lift: 53, colors: ['#777f76', '#525b55', '#424b46'] };
    worldBox(ctx, localProject, west, west.lift, west.colors);
    worldBox(ctx, localProject, southLeft, southLeft.lift, southLeft.colors);
    worldBox(ctx, localProject, southRight, southRight.lift, southRight.colors);
    const doorA = localProject(ROOM.doorLeft, ROOM.height - 1), doorB = localProject(ROOM.doorRight, ROOM.height - 1);
    ctx.fillStyle = '#aeb19f'; ctx.fillRect(doorA.x - 2, doorA.y - 7, 4, 10); ctx.fillRect(doorB.x - 2, doorB.y - 7, 4, 10);

    ctx.fillStyle = '#e4e5d9'; ctx.font = 'bold 10px ui-monospace,monospace'; ctx.textAlign = 'left';
    ctx.fillText('MIRE MART  /  室内灰盒', 14, 20);
    ctx.fillStyle = '#b9beb1'; ctx.font = '8px ui-monospace,monospace';
    ctx.fillText(`碰撞 ${state.blocked ? 'BLOCKED' : 'READY'} · ${state.searched ? '柜台已检查' : '场景与存档隔离'}`, 14, 34);
    const atDoor = distance(state.x, state.y, doorCenter, doorInsideY) < 72;
    const atCabinet = distance(state.x, state.y, cabinet.x, cabinet.y) < cabinet.range;
    const prompt = atDoor ? 'E 返回街面 · WASD / 摇杆移动' : atCabinet ? (state.searched ? 'E 再看交班纸 · 走回门口返回' : 'E 检查柜台 · WASD / 摇杆移动') : 'WASD / 摇杆移动 · E 互动';
    const boxWidth = Math.min(W - 20, Math.ceil(ctx.measureText(prompt).width) + 18), boxX = Math.round((W - boxWidth) / 2), boxY = H - 29;
    ctx.fillStyle = '#202723'; ctx.fillRect(boxX, boxY, boxWidth, 20); ctx.strokeStyle = atDoor || atCabinet ? '#b7bbaa' : '#7d867d'; ctx.strokeRect(boxX + .5, boxY + .5, boxWidth - 1, 19);
    ctx.fillStyle = '#eceee2'; ctx.textAlign = 'center'; ctx.font = 'bold 8px ui-monospace,monospace'; ctx.fillText(prompt, W / 2, boxY + 13);
    if (state.message) {
      const messageWidth = Math.min(W - 24, Math.ceil(ctx.measureText(state.message).width) + 18), messageX = Math.round((W - messageWidth) / 2);
      ctx.fillStyle = '#252c28'; ctx.fillRect(messageX, 46, messageWidth, 20); ctx.strokeStyle = '#858d82'; ctx.strokeRect(messageX + .5, 46.5, messageWidth - 1, 19);
      ctx.fillStyle = '#e2e3d8'; ctx.font = '8px ui-monospace,monospace'; ctx.fillText(state.message, W / 2, 59);
    }
    ctx.restore();
  }


  window.ABYSSAL_BUILDING_RENDERER_PREVIEW_V1 = Object.freeze({
    drawInterior(args, currentState) { state = currentState; return drawInterior(args); },
    drawGrayboxExterior,
  });
})();
