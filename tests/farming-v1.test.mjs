import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const config=JSON.parse(fs.readFileSync(new URL('../data/farming/crops-v1.json',import.meta.url),'utf8'));
const transactions=fs.readFileSync(new URL('../modules/items/inventory-transactions-v1.js',import.meta.url),'utf8');
const source=fs.readFileSync(new URL('../modules/farming/farming-v1.js',import.meta.url),'utf8');
const inventory={wood:0,stone:0,food:0,shard:0,seed:3,knife:false,lantern:false};
const saves=[],dispatched=[];let allowSave=true,updates=0;
const context=vm.createContext({
  ABYSSAL_FARMING_CONFIG_V1:config,
  ABYSSAL_SAVE_EXTENSIONS_V1:{register(name,provider){context.provider={name,provider};return true;}},
  CAMP:{x:2400,y:2400},SESSION_ID:'player-a',currentZone:'1:1',started:true,dead:false,
  me:{x:2528,y:2618},inCamp:()=>true,inventory,Date,Math,Map,Set,
  updateUI:()=>updates++,
  saveLocal:()=>{if(!allowSave)return false;saves.push({inventory:{...inventory},farm:context.provider?.provider.snapshot()});return true;},
  dispatchEvent:event=>dispatched.push(event),
  CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}}
});
context.globalThis=context;context.window=context;
vm.runInContext(transactions,context,{filename:'inventory-transactions-v1.js'});
vm.runInContext(source,context,{filename:'farming-v1.js'});
const api=context.ABYSSAL_FARMING_V1;

assert.equal(context.provider.name,'farming.v1','the farm owns a V5 save extension');
assert.equal(api.getSnapshot(1000)[0].stage,'empty');
assert.equal(api.getTarget(context.me,1000).plotId,'camp-bed-1','the nearest camp bed provides ordinary interaction targeting');
assert.deepEqual({...api.plantCrop('camp-bed-1',{now:1000})},{ok:true,plotId:'camp-bed-1',stage:'growing'});
assert.equal(inventory.seed,2);
assert.equal(context.provider.provider.snapshot().plants.length,1);
assert.equal(api.harvestCrop('camp-bed-1',{now:2000}).reason,'growing','immature crops cannot be harvested');
assert.equal(inventory.food,0);
assert.equal(api.getSnapshot(42999)[0].stage,'growing');
assert.equal(api.getSnapshot(43000)[0].stage,'ready');

const harvest=api.interact('camp-bed-1',{now:43000});
assert.equal(harvest.ok,true);
assert.deepEqual(JSON.parse(JSON.stringify(harvest.yield)),{food:2,seed:1});
assert.equal(inventory.food,2);
assert.equal(inventory.seed,3);
assert.equal(context.provider.provider.snapshot().plants.length,0,'the plant is removed before the inventory transaction persists');
assert.equal(api.harvestCrop('camp-bed-1',{now:43001}).reason,'empty','replayed harvest requests cannot duplicate rewards');
assert.equal(inventory.food,2);
assert.ok(saves.at(-1).farm.plants.length===0,'the inventory and empty plot are saved together');
assert.ok(dispatched.some(event=>event.type==='abyssal:crop-planted'));
assert.ok(dispatched.some(event=>event.type==='abyssal:crop-harvested'));

allowSave=false;
const failed=api.plantCrop('camp-bed-2',{now:50000});
assert.equal(failed.reason,'save-failed');
assert.equal(inventory.seed,3,'failed plant save restores the seed');
assert.equal(api.getSnapshot(50000).find(plot=>plot.id==='camp-bed-2').stage,'empty','failed plant save restores the plot');
assert.equal(updates,2,'only successful farm transactions refresh inventory UI');

const restored={version:1,plants:[{plotId:'camp-bed-3',cropId:config.starterCrop,plantedAt:1000}]};
context.provider.provider.restore(restored);
assert.equal(api.getSnapshot(43000).find(plot=>plot.id==='camp-bed-3').stage,'ready','saved crops resume using their planted timestamp');
context.provider.provider.restore({version:1,plants:[{plotId:'invalid',cropId:config.starterCrop,plantedAt:1}]});
assert.equal(context.provider.provider.snapshot().plants.length,0,'invalid saved plots are discarded');

allowSave=true;
const remoteFarm={version:1,plants:[{plotId:'camp-bed-1',cropId:config.starterCrop,plantedAt:2000}]};
assert.equal(api.applyRemoteSnapshot(remoteFarm),true,'a Relay farm snapshot is accepted and persisted through the V5 owner');
assert.deepEqual(JSON.parse(JSON.stringify(api.exportWorldSnapshot())),remoteFarm);
allowSave=false;
assert.equal(api.applyRemoteSnapshot({version:1,plants:[{plotId:'camp-bed-2',cropId:config.starterCrop,plantedAt:3000}]}),false,'a failed remote-state save is rejected');
assert.deepEqual(JSON.parse(JSON.stringify(api.exportWorldSnapshot())),remoteFarm,'failed remote-state persistence restores the previous farm');

console.log(JSON.stringify({ok:true,plantGrowHarvest:true,atomicV5Save:true,duplicateRewardRejected:true,failedSaveRollback:true,restoredGrowth:true,remoteSnapshotPersistAndRollback:true}));
