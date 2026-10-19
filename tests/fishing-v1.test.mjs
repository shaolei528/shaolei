import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const config=JSON.parse(fs.readFileSync(new URL('../data/fishing/fish-v1.json',import.meta.url),'utf8'));
const saveSource=fs.readFileSync(new URL('../modules/core/save-extensions-v1.js',import.meta.url),'utf8');
const inventorySource=fs.readFileSync(new URL('../modules/items/inventory-transactions-v1.js',import.meta.url),'utf8');
const source=fs.readFileSync(new URL('../modules/fishing/fishing-v1.js',import.meta.url),'utf8');
const store=new Map(),events=[];let allowSave=true;
const water={getAccessPoint:id=>id==='camp-pool'?{x:2770,y:2374,interactionRange:54}:null};
const context=vm.createContext({
  ABYSSAL_FISHING_CONFIG_V1:config,ABYSSAL_WATER_BODIES_V1:water,STORAGE_KEY:'abyssal_wake_save_v5',localStorage:{getItem:key=>store.get(key)||null},
  CAMP:{x:2400,y:2400,r:470},SESSION_ID:'player-a',currentZone:'1:1',started:true,dead:false,
  me:{x:2770,y:2374},inCamp:actor=>Math.hypot(actor.x-2400,actor.y-2400)<470,
  inventory:{wood:0,stone:0,food:2,shard:0,seed:3,egg:0,milk:0,wool:0,fish_reedcarp:0,fish_glassminnow:0,fish_holloweye:0,knife:false,lantern:false},
  Date,Math,Map,Set,console,window:{dispatchEvent:event=>events.push(event)},
  CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail}},
  saveLocal(){if(!allowSave)return false;store.set('abyssal_wake_save_v5',JSON.stringify({v:5,inventory:{...context.inventory},extensions:context.ABYSSAL_SAVE_EXTENSIONS_V1.snapshot()}));return true;},updateUI(){}
});
context.globalThis=context;
vm.runInContext(saveSource,context,{filename:'save-extensions-v1.js'});
vm.runInContext(inventorySource,context,{filename:'inventory-transactions-v1.js'});
vm.runInContext(source,context,{filename:'fishing-v1.js'});
const api=context.ABYSSAL_FISHING_V1;

assert.equal(api.getTarget(context.me,1000).type,'fishing','the camp pool is a normal nearby context target');
assert.ok(events.some(event=>event.type==='abyssal:player-fishing-state-v1'&&event.detail.phase==='idle'),'the local activity view publishes its initial fishing state');
const cast=api.interact({now:1000,random:()=>0});
assert.deepEqual({...cast},{ok:true,phase:'waiting',attempt:1,biteInMs:1800});
assert.ok(events.some(event=>event.type==='abyssal:player-fishing-state-v1'&&event.detail.phase==='waiting'),'casting publishes the waiting phase for teammate display');
assert.equal(api.interact({now:2100,random:()=>0}).reason,'waiting','the cast cannot be instantly collected');
assert.equal(api.getTarget(context.me,3200).stage,'bite','the timed bite window is visible to the interaction prompt');
const catchResult=api.reelIn({now:3300,random:()=>.99});
assert.deepEqual({...catchResult},{ok:true,fishId:'holloweye',name:'空眼鱼',item:'fish_holloweye',food:16,sanity:-8,attempt:1});
assert.equal(context.inventory.fish_holloweye,1,'a successful catch is atomically added to the inventory');
assert.equal(api.reelIn({now:3301,random:()=>0}).reason,'no-cast','a repeated reel cannot replay a settled catch');
assert.ok(events.some(event=>event.type==='abyssal:fish-caught'));
assert.ok(events.some(event=>event.type==='abyssal:player-fishing-state-v1'&&event.detail.phase==='caught'),'a settled catch publishes teammate feedback');
assert.deepEqual([...api.getSnapshot(3301).catches],['holloweye'],'the catch journal records its fish ID');

const failedCast=()=>api.interact({now:5000,random:()=>0});allowSave=false;
assert.equal(failedCast().reason,'save-failed','a failed save cannot leave a cast active');
assert.equal(api.getSnapshot(5000).phase,'idle');allowSave=true;

const nextCast=api.interact({now:6000,random:()=>0});
assert.equal(nextCast.attempt,2);
assert.equal(api.interact({now:7500,random:()=>0}).reason,'waiting');
assert.equal(api.interact({now:11500,random:()=>0}).reason,'escaped','missed bite windows award no fish');
assert.ok(events.some(event=>event.type==='abyssal:player-fishing-state-v1'&&event.detail.phase==='escaped'),'a missed bite publishes the escaped phase');
assert.equal(context.inventory.fish_holloweye,1);

const reload=vm.createContext({
  ABYSSAL_FISHING_CONFIG_V1:config,ABYSSAL_WATER_BODIES_V1:water,STORAGE_KEY:'abyssal_wake_save_v5',localStorage:{getItem:key=>store.get(key)||null},
  CAMP:{x:2400,y:2400,r:470},SESSION_ID:'player-b',currentZone:'1:1',started:true,dead:false,me:{x:2770,y:2374},
  inCamp:actor=>Math.hypot(actor.x-2400,actor.y-2400)<470,
  inventory:{...JSON.parse(store.get('abyssal_wake_save_v5')).inventory},Date,Math,Map,Set,console,window:{dispatchEvent(){}},
  CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail}},saveLocal:()=>true,updateUI(){}
});
reload.globalThis=reload;vm.runInContext(saveSource,reload,{filename:'save-extensions-reload.js'});vm.runInContext(inventorySource,reload,{filename:'inventory-transactions-reload.js'});vm.runInContext(source,reload,{filename:'fishing-reload.js'});
assert.deepEqual([...reload.ABYSSAL_FISHING_V1.getSnapshot(11000).catches],['holloweye'],'the V5 owner restores the catch log');
assert.equal(reload.inventory.fish_holloweye,1,'fish stacks persist in the V5 player inventory');

console.log(JSON.stringify({ok:true,timedBiteWindow:true,weightedRareCatch:true,missedBiteNoReward:true,duplicateCatchRejected:true,atomicV5Save:true,failedSaveRollback:true,catchLogRestore:true}));
