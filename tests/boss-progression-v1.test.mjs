import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const config=JSON.parse(fs.readFileSync(new URL('../data/world/boss-encounters-v1.json',import.meta.url),'utf8'));
const playerCombatSource=fs.readFileSync(new URL('../modules/combat/player-combat.js',import.meta.url),'utf8');
const combatSource=fs.readFileSync(new URL('../modules/combat/boss-combat-v1.js',import.meta.url),'utf8');
const motionSource=fs.readFileSync(new URL('../modules/main-loop/smooth-motion-v18.js',import.meta.url),'utf8');
const source=fs.readFileSync(new URL('../modules/world/boss-progression-v1.js',import.meta.url),'utf8');
const inventory={wood:0,stone:0,food:0,shard:0,knife:true,lantern:true};
const sent=[],saved=[],hits=[],phaseEvents=[],loot=[],toasts=[],listeners=new Map();
let updateStep=()=>{};
let combatStep=()=>{};
let motionNow=0;
const localStorage={getItem:()=>null,setItem:(key,value)=>saved.push(JSON.parse(value))};
const context=vm.createContext({
  ABYSSAL_BOSS_CONFIG_V1:config,
  ABYSSAL_SAVE_EXTENSIONS_V1:{register:(name,provider)=>{context.saveProvider={name,provider};return true;}},
  ABYSSAL_INVENTORY_TRANSACTIONS_V1:{commitItemGrant:({grants})=>{for(const[key,value]of Object.entries(grants))inventory[key]+=value;context.saveLocal();return{ok:true};}},
  STORAGE_KEY:'abyssal_wake_save_v5',localStorage,inventory,mobs:[],remotes:new Map(),zoneLeader:true,zoneConnected:true,
  currentZone:'1:0',SESSION_ID:'player-a',WORLD:{w:4800,h:4800,zone:1600},CAMP:{x:2400,y:2400,r:470},me:{x:2400,y:1312,zone:'1:0'},started:true,dead:false,zoneCh:{send:packet=>{sent.push(packet);return Promise.resolve('ok');}},
  camera:{x:2400,y:1312},performance:{now:()=>{motionNow+=16;return motionNow;}},
  onMove:()=>{},
  clamp:(v,min,max)=>Math.max(min,Math.min(max,v)),finite:(v,f=0)=>Number.isFinite(Number(v))?Number(v):f,zoneOf:(x,y)=>`${Math.floor(x/1600)}:${Math.floor(y/1600)}`,
  inCamp:()=>false,campDist:(x,y)=>Math.hypot(x-2400,y-2400),dashBtn:{addEventListener(){}},attackBtn:{addEventListener(){}},dashCd:0,dashQueued:false,attackCd:0,attackFlash:0,
  toast:message=>{context.lastToast=message;toasts.push(String(message));},saveLocal:()=>{saved.push({v:5,extensions:context.ABYSSAL_SAVE_EXTENSIONS_V1?.snapshot?.()});return true;},
  spawnMobs:zone=>{context.mobs.splice(0,context.mobs.length,{id:`base:${zone}`,kind:'crawler',x:2300,y:1300,hp:58,phase:0,respawnAt:0});},
  mobWindupSeconds:()=>.8,mobAttackCooldownSeconds:()=>1.1,applyMobDamage:()=>{},updateMobs:dt=>combatStep(dt),onMobHit:payload=>hits.push(payload),
  onMobs:payload=>{context.mobs.splice(0,context.mobs.length,...payload.mobs.map(m=>({...m})));},
  onWorld:()=>{},broadcastWorld:()=>{},onLoot:payload=>loot.push(payload),switchZone:zone=>{context.currentZone=zone;return Promise.resolve(zone);},
  update:()=>updateStep(),draw:()=>{},updateUI:()=>{},questText:{textContent:''},harvestSnapshot:()=>[],
  addEventListener(type,listener){const list=listeners.get(type)||[];list.push(listener);listeners.set(type,list);},
  CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},dispatchEvent(event){phaseEvents.push(event);for(const listener of listeners.get(event.type)||[])listener(event);return true;},Date,Math,Promise,console
});
context.window=context;
context.globalThis=context;
vm.runInContext(playerCombatSource,context,{filename:'player-combat.js'});
vm.runInContext(combatSource,context,{filename:'boss-combat-v1.js'});
vm.runInContext(motionSource,context,{filename:'smooth-motion-v18.js'});
vm.runInContext(source,context,{filename:'boss-progression-v1.js'});
const bossApi=context.ABYSSAL_BOSS_PROGRESSION_V1;
const combatApi=context.ABYSSAL_BOSS_COMBAT_V1;

const regularMob={id:'crawler-loot-forwarding',kind:'crawler',hp:0};
assert.doesNotThrow(()=>context.rewardKill('player-a','crawler',regularMob),'the boss wrapper must forward ordinary kills without referencing an undefined mob');
assert.deepEqual(JSON.parse(JSON.stringify(loot.at(-1))),{target:'player-a',mobKind:'crawler',shard:1,food:0},'ordinary combat rewards must reach the existing loot settlement handler');

context.spawnMobs('1:0');
const boss=context.mobs.find(m=>m.kind==='boss');
assert.ok(boss,'a prepared player in the northern POI receives the boss encounter');
assert.equal(boss.hp,220);
assert.equal(combatApi.getStage({hp:160}),0);
assert.equal(combatApi.getStage({hp:140}),1);
assert.equal(combatApi.getStage({hp:60}),2);
assert.equal(context.mobWindupSeconds('boss'),1.05);
combatStep=()=>{boss.hp=140;};context.updateMobs(.016);
assert.equal(phaseEvents.at(-1)?.detail?.stage,1,'crossing a phase threshold emits a presentation event');
assert.ok(toasts.includes(config.encounters.fen_warden.messages.phase2),'the presentation listener announces the confirmed second phase');
boss.hp=60;context.applyMobDamage('player-a','boss',boss);
assert.equal(hits.at(-1)?.damage,12,'the final phase applies its configured damage');
assert.equal(hits.at(-1)?.sanity,9,'the final phase applies its configured sanity pressure');
assert.equal(context.mobWindupSeconds('boss'),.68,'late phase changes the attack windup');

context.currentZone='1:1';
let zoneResult=await context.switchZone('1:2');
assert.equal(zoneResult,null,'the next exploration zone remains locked before the boss falls');
assert.equal(context.currentZone,'1:1');
context.me.x=2400;context.me.y=3190;
updateStep=()=>{context.me.y=3210;context.switchZone('1:2');};
context.draw();
assert.equal(context.me.y,3190,'the actual V21 motion draw frame must preserve Boss progression movement guards');
assert.equal(context.currentZone,'1:1');
updateStep=()=>{};

context.currentZone='1:0';
boss.hp=220;boss.respawnAt=0;
const attack={id:'player-a',x:2400,y:1312,dir:-Math.PI/2,range:80,damage:22};
for(let hit=0;hit<9;hit++)context.handleMobAttack(attack);
assert.equal(boss.hp,22,'the existing combat hit authority applies knife damage to the boss');
assert.equal(bossApi.isCleared('fen-warden'),false,'the encounter remains active before its final hit');
context.handleMobAttack(attack);
assert.equal(bossApi.isCleared('fen-warden'),true);
assert.ok(phaseEvents.some(event=>event.detail?.stage===2),'ordinary confirmed player hits emit the final boss phase transition at the threshold');
assert.ok(toasts.includes(config.encounters.fen_warden.messages.phase3),'the presentation listener announces the confirmed final phase');
assert.equal(boss.hp,0,'the final confirmed hit defeats the boss');
assert.equal(boss.respawnAt,0,'the cleared boss does not respawn');
assert.equal(inventory.shard,3);
assert.equal(inventory.food,2);
assert.equal(bossApi.isZoneUnlocked('1:2'),true);
context.handleMobAttack(attack);
assert.equal(inventory.shard,3,'replayed attacks cannot duplicate the boss reward');
assert.equal(sent.filter(packet=>packet.event==='loot'&&packet.payload.rewardId==='boss:fen-warden:clear:v1').length,0,'a local attacker receives the reward through the inventory transaction');
assert.ok(saved.length>=2,'progress and the unique reward claim are saved');

context.currentZone='1:1';context.me.x=2400;context.me.y=3190;
updateStep=()=>{context.me.y=3210;context.switchZone('1:2');};
context.draw();
assert.equal(context.currentZone,'1:2','the same motion frame can cross into a zone after the Boss unlocks it');
assert.equal(context.me.y,3210);
updateStep=()=>{};

context.onMobs({zone:'1:0',mobs:[{id:'boss:fen-warden',kind:'boss',x:2400,y:1272,hp:220,phase:1.2,respawnAt:0}]});
const remotePhaseStart=phaseEvents.length;
context.onMobs({zone:'1:0',mobs:[{id:'boss:fen-warden',kind:'boss',x:2400,y:1272,hp:140,phase:1.2,respawnAt:0}]});
assert.ok(phaseEvents.slice(remotePhaseStart).some(event=>event.detail?.stage===1),'an existing Relay mob snapshot crossing the threshold emits the same phase event for remote clients');
assert.ok(toasts.includes(config.encounters.fen_warden.messages.phase2),'remote health snapshots reach the same boss phase presentation listener');
context.onMobs({zone:'1:0',mobs:[{id:'boss:fen-warden',kind:'boss',x:2400,y:1272,hp:185,phase:1.2,respawnAt:0}]});
assert.equal(context.mobs.find(m=>m.kind==='boss').hp,185,'Relay snapshots retain the boss health above the ordinary-mob cap');
bossApi.applyWorldSnapshot({version:1,cleared:['fen-warden']});
assert.deepEqual(JSON.parse(JSON.stringify(bossApi.networkSnapshot())),{version:1,cleared:['fen-warden']});

console.log(JSON.stringify({ok:true,threeCombatPhases:true,zoneGate:true,uniqueReward:true,relayBossHealth:true,worldProgress:true}));
