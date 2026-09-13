import { WORLD } from './constants.js';
import { circlesTouch, normalize } from './math.js';

export const CORALS = [
  { x: 255, y: 215, radius: 72 }, { x: 505, y: 670, radius: 90 },
  { x: 820, y: 225, radius: 67 }, { x: 1115, y: 595, radius: 82 },
  { x: 1390, y: 300, radius: 70 },
];

export const JELLYFISH = [
  { x: 385, y: 430, radius: 28, phase: 0.2 },
  { x: 1010, y: 360, radius: 26, phase: 2.1 },
  { x: 1280, y: 720, radius: 30, phase: 4.3 },
];

export function currentAt(time) {
  const phase = Math.floor(time / 9) % 2;
  const strength = 46 + Math.sin(time * 1.8) * 13;
  return phase === 0 ? { x: strength, y: 0 } : { x: 0, y: -strength };
}

export function jellyPosition(jelly, time) {
  return { x: jelly.x + Math.sin(time * 0.85 + jelly.phase) * 36, y: jelly.y + Math.cos(time * 0.7 + jelly.phase) * 25, radius: jelly.radius };
}

export function keepOutOfCoral(entity, corals = CORALS) {
  for (const coral of corals) {
    if (!circlesTouch(entity, coral)) continue;
    const candidate = normalize(entity.x - coral.x, entity.y - coral.y);
    const direction = candidate.x || candidate.y ? candidate : { x: 1, y: 0 };
    const safe = coral.radius + entity.radius + 1;
    entity.x = coral.x + direction.x * safe;
    entity.y = coral.y + direction.y * safe;
  }
  entity.x = Math.max(entity.radius, Math.min(WORLD.width - entity.radius, entity.x));
  entity.y = Math.max(entity.radius, Math.min(WORLD.height - entity.radius, entity.y));
}

export function touchesJellyfish(entity, time) {
  return JELLYFISH.some(jelly => circlesTouch(entity, jellyPosition(jelly, time)));
}
