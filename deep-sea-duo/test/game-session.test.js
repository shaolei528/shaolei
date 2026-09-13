import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameSession } from '../src/app/game-session.js';

const idleInput = () => ({ movement: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, firing: false, dash: false });

test('host world is frozen before connect, then moves and spawns enemies after connect', () => {
  const session = createGameSession({ random: () => 0.5 });
  session.begin('host');
  const startX = session.game.player.x;

  for (let i = 0; i < 80; i += 1) {
    session.tick(0.025, { ...idleInput(), movement: { x: 1, y: 0 } });
  }
  assert.equal(session.game.time, 0);
  assert.equal(session.game.enemies.length, 0);
  assert.equal(session.game.player.x, startX);

  session.connect();
  for (let i = 0; i < 80; i += 1) {
    session.tick(0.025, { ...idleInput(), movement: { x: 1, y: 0 } });
  }
  assert.ok(session.game.time > 1.9);
  assert.ok(session.game.player.x > startX);
  assert.ok(session.game.enemies.length > 0);
});

test('host snapshot sequence is session-local and monotonic', () => {
  const session = createGameSession({ random: () => 0.5 });
  const ticks = [];
  session.begin('host');
  session.connect();
  for (let i = 0; i < 20; i += 1) {
    session.tick(0.05, idleInput(), { sendSnapshot: (_game, tick) => { ticks.push(tick); return true; } });
  }
  assert.ok(ticks.length >= 10);
  assert.equal(ticks[0], 1);
  assert.deepEqual(ticks, [...ticks].sort((a, b) => a - b));
  assert.equal(new Set(ticks).size, ticks.length);

  session.begin('host');
  session.connect();
  const nextTicks = [];
  session.tick(0.05, idleInput(), { sendSnapshot: (_game, tick) => { nextTicks.push(tick); return true; } });
  assert.deepEqual(nextTicks, [1]);
});

test('guest new session accepts a lower tick from a different host', () => {
  const session = createGameSession({ random: () => 0.5 });
  session.begin('guest');
  session.connect();
  assert.equal(session.applySnapshot({ tick: 9000, players: [{ x: 10 }, { x: 20 }], enemies: [], bubbles: [], food: [] }), true);
  assert.equal(session.game.remotePlayer.x, 20);

  session.begin('guest');
  session.connect();
  assert.equal(session.applySnapshot({ tick: 1, players: [{ x: 30 }, { x: 40 }], enemies: [], bubbles: [], food: [] }), true);
  assert.equal(session.game.remotePlayer.x, 40);
});

test('guest sends input without locally advancing authoritative world', () => {
  const session = createGameSession({ random: () => 0.5 });
  const sent = [];
  session.begin('guest');
  session.connect();
  for (let i = 0; i < 10; i += 1) {
    session.tick(0.04, { movement: { x: 1, y: 0 }, aim: { x: 0, y: 1 }, firing: true, dash: i === 0 }, {
      sendInput: input => { sent.push(input); return true; },
    });
  }
  assert.equal(session.game.time, 0);
  assert.ok(sent.length >= 5);
  assert.equal(sent[0].dash, true);
  assert.equal(sent[0].movement.x, 1);
});

test('disconnect stops simulation until the session reconnects', () => {
  const session = createGameSession({ random: () => 0.5 });
  session.begin('host');
  session.connect();
  session.tick(0.05, idleInput());
  const time = session.game.time;
  session.disconnect();
  session.tick(0.05, { ...idleInput(), movement: { x: 1, y: 0 } });
  assert.equal(session.game.time, time);
});
