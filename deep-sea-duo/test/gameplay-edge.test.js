import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD } from '../src/game/constants.js';
import { bossRewardPositions, createSharkBoss } from '../src/game/boss.js';
import { createPowerup } from '../src/game/powerups.js';
import { applyHostSnapshot, applyRemoteInput, createGame, step } from '../src/game/simulation.js';

const idle = () => ({ movement: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, firing: false, dash: false });

test('dead local player cannot keep firing', () => {
  const game = createGame(() => 0.5);
  game.player.hp = 0;
  step(game, { ...idle(), firing: true }, 0.02);
  assert.equal(game.bubbles.some(bubble => bubble.ownerId === game.player.id), false);
});

test('dead players cannot collect food or healing powerups', () => {
  const game = createGame(() => 0.5);
  game.player.hp = 0;
  game.food.push({ id: 'food-test', x: game.player.x, y: game.player.y, radius: 12, xp: 3, life: 5, spin: 0 });
  game.powerup = createPowerup('heal', () => 0.5);
  game.powerup.x = game.player.x;
  game.powerup.y = game.player.y;

  step(game, idle(), 0.01);

  assert.equal(game.player.hp, 0);
  assert.equal(game.player.xp, 0);
  assert.equal(game.food.length, 1);
  assert.notEqual(game.powerup, null);
});

test('players separate even when their centers are exactly identical', () => {
  const game = createGame(() => 0.5);
  game.player.x = 700;
  game.player.y = 450;
  game.remotePlayer.x = 700;
  game.remotePlayer.y = 450;

  step(game, idle(), 0.01);

  const distance = Math.hypot(
    game.player.x - game.remotePlayer.x,
    game.player.y - game.remotePlayer.y,
  );
  assert.ok(distance > game.player.radius + game.remotePlayer.radius);
});

test('boss rewards are clamped inside the playable world', () => {
  const boss = createSharkBoss();
  boss.x = -250;
  boss.y = WORLD.height + 250;
  const rewards = bossRewardPositions(boss);
  assert.equal(rewards.length, 12);
  assert.ok(rewards.every(point => point.x >= 0 && point.x <= WORLD.width));
  assert.ok(rewards.every(point => point.y >= 0 && point.y <= WORLD.height));
});

test('wave powerup immediately completes boss defeat pipeline', () => {
  const game = createGame(() => 0.5);
  game.boss = createSharkBoss();
  game.boss.phase = 'stalk';
  game.boss.hp = 1;
  game.boss.x = 900;
  game.boss.y = 450;
  game.powerup = createPowerup('wave', () => 0.5);
  game.powerup.x = game.player.x;
  game.powerup.y = game.player.y;

  step(game, idle(), 0.01);

  assert.equal(game.boss, null);
  assert.equal(game.food.filter(food => food.xp === 3).length, 12);
});

test('malformed peer input and snapshots are rejected without throwing', () => {
  const game = createGame(() => 0.5);
  assert.equal(applyRemoteInput(game, null), false);
  assert.equal(applyRemoteInput(game, { sequence: 1, movement: { x: Number.NaN, y: 0 } }), true);
  assert.deepEqual(game.remotePlayer.movement, { x: 0, y: 0 });
  assert.equal(applyHostSnapshot(game, null), false);
  assert.equal(applyHostSnapshot(game, { tick: Number.NaN }), false);
});
