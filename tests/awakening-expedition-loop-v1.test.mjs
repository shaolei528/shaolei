import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../modules/world/awakening-expedition-loop-v1.js',import.meta.url),'utf8');
const boot=fs.readFileSync(new URL('../survival-v21.html',import.meta.url),'utf8');
const combat=fs.readFileSync(new URL('../modules/combat/player-combat.js',import.meta.url),'utf8');
const relay=fs.readFileSync(new URL('../modules/network/network-relay-v16.js',import.meta.url),'utf8');
const contract=fs.readFileSync(new URL('../docs/contracts/MIRE_MART_EXPEDITION_LOOP_V1.md',import.meta.url),'utf8');

const CAMP={x:2400,y:2400,r:470};
const poi={x:2112,y:640,w:640,h:448,parking:{x:2048,y:1088,w:768,h:288}};
const toasts=[];
let oldQuestCalls=0;
const sandbox={
  console,window:null,globalThis:null,
  started:true,dead:false,CAMP,
  me:{x:CAMP.x,y:CAMP.y},
  inventory:{wood:0,stone:0,food:2,shard:0,knife:false,lantern:false},
  questText:{textContent:'legacy'},
  toast(text){toasts.push(String(text));},
  updateQuest(){oldQuestCalls++;},
  ABYSSAL_AWAKENING_WORLD_V1:{poi}
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
sandbox.inCamp=(p=sandbox.me)=>Math.hypot(p.x-CAMP.x,p.y-CAMP.y)<CAMP.r;
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'awakening-expedition-loop-v1.js'});

const api=sandbox.ABYSSAL_EXPEDITION_LOOP_V1;
assert.ok(api,'expedition service must expose a runtime API');
assert.equal(api.version,1);
assert.equal(api.contract.scope,'session-local-slice');
assert.deepEqual({...api.contract.requiredSalvage},{shard:2});
assert.deepEqual([...api.contract.phases],['PREPARE','LEAVE_HOME','REACH_MIRE_MART','SEARCH_FIGHT','SECURE_REQUIRED_SALVAGE','RETURN_HOME','COMPLETE']);

function obs(overrides={}){return{started:true,dead:false,inCamp:true,atMart:false,hasKnife:true,lantern:false,wood:4,stone:3,food:2,shard:0,...overrides};}

// Fresh start must not leave PREPARE until the existing Bone Knife exists.
{
  const m=api.createMachine();
  assert.equal(m.step(obs({hasKnife:false})).phase,'PREPARE');
  assert.equal(m.step(obs({hasKnife:true})).phase,'LEAVE_HOME');
}

// Full successful route must follow the approved state order exactly.
{
  const m=api.createMachine();
  assert.equal(m.step(obs()).phase,'LEAVE_HOME');
  assert.equal(m.step(obs({inCamp:false})).phase,'REACH_MIRE_MART');
  assert.equal(m.step(obs({inCamp:false,atMart:true})).phase,'SEARCH_FIGHT');
  assert.equal(m.step(obs({inCamp:false,atMart:true,shard:2})).phase,'SECURE_REQUIRED_SALVAGE');
  assert.equal(m.step(obs({inCamp:false,atMart:false,shard:2})).phase,'RETURN_HOME');
  assert.equal(m.step(obs({inCamp:true,atMart:false,shard:2})).phase,'COMPLETE');
  assert.deepEqual(m.snapshot().history,['PREPARE','LEAVE_HOME','REACH_MIRE_MART','SEARCH_FIGHT','SECURE_REQUIRED_SALVAGE','RETURN_HOME','COMPLETE']);
}

// Repeated entry must not duplicate or regress objective state.
{
  const m=api.createMachine();
  m.step(obs());m.step(obs({inCamp:false}));m.step(obs({inCamp:false,atMart:true}));
  assert.equal(m.step(obs({inCamp:false,atMart:false})).phase,'SEARCH_FIGHT');
  assert.equal(m.step(obs({inCamp:false,atMart:true})).phase,'SEARCH_FIGHT');
  assert.equal(m.snapshot().history.filter(v=>v==='SEARCH_FIGHT').length,1,'re-entry must not duplicate phase transitions');
}

// Early return to HOME before salvage does not complete or reset the expedition.
{
  const m=api.createMachine();
  m.step(obs());m.step(obs({inCamp:false}));
  assert.equal(m.step(obs({inCamp:true,shard:0})).phase,'REACH_MIRE_MART');
  m.step(obs({inCamp:false,atMart:true,shard:0}));
  assert.equal(m.step(obs({inCamp:true,atMart:false,shard:0})).phase,'SEARCH_FIGHT');
  assert.notEqual(m.snapshot().phase,'COMPLETE');
}

// Death/respawn at HOME must never masquerade as a successful return.
{
  const m=api.createMachine();
  m.step(obs());m.step(obs({inCamp:false}));m.step(obs({inCamp:false,atMart:true}));
  assert.equal(m.step(obs({dead:true,inCamp:false,atMart:true,shard:2})).deathPending,true);
  const afterRespawn=m.step(obs({dead:false,inCamp:true,atMart:false,shard:2}));
  assert.equal(afterRespawn.phase,'LEAVE_HOME');
  assert.equal(afterRespawn.attempt,2);
  assert.notEqual(afterRespawn.phase,'COMPLETE');
}

// Existing salvage is valid but cannot auto-complete from HOME; the route still has to happen.
{
  const m=api.createMachine();
  assert.equal(m.step(obs({inCamp:true,shard:2})).phase,'LEAVE_HOME');
  assert.equal(m.step(obs({inCamp:false,shard:2})).phase,'REACH_MIRE_MART');
  assert.equal(m.step(obs({inCamp:false,atMart:true,shard:2})).phase,'SEARCH_FIGHT');
  assert.equal(m.step(obs({inCamp:false,atMart:true,shard:2})).phase,'SECURE_REQUIRED_SALVAGE');
  assert.equal(m.step(obs({inCamp:false,atMart:false,shard:2})).phase,'RETURN_HOME');
  assert.equal(m.step(obs({inCamp:true,shard:2})).phase,'COMPLETE');
}

// Losing required salvage before return invalidates the secure state.
{
  const m=api.createMachine();
  m.step(obs());m.step(obs({inCamp:false}));m.step(obs({inCamp:false,atMart:true}));m.step(obs({inCamp:false,atMart:true,shard:2}));
  assert.equal(m.step(obs({inCamp:false,atMart:false,shard:1})).phase,'SEARCH_FIGHT');
}

// Runtime UI is only a display of service state and completion announcement fires once.
sandbox.inventory.wood=4;sandbox.inventory.stone=3;sandbox.inventory.knife=true;
sandbox.updateQuest();
assert.equal(oldQuestCalls,0,'expedition service must own the active objective display instead of chaining the temporary legacy objective wrapper');
assert.match(sandbox.questText.textContent,/LEAVE HOME/);
sandbox.me={x:2400,y:1800};sandbox.updateQuest();assert.match(sandbox.questText.textContent,/REACH MIRE MART/);
sandbox.me={x:2400,y:1200};sandbox.updateQuest();assert.match(sandbox.questText.textContent,/SEARCH \/ FIGHT/);
sandbox.inventory.shard=2;sandbox.updateQuest();assert.match(sandbox.questText.textContent,/SECURE SALVAGE/);
sandbox.me={x:2400,y:1500};sandbox.updateQuest();assert.match(sandbox.questText.textContent,/RETURN HOME/);
sandbox.me={x:CAMP.x,y:CAMP.y};sandbox.updateQuest();assert.match(sandbox.questText.textContent,/COMPLETE/);sandbox.updateQuest();
assert.equal(toasts.filter(t=>t.includes('远征完成')).length,1,'completion result must be announced once');
assert.match(sandbox.questText.textContent,/工作台|提灯/,'HOME completion must provide a concrete next step');

// The objective service may observe existing gameplay but must not acquire gameplay/network/save authority.
for(const forbidden of ['new WebSocket(','zoneCh.send','localStorage.setItem','saveLocal(','setInterval(','requestAnimationFrame(','addEventListener('])assert.equal(source.includes(forbidden),false,`expedition service must not own ${forbidden}`);
assert.ok(combat.includes('attackCd=inventory.knife?.32:.48'),'knife cooldown must remain unchanged');
assert.ok(combat.includes('range:inventory.knife?80:62'),'knife range must remain unchanged');
assert.ok(combat.includes('damage:inventory.knife?22:11'),'knife damage must remain unchanged');
assert.ok(relay.includes("protocol:'abyssal-relay-v1'"),'Relay protocol must remain unchanged');
assert.ok(contract.includes('session-local'),'contract must state local/session scope');
assert.ok(contract.includes('does not grant a permanent HOME upgrade'),'contract must record permanent HOME persistence debt');

const worldIndex=boot.indexOf("'modules/world/awakening-world-v1.js'"),expeditionIndex=boot.indexOf("'modules/world/awakening-expedition-loop-v1.js'"),motionIndex=boot.indexOf("'modules/main-loop/smooth-motion-v18.js'");
assert.ok(worldIndex>=0&&expeditionIndex>worldIndex,'expedition objective must load after MIRE MART world data');
assert.ok(motionIndex>expeditionIndex,'expedition service must load before final motion/UI tail without changing collision ownership');

console.log(JSON.stringify({ok:true,scope:'session-local-slice',states:[...api.contract.phases],requiredSalvage:api.contract.requiredSalvage,reentry:'idempotent',earlyReturn:'not-complete',deathRespawn:'retry-not-complete',existingSalvage:'recognized-route-still-required',combat:'unchanged',relay:'unchanged'}));
