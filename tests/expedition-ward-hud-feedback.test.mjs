import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('modules/world/awakening-expedition-loop-v1.js', 'utf8');
let now = 1_000;
const sandbox = {
  Date: class extends Date { static now() { return now; } },
  window: null, started: true, dead: false,
  CAMP: { x: 2400, y: 2400, r: 500 },
  me: { x: 2400, y: 1800 },
  inventory: { wood: 4, stone: 3, food: 2, shard: 0, knife: true, lantern: false },
  fieldGraceUntil: 0,
  questText: { textContent: '' },
  inCamp: () => false,
  toast() {},
  ABYSSAL_AWAKENING_WORLD_V1: { poi: { x: 2100, y: 600, w: 600, h: 400, parking: { x: 2000, y: 1000, w: 700, h: 250 } } },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInNewContext(source, sandbox, { filename: 'awakening-expedition-loop-v1.js' });

for (const wardSeconds of [15, 25]) {
  const deadline = now + wardSeconds * 1_000;
  sandbox.fieldGraceUntil = deadline;
  sandbox.updateQuest();
  assert.ok(sandbox.questText.textContent.includes(`\u4e34\u65f6\u62a4\u7f51\u5269\u4f59 ${wardSeconds} \u79d2`), `${wardSeconds}s ward should be visible`);
  assert.match(sandbox.questText.textContent, /LEAVE HOME|MIRE MART/, 'ward status must not replace the active expedition objective');

  now = deadline - 1_000;
  sandbox.updateQuest();
  assert.ok(sandbox.questText.textContent.includes('\u4e34\u65f6\u62a4\u7f51\u5269\u4f59 1 \u79d2'), `${wardSeconds}s countdown should update near its deadline`);

  now = deadline;
  sandbox.updateQuest();
  assert.doesNotMatch(sandbox.questText.textContent, /\u4e34\u65f6\u62a4\u7f51/, 'expired ward should no longer appear active');
  assert.match(sandbox.questText.textContent, /MIRE MART/, 'expedition objective should remain after ward expiry');
  now = 1_000;
}

console.log('expedition objective retains and expires 15s and 25s ward countdowns');
