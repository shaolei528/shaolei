(()=>{
'use strict';

const existing=window.ABYSSAL_LEGACY_SCHEDULER;
if(existing?.started)return;

const STATE={version:1,started:true,intervalId:null,intervalCleared:false,rafStarts:1};
window.ABYSSAL_LEGACY_SCHEDULER=STATE;

STATE.intervalId=setInterval(()=>{
  if(window.ABYSSAL_MOTION_V18?.active){
    clearInterval(STATE.intervalId);
    STATE.intervalId=null;
    STATE.intervalCleared=true;
    return;
  }
  const now=performance.now(),dt=clamp((now-lastTick)/1000,0,.05);
  lastTick=now;
  update(dt);
},33);
requestAnimationFrame(draw);
updateUI();
})();
