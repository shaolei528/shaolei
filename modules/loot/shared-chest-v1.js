(() => {
  'use strict';
  if (globalThis.ABYSSAL_SHARED_CHEST_V1?.version === 1) return;
  const config = globalThis.ABYSSAL_SHARED_CHEST_CONFIG_V1;
  if (!config?.id || !Number.isFinite(config.x) || !Number.isFinite(config.y)) throw new Error('Shared chest data is unavailable.');
  const definition = Object.freeze({ id: String(config.id), x: Number(config.x), y: Number(config.y), cooldown: Math.max(1000, Number(config.cooldownMs) || 90000) });

  function getTarget(player, harvested) {
    const distance = Math.hypot(Number(player?.x) - definition.x, Number(player?.y) - definition.y);
    const until = Number(harvested?.get(definition.id)) || 0;
    const text = until > Date.now() ? `共享宝箱刷新中 · ${Math.ceil((until - Date.now()) / 1000)}秒` : '【互动】打开共享宝箱';
    return { type: 'chest', d: distance, text };
  }

  function open({ player, harvested, inventory, zone, connected, channel, now = Date.now(), random = Math.random }) {
    const until = Number(harvested?.get(definition.id)) || 0;
    if (until > now) return { ok: false, reason: 'cooldown', message: `共享宝箱还要 ${Math.ceil((until - now) / 1000)} 秒刷新。` };
    if (!connected || !channel) return { ok: false, reason: 'offline', message: '联机同步尚未连接，暂时不能打开共享宝箱。' };
    if (!player || !inventory || !(harvested instanceof Map)) return { ok: false, reason: 'state-unavailable' };

    const next = now + definition.cooldown;
    harvested.set(definition.id, next);
    channel.send({ type: 'broadcast', event: 'harvest', payload: { zone, rid: definition.id, until: next } });
    const roll = Math.max(0, Math.min(0.999999999, Number(random()) || 0));
    const bonus = roll < Number(config.rolls?.[0]?.chance ?? 0.55) ? config.rolls[0] : config.rolls?.[1];
    const rewards = [{ ...config.always }, { item: bonus?.item || 'stone', count: Math.max(1, Number(bonus?.count) || 1) }];
    for (const reward of rewards) inventory[reward.item] = (Number(inventory[reward.item]) || 0) + reward.count;
    const message = rewards[1].item === 'shard'
      ? '打开共享宝箱：获得食物 ×1、异质碎片 ×1。'
      : '打开共享宝箱：获得食物 ×1、石头 ×1。';
    return { ok: true, rewards, message };
  }

  globalThis.ABYSSAL_SHARED_CHEST_V1 = Object.freeze({ version: 1, definition, getTarget, open });
})();
