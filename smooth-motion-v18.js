(()=>{
'use strict';

/*
  V18 motion pipeline.
  The original game already applies local input before sending network state,
  so local movement is client-predicted. The visible jitter came from running
  simulation on a 33ms timer while rendering/camera ran on requestAnimationFrame.
  This layer makes the display frame the only simulation clock, pins the camera
  to the predicted local player, and makes remote interpolation frame-rate independent.
*/

if(typeof update!=='function'||typeof draw!=='function'){
  console.error('[Abyssal V18 motion] update/draw are not ready');
  return;
}

const baseUpdate=update;
const baseDraw=draw;
const MOTION={
  version:18,
  active:true,
  mode:'client-prediction',
  camera:'local-player',
  remoteInterpolation:'time-based',
  frames:0,
  lastDt:0,
  legacyTicksBlocked:0
};
window.ABYSSAL_MOTION_V18=MOTION;

let renderUpdating=false;
let lastMotionFrame=performance.now();

/* The legacy 33ms timer calls the global update binding. Keep the timer harmless
   instead of trying to cancel an interval whose id was never stored. */
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

  /* Save remote positions because the legacy update uses a fixed-per-frame lerp.
     We restore them below with a dt-based interpolation so 60/120Hz behave alike. */
  const remoteBefore=new Map();
  for(const [id,r] of remotes){
    remoteBefore.set(id,{x:finite(r.x,0),y:finite(r.y,0)});
  }

  renderUpdating=true;
  try{
    baseUpdate(dt);
  }finally{
    renderUpdating=false;
  }

  const alpha=1-Math.exp(-12*dt);
  for(const [id,r] of remotes){
    const before=remoteBefore.get(id);
    if(!before)continue;
    const tx=finite(r.tx,before.x),ty=finite(r.ty,before.y);
    const gap=Math.hypot(tx-before.x,ty-before.y);
    if(gap>320){
      r.x=tx;r.y=ty;
    }else{
      r.x=before.x+(tx-before.x)*alpha;
      r.y=before.y+(ty-before.y)*alpha;
    }
  }

  /* Local player is predicted immediately from input in baseUpdate(). Keeping the
     camera on that predicted position prevents camera-lag from moving the avatar/name
     backwards between simulation ticks. sx()/sy() still pixel-snap the final draw. */
  camera.x=me.x;
  camera.y=me.y;

  baseDraw();
};
})();