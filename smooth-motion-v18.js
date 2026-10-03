(()=>{
'use strict';

/*
  V18 motion pipeline.

  Current authority model is intentionally unchanged: the local client advances
  its own position immediately, then broadcasts that position through the existing
  `move` event. The relay does not provide authoritative movement acknowledgements,
  so this module must not pretend to perform server reconciliation.

  Goals of this layer:
  - one simulation clock (requestAnimationFrame) instead of RAF + legacy 33ms ticks;
  - immediate local/client-predicted movement without waiting for the network;
  - camera locked to the predicted local player to remove camera chase jitter;
  - buffered, time-based interpolation for remote players;
  - no network event/payload/frequency changes.
*/

const existingMotion=window.ABYSSAL_MOTION_V18;
if(existingMotion?.active){
  existingMotion.reentryCount=(Number(existingMotion.reentryCount)||0)+1;
  return;
}

if(typeof update!=='function'||typeof draw!=='function'||typeof onMove!=='function'){
  console.error('[Abyssal V18 motion] update/draw/onMove are not ready');
  return;
}

const baseUpdate=update;
const baseDraw=draw;
const baseOnMove=onMove;
const REMOTE_DELAY_MS=100;
const MAX_BUFFER_AGE_MS=1200;
const MAX_EXTRAPOLATE_MS=80;
const TELEPORT_DISTANCE=320;
const MAX_SNAPSHOTS=24;

const MOTION={
  version:18,
  active:true,
  mode:'client-prediction',
  authority:'client-position',
  reconciliation:'none-server-does-not-ack-movement',
  camera:'predicted-local-player',
  remoteInterpolation:'snapshot-buffer',
  interpolationDelayMs:REMOTE_DELAY_MS,
  frames:0,
  lastDt:0,
  legacyTicksBlocked:0,
  reentryCount:0,
  remoteSnapshots:new Map()
};
window.ABYSSAL_MOTION_V18=MOTION;

let renderUpdating=false;
let lastMotionFrame=performance.now();

function finiteNumber(value,fallback=0){
  const n=Number(value);
  return Number.isFinite(n)?n:fallback;
}

function movePacketAccepted(payload){
  if(typeof validMove==='function')return validMove(payload);
  return !!(payload?.id&&payload.id!==SESSION_ID&&payload.zone===currentZone&&Number.isFinite(Number(payload.x))&&Number.isFinite(Number(payload.y)));
}

function pushRemoteSnapshot(payload){
  if(!movePacketAccepted(payload))return;

  /* baseOnMove owns the canonical movement validation and clamps network
     coordinates to the world bounds. Snapshot interpolation must consume that
     accepted state instead of trusting the raw client payload a second time. */
  const remote=remotes.get(payload.id);
  if(!remote)return;
  const x=finiteNumber(remote.tx,NaN),y=finiteNumber(remote.ty,NaN);
  if(!Number.isFinite(x)||!Number.isFinite(y))return;

  const now=performance.now();
  let buffer=MOTION.remoteSnapshots.get(payload.id);
  if(buffer?.length&&buffer.at(-1)?.zone!==currentZone){
    buffer=[];
    MOTION.remoteSnapshots.set(payload.id,buffer);
  }
  if(!buffer){buffer=[];MOTION.remoteSnapshots.set(payload.id,buffer);}

  const last=buffer.at(-1);
  const seq=Math.max(0,Math.floor(finiteNumber(payload.seq,0)));
  if(last&&seq>0&&seq<finiteNumber(last.seq,0))return;

  buffer.push({
    at:now,
    zone:currentZone,
    x,
    y,
    dir:finiteNumber(remote.dir,last?.dir||0),
    moving:last?Math.hypot(x-last.x,y-last.y)>.35:false,
    seq
  });

  while(buffer.length>MAX_SNAPSHOTS)buffer.shift();
  while(buffer.length>2&&now-buffer[0].at>MAX_BUFFER_AGE_MS)buffer.shift();
}

function sampleRemote(buffer,renderAt){
  if(!buffer?.length)return null;
  if(buffer.length===1)return buffer[0];

  while(buffer.length>2&&buffer[1].at<renderAt-MAX_BUFFER_AGE_MS)buffer.shift();

  if(renderAt<=buffer[0].at)return buffer[0];

  for(let i=1;i<buffer.length;i++){
    const a=buffer[i-1],b=buffer[i];
    if(renderAt<=b.at){
      const span=Math.max(1,b.at-a.at);
      const t=clamp((renderAt-a.at)/span,0,1);
      return {
        x:a.x+(b.x-a.x)*t,
        y:a.y+(b.y-a.y)*t,
        dir:b.dir,
        moving:a.moving||b.moving,
        seq:b.seq
      };
    }
  }

  const b=buffer.at(-1),a=buffer.at(-2);
  const span=Math.max(1,b.at-a.at);
  const extra=clamp(renderAt-b.at,0,MAX_EXTRAPOLATE_MS);
  if(extra<=0)return b;

  const vx=(b.x-a.x)/span,vy=(b.y-a.y)/span;
  return {
    x:b.x+vx*extra,
    y:b.y+vy*extra,
    dir:b.dir,
    moving:b.moving,
    seq:b.seq
  };
}

/* Existing network handlers still own validation, sequence accounting and tx/ty.
   We only observe movement packets after that handler has accepted/canonicalized them. */
onMove=function(payload){
  baseOnMove(payload);
  pushRemoteSnapshot(payload);
};

/* The old 33ms interval did not store its interval id. It resolves the global
   `update` binding each tick, so replacing that binding safely turns the old clock
   into a no-op while the render loop becomes the only simulation clock. */
update=function(dt){
  if(!renderUpdating){
    MOTION.legacyTicksBlocked++;
    return;
  }
  return baseUpdate(dt);
};

draw=function(){
  const now=performance.now();
  const dt=clamp((now-lastMotionFrame)/1000,0,.05);
  lastMotionFrame=now;
  MOTION.lastDt=dt;
  MOTION.frames++;

  /* baseUpdate still contains the legacy remote .19-per-frame lerp. Preserve the
     pre-update visual position and replace that result with snapshot interpolation
     after all gameplay timers/network cadence have advanced once for this frame. */
  const remoteBefore=new Map();
  for(const [id,r] of remotes){
    remoteBefore.set(id,{x:finiteNumber(r.x,0),y:finiteNumber(r.y,0)});
  }

  renderUpdating=true;
  try{
    baseUpdate(dt);
  }finally{
    renderUpdating=false;
  }

  const renderAt=now-REMOTE_DELAY_MS;
  const fallbackAlpha=1-Math.exp(-12*dt);

  for(const [id,r] of remotes){
    const before=remoteBefore.get(id)||{x:finiteNumber(r.x,0),y:finiteNumber(r.y,0)};
    let buffer=MOTION.remoteSnapshots.get(id);
    if(buffer?.length&&buffer.at(-1)?.zone!==currentZone){
      MOTION.remoteSnapshots.delete(id);
      buffer=null;
    }
    const sampled=sampleRemote(buffer,renderAt);

    if(sampled){
      const gap=Math.hypot(sampled.x-before.x,sampled.y-before.y);
      if(gap>TELEPORT_DISTANCE){
        r.x=sampled.x;r.y=sampled.y;
      }else{
        r.x=sampled.x;r.y=sampled.y;
      }
      r.dir=sampled.dir;
      r.moving=!!sampled.moving;
    }else{
      const tx=finiteNumber(r.tx,before.x),ty=finiteNumber(r.ty,before.y);
      const gap=Math.hypot(tx-before.x,ty-before.y);
      if(gap>TELEPORT_DISTANCE){
        r.x=tx;r.y=ty;
      }else{
        r.x=before.x+(tx-before.x)*fallbackAlpha;
        r.y=before.y+(ty-before.y)*fallbackAlpha;
      }
    }
  }

  for(const id of [...MOTION.remoteSnapshots.keys()]){
    if(!remotes.has(id))MOTION.remoteSnapshots.delete(id);
  }

  /* baseUpdate has already applied this frame's joystick input to me.x/me.y.
     Render from that predicted position immediately instead of chasing it. */
  camera.x=me.x;
  camera.y=me.y;

  baseDraw();
};
})();
