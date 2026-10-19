import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../modules/safe-camp/game-v7-patch.js', import.meta.url), 'utf8');
const spawnSource = source.match(/freshMob=function\(zone,i\)\{[^]*?\};[\s\S]*?spawnMobs=function\(zone\)\{[^]*?\};/)?.[0];
assert.ok(spawnSource, 'the active Safe Camp override must own deterministic creature seeding');

function hash(x, y, seed = 1337) {
  let n = (x * 374761393 + y * 668265263 + seed * 69069) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967295;
}

function seededZone(zone) {
  const sandbox = {
  WORLD: { zone: 1600 },
    CAMP: { x: 2400, y: 2400, r: 470 },
    campDist: (x, y) => Math.hypot(x - 2400, y - 2400),
    hash,
    freshMob: null,
    mobs: [],
  };
  vm.createContext(sandbox);
  vm.runInContext(`${spawnSource}; spawnMobs('${zone}');`, sandbox);
  return sandbox.mobs;
}

const starterMobs = seededZone('1:1');
assert.equal(starterMobs.length, 2, 'Safe Camp should open into two encounters spaced across the field');
assert.ok(starterMobs.every(mob => mob.kind === 'crawler' && mob.hp === 48), 'the starter zone should use the lowest-pressure creature and keep its authored starter health');
assert.ok(starterMobs.every(mob => Math.hypot(mob.x - 2400, mob.y - 2400) >= 840), 'starter creatures must spawn beyond the safe-camp buffer');
assert.ok(Math.hypot(starterMobs[0].x - starterMobs[1].x, starterMobs[0].y - starterMobs[1].y) > 500, 'the first fights must not collapse into one crowded pack');

const fieldMobs = seededZone('1:0');
assert.equal(fieldMobs.length, 0, 'the first expedition zone must not add an unrelated ambient pack on top of the authored POI encounter');
const laterMobs = seededZone('2:1');
assert.equal(laterMobs.length, 6, 'later sandbox regions must keep their authored population density');
assert.ok(laterMobs.some(mob => mob.kind === 'watcher') && laterMobs.some(mob => mob.kind === 'cultist') && laterMobs.some(mob => mob.kind === 'crawler'), 'later sandbox regions must retain mixed creature types');

console.log(JSON.stringify({ ok: true, starterCount: starterMobs.length, starterKinds: [...new Set(starterMobs.map(mob => mob.kind))], starterSpacing: Math.round(Math.hypot(starterMobs[0].x - starterMobs[1].x, starterMobs[0].y - starterMobs[1].y)), mireMartAmbientCount: fieldMobs.length, laterRegionCount: laterMobs.length, laterRegionKinds: [...new Set(laterMobs.map(mob => mob.kind))] }));
