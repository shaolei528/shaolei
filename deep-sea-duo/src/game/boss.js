import { WORLD } from './constants.js';
import { normalize } from './math.js';

export const BOSS = {
  firstSpawnAt: 180, hp: 72, radius: 74, cruiseSpeed: 88,
  chargeDuration: 0.9, dashDuration: 0.56, dashSpeed: 720, dashCooldown: 3.6,
};

export function createSharkBoss() {
  return { kind: 'shark', x: WORLD.width / 2, y: -BOSS.radius - 25, radius: BOSS.radius, hp: BOSS.hp, maxHp: BOSS.hp, phase: 'arriving', phaseTimer: 1.25, cooldown: 1.8, dashDirection: { x: 0, y: 1 }, hitFlash: 0, announced: true };
}

export function stepSharkBoss(boss, target, dt) {
  boss.phaseTimer -= dt; boss.cooldown -= dt; boss.hitFlash -= dt;
  const direction = normalize(target.x - boss.x, target.y - boss.y);
  if (boss.phase === 'arriving') { boss.y = Math.min(170, boss.y + 220 * dt); if (boss.phaseTimer <= 0) boss.phase = 'stalk'; return; }
  if (boss.phase === 'charge') { if (boss.phaseTimer <= 0) { boss.phase = 'dash'; boss.phaseTimer = BOSS.dashDuration; boss.dashDirection = direction; } return; }
  if (boss.phase === 'dash') { boss.x += boss.dashDirection.x * BOSS.dashSpeed * dt; boss.y += boss.dashDirection.y * BOSS.dashSpeed * dt; if (boss.phaseTimer <= 0) { boss.phase = 'stalk'; boss.cooldown = BOSS.dashCooldown; } return; }
  boss.x += direction.x * BOSS.cruiseSpeed * dt; boss.y += direction.y * BOSS.cruiseSpeed * dt;
  if (boss.cooldown <= 0 && Math.hypot(target.x - boss.x, target.y - boss.y) < 620) { boss.phase = 'charge'; boss.phaseTimer = BOSS.chargeDuration; }
}

export function bossRewardPositions(boss, count = 12) {
  return Array.from({ length: count }, (_, index) => { const angle = index / count * Math.PI * 2; return { x: boss.x + Math.cos(angle) * (45 + (index % 3) * 28), y: boss.y + Math.sin(angle) * (45 + (index % 3) * 28) }; });
}
