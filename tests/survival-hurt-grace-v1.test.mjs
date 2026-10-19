import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../modules/survival/hurt-grace-v1.js', import.meta.url), 'utf8');
let now = 1000;
const mob = { id: 'crawler-1', hitCd: 0 };
const context = {
  Date: { now: () => now },
  SESSION_ID: 'player-1',
  me: { hp: 100 },
  mobs: [mob],
  window: null,
  onMobHit(payload) {
    const targetMob = payload.mobId && this.mobs.find(item => item.id === payload.mobId);
    if (targetMob) targetMob.hitCd = Number(payload.hitCd) || 0;
    if (payload.target === this.SESSION_ID) this.me.hp -= Number(payload.damage) || 0;
  }
};
context.window = context;
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'hurt-grace-v1.js' });

context.onMobHit({ target: 'player-1', damage: 4, mobId: 'crawler-1', hitCd: 0.9 });
assert.equal(context.me.hp, 96, 'the first accepted hit applies damage');
assert.equal(context.ABYSSAL_SURVIVAL_HURT_GRACE_V1.snapshot().remainingMs, 800);

now += 100;
context.onMobHit({ target: 'player-1', damage: 8, mobId: 'crawler-1', hitCd: 0.8 });
assert.equal(context.me.hp, 96, 'a near-simultaneous second creature cannot stack damage');
assert.equal(mob.hitCd, 0.8, 'suppressed local damage still refreshes the authoritative creature cooldown');
assert.equal(context.ABYSSAL_SURVIVAL_HURT_GRACE_V1.snapshot().suppressedHits, 1);

now += 801;
context.onMobHit({ target: 'player-1', damage: 5, mobId: 'crawler-1', hitCd: 0.7 });
assert.equal(context.me.hp, 91, 'damage applies again after the short window expires');

now += 100;
context.onMobHit({ target: 'another-player', damage: 8, mobId: 'crawler-1', hitCd: 0.6 });
assert.equal(context.me.hp, 91, 'another player’s damage event never changes local health');

console.log(JSON.stringify({ ok: true, windowMs: 800, suppressedHits: context.ABYSSAL_SURVIVAL_HURT_GRACE_V1.snapshot().suppressedHits }));
