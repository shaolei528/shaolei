import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const mobSource=fs.readFileSync(new URL('../modules/combat/mob-combat.js',import.meta.url),'utf8');
const simulationSource=fs.readFileSync(new URL('../modules/main-loop/simulation-update.js',import.meta.url),'utf8');
const campPatchSource=fs.readFileSync(new URL('../modules/safe-camp/game-v7-patch.js',import.meta.url),'utf8');
const bootSource=fs.readFileSync(new URL('../survival-v21.html',import.meta.url),'utf8');
const snapshotSource=fs.readFileSync(new URL('../modules/main-loop/simulation-update.js',import.meta.url),'utf8');
const worldSource=fs.readFileSync(new URL('../modules/world/world-state.js',import.meta.url),'utf8');
const inboundSource=fs.readFileSync(new URL('../modules/network/inbound-events.js',import.meta.url),'utf8');
const rendererSource=fs.readFileSync(new URL('../modules/combat/hit-feedback.js',import.meta.url),'utf8');
const baseRendererSource=fs.readFileSync(new URL('../modules/render/base-renderer.js',import.meta.url),'utf8');
const previewRendererSource=fs.readFileSync(new URL('../prototypes/successor-3-4/successor-renderer.js',import.meta.url),'utf8');
const noop=()=>{};
function makeWorld({lineOfSight=true,source=mobSource}={}){
  const hits=[];let los=lineOfSight,now=1000;
  const sandbox={
    console,Date:{now:()=>now},Math,SESSION_ID:'local',currentZone:'0:0',zoneLeader:true,fieldGraceUntil:0,
    CAMP:{x:0,y:0,r:40},WORLD:{zone:1600,w:4800,h:4800},
    me:{id:'local',x:200,y:200,r:14,hp:100},remotes:new Map(),mobs:[],
    zoneCh:{send:noop},campDist(x,y){return Math.hypot(x,y);},
    clamp(v,a,b){return Math.max(a,Math.min(b,v));},
    freshMob(){throw new Error('unexpected respawn');},
    globalThis:null,window:null,
    ABYSSAL_WORLD_SPATIAL_V1:{resolveMovement(zone,x,y,nx,ny){return{x:nx,y:ny};},hasMeleeLineOfSight(){return los;}}
  };
  sandbox.globalThis=sandbox;sandbox.window=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:'mob-combat.js'});
  sandbox.applyMobDamage=(target,kind,mob)=>hits.push({target,kind,mob});
  return{sandbox,hits,setLineOfSight(value){los=value;},advance(ms){now+=ms;}};
}


assert.equal(makeWorld().sandbox.mobWindupSeconds('crawler'),.8);
assert.equal(makeWorld().sandbox.mobWindupSeconds('cultist'),.95);
assert.equal(makeWorld().sandbox.mobWindupSeconds('watcher'),1.1);

const outsideAggroWorld=makeWorld();
outsideAggroWorld.sandbox.mobs=[{id:'distant-crawler',kind:'crawler',x:600,y:200,hp:58,phase:0,hitCd:0,respawnAt:0}];
outsideAggroWorld.sandbox.updateMobs(1);
assert.ok(outsideAggroWorld.sandbox.mobs[0].x>600,'a distant creature wanders instead of joining the active fight');
const insideAggroWorld=makeWorld();
insideAggroWorld.sandbox.mobs=[{id:'near-crawler',kind:'crawler',x:450,y:200,hp:58,phase:0,hitCd:0,respawnAt:0}];
insideAggroWorld.sandbox.updateMobs(1);
assert.ok(insideAggroWorld.sandbox.mobs[0].x<450,'a nearby creature still closes in and can start an encounter');


const hitWorld=makeWorld();
hitWorld.sandbox.mobs=[{id:'crawler',kind:'crawler',x:200,y:200,hp:58,phase:0,hitCd:0,respawnAt:0}];
hitWorld.sandbox.updateMobs(1/60);
assert.equal(hitWorld.hits.length,0,'contact starts a windup but does not damage');
assert.equal(hitWorld.sandbox.mobs[0].phase,-.8,'negative synchronized phase marks the windup');
assert.equal(hitWorld.sandbox.mobs[0].hitCd,.9,'the existing attack cadence starts with the windup');
hitWorld.sandbox.updateMobs(.79);
assert.equal(hitWorld.hits.length,0,'the player has the full windup window to evade');
assert.ok(hitWorld.sandbox.mobs[0].phase<0);
hitWorld.sandbox.updateMobs(.01);
assert.equal(hitWorld.hits.length,1,'damage resolves once when the windup ends');
assert.equal(hitWorld.sandbox.mobs[0].phase,0,'completed windup returns phase to its neutral state');
assert.ok(hitWorld.sandbox.mobs[0].hitCd>0&&hitWorld.sandbox.mobs[0].hitCd<.12,'cooldown elapsed during the windup');

const packWorld=makeWorld();
packWorld.sandbox.mobs=[
  {id:'first-crawler',kind:'crawler',x:200,y:200,hp:58,phase:0,hitCd:0,respawnAt:0},
  {id:'second-crawler',kind:'crawler',x:200,y:200,hp:58,phase:0,hitCd:0,respawnAt:0}
];
packWorld.sandbox.updateMobs(1/60);
assert.equal(packWorld.sandbox.mobs.filter(m=>m.phase<0).length,1,'a group gives the target one readable attack windup at a time');
packWorld.sandbox.updateMobs(.8);
assert.equal(packWorld.hits.length,1,'a surrounded player receives one attack while the second enemy waits for its own turn');
packWorld.sandbox.mobs[0].hitCd=10;
packWorld.advance(349);
packWorld.sandbox.updateMobs(.349);
assert.equal(packWorld.hits.length,1,'the shared recovery window prevents another windup from chaining immediately after a hit');
assert.equal(packWorld.sandbox.mobs.filter(m=>m.phase<0).length,0,'the next enemy waits while the target regains control');
packWorld.advance(1);
packWorld.sandbox.updateMobs(.01);
assert.equal(packWorld.sandbox.mobs[1].phase,-.8,'the waiting enemy can begin a readable windup after recovery');

const rotationWorld=makeWorld();
rotationWorld.sandbox.mobs=[0,1,2].map(index=>({id:`rotation-${index}`,kind:'crawler',x:200,y:200,hp:58,phase:0,hitCd:0,respawnAt:0}));
rotationWorld.sandbox.updateMobs(.01);
assert.equal(rotationWorld.sandbox.mobs[0].phase,-.8,'the first eligible creature begins the encounter');
function simulateFrames(world,seconds){let remaining=seconds;while(remaining>0){const dt=Math.min(1/60,remaining);world.advance(dt*1000);world.sandbox.updateMobs(dt);remaining-=dt;}}
simulateFrames(rotationWorld,.8);
simulateFrames(rotationWorld,.4);
assert.ok(rotationWorld.sandbox.mobs[1].phase<0,'the next eligible creature receives the following turn');
simulateFrames(rotationWorld,.8);
simulateFrames(rotationWorld,.4);
assert.ok(rotationWorld.sandbox.mobs[2].phase<0,`the attack token rotates through the nearby pack instead of favoring array order: ${JSON.stringify(rotationWorld.sandbox.mobs.map(m=>({id:m.id,phase:m.phase,hitCd:m.hitCd})))}, hits=${JSON.stringify(rotationWorld.hits)}`);

const duplicateWindupWorld=makeWorld();
duplicateWindupWorld.sandbox.mobs=[
  {id:'first-windup',kind:'crawler',x:200,y:200,hp:58,phase:-.4,hitCd:.5,respawnAt:0},
  {id:'duplicate-windup',kind:'crawler',x:200,y:200,hp:58,phase:-.4,hitCd:.5,respawnAt:0}
];
duplicateWindupWorld.sandbox.updateMobs(.01);
assert.equal(duplicateWindupWorld.sandbox.mobs.filter(m=>m.phase<0).length,1,'duplicate in-flight windups collapse to one attack cue for the same target');

const evadeWorld=makeWorld();
evadeWorld.sandbox.mobs=[{id:'crawler',kind:'crawler',x:200,y:200,hp:58,phase:0,hitCd:0,respawnAt:0}];
evadeWorld.sandbox.updateMobs(1/60);
evadeWorld.sandbox.me.x=320;
evadeWorld.sandbox.updateMobs(.2);
assert.equal(evadeWorld.hits.length,0,'moving out of range cancels a pending attack');
assert.equal(evadeWorld.sandbox.mobs[0].phase,0,'cancelled windup clears its visual marker');

const blockedWorld=makeWorld();
blockedWorld.sandbox.mobs=[{id:'crawler',kind:'crawler',x:200,y:200,hp:58,phase:0,hitCd:0,respawnAt:0}];
blockedWorld.sandbox.updateMobs(1/60);
blockedWorld.setLineOfSight(false);
blockedWorld.sandbox.updateMobs(.2);
assert.equal(blockedWorld.hits.length,0,'losing line of sight cancels a pending attack');
assert.equal(blockedWorld.sandbox.mobs[0].phase,0);

assert.ok(snapshotSource.includes('phase:m.phase'),'periodic mob snapshots preserve the windup marker');
assert.ok(worldSource.includes('phase:m.phase'),'full world snapshots preserve the windup marker');
assert.ok(inboundSource.includes('phase:finite(m.phase,0)'),'receivers preserve a signed windup phase');
assert.ok(rendererSource.includes('m.phase<0'),'V21 hit-feedback draws a cue only during a confirmed windup');
assert.ok(baseRendererSource.includes('Math.abs(m.phase||0)'),'legacy mob animation remains safe for negative windup phase');
assert.ok(previewRendererSource.includes('window.ABYSSAL_HIT_FEEDBACK?.drawMobWindupCue?.(out,p.x,p.y+4,m.phase)'),'successor preview uses the same presentation cue');
assert.ok(previewRendererSource.indexOf('else drawActor(o.ref,o.self)}')<previewRendererSource.indexOf('for(const m of mobs)if(m.hp>0&&m.phase<0)'),'successor windup markers draw over sorted characters');
assert.ok(rendererSource.includes('window.ABYSSAL_HIT_FEEDBACK=FX;')&&rendererSource.includes('FX.drawMobWindupCue=drawMobWindupCue;'),'hit-feedback must export its shared windup presentation API');
assert.ok(!baseRendererSource.includes('globalThis.ABYSSAL_HIT_FEEDBACK?.drawMobWindupCue?.(ctx,x,y,m.phase)'),'the V21 base renderer must not draw a second copy of the warning cue');
assert.ok(rendererSource.includes('const baseDrawWithWindup=typeof draw===\'function\'?draw:null;')&&rendererSource.indexOf('baseDrawWithWindup.apply')<rendererSource.indexOf('for(const m of mobs)if(m.hp>0&&m.phase<0)drawMobWindupCue(ctx,sx(m.x),sy(m.y)+4,m.phase)'),'V21 warning marker must draw after players so overlapping sprites cannot cover it');
assert.ok(previewRendererSource.includes('window.ABYSSAL_HIT_FEEDBACK?.drawMobWindupCue?.(out,p.x,p.y+4,m.phase)'),'successor renderer must call the exported presentation API');
assert.ok(previewRendererSource.includes('Math.abs(m.phase||0)'),'successor sprite animation remains safe for negative windup phase');

assert.ok(simulationSource.includes('(globalThis.ABYSSAL_MOB_COMBAT_V1?.updateMobs||updateMobs)(dt)'),'the simulation loop must invoke the Combat-owned mob update even if a later compatibility patch wraps the legacy name');
const mobModuleLoad=bootSource.indexOf("'modules/combat/mob-combat.js'"),campPatchLoad=bootSource.indexOf("'modules/safe-camp/game-v7-patch.js'");
assert.ok(mobModuleLoad>=0&&campPatchLoad>mobModuleLoad,'combat authority must register before the later Safe Camp compatibility patch can replace the legacy name');

const startupWorld=makeWorld();
delete startupWorld.sandbox.update;vm.runInContext(snapshotSource,startupWorld.sandbox,{filename:'simulation-update.js'});
startupWorld.sandbox.updateMobs=()=>{throw new Error('legacy Safe Camp override was incorrectly called');};
startupWorld.sandbox.started=true;startupWorld.sandbox.zoneConnected=true;startupWorld.sandbox.zoneLeader=true;startupWorld.sandbox.dashQueued=false;startupWorld.sandbox.dashCd=0;startupWorld.sandbox.attackCd=0;startupWorld.sandbox.attackFlash=0;startupWorld.sandbox.joystickState={x:0,y:0};startupWorld.sandbox.isMoving=false;startupWorld.sandbox.walkClock=0;startupWorld.sandbox.dead=false;
startupWorld.sandbox.attackCd=0;startupWorld.sandbox.dashCd=0;startupWorld.sandbox.attackFlash=0;
startupWorld.sandbox.dead=false;startupWorld.sandbox.joystickState={x:0,y:0};startupWorld.sandbox.remotes=new Map();
startupWorld.sandbox.wasInCamp=true;startupWorld.sandbox.hasLeftCamp=false;startupWorld.sandbox.currentZone='0:0';startupWorld.sandbox.CAMP.r=40;startupWorld.sandbox.me.x=200;startupWorld.sandbox.me.y=200;startupWorld.sandbox.toast=noop;startupWorld.sandbox.switching=false;
startupWorld.sandbox.zoneCh={send:noop};startupWorld.sandbox.mobs=[{id:'startup-crawler',kind:'crawler',x:200,y:200,hp:58,phase:0,hitCd:0,respawnAt:0}];
startupWorld.sandbox.moveTimer=0;startupWorld.sandbox.mobSendTimer=0;startupWorld.sandbox.pingTimer=0;startupWorld.sandbox.saveTimer=0;startupWorld.sandbox.uiTimer=0;startupWorld.sandbox.globalTrackTimer=0;
startupWorld.sandbox.adaptiveInterval=()=>99;startupWorld.sandbox.sendMove=noop;startupWorld.sandbox.applyLocalSurvival=noop;startupWorld.sandbox.updateUI=noop;startupWorld.sandbox.inCamp=()=>false;startupWorld.sandbox.campDist=(x,y)=>Math.hypot(x,y);startupWorld.sandbox.zoneOf=()=>startupWorld.sandbox.currentZone;startupWorld.sandbox.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));startupWorld.sandbox.lerp=(a,b,t)=>a+(b-a)*t;
startupWorld.sandbox.ABYSSAL_MOB_COMBAT_V1.updateMobs(1/60);
assert.ok(startupWorld.sandbox.mobs[0].phase<0,'the Combat-owned warning must remain callable after a legacy-name override');
assert.ok(!/updateMobs\s*=\s*function\s*\(dt\)/.test(campPatchSource),'V21 Safe Camp must not replace Combat authority either');

console.log(JSON.stringify({ok:true,preHitWindup:true,evadeCancels:true,losCancels:true,oneWindupPerTarget:true,targetRecoveryMs:350,packAttackRotation:true,duplicateWindupsCollapse:true,existingSnapshots:true,sharedCue:true,startupOwnerPreserved:true}));
