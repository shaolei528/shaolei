import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../modules/home/home-building-v1.js', import.meta.url), 'utf8');
const config = JSON.parse(fs.readFileSync(new URL('../data/building/structures-v1.json', import.meta.url), 'utf8'));
const colliders = new Map();
let saveOk = true;
let saveSnapshot = null;
const inventory = { wood: 4, stone: 3 };
const spatial = {
  registerGeometry({ id, zone, colliders: items }) { colliders.set(id, { zone, items }); },
  unregisterGeometry(id) { colliders.delete(id); },
  isBlockedPoint(zone, x, y) {
    return [...colliders.values()].some(record => record.zone === zone && record.items.some(box => x >= box.x && y >= box.y && x < box.x + box.w && y < box.y + box.h));
  }
};
const listeners = new Map();
const buttonListeners = new Map();
const button = { addEventListener() {} };
const doc = {
  body: { appendChild() {} },
  createElement() { return { style: {}, dataset: {}, setAttribute() {}, addEventListener(type, listener) { buttonListeners.set(type, listener); } }; },
  getElementById(id) { return id === 'interactV12' ? button : null; }
};
const context = vm.createContext({
  globalThis: null, window: null, document: doc, console, Date, Math, setInterval() {}, CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } },
  ABYSSAL_BUILDING_CONFIG_V1: config,
  ABYSSAL_WORLD_SPATIAL_V1: spatial,
  ABYSSAL_SAVE_EXTENSIONS_V1: { register(id, provider) { this.provider = provider; return true; } },
  ABYSSAL_INVENTORY_TRANSACTIONS_V1: {
    commitItemExchange({ costs = {}, grants = {} }) {
      for (const [key, amount] of Object.entries(costs)) if ((inventory[key] || 0) < amount) return { ok: false, reason: 'materials-required', item: key };
      for (const [key, amount] of Object.entries(costs)) inventory[key] -= amount;
      for (const [key, amount] of Object.entries(grants)) inventory[key] = (inventory[key] || 0) + amount;
      if (!context.saveLocal()) {
        for (const [key, amount] of Object.entries(costs)) inventory[key] += amount;
        for (const [key, amount] of Object.entries(grants)) inventory[key] -= amount;
        return { ok: false, reason: 'save-failed' };
      }
      return { ok: true };
    }
  },
  WORLD: { w: 4800, h: 4800, zone: 1600 }, currentZone: '1:1', started: true, dead: false,
  CAMP: { x: 2400, y: 2400, r: 470 }, me: { x: 2400, y: 2400, r: 14, dir: 0 }, inventory,
  mobs: [], remotes: new Map(), SESSION_ID: 'test-player', toast() {}, saveLocal() { if (!saveOk) return false; saveSnapshot = context.ABYSSAL_HOME_BUILDING_V1?.snapshot?.() || saveSnapshot; return true; },
  addEventListener(type, listener) { listeners.set(type, listener); }, dispatchEvent() {}
});
context.globalThis = context;
context.window = context;
vm.runInContext(source, context, { filename: 'home-building-v1.js' });
const api = context.ABYSSAL_HOME_BUILDING_V1;

assert.ok(api, 'HOME & Building registers its owner API');
assert.equal(api.canPlace({ x: 2488, y: 2400, axis: 'y' }).ok, true, 'valid nearby open ground can be built on');
context.me.y = 2470;
buttonListeners.get('click')();
assert.equal(api.isBuildMode(), true, 'the visible build control opens build mode');
buttonListeners.get('click')();
const built = { ok: true, structure: api.getSnapshot()[0] };
assert.equal(built.ok, true);
assert.deepEqual({ wood: inventory.wood, stone: inventory.stone }, { wood: 2, stone: 2 }, 'the one inventory transaction charges exactly once');
assert.equal(api.getSnapshot().length, 1);
assert.equal(colliders.size, 1, 'the placed barricade registers a real movement collider');
assert.equal(spatial.isBlockedPoint('1:1', built.structure.x, built.structure.y), true);
assert.equal(api.canPlace({ x: built.structure.x, y: built.structure.y, axis: 'y' }).reason, 'occupied', 'structures cannot overlap');

const beforeFailure = inventory.wood;
saveOk = false;
context.me.x = 2544;
context.me.y = 2400;
const failed = api.placeAt(2624, 2400, 'y');
assert.equal(failed.reason, 'save-failed');
assert.equal(inventory.wood, beforeFailure, 'failed save returns all materials');
assert.equal(api.getSnapshot().length, 1, 'failed placement leaves no ghost structure');
assert.equal(colliders.size, 1, 'failed placement unregisters its collider');
saveOk = true;

context.me.x = built.structure.x;
context.me.y = built.structure.y;
const removed = api.dismantle(built.structure.id);
assert.equal(removed.ok, true);
assert.equal(inventory.wood, 3, 'dismantling refunds one wood through Items');
assert.equal(api.getSnapshot().length, 0);
assert.equal(colliders.size, 0);

const restoredState = { version: 1, nextId: 5, structures: [{ ...built.structure }] };
context.ABYSSAL_SAVE_EXTENSIONS_V1.provider.restore(restoredState);
assert.equal(api.getSnapshot().length, 1, 'V5 owner extension restores the placed structure');
assert.equal(colliders.size, 1, 'restored structures re-register collision');

const elsewhere={id:'barrier-other-zone',kind:'wood-barricade',zone:'1:2',x:2400,y:3500,axis:'x',health:90};
context.ABYSSAL_SAVE_EXTENSIONS_V1.provider.restore({version:1,nextId:6,structures:[{...built.structure},elsewhere]});
assert.equal(api.snapshotForZone('1:1').structures.length,1,'the zone snapshot filters out structures elsewhere');
const remoteStructure={id:'barrier-remote-1',kind:'wood-barricade',zone:'1:1',x:2500,y:2500,axis:'y',health:90};
assert.equal(api.applyRemoteZoneSnapshot('1:1',{version:1,nextId:12,structures:[remoteStructure]}),true,'Relay structure snapshots are persisted');
assert.deepEqual(JSON.parse(JSON.stringify(api.getSnapshot().map(item=>item.id).sort())),['barrier-other-zone','barrier-remote-1'],'applying one zone leaves other-zone structures intact');
assert.equal(colliders.size,2,'remote structures register their movement colliders');
saveOk=false;
assert.equal(api.applyRemoteZoneSnapshot('1:1',{version:1,nextId:13,structures:[]}),false,'failed remote placement persistence is rejected');
assert.deepEqual(JSON.parse(JSON.stringify(api.getSnapshot().map(item=>item.id).sort())),['barrier-other-zone','barrier-remote-1'],'failed remote persistence restores structures');
assert.equal(colliders.size,2,'failed remote persistence restores colliders');

console.log(JSON.stringify({ ok: true, placement: true, atomicCost: true, collision: true, overlapRejected: true, saveRollback: true, dismantleRefund: true, restore: true, remoteZoneMergeAndRollback: true }));
