import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const homeSource=fs.readFileSync(new URL('../modules/safe-camp/home-workbench-upgrade-v1.js',import.meta.url),'utf8');
const expeditionSource=fs.readFileSync(new URL('../modules/world/awakening-expedition-loop-v1.js',import.meta.url),'utf8');
const simulationSource=fs.readFileSync(new URL('../modules/main-loop/simulation-update.js',import.meta.url),'utf8');
const relaySource=fs.readFileSync(new URL('../modules/network/network-relay-v16.js',import.meta.url),'utf8');
const bootSource=fs.readFileSync(new URL('../survival-v21.html',import.meta.url),'utf8');
const contractSource=fs.readFileSync(new URL('../docs/contracts/HOME_WORKBENCH_UPGRADE_V1.md',import.meta.url),'utf8');

const CAMP={x:2400,y:2400,r:500};
const poi={x:2112,y:640,w:640,h:448,parking:{x:2048,y:1088,w:768,h:288}};

function memoryStorage(seed=new Map()){
  return{
    getItem(key){return seed.has(key)?seed.get(key):null;},
    setItem(key,value){seed.set(String(key),String(value));},
    removeItem(key){seed.delete(String(key));},
    _seed:seed
  };
}

function createRuntime(store=memoryStorage()){
  const toasts=[];
  let saveCalls=0,uiCalls=0,oldQuestCalls=0;
  const sandbox={
    console,window:null,globalThis:null,Date,
    started:true,dead:false,CAMP,
    me:{x:CAMP.x,y:CAMP.y},
    SESSION_ID:'test-player',
    inventory:{wood:4,stone:3,food:2,shard:0,knife:true,lantern:false},
    questText:{textContent:'legacy'},
    localStorage:store,
    toast(text){toasts.push(String(text));},
    updateUI(){uiCalls++;},
    updateQuest(){oldQuestCalls++;},
    ABYSSAL_AWAKENING_WORLD_V1:{poi},
    ABYSSAL_CREATURE_REWARDS_CONFIG_V1:{creatures:{crawler:{}}}
  };
  sandbox.saveLocal=()=>{saveCalls++;try{store.setItem('abyssal_wake_save_v5',JSON.stringify({v:5,inventory:{...sandbox.inventory}}));return true;}catch{return false;}};
  sandbox.window=sandbox;
  sandbox.globalThis=sandbox;
  sandbox.inCamp=(p=sandbox.me)=>Math.hypot(p.x-CAMP.x,p.y-CAMP.y)<CAMP.r;
  vm.createContext(sandbox);
  vm.runInContext(expeditionSource,sandbox,{filename:'awakening-expedition-loop-v1.js'});
  vm.runInContext(homeSource,sandbox,{filename:'home-workbench-upgrade-v1.js'});
  return{sandbox,store,toasts,getSaveCalls:()=>saveCalls,getUiCalls:()=>uiCalls,getOldQuestCalls:()=>oldQuestCalls};
}

function reachMart(runtime){
  const s=runtime.sandbox;
  s.updateQuest();
  s.me.x=2400;s.me.y=1800;s.updateQuest();
  s.me.x=2400;s.me.y=1200;s.updateQuest();
}

function confirmCreatureLoot(runtime){
  const s=runtime.sandbox;
  return s.ABYSSAL_EXPEDITION_LOOP_V1.recordConfirmedMobLoot({playerId:s.SESSION_ID,mobId:'test-crawler',mobKind:'crawler',rewardKey:'companion-egg:test-crawler:1',grants:{shard:1}});
}

// Fresh HOME state must keep the legacy 15s departure ward and refuse material-only upgrades.
{
  const runtime=createRuntime();
  const s=runtime.sandbox;
  const api=s.ABYSSAL_HOME_WORKBENCH_V1;
  assert.ok(api,'HOME workbench service must expose a runtime API');
  assert.equal(api.version,1);
  assert.equal(api.departureWardMs(),15000);
  assert.equal(api.getState().tier,1);
  assert.equal(api.getState().returnClearance,false);
  s.inventory.shard=2;
  assert.equal(api.canUpgrade().reason,'expedition-return-required');
  const before={stone:s.inventory.stone,shard:s.inventory.shard};
  assert.equal(api.upgrade().ok,false);
  assert.deepEqual({stone:s.inventory.stone,shard:s.inventory.shard},before,'materials must not be consumed before a qualifying return');
}

// Early return cannot create HOME upgrade clearance.
{
  const runtime=createRuntime();
  const s=runtime.sandbox;
  s.updateQuest();
  s.me.y=1800;s.updateQuest();
  s.me.y=CAMP.y;s.updateQuest();
  assert.equal(s.ABYSSAL_HOME_WORKBENCH_V1.getState().returnClearance,false);
  assert.notEqual(s.ABYSSAL_EXPEDITION_LOOP_V1.state.phase,'COMPLETE');
}

// If the dedicated HOME save rejects an upgrade write, keep both the clearance and materials.
{
  const failingStore={getItem(){return null;},setItem(key){if(key==='abyssal_home_workbench_v1')throw new Error('simulated storage failure');}};
  const runtime=createRuntime(failingStore);
  const s=runtime.sandbox;
  const api=s.ABYSSAL_HOME_WORKBENCH_V1;
  s.inventory.shard=2;
  api.recordExpeditionReturn({at:1});
  const result=api.upgrade();
  assert.equal(result.ok,false,'upgrade must fail if its persistent HOME record cannot be written');
  assert.equal(result.reason,'persistence-failed');
  assert.equal(s.inventory.stone,3,'a failed HOME record must not consume stone');
  assert.equal(s.inventory.shard,2,'a failed HOME record must not consume shards');
  assert.equal(api.getState().tier,1,'failed persistence must restore the original workbench tier');
  assert.equal(api.getState().returnClearance,true,'failed persistence must keep the in-session return clearance');
  assert.equal(runtime.getSaveCalls(),0,'failed persistence must not save deducted inventory');
}

// A successful return must not silently present an unsaved HOME unlock as durable progression.
{
  const failingStore={getItem(){return null;},setItem(key){if(key==='abyssal_home_workbench_v1')throw new Error('simulated return-clearance storage failure');}};
  const runtime=createRuntime(failingStore);
  const s=runtime.sandbox;
  const api=s.ABYSSAL_HOME_WORKBENCH_V1;
  reachMart(runtime);
  s.inventory.shard=2;
  assert.equal(confirmCreatureLoot(runtime),true,'a confirmed creature reward is required before the expedition can grant a return unlock');
  s.updateQuest();
  s.me.y=1500;s.updateQuest();
  s.me.x=CAMP.x;s.me.y=CAMP.y;s.updateQuest();
  assert.equal(api.getState().returnClearance,true,'the current session should retain its successful-return unlock');
  assert.equal(api.getState().returnClearancePersisted,false,'the HOME module must expose the failed durable write');
  assert.match(s.questText.textContent,/未能写入存档.*重进后需要重新完成远征/,'the objective must warn that reload will lose the unlock');
  assert.ok(runtime.toasts.length>0,'the return transition must produce a player-facing notice');
  assert.equal(failingStore.getItem(api.storageKey),null,'the test must prove no HOME record was written');
}

// If the existing player inventory save fails after the HOME write, compensate the HOME tier write too.
{
  const store=memoryStorage();
  const setItem=store.setItem.bind(store);
  store.setItem=(key,value)=>{if(key==='abyssal_wake_save_v5')throw new Error('simulated player-save failure');setItem(key,value);};
  const runtime=createRuntime(store);
  const s=runtime.sandbox;
  const api=s.ABYSSAL_HOME_WORKBENCH_V1;
  s.inventory.shard=2;
  api.recordExpeditionReturn({at:1});
  const result=api.upgrade();
  assert.equal(result.ok,false,'upgrade must fail if the player inventory save cannot commit');
  assert.equal(result.reason,'player-save-failed');
  assert.equal(s.inventory.stone,3,'failed player save must restore stone');
  assert.equal(s.inventory.shard,2,'failed player save must restore shards');
  assert.equal(api.getState().tier,1,'failed player save must restore the workbench tier');
  assert.equal(api.getState().returnClearance,true,'failed player save must restore the return clearance');
  assert.deepEqual(JSON.parse(store.getItem(api.storageKey)),{v:1,tier:1,returnClearance:true,lastReturnAt:1},'the compensating HOME write must restore the saved clearance');
  assert.equal(runtime.getSaveCalls(),1,'the failed player save must be detected');
}

// Death/respawn at HOME cannot create HOME upgrade clearance even if salvage was held at death.
{
  const runtime=createRuntime();
  const s=runtime.sandbox;
  reachMart(runtime);
  s.inventory.shard=2;
  s.dead=true;s.updateQuest();
  s.dead=false;s.me.x=CAMP.x;s.me.y=CAMP.y;s.updateQuest();
  assert.equal(s.ABYSSAL_HOME_WORKBENCH_V1.getState().returnClearance,false);
  assert.notEqual(s.ABYSSAL_EXPEDITION_LOOP_V1.state.phase,'COMPLETE');
}

// Full MIRE MART route records persistent clearance, then HOME workbench consumes salvage once and upgrades the next departure capability.
let persistentSeed;
{
  const store=memoryStorage();
  const runtime=createRuntime(store);
  const s=runtime.sandbox;
  const api=s.ABYSSAL_HOME_WORKBENCH_V1;
  reachMart(runtime);
  assert.equal(api.getState().returnClearance,false,'reaching MIRE MART is not enough');
  s.inventory.stone=0;
  s.inventory.shard=1;
  assert.equal(confirmCreatureLoot(runtime),true,'a confirmed creature reward is required before returning with salvage');
  s.updateQuest();
  s.me.y=1500;s.updateQuest();
  assert.equal(api.getState().returnClearance,false,'leaving MIRE MART with salvage is not enough until HOME');
  s.me.x=CAMP.x;s.me.y=CAMP.y;s.updateQuest();
  assert.equal(s.ABYSSAL_EXPEDITION_LOOP_V1.state.phase,'COMPLETE');
  assert.equal(api.getState().returnClearance,true,'successful live return must unlock the HOME upgrade opportunity');
  assert.ok(api.getState().lastReturnAt>0);
  assert.ok(store.getItem(api.storageKey),'successful return clearance must persist');
  assert.equal(api.canUpgrade().reason,'materials-required','a one-shard successful return unlocks the opportunity but does not satisfy the two-shard upgrade cost');
  assert.match(s.questText.textContent,/装备架已解锁 · 补石3\/碎片1/,'the post-return objective must show the actual missing stone and shard counts');

  s.inventory.stone=3;
  s.inventory.shard=2;
  s.updateQuest();
  assert.equal(s.questText.textContent,'装备架材料齐备 · 前往工作台强化','the objective must change when the live inventory meets the recipe');
  assert.equal(api.canUpgrade().ok,true);
  const savesBeforeUpgrade=runtime.getSaveCalls();
  const upgraded=api.upgrade();
  assert.equal(upgraded.ok,true);
  assert.equal(s.inventory.stone,0);
  assert.equal(s.inventory.shard,0);
  assert.equal(api.getState().tier,2);
  assert.equal(api.getState().returnClearance,false);
  assert.equal(api.departureWardMs(),25000);
  assert.equal(runtime.getSaveCalls(),savesBeforeUpgrade+1,'inventory consumption must flow through the existing saveLocal authority once');
  assert.equal(runtime.getUiCalls(),1);
  assert.ok(runtime.toasts.length>0,'the return transition must produce a player-facing notice');

  const after={stone:s.inventory.stone,shard:s.inventory.shard};
  const duplicate=api.upgrade();
  assert.equal(duplicate.ok,false);
  assert.equal(duplicate.reason,'already-upgraded');
  assert.deepEqual({stone:s.inventory.stone,shard:s.inventory.shard},after,'repeat upgrade must be idempotent');
  assert.equal(runtime.getSaveCalls(),savesBeforeUpgrade+1,'repeat upgrade must not write inventory again');
  persistentSeed=store._seed;
}

// Dedicated HOME tier must survive reload without altering the existing inventory save schema.
{
  const store=memoryStorage(persistentSeed);
  const sandbox={console,window:null,globalThis:null,Date,localStorage:store,inventory:{stone:0,shard:0},inCamp:()=>true};
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(homeSource,sandbox,{filename:'home-workbench-upgrade-v1.js'});
  assert.equal(sandbox.ABYSSAL_HOME_WORKBENCH_V1.getState().tier,2);
  assert.equal(sandbox.ABYSSAL_HOME_WORKBENCH_V1.departureWardMs(),25000);
  assert.equal(homeSource.includes('abyssal_wake_save_v5'),false,'HOME upgrade must not mutate the inventory save schema');
}

// Ownership boundaries: no new network authority/event/protocol is introduced by the HOME module.
for(const forbidden of ['zoneCh.send','new WebSocket(','event:\'','protocol:','broadcast'])assert.equal(homeSource.includes(forbidden),false,`HOME upgrade must not own ${forbidden}`);
assert.ok(relaySource.includes("protocol:'abyssal-relay-v1'"),'Relay protocol must remain unchanged');
assert.ok(simulationSource.includes('departureWardMs?.()===25000?25000:15000'),'departure path must consume only the bounded HOME capability');
assert.ok(simulationSource.includes('fieldGraceUntil=Date.now()+wardMs'),'existing ward ownership must remain in the simulation departure path');

// Loader order must preserve World → Expedition → HOME payoff → motion/presentation tail.
const worldIndex=bootSource.indexOf("'modules/world/awakening-world-v1.js'");
const expeditionIndex=bootSource.indexOf("'modules/world/awakening-expedition-loop-v1.js'");
const homeIndex=bootSource.indexOf("'modules/safe-camp/home-workbench-upgrade-v1.js'");
const motionIndex=bootSource.indexOf("'modules/main-loop/smooth-motion-v18.js'");
assert.ok(worldIndex>=0&&expeditionIndex>worldIndex&&homeIndex>expeditionIndex&&motionIndex>homeIndex,'HOME upgrade must load after expedition state and before final motion/UI tail');

assert.ok(contractSource.includes('local-player persistent'));
assert.ok(contractSource.includes('15 seconds'));
assert.ok(contractSource.includes('25 seconds'));
assert.ok(contractSource.includes('ward: boolean'));
assert.ok(contractSource.includes('no new broadcast event'));

console.log(JSON.stringify({ok:true,loop:'MIRE MART return → HOME Field Rig',cost:{stone:3,shard:2},wardBeforeMs:15000,wardAfterMs:25000,persistence:'local-player',relayProtocol:'unchanged'}));
