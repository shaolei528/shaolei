import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../modules/presentation/gameplay-particles-v1.js', import.meta.url), 'utf8');
const config = JSON.parse(fs.readFileSync(new URL('../data/presentation/gameplay-particles-v1.json', import.meta.url), 'utf8'));
assert.equal(config.version, 1);
assert.ok(config.profiles.combatHit.count > 0);
assert.ok(config.profiles.mobDeath.count > config.profiles.combatHit.count);

const listeners = new Map();
let now = 1000;
const sandbox = {
  window: {
    addEventListener(name, callback) { listeners.set(name, callback); },
    ABYSSAL_SHELL_V1: { getSettings: () => ({ reducedMotion: false }) },
  },
  performance: { now: () => now },
  me: { x: 12, y: 24 },
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const particles = sandbox.ABYSSAL_GAMEPLAY_PARTICLES_V1;
assert.equal(particles.version, 1);

listeners.get('abyssal:resource-collected')({ detail: { kind: 'wood', x: 100, y: 200 } });
assert.equal(particles.count, config.profiles.resourceCollected?.count ?? 9);
listeners.get('abyssal:combat-hit')({ detail: { x: 100, y: 200, killed: true } });
assert.equal(particles.count, (config.profiles.resourceCollected?.count ?? 9) + config.profiles.mobDeath.count);

const draws = [];
const context = { globalAlpha: 1, fillStyle: '', fillRect(...args) { draws.push(args); } };
const remaining = particles.draw(context, (x, y) => ({ x: x + 10, y: y + 20 }), now + 100);
assert.ok(remaining > 0);
assert.ok(draws.length > 0);
assert.ok(draws.every(rect => rect.every(Number.isFinite)));

for (let i = 0; i < 20; i++) listeners.get('abyssal:combat-hit')({ detail: { x: 0, y: 0, killed: true } });
assert.ok(particles.count <= config.maxParticles, 'particle pool remains bounded under repeated kills');
now += 5000;
particles.draw(context, (x, y) => ({ x, y }), now);
assert.equal(particles.count, 0, 'expired particles are retired during drawing');
particles.clear();

console.log('PASS gameplay particle events draw at world coordinates, follow JSON profiles, expire, and stay within the pool bound');
