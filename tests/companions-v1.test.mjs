import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const config=JSON.parse(read('data/pets/companions-v1.json'));
const inventory={wood:0,stone:0,food:1,shard:0,seed:0,egg:0,milk:0,wool:0,fish_reedcarp:0,fish_glassminnow:0,fish_holloweye:0,companion_egg:0,meal_river_stew:0,meal_glass_porridge:0,meal_holloweye_chowder:0,knife:false,lantern:false};
const station={x:2310,y:2590},listeners=new Map();let saveResult=true,owner=null,ownerId='',savedState=null,lootCalls=0;
const sandbox={console,inventory,me:{x:station.x,y:station.y,dir:0},CAMP:{x:2400,y:2400,r:470},currentZone:'1:1',SESSION_ID:'pet-test',
  inCamp:actor=>Math.hypot(actor.x-2400,actor.y-2400)<470,toast(){},
  addEventListener(type,fn){const rows=listeners.get(type)||[];rows.push(fn);listeners.set(type,rows);},
  dispatchEvent(event){for(const fn of listeners.get(event.type)||[])fn(event);return true;},
  CustomEvent:class CustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail;}},
  ABYSSAL_PETS_CONFIG_V1:config,
  ABYSSAL_SAVE_EXTENSIONS_V1:{register(id,provider){ownerId=id;owner=provider;return true;}},
  onLoot(){lootCalls++;return true;},
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
sandbox.saveLocal=()=>{if(!saveResult)return false;savedState=owner?.snapshot?.()||null;return true;};
vm.createContext(sandbox);
vm.runInContext(read('modules/items/inventory-transactions-v1.js'),sandbox,{filename:'inventory-transactions-v1.js'});
vm.runInContext(read('modules/pets/companions-v1.js'),sandbox,{filename:'companions-v1.js'});
const pets=sandbox.ABYSSAL_PETS_V1;
assert.equal(ownerId,'pets.companions.v1','companions persist through their named V5 owner extension');

let drop={};for(let i=1;i<=3;i++)drop=pets.rollMonsterDrop('crawler',{id:`crawler-${i}`,defeatedAt:Date.now()+i});
assert.equal(drop.companionEgg,true,'the data-defined guarantee yields a companion egg after three kills');
assert.ok(drop.companionRewardKey&&drop.mobRewardKey,'loot carries retry keys for pet-egg and growth awards');
sandbox.onLoot({target:sandbox.SESSION_ID,...drop});
assert.equal(inventory.companion_egg,1,'monster reward delivers one distinct companion egg');
sandbox.onLoot({target:sandbox.SESSION_ID,...drop});
assert.equal(inventory.companion_egg,1,'replayed reward does not duplicate the companion egg');

assert.equal(pets.getTarget(sandbox.me).type,'pet-station','the incubator is a reachable camp interaction');
assert.equal(pets.beginIncubation({actor:sandbox.me}).ok,true,'incubation consumes an egg at the station');
assert.equal(inventory.companion_egg,0);
const hatched=pets.getSnapshot(Date.now()+21_000);
assert.equal(hatched.companion.name,config.companion.name,'the egg hatches into the configured companion');
assert.equal(pets.rename('Moss').ok,true);
assert.equal(pets.getRenderState(sandbox.me).name,'Moss');
assert.equal(pets.attackBonus(),config.companion.attackBonus,'a following companion assists combat');
assert.equal(pets.command('WAIT',{actor:sandbox.me}).ok,true);
assert.equal(pets.getRenderState(sandbox.me).x,sandbox.me.x-30,'a waiting companion stays behind the player, not under its feet');
assert.equal(pets.getRenderState(sandbox.me).y,sandbox.me.y+14,'the standby anchor preserves the intended 3/4 depth offset');
assert.equal(pets.attackBonus(),0,'a waiting companion does not assist from afar');
assert.equal(pets.command('FOLLOW',{actor:sandbox.me}).ok,true);

sandbox.dispatchEvent(new sandbox.CustomEvent('abyssal:resource-collected',{detail:{kind:'wood'}}));
assert.equal(pets.getSnapshot().companion.xp,1,'following companion learns from a confirmed resource collection');
sandbox.onLoot({target:sandbox.SESSION_ID,mobKind:'crawler',mobRewardKey:'kill-once'});
sandbox.onLoot({target:sandbox.SESSION_ID,mobKind:'crawler',mobRewardKey:'kill-once'});
assert.equal(pets.getSnapshot().companion.xp,2,'a repeated combat reward grants growth once');
sandbox.dispatchEvent(new sandbox.CustomEvent('abyssal:resource-collected',{detail:{kind:'stone'}}));
assert.equal(pets.getSnapshot().companion.evolved,true,'the companion evolves once at its data threshold');

assert.equal(savedState?.companion?.name,'Moss','name and evolution persist');
const restored=sandbox.ABYSSAL_PETS_V1.getSnapshot();
owner.restore(savedState);
assert.equal(pets.getSnapshot().companion.evolved,true,'V5 owner extension restores the evolved companion');
assert.equal(restored.companion.command,'FOLLOW');
saveResult=false;
assert.equal(pets.rename('Lost').reason,'save-failed');
assert.equal(pets.getSnapshot().companion.name,'Moss','failed save rolls back companion naming');

console.log(JSON.stringify({ok:true,monsterEgg:true,incubation:true,naming:true,followWait:true,combatAndGatherAssist:true,oneEvolution:true,idempotentRewards:true,v5Persistence:true,saveRollback:true}));
