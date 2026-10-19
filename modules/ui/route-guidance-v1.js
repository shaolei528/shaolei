(() => {
  'use strict';
  if (globalThis.ABYSSAL_ROUTE_GUIDANCE_V1?.version === 1) return;

  function draw(ctx, state) {
    if (!ctx || !state || !['1:1', '1:0', '1:2'].includes(String(state.zone || ''))) return false;
    const { zone, player, inventory = {}, availableResources = [], interactionTarget = null, homeUpgrade = null } = state;
    const phase = String(state.phase || ''), camp = state.camp || {}, worldZone = Number(state.worldZone) || 0;
    const projectViewport = state.projectViewport;
    if (typeof projectViewport !== 'function' || !Number.isFinite(Number(player?.x)) || !Number.isFinite(Number(player?.y))) return false;

    function drawInteractionPrompt() {
      const action = String(interactionTarget?.label || '').replace(/^【互动】\s*/, '').trim();
      if (!action) return false;
      const text = `E / 互动  ${action}`;
      ctx.save();
      ctx.font = 'bold 9px ui-monospace,monospace';
      ctx.textAlign = 'center';
      const maxWidth = Math.max(0, width - 28);
      const boxWidth = Math.min(maxWidth, Math.ceil(ctx.measureText(text).width) + 20);
      const boxHeight = 21, boxX = Math.round((width - boxWidth) / 2), boxY = Math.max(8, Math.round(height - 108));
      ctx.fillStyle = '#091512ed';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.strokeStyle = '#a9c6b6';
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX + .5, boxY + .5, boxWidth - 1, boxHeight - 1);
      ctx.fillStyle = '#f4f8f5';
      ctx.fillText(text, width / 2, boxY + 14, boxWidth - 12);
      ctx.restore();
      return true;
    }

    const goals = [], worldNow = Number(state.worldNow) || 0, insideCamp = state.inCamp === true;
    if (zone === '1:1') {
      for (const [type, need, label, color] of [['wood', 4, '木材', '#f0c77c'], ['stone', 3, '石料', '#b9d0d4']]) {
        if (!insideCamp || (Number(inventory[type]) || 0) >= need) continue;
        let nearest = null, best = Infinity;
        for (const resource of availableResources) {
          if (resource?.type !== type) continue;
          const distance = Math.hypot(resource.x - player.x, resource.y - player.y);
          if (distance <= 1250 && distance < best) { best = distance; nearest = resource; }
        }
        if (nearest) {
          const target = interactionTarget;
          if (target?.type === 'resource' && target.resource?.type === type) nearest = target.resource;
          goals.push({ ...nearest, label, color, edge: true });
        }
      }

      const workbench = state.workbench || {};
      if (insideCamp && (Number(inventory.wood) || 0) >= 4 && (Number(inventory.stone) || 0) >= 3 && !inventory.knife && interactionTarget?.type !== 'workbench') {
        const distance = Math.hypot(Number(workbench.x) - player.x, Number(workbench.y) - player.y);
        if (distance <= 350) goals.push({ x: Number(workbench.x), y: Number(workbench.y), type: 'workbench', label: '前往工作台', color: '#efd399', edge: true });
      }

      if (inventory.knife && phase === 'COMPLETE' && !state.bossCleared && !inventory.lantern && homeUpgrade?.returnClearance && Number(homeUpgrade.tier) < 2) {
        const cost = homeUpgrade.cost || {}, missingStone = Math.max(0, Number(cost.stone || 3) - (Number(inventory.stone) || 0)), missingShard = Math.max(0, Number(cost.shard || 2) - (Number(inventory.shard) || 0));
        if (missingStone > 0) {
          let nearest = null, best = Infinity;
          for (const resource of availableResources) {
            if (resource?.type !== 'stone') continue;
            const distance = Math.hypot(resource.x - player.x, resource.y - player.y);
            if (distance <= 1250 && distance < best) { best = distance; nearest = resource; }
          }
          if (nearest) goals.push({ ...nearest, label: '装备架石料', color: '#b9d0d4', edge: true });
        }
        if (missingShard > 0) {
          const exit = { x: Number(camp.x), y: worldZone - 10 }, distance = Math.hypot(exit.x - player.x, exit.y - player.y);
          if (distance <= 1600) goals.push({ ...exit, type: 'exit', label: '→ MIRE MART · 碎片', color: '#a8e6df', edge: true });
        }
        if (missingStone <= 0 && missingShard <= 0) {
          const distance = Math.hypot(Number(workbench.x) - player.x, Number(workbench.y) - player.y);
          if (distance <= 1000) goals.push({ x: Number(workbench.x), y: Number(workbench.y), type: 'workbench', label: '强化野外装备架', color: '#efd399', edge: true });
        }
      }
    }

    if (inventory.knife) {
      if (zone === '1:1' && (!phase || phase === 'LEAVE_HOME' || phase === 'REACH_MIRE_MART' || (phase === 'COMPLETE' && !state.bossCleared && inventory.lantern))) {
        const exit = { x: Number(camp.x), y: worldZone - 10 }, distance = Math.hypot(exit.x - player.x, exit.y - player.y);
        const label = phase === 'COMPLETE' ? '→ 挑战沼心守望者' : '→ MIRE MART';
        if (distance <= 1000) goals.push({ ...exit, type: 'exit', label, color: '#8edbd3', edge: true });
      } else if (zone === '1:1' && phase === 'COMPLETE' && state.bossCleared && insideCamp) {
        const exit = { x: Number(camp.x), y: worldZone * 2 + 10 }, distance = Math.hypot(exit.x - player.x, exit.y - player.y);
        if (distance <= 3600) goals.push({ ...exit, type: 'exit', label: '→ 南侧探索区', color: '#a8e6df', edge: true });
      } else if (zone === '1:0') {
        let target = null, label = '', color = '#8edbd3', type = 'poi', maxDistance = 1100;
        if (phase === 'REACH_MIRE_MART' && state.parking) {
          const area = state.parking;
          target = { x: area.x + area.w / 2, y: area.y + area.h / 2 };
          label = '搜索 MIRE MART';
        } else if (phase === 'SEARCH_FIGHT') {
          target = availableResources.filter(resource => resource?.type === 'shard' && String(resource.id).startsWith('poi:store:'))
            .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0];
          if (target) { label = '异质碎片'; color = '#a8e6df'; type = 'shard'; }
        } else if (phase === 'SECURE_REQUIRED_SALVAGE' || phase === 'RETURN_HOME') {
          target = { x: Number(camp.x), y: worldZone + 10 };
          label = '→ 返回安全营地';
          type = 'home';
        } else if (phase === 'COMPLETE' && !state.bossCleared && !inventory.lantern && homeUpgrade?.returnClearance && Number(homeUpgrade.tier) < 2) {
          const requiredShards = Math.max(1, Number(homeUpgrade.cost?.shard) || 2);
          if ((Number(inventory.shard) || 0) < requiredShards) {
            target = availableResources.filter(resource => resource?.type === 'shard' && String(resource.id).startsWith('poi:store:'))
              .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0];
            if (target) { label = '装备架碎片'; color = '#a8e6df'; type = 'shard'; }
          } else {
            target = { x: Number(camp.x), y: worldZone + 10 };
            label = '→ 返营强化装备架';
            type = 'home';
            maxDistance = 1600;
          }
        } else if (phase === 'COMPLETE' && state.bossCleared) {
          target = { x: Number(camp.x), y: worldZone + 10 };
          label = '返营 · 南侧新区已开放';
          type = 'home';
          maxDistance = 1600;
        } else if (phase === 'COMPLETE' && inventory.lantern && state.boss) {
          target = state.boss;
          label = '沼心守望者';
          type = 'boss';
          maxDistance = 1600;
        }
        if (target) {
          const distance = Math.hypot(target.x - player.x, target.y - player.y);
          if (distance <= maxDistance) goals.push({ ...target, type, label, color, edge: true });
        }
      } else if (zone === '1:2' && phase === 'COMPLETE' && state.bossCleared) {
        const target = availableResources.filter(resource => resource?.type === 'shard')
          .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0];
        if (target && Math.hypot(target.x - player.x, target.y - player.y) <= 1600)
          goals.push({ ...target, type: 'shard', label: '新区异质遗物', color: '#a8e6df', edge: true });
      }
    }

    if (inventory.knife && zone === '1:1' && phase === 'RETURN_HOME' && !insideCamp) {
      const target = { x: Number(camp.x), y: Number(camp.y) }, distance = Math.hypot(target.x - player.x, target.y - player.y);
      if (distance <= 700) goals.push({ ...target, type: 'home', label: '篝火 · 安全营地', color: '#f0c77c', edge: true });
    }

    ctx.save();
    ctx.setTransform(Number(state.dpr) || 1, 0, 0, Number(state.dpr) || 1, 0, 0);
    const width = Number(state.width) || 0, height = Number(state.height) || 0, now = Number(state.now) || 0;
    for (let index = 0; index < goals.length; index++) {
      const goal = goals[index], raw = projectViewport(goal.x, goal.y);
      if (!raw || !Number.isFinite(raw.x) || !Number.isFinite(raw.y)) continue;
      const cx = width / 2, cy = height / 2, dx = raw.x - cx, dy = raw.y - cy, pad = 24;
      const scale = goal.edge ? Math.min(Math.abs(dx) > cx - pad ? (cx - pad) / Math.abs(dx) : 1, Math.abs(dy) > cy - pad ? (cy - pad) / Math.abs(dy) : 1) : 1;
      const point = { x: Math.round(cx + dx * scale), y: Math.round(cy + dy * scale) }, offscreen = goal.edge && scale < .999;
      const pulse = .5 + .5 * Math.sin(now / 260 + (goal.type === 'stone' ? 1.2 : 0));
      const nearTarget = Math.hypot(goal.x - player.x, goal.y - player.y) <= 82;
      const rx = nearTarget ? 10 : 18 + Math.round(pulse * 4), ry = nearTarget ? 5 : 9 + Math.round(pulse * 2);
      ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = goal.color; ctx.globalAlpha = .5 + pulse * .35;
      ctx.beginPath(); ctx.moveTo(point.x, point.y - ry); ctx.lineTo(point.x + rx, point.y); ctx.lineTo(point.x, point.y + ry); ctx.lineTo(point.x - rx, point.y); ctx.closePath(); ctx.stroke();
      ctx.globalAlpha = .82; ctx.fillStyle = goal.color; ctx.fillRect(Math.round(point.x) - 2, Math.round(point.y) - 2, 4, 4);
      if (offscreen) {
        ctx.save(); ctx.translate(point.x, point.y); ctx.rotate(Math.atan2(dy, dx)); ctx.fillStyle = goal.color;
        ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-4, -5); ctx.lineTo(-2, 0); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      const caption = goal.label;
      ctx.font = 'bold 9px ui-monospace,monospace'; ctx.textAlign = offscreen ? (point.x > cx ? 'right' : 'left') : 'center';
      const labelX = Math.round(point.x) + (offscreen ? (point.x > cx ? -13 : 13) : 0);
      const labelWidth = Math.ceil(ctx.measureText(caption).width) + 10;
      const top = Math.max(4, Math.min(height - 18, Math.round(point.y) - 34 - index * 14));
      const left = ctx.textAlign === 'right' ? labelX - labelWidth : ctx.textAlign === 'left' ? labelX : labelX - labelWidth / 2;
      ctx.globalAlpha = .9; ctx.fillStyle = '#101a16e8'; ctx.fillRect(left, top, labelWidth, 14);
      ctx.strokeStyle = goal.color; ctx.lineWidth = 1; ctx.strokeRect(left + .5, top + .5, labelWidth - 1, 13);
      ctx.fillStyle = '#f6f0dc'; ctx.fillText(caption, labelX, top + 10); ctx.restore();
    }
    drawInteractionPrompt();
    ctx.restore();
    return goals.length > 0;
  }

  globalThis.ABYSSAL_ROUTE_GUIDANCE_V1 = Object.freeze({ version: 1, draw });
})();
