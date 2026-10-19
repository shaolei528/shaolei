import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const config=JSON.parse(read('../data/loot/creature-rewards-v1.json'));
const key='abyssal_wake_save_v5';
const boot=read('../survival-v21.html');
assert.ok(boot.includes("fetch('./data/loot/creature-rewards-v1.json?v='+VER"),'V21 must fetch the configured creature rewards');
const inboundIndex=boot.indexOf("'modules/network/inbound-events.js'"),lootIndex=boot.indexOf("'modules/loot/creature-rewards-v1.js'"),combatIndex=boot.indexOf("'modules/combat/player-combat.js'");
assert.ok(inboundIndex>=0&&inboundIndex<lootIndex&&lootIndex<combatIndex,'Loot must wrap the existing receive handler before Combat creates creature rewards');

function makeContext(saved=null){
  const store=new Map(saved?[[key,JSON.stringify(saved)]]:[]),toasts=[],events=[];
  let saves=0,updates=0,failNextSave=false;
  const inventory={wood:0,stone:0,food:0,shard:0,seed:0,egg:0,milk:0,wool:0,fish_reedcarp:0,fish_glassminnow:0,fish_holloweye:0,companion_egg:0,meal_river_stew:0,meal_glass_porridge:0,meal_holloweye_chowder:0,meal_trail_stew:0,knife:false,lantern:false,...saved?.inventory};
  const sandbox={
    console,window:null,globalThis:null,SESSION_ID:'player-a',STORAGE_KEY:key,
    ABYSSAL_CREATURE_REWARDS_CONFIG_V1:config,inventory,
    localStorage:{getItem:name=>store.get(name)||null,setItem:(name,value)=>store.set(name,value)},
    saveLocal(){saves++;if(failNextSave){failNextSave=false;return false;}store.set(key,JSON.stringify({v:5,inventory:{...inventory},extensions:sandbox.ABYSSAL_SAVE_EXTENSIONS_V1.snapshot()}));return true;},
    updateUI(){updates++;},toast(message){toasts.push(String(message));},
    dispatchEvent(event){events.push(event);},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},
    clamp:(value,min,max)=>Math.max(min,Math.min(max,value)),finite:(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback,
    clean:value=>String(value||''),currentZone:'1:0',WORLD:{w:4800,h:4800,zone:1600},
    me:{x:2200,y:1200},remotes:new Map(),lastSeqById:new Map()
  };
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read('../modules/core/save-extensions-v1.js'),sandbox,{filename:'save-extensions-v1.js'});
  vm.runInContext(read('../modules/items/inventory-transactions-v1.js'),sandbox,{filename:'inventory-transactions-v1.js'});
  vm.runInContext(read('../modules/network/inbound-events.js'),sandbox,{filename:'inbound-events.js'});
  vm.runInContext(read('../modules/loot/creature-rewards-v1.js'),sandbox,{filename:'creature-rewards-v1.js'});
  return{sandbox,store,toasts,events,get saves(){return saves;},get updates(){return updates;},failSave(){failNextSave=true;}};
}

const first=makeContext();
const {sandbox}=first;
const firstMob={id:'m1:0-1',defeatedAt:1000};
const firstPayload=sandbox.ABYSSAL_LOOT_REWARDS_V1.createMobReward('player-a','crawler',firstMob);
assert.equal(firstPayload.shard,1);
assert.equal(sandbox.onLoot({...firstPayload,shard:99,food:99}),true,'a valid mob reward settles through Loot and Items');
assert.equal(sandbox.inventory.shard,1,'the receiver recomputes configured rewards instead of trusting message amounts');
assert.equal(sandbox.inventory.food,0);
assert.equal(first.saves,1,'the claim and inventory are persisted in one V5 write');
assert.equal(first.updates,1);
assert.equal(first.events.filter(event=>event.type==='abyssal:loot-claimed').length,1);
assert.equal(sandbox.onLoot(firstPayload),false,'the same delivery is rejected after the first claim');
assert.equal(sandbox.onLoot({...firstPayload,mobRewardKey:'forged-key'}),false,'malformed source keys are rejected');
assert.equal(first.saves,1,'duplicate delivery does not save or grant again');

const stored=JSON.parse(first.store.get(key));
const reloaded=makeContext(stored);
assert.equal(reloaded.sandbox.onLoot(firstPayload),false,'a replay after V5 reload is rejected');
assert.equal(reloaded.sandbox.inventory.shard,1,'reloading preserves both the item and the claim ledger');

const newerMob={id:'m1:0-1',defeatedAt:1001};
const newerPayload=reloaded.sandbox.ABYSSAL_LOOT_REWARDS_V1.createMobReward('player-a','watcher',newerMob);
assert.equal(reloaded.sandbox.onLoot(newerPayload),true,'the same world mob can award again after a later respawn');
assert.equal(reloaded.sandbox.inventory.shard,3,'watcher reward data grants two configured shards');
assert.equal(reloaded.sandbox.onLoot(firstPayload),false,'an older packet cannot roll back to a prior kill');

const cultistA=reloaded.sandbox.ABYSSAL_LOOT_REWARDS_V1.createMobReward('player-a','cultist',{id:'m1:0-2',defeatedAt:1002});
const cultistB=reloaded.sandbox.ABYSSAL_LOOT_REWARDS_V1.createMobReward('player-a','cultist',{id:'m1:0-2',defeatedAt:1002});
assert.equal(cultistA.food,cultistB.food,'chance rewards are stable for one kill identity');
assert.equal(reloaded.sandbox.onLoot({...cultistA,mobKind:'unknown'}),false,'unknown creature sources cannot claim configured rewards');

const failedPayload=reloaded.sandbox.ABYSSAL_LOOT_REWARDS_V1.createMobReward('player-a','crawler',{id:'m1:0-3',defeatedAt:1003});
const beforeFailure=reloaded.sandbox.inventory.shard;
reloaded.failSave();
assert.equal(reloaded.sandbox.onLoot(failedPayload),false,'a failed inventory save is not reported as a successful claim');
assert.equal(reloaded.sandbox.inventory.shard,beforeFailure,'failed persistence rolls the grant back');
assert.equal(reloaded.sandbox.onLoot(failedPayload),true,'a failed claim can be retried');
assert.equal(reloaded.sandbox.inventory.shard,beforeFailure+1);

console.log(JSON.stringify({ok:true,configuredRewards:true,duplicateDelivery:true,v5Reload:true,respawnClaim:true,saveRollback:true}));
