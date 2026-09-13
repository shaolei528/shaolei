import { CONFIG } from './constants.js';
import { ENEMY_TYPES } from './enemies.js';

let nextId = 1;
const id = prefix => `${prefix}-${nextId++}`;

export function createPlayer() {
  return {
    id: id('player'), x: 800, y: 450, radius: CONFIG.player.radius,
    hp: CONFIG.player.maxHp, maxHp: CONFIG.player.maxHp, speed: CONFIG.player.speed,
    damage: CONFIG.bubble.damage, fireInterval: CONFIG.bubble.cooldown, bubbleScale: 1,
    dashCooldown: CONFIG.player.dashCooldown, dashTimer: 0, dashReady: 0,
    hurtTimer: 0, levelShieldTimer: 0, shieldTimer: 0, xp: 0, level: 1, nextLevelXp: CONFIG.level.first,
    aim: { x: 1, y: 0 }, movement: { x: 0, y: 0 }, firing: false, pendingLevel: false,
    tail: [], score: 0,
  };
}

export function createEnemy(x, y, tier = 1, type = 'chaser') {
  const profile = ENEMY_TYPES[type];
  return { id: id('enemy'), type, x, y, color: profile.color, radius: CONFIG.enemy.radius + profile.radius, hp: CONFIG.enemy.hp + Math.floor(tier / 3) + profile.hp, speed: (CONFIG.enemy.speed + tier * 5) * profile.speed, hitFlash: 0, dashTimer: 0, dashReady: 1 + Math.random() };
}

export function createBubble(player) {
  return { id: id('bubble'), ownerId: player.id, x: player.x, y: player.y, radius: CONFIG.bubble.radius * player.bubbleScale, vx: player.aim.x * CONFIG.bubble.speed, vy: player.aim.y * CONFIG.bubble.speed, life: CONFIG.bubble.life, damage: player.damage };
}

export function createFood(x, y, xp = CONFIG.food.xp) {
  return { id: id('food'), x, y, radius: CONFIG.food.radius + (xp > 1 ? 4 : 0), xp, life: CONFIG.food.life, spin: Math.random() * Math.PI * 2, rare: xp > 1 };
}
