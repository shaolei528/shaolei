import { WORLD } from './constants.js';
import { randomRange } from './math.js';

export const POWERUPS = {
  shield: { label: '荧光护盾', color: '#8df8ff', duration: 6.5 },
  heal: { label: '治疗气泡', color: '#ff9ddc', duration: 0 },
  wave: { label: '清场海浪', color: '#b39cff', duration: 0 },
};
export function createPowerup(type, random = Math.random) { return { type, x: randomRange(150, WORLD.width - 150, random), y: randomRange(150, WORLD.height - 150, random), radius: 24, life: 13, pulse: 0 }; }
export function choosePowerup(random = Math.random) { const types = Object.keys(POWERUPS); return types[Math.floor(random() * types.length)]; }
export function applyPowerup(game, item, p = game.player) {
  if (item.type === 'shield') p.shieldTimer = POWERUPS.shield.duration;
  if (item.type === 'heal') p.hp = Math.min(p.maxHp, p.hp + 1);
  if (item.type === 'wave') { game.enemies = []; if (game.boss) game.boss.hp -= Math.ceil(game.boss.maxHp * .12); }
  game.powerupMessage = POWERUPS[item.type].label; game.powerupMessageTimer = 1.8;
}
