import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const broadcasts=[],toasts=[],listeners=new Map();
const inventory={wood:0,stone:0,food:0,shard:0,seed:0,egg:0,milk:0,wool:0,fish_reedcarp:0,fish_glassminnow:0,fish_holloweye:0,companion_egg:0,meal_river_stew:0,meal_glass_porridge:0,meal_holloweye_chowder:0,meal_trail_stew:0,knife:true,lantern:false};
const CAMP={x:2400,y:2400,r:470};
let savedExtensions=null,saves=0,updates=0;
const sandbox={console,window:null,globalThis:null,SESSION_ID:'companion-integration-player',STORAGE_KEY:'abyssal_wake_save_v5',localStorage:{getItem(){return null;}},
  ABYSSAL_CREATURE_REWARDS_CONFIG_V1:JSON.parse(read('data/loot/creature-rewards-v1.json')),
  ABYSSAL_PETS_CONFIG_V1:JSON.parse(read('data/pets/companions-v1.json')),
  CAMP,WORLD:{w:4800,h:4800,zone:1600},currentZone:'1:0',started:true,dead:false,zoneConnected:true,zoneLeader:true,
  attackCd:0,attackFlash:0,dashCd:0,dashQueued:false,inventory,mobs:[],remotes:new Map(),lastSeqById:new Map(),
  me:{id:'companion-integration-player',name:'Tester',x:1000,y:1000,r:14,hp:100,sanity:100,dir:0},
  dashBtn:{addEventListener(){}},attackBtn:{addEventListener(){}},
  zoneCh:{send(message){broadcasts.push(message);return Promise.resolve('ok');}},
  campDist(x,y){return Math.hypot(x-CAMP.x,y-CAMP.y);},
  inCamp(actor=sandbox.me){return Math.hypot(actor.x-CAMP.x,actor.y-CAMP.y)<CAMP.r;},
  finite(value,fallback=0){return Number.isFinite(Number(value))?Number(value):fallback;},
  clamp(value,min,max){return Math.max(min,Math.min(max,value));},
  toast(message){toasts.push(String(message));},updateUI(){updates++;},
  addEventListener(type,fn){const rows=listeners.get(type)||[];rows.push(fn);listeners.set(type,rows);},
  dispatchEvent(event){for(const fn of listeners.get(event.type)||[])fn(event);return true;},
  CustomEvent:class CustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail;this.cancelable=init.cancelable===true;}preventDefault(){this.defaultPrevented=true;}}
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
sandbox.saveLocal=()=>{saves++;savedExtensions=sandbox.ABYSSAL_SAVE_EXTENSIONS_V1?.snapshot?.()||null;return true;};
vm.createContext(sandbox);
for(const [path,name] of [
  ['modules/core/save-extensions-v1.js','save-extensions-v1.js'],
  ['modules/items/inventory-transactions-v1.js','inventory-transactions-v1.js'],
  ['modules/network/inbound-events.js','inbound-events.js']
])vm.runInContext(read(path),sandbox,{filename:name});
for(const [path,name] of [
  ['modules/loot/creature-rewards-v1.js','creature-rewards-v1.js'],
  ['modules/pets/companions-v1.js','companions-v1.js'],
  ['modules/combat/player-combat.js','player-combat.js']
])vm.runInContext(read(path),sandbox,{filename:name});

for(let index=0;index<3;index++){
  sandbox.mobs=[{id:`crawler-${index+1}`,kind:'crawler',x:sandbox.me.x+40,y:sandbox.me.y,hp:10,phase:0,hitCd:0,respawnAt:0}];
  sandbox.attackCd=0;
  sandbox.attack();
  assert.equal(sandbox.mobs[0].hp,0,`ordinary combat input defeats crawler ${index+1}`);
}

assert.ok(inventory.shard>=3,'normal creature loot is settled through the inventory owner');
assert.ok(inventory.companion_egg>=1,'three real combat kill settlements produce at least one configured companion egg');
assert.equal(broadcasts.filter(message=>message.event==='attack').length,3,'each ordinary attack retains the existing Relay attack event');
const beforeIncubation={shard:inventory.shard,food:inventory.food,eggs:inventory.companion_egg};

sandbox.currentZone='1:1';
sandbox.me.x=CAMP.x-90;sandbox.me.y=CAMP.y+190;
assert.equal(sandbox.ABYSSAL_PETS_V1.getTarget(sandbox.me)?.type,'pet-station','the camp incubator is reachable through the pet interaction owner');
const startedAt=Date.now();
assert.equal(sandbox.ABYSSAL_PETS_V1.beginIncubation({actor:sandbox.me,now:startedAt}).ok,true,'the incubator consumes an egg through the inventory transaction');
assert.equal(inventory.companion_egg,beforeIncubation.eggs-1);
assert.equal(sandbox.ABYSSAL_PETS_V1.getSnapshot(startedAt+21_000).companion?.id,'tidemark-runner','the same saved character hatches the configured companion');
assert.ok(savedExtensions?.owners?.['pets.companions.v1']?.companion,'the hatched companion is included in the V5 extension snapshot');
assert.ok(saves>=8,'combat rewards, incubation, and hatching persist through the normal save hook');

console.log(JSON.stringify({ok:true,scope:'real combat reward function to pet incubation using V5 extension and existing Relay attack event',kills:3,shards:inventory.shard,eggsBeforeIncubation:beforeIncubation.eggs,incubation:true,hatched:true,saves,updates,broadcasts:broadcasts.length}));
