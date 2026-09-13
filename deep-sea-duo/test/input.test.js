import test from 'node:test';
import assert from 'node:assert/strict';
import { directionFromDrag } from '../src/game/input.js';

test('swipe input stays idle inside the dead zone', () => {
  assert.deepEqual(directionFromDrag({ x: 0.2, y: 0.6 }, { x: 0.21, y: 0.61 }), { x: 0, y: 0 });
});

test('swipe input follows the drag direction instead of a fixed screen anchor', () => {
  const right = directionFromDrag({ x: 0.08, y: 0.2 }, { x: 0.2, y: 0.2 });
  const up = directionFromDrag({ x: 0.42, y: 0.8 }, { x: 0.42, y: 0.62 });
  assert.ok(right.x > 0.7);
  assert.ok(Math.abs(right.y) < 0.01);
  assert.ok(up.y < -0.9);
  assert.ok(Math.abs(up.x) < 0.01);
});

test('large swipes are clamped to a unit vector', () => {
  const direction = directionFromDrag({ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 });
  assert.ok(Math.abs(Math.hypot(direction.x, direction.y) - 1) < 1e-9);
});
