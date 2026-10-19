(() => {
  'use strict';

  const palette = {
    ink: '#4d3a30', inkDeep: '#362f2a', hair: '#704a34', hairLight: '#956344',
    skin: '#e5bd91', skinLight: '#f2d4a9', coat: '#788b5f', coatShade: '#596f4a',
    scarf: '#b85f4c', scarfLight: '#d47b5d', pack: '#c69c55', packShade: '#967143',
    pants: '#626253', boot: '#493a31', tide: '#78b7aa'
  };

  function hash(col, row, salt = 0) {
    let value = (Math.imul(col + salt, 374761393) ^ Math.imul(row - salt, 668265263)) | 0;
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return (value ^ (value >>> 16)) >>> 0;
  }

  function pixel(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), width, height);
  }

  function clipCells(ctx, api, ids, project) {
    const { originX, originY, cols, rows } = api.slice;
    const size = api.tileSize;
    const cells = [];
    ctx.beginPath();
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tile = api.tileAtCell(col, row);
        if (!ids.has(tile)) continue;
        const center = project(originX + col * size + size / 2, originY + row * size + size / 2);
        // A subpixel overlap keeps adjacent world cells from exposing the
        // harbor/backdrop color through antialiased diamond edges.
        const halfW = size / 2 + 0.75;
        const halfH = size / 4 + 0.5;
        ctx.moveTo(center.x, center.y - halfH);
        ctx.lineTo(center.x + halfW, center.y);
        ctx.lineTo(center.x, center.y + halfH);
        ctx.lineTo(center.x - halfW, center.y);
        ctx.closePath();
        cells.push({ col, row, center });
      }
    }
    return cells;
  }

  function drawMaterial(ctx, api, ids, project, width, height, style) {
    const cells = clipCells(ctx, api, ids, project);
    if (!cells.length) return;
    ctx.save();
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = style.base;
    ctx.fillRect(0, 0, width, height);

    const size = api.tileSize;
    for (const { col, row } of cells) {
      const seed = hash(col, row, style.salt);
      if ((seed & style.skipMask) !== 0) continue;
      const worldX = api.slice.originX + col * size + 8 + ((seed >>> 5) % (size - 16));
      const worldY = api.slice.originY + row * size + 8 + ((seed >>> 13) % (size - 16));
      const point = project(worldX, worldY);
      const x = Math.round(point.x);
      const y = Math.round(point.y);

      if (style.kind === 'grass') {
        const cluster = 10 + ((seed >>> 21) & 6), tuftHeight = 3 + ((seed >>> 18) & 1);
        pixel(ctx, x, y, cluster, 2, style.shade);
        pixel(ctx, x + 1, y - 2, cluster - 2, tuftHeight, (seed & 8) ? style.light : style.shade);
        pixel(ctx, x + 3, y - 4, Math.max(3, cluster - 7), 2, style.light);
        pixel(ctx, x + cluster - 4, y, 2, 2, style.light);
        if ((seed & 31) === 3) {
          pixel(ctx, x + cluster - 3, y - 5, 2, 1, '#f0dfaa');
          pixel(ctx, x + cluster - 1, y - 4, 1, 1, '#d58879');
        }
      } else if (style.kind === 'water') {
        const length = 4 + ((seed >>> 9) & 3);
        pixel(ctx, x, y, length, 1, (seed & 4) ? style.light : style.shade);
        if ((seed & 7) === 2) pixel(ctx, x + 3, y + 2, 3, 1, style.light);
      } else if (style.kind === 'sand') {
        pixel(ctx, x, y, 2 + (seed & 1), 1, (seed & 4) ? style.light : style.shade);
      } else if (style.kind === 'road' && (seed & 3) === 0) {
        pixel(ctx, x, y, 2 + (seed & 1), 1, (seed & 4) ? style.light : style.shade);
      }
    }

    // All road diamonds already share one clipped surface. Per-cell edge
    // strokes turned their connected border into a visible tiled staircase.
    ctx.restore();
  }

  function drawCoastJoin(ctx, api, sand, water, project) {
    const { originX, originY, cols, rows } = api.slice;
    const size = api.tileSize, halfW = size / 2, halfH = size / 4;
    const edges = [
      { dc: 1, dr: 0, a: [halfW, 0], b: [0, halfH] },
      { dc: 0, dr: 1, a: [0, halfH], b: [-halfW, 0] },
      { dc: -1, dr: 0, a: [-halfW, 0], b: [0, -halfH] },
      { dc: 0, dr: -1, a: [0, -halfH], b: [halfW, 0] }
    ];
    ctx.save();ctx.imageSmoothingEnabled=false;
    for (let row=0;row<rows;row++) for (let col=0;col<cols;col++) {
      if(!sand.has(api.tileAtCell(col,row)))continue;
      const center=project(originX+(col+.5)*size,originY+(row+.5)*size);
      for(let side=0;side<edges.length;side++){
        const edge=edges[side],nc=col+edge.dc,nr=row+edge.dr;
        if(nc<0||nr<0||nc>=cols||nr>=rows||!water.has(api.tileAtCell(nc,nr)))continue;
        const waterCenter=project(originX+(nc+.5)*size,originY+(nr+.5)*size),towardX=center.x-waterCenter.x,towardY=center.y-waterCenter.y,length=Math.hypot(towardX,towardY)||1,dx=towardX/length,dy=towardY/length,seed=hash(col,row,173+side);
        // Lapped foam and wet-sand flecks soften the authored grid edge while
        // leaving its collision and shoreline cells untouched.
          for(let mark=0;mark<6;mark++){
            const jitter=((seed>>>(mark*3))&7)*.012,t=.08+mark*.16+jitter,bx=center.x+(edge.a[0]+(edge.b[0]-edge.a[0])*t),by=center.y+(edge.a[1]+(edge.b[1]-edge.a[1])*t),x=Math.round(bx),y=Math.round(by),waterOffset=3+((seed>>>(mark+11))&5),sandOffset=3+((seed>>>(mark+17))&5),foamWidth=3+((seed>>>(mark+9))&5),foamHeight=mark%3===0?2:1;
           // Sparse overlapping foam and damp-sand clusters soften the coarse
           // diamond shoreline into a hand-placed pixel coast, without blur.
            pixel(ctx,Math.round(x-dx*waterOffset),Math.round(y-dy*waterOffset),foamWidth,foamHeight,mark%3===0?'#bfc6a7':'#aab9aa');
            if(((seed>>>(mark+5))&3)===1){const lipX=Math.round(x-dx*(waterOffset+2)),lipY=Math.round(y-dy*(waterOffset+2));pixel(ctx,lipX,lipY,2+((seed>>>(mark+21))&3),1,'#c3a875')}
            if((seed&(1<<mark))!==0){const wetX=Math.round(x+dx*sandOffset),wetY=Math.round(y+dy*sandOffset);pixel(ctx,wetX,wetY,3+((seed>>>(mark+6))&3),1,'#aa8e65');if((seed>>>(mark+23))&1)pixel(ctx,wetX+2,wetY+2,2,1,'#c0aa7c')}
            if(((seed+mark*3)&3)===1)pixel(ctx,Math.round(x-dx*(waterOffset+5)),Math.round(y-dy*(waterOffset+5)),4+((seed>>>(mark+4))&3),1,'#96aaa0');
        }
      }
    }
    ctx.restore();
  }

  function drawGrassSandTransition(ctx, api, terrain, project) {
    const { originX, originY, cols, rows } = api.slice;
    const size = api.tileSize, halfW = size / 2, halfH = size / 4;
    const transitions = new Map([
      [terrain.tile.grass_to_sand_e, { dc: 1, dr: 0 }],
      [terrain.tile.grass_to_sand_w, { dc: -1, dr: 0 }]
    ]);
    const edges = [
      { dc: 1, a: [halfW, 0], b: [0, halfH] },
      { dc: -1, a: [-halfW, 0], b: [0, -halfH] }
    ];
    ctx.save();ctx.imageSmoothingEnabled=false;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const side=transitions.get(api.tileAtCell(col,row));
      if(!side)continue;
      const nc=col+side.dc,nr=row+side.dr;
      if(nc<0||nr<0||nc>=cols||nr>=rows)continue;
      const adjacent=api.tileAtCell(nc,nr);
      if(![terrain.tile.sand_a,terrain.tile.sand_b,terrain.tile.sand_pebbles,
        terrain.tile.shore_n,terrain.tile.shore_s,terrain.tile.shore_e,terrain.tile.shore_w,
        terrain.tile.shore_ne,terrain.tile.shore_nw,terrain.tile.shore_se,terrain.tile.shore_sw].includes(adjacent))continue;
      const edge=edges.find(candidate=>candidate.dc===side.dc),center=project(originX+(col+.5)*size,originY+(row+.5)*size),neighbor=project(originX+(nc+.5)*size,originY+(nr+.5)*size);
      const dx=neighbor.x-center.x,dy=neighbor.y-center.y,length=Math.hypot(dx,dy)||1,nx=-dx/length,ny=-dy/length;
      const a={x:center.x+edge.a[0],y:center.y+edge.a[1]},b={x:center.x+edge.b[0],y:center.y+edge.b[1]},seed=hash(col,row,557+side.dc);
      for(let mark=0;mark<6;mark++){
        if(((seed>>>(mark*3))&3)===0)continue;
        const jitter=((seed>>>(mark+19))&3)*.012,t=.08+mark*.16+jitter,x=Math.round(a.x+(b.x-a.x)*t),y=Math.round(a.y+(b.y-a.y)*t),grassOffset=2+((seed>>>(mark+7))&2),sandOffset=1+((seed>>>(mark+13))&2);
        pixel(ctx,Math.round(x+nx*grassOffset),Math.round(y+ny*grassOffset),2+((seed>>>(mark+4))&2),1,'#788b5c');
        pixel(ctx,Math.round(x-nx*sandOffset),Math.round(y-ny*sandOffset),2+((seed>>>(mark+10))&2),1,'#b79a68');
        if((seed&31)===mark)pixel(ctx,Math.round(x+nx*3),Math.round(y+ny*3),2,1,'#a0aa70');
      }
    }
    ctx.restore();
  }

  function drawStreetCurb(ctx, api, road, softGround, project) {
    const { originX, originY, cols, rows } = api.slice;
    const size = api.tileSize, halfW = size / 2, halfH = size / 4;
    const edges = [
      { dc: 1, dr: 0, a: [halfW, 0], b: [0, halfH] },
      { dc: 0, dr: 1, a: [0, halfH], b: [-halfW, 0] },
      { dc: -1, dr: 0, a: [-halfW, 0], b: [0, -halfH] },
      { dc: 0, dr: -1, a: [0, -halfH], b: [halfW, 0] }
    ];
    // Break the source grid's straight path edge with a few stable pixel tufts.
    // No per-cell outline: grass and warm soil overlap across their shared edge.
    ctx.save();ctx.imageSmoothingEnabled=false;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      if(!road.has(api.tileAtCell(col,row)))continue;
      const center=project(originX+(col+.5)*size,originY+(row+.5)*size);
      for(let side=0;side<edges.length;side++){
        const edge=edges[side];
        const nc=col+edge.dc,nr=row+edge.dr;
        if(nc<0||nr<0||nc>=cols||nr>=rows||!softGround.has(api.tileAtCell(nc,nr)))continue;
        const grassCenter=project(originX+(nc+.5)*size,originY+(nr+.5)*size),length=Math.hypot(grassCenter.x-center.x,grassCenter.y-center.y)||1,dx=(grassCenter.x-center.x)/length,dy=(grassCenter.y-center.y)/length,seed=hash(col,row,401+side);
        for(let mark=0;mark<5;mark++){
          const jitter=((seed>>>(mark*4))&7)*.018,t=.08+mark*.19+jitter,edgeX=center.x+edge.a[0]+(edge.b[0]-edge.a[0])*t,edgeY=center.y+edge.a[1]+(edge.b[1]-edge.a[1])*t,x=Math.round(edgeX),y=Math.round(edgeY),nudge=((seed>>>(mark+10))&3);
          if(((seed>>>(mark+2))&3)!==0)pixel(ctx,Math.round(x+dx*(3+nudge)),Math.round(y+dy*(3+nudge)),3+((seed>>>(mark+5))&3),1+((seed>>>(mark+7))&1),(seed&(1<<mark))?'#899c63':'#687f50');
          if(((seed>>>(mark+18))&1)!==0)pixel(ctx,Math.round(x-dx*3),Math.round(y-dy*3),2+((seed>>>(mark+14))&2),1,'#c5a06a');
        }
      }
    }
    ctx.restore();
  }

  function drawPixelPathSegment(ctx, from, to, width, color) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    const pixelStep = 4;
    const steps = Math.max(1, Math.ceil(distance / pixelStep));
    const radius = Math.floor(width / 2);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(from.x + dx * t);
      const y = Math.round(from.y + dy * t);
      for (let row = -radius; row < radius; row += pixelStep) {
        const rowCenter = row + pixelStep / 2;
        const span = Math.max(pixelStep, Math.min(width, width - 2 * Math.abs(rowCenter) + pixelStep));
        pixel(ctx, x - Math.floor(span / 2), y + row, span, pixelStep, color);
      }
    }
  }

  function drawConnectedRoad(ctx, api, road, project) {
    const { originX, originY, cols, rows } = api.slice;
    const size = api.tileSize;
    const isRoad = (col, row) => col >= 0 && row >= 0 && col < cols && row < rows && road.has(api.tileAtCell(col, row));
    let verticalLength = 0, verticalCols = [], verticalStart = 0, verticalEnd = 0;
    for (let col = 0; col < cols; col++) {
      let start = -1;
      for (let row = 0; row <= rows; row++) {
        if (row < rows && isRoad(col, row)) { if (start < 0) start = row; continue; }
        if (start < 0) continue;
        const length = row - start;
        if (length > verticalLength) { verticalLength = length; verticalCols = [col]; verticalStart = start; verticalEnd = row - 1; }
        else if (length === verticalLength && row - 1 === verticalEnd && start === verticalStart) verticalCols.push(col);
        start = -1;
      }
    }
    let horizontalLength = 0, horizontalRow = -1, horizontalStart = 0, horizontalEnd = 0;
    for (let row = 0; row < rows; row++) {
      let start = -1;
      for (let col = 0; col <= cols; col++) {
        if (col < cols && isRoad(col, row)) { if (start < 0) start = col; continue; }
        if (start < 0) continue;
        const length = col - start;
        if (length > horizontalLength) { horizontalLength = length; horizontalRow = row; horizontalStart = start; horizontalEnd = col - 1; }
        start = -1;
      }
    }
    if (verticalLength < 2 || horizontalLength < 2) return;

    // Trace the long stem and cross-path once through the center of their
    // authored cell runs. Rasterized stamps keep the path connected without
    // Canvas stroke antialiasing or a visible diamond lattice.
    const centerCol = (verticalCols[0] + verticalCols[verticalCols.length - 1] + 1) / 2;
    const pathPoint = (col, row) => project(originX + col * size, originY + row * size);
    const top = pathPoint(centerCol, verticalStart + .5);
    const junction = pathPoint(centerCol, horizontalRow + .5);
    const left = pathPoint(horizontalStart + .5, horizontalRow + .5);
    const right = pathPoint(horizontalEnd + .5, horizontalRow + .5);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const segments = [[top, junction], [left, junction], [junction, right]];
    for (const [from, to] of segments) drawPixelPathSegment(ctx, from, to, 24, '#c1a474');
    for (const [from, to] of segments) drawPixelPathSegment(ctx, from, to, 16, '#a4875d');
    ctx.restore();
  }

  function drawContinuationGround({ ctx, project, camera, width, height, camp }) {
    if (!camera || !camp || typeof project !== 'function') return false;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#788b5c';
    ctx.fillRect(0, 0, width, height);

    // Sample the same world coordinates on both sides of the zone boundary.
    // The authored HOME cells repaint this base, while walkable space beyond
    // their edge remains ground instead of an unrelated harbor backdrop.
    const corners = [[-48, -48], [width + 48, -48], [-48, height + 48], [width + 48, height + 48]];
    const worldCorners = corners.map(([sx, sy]) => {
      const dx = sx - width / 2, dy = sy - height / 2;
      return { x: camera.x + dx + dy * 2, y: camera.y - dx + dy * 2 };
    });
    const minCol = Math.floor(Math.min(...worldCorners.map(point => point.x)) / 64);
    const maxCol = Math.ceil(Math.max(...worldCorners.map(point => point.x)) / 64);
    const minRow = Math.floor(Math.min(...worldCorners.map(point => point.y)) / 64);
    const maxRow = Math.ceil(Math.max(...worldCorners.map(point => point.y)) / 64);
    for (let row = minRow; row <= maxRow; row++) for (let col = minCol; col <= maxCol; col++) {
      const seed = hash(col, row, 13);
      if ((seed & 3) !== 0) continue;
      const point = project(col * 64 + 8 + ((seed >>> 5) % 48), row * 64 + 8 + ((seed >>> 13) % 48));
      if (point.x < -16 || point.y < -16 || point.x > width + 16 || point.y > height + 16) continue;
      const x = Math.round(point.x), y = Math.round(point.y);
      pixel(ctx, x, y, 10, 2, '#65794d');
      pixel(ctx, x + 2, y - 2, 7, 2, '#a0aa70');
      if ((seed & 31) === 0) pixel(ctx, x + 5, y - 4, 2, 1, '#e6d29b');
    }

    const from = project(camp.x, 1100), to = project(camp.x, camp.y + 120);
    drawPixelPathSegment(ctx, from, to, 24, '#c1a474');
    drawPixelPathSegment(ctx, from, to, 16, '#a4875d');
    ctx.restore();
    return true;
  }

  function drawGround({ ctx, api, project, width, height, terrain }) {
    if (!api?.slice || !terrain?.tile || typeof project !== 'function') return false;
    const tile = terrain.tile;
    const seamlessGraybox = window.AW_SUCCESSOR_GRAYBOX_CONTINUITY === true;
    const grass = new Set([tile.grass_a, tile.grass_b, tile.grass_flowers, tile.grass_to_sand_e, tile.grass_to_sand_w]);
    const road = new Set([tile.road_a, tile.road_b]);
    const sand = new Set([tile.sand_a, tile.sand_b, tile.sand_pebbles, tile.shore_n, tile.shore_s, tile.shore_e, tile.shore_w, tile.shore_ne, tile.shore_nw, tile.shore_se, tile.shore_sw]);
    const water = new Set([tile.water_a, tile.water_b]);
    // Warm the real HOME surfaces without changing their source cells or collision.
    // The previous cool gray-green palette made the camp read like an empty lot.
    drawMaterial(ctx, api, grass, project, width, height, { kind: 'grass', base: '#788b5c', light: '#a0aa70', shade: '#65794d', skipMask: 1, salt: 13 });
    drawMaterial(ctx, api, sand, project, width, height, { kind: 'sand', base: '#b99d6b', light: '#d2b880', shade: '#a2855c', skipMask: 3, salt: 31 });
    // In the selected graybox route, uncovered map cells intentionally resolve
    // to the same ground as the world continuation. Showing legacy water cells
    // here recreated the abrupt island edge this route removes.
    if (!seamlessGraybox) drawMaterial(ctx, api, water, project, width, height, { kind: 'water', base: '#4f8180', light: '#80b19b', shade: '#416d71', skipMask: 7, salt: 47 });
    // Repaint the old road cells with matching ground before the inset trail;
    // otherwise the harbor backdrop leaks through as teal diamond stamps.
    drawMaterial(ctx, api, road, project, width, height, { kind: 'road', base: '#788b5c', light: '#a0aa70', shade: '#65794d', skipMask: 3, salt: 61 });
    drawConnectedRoad(ctx, api, road, project);
    drawStreetCurb(ctx,api,road,grass,project);
    if (!seamlessGraybox) drawCoastJoin(ctx,api,sand,water,project);
    drawGrassSandTransition(ctx,api,terrain,project);
    return true;
  }

  function drawUrbanGround({ ctx, worldApi, project, width, height, tileSize = 64 }) {
    const region = worldApi?.region;
    if (!region || typeof worldApi.regionMaterial !== 'function' || typeof project !== 'function') return false;
    const snap = point => ({ x: Math.round(point.x), y: Math.round(point.y) });
    const centerAt = y => {
      const marks = [[region.y, 2432], [1240, 2432], [1480, 2400], [1720, 2368], [region.y + region.h, 2400]];
      for (let i = 1; i < marks.length; i++) {
        const [y1, x1] = marks[i - 1], [y2, x2] = marks[i];
        if (y <= y2) return x1 + (x2 - x1) * Math.max(0, Math.min(1, (y - y1) / (y2 - y1)));
      }
      return marks[marks.length - 1][1];
    };
    const drawBand = (leftOffset, rightOffset, color) => {
      const left = [], right = [];
      for (let y = region.y; y < region.y + region.h; y += 128) {
        left.push(snap(project(centerAt(y) + leftOffset, y)));
        right.push(snap(project(centerAt(y) + rightOffset, y)));
      }
      left.push(snap(project(centerAt(region.y + region.h) + leftOffset, region.y + region.h)));
      right.push(snap(project(centerAt(region.y + region.h) + rightOffset, region.y + region.h)));
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(left[0].x, left[0].y);
      for (const point of left.slice(1)) ctx.lineTo(point.x, point.y);
      for (const point of right.reverse()) ctx.lineTo(point.x, point.y);
      ctx.closePath();
      ctx.fill();
    };
    const fillWorldQuad = (x, y, w, h, color) => {
      const points = [[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([wx,wy]) => snap(project(wx,wy)));
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(points[0].x,points[0].y);
      for (const point of points.slice(1)) ctx.lineTo(point.x,point.y);
      ctx.closePath();
      ctx.fill();
    };

    const corners = [
      snap(project(region.x, region.y)),
      snap(project(region.x + region.w, region.y)),
      snap(project(region.x + region.w, region.y + region.h)),
      snap(project(region.x, region.y + region.h))
    ];
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    // Paint one continuous town surface inside the playfield. The old pass
    // filled one clipped diamond per world cell; even with matching colors,
    // those edge steps read as loose blocks at a glance.
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (const point of corners.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.closePath();
    ctx.clip();
    // Most of this region is the coastal verge around the road, not one giant
    // parking apron. Keep that quiet ground green and confine the concrete pad
    // to the authored parking footprint so the city reads as a lived-in block.
    ctx.fillStyle = '#7f8975';
    ctx.fillRect(0, 0, width, height);
    const poi = worldApi.poi, parking = poi?.parking;
    // Keep the paved forecourt tight to the storefront. Filling the full
    // parking rectangle made the whole camera read as an empty concrete lot.
    if (parking) {
      const insetX=Math.min(64,Math.round(parking.w*.12)),insetY=Math.min(48,Math.round(parking.h*.16));
      fillWorldQuad(parking.x+insetX,parking.y+insetY,parking.w-insetX*2,parking.h-insetY*2,'#96927e');
    }
    drawBand(-224, -96, '#a39e89');
    drawBand(96, 224, '#a39e89');
    drawBand(-96, 96, '#72786f');

    // Sparse, off-grid pixel wear gives the road and pavement texture without
    // restoring the repeated diamond outline that caused the blocky look.
    for (let row = 0, y = region.y + 29; y < region.y + region.h; row++, y += 67) {
      for (let col = 0, x = region.x + 17; x < region.x + region.w; col++, x += 73) {
        const seed = hash(col, row, 251);
        if ((seed & 7) !== 0) continue;
        const material = worldApi.regionMaterial(x, y);
        const point = snap(project(x + ((seed >>> 8) & 19), y + ((seed >>> 15) & 19)));
        const color = material === 'asphalt'
          ? ((seed & 16) ? '#86877b' : '#626d66')
          : material === 'cold_grass'
            ? ((seed & 16) ? '#98a080' : '#68785f')
            : '#b1a88e';
        pixel(ctx, point.x, point.y, 2 + ((seed >>> 20) & 2), 1, color);
        if (material === 'cold_grass' && (seed & 31) === 9) {
          pixel(ctx, point.x + 1, point.y - 2, 1, 3, '#718866');
          pixel(ctx, point.x + 3, point.y - 1, 1, 2, '#9ca37c');
        } else if ((seed & 63) === 9) pixel(ctx, point.x + 2, point.y + 2, 2, 1, '#777e70');
      }
    }
    ctx.restore();

    // Quiet curb highlights make the street legible as one city road rather
    // than a collection of 64-unit paving tiles.
    ctx.save();
    ctx.globalAlpha = 0.46;
    ctx.strokeStyle = '#d5c9a4';
    ctx.lineWidth = 1;
    for (const offset of [-96, 96]) {
      ctx.beginPath();
      for (let y = region.y; y <= region.y + region.h; y += 64) {
        const point = snap(project(centerAt(y) + offset, y));
        if (y === region.y) ctx.moveTo(point.x + 0.5, point.y + 0.5);
        else ctx.lineTo(point.x + 0.5, point.y + 0.5);
      }
      ctx.stroke();
    }
    ctx.restore();

    if(poi?.entrance){
      // The store floor used to be skipped by the continuous-material pass,
      // leaving the interior the same color as the world behind it.
      fillWorldQuad(poi.entrance.x+12,poi.entrance.y-34,poi.entrance.w-24,24,'#625d4e');
      fillWorldQuad(poi.entrance.x+18,poi.entrance.y-30,poi.entrance.w-36,15,'#9b8e6b');
    }
    if(parking){
      // A connected frontage walk joins the shop door to the street instead of
      // letting the building edge fall straight into one large gray pad.
      const frontageY=poi.y+poi.h;
      fillWorldQuad(poi.x+18,frontageY+5,poi.w-36,34,'#aaa18b');
      const curbA=project(poi.x+18,frontageY+39),curbB=project(poi.x+poi.w-18,frontageY+39);
      ctx.strokeStyle='#ddd1af';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(curbA.x,curbA.y);ctx.lineTo(curbB.x,curbB.y);ctx.stroke();
      // Faded, open-ended bay marks suggest a small-town car park without
      // laying a visible grid of closed boxes over the pixel ground.
      ctx.save();ctx.globalAlpha=.24;ctx.strokeStyle='#e1d6b2';ctx.lineWidth=1;
      for(let i=0;i<3;i++){
        const x=parking.x+74+i*214,y=parking.y+58,w=132,h=74,a=project(x,y),b=project(x+w,y),c=project(x+w,y+h),d=project(x,y+h);
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(d.x,d.y);ctx.moveTo(b.x,b.y);ctx.lineTo(c.x,c.y);
        ctx.moveTo(d.x,d.y);ctx.lineTo(d.x+(c.x-d.x)*.42,d.y+(c.y-d.y)*.42);ctx.moveTo(c.x-(c.x-b.x)*.42,c.y-(c.y-b.y)*.42);ctx.lineTo(c.x,c.y);ctx.stroke();
      }
      ctx.restore();
    }

    // Center dashes make the long asphalt strip read as a street, not a row of tiles.
    ctx.save();
    ctx.strokeStyle = '#e8d8a18f';
    ctx.lineWidth = 2;
    for (let y = region.y + 80; y < region.y + region.h - 64; y += 176) {
      const centerX = worldApi.roadCenterAt?.(y + 32);
      if (!Number.isFinite(centerX) || worldApi.regionMaterial(centerX - 32, y) !== 'asphalt') continue;
      const a = project(centerX, y + 18);
      const b = project(centerX, y + 52);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    const crossingY=parking?parking.y+parking.h+124:null,crossingX=Number.isFinite(crossingY)?worldApi.roadCenterAt?.(crossingY+32):null;
    if(Number.isFinite(crossingX)&&worldApi.regionMaterial(crossingX-32,crossingY)==='asphalt'){
      ctx.globalAlpha=.68;ctx.fillStyle='#e8dfc2';
      for(let i=0;i<7;i++)fillWorldQuad(crossingX-76,crossingY+i*11,152,5,'#e8dfc2');
      ctx.globalAlpha=1;
    }
    ctx.restore();
    return true;
  }

  function drawPlayer(ctx, { x, y, row, frame }) {
    const left = Math.round(x - 12);
    const top = Math.round(y - 31);
    const leftStep = frame === 1 ? -2 : frame === 3 ? 1 : 0;
    const rightStep = frame === 3 ? 2 : frame === 1 ? -1 : 0;
    const leftLift = frame === 1 ? -1 : 0;
    const rightLift = frame === 3 ? -1 : 0;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(left, top);
    if (row === 1) { ctx.translate(24, 0); ctx.scale(-1, 1); }

    // Stable, hard-edged ground shadow and feet keep the logical contact point fixed.
    pixel(ctx, 4, 30, 16, 1, '#514b3970');
    pixel(ctx, 6 + leftStep, 27 + leftLift, 5, 4, palette.boot);
    pixel(ctx, 14 + rightStep, 27 + rightLift, 5, 4, palette.boot);
    pixel(ctx, 7 + leftStep, 27 + leftLift, 3, 1, '#76553c');
    pixel(ctx, 15 + rightStep, 27 + rightLift, 3, 1, '#76553c');
    pixel(ctx, 7 + leftStep, 22 + leftLift, 4, 6, palette.pants);
    pixel(ctx, 14 + rightStep, 22 + rightLift, 4, 6, palette.pants);
    pixel(ctx, 8 + leftStep, 23 + leftLift, 2, 3, '#797765');
    pixel(ctx, 15 + rightStep, 23 + rightLift, 2, 3, '#797765');

    ctx.save();
    pixel(ctx, 5, 13, 14, 11, palette.ink);
    pixel(ctx, 7, 12, 10, 12, palette.coat);
    pixel(ctx, 8, 14, 8, 8, palette.coatShade);
    pixel(ctx, 4, 15, 4, 7, palette.ink);
    pixel(ctx, 16, 15, 4, 7, palette.ink);
    pixel(ctx, 5 + (frame === 3 ? -1 : frame === 1 ? 1 : 0), 16, 3, 6, palette.coat);
    pixel(ctx, 16 + (frame === 1 ? 1 : frame === 3 ? -1 : 0), 16, 3, 6, palette.coat);
    pixel(ctx, 7, 11, 10, 4, palette.ink);
    pixel(ctx, 7, 12, 10, 2, palette.scarf);
    pixel(ctx, 14, 13, 4, 3, palette.scarfLight);
    pixel(ctx, 7, 14, 2, 7, '#9eaa76');
    pixel(ctx, 11, 16, 2, 2, '#ddc37f');

    // Keep the torso, head, shadow, and ground anchor fixed during the gait;
    // only the legs alternate so the small actor does not hop between frames.
    pixel(ctx, 5, 2, 14, 9, palette.inkDeep);
    pixel(ctx, 7, 1, 10, 2, palette.hair);
    pixel(ctx, 6, 3, 12, 4, palette.hair);
    pixel(ctx, 7, 4, 10, 7, palette.skin);
    pixel(ctx, 7, 4, 10, 2, palette.hair);
    pixel(ctx, 6, 5, 2, 4, palette.hair);
    pixel(ctx, 16, 5, 2, 4, palette.hair);
    pixel(ctx, 9, 4, 3, 1, palette.hairLight);
    if (row === 0) {
      pixel(ctx, 9, 7, 1, 2, palette.inkDeep);
      pixel(ctx, 14, 7, 1, 2, palette.inkDeep);
      pixel(ctx, 11, 10, 2, 1, palette.skinLight);
    } else if (row === 3) {
      pixel(ctx, 6, 5, 12, 6, palette.hair);
      pixel(ctx, 7, 12, 10, 9, palette.packShade);
      pixel(ctx, 8, 13, 8, 7, palette.pack);
      pixel(ctx, 11, 15, 2, 2, palette.tide);
      pixel(ctx, 10, 20, 4, 2, palette.scarf);
    } else {
      pixel(ctx, 8, 6, 8, 5, palette.skin);
      pixel(ctx, 15, 7, 2, 2, palette.skinLight);
      pixel(ctx, 16, 8, 1, 1, palette.inkDeep);
      pixel(ctx, 5, 12, 5, 8, palette.pack);
      pixel(ctx, 6, 14, 3, 5, palette.packShade);
      pixel(ctx, 4, 12, 3, 4, palette.scarf);
    }
    ctx.restore();
    ctx.restore();
  }

  function drawTree(ctx, { point, variant = 0, chopping = false, age = 0 }) {
    const progress = chopping ? Math.max(0, Math.min(1, age / 560)) : 0;
    const shake = chopping && progress < 0.22 ? ((Math.floor(age / 34) & 1) ? -1 : 1) : 0;
    const crownDrop = Math.round(Math.max(0, progress - 0.18) * 17);
    const crownShift = -Math.round(Math.max(0, progress - 0.18) * 8);
    const leaves = variant % 2 ? ['#4d653f', '#708b50', '#91a762', '#b4b879'] : ['#4b633e', '#70884d', '#91a35e', '#b8b878'];
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(point.x) + shake, Math.round(point.y));
    ctx.globalAlpha = chopping ? Math.max(0.12, 1 - progress * 0.88) : 1;

    pixel(ctx, -11, -2, 22, 2, '#4e5a3d');
    pixel(ctx, -15, -1, 30, 1, '#66744b');
    pixel(ctx, -4, -16, 8, 16, '#65482f');
    pixel(ctx, -2, -15, 3, 12, '#987148');
    pixel(ctx, 2, -13, 2, 10, '#503e2d');

    ctx.save();
    ctx.translate(crownShift, crownDrop);
    const crown = [
      [-4, -45, 8, 5], [-10, -41, 20, 6], [-15, -35, 30, 7],
      [-18, -28, 36, 8], [-15, -20, 30, 7], [-9, -14, 18, 5]
    ];
    for (const [x, y, w, h] of crown) pixel(ctx, x - 1, y, w + 2, h, palette.ink);
    for (const [x, y, w, h] of crown) pixel(ctx, x, y + 1, w, h - 1, leaves[0]);
    pixel(ctx, -11, -37, 10, 5, leaves[1]);
    pixel(ctx, 1, -39, 9, 6, leaves[2]);
    pixel(ctx, -15, -29, 12, 6, leaves[1]);
    pixel(ctx, 2, -30, 13, 6, leaves[2]);
    pixel(ctx, -7, -22, 9, 5, leaves[2]);
    pixel(ctx, 5, -25, 6, 4, leaves[3]);
    pixel(ctx, -12, -33, 4, 2, leaves[3]);
    pixel(ctx, -3, -42, 3, 2, leaves[3]);
    ctx.restore();

    if (chopping) {
      ctx.globalAlpha = Math.max(0, 1 - progress);
      pixel(ctx, -13 + (Math.floor(age / 43) % 5), -32 - (age % 61), 2, 2, leaves[2]);
      pixel(ctx, 9 - (Math.floor(age / 37) % 6), -25 - ((age + 19) % 53), 2, 2, leaves[3]);
    }
    ctx.restore();
  }

  function drawCampProp(ctx, { point, index }) {
    const x = Math.round(point.x);
    const y = Math.round(point.y);
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (index === 1) {
      // An open emergency-camp canopy replaces the oversized sigil board.
      pixel(ctx, x - 21, y - 1, 42, 2, '#536044');
      pixel(ctx, x - 17, y - 23, 4, 23, palette.ink);
      pixel(ctx, x + 13, y - 23, 4, 23, palette.ink);
      pixel(ctx, x - 15, y - 20, 3, 18, '#8b6943');
      pixel(ctx, x + 14, y - 20, 2, 18, '#8b6943');
      pixel(ctx, x - 20, y - 28, 40, 4, palette.ink);
      pixel(ctx, x - 23, y - 25, 46, 9, '#c6a36d');
      pixel(ctx, x - 19, y - 23, 38, 3, '#dfc28a');
      pixel(ctx, x - 17, y - 16, 34, 3, '#9a7650');
      pixel(ctx, x - 11, y - 12, 22, 2, '#d8b982');
      pixel(ctx, x - 9, y - 10, 18, 2, palette.packShade);
      pixel(ctx, x - 5, y - 8, 10, 7, '#514237');
      pixel(ctx, x - 3, y - 7, 6, 6, '#bc8b59');
      pixel(ctx, x + 9, y - 12, 3, 5, palette.ink);
      pixel(ctx, x + 10, y - 11, 1, 2, '#f0c577');
      ctx.restore();
      return true;
    }

    if (index === 2) {
      // A compact timber workbench stays on the original interaction anchor.
      pixel(ctx, x - 20, y - 1, 40, 2, '#586247');
      pixel(ctx, x - 15, y - 16, 4, 16, palette.ink);
      pixel(ctx, x + 11, y - 16, 4, 16, palette.ink);
      pixel(ctx, x - 13, y - 15, 3, 13, '#8c6540');
      pixel(ctx, x + 12, y - 15, 2, 13, '#8c6540');
      pixel(ctx, x - 20, y - 21, 40, 6, palette.ink);
      pixel(ctx, x - 18, y - 20, 36, 4, '#b58a58');
      pixel(ctx, x - 15, y - 19, 20, 1, '#d5b477');
      pixel(ctx, x + 4, y - 18, 9, 3, '#967047');
      pixel(ctx, x + 14, y - 25, 2, 7, palette.ink);
      pixel(ctx, x + 11, y - 26, 8, 3, '#aeb7a0');
      pixel(ctx, x + 12, y - 25, 5, 1, '#d8d8b7');
      ctx.restore();
      return true;
    }

    if (index === 4) {
      // Re-skin the camp's rail as a compact galvanized street guardrail.
      // Thin overlapping runs read as one city fixture instead of wood blocks.
      pixel(ctx, x - 25, y - 1, 51, 2, '#465b58');
      pixel(ctx, x - 22, y - 17, 3, 18, '#455750');
      pixel(ctx, x + 18, y + 1, 3, 18, '#455750');
      pixel(ctx, x - 21, y - 16, 1, 15, '#bac1a4');
      pixel(ctx, x + 19, y + 2, 1, 15, '#bac1a4');
      for (let step = 0; step < 12; step++) {
        const railX = x - 24 + step * 4;
        const railY = y - 15 + step * 2;
        pixel(ctx, railX, railY, 5, 2, '#445954');
        pixel(ctx, railX, railY + 1, 4, 1, '#c3c5a8');
        pixel(ctx, railX, railY + 6, 5, 2, '#53645b');
        pixel(ctx, railX, railY + 6, 4, 1, '#929c87');
      }
      ctx.restore();
      return true;
    }

    ctx.restore();
    return false;
  }

  function drawBerryBush(ctx, { point, variant = 0 }) {
    const x = Math.round(point.x), y = Math.round(point.y), flip = variant % 2 ? -1 : 1;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    pixel(ctx, x - 14, y - 1, 28, 2, '#596044');
    pixel(ctx, x - 11, y - 11, 22, 10, '#455c3c');
    pixel(ctx, x - 9, y - 15, 18, 6, '#587246');
    pixel(ctx, x - 6, y - 18, 12, 5, '#6c8550');
    pixel(ctx, x - 9, y - 10, 18, 6, '#748b55');
    pixel(ctx, x - 5, y - 15, 6, 3, '#91a365');
    pixel(ctx, x + 3 * flip, y - 13, 5, 4, '#83975c');
    pixel(ctx, x - 8, y - 8, 3, 3, '#bd6253');
    pixel(ctx, x + 4 * flip, y - 11, 3, 3, '#d47b5d');
    pixel(ctx, x + 7 * flip, y - 6, 3, 3, '#b85f4c');
    pixel(ctx, x - 2 * flip, y - 5, 2, 2, '#d88e6c');
    ctx.restore();
  }

  window.ABYSSAL_COZY_PIXEL_PROOF_V1 = { drawGround, drawContinuationGround, drawUrbanGround, drawPlayer, drawTree, drawCampProp, drawBerryBush };
})();
