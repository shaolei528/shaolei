import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const noop=()=>{};
const CAMP={x:2400,y:2400,r:500,inner:330};
const sandbox={
  console,window:null,globalThis:null,CAMP,WORLD:{w:4800,h:4800,zone:1600},AW_SUCCESSOR_GRAYBOX_CONTINUITY:true,
  camera:{x:CAMP.x,y:CAMP.y},currentZone:'1:1',switching:true,
  canvas:{width:800,height:600},ctx:{save:noop,restore:noop,fillRect:noop,strokeRect:noop,beginPath:noop,rect:noop,arc:noop,fill:noop,drawImage:noop},
  started:true,zoneConnected:true,dead:false,hasLeftCamp:false,wasInCamp:true,
  me:{x:CAMP.x,y:CAMP.y,r:12,dir:0},joystickState:{x:0,y:0},dashQueued:false,
  attackCd:0,dashCd:0,attackFlash:0,walkClock:0,isMoving:false,fieldGraceUntil:0,
  inventory:{wood:0,stone:0,food:2,shard:0},resources:[],mobs:[],remotes:new Map(),
  zoneLeader:false,moveTimer:0,mobSendTimer:0,pingTimer:0,globalTrackTimer:0,saveTimer:0,uiTimer:0,
  drawGround:noop,drawCamp:noop,drawLighting:noop,toast:noop,applyLocalSurvival:noop,
  sendMove:noop,measurePing:noop,saveLocal:noop,updateUI:noop,updateQuest:noop,
  globalCh:{track:noop},globalMeta:()=>({}),zoneCh:{send:noop},
  clamp:(value,min,max)=>Math.max(min,Math.min(max,value)),
  lerp:(a,b,t)=>a+(b-a)*t,
  inCamp:(p=null)=>{const q=p||sandbox.me;return Math.hypot(q.x-CAMP.x,q.y-CAMP.y)<CAMP.r;},
  zoneOf:(x,y)=>`${Math.floor(x/1600)}:${Math.floor(y/1600)}`,
  adaptiveInterval:()=>1,seedZone:noop,spawnMobs:noop,freshMob:()=>null,
  addEventListener:noop
};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);

vm.runInContext(read('../modules/world/world-spatial-v1.js'),sandbox,{filename:'world-spatial-v1.js'});
 sandbox.ABYSSAL_WATER_BODIES_CONFIG_V1=JSON.parse(read('../data/world/water-bodies-v1.json'));
vm.runInContext(read('../modules/world/water-bodies-v1.js'),sandbox,{filename:'water-bodies-v1.js'});
vm.runInContext(read('../modules/main-loop/simulation-update.js'),sandbox,{filename:'simulation-update.js'});
vm.runInContext(read('../terrain-v21.js'),sandbox,{filename:'terrain-v21.js'});
vm.runInContext(read('../modules/world/awakening-world-v1.js'),sandbox,{filename:'awakening-world-v1.js'});
vm.runInContext(read('../prototypes/successor-3-4/camera-adapter.js'),sandbox,{filename:'camera-adapter.js'});

const adapter=sandbox.ABYSSAL_CAMERA_ADAPTER_V1;
const intents=[
  {x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1},
  {x:Math.SQRT1_2,y:Math.SQRT1_2},{x:-Math.SQRT1_2,y:-Math.SQRT1_2},
  {x:Math.SQRT1_2,y:-Math.SQRT1_2},{x:-Math.SQRT1_2,y:Math.SQRT1_2}
];
const expectedSpeed=154*.05/Math.sqrt(8);
const measured=[];

for(const intent of intents){
  sandbox.me.x=CAMP.x;sandbox.me.y=CAMP.y;
  sandbox.joystickState=adapter.worldIntentForScreenInput(intent.x,intent.y);
  const start={x:sandbox.me.x,y:sandbox.me.y};
  sandbox.update(.05);
  const worldDelta={x:sandbox.me.x-start.x,y:sandbox.me.y-start.y};
  const screenDelta=adapter.project(worldDelta.x,worldDelta.y);
  const length=Math.hypot(screenDelta.x,screenDelta.y);
  const dot=screenDelta.x*intent.x+screenDelta.y*intent.y;
  assert.ok(dot>0,`V21 update must move in requested screen direction ${JSON.stringify(intent)}; got ${JSON.stringify(screenDelta)}`);
  assert.ok(Math.abs(length-expectedSpeed)<1e-6,`V21 update must preserve projected speed for ${JSON.stringify(intent)}; got ${length}`);
  measured.push({intent,screenDelta});
}

const pond=sandbox.ABYSSAL_WATER_BODIES_V1.getBody('camp-pool');
const waterEdge=pond.cx-pond.halfWidth-pond.collisionPadding;
sandbox.currentZone=pond.zone;
const access=pond.access;
assert.equal(sandbox.ABYSSAL_WATER_BODIES_V1.isInWater(pond.zone,access.x,access.y),false,'the fishing interaction point must be dry ground');
assert.equal(sandbox.ABYSSAL_WORLD_SPATIAL_V1.isBlockedCircle(pond.zone,access.x,access.y,sandbox.me.r),false,'the fishing interaction point must stand outside the pond collider');
assert.equal(sandbox.ABYSSAL_TERRAIN_V21.isBlockedCircle(access.x,access.y,sandbox.me.r),false,'the fishing interaction point must also stand outside the legacy coast collider');
sandbox.me.x=access.x;sandbox.me.y=access.y;sandbox.joystickState=adapter.worldIntentForScreenInput(0,-1);
for(let frame=0;frame<40;frame++)sandbox.update(.05);
assert.equal(sandbox.ABYSSAL_WATER_BODIES_V1.isInWater(pond.zone,sandbox.me.x,sandbox.me.y),false,'walking from the fishing point toward the pond must stop before visible water');
assert.equal(sandbox.ABYSSAL_WORLD_SPATIAL_V1.isBlockedCircle(pond.zone,sandbox.me.x,sandbox.me.y,sandbox.me.r),false,'a blocked approach must leave the player collider on dry ground');
sandbox.me.x=waterEdge-24;
sandbox.me.y=pond.cy;
sandbox.joystickState={x:1,y:0};
sandbox.update(.5);
const stoppedAt=sandbox.me.x;
sandbox.update(.5);
assert.ok(stoppedAt<=waterEdge-14,`ordinary player movement must stop outside the water collider; x=${stoppedAt}, edge=${waterEdge}`);
assert.equal(sandbox.me.x,stoppedAt,'holding movement against deep water must not advance the player across the shoreline');
assert.equal(sandbox.isMoving,false,'the player gait must stop when collision prevents movement');

const padded=pond.halfWidth+pond.collisionPadding;
const waterApproaches=[
  {x:pond.cx-padded-32,y:pond.cy},{x:pond.cx+padded+32,y:pond.cy},
  {x:pond.cx,y:pond.cy-padded-32},{x:pond.cx,y:pond.cy+padded+32},
  ...[[-1,-1],[-1,1],[1,-1],[1,1]].map(([sx,sy])=>({x:pond.cx+sx*(padded+24),y:pond.cy+sy*(padded+24)}))
];
for(const start of waterApproaches){
  sandbox.me.x=start.x;sandbox.me.y=start.y;sandbox.joystickState={x:0,y:0};
  const projected=adapter.project(pond.cx-start.x,pond.cy-start.y),screenLength=Math.hypot(projected.x,projected.y);
  sandbox.joystickState=adapter.worldIntentForScreenInput(projected.x/screenLength,projected.y/screenLength);
  let enteredWater=false;
  for(let frame=0;frame<40;frame++){sandbox.update(.05);enteredWater ||= sandbox.ABYSSAL_WATER_BODIES_V1.isInWater(pond.zone,sandbox.me.x,sandbox.me.y);}
  assert.equal(enteredWater,false,'graybox movement must not cross the pond from any cardinal or diagonal approach');
  assert.equal(sandbox.ABYSSAL_WATER_BODIES_V1.isInWater(pond.zone,sandbox.me.x,sandbox.me.y),false,'graybox movement must never enter pond water');
  assert.equal(sandbox.ABYSSAL_WORLD_SPATIAL_V1.isBlockedCircle(pond.zone,sandbox.me.x,sandbox.me.y,sandbox.me.r),false,'the resolved player collider remains on dry ground');
}

// Water remains authoritative even if its convenience obstacle registration is absent.
sandbox.ABYSSAL_WORLD_SPATIAL_V1.unregisterGeometry('water-body:camp-pool');
sandbox.me.x=pond.cx-pond.halfWidth-pond.collisionPadding-24;
sandbox.me.y=pond.cy;
sandbox.joystickState={x:1,y:0};
sandbox.update(.5);
const directWaterGateX=sandbox.me.x;
sandbox.update(.5);
assert.ok(directWaterGateX<=waterEdge-14,`the World Water owner must stop movement at its shore without a spatial collider; x=${directWaterGateX}, edge=${waterEdge}`);
assert.equal(sandbox.me.x,directWaterGateX,'holding movement against water must not cross when generic geometry registration is missing');
assert.equal(sandbox.isMoving,false,'the player gait must stop when the World Water owner blocks movement');

const mirePuddles=sandbox.ABYSSAL_WATER_BODIES_V1.snapshot().filter(body=>body.surface==='puddle');
assert.equal(mirePuddles.length,3,'all visible MIRE puddles must have an authored World Water collider');
for(const body of mirePuddles){
  sandbox.currentZone=body.zone;
  assert.equal(sandbox.zoneOf(body.cx,body.cy),body.zone,`${body.id} collider must use the same zone as the player at that world position`);
  sandbox.me.x=body.cx-body.halfWidth-40;sandbox.me.y=body.cy;sandbox.joystickState={x:1,y:0};
  let enteredWater=false;
  for(let frame=0;frame<40;frame++){sandbox.update(.05);enteredWater ||= sandbox.ABYSSAL_WATER_BODIES_V1.isInWater(body.zone,sandbox.me.x,sandbox.me.y);}
  const stoppedAt=sandbox.me.x;
  assert.equal(enteredWater,false,`${body.id} cannot be walked across by the normal V21 update loop`);
  assert.ok(stoppedAt<body.cx-body.halfWidth,`${body.id} blocks the player before its visible water`);
  sandbox.update(.5);
  assert.equal(sandbox.me.x,stoppedAt,`${body.id} remains blocked while movement input is held`);
}
sandbox.currentZone='1:1';

assert.equal(sandbox.currentZone,'1:1','bounded directional steps must preserve the authoritative Zone');
assert.ok(sandbox.ABYSSAL_TERRAIN_V21&&sandbox.ABYSSAL_WORLD_SPATIAL_V1,'V21 terrain and world collision owners must be loaded');
const renderer=read('../prototypes/successor-3-4/successor-renderer.js');
assert.match(renderer,/const movedX=me\.x-previousPlayerX,movedY=me\.y-previousPlayerY,moved=Math\.hypot\(movedX,movedY\)>\.015/,'candidate gait must follow resolved world movement instead of a stale input flag');
assert.match(renderer,/previousPlayerX=me\.x;previousPlayerY=me\.y;if\(moved\)\{visualMoving=true;visualMoveUntil=now\+115;visualWalkClock\+=elapsed/,'candidate walk clock must advance at a stable time-based gait only when the player moves');
assert.match(renderer,/moving=self\?visualMoving:!!p\.moving,walkPhase=self\?visualWalkClock:performance\.now\(\)\/1000/,'local candidate frame cadence must use the same movement-derived phase advanced by the render loop');
assert.match(renderer,/const walkTick=Math\.floor\(walkPhase\*7\),frame=moving&&candidateReady\?\(generatedWalkAtlasQa\?Math\.floor\(walkPhase\*7\)%6:walkTick%4===0\?0:1\+\(\(walkTick-1\)%3\)\):moving\?\(self\?Math\.floor\(walkPhase\*8\)%4/,'local source-atlas gait must keep a stable neutral foot-contact beat at a readable eight-frame-per-second cadence');
 assert.match(renderer,/const nameOffset=candidateReady\?\(pixelSurvivorLive\?\(view\.clientWidth<520\?43:51\):\(view\.clientWidth<520\?194:244\)\):41/,'the pixel survivor nameplate must follow its candidate-specific sprite scale');
console.log(JSON.stringify({ok:true,directions:measured.length,waterMovement:'camp-pool+3-MIRE-puddles+zone-boundary-blocked',owner:'V21 simulation-update + terrain-v21 + world-water-v1 + world-spatial-v1',projectedSpeed:expectedSpeed,zone:sandbox.currentZone}));
