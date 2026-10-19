import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const block=(text,startToken,endToken)=>{
  const start=text.indexOf(startToken),end=text.indexOf(endToken,start);
  assert.ok(start>=0,`missing block start: ${startToken}`);
  assert.ok(end>start,`missing block end: ${endToken}`);
  return text.slice(start,end);
};

const platformSource=read('modules/input/platform-inventory-v19.js');
const interactionSource=read('modules/input/interaction-v12.js');
const safeCampSource=read('modules/safe-camp/game-v7-patch.js');
const inboundSource=read('modules/network/inbound-events.js');
const lootSource=read('modules/loot/creature-rewards-v1.js');
const mobCombatSource=read('modules/combat/mob-combat.js');
const playerCombatSource=read('modules/combat/player-combat.js');
const expeditionSource=read('modules/world/awakening-expedition-loop-v1.js');
const bossCombatSource=read('modules/combat/boss-combat-v1.js');
const bossProgressionSource=read('modules/world/boss-progression-v1.js');
const interactionConstants=block(interactionSource,'  const FIRE={','  function emitGameplayEvent');
const interactionRuntime=[
  block(interactionSource,'  function nearestResource(){','  function interactionTarget(){'),
  block(interactionSource,'  function interactionTarget(){','  function harvestResource(r){'),
  block(interactionSource,'  function harvestResource(r){','  function restAtFire(){'),
  block(interactionSource,'  function interact(){','  function triggerContextInteraction(){'),
  block(interactionSource,'  function triggerContextInteraction(){','  function replaceInteractionButton(){')
].join('\n');
const inputRuntime=[
  block(platformSource,'function keyboardVector(keys){','function isTypingTarget(target){'),
  block(platformSource,'function isTypingTarget(target){','function inventorySnapshot(source){'),
  block(platformSource,'function applyKeyboardMovement(){','function triggerDash(){'),
  block(platformSource,'function triggerDash(){','function triggerAttack(){'),
  block(platformSource,'function triggerAttack(){','let activeInteractionKeyboardEvent=null;'),
  block(platformSource,'let activeInteractionKeyboardEvent=null;','function movementCode(code){'),
  block(platformSource,'function movementCode(code){','function onKeyDown(event){'),
  block(platformSource,'function onKeyDown(event){','function onKeyUp(event){'),
  block(platformSource,'function onKeyUp(event){','function fitDesktopCanvas(){')
].join('\n');

let now=1000,performanceNow=0,saves=0,uiUpdates=0;
const CAMP={x:2400,y:2400,r:500,inner:340};
const noop=()=>{};
const listeners=new Map(),feedback=[],toasts=[],bossPhases=[];
let savedRecord=null;
class TestDate extends Date{static now(){return now;}}
class TestCustomEvent{
  constructor(type,options={}){this.type=type;this.detail=options.detail;this.cancelable=!!options.cancelable;this.defaultPrevented=false;}
  preventDefault(){if(this.cancelable)this.defaultPrevented=true;}
}
const sandbox={
  console,Date:TestDate,CustomEvent:TestCustomEvent,window:null,globalThis:null,performance:{now(){return performanceNow;}},
  AW_SUCCESSOR_GRAYBOX_CONTINUITY:true,STORAGE_KEY:'abyssal_wake_save_v5',
  localStorage:{getItem(){return savedRecord;},setItem(_key,value){savedRecord=value;}},SESSION_ID:'keyboard-player',
  WORLD:{w:4800,h:4800,zone:1600},CAMP,currentZone:'1:1',switching:false,
  camera:{x:CAMP.x,y:CAMP.y},canvas:{width:800,height:600},
  ctx:{imageSmoothingEnabled:false,save:noop,restore:noop,fillRect:noop,strokeRect:noop,beginPath:noop,rect:noop,arc:noop,fill:noop,drawImage:noop},draw:noop,onMove:noop,
  started:true,zoneConnected:true,zoneLeader:false,dead:false,hasLeftCamp:false,wasInCamp:true,
  me:{id:'keyboard-player',name:'Tester',x:CAMP.x,y:CAMP.y+70,r:14,hp:100,hunger:80,sanity:100,dir:0,seq:0},
  inventory:{wood:0,stone:0,food:2,shard:0,seed:3,egg:0,milk:0,wool:0,fish_reedcarp:0,fish_glassminnow:0,fish_holloweye:0,companion_egg:0,meal_river_stew:0,meal_glass_porridge:0,meal_holloweye_chowder:0,meal_trail_stew:0,knife:false,lantern:false},
  resources:[],mobs:[],remotes:new Map(),harvested:new Map(),lastSeqById:new Map(),
  joystickState:{x:0,y:0},keys:new Set(),dashQueued:false,dashCd:0,attackCd:0,attackFlash:0,walkClock:0,isMoving:false,fieldGraceUntil:0,
  zoneLeader:false,moveTimer:0,mobSendTimer:0,pingTimer:0,globalTrackTimer:0,saveTimer:0,uiTimer:0,
  API:{panelOpen:false},isDesktop:()=>true,
  dashBtn:{addEventListener:noop},attackBtn:{addEventListener:noop},craftPanel:{classList:{add:noop,remove:noop},addEventListener:noop},
  questText:{textContent:''},
  sendMove:noop,measurePing:noop,applyLocalSurvival:noop,updateQuest:noop,
  drawGround:noop,drawCamp:noop,drawLighting:noop,
  globalCh:{track:noop},globalMeta:()=>({}),zoneCh:{send:()=>Promise.resolve('ok')},
  adaptiveInterval:()=>1,finite:(v,f=0)=>Number.isFinite(Number(v))?Number(v):f,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),lerp:(a,b,t)=>a+(b-a)*t,
  zoneOf:(x,y)=>`${Math.floor(x/1600)}:${Math.floor(y/1600)}`,
  campDist(x,y){return Math.hypot(x-CAMP.x,y-CAMP.y);},inCamp(actor){const p=actor||sandbox.me;return sandbox.campDist(p.x,p.y)<CAMP.r;},
  distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);},
  safeStop:noop,hideOtherPanels:noop,openGuideDialog:noop,restAtFire:noop,openChest:noop,
  emitGameplayEvent:noop,refreshInteractionPrompt:noop,toast(message){toasts.push(String(message));},
  saveLocal(){saves++;savedRecord=JSON.stringify({v:5,inventory:{...sandbox.inventory},extensions:sandbox.ABYSSAL_SAVE_EXTENSIONS_V1?.snapshot?.()||{version:1,owners:{}}});return true;},updateUI(){uiUpdates++;sandbox.updateQuest?.();},
  addEventListener(type,listener){const group=listeners.get(type)||[];group.push(listener);listeners.set(type,group);},
  dispatchEvent(event){for(const listener of listeners.get(event.type)||[])listener(event);return !event.defaultPrevented;},
  document:{dispatchEvent(){return true;}},
  seedZone(zone){sandbox.resources=[];if(String(zone)==='1:1')sandbox.addCampResources();},
  freshMob:()=>null,spawnMobs(){sandbox.mobs=[];},switchZone(zone){sandbox.switching=true;sandbox.currentZone=zone;sandbox.seedZone(zone);sandbox.spawnMobs(zone);sandbox.switching=false;},
  updateMobs:noop,onMobHit:noop,broadcastWorld:noop
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
sandbox.ABYSSAL_SHELL_V1={blocksGameInput:()=>false};
sandbox.ABYSSAL_BOSS_CONFIG_V1=JSON.parse(read('data/world/boss-encounters-v1.json'));
vm.createContext(sandbox);

// Load the real movement, camera, collision, and water owners used by V21.
vm.runInContext(read('modules/world/world-spatial-v1.js'),sandbox,{filename:'world-spatial-v1.js'});
sandbox.ABYSSAL_WATER_BODIES_CONFIG_V1=JSON.parse(read('data/world/water-bodies-v1.json'));
vm.runInContext(read('modules/world/water-bodies-v1.js'),sandbox,{filename:'water-bodies-v1.js'});
vm.runInContext(read('terrain-v21.js'),sandbox,{filename:'terrain-v21.js'});
vm.runInContext(read('modules/main-loop/simulation-update.js'),sandbox,{filename:'simulation-update.js'});
vm.runInContext(read('prototypes/successor-3-4/camera-adapter.js'),sandbox,{filename:'camera-adapter.js'});
vm.runInContext(read('modules/world/awakening-world-v1.js'),sandbox,{filename:'awakening-world-v1.js'});

const resourceSeedStart=safeCampSource.indexOf('  addCampResources=function(){');
const resourceSeedEnd=safeCampSource.indexOf('harvestSnapshot=function',resourceSeedStart);
assert.ok(resourceSeedStart>=0&&resourceSeedEnd>resourceSeedStart,'use the live Safe Camp resource layout');
vm.runInContext(safeCampSource.slice(resourceSeedStart,resourceSeedEnd),sandbox,{filename:'safe-camp-resource-layout.js'});
sandbox.seedZone('1:1');

const water=JSON.parse(read('data/world/water-bodies-v1.json'));
const recipes=JSON.parse(read('data/crafting/recipes-v1.json'));
sandbox.ABYSSAL_CREATURE_REWARDS_CONFIG_V1=JSON.parse(read('data/loot/creature-rewards-v1.json'));
sandbox.ABYSSAL_CRAFTING_RECIPES_V1=recipes;
for(const[source,name]of[
  [read('modules/core/save-extensions-v1.js'),'save-extensions-v1.js'],
  [read('modules/items/inventory-transactions-v1.js'),'inventory-transactions-v1.js'],
  [inboundSource,'inbound-events.js'],
  [lootSource,'creature-rewards-v1.js'],
  [read('modules/interaction/resource-work.js'),'resource-work.js'],
  [read('modules/crafting/crafting-processing-v1.js'),'crafting-processing-v1.js'],
  [mobCombatSource,'mob-combat.js'],
  [playerCombatSource,'player-combat.js'],
  [expeditionSource,'awakening-expedition-loop-v1.js']
])vm.runInContext(source,sandbox,{filename:name});
vm.runInContext(read('modules/main-loop/smooth-motion-v18.js'),sandbox,{filename:'smooth-motion-v18.js'});
vm.runInContext(bossCombatSource,sandbox,{filename:'boss-combat-v1.js'});
vm.runInContext(bossProgressionSource,sandbox,{filename:'boss-progression-v1.js'});

// Evaluate the exact active interaction and keyboard functions without the UI shell.
vm.runInContext(`${interactionConstants}\nlet dialogOpen=false;\n${interactionRuntime}\nwindow.ABYSSAL_INTERACTION_V12={getTarget:interactionTarget,triggerContextInteraction};`,sandbox,{filename:'interaction-v12-runtime.js'});
vm.runInContext(inputRuntime,sandbox,{filename:'platform-inventory-v19-input.js'});
for(const type of ['abyssal:resource-work-feedback'])sandbox.addEventListener(type,event=>feedback.push(event.detail));
sandbox.addEventListener('abyssal:boss-phase',event=>bossPhases.push(event.detail?.stage));

const adapter=sandbox.ABYSSAL_CAMERA_ADAPTER_V1;
assert.ok(adapter&&sandbox.ABYSSAL_AWAKENING_WORLD_V1,'the real camera and collision APIs must be loaded');
function sendKey(code,down){
  const event={code,repeat:false,target:{tagName:'DIV'},preventDefault(){this.defaultPrevented=true;}};
  (down?sandbox.onKeyDown:sandbox.onKeyUp)(event);
}
function movementFrame(){
  const input={...sandbox.joystickState};
  const worldInput=adapter.worldIntentForScreenInput(input.x,input.y);
  sandbox.joystickState={x:worldInput.x,y:worldInput.y};
  performanceNow+=50;
  sandbox.draw();
}
function tapDirection(screenX,screenY){
  const codes=[];
  if(screenX<0)codes.push('KeyA');else if(screenX>0)codes.push('KeyD');
  if(screenY<0)codes.push('KeyW');else if(screenY>0)codes.push('KeyS');
  for(const code of codes)sendKey(code,true);
  movementFrame();
  for(const code of codes)sendKey(code,false);
}
function moveWithinRange(target,range=55,maxFrames=5000){
  let blockedFrames=0,lastX=sandbox.me.x,lastY=sandbox.me.y;
  for(let frame=0;frame<maxFrames;frame++){
    const point=typeof target==='function'?target():target;
    if(Math.hypot(sandbox.me.x-point.x,sandbox.me.y-point.y)<=range){movementFrames+=frame;return frame;}
    const projected=adapter.project(point.x-sandbox.me.x,point.y-sandbox.me.y);
    tapDirection(Math.sign(projected.x),Math.sign(projected.y));
    if(Math.hypot(sandbox.me.x-lastX,sandbox.me.y-lastY)<.01)blockedFrames++;else blockedFrames=0;
    lastX=sandbox.me.x;lastY=sandbox.me.y;
    assert.ok(blockedFrames<90,`ordinary keyboard route is blocked before ${point.id||'target'} at ${Math.round(lastX)},${Math.round(lastY)}`);
  }
  assert.fail(`ordinary keyboard route did not reach ${(typeof target==='function'?target():target).id||'target'} within ${maxFrames} frames at ${Math.round(sandbox.me.x)},${Math.round(sandbox.me.y)}`);
}
function interact(){now+=200;sendKey('KeyE',true);sendKey('KeyE',false);}
function advanceFrames(count){for(let frame=0;frame<count;frame++)movementFrame();}
function attackOnce(){sendKey('Space',true);sendKey('Space',false);}
let movementFrames=0;

const woodNodes=sandbox.resources.filter(resource=>resource.type==='wood');
const stoneNodes=sandbox.resources.filter(resource=>resource.type==='stone');
assert.ok(woodNodes.length>=4&&stoneNodes.length>=3,'the active Safe Camp layout must expose the starter recipe materials');
const chosenWood=woodNodes.filter(resource=>['camp:0','camp:1','camp:2','camp:4'].includes(resource.id));
const chosenStone=stoneNodes.filter(resource=>['camp:6','camp:7','camp:8'].includes(resource.id));
assert.equal(chosenWood.length,4);assert.equal(chosenStone.length,3);

const requirements={wood:4,stone:3},visited=new Set(),candidates=[...chosenWood,...chosenStone];
while(sandbox.inventory.wood<requirements.wood||sandbox.inventory.stone<requirements.stone){
  const node=candidates.filter(resource=>!visited.has(resource.id)&&sandbox.inventory[resource.type]<requirements[resource.type])
    .sort((a,b)=>Math.hypot(a.x-sandbox.me.x,a.y-sandbox.me.y)-Math.hypot(b.x-sandbox.me.x,b.y-sandbox.me.y))[0];
  assert.ok(node,'ordinary movement must leave enough unvisited starter materials to finish the knife recipe');
  visited.add(node.id);
  moveWithinRange(node,54);
  const target=sandbox.ABYSSAL_INTERACTION_V12.getTarget();
  assert.equal(target?.type,'resource',`Key E must have a nearby resource target while approaching ${node.id}`);
  const actual=target.resource;
  if(!Object.hasOwn(requirements,actual.type)||sandbox.inventory[actual.type]>=requirements[actual.type])continue;
  const before=sandbox.inventory[actual.type],hits=actual.type==='wood'?3:4;
  for(let hit=0;hit<hits;hit++){
    interact();
    assert.equal(sandbox.inventory[actual.type],before+(hit===hits-1?1:0),`${actual.id} must settle once after its final hit`);
  }
}
assert.ok(sandbox.inventory.wood>=4&&sandbox.inventory.stone>=3);
assert.ok(feedback.length>=24,'ordinary Key E input must produce the staged wood and stone strike feedback');
assert.ok(feedback.filter(event=>event.complete).length>=7,'each completed resource node grants inventory exactly once');

const bench=vm.runInContext('({x:WORKBENCH.x,y:WORKBENCH.y})',sandbox);
moveWithinRange(bench,70);
assert.equal(sandbox.ABYSSAL_INTERACTION_V12.getTarget()?.type,'workbench','ordinary movement must reach the actual workbench interaction radius');
interact();
const beforeCraft={wood:sandbox.inventory.wood,stone:sandbox.inventory.stone};
assert.equal(sandbox.ABYSSAL_CRAFTING_PROCESSING_V1.craft('knife').ok,true,'the bone knife must craft after walking to the real workbench and opening it with Key E');
assert.equal(beforeCraft.wood-sandbox.inventory.wood,4,'crafting consumes the recipe wood exactly once');
assert.equal(beforeCraft.stone-sandbox.inventory.stone,3,'crafting consumes the recipe stone exactly once');
assert.equal(sandbox.inventory.knife,true);
advanceFrames(6);

// Continue with normal movement into MIRE MART, then use Space against the authored crawlers.
moveWithinRange({x:2400,y:1280,id:'MIRE MART parking approach'},40);
advanceFrames(6);
assert.equal(sandbox.currentZone,'1:0','ordinary direction keys must cross naturally from HOME into MIRE MART');
assert.equal(sandbox.ABYSSAL_EXPEDITION_LOOP_V1.state.phase,'SEARCH_FIGHT',`the objective advances after the ordinary-input route reaches the MIRE MART parking area: ${JSON.stringify({position:{x:sandbox.me.x,y:sandbox.me.y},atMart:sandbox.ABYSSAL_EXPEDITION_LOOP_V1.atMireMart(sandbox.me),observation:sandbox.ABYSSAL_EXPEDITION_LOOP_V1.runtimeObservation(),uiUpdates,phase:sandbox.ABYSSAL_EXPEDITION_LOOP_V1.state.phase})}`);
assert.equal(sandbox.mobs.length,2,'the first MIRE MART area should contain its two authored crawlers');
sandbox.zoneLeader=true;
const firstCrawler=sandbox.mobs.find(mob=>mob.id==='poi:store:crawler-a');
assert.ok(firstCrawler,'the first authored crawler must be active');
moveWithinRange(()=>({...firstCrawler,id:'first crawler attack position'}),64);
assert.ok(Math.hypot(sandbox.me.x-firstCrawler.x,sandbox.me.y-firstCrawler.y)<=80,'ordinary movement must bring the player into bone-knife range');
for(let hit=0;hit<3;hit++){
  attackOnce();
  assert.ok(sandbox.attackCd>0,`Space must trigger the live attack binding before damage; started=${sandbox.started}, dead=${sandbox.dead}, zoneConnected=${sandbox.zoneConnected}, panelOpen=${sandbox.API.panelOpen}, inCamp=${sandbox.inCamp(sandbox.me)}, zone=${sandbox.currentZone}`);
  if(hit<2)advanceFrames(7);
}
assert.equal(firstCrawler.hp,0,'three Space attacks with the crafted bone knife defeat the first crawler');
assert.equal(sandbox.inventory.shard,1,'the first live kill reward reaches the real inventory transaction');

const secondCrawler=sandbox.mobs.find(mob=>mob.id==='poi:store:crawler-b');
moveWithinRange(()=>({...secondCrawler,id:'second crawler attack position'}),64);
for(let hit=0;hit<3;hit++){
  attackOnce();
  if(hit<2)advanceFrames(7);
}
assert.equal(secondCrawler.hp,0,'the second authored crawler is defeated through normal Space input');
assert.equal(sandbox.inventory.shard,2,'two unique crawler rewards complete the salvage requirement');
advanceFrames(6);
assert.equal(sandbox.ABYSSAL_EXPEDITION_LOOP_V1.state.phase,'SECURE_REQUIRED_SALVAGE','the objective recognizes the secured salvage through its normal UI update');
moveWithinRange({x:CAMP.x,y:1450,id:'MIRE MART north road return'},48);
moveWithinRange({x:CAMP.x,y:CAMP.y-CAMP.r+60,id:'Safe Camp north entrance'},60);
assert.equal(sandbox.inCamp(sandbox.me),true,'normal keyboard movement must return the player inside Safe Camp');
assert.equal(sandbox.currentZone,'1:1','the return route must cross naturally back into the HOME zone');
advanceFrames(6);
assert.equal(sandbox.ABYSSAL_EXPEDITION_LOOP_V1.state.phase,'COMPLETE','the ordinary-input expedition completes only after bringing shards home');
const persisted=JSON.parse(savedRecord||'null');
assert.equal(persisted?.v,5,'the ordinary-input route writes through the existing V5 save path');
assert.equal(persisted?.extensions?.owners?.['world.expedition-loop.v1']?.phase,'COMPLETE','ordinary travel, combat and return persist the completed expedition phase');
assert.equal(persisted?.inventory?.shard,2,'the returned salvage and its completed objective share the same save snapshot');

// Continue the same character: bring home field wood, craft a lantern, defeat the prepared boss, and enter its newly unlocked zone.
const extraWood=sandbox.resources.filter(resource=>resource.type==='wood'&&!visited.has(resource.id));
assert.ok(extraWood.length>=3,'the camp provides the remaining field wood needed for a lantern after crafting the starter knife');
for(const node of extraWood.slice(0,3)){
  moveWithinRange(node,54);
  interact();interact();
}
assert.ok(sandbox.inventory.wood>=3,'ordinary movement and gathering collect enough wood for the lantern');
moveWithinRange(bench,70);interact();
const lanternCraftBefore={wood:sandbox.inventory.wood,shard:sandbox.inventory.shard};
assert.equal(sandbox.ABYSSAL_CRAFTING_PROCESSING_V1.craft('lantern').ok,true,'the same workbench makes the lantern from recovered wood and shards');
assert.equal(lanternCraftBefore.wood-sandbox.inventory.wood,3,'lantern crafting consumes three wood once');
assert.equal(lanternCraftBefore.shard-sandbox.inventory.shard,2,'lantern crafting consumes two shards once');
assert.equal(sandbox.inventory.lantern,true,'lantern equipment unlocks the boss encounter');
moveWithinRange({x:2400,y:1280,id:'return to the northern boss arena'},40);
advanceFrames(6);
const boss=sandbox.mobs.find(mob=>mob.kind==='boss'&&mob.hp>0);
assert.ok(boss,'bone knife plus lantern spawns the Fen Warden in MIRE MART');
moveWithinRange(()=>({...boss,id:'Fen Warden attack position'}),72);
for(let hit=0;hit<10;hit++){
  attackOnce();
  if(hit<9)advanceFrames(7);
}
assert.equal(boss.hp,0,'ten ordinary Space attacks with the bone knife defeat the 220 HP boss');
assert.ok(bossPhases.includes(1)&&bossPhases.includes(2),'the ordinary fight crosses both configured boss phase thresholds');
assert.equal(sandbox.ABYSSAL_BOSS_PROGRESSION_V1.isCleared('fen-warden'),true,'the boss clear is recorded through the encounter owner');
assert.equal(sandbox.inventory.shard,3,'the boss reward grants three shards after the lantern cost');
assert.equal(sandbox.inventory.food,4,'the boss reward grants two food exactly once');
assert.ok(sandbox.ABYSSAL_BOSS_PROGRESSION_V1.getState().unlockedZones.includes('1:2'),'the boss reward opens the southern exploration zone');
assert.match(sandbox.ABYSSAL_EXPEDITION_LOOP_V1.objectiveText(sandbox.ABYSSAL_EXPEDITION_LOOP_V1.state,sandbox.ABYSSAL_EXPEDITION_LOOP_V1.runtimeObservation()),/南侧探索区开放/,'after the boss dies, the active objective must stop pointing back to the boss and explain the next region');
const bossSave=JSON.parse(savedRecord||'null');
assert.deepEqual(bossSave?.extensions?.owners?.['world.boss-progression.v1']?.cleared,['fen-warden'],'boss progress is stored in the existing V5 save extension');

// Recheck the visible pond through the same smoothed V21 frame used by the successor.
const pond=sandbox.ABYSSAL_WATER_BODIES_V1.getBody('camp-pool'),waterLeft=pond.cx-pond.halfWidth-pond.collisionPadding;
sandbox.currentZone=pond.zone;sandbox.me.x=waterLeft-30;sandbox.me.y=pond.cy;sandbox.joystickState={x:0,y:0};
sendKey('KeyD',true);sendKey('KeyS',true);
let enteredPond=false;
for(let frame=0;frame<50;frame++){
  movementFrame();
  enteredPond ||= sandbox.ABYSSAL_WATER_BODIES_V1.isInWater(pond.zone,sandbox.me.x,sandbox.me.y);
  assert.equal(sandbox.ABYSSAL_WORLD_SPATIAL_V1.isBlockedCircle(pond.zone,sandbox.me.x,sandbox.me.y,sandbox.me.r),false,'the player collider must stay on the dry bank');
}
sendKey('KeyD',false);sendKey('KeyS',false);
assert.equal(enteredPond,false,'ordinary diagonal keyboard movement through the actual V21 motion frame cannot enter visible pond water');

console.log(JSON.stringify({ok:true,scope:'ordinary-keyboard-input-v21-motion-simulation-not-browser-play',controls:'WASD+KeyE+Space',gathered:{wood:beforeCraft.wood,stone:beforeCraft.stone},crafted:['bone-knife','lantern'],crawlersDefeated:2,bossDefeated:true,bossPhases:[...new Set(bossPhases)],unlockedZones:sandbox.ABYSSAL_BOSS_PROGRESSION_V1.getState().unlockedZones,shardsRemaining:sandbox.inventory.shard,persistedPhase:persisted.extensions.owners['world.expedition-loop.v1'].phase,route:sandbox.ABYSSAL_EXPEDITION_LOOP_V1.state.history,pondEntered:enteredPond,stagedFeedback:feedback.length,movementFrames,saves,uiUpdates}));
