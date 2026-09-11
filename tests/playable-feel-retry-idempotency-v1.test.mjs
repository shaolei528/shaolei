import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const feelSource=fs.readFileSync(new URL('../modules/combat/playable-feel-v1.js',import.meta.url),'utf8');
assert.ok(feelSource.includes('ABYSSAL_PLAYABLE_FEEL_RUNTIME_V1'),'feel bridge must expose retry ownership marker');
for(const forbidden of ['zoneCh.send','new WebSocket(','fetch(','saveLocal(','localStorage.']){
  assert.equal(feelSource.includes(forbidden),false,`feel retry hardening must remain presentation-only: ${forbidden}`);
}

let now=2000;
const emitted=[];
const baseCalls={attack:0,handleMobAttack:0,onMobs:0,onMobHit:0,onAttack:0,drawLighting:0};
class CustomEventMock{constructor(type,init={}){this.type=type;this.detail=init.detail;}}
const sandbox={
  console,window:null,globalThis:null,CustomEvent:CustomEventMock,
  performance:{now:()=>now},SESSION_ID:'self',
  mobs:[{id:'m1',kind:'crawler',x:40,y:50,hp:30}],me:{hp:100},inventory:{knife:true},attackCd:0,attackFlash:0,
  attack(){baseCalls.attack++;sandbox.attackCd=.32;sandbox.attackFlash=.15;},
  handleMobAttack(){baseCalls.handleMobAttack++;sandbox.mobs[0].hp-=10;},
  onMobs(){baseCalls.onMobs++;sandbox.mobs[0].hp-=5;},
  onMobHit(){baseCalls.onMobHit++;sandbox.me.hp-=4;},
  onAttack(){baseCalls.onAttack++;sandbox.me.hp-=3;},
  drawLighting(){baseCalls.drawLighting++;},
  canvas:{style:{translate:''}},
  dispatchEvent(event){emitted.push(event);return true;},
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);
const run=()=>vm.runInContext(feelSource,sandbox,{filename:'playable-feel-v1.js'});

run();
const api=sandbox.ABYSSAL_PLAYABLE_FEEL_V1;
const runtime=sandbox.ABYSSAL_PLAYABLE_FEEL_RUNTIME_V1;
const installed={
  attack:sandbox.attack,handleMobAttack:sandbox.handleMobAttack,onMobs:sandbox.onMobs,
  onMobHit:sandbox.onMobHit,onAttack:sandbox.onAttack,drawLighting:sandbox.drawLighting
};
assert.ok(api,'first evaluation must install feel API');
assert.equal(runtime?.bound,true,'first evaluation must claim wrapper ownership');
assert.equal(runtime?.version,1);

for(let i=0;i<50;i++)run();
assert.equal(sandbox.ABYSSAL_PLAYABLE_FEEL_V1,api,'retry evaluation must preserve feel API object identity');
assert.equal(sandbox.ABYSSAL_PLAYABLE_FEEL_RUNTIME_V1,runtime,'retry evaluation must preserve runtime marker identity');
assert.equal(runtime.reentryCount,50,'retry count must remain observable');
for(const [name,fn] of Object.entries(installed)){
  assert.equal(sandbox[name],fn,`${name} wrapper identity must not change across retries`);
}

// One successful local attack after 50 retries: one canonical attack + one semantic swing.
emitted.length=0;
sandbox.attackCd=0;sandbox.attackFlash=0;
sandbox.attack();
assert.equal(baseCalls.attack,1,'base attack must execute exactly once');
assert.equal(emitted.filter(e=>e.type==='abyssal:player-swing').length,1,'one accepted attack must emit exactly one swing event');

// Confirmed local mob damage: one canonical mutation + one hit event.
emitted.length=0;sandbox.mobs[0].hp=30;
sandbox.handleMobAttack({id:'self'});
assert.equal(baseCalls.handleMobAttack,1,'base handleMobAttack must execute exactly once');
assert.equal(sandbox.mobs[0].hp,20);
assert.equal(emitted.filter(e=>e.type==='abyssal:combat-hit').length,1,'local mob damage must emit exactly one hit event');

// Remote/world mob update wrapper also remains single-owned.
emitted.length=0;sandbox.mobs[0].hp=30;
sandbox.onMobs({});
assert.equal(baseCalls.onMobs,1,'base onMobs must execute exactly once');
assert.equal(sandbox.mobs[0].hp,25);
assert.equal(emitted.filter(e=>e.type==='abyssal:combat-hit').length,1,'mob update damage must emit exactly one hit event');

// Both incoming damage paths stay single-owned.
emitted.length=0;sandbox.me.hp=100;
sandbox.onMobHit({target:'self'});
assert.equal(baseCalls.onMobHit,1,'base onMobHit must execute exactly once');
assert.equal(sandbox.me.hp,96);
assert.equal(emitted.filter(e=>e.type==='abyssal:player-hurt').length,1,'onMobHit must emit one hurt event');

emitted.length=0;sandbox.me.hp=100;
sandbox.onAttack({target:'self'});
assert.equal(baseCalls.onAttack,1,'base onAttack must execute exactly once');
assert.equal(sandbox.me.hp,97);
assert.equal(emitted.filter(e=>e.type==='abyssal:player-hurt').length,1,'onAttack must emit one hurt event');

// Render hook identity is stable and canonical draw path still executes once.
api.kick(2,100);now+=16;
sandbox.drawLighting(360,600);
assert.equal(baseCalls.drawLighting,1,'base drawLighting must execute exactly once');
assert.ok(sandbox.canvas.style.translate,'presentation kick remains active after retry hardening');

console.log(JSON.stringify({ok:true,retries:50,wrapperIdentity:'stable',baseCombatCalls:'single',swingEvents:1,hitEvents:'single-per-path',hurtEvents:'single-per-path',drawLighting:'single'}));
