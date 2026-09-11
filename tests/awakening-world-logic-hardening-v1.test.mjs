import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const worldSource=fs.readFileSync(new URL('../modules/world/awakening-world-v1.js',import.meta.url),'utf8');
const spatialSource=fs.readFileSync(new URL('../modules/world/world-spatial-v1.js',import.meta.url),'utf8');
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
vm.runInContext(playerCombat,sandbox,{filename:'player-combat.js'});
vm.runInContext(mobCombat,sandbox,{filename:'mob-combat.js'});
vm.runInContext(worldSource,sandbox,{filename:'awakening-world-v1.js'});
await Promise.resolve();

const api=sandbox.ABYSSAL_AWAKENING_WORLD_V1,spatial=sandbox.ABYSSAL_WORLD_SPATIAL_V1;
assert.ok(api&&spatial,'Awakening World and shared World Spatial APIs must load');
const store=api.poi;
assert.deepEqual([...spatial.geometryIds('1:0')],[store.id],'MIRE MART must be the registered 1:0 geometry owner');
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
sandbox.updateMobs(0);assert.equal(mobHits.length,1,'doorway must keep mob melee LOS');assert.equal(spatial.hasMeleeLineOfSight('1:0',2432,1098,2432,1070),true);assert.equal(sandbox.mobs[0].hitCd,.9,'crawler melee cooldown must remain .9s');

// Player -> mob range/angle semantics remain canonical, with LOS applied only after those checks.
sandbox.mobs=[{id:'blocked-target',kind:'crawler',x:2132,y:900,hp:58,phase:0,hitCd:0,respawnAt:0}];
sandbox.handleMobAttack({id:'local',x:2108,y:900,dir:0,range:80,damage:22});assert.equal(sandbox.mobs[0].hp,58,'player melee must not hit through wall');
sandbox.mobs=[{id:'door-target',kind:'crawler',x:2432,y:1060,hp:58,phase:0,hitCd:0,respawnAt:0}];
sandbox.handleMobAttack({id:'local',x:2432,y:1100,dir:-Math.PI/2,range:80,damage:22});assert.equal(sandbox.mobs[0].hp,36,'doorway melee must preserve 22 knife damage');

// Safe Camp attack suppression remains unchanged.
attackBroadcasts.length=0;sandbox.me={id:'local',name:'Tester',x:CAMP.x,y:CAMP.y,r:14,hp:100,dir:0};sandbox.attackCd=0;sandbox.attack();assert.equal(attackBroadcasts.length,0,'Safe Camp must still suppress player attack broadcast');assert.equal(sandbox.attackCd,0,'Safe Camp must not consume attack cooldown');

// Canonical parameter parity: speed, aggro, cooldown, respawn and reward rules are unchanged.
for(const token of ['bd<410',"m.kind==='crawler'?57:(m.kind==='cultist'?39:33)","m.kind==='crawler'?.9:1.15",'Date.now()+11000'])assert.ok(mobCombat.includes(token),`mob parity token missing: ${token}`);
for(const token of ['attackCd=inventory.knife?.32:.48','range:inventory.knife?80:62','damage:inventory.knife?22:11',"kind==='watcher'?2:1",'Date.now()+11000'])assert.ok(playerCombat.includes(token),`player parity token missing: ${token}`);
lootRewards.length=0;sandbox.currentZone='1:1';sandbox.me={id:'local',x:2000,y:2000,r:14,hp:100};sandbox.mobs=[{id:'reward-crawler',kind:'crawler',x:2040,y:2000,hp:10,phase:0,hitCd:0,respawnAt:0}];
sandbox.handleMobAttack({id:'local',x:2000,y:2000,dir:0,range:80,damage:22});assert.equal(sandbox.mobs[0].hp,0);assert.ok(sandbox.mobs[0].respawnAt>Date.now()+10000,'kill must retain ~11s respawn delay');assert.equal(lootRewards.length,1);assert.equal(lootRewards[0].shard,1,'crawler reward must remain one shard');

// Non-Awakening zones have no registered geometry and therefore preserve canonical free movement/LOS.
assert.deepEqual([...spatial.geometryIds('1:1')],[]);const free=spatial.resolveMovement('1:1',1700,1900,1757,1900,10);assert.deepEqual({...free},{x:1757,y:1900,blocked:false});assert.equal(spatial.hasMeleeLineOfSight('1:1',1700,1900,1757,1900),true);
sandbox.currentZone='1:1';sandbox.me={id:'local',x:1800,y:1900,r:14,hp:100};sandbox.mobs=[{id:'free-crawler',kind:'crawler',x:1700,y:1900,hp:58,phase:0,hitCd:0,respawnAt:0}];sandbox.updateMobs(1);assert.ok(Math.abs(sandbox.mobs[0].x-1757)<.001,'crawler speed in a non-Awakening zone must remain 57 px/s');

// Terrain rendering keeps viewport culling and nearest-neighbor behavior.
sandbox.currentZone='1:0';sandbox.camera.x=2400;sandbox.camera.y=1500;sandbox.canvas.width=360;sandbox.canvas.height=300;const bounds=api.visibleTileBounds(360,300);assert.ok(bounds.cols*bounds.rows>0&&bounds.cols*bounds.rows<100);fillCalls.length=0;sandbox.drawGround(360,300);assert.equal(fillCalls.some(([, ,w,h])=>w===store.w&&h===store.h),false);assert.equal(sandbox.ctx.imageSmoothingEnabled,false);
sandbox.camera.x=2400;sandbox.camera.y=850;fillCalls.length=0;sandbox.drawGround(360,300);assert.equal(fillCalls.some(([, ,w,h])=>w===store.w&&h===store.h),true);

// POI resource -> interactionTarget -> KeyE -> harvestResource -> inventory remains unchanged.
sandbox.seedZone('1:0');const poiResource=sandbox.resources.find(r=>String(r.id).startsWith('poi:store:')&&r.type==='shard');assert.ok(poiResource);
const triggerInteractSource=blockFrom(platformSource,'function triggerInteract(){','function movementCode(code){');
const keyboardSource=[triggerInteractSource,blockFrom(platformSource,'function movementCode(code){','function onKeyDown(event){'),blockFrom(platformSource,'function onKeyDown(event){','function onKeyUp(event){')].join('\n');
const interactionRuntime=[blockFrom(interactionSource,'function nearestResource(){','function restAtFire(){'),blockFrom(interactionSource,'function interact(){','function replaceInteractionButton(){')].join('\n');
const harvestMessages=[];const keySandbox={console,window:null,API:{panelOpen:false},keys:new Set(),started:true,dead:false,dialogOpen:false,me:{x:poiResource.x,y:poiResource.y},resources:[{...poiResource}],harvested:new Map(),inventory:{wood:0,stone:0,food:0,shard:0},ITEM_ZH:{wood:'木材',stone:'石头',food:'食物',shard:'异质碎片'},currentZone:'1:0',zoneConnected:true,zoneCh:{send(message){harvestMessages.push(message);return Promise.resolve('ok');}},inCamp:()=>false,distance:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),isDesktop:()=>true,isTypingTarget:()=>false,applyKeyboardMovement(){},setPanelOpen(){},triggerDash(){},triggerAttack(){},openGuideDialog(){},restAtFire(){},safeStop(){},hideOtherPanels(){},craftPanel:{classList:{remove(){}}},openChest(){},saveLocal(){},updateUI(){},toast(){}};
keySandbox.window=keySandbox;keySandbox.ABYSSAL_SHELL_V1={blocksGameInput:()=>false};vm.createContext(keySandbox);vm.runInContext(`${interactionRuntime}\nwindow.ABYSSAL_INTERACTION_V12={triggerContextInteraction};\n${keyboardSource}`,keySandbox,{filename:'awakening-poi-keye-integration.js'});const event={code:'KeyE',repeat:false,target:{tagName:'DIV'},prevented:false,preventDefault(){this.prevented=true;}};keySandbox.onKeyDown(event);assert.equal(keySandbox.inventory.shard,1);assert.equal(harvestMessages.length,1);assert.equal(harvestMessages[0].payload.rid,poiResource.id);assert.equal(event.prevented,true);

console.log(JSON.stringify({ok:true,ownership:'core-combat->world-spatial->poi-geometry',removedWrappers:['updateMobs','handleMobAttack'],playerCollision:['wrapped-update','pre-send','doorway-radius','counter','fridge','debris'],mobCollision:['wall','shelf','shared-resolver'],meleeLOS:['player-to-mob','mob-to-player','doorway-clear'],parity:['safe-camp','speed','aggro','cooldown','respawn','reward','non-awakening-fallback'],culling:{tiles:bounds.cols*bounds.rows,fullRegionTiles:20*26},poiKeyE:'interactionTarget->KeyE->harvestResource->inventory'}));