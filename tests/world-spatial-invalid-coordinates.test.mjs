import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../modules/world/world-spatial-v1.js', import.meta.url), 'utf8');
const sandbox = { globalThis: null };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'world-spatial-v1.js' });

const spatial = sandbox.ABYSSAL_WORLD_SPATIAL_V1;
spatial.registerGeometry({
  id: 'invalid-input-test',
  zone: '1:0',
  colliders: [{ id: 'wall', x: 100, y: 100, w: 20, h: 20 }]
});

assert.equal(spatial.isBlockedPoint('1:0', Number.NaN, 110), true, 'a non-finite point is not a valid occupiable position');
assert.equal(spatial.isBlockedPoint('1:0', 110, Number.POSITIVE_INFINITY), true);
assert.equal(spatial.isBlockedCircle('1:0', Number.NaN, 110, 10), true);
assert.equal(spatial.isBlockedCircle('1:0', 90, 110, Number.NaN), true);

const badTarget = spatial.resolveMovement('1:0', 80, 80, Number.NaN, 120, 10);
assert.deepEqual({ ...badTarget }, { x: 80, y: 80, blocked: true }, 'invalid target must preserve the last valid origin and report blocked');

const badOrigin = spatial.resolveMovement('1:0', Number.NaN, 80, 120, 80, 10);
assert.deepEqual({ ...badOrigin }, { x: 0, y: 80, blocked: true }, 'invalid origin must not become an accepted movement');

assert.equal(spatial.isBlockedPoint('1:0', 110, 110), true, 'registered wall collision remains active');
assert.equal(spatial.isBlockedPoint('1:0', 80, 80), false, 'valid free positions remain free');
for (const collider of [
  { id: 'nan-x', x: Number.NaN, y: 0, w: 10, h: 10 },
  { id: 'infinite-width', x: 0, y: 0, w: Number.POSITIVE_INFINITY, h: 10 },
  { id: 'negative-width', x: 0, y: 0, w: -1, h: 10 },
  { id: 'overflowing-right-edge', x: Number.MAX_VALUE, y: 0, w: Number.MAX_VALUE, h: 10 }
]) {
  assert.throws(
    () => spatial.registerGeometry({ id: `invalid-${collider.id}`, zone: 'invalid-geometry', colliders: [collider] }),
    /invalid bounds/,
    `${collider.id} must be rejected rather than silently omitted or normalized`
  );
}

assert.deepEqual([...spatial.geometryIds('invalid-geometry')], [], 'rejected geometry must not leave a partially registered record');
const wallMove = spatial.resolveMovement('1:0', 80, 110, 140, 110, 0);
assert.equal(wallMove.blocked, true);
assert.ok(wallMove.x < 100, 'valid movement still stops before the wall');

const unregisteredZoneMove = spatial.resolveMovement('1:1', 1700, 1900, 1757, 1900, 10);
assert.deepEqual({ ...unregisteredZoneMove }, { x: 1757, y: 1900, blocked: false }, 'existing unregistered-zone movement semantics remain unchanged');

console.log(JSON.stringify({ ok: true, invalidPositions: 'blocked', registeredGeometry: 'preserved', unregisteredZoneCompatibility: 'preserved' }));
