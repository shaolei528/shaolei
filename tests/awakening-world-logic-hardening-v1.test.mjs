import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const worldSource=fs.readFileSync(new URL('../modules/world/awakening-world-v1.js',import.meta.url),'utf8');
const spatialSource=fs.readFileSync(new URL('../modules/world/world-spatial-v1.js',import.meta.url),'utf8');
const waterSource=fs.readFileSync(new URL('../modules/world/water-bodies-v1.js',import.meta.url),'utf8');
const waterConfig=JSON.parse(fs.readFileSync(new URL('../data/world/water-bodies-v1.json',import.meta.url),'utf8'));
waterConfig.bodies.push({id:'test-shore-seam',zone:'0:1',anchor:'world',position:{x:1588,y:1810},halfWidth:42,halfHeight:24,collisionPadding:0,surface:'test'});
const interactionSource=fs.readFileSync(new URL('../modules/input/interaction-v12.js',import.meta.url),'utf8');
const platformSource=fs.readFileSync(new URL('../modules/input/platform-inventory-v19.js',import.meta.url),'utf8');
const playerCombat=fs.readFileSync(new URL('../modules/combat/player-combat.js',import.meta.url),'utf8');
const mobCombat=fs.readFileSync(new URL('../modules/combat/mob-combat.js',import.meta.url),'utf8');

function blockFrom(text,startToken,endToken){
  const start=text.indexOf(startToken),end=text.indexOf(endToken,start);
  assert.ok(start>=0,`missing block start: ${startToken}`);
  assert.ok(end>start,`missing block end: ${endToken}`);
  return text.slice(start,end);
}

const sentMoves=[],attackBroadcasts=[],mobHits=[],lootRewards=[],fillCalls=[];
const CAMP={x:2400,y:2400,r:470,inner:330};
const listeners={};
const sandbox={
  console,window:null,globalThis:null,queueMicrotask,performance:{now:()=>1000},
  Image:class FakeImage{set src(value){this._src=value;this.complete=true;this.naturalWidth=320;queueMicrotask(()=>this.onload?.());}get src(){return this._src;}},
  CAMP,WORLD:{zone:1600,w:4800,h:4800},currentZone:'1:0',SESSION_ID:'local',zoneLeader:true,fieldGraceUntil:0,
  camera:{x:2400,y:1500},canvas:{width:360,height:300},
  ctx:{imageSmoothingEnabled:true,fillStyle:'',font:'',textAlign:'',globalAlpha:1,save(){},restore(){},drawImage(){},fillRect(...args){fillCalls.push(args);},fillText(){}},
  started:true,dead:false,hasLeftCamp:true,attackCd:0,dashCd:0,dashQueued:false,attackFlash:0,zoneConnected:true,
  me:{id:'local',name:'Tester',x:2080,y:900,r:14,hp:100,sanity:100,dir:0},
  inventory:{wood:4,stone:3,food:1,shard:0,knife:true,lantern:false},resources:[],mobs:[],remotes:new Map(),questText:{textContent:''},
  ABYSSAL_TERRAIN_V21:{tile:{grass_a:0,grass_b:1,grass_flowers:2,sand_a:3,sand_b:4,road_a:5,road_b:6,water_a:7,water_b:8},sheetPath:'assets/art-v21/terrain-v21.png'},
  ABYSSAL_WATER_BODIES_CONFIG_V1:waterConfig,
  dashBtn:{addEventListener(type,fn){listeners['dash:'+type]=fn;}},attackBtn:{addEventListener(type,fn){listeners['attack:'+type]=fn;}},
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),finite:(v,f=0)=>Number.isFinite(Number(v))?Number(v):f,
  campDist(x,y){return Math.hypot(x-CAMP.x,y-CAMP.y);},inCamp(p=sandbox.me){return sandbox.campDist(p.x,p.y)<CAMP.r;},
  sx(x){return Math.round(x-sandbox.camera.x+sandbox.canvas.width/2);},sy(y){return Math.round(y-sandbox.camera.y+sandbox.canvas.height/2);},
  toast(){},updateUI(){},saveLocal(){},
  onMobHit(payload){mobHits.push(payload);},onLoot(payload){lootRewards.push(payload);},
  seedZone(){sandbox.resources=[];},
  freshMob(zone,index){return{id:`base-${zone}-${index}`,kind:'crawler',x:1800+index*20,y:500,hp:58,phase:index,hitCd:0,respawnAt:0};},
  spawnMobs(){sandbox.mobs=[];},
  drawGround(){},drawCamp(){},drawLighting(){},
  sendMove(){sentMoves.push({x:sandbox.me.x,y:sandbox.me.y});},
  update(){sandbox.me.x=2200;sandbox.me.y=900;sandbox.sendMove();},
  updateQuest(){},
  zoneCh:{send(message){if(message?.event==='attack')attackBroadcasts.push(message);return Promise.resolve('ok');}}
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(spatialSource,sandbox,{filename:'world-spatial-v1.js'});
vm.runInContext(waterSource,sandbox,{filename:'water-bodies-v1.js'});
vm.runInContext(playerCombat,sandbox,{filename:'player-combat.js'});
vm.runInContext(mobCombat,sandbox,{filename:'mob-combat.js'});
vm.runInContext(worldSource,sandbox,{filename:'awakening-world-v1.js'});
await Promise.resolve();

const api=sandbox.ABYSSAL_AWAKENING_WORLD_V1,spatial=sandbox.ABYSSAL_WORLD_SPATIAL_V1;
assert.ok(api&&spatial,'Awakening World and shared World Spatial APIs must load');
const store=api.poi;
assert.deepEqual([...spatial.geometryIds('1:0')].sort(),['water-body:mire-puddle-2','water-body:mire-puddle-3',store.id].sort(),'MIRE MART and its two north-side visible puddles must register distinct 1:0 geometry owners');
assert.ok(spatial.geometryIds('1:1').includes('water-body:mire-puddle-1'),'the south-side puddle must be registered in the adjacent 1:1 zone');
const seamWater=sandbox.ABYSSAL_WATER_BODIES_V1.getBody('test-shore-seam');
assert.equal(seamWater.zone,'0:1','the test water center belongs to the zone left of the seam');
assert.equal(sandbox.ABYSSAL_WATER_BODIES_V1.isBlockedCircle('1:1',1610,1810,8),false,'zone-scoped water queries keep their existing meaning');
assert.equal(sandbox.ABYSSAL_WATER_BODIES_V1.isBlockedWorldCircle(1610,1810,8),true,'world movement sees a water collider whose footprint crosses the zone seam');
assert.equal(worldSource.includes('baseUpdateMobs'),false,'Awakening World must not capture/replace updateMobs');
assert.equal(worldSource.includes('baseHandleMobAttack'),false,'Awakening World must not capture/replace handleMobAttack');
assert.ok(mobCombat.includes('commitMobMovement'),'canonical mob combat must own behavior and call the shared movement hook');
assert.ok(playerCombat.includes('hasMeleeLineOfSight'),'canonical player combat must call the shared melee LOS hook');

// Wrapped player update must still resolve final position, and sendMove must never publish the through-wall transient.
sandbox.me.x=2080;sandbox.me.y=900;sentMoves.length=0;
sandbox.update(.016);
assert.ok(sandbox.me.x<store.x,'wrapped player update must resolve outside west wall');
assert.equal(sentMoves.length,1);assert.ok(sentMoves[0].x<store.x,'sendMove must not publish a through-wall player position');
assert.equal(api.isBlockedCircle(sandbox.me.x,sandbox.me.y,12),false);

// Player radius 14 fits the authored 80px doorway; furniture remains solid.
const doorway=api.resolveMovement(store.entrance.x+store.entrance.w/2,1120,store.entrance.x+store.entrance.w/2,1040,14);
assert.equal(doorway.blocked,false);assert.ok(doorway.y<=1040.001);
for(const [name,fromX,fromY,toX,toY,limit] of [
  ['counter',2120,728,2360,728,2160],['fridge',2540,712,2720,712,2584],['debris',2460,964,2620,964,2504]
]){const r=api.resolveMovement(fromX,fromY,toX,toY,10);assert.equal(r.blocked,true,`${name} traversal must be blocked`);assert.ok(r.x<limit,`${name} traversal must stop before obstacle`);}

// Canonical mob update now uses the shared resolver: wall and shelf tunneling stay blocked.
sandbox.me={id:'local',x:2160,y:900,r:14,hp:100};sandbox.mobs=[{id:'wall-crawler',kind:'crawler',x:2080,y:900,hp:58,phase:0,hitCd:0,respawnAt:0}];
sandbox.updateMobs(1);assert.ok(sandbox.mobs[0].x<store.x,'crawler must not chase through west wall');assert.equal(spatial.isBlockedCircle('1:0',sandbox.mobs[0].x,sandbox.mobs[0].y,10),false);
sandbox.me={id:'local',x:2440,y:816,r:14,hp:100};sandbox.mobs=[{id:'shelf-crawler',kind:'crawler',x:2260,y:816,hp:58,phase:0,hitCd:0,respawnAt:0}];
sandbox.updateMobs(1);assert.ok(sandbox.mobs[0].x<2288,'crawler must not chase through shelf-a');

// Mob -> player LOS blocks wall hits and keeps the doorway clear.
mobHits.length=0;sandbox.me={id:'local',x:2132,y:900,r:14,hp:100};sandbox.mobs=[{id:'los-wall-crawler',kind:'crawler',x:2108,y:900,hp:58,phase:0,hitCd:0,respawnAt:0}];
sandbox.updateMobs(0);assert.equal(mobHits.length,0,'crawler must not damage through a wall');assert.equal(spatial.hasMeleeLineOfSight('1:0',2108,900,2132,900),false);
sandbox.me={id:'local',x:2432,y:1070,r:14,hp:100};sandbox.mobs=[{id:'door-crawler',kind:'crawler',x:2432,y:1098,hp:58,phase:0,hitCd:0,respawnAt:0}];
sandbox.updateMobs(0);assert.equal(mobHits.length,0,'doorway contact must start a warning instead of immediate damage');assert.equal(spatial.hasMeleeLineOfSight('1:0',2432,1098,2432,1070),true);assert.equal(sandbox.mobs[0].phase,-.8,'crawler warning must be synchronized through phase');assert.equal(sandbox.mobs[0].hitCd,.9,'crawler attack interval must remain .9s while the warning counts down');
sandbox.updateMobs(.79);assert.equal(mobHits.length,0,'the attack must remain avoidable during the warning');
sandbox.updateMobs(.01);assert.equal(mobHits.length,1,'a clear doorway attack resolves after its warning');assert.ok(sandbox.mobs[0].hitCd>=0&&sandbox.mobs[0].hitCd<.12,'cooldown must count during the warning rather than slowing attack cadence');

// Player -> mob range/angle semantics remain canonical, with LOS applied only after those checks.
sandbox.mobs=[{id:'blocked-target',kind:'crawler',x:2132,y:900,hp:58,phase:0,hitCd:0,respawnAt:0}];
sandbox.handleMobAttack({id:'local',x:2108,y:900,dir:0,range:80,damage:22});assert.equal(sandbox.mobs[0].hp,58,'player melee must not hit through wall');
sandbox.mobs=[{id:'door-target',kind:'crawler',x:2432,y:1060,hp:58,phase:0,hitCd:0,respawnAt:0}];
sandbox.handleMobAttack({id:'local',x:2432,y:1100,dir:-Math.PI/2,range:80,damage:22});assert.equal(sandbox.mobs[0].hp,36,'doorway melee must preserve 22 knife damage');

// Safe Camp attack suppression remains unchanged.
attackBroadcasts.length=0;sandbox.me={id:'local',name:'Tester',x:CAMP.x,y:CAMP.y,r:14,hp:100,dir:0};sandbox.attackCd=0;sandbox.attack();assert.equal(attackBroadcasts.length,0,'Safe Camp must still suppress player attack broadcast');assert.equal(sandbox.attackCd,0,'Safe Camp must not consume attack cooldown');

// Preserve the wider-region cadence while the first Black Fen approach uses a smaller aggro radius.
for(const token of ["starter?330:(currentZone==='1:0'?180:280)",'starter?base*.88:base','!p.ward','function mobAttackCooldownSeconds(kind)','phase=-mobWindupSeconds(m.kind)','if(m.phase<0)'])assert.ok(mobCombat.includes(token),`mob parity token missing: ${token}`);
for(const token of ['attackCd=inventory.knife?.32:.48','const range=inventory.knife?80:62','damage:(inventory.knife?22:11)+',"kind==='watcher'?2:1",'Date.now()+11000'])assert.ok(playerCombat.includes(token),`player parity token missing: ${token}`);
lootRewards.length=0;sandbox.currentZone='1:1';sandbox.me={id:'local',x:2000,y:2000,r:14,hp:100};sandbox.mobs=[{id:'reward-crawler',kind:'crawler',x:2040,y:2000,hp:10,phase:0,hitCd:0,respawnAt:0}];
sandbox.handleMobAttack({id:'local',x:2000,y:2000,dir:0,range:80,damage:22});assert.equal(sandbox.mobs[0].hp,0);assert.ok(sandbox.mobs[0].respawnAt>Date.now()+10000,'kill must retain ~11s respawn delay');assert.equal(lootRewards.length,1);assert.equal(lootRewards[0].shard,1,'crawler reward must remain one shard');

// Non-Awakening zones have no registered geometry and therefore preserve canonical free movement/LOS.
assert.deepEqual([...spatial.geometryIds('1:1')].sort(),['water-body:camp-pool','water-body:mire-puddle-1'].sort());const free=spatial.resolveMovement('1:1',1700,1900,1757,1900,10);assert.deepEqual({...free},{x:1757,y:1900,blocked:false});assert.equal(spatial.hasMeleeLineOfSight('1:1',1700,1900,1757,1900),true);
sandbox.currentZone='1:2';sandbox.me={id:'local',x:1800,y:3500,r:14,hp:100};sandbox.mobs=[{id:'free-crawler',kind:'crawler',x:1700,y:3500,hp:58,phase:0,hitCd:0,respawnAt:0}];sandbox.updateMobs(1);assert.ok(Math.abs(sandbox.mobs[0].x-1757)<.001,'crawler speed in a non-Awakening zone must remain 57 px/s');
// Starter monsters preserve their slower aggro and ignore warded remote players.
sandbox.currentZone='1:1';sandbox.me={id:'local',x:2100,y:1900,r:14,hp:100};sandbox.remotes=new Map();sandbox.mobs=[{id:'starter-crawler',kind:'crawler',x:1780,y:1900,hp:58,phase:0,hitCd:0,respawnAt:0}];sandbox.updateMobs(1);assert.ok(Math.abs(sandbox.mobs[0].x-1830.16)<.01,'starter crawler keeps its 0.88 movement multiplier within 330px aggro');
sandbox.me={id:'local',x:1000,y:1000,r:14,hp:100};sandbox.remotes=new Map([['warded',{id:'warded',x:1780,y:1900,hp:100,ward:true}]]);sandbox.mobs=[{id:'ward-check',kind:'crawler',x:1700,y:1900,hp:58,phase:0,hitCd:0,respawnAt:0}];sandbox.updateMobs(1);assert.ok(sandbox.mobs[0].x<1710,'monsters must ignore a remote player under the departure ward');

// The first MIRE MART pair must create a readable one-at-a-time approach.
sandbox.currentZone='1:0';sandbox.me={id:'local',x:2600,y:1248,r:14,hp:100};sandbox.remotes=new Map();sandbox.mobs=[];sandbox.spawnMobs('1:0');
const firstTripCrawlers=sandbox.mobs.filter(m=>String(m.id).startsWith('poi:store:crawler-'));
assert.equal(firstTripCrawlers.length,2,'MIRE MART must spawn its authored pair');
sandbox.updateMobs(.5);
const approaching=firstTripCrawlers.filter(m=>Math.hypot(m.x-sandbox.me.x,m.y-sandbox.me.y)<180);
assert.equal(approaching.length,1,'only the nearest first-trip crawler can enter the 180px approach radius');
assert.ok(firstTripCrawlers[1].x<2752-10,'the east crawler should visibly approach when the player crosses to its side');
assert.ok(Math.abs(firstTripCrawlers[0].x-2304)<10,'the west crawler should remain outside the encounter while the east one approaches');

// Terrain rendering keeps viewport culling and nearest-neighbor behavior.
sandbox.currentZone='1:0';sandbox.camera.x=2400;sandbox.camera.y=1500;sandbox.canvas.width=360;sandbox.canvas.height=300;const bounds=api.visibleTileBounds(360,300);assert.ok(bounds.cols*bounds.rows>0&&bounds.cols*bounds.rows<100);fillCalls.length=0;sandbox.drawGround(360,300);assert.equal(fillCalls.some(([, ,w,h])=>w===store.w&&h===store.h),false);assert.equal(sandbox.ctx.imageSmoothingEnabled,false);
sandbox.camera.x=2400;sandbox.camera.y=850;fillCalls.length=0;sandbox.drawGround(360,300);assert.equal(fillCalls.some(([, ,w,h])=>w===store.w&&h===store.h),true);

// POI resource -> interactionTarget -> KeyE -> harvestResource -> inventory remains unchanged.
sandbox.seedZone('1:0');const poiResource=sandbox.resources.find(r=>String(r.id).startsWith('poi:store:')&&r.type==='shard');assert.ok(poiResource);
const triggerInteractSource=blockFrom(platformSource,'function triggerInteract(){','function movementCode(code){');
const keyboardSource=[triggerInteractSource,blockFrom(platformSource,'function movementCode(code){','function onKeyDown(event){'),blockFrom(platformSource,'function onKeyDown(event){','function onKeyUp(event){')].join('\n');
const interactionRuntime=[blockFrom(interactionSource,'function nearestResource(){','function restAtFire(){'),blockFrom(interactionSource,'function interact(){','function replaceInteractionButton(){')].join('\n');
const harvestMessages=[];const keySandbox={console,window:null,API:{panelOpen:false},keys:new Set(),started:true,dead:false,dialogOpen:false,me:{x:poiResource.x,y:poiResource.y},resources:[{...poiResource}],harvested:new Map(),inventory:{wood:0,stone:0,food:0,shard:0},ITEM_ZH:{wood:'木材',stone:'石头',food:'食物',shard:'异质碎片'},currentZone:'1:0',zoneConnected:true,zoneCh:{send(message){harvestMessages.push(message);return Promise.resolve('ok');}},inCamp:()=>false,distance:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),isDesktop:()=>true,isTypingTarget:()=>false,applyKeyboardMovement(){},setPanelOpen(){},triggerDash(){},triggerAttack(){},openGuideDialog(){},restAtFire(){},safeStop(){},hideOtherPanels(){},craftPanel:{classList:{remove(){}}},openChest(){},emitGameplayEvent(){},saveLocal(){},updateUI(){},toast(){}};
keySandbox.window=keySandbox;keySandbox.ABYSSAL_SHELL_V1={blocksGameInput:()=>false};vm.createContext(keySandbox);vm.runInContext(`${interactionRuntime}\nwindow.ABYSSAL_INTERACTION_V12={triggerContextInteraction};\n${keyboardSource}`,keySandbox,{filename:'awakening-poi-keye-integration.js'});const event={code:'KeyE',repeat:false,target:{tagName:'DIV'},prevented:false,preventDefault(){this.prevented=true;}};keySandbox.onKeyDown(event);assert.equal(keySandbox.inventory.shard,1);assert.equal(harvestMessages.length,1);assert.equal(harvestMessages[0].payload.rid,poiResource.id);assert.equal(event.prevented,true);

// Camp water must be a real World collider with an accessible, dry fishing pier.
sandbox.currentZone='1:1';
const water=sandbox.ABYSSAL_WATER_BODIES_V1,pool=water.getBody('camp-pool'),pier=water.getAccessPoint('camp-pool');
assert.equal(pool.collisionPadding,96,'the visible dry bank leaves room for the player sprite before the water');
assert.equal(pier.x-pool.cx,200);assert.equal(pier.y-pool.cy,200,'the fishing interaction point stands well beyond the widened bank');
const bankRadius=Math.max(pool.halfWidth,pool.halfHeight)+pool.collisionPadding;
assert.ok(Math.hypot(Math.max(0,Math.abs(pier.x-pool.cx)-bankRadius),Math.max(0,Math.abs(pier.y-pool.cy)-bankRadius))>=48,'the fishing pier keeps a visible dry gap from the bank');
assert.equal(water.isInWater('1:1',pool.cx,pool.cy),true);assert.equal(api.isBlockedPoint(pool.cx,pool.cy),true,'the rendered pool center is non-walkable');
assert.equal(spatial.isBlockedCircle('1:1',pool.cx+pool.halfWidth+8,pool.cy+pool.halfHeight+8,12),true,'circle collision must catch the diagonal corner of a water collider');
assert.equal(api.isBlockedPoint(pool.cx+pool.halfWidth+pool.collisionPadding-2,pool.cy),true,'the rendered water bank must not be walkable');
assert.equal(water.isInWater('1:1',pool.cx+pool.halfWidth+pool.collisionPadding-2,pool.cy),false,'the extra collision band represents the visible bank, not water');
assert.equal(api.isBlockedCircle(pier.x,pier.y,14),false,'the pier remains a valid standing point outside the water');
const poolCrossing=api.resolveMovement(pier.x,pier.y,pool.cx,pool.cy,14);
assert.equal(poolCrossing.blocked,true,'movement from the fishing pier into the pool is blocked');
assert.equal(water.isInWater('1:1',poolCrossing.x,poolCrossing.y),false,'collision resolution leaves the player on dry ground');
const seamCrossing=api.resolveMovement(1645,1810,1570,1810,8);
assert.equal(seamCrossing.blocked,true,'movement in the adjacent zone must stop at a water body crossing the seam');
assert.ok(seamCrossing.x>seamWater.cx+seamWater.halfWidth,'the player remains outside the seam-crossing shore');

// MIRE puddles are visible liquid, so their render positions and collision footprints share World Water data.
const puddles=water.snapshot().filter(body=>body.surface==='puddle');
assert.equal(puddles.length,3,'all three visible MIRE puddles must be registered as water bodies');
for(const body of puddles){
  sandbox.currentZone=body.zone;
  assert.equal(`${Math.floor(body.cx/1600)}:${Math.floor(body.cy/1600)}`,body.zone,`${body.id} must be registered in the zone containing its visible position`);
  assert.equal(water.isInWater(body.zone,body.cx,body.cy),true,`${body.id} center must be recognized as water`);
  assert.equal(api.isBlockedPoint(body.cx,body.cy),true,`${body.id} center must block walking`);
  const crossing=api.resolveMovement(body.cx-body.halfWidth-30,body.cy,body.cx+body.halfWidth+30,body.cy,14);
  assert.equal(crossing.blocked,true,`${body.id} cannot be crossed with ordinary movement resolution`);
  assert.ok(crossing.x<body.cx-body.halfWidth,`${body.id} stops the player's collision circle before its visible water`);
}
for(const body of puddles){
  sandbox.camera.x=body.cx;sandbox.camera.y=body.cy;fillCalls.length=0;
  sandbox.drawGround(sandbox.canvas.width,sandbox.canvas.height);
  const x=sandbox.sx(body.cx-body.halfWidth),y=sandbox.sy(body.cy-body.halfHeight);
  assert.ok(fillCalls.some(([drawX,drawY,width,height])=>drawX===x+8&&drawY===y&&width===body.halfWidth*2-16&&height===body.halfHeight*2),`${body.id} must be drawn from its World Water bounds`);
}

// Awakening's later movement wrapper must preserve terrain water collision from V21.
const terrain=sandbox.ABYSSAL_TERRAIN_V21;
terrain.isBlockedPoint=(x,y)=>y>=1888&&y<=1912&&x>=1730;
terrain.isBlockedCircle=(x,y,r)=>terrain.isBlockedPoint(x,y)||terrain.isBlockedPoint(x-r,y)||terrain.isBlockedPoint(x+r,y);
terrain.resolveMovement=(fromX,fromY,toX,toY,r)=>{
  const crossing=fromY>=1888&&fromY<=1912&&toY>=1888&&toY<=1912&&fromX<1730&&toX>=1730;
  return crossing?{x:1730-Math.max(1,Number(r)||0),y:toY,blocked:true}:{x:toX,y:toY,blocked:false};
};
const shoreline=api.resolveMovement(1700,1900,1800,1900,10);
assert.equal(shoreline.blocked,true,'the successor wrapper preserves V21 authored water collision');
assert.ok(shoreline.x<1730,'the player cannot cross the authored shoreline');
assert.equal(api.isBlockedPoint(1740,1900),true,'point queries also combine terrain and World colliders');
assert.equal(api.hasLineOfSight(1700,1900,1800,1900),false,'combat line of sight cannot cross the water body');

console.log(JSON.stringify({ok:true,ownership:'core-combat->world-spatial->poi-geometry',removedWrappers:['updateMobs','handleMobAttack'],playerCollision:['wrapped-update','pre-send','doorway-radius','counter','fridge','debris','authored-water','camp-pool','3-zone-matched-MIRE-puddles'],mobCollision:['wall','shelf','shared-resolver'],meleeLOS:['player-to-mob','mob-to-player','doorway-clear','water-blocked'],parity:['safe-camp','speed','aggro','cooldown','respawn','reward','non-awakening-fallback'],culling:{tiles:bounds.cols*bounds.rows,fullRegionTiles:20*26},poiKeyE:'interactionTarget->KeyE->harvestResource->inventory'}));
