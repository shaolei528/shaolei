import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const workSource = fs.readFileSync(new URL('../modules/interaction/resource-work.js', import.meta.url), 'utf8');
const interactionSource = fs.readFileSync(new URL('../modules/input/interaction-v12.js', import.meta.url), 'utf8');
const start = interactionSource.indexOf('function harvestResource(r){');
const end = interactionSource.indexOf('function restAtFire(){', start);
assert.ok(start >= 0 && end > start, 'canonical harvest function must remain available');
const harvestSource = interactionSource.slice(start, end);

let now = 1000;
class TestCustomEvent {
  constructor(type, options = {}) { this.type = type; this.detail = options.detail; this.cancelable = !!options.cancelable; this.defaultPrevented = false; }
  preventDefault() { if (this.cancelable) this.defaultPrevented = true; }
}
const listeners = new Map();
const windowApi = {
  AW_SUCCESSOR_PREVIEW: true,
  AW_DEV_QA: true,
  AW_SUCCESSOR_GRAYBOX_CONTINUITY: true,
  addEventListener(type, listener) { const list = listeners.get(type) || []; list.push(listener); listeners.set(type, list); },
  dispatchEvent(event) { for (const listener of listeners.get(event.type) || []) listener(event); return !event.defaultPrevented; }
};
const inventory = { wood: 0, stone: 0, food: 0, knife: false };
const harvested = new Map();
const feedback = [];
windowApi.addEventListener('abyssal:resource-work-feedback', event => feedback.push(event.detail));
const sandbox = {
  window: windowApi,
  CustomEvent: TestCustomEvent,
  ABYSSAL_CRAFTING_RECIPES_V1: { version: 1, recipes: { knife: { gathering: { woodHits: 2 } } } },
  Date: { now: () => now },
  inventory,
  harvested,
  ITEM_ZH: { wood: '木材', stone: '石头', food: '食物' },
  zoneConnected: false,
  zoneCh: null,
  currentZone: '1:1',
  emitGameplayEvent() {},
  saveLocal() {},
  updateUI() {},
  refreshInteractionPrompt() {},
  toast() {}
};
vm.createContext(sandbox);
vm.runInContext(workSource, sandbox, { filename: 'resource-work.js' });
function strike(id, type) {
  const resource = { id, type, x: 2400, y: 2400 };
  sandbox.resource = resource;
  vm.runInContext(`${harvestSource}\nharvestResource(resource);`, sandbox, { filename: 'canonical-resource-harvest.js' });
}

for (let hit = 1; hit <= 3; hit++) {
  now += 200;
  strike('camp:wood-test', 'wood');
  assert.equal(inventory.wood, hit === 3 ? 1 : 0, `wood should settle only after hit ${hit} of 3`);
  assert.equal(harvested.has('camp:wood-test'), hit === 3, 'wood cooldown starts only when the node is harvested');
}
for (let hit = 1; hit <= 4; hit++) {
  now += 200;
  strike('camp:stone-test', 'stone');
  assert.equal(inventory.stone, hit === 4 ? 1 : 0, `stone should settle only after hit ${hit} of 4`);
}
assert.deepEqual(feedback.map(({ type, hit, total, complete }) => [type, hit, total, complete]), [
  ['wood', 1, 3, false], ['wood', 2, 3, false], ['wood', 3, 3, true],
  ['stone', 1, 4, false], ['stone', 2, 4, false], ['stone', 3, 4, false], ['stone', 4, 4, true]
]);
assert.equal(windowApi.ABYSSAL_RESOURCE_WORK_V1.progressFor('camp:wood-test'), 0, 'completed work must clear local hit progress');

inventory.knife = true;
for (let hit = 1; hit <= 2; hit++) {
  now += 200;
  strike('camp:wood-with-knife', 'wood');
  assert.equal(inventory.wood, hit === 2 ? 2 : 1, `the bone knife should settle wood only on hit ${hit} of 2`);
}
for (let hit = 1; hit <= 4; hit++) {
  now += 200;
  strike('camp:stone-with-knife', 'stone');
  assert.equal(inventory.stone, hit === 4 ? 2 : 1, 'the bone knife must not change stone mining durability');
}
assert.deepEqual(feedback.slice(-6).map(({ type, hit, total, complete }) => [type, hit, total, complete]), [
  ['wood', 1, 2, false], ['wood', 2, 2, true],
  ['stone', 1, 4, false], ['stone', 2, 4, false], ['stone', 3, 4, false], ['stone', 4, 4, true]
]);

console.log(JSON.stringify({ ok: true, woodHits: { base: 3, withBoneKnife: 2 }, stoneHits: 4, inventorySettlement: 'final-hit-only', existingHarvestCooldown: 'preserved' }));
