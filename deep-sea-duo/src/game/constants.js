export const WORLD = { width: 1600, height: 900 };

export const CONFIG = {
  player: {
    speed: 290,
    maxHp: 3,
    radius: 23,
    dashSpeed: 920,
    dashDuration: 0.17,
    dashCooldown: 5.5,
    contactInvulnerability: 0.85,
  },
  bubble: { speed: 760, radius: 9, life: 1.25, cooldown: 0.22, damage: 1 },
  enemy: { radius: 24, speed: 105, hp: 2, spawnEvery: 1.45, maxAlive: 26 },
  food: { radius: 12, xp: 1, life: 14 },
  level: { first: 6, growth: 1.35 },
};

export const UPGRADES = [
  { id: 'power', label: '泡泡增压', detail: '水弹伤害 +1', apply: p => { p.damage += 1; } },
  { id: 'rapid', label: '连射珊瑚', detail: '攻击间隔 -18%', apply: p => { p.fireInterval = Math.max(0.07, p.fireInterval * 0.82); } },
  { id: 'swift', label: '潮汐步伐', detail: '移动速度 +12%', apply: p => { p.speed *= 1.12; } },
  { id: 'vital', label: '荧光甲壳', detail: '回复 1 点生命', apply: p => { p.hp = Math.min(p.maxHp, p.hp + 1); } },
  { id: 'wide', label: '泡泡膨胀', detail: '水弹体积 +22%', apply: p => { p.bubbleScale *= 1.22; } },
  { id: 'haste', label: '急流冲刺', detail: '冲刺冷却 -18%', apply: p => { p.dashCooldown = Math.max(1.6, p.dashCooldown * 0.82); } },
];
