import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('modules/safe-camp/game-v7-patch.js', 'utf8');
const combatSource = fs.readFileSync('modules/combat/mob-combat.js', 'utf8');
const node = () => ({ addEventListener() {}, classList: { contains: () => true, add() {}, remove() {}, toggle() {} }, querySelector: () => null });

function createRuntime() {
  let now = 0;
  const intervals = [];
  const sandbox = {
    Date: class extends Date { static now() { return now; } },
    document: { getElementById: () => null, createElement: node },
    localStorage: { getItem: () => null, setItem() {} },
    CAMP: { x: 2400, y: 2400, r: 500 }, me: { id: 'test', x: 2400, y: 2400, hp: 100, hunger: 100, sanity: 100 },
    inventory: { wood: 0, stone: 0, food: 2, shard: 0 }, currentZone: '1:1',
    useBtn: node(), attackBtn: node(), dashBtn: node(), joystick: node(), chatToggle: null,
    craftPanel: node(), chatPanel: node(), questText: { textContent: '' },
    resources: [], harvested: new Map(), mobs: [], remotes: new Map(), lastSeqById: new Map(),
    zoneCh: null, zoneConnected: false, dead: false, SESSION_ID: 'test', zoneLeader: true,
    addCampResources() {}, onWorld() {}, onMove() {}, sendMove() {}, updateQuest() {},
    freshMob(zone, index) { return { id: `${zone}-${index}` }; }, spawnMobs() {}, drawCamp() {}, draw() {}, stopJoy() {},
    finite: Number, WORLD: { zone: 1600 }, hash: () => .5,
    setInterval(callback, ms) { intervals.push({ callback, ms }); return intervals.length; },
    Math, Map, Set, clamp: (n, lo, hi) => Math.max(lo, Math.min(hi, n)),
  };
  sandbox.window = sandbox;
  sandbox.campDist = (x, y) => Math.hypot(x - sandbox.CAMP.x, y - sandbox.CAMP.y);
  vm.createContext(sandbox);
  vm.runInContext(combatSource, sandbox, { filename: 'mob-combat.js' });
  vm.runInContext(source, sandbox, { filename: 'game-v7-patch.js' });
  return {
    sandbox,
    get now() { return now; },
    tick(ms) { now += ms; for (const timer of intervals) if (timer.ms === 250) timer.callback(); return now; },
  };
}

// The base SafeCamp module leaves the MIRE MART zone empty; the POI owner adds
// its two authored crawlers later. Later sandbox zones keep their ambient set.
{
  const runtime = createRuntime();
  const { sandbox } = runtime;
  sandbox.spawnMobs('1:0');
  assert.equal(sandbox.mobs.length, 0, 'the base SafeCamp module must not duplicate POI-owned crawlers');
  sandbox.spawnMobs('1:1');
  assert.equal(sandbox.mobs.length, 2, 'Safe Camp keeps its smaller authored population');
  sandbox.spawnMobs('1:2');
  assert.equal(sandbox.mobs.length, 6, 'later sandbox regions retain their full ambient density');
}

for (const wardMs of [15_000, 25_000]) {
  const runtime = createRuntime();
  runtime.sandbox.fieldGraceUntil = wardMs;
  while (runtime.now < wardMs - 250) runtime.tick(250);
  assert.equal(runtime.sandbox.fieldGraceUntil > runtime.now, true, `${wardMs / 1000}s ward remains active before expiry`);
  runtime.tick(250);
  assert.equal(runtime.sandbox.fieldGraceUntil > runtime.now, false, `${wardMs / 1000}s ward expires on schedule and is not extended`);
}

// Local leader AI ignores a protected player during the ward, then resumes pursuit on its next simulation update.
{
  const runtime = createRuntime();
  const { sandbox } = runtime;
  sandbox.me.x = 3000; sandbox.me.y = 2800;
  sandbox.mobs = [{ id: 'test-crawler', kind: 'crawler', x: 3200, y: 2800, hp: 48, phase: 0.5, hitCd: 0, respawnAt: 0 }];
  sandbox.fieldGraceUntil = 15_000;
  runtime.tick(14_999);
  sandbox.updateMobs(0.1);
  const beforeExpiry = Math.hypot(sandbox.mobs[0].x - sandbox.me.x, sandbox.mobs[0].y - sandbox.me.y);
  runtime.tick(1);
  sandbox.updateMobs(0.1);
  const afterExpiry = Math.hypot(sandbox.mobs[0].x - sandbox.me.x, sandbox.mobs[0].y - sandbox.me.y);
  assert.ok(afterExpiry < beforeExpiry, 'local mobs should resume pursuing the player after protection expires');
}

console.log('field ward expiry and enemy pursuit regressions passed');
