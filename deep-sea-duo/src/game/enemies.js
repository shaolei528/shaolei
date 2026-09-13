import { normalize } from './math.js';

export const ENEMY_TYPES = {
  chaser: { label: '追逐怪', color: '#bd5eea', speed: 1, hp: 0, radius: 0 },
  dasher: { label: '冲刺怪', color: '#ff7cba', speed: 0.78, hp: 0, radius: -3 },
  blocker: { label: '路障怪', color: '#a382ff', speed: 0.47, hp: 2, radius: 13 },
};

export function chooseEnemyType(random = Math.random, elapsed = 0) {
  const roll = random();
  if (elapsed < 18 || roll < 0.48) return 'chaser';
  if (roll < 0.78) return 'dasher';
  return 'blocker';
}

export function stepEnemy(enemy, target, dt) {
  const direction = normalize(target.x - enemy.x, target.y - enemy.y);
  if (enemy.type === 'dasher') {
    enemy.dashReady -= dt;
    if (enemy.dashTimer > 0) enemy.dashTimer -= dt;
    else if (enemy.dashReady <= 0 && Math.hypot(target.x - enemy.x, target.y - enemy.y) < 420) {
      enemy.dashTimer = 0.38; enemy.dashReady = 2.8; enemy.dashDirection = direction;
    }
  }
  const velocity = enemy.type === 'dasher' && enemy.dashTimer > 0 ? enemy.dashDirection : direction;
  const multiplier = enemy.type === 'dasher' && enemy.dashTimer > 0 ? 3.9 : 1;
  enemy.x += velocity.x * enemy.speed * multiplier * dt;
  enemy.y += velocity.y * enemy.speed * multiplier * dt;
}
