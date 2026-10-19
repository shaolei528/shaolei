import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const worldSpatialSource = read('modules/world/world-spatial-v1.js');
const buildingSource = read('modules/home/home-building-v1.js');
const campSyncSource = read('modules/network/camp-world-sync-v1.js');
const mobCombatSource = read('modules/combat/mob-combat.js');
const buildingConfig = JSON.parse(read('data/building/structures-v1.json'));
const listeners = new Map(), saves = new Map(), relayMessages = [], notices = [];
let fakeNow = 10_000, saveOk = true, savedSnapshot = null, saveAttempts = 0;
const inventory = { wood: 4, stone: 3 };
const channel = { send(message) { relayMessages.push(message); return true; } };
const button = { addEventListener() {} };
const document = {
  body: { appendChild() {} },
  createElement() { return { style: {}, dataset: {}, setAttribute() {}, addEventListener() {} }; },
  getElementById() { return null; }
};
const context = vm.createContext({
  console, Math, Date: { now: () => fakeNow }, document,
  CustomEvent: class { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } },
  setInterval() {},
  WORLD: { w: 4800, h: 4800, zone: 1600 },
  CAMP: { x: 2400, y: 2400, r: 40 },
  currentZone: '1:1', zoneLeader: true, zoneLeaderId: 'leader', zoneConnected: true, fieldGraceUntil: 0,
  SESSION_ID: 'leader', zoneCh: channel, remotes: new Map(),
  me: { id: 'leader', x: 2700, y: 2400, r: 14, hp: 100 },
  mobs: [{ id: 'crawler-test', kind: 'crawler', x: 2540, y: 2400, hp: 58, phase: 0, hitCd: 0, respawnAt: 0 }],
  inventory, started: true, dead: false,
  campDist(x, y) { return Math.hypot(x - 2400, y - 2400); },
  clamp(value, min, max) { return Math.max(min, Math.min(max, value)); },
  freshMob() { throw new Error('unexpected mob respawn'); },
  applyMobDamage() {}, toast(message) { notices.push(message); },
  saveLocal() {
    saveAttempts++;
    if (!saveOk) return false;
    const provider = saves.get('home.building.v1');
    savedSnapshot = provider?.snapshot?.() || savedSnapshot;
    return true;
  },
  ABYSSAL_BUILDING_CONFIG_V1: buildingConfig,
  ABYSSAL_SAVE_EXTENSIONS_V1: { register(key, provider) { saves.set(key, provider); return true; } },
  ABYSSAL_INVENTORY_TRANSACTIONS_V1: {
    commitItemExchange({ costs = {}, grants = {} }) {
      for (const [key, amount] of Object.entries(costs)) if ((inventory[key] || 0) < amount) return { ok: false };
      for (const [key, amount] of Object.entries(costs)) inventory[key] -= amount;
      for (const [key, amount] of Object.entries(grants)) inventory[key] = (inventory[key] || 0) + amount;
      return { ok: true };
    }
  },
  addEventListener(type, listener) {
    const handlers = listeners.get(type) || [];
    handlers.push(listener);
    listeners.set(type, handlers);
  },
  dispatchEvent(event) {
    for (const listener of listeners.get(event.type) || []) listener(event);
    return true;
  }
});
context.globalThis = context;
context.window = context;

for (const [source, filename] of [
  [worldSpatialSource, 'world-spatial-v1.js'],
  [buildingSource, 'home-building-v1.js'],
  [campSyncSource, 'camp-world-sync-v1.js'],
  [mobCombatSource, 'mob-combat.js']
]) vm.runInContext(source, context, { filename });

const barrier = { id: 'barrier-defense-test', kind: 'wood-barricade', zone: '1:1', x: 2600, y: 2400, axis: 'x', health: 90 };
saves.get('home.building.v1').restore({ version: 1, nextId: 2, structures: [barrier] });
const building = context.ABYSSAL_HOME_BUILDING_V1;
function stepUntilSaveAttempt() {
  const before = saveAttempts;
  for (let frame = 0; frame < 12 && saveAttempts === before; frame++) context.ABYSSAL_MOB_COMBAT_V1.updateMobs(1 / 60);
  assert.equal(saveAttempts, before + 1, 'the crawler reaches the barricade within the bounded movement window');
}
assert.equal(building.getSnapshot()[0].health, 90);

context.zoneLeader = false;
context.dispatchEvent(new context.CustomEvent('abyssal:mob-movement-blocked', { detail: {
  playerId: 'leader', zone: '1:1', mobId: 'crawler-test', mobKind: 'crawler', fromX: 2540, fromY: 2400, toX: 2554, toY: 2400, radius: 10
} }));
assert.equal(building.getSnapshot()[0].health, 90, 'a nonleader cannot settle creature damage to a shared structure');
context.zoneLeader = true;

context.ABYSSAL_MOB_COMBAT_V1.updateMobs(1);
assert.equal(context.mobs[0].x < 2560, true, 'the world collider stops the crawler at the barricade');
assert.equal(building.getSnapshot()[0].health, 80, 'a blocked crawler damages the barricade once');
assert.equal(savedSnapshot?.structures?.[0]?.health, 80, 'the V5 owner snapshot records the accepted damage');
assert.equal(relayMessages.at(-1)?.payload?.domain, 'building', 'the leader relays the new durability snapshot');
assert.equal(relayMessages.at(-1)?.payload?.state?.structures?.[0]?.health, 80);

context.ABYSSAL_MOB_COMBAT_V1.updateMobs(1 / 60);
assert.equal(building.getSnapshot()[0].health, 80, 'the same creature cannot damage every simulation frame');
fakeNow += buildingConfig.creatureHitIntervalMs + 1;
stepUntilSaveAttempt();
assert.equal(building.getSnapshot()[0].health, 70, 'damage resumes after the configured creature hit interval');

saveOk = false;
fakeNow += buildingConfig.creatureHitIntervalMs + 1;
stepUntilSaveAttempt();
assert.equal(building.getSnapshot()[0].health, 70, 'a failed save rolls back barrier damage');
assert.equal(savedSnapshot?.structures?.[0]?.health, 70, 'failed writes do not replace the last durable snapshot');
assert.equal(context.ABYSSAL_WORLD_SPATIAL_V1.isBlockedPoint('1:1', barrier.x, barrier.y), true, 'a failed save keeps the movement collider');
saveOk = true;

for (let hit = 0; hit < 7; hit++) {
  fakeNow += buildingConfig.creatureHitIntervalMs + 1;
  stepUntilSaveAttempt();
}
assert.equal(building.getSnapshot().length, 0, 'repeated creature attacks can destroy the barricade');
assert.equal(context.ABYSSAL_WORLD_SPATIAL_V1.isBlockedPoint('1:1', barrier.x, barrier.y), false, 'destroyed barriers release their world collider');
assert.equal(relayMessages.at(-1)?.payload?.state?.structures?.length, 0, 'the leader relays the broken barrier');
assert.ok(notices.some(message => message.includes('被怪物摧毁')), 'destruction gives the player an explicit warning');

console.log(JSON.stringify({ ok: true, leaderAuthority: true, blockerDamage: true, configuredCooldown: true, saveRollback: true, destroyAndUnblock: true, relaySnapshots: true }));
