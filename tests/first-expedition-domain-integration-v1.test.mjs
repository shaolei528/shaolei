import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const inventorySource=read('modules/items/inventory-transactions-v1.js');
const saveSource=read('modules/core/save-extensions-v1.js');
const inboundSource=read('modules/network/inbound-events.js');
const lootSource=read('modules/loot/creature-rewards-v1.js');
const craftingSource=read('modules/crafting/crafting-processing-v1.js');
const resourceWorkSource=read('modules/interaction/resource-work.js');
const combatSource=read('modules/combat/player-combat.js');
const expeditionSource=read('modules/world/awakening-expedition-loop-v1.js');
const lootBridgeSource=read('modules/world/expedition-loot-bridge-v1.js');
const interactionSource=read('modules/input/interaction-v12.js');
const recipes=JSON.parse(read('data/crafting/recipes-v1.json'));
const rewards=JSON.parse(read('data/loot/creature-rewards-v1.json'));
const workbenchMatch=interactionSource.match(/const WORKBENCH=\{x:(\d+),y:(\d+)\}/);
assert.ok(workbenchMatch,'use the active interaction module workbench coordinates');
const WORKBENCH={x:Number(workbenchMatch[1]),y:Number(workbenchMatch[2])};
const harvestStart=interactionSource.indexOf('  function harvestResource(r){');
const harvestEnd=interactionSource.indexOf('  function restAtFire(){',harvestStart);
assert.ok(harvestStart>=0&&harvestEnd>harvestStart,'use the active interaction harvest transaction from V21');
const harvestSource=interactionSource.slice(harvestStart,harvestEnd);

let now=1000,saves=0,uiUpdates=0;
const toasts=[],relayEvents=[],workFeedback=[],listeners=new Map();
class TestDate extends Date{static now(){return now}}
class TestCustomEvent{
  constructor(type,options={}){this.type=type;this.detail=options.detail;this.cancelable=!!options.cancelable;this.defaultPrevented=false;}
  preventDefault(){if(this.cancelable)this.defaultPrevented=true;}
}
const CAMP={x:2400,y:2400,r:500};
const sandbox={
  console,Date:TestDate,CustomEvent:TestCustomEvent,window:null,globalThis:null,
  STORAGE_KEY:'abyssal_wake_save_v5',
  AW_SUCCESSOR_GRAYBOX_CONTINUITY:true,
  localStorage:{getItem(){return null;}},
  SESSION_ID:'local-player',WORLD:{w:4800,h:4800,zone:1600},CAMP,
  currentZone:'1:1',started:true,dead:false,zoneConnected:true,zoneLeader:true,
  attackCd:0,attackFlash:0,dashCd:0,dashQueued:false,invulnerableUntil:0,fieldGraceUntil:0,
  me:{id:'local-player',name:'Tester',x:CAMP.x,y:CAMP.y,r:14,hp:100,hunger:80,sanity:100,dir:0},
  questText:{textContent:''},
  inventory:{wood:0,stone:0,food:2,shard:0,seed:0,egg:0,milk:0,wool:0,fish_reedcarp:0,fish_glassminnow:0,fish_holloweye:0,companion_egg:0,meal_river_stew:0,meal_glass_porridge:0,meal_holloweye_chowder:0,meal_trail_stew:0,knife:false,lantern:false},
  mobs:[],resources:[],harvested:new Map(),remotes:new Map(),lastSeqById:new Map(),
  ABYSSAL_CRAFTING_RECIPES_V1:recipes,
  ABYSSAL_CREATURE_REWARDS_CONFIG_V1:rewards,
  ABYSSAL_AWAKENING_WORLD_V1:{poi:{x:2112,y:640,w:640,h:448,parking:{x:2048,y:1088,w:768,h:288}}},
  listeners,
  addEventListener(type,listener){const group=listeners.get(type)||[];group.push(listener);listeners.set(type,group);},
  dispatchEvent(event){for(const listener of listeners.get(event.type)||[])listener(event);return !event.defaultPrevented;},
  saveLocal(){saves++;return true;},
  updateUI(){uiUpdates++;},
  toast(message){toasts.push(String(message));},
  emitGameplayEvent(){},refreshInteractionPrompt(){},
  dashBtn:{addEventListener(){}},attackBtn:{addEventListener(){}},
  craftPanel:{addEventListener(){}},
  zoneCh:{send(message){relayEvents.push(message);return Promise.resolve('ok');}},
  finite(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback;},
  clamp(value,min,max){return Math.max(min,Math.min(max,value));},
  campDist(x,y){return Math.hypot(x-CAMP.x,y-CAMP.y);},
  inCamp(actor){const p=actor||sandbox.me;return sandbox.campDist(p.x,p.y)<CAMP.r;},
  ITEM_ZH:{wood:'木材',stone:'石料'},
  ABYSSAL_INTERACTION_V12:{getTarget(){
    if(!sandbox.inCamp(sandbox.me))return null;
    const distanceToBench=Math.hypot(sandbox.me.x-WORKBENCH.x,sandbox.me.y-WORKBENCH.y);
    return distanceToBench<=92?{type:'workbench',d:distanceToBench}:null;
  }}
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
const claimedLoot=[];
sandbox.addEventListener('abyssal:loot-claimed',event=>claimedLoot.push(event.detail));
sandbox.addEventListener('abyssal:resource-work-feedback',event=>workFeedback.push(event.detail));
vm.createContext(sandbox);
for(const[source,name]of[
  [saveSource,'save-extensions-v1.js'],
  [inventorySource,'inventory-transactions-v1.js'],
  [inboundSource,'inbound-events.js'],
  [lootSource,'creature-rewards-v1.js'],
  [resourceWorkSource,'resource-work.js'],
  [craftingSource,'crafting-processing-v1.js'],
  [combatSource,'player-combat.js'],
  [expeditionSource,'awakening-expedition-loop-v1.js'],
  [lootBridgeSource,'expedition-loot-bridge-v1.js']
])vm.runInContext(source,sandbox,{filename:name});
assert.ok(sandbox.ABYSSAL_RESOURCE_WORK_V1,'the successor resource-work stage gate must be active during this integration test');

function harvest(id,type,total){
  for(let hit=0;hit<total;hit++){
    now+=200;
    sandbox.resource={id,type,x:sandbox.me.x,y:sandbox.me.y};
    vm.runInContext(`${harvestSource}\nharvestResource(resource);`,sandbox,{filename:'active-harvest-resource.js'});
  }
}

// Gather the recipe with the same staged input path that the visible interaction uses.
for(let node=0;node<4;node++)harvest(`camp:wood-${node}`,'wood',3);
for(let node=0;node<3;node++)harvest(`camp:stone-${node}`,'stone',4);
assert.deepEqual([sandbox.inventory.wood,sandbox.inventory.stone],[4,3],'wood and stone only enter inventory on the final strike for each node');
assert.equal(workFeedback.length,24,'each deliberate wood/stone strike emits one progress event');
assert.equal(workFeedback.filter(event=>event.complete).length,7,'each of the seven resource nodes settles exactly once');
assert.deepEqual(workFeedback.filter(event=>event.id==='camp:wood-0').map(event=>event.hit),[1,2,3],'wood feedback advances through three strikes');
assert.deepEqual(workFeedback.filter(event=>event.id==='camp:stone-0').map(event=>event.hit),[1,2,3,4],'stone feedback advances through four strikes');

const expedition=sandbox.ABYSSAL_EXPEDITION_LOOP_V1;
sandbox.updateQuest();
assert.match(sandbox.questText.textContent,/^工作台制作骨刀/);
assert.equal(sandbox.ABYSSAL_CRAFTING_PROCESSING_V1.craft('knife').reason,'workbench-required','the real workbench radius must reject crafting from camp center');
sandbox.me.x=WORKBENCH.x;sandbox.me.y=WORKBENCH.y;
assert.equal(sandbox.ABYSSAL_INTERACTION_V12.getTarget()?.type,'workbench','the actual workbench location is interactable');
const crafted=sandbox.ABYSSAL_CRAFTING_PROCESSING_V1.craft('knife');
assert.equal(crafted.ok,true,'the bone knife must craft at the HOME workbench');
assert.deepEqual([sandbox.inventory.wood,sandbox.inventory.stone,sandbox.inventory.knife],[0,0,true],'crafting commits the recipe exactly once');
sandbox.updateQuest();
assert.match(sandbox.questText.textContent,/^北路前往 MIRE MART/);

// Advance the existing character-save route using world observations.
sandbox.me.x=2400;sandbox.me.y=1800;sandbox.currentZone='1:0';
sandbox.updateQuest();
assert.match(sandbox.questText.textContent,/^抵达 MIRE MART/);
sandbox.mobs=[
  {id:'poi:store:crawler-a',kind:'crawler',x:2304,y:1248,hp:58,phase:0,hitCd:0,respawnAt:0},
  {id:'poi:store:crawler-b',kind:'crawler',x:2752,y:1248,hp:58,phase:0,hitCd:0,respawnAt:0}
];
sandbox.me.x=2264;sandbox.me.y=1248;
sandbox.updateQuest();
assert.match(sandbox.questText.textContent,/^搜寻\/击退爬行者/);

function killNearestCrawler(x,y){
  sandbox.me.x=x;sandbox.me.y=y;
  for(let strike=0;strike<3;strike++){
    now+=320;sandbox.attackCd=0;sandbox.attack();
  }
}
const uiBeforeKill=uiUpdates;
assert.equal(expedition.atMireMart(sandbox.me),true,'the encounter begins inside the authored parking boundary');
killNearestCrawler(2817,1248);
assert.equal(expedition.atMireMart(sandbox.me),false,'the player can kite the second authored crawler just beyond the parking boundary');
assert.equal(sandbox.mobs[1].hp,0,'three bone-knife hits defeat the second authored crawler after kiting outside the parking boundary');
assert.equal(sandbox.inventory.shard,1,'the first kill reward reaches the player inventory');
assert.ok(uiUpdates>uiBeforeKill,'the confirmed creature reward refreshes the visible inventory HUD');
assert.equal(expedition.state.phase,'SEARCH_FIGHT','a confirmed reward event is still required before returning');
assert.equal(expedition.state.hasDefeatedCreature,true,'the claimed MIRE MART reward satisfies the creature part of the objective');
assert.equal(claimedLoot.length,1,'the loot owner emits one confirmed claim event after inventory commit');
sandbox.dispatchEvent(new TestCustomEvent('abyssal:loot-claimed',{detail:claimedLoot[0]}));
assert.equal(expedition.state.killRewardKeys.length,1,'replaying a confirmed reward event cannot duplicate the expedition proof');
sandbox.updateQuest();
assert.equal(expedition.state.phase,'SECURE_REQUIRED_SALVAGE','one confirmed crawler reward now secures the first-trip salvage');
assert.match(sandbox.questText.textContent,/^带碎片回营/);
assert.equal(relayEvents.filter(message=>message.event==='attack').length,3,'combat keeps using the established attack relay event');
assert.equal(relayEvents.some(message=>message.event==='loot'),false,'local leader rewards settle locally without inventing a new relay message');

sandbox.me.x=2400;sandbox.me.y=1600;
sandbox.updateQuest();
assert.match(sandbox.questText.textContent,/^沿北路返营/);
sandbox.me.x=CAMP.x;sandbox.me.y=CAMP.y;
sandbox.currentZone='1:1';
sandbox.updateQuest();
assert.equal(expedition.state.phase,'COMPLETE','returning with the secure shards completes the existing expedition route');
assert.match(sandbox.questText.textContent,/^提灯材料/,'the next objective after returning is to gather Lantern materials');
assert.match(sandbox.questText.textContent,/木0\/3 碎片1\/2/,'the next objective reports the missing Lantern recipe materials');
assert.ok(saves>=10,'each gathered node, craft and confirmed kill persists through the existing local save path');
assert.ok(uiUpdates>=8,'resource, crafting, and reward changes refresh the visible HUD');

console.log(JSON.stringify({ok:true,scope:'domain-integration-not-browser-play',resources:{wood:4,stone:3},craft:'bone-knife',encounter:'one authored crawler',loot:{shards:sandbox.inventory.shard,uniqueKills:1,questGate:'confirmed-local-reward'},route:expedition.state.history,saves,uiUpdates,relayAttackEvents:3,protocol:'unchanged'}));
