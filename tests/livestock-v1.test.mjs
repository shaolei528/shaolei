import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const config=JSON.parse(fs.readFileSync(new URL('../data/farming/livestock-v1.json',import.meta.url),'utf8'));
const saveSource=fs.readFileSync(new URL('../modules/core/save-extensions-v1.js',import.meta.url),'utf8');
const inventorySource=fs.readFileSync(new URL('../modules/items/inventory-transactions-v1.js',import.meta.url),'utf8');
const source=fs.readFileSync(new URL('../modules/farming/livestock-v1.js',import.meta.url),'utf8');
const store=new Map(),events=[];
let allowSave=true,saveCalls=0;
const context=vm.createContext({
  ABYSSAL_LIVESTOCK_CONFIG_V1:config,STORAGE_KEY:'abyssal_wake_save_v5',
  localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)},
  CAMP:{x:2400,y:2400,r:470},SESSION_ID:'player-a',currentZone:'1:1',started:true,dead:false,
  me:{x:2200,y:2050},inCamp:actor=>Math.hypot(actor.x-2400,actor.y-2400)<470,
  inventory:{wood:0,stone:0,food:8,shard:0,seed:3,egg:0,milk:0,wool:0,knife:false,lantern:false},
  Date,Math,Map,Set,console,
  window:{dispatchEvent:event=>events.push(event)},
  CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail}},
  saveLocal(){saveCalls++;if(!allowSave)return false;store.set('abyssal_wake_save_v5',JSON.stringify({v:5,inventory:{...context.inventory},extensions:context.ABYSSAL_SAVE_EXTENSIONS_V1.snapshot()}));return true;},
  updateUI(){}
});
context.globalThis=context;
vm.runInContext(saveSource,context,{filename:'save-extensions-v1.js'});
vm.runInContext(inventorySource,context,{filename:'inventory-transactions-v1.js'});
vm.runInContext(source,context,{filename:'livestock-v1.js'});
const api=context.ABYSSAL_LIVESTOCK_V1,provider=context.ABYSSAL_SAVE_EXTENSIONS_V1;

assert.equal(api.getSnapshot(1000).length,6,'the starting pen contains chicken, cow, and sheep pairs');
assert.equal(provider.snapshot().owners['farming.livestock.v1'].animals.length,6,'the livestock owner registers in the additive V5 save');
assert.equal(api.getTarget(context.me,1000).type,'livestock','animals use the normal nearby interaction target');
const chickenTarget=api.getTarget(context.me,1000),pair=chickenTarget.breedPair;
assert.ok(pair?.maleId&&pair?.femaleId,'an adult male and female share a breeding target');
const bred=api.breedAnimal(pair.maleId,pair.femaleId,{now:1000});
assert.equal(bred.ok,true,'one ration creates a cared-for juvenile');
assert.equal(context.inventory.food,7);
assert.equal(api.breedAnimal(pair.maleId,pair.femaleId,{now:1001}).reason,'cooldown','replayed breeding cannot create a second juvenile');
assert.equal(context.inventory.food,7,'rejected breeding does not consume feed');
const juvenile=api.getSnapshot(1001).find(animal=>animal.id===bred.offspringId);
context.me.x=juvenile.x;context.me.y=juvenile.y;
assert.deepEqual({...api.feedAnimal(juvenile.id,{now:1001})},{ok:true,animalId:juvenile.id,stage:'cared'});
assert.equal(api.getSnapshot(30999).find(animal=>animal.id===juvenile.id).stage,'juvenile','a cared juvenile continues growing until its maturity time');
assert.equal(api.getSnapshot(31000).find(animal=>animal.id===juvenile.id).stage,'adult','care plus elapsed growth matures the juvenile once');
assert.ok(events.some(event=>event.type==='abyssal:livestock-grown'),'maturity emits an owner event');

const cow=api.getSnapshot(31001).find(animal=>animal.id==='cow-a');
context.me.x=cow.x;context.me.y=cow.y;
assert.equal(api.interact(cow.id,{now:40000}).stage,'producing','feeding an adult starts its product timer');
assert.equal(context.inventory.food,5);
assert.equal(api.interact(cow.id,{now:67999}).reason,'producing','milk cannot be collected early');
const milk=api.interact(cow.id,{now:68000});
assert.deepEqual({...milk},{ok:true,animalId:'cow-a',item:'milk',amount:1});
assert.equal(context.inventory.milk,1);
assert.equal(api.collectProduct(cow.id,{now:68001}).reason,'no-product','collecting milk twice does not duplicate the reward');
assert.equal(context.inventory.milk,1);

const sheep=api.getSnapshot(68001).find(animal=>animal.id==='sheep-a');
context.me.x=sheep.x;context.me.y=sheep.y;allowSave=false;
const failed=api.feedAnimal(sheep.id,{now:70000});
assert.equal(failed.reason,'save-failed','a failed save rejects livestock changes');
assert.equal(context.inventory.food,5,'a failed feed restores inventory');
assert.equal(api.getSnapshot(70000).find(animal=>animal.id===sheep.id).productStage,'none','a failed feed restores animal state');
allowSave=true;

const saved=provider.snapshot().owners['farming.livestock.v1'];
const reload=vm.createContext({
  ABYSSAL_LIVESTOCK_CONFIG_V1:config,STORAGE_KEY:'abyssal_wake_save_v5',
  localStorage:{getItem:key=>store.get(key)||null},CAMP:{x:2400,y:2400,r:470},
  SESSION_ID:'player-b',currentZone:'1:1',started:true,dead:false,me:{x:2400,y:2400},
  inCamp:actor=>Math.hypot(actor.x-2400,actor.y-2400)<470,
  inventory:{...JSON.parse(store.get('abyssal_wake_save_v5')).inventory},Date,Math,Map,Set,console,
  window:{dispatchEvent(){}},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail}},
  saveLocal:()=>true,updateUI(){}
});
reload.globalThis=reload;
vm.runInContext(saveSource,reload,{filename:'save-extensions-reload.js'});
vm.runInContext(inventorySource,reload,{filename:'inventory-transactions-reload.js'});
vm.runInContext(source,reload,{filename:'livestock-reload.js'});
const restoredApi=reload.ABYSSAL_LIVESTOCK_V1.getSnapshot(70000);
assert.equal(restoredApi.length,7,'offspring and original animals reload from the V5 extension');
assert.equal(reload.inventory.milk,1,'animal products persist in the existing inventory save');
assert.ok(saveCalls>=5,'successful feed, harvest, breeding, and growth write through the V5 save authority');
assert.ok(saved.animals.some(animal=>animal.id===bred.offspringId),'the V5 extension records offspring identity');
assert.ok(events.some(event=>event.type==='abyssal:livestock-bred'));
assert.ok(events.some(event=>event.type==='abyssal:livestock-product-collected'));

const remoteLivestock=api.exportWorldSnapshot();
remoteLivestock.animals[0].fedAt=1234;
remoteLivestock.animals[0].productReadyAt=5678;
assert.equal(api.applyRemoteSnapshot(remoteLivestock),true,'a Relay animal snapshot persists through the livestock V5 owner');
assert.equal(api.exportWorldSnapshot().animals[0].productReadyAt,5678);
allowSave=false;
assert.equal(api.applyRemoteSnapshot({version:1,nextId:1,animals:[]}),false,'a failed remote-state save is rejected');
assert.equal(api.exportWorldSnapshot().animals[0].productReadyAt,5678,'failed remote-state persistence restores animal state');

console.log(JSON.stringify({ok:true,threeSpecies:true,breedAndCooldown:true,juvenileCareAndMaturity:true,productCollectionIdempotent:true,atomicV5Save:true,failedSaveRollback:true,remoteSnapshotPersistAndRollback:true}));
