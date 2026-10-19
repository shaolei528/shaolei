import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const now=Date.now(),broadcasts=[],toasts=[];
let saves=0,updates=0;
const CAMP={x:2400,y:2400,r:470};
const sandbox={
  console,window:null,globalThis:null,SESSION_ID:'local-player',
  STORAGE_KEY:'abyssal_wake_save_v5',localStorage:{getItem(){return null;}},
  ABYSSAL_CREATURE_REWARDS_CONFIG_V1:JSON.parse(read('../data/loot/creature-rewards-v1.json')),
  CAMP,WORLD:{w:4800,h:4800,zone:1600},currentZone:'1:0',
  started:true,dead:false,zoneConnected:true,zoneLeader:true,
  attackCd:0,attackFlash:0,dashCd:0,dashQueued:false,
  me:{id:'local-player',name:'Tester',x:1000,y:1000,r:14,hp:100,sanity:100,dir:0},
  inventory:{wood:0,stone:0,food:0,shard:0,knife:true,lantern:false},
  mobs:[{id:'crawler-1',kind:'crawler',x:1040,y:1000,hp:10,phase:0,hitCd:0,respawnAt:0}],
  remotes:new Map(),lastSeqById:new Map(),
  dashBtn:{addEventListener(){}},attackBtn:{addEventListener(){}},
  zoneCh:{send(message){broadcasts.push(message);return Promise.resolve('ok');}},
  campDist(x,y){return Math.hypot(x-CAMP.x,y-CAMP.y);},
  inCamp(actor=sandbox.me){return sandbox.campDist(actor.x,actor.y)<CAMP.r;},
  finite(value,fallback=0){return Number.isFinite(Number(value))?Number(value):fallback;},
  clamp(value,min,max){return Math.max(min,Math.min(max,value));},
  toast(message){toasts.push(String(message));},saveLocal(){saves++;return true;},updateUI(){updates++;}
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(read('../modules/core/save-extensions-v1.js'),sandbox,{filename:'save-extensions-v1.js'});
vm.runInContext(read('../modules/items/inventory-transactions-v1.js'),sandbox,{filename:'inventory-transactions-v1.js'});
vm.runInContext(read('../modules/network/inbound-events.js'),sandbox,{filename:'inbound-events.js'});
vm.runInContext(read('../modules/loot/creature-rewards-v1.js'),sandbox,{filename:'creature-rewards-v1.js'});
vm.runInContext(read('../modules/combat/player-combat.js'),sandbox,{filename:'player-combat.js'});

sandbox.attack();
assert.equal(sandbox.mobs[0].hp,0,'one valid knife hit must defeat a low-health crawler');
assert.equal(sandbox.inventory.shard,1,'the kill reward must reach the real inventory settlement handler');
assert.equal(saves,1,'the reward must be saved once');
assert.equal(updates,1,'the inventory HUD must refresh once');
assert.ok(sandbox.mobs[0].respawnAt>=now+10000,'the defeated mob must enter its respawn delay');
assert.equal(broadcasts.filter(message=>message.event==='attack').length,1,'the existing Relay attack event remains the network contract');
assert.ok(toasts.some(message=>message.includes('eldritch shard')),'the player must receive visible loot feedback');

sandbox.attackCd=0;
sandbox.attack();
assert.equal(sandbox.inventory.shard,1,'repeated attacks against the defeated mob cannot duplicate loot');
assert.equal(saves,1,'repeated attacks cannot save a second reward');

sandbox.rewardKill('remote-player','crawler',{id:'remote-crawler',defeatedAt:now+1});
const remoteLoot=broadcasts.find(message=>message.event==='loot');
assert.ok(remoteLoot,'a remote attacker still receives the existing loot Relay event');
assert.equal(remoteLoot.payload.target,'remote-player');
assert.match(remoteLoot.payload.mobRewardKey,/^companion-egg:remote-crawler:\d+$/,'the claim key uses the already-supported reward field');
assert.equal(Object.hasOwn(remoteLoot.payload,'claimId'),false,'loot settlement does not add a new Relay claim field');

console.log(JSON.stringify({ok:true,combat:'knife kill',reward:'one shard in inventory',saveCalls:saves,relayEvents:broadcasts.filter(message=>message.event==='attack').length,idempotent:true}));
