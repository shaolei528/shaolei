import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const rendererSource=read('../prototypes/successor-3-4/successor-renderer.js');
const qaHarnessSource=read('../prototypes/successor-3-4/qa-harness.js');
const gameplaySource=read('../modules/survival/gameplay-v9.js');
assert.match(qaHarnessSource,/function advance\(dt, state = \{\}\) \{\s*if \(!state\.active\) \{ stop\('inactive'\)/,'QA input must cancel if V21 becomes dead or the preview stops');
assert.match(qaHarnessSource,/STEP W.*STEP E.*STEP N.*STEP S/s,'separate local-preview harness must provide bounded one-step movement in four screen directions');
assert.ok(qaHarnessSource.includes('Math.min(1.25, Number(duration) || .05)')&&qaHarnessSource.includes('Number(duration) || .05')&&/qaHarness\?\.advance\?\.\(dt,\{[^}]*active:started&&zoneConnected&&!dead[^}]*\}\)/.test(rendererSource),'QA presentation steps must be bounded and stop when the real preview is inactive');
class FakeImage{set src(value){this._src=value;this.complete=true;this.naturalWidth=320;queueMicrotask(()=>this.onload?.());}get src(){return this._src;}}
const noop=()=>{};
const CAMP={x:2400,y:2400,r:500,inner:330};
const sandbox={
  console,window:null,Image:FakeImage,queueMicrotask,performance:{now:()=>0},
  camera:{x:CAMP.x,y:CAMP.y},currentZone:'1:1',ctx:{save:noop,restore:noop,fillRect:noop,strokeRect:noop,beginPath:noop,rect:noop,arc:noop,fill:noop,drawImage:noop},canvas:{width:800,height:600},
  CAMP,me:{x:2400,y:2470,r:14},inventory:{wood:0,stone:0,food:2,shard:0,knife:false,lantern:false},resources:[],mobs:[],remotes:new Map(),
  questText:{textContent:''},started:true,dead:false,hasLeftCamp:false,
  drawGround:noop,drawCamp:noop,drawLighting:noop,update:noop,sendMove:noop,toast:noop,updateUI:noop,
  seedZone(){},freshMob(){return{id:'test-mob',x:100,y:100,hp:10}},spawnMobs:noop,
};
sandbox.window=sandbox;
sandbox.sx=x=>x-sandbox.camera.x+sandbox.canvas.width/2;
sandbox.sy=y=>y-sandbox.camera.y+sandbox.canvas.height/2;
sandbox.inCamp=(p=sandbox.me)=>Math.hypot(p.x-CAMP.x,p.y-CAMP.y)<CAMP.r;
sandbox.updateQuest=noop;
vm.createContext(sandbox);
vm.runInContext(read('../terrain-v21.js'),sandbox,{filename:'terrain-v21.js'});
vm.runInContext(read('../modules/world/world-spatial-v1.js'),sandbox,{filename:'world-spatial-v1.js'});
vm.runInContext(read('../modules/world/awakening-world-v1.js'),sandbox,{filename:'awakening-world-v1.js'});
vm.runInContext(read('../prototypes/successor-3-4/camera-adapter.js'),sandbox,{filename:'camera-adapter.js'});
await Promise.resolve();

const terrain=sandbox.ABYSSAL_TERRAIN_V21,spatial=sandbox.ABYSSAL_WORLD_SPATIAL_V1,world=sandbox.ABYSSAL_AWAKENING_WORLD_V1,adapter=sandbox.ABYSSAL_CAMERA_ADAPTER_V1;
let x=2400,y=2470,zone='1:1',enteredOutside=false,collision=false;
function travelWorldDirection(wx,wy,seconds){const screen=adapter.project(wx,wy),intent=adapter.worldIntentForScreenInput(screen.x,screen.y);let remaining=seconds;while(remaining>0){const dt=Math.min(.05,remaining),camp=Math.hypot(x-CAMP.x,y-CAMP.y)<CAMP.r,speed=camp?154:146,length=Math.hypot(intent.x,intent.y),normalizer=length>1?1/length:1,nextX=x+intent.x*normalizer*speed*dt,nextY=y+intent.y*normalizer*speed*dt,terrainResolved=terrain.resolveMovement(x,y,nextX,nextY,12),worldResolved=spatial.resolveMovement(zone,x,y,terrainResolved.x,terrainResolved.y,10);collision ||= terrainResolved.blocked||worldResolved.blocked;x=worldResolved.x;y=worldResolved.y;const nextZone=`${Math.max(0,Math.min(2,Math.floor(x/1600)))}:${Math.max(0,Math.min(2,Math.floor(y/1600)))}`;if(nextZone!==zone){zone=nextZone;enteredOutside ||= zone==='1:0';}remaining-=dt;}}
travelWorldDirection(0,-1,20);
assert.equal(enteredOutside,true,'canonical northward movement must trigger a natural HOME 1:1 to OUTSIDE 1:0 zone transition');
assert.equal(zone,'1:0','player must finish the bounded route in V21 Zone 1:0');
travelWorldDirection(0,-1,10);
assert.ok(y>world.poi.y+world.poi.h-180&&y<world.poi.y+world.poi.h+24,`north road approach should reach the shop south wall; y=${y.toFixed(1)}`);
travelWorldDirection(1,0,.8);
travelWorldDirection(0,-1,5);
travelWorldDirection(1,0,.2);
assert.equal(zone,'1:0','the player must remain in the real POI Zone while steering around the interior shelf');
const loot=world.layers.interactions.find(item=>Math.hypot(x-item.x,y-item.y)<70);
assert.ok(loot,`natural input route should reach an existing V21 interaction node; player=(${x.toFixed(1)},${y.toFixed(1)})`);
assert.equal(collision,true,'the integrated route must exercise authored POI collision at the shop doorway or shelves');
console.log(JSON.stringify({ok:true,zone,x:Math.round(x),y:Math.round(y),enteredOutside,collision,reachableNode:loot.id,terrainCollision:'V21',poiCollision:'World Spatial V1'}));
