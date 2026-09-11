import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const worldSource=fs.readFileSync(new URL('../modules/world/awakening-world-v1.js',import.meta.url),'utf8');
const interactionSource=fs.readFileSync(new URL('../modules/input/interaction-v12.js',import.meta.url),'utf8');
const platformSource=fs.readFileSync(new URL('../modules/input/platform-inventory-v19.js',import.meta.url),'utf8');
const playerCombat=fs.readFileSync(new URL('../modules/combat/player-combat.js',import.meta.url),'utf8');

function blockFrom(text,startToken,endToken){
  const start=text.indexOf(startToken),end=text.indexOf(endToken,start);
  assert.ok(start>=0,`missing block start: ${startToken}`);
  assert.ok(end>start,`missing block end: ${endToken}`);
  return text.slice(start,end);
}

const sentMoves=[];
const mobHits=[];
const fillCalls=[];
let baseMobCalls=0,baseAttackCalls=0;
const CAMP={x:2400,y:2400,r:470,inner:330};
const sandbox={
  console,window:null,queueMicrotask,performance:{now:()=>1000},
  Image:class FakeImage{set src(value){this._src=value;this.complete=true;this.naturalWidth=320;queueMicrotask(()=>this.onload?.());}get src(){return this._src;}},
  CAMP,WORLD:{zone:1600,w:4800,h:4800},currentZone:'1:0',SESSION_ID:'local',zoneLeader:true,fieldGraceUntil:0,
  camera:{x:2400,y:1500},canvas:{width:360,height:300},
  ctx:{imageSmoothingEnabled:true,fillStyle:'',font:'',textAlign:'',globalAlpha:1,save(){},restore(){},drawImage(){},fillRect(...args){fillCalls.push(args);},fillText(){}},
  started:true,dead:false,hasLeftCamp:true,me:{id:'local',name:'Tester',x:2080,y:900,r:14,hp:100,sanity:100,dir:0},
  inventory:{wood:4,stone:3,food:1,shard:0,knife:true,lantern:false},resources:[],mobs:[],remotes:new Map(),questText:{textContent:''},
  ABYSSAL_TERRAIN_V21:{tile:{grass_a:0,grass_b:1,grass_flowers:2,sand_a:3,sand_b:4,road_a:5,road_b:6,water_a:7,water_b:8},sheetPath:'assets/art-v21/terrain-v21.png'},
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),finite:(v,f=0)=>Number.isFinite(Number(v))?Number(v):f,
  campDist(x,y){return Math.hypot(x-CAMP.x,y-CAMP.y);},inCamp(p=sandbox.me){return sandbox.campDist(p.x,p.y)<CAMP.r;},
  sx(x){return Math.round(x-sandbox.camera.x+sandbox.canvas.width/2);},sy(y){return Math.round(y-sandbox.camera.y+sandbox.canvas.height/2);},
  toast(){},rewardKill(){},updateUI(){},saveLocal(){},
  applyMobDamage(target,kind){mobHits.push({target,kind});},
  seedZone(){sandbox.resources=[];},
  freshMob(zone,index){return{id:`base-${zone}-${index}`,kind:'crawler',x:1800+index*20,y:500,hp:58,phase:index,hitCd:0,respawnAt:0};},
  spawnMobs(){sandbox.mobs=[];},
  drawGround(){},drawCamp(){},drawLighting(){},
  sendMove(){sentMoves.push({x:sandbox.me.x,y:sandbox.me.y});},
  update(){sandbox.me.x=2200;sandbox.me.y=900;sandbox.sendMove();},
  updateMobs(){baseMobCalls++;},handleMobAttack(){baseAttackCalls++;},updateQuest(){}
};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(worldSource,sandbox,{filename:'awakening-world-v1.js'});
await Promise.resolve();

const api=sandbox.ABYSSAL_AWAKENING_WORLD_V1;
assert.ok(api,'Awakening World API must load');
const store=api.poi;

// Wrapped update must resolve final position, and sendMove inside the wrapped base update must see the resolved position too.
sandbox.me.x=2080;sandbox.me.y=900;sentMoves.length=0;
sandbox.update(.016);
assert.ok(sandbox.me.x<store.x,'wrapped update must resolve the player outside the west wall');
assert.equal(sentMoves.length,1,'base update should still send one movement packet');
assert.ok(sentMoves[0].x<store.x,'sendMove must not publish a through-wall player position');
assert.equal(api.isBlockedCircle(sandbox.me.x,sandbox.me.y,12),false,'resolved player position must finish outside collision');

// A real-radius player must fit through the authored 80px doorway.
const doorway=api.resolveMovement(store.entrance.x+store.entrance.w/2,1120,store.entrance.x+store.entrance.w/2,1040,14);
assert.equal(doorway.blocked,false,'player radius 14 must fit through the store doorway');
assert.ok(doorway.y<=1040.001,'doorway traversal must reach the store interior');

// Interior obstacle traversal must block independently of art.
for(const [name,fromX,fromY,toX,toY,limit] of [
  ['counter',2120,728,2360,728,2160],
  ['fridge',2540,712,2720,712,2584],
  ['debris',2460,964,2620,964,2504]
]){
  const r=api.resolveMovement(fromX,fromY,toX,toY,10);
  assert.equal(r.blocked,true,`${name} traversal must be blocked`);
  assert.ok(r.x<limit,`${name} traversal must stop before the obstacle footprint`);
}

// Mob chasing must reuse the same resolver: no wall or shelf tunneling, no pathfinding required.
sandbox.me={id:'local',x:2160,y:900,r:14,hp:100};
sandbox.mobs=[{id:'wall-crawler',kind:'crawler',x:2080,y:900,hp:58,phase:0,hitCd:0,respawnAt:0}];
sandbox.updateMobs(1);
assert.ok(sandbox.mobs[0].x<store.x,'crawler must not chase through the west store wall');
assert.equal(api.isBlockedCircle(sandbox.mobs[0].x,sandbox.mobs[0].y,10),false,'crawler wall resolution must finish outside collision');

sandbox.me={id:'local',x:2440,y:816,r:14,hp:100};
sandbox.mobs=[{id:'shelf-crawler',kind:'crawler',x:2260,y:816,hp:58,phase:0,hitCd:0,respawnAt:0}];
sandbox.updateMobs(1);
assert.ok(sandbox.mobs[0].x<2288,'crawler must not chase through shelf-a');

// Mob -> player melee is blocked by wall LOS, but remains valid through the doorway opening.
mobHits.length=0;
sandbox.me={id:'local',x:2132,y:900,r:14,hp:100};
sandbox.mobs=[{id:'los-wall-crawler',kind:'crawler',x:2108,y:900,hp:58,phase:0,hitCd:0,respawnAt:0}];
sandbox.updateMobs(0);
assert.equal(mobHits.length,0,'crawler must not damage a player through a wall');
assert.equal(api.hasLineOfSight(2108,900,2132,900),false,'wall segment must fail LOS');

sandbox.me={id:'local',x:2432,y:1070,r:14,hp:100};
sandbox.mobs=[{id:'door-crawler',kind:'crawler',x:2432,y:1098,hp:58,phase:0,hitCd:0,respawnAt:0}];
sandbox.updateMobs(0);
assert.equal(mobHits.length,1,'doorway opening must not falsely block mob melee LOS');
assert.equal(api.hasLineOfSight(2432,1098,2432,1070),true,'doorway segment must retain LOS');

// Player -> mob melee keeps existing damage/range/angle semantics but adds the same obstacle LOS rule.
sandbox.mobs=[{id:'blocked-target',kind:'crawler',x:2132,y:900,hp:58,phase:0,hitCd:0,respawnAt:0}];
sandbox.handleMobAttack({id:'local',x:2108,y:900,dir:0,range:80,damage:22});
assert.equal(sandbox.mobs[0].hp,58,'player melee must not hit a mob through a wall');

sandbox.mobs=[{id:'door-target',kind:'crawler',x:2432,y:1060,hp:58,phase:0,hitCd:0,respawnAt:0}];
sandbox.handleMobAttack({id:'local',x:2432,y:1100,dir:-Math.PI/2,range:80,damage:22});
assert.equal(sandbox.mobs[0].hp,36,'clear doorway melee must preserve existing 22 knife damage');
assert.ok(playerCombat.includes('attackCd=inventory.knife?.32:.48'),'attack cooldown must remain unchanged');
assert.ok(playerCombat.includes('range:inventory.knife?80:62'),'attack range must remain unchanged');
assert.ok(playerCombat.includes('damage:inventory.knife?22:11'),'attack damage must remain unchanged');

// Outside 1:0 the original mob/combat functions remain authoritative.
sandbox.currentZone='1:1';sandbox.updateMobs(.1);sandbox.handleMobAttack({});
assert.equal(baseMobCalls,1,'non-POI zones must keep the original mob update');
assert.equal(baseAttackCalls,1,'non-POI zones must keep the original mob attack handler');
sandbox.currentZone='1:0';

// Terrain rendering must cull to camera-visible rows/columns and skip store-floor work offscreen.
sandbox.camera.x=2400;sandbox.camera.y=1500;sandbox.canvas.width=360;sandbox.canvas.height=300;
const bounds=api.visibleTileBounds(360,300);
assert.ok(bounds.cols*bounds.rows>0&&bounds.cols*bounds.rows<100,'viewport terrain work must be far below the full 20x26 region scan');
fillCalls.length=0;sandbox.drawGround(360,300);
assert.equal(fillCalls.some(([, ,w,h])=>w===store.w&&h===store.h),false,'drawStoreFloor must not run while STORE is outside the viewport');
assert.equal(sandbox.ctx.imageSmoothingEnabled,false,'culled terrain rendering must remain nearest-neighbor');

sandbox.camera.x=2400;sandbox.camera.y=850;fillCalls.length=0;sandbox.drawGround(360,300);
assert.equal(fillCalls.some(([, ,w,h])=>w===store.w&&h===store.h),true,'drawStoreFloor must run when STORE intersects the viewport');

// POI resource -> actual interactionTarget -> KeyE -> harvestResource -> inventory.
sandbox.seedZone('1:0');
const poiResource=sandbox.resources.find(r=>String(r.id).startsWith('poi:store:')&&r.type==='shard');
assert.ok(poiResource,'POI shard resource must be seeded for the integration test');
const triggerInteractSource=blockFrom(platformSource,'function triggerInteract(){','function movementCode(code){');
const keyboardSource=[triggerInteractSource,blockFrom(platformSource,'function movementCode(code){','function onKeyDown(event){'),blockFrom(platformSource,'function onKeyDown(event){','function onKeyUp(event){')].join('\n');
const interactionRuntime=[blockFrom(interactionSource,'function nearestResource(){','function restAtFire(){'),blockFrom(interactionSource,'function interact(){','function replaceInteractionButton(){')].join('\n');
const harvestMessages=[];
const keySandbox={
  console,window:null,API:{panelOpen:false},keys:new Set(),started:true,dead:false,dialogOpen:false,
  me:{x:poiResource.x,y:poiResource.y},resources:[{...poiResource}],harvested:new Map(),inventory:{wood:0,stone:0,food:0,shard:0},
  ITEM_ZH:{wood:'木材',stone:'石头',food:'食物',shard:'异质碎片'},currentZone:'1:0',zoneConnected:true,
  zoneCh:{send(message){harvestMessages.push(message);return Promise.resolve('ok');}},
  inCamp:()=>false,distance:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),isDesktop:()=>true,isTypingTarget:()=>false,
  applyKeyboardMovement(){},setPanelOpen(){},triggerDash(){},triggerAttack(){},openGuideDialog(){},restAtFire(){},safeStop(){},hideOtherPanels(){},craftPanel:{classList:{remove(){}}},openChest(){},
  saveLocal(){},updateUI(){},toast(){}
};
keySandbox.window=keySandbox;keySandbox.ABYSSAL_SHELL_V1={blocksGameInput:()=>false};
vm.createContext(keySandbox);
vm.runInContext(`${interactionRuntime}\nwindow.ABYSSAL_INTERACTION_V12={triggerContextInteraction};\n${keyboardSource}`,keySandbox,{filename:'awakening-poi-keye-integration.js'});
const event={code:'KeyE',repeat:false,target:{tagName:'DIV'},prevented:false,preventDefault(){this.prevented=true;}};
keySandbox.onKeyDown(event);
assert.equal(keySandbox.inventory.shard,1,'KeyE must harvest the actual POI shard through interactionTarget');
assert.equal(harvestMessages.length,1,'POI KeyE harvest must use the existing shared harvest broadcast');
assert.equal(harvestMessages[0].payload.rid,poiResource.id,'harvest broadcast must identify the authored POI resource');
assert.equal(event.prevented,true,'handled POI KeyE must prevent browser default behavior');

console.log(JSON.stringify({ok:true,playerCollision:['wrapped-update','pre-send','doorway-radius','counter','fridge','debris'],mobCollision:['wall','shelf','shared-resolver'],meleeLOS:['player-to-mob','mob-to-player','doorway-clear'],culling:{tiles:bounds.cols*bounds.rows,fullRegionTiles:20*26,storeFloorViewportGate:'pass',nearestNeighbor:'pass'},poiKeyE:'interactionTarget->KeyE->harvestResource->inventory'}));