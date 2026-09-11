(()=>{
'use strict';

if(window.ABYSSAL_JOYSTICK_V1?.bound)return;

const API={version:1,bound:true,active:false,pointerId:null};
window.ABYSSAL_JOYSTICK_V1=API;
let joyActive=false,joyPid=null;

function syncState(){API.active=joyActive;API.pointerId=joyPid;}
function moveJoy(e){
  const r=joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.31;
  let dx=e.clientX-cx,dy=e.clientY-cy,l=Math.hypot(dx,dy)||1;
  if(l>max){dx=dx/l*max;dy=dy/l*max;}
  joystickState.x=dx/max;joystickState.y=dy/max;
  stick.style.transform=`translate(${dx}px,${dy}px)`;
}
function onPointerDown(e){
  if(joyActive&&e.pointerId!==joyPid)return;
  joyActive=true;joyPid=e.pointerId;syncState();
  try{joystick.setPointerCapture(e.pointerId);}catch{}
  moveJoy(e);
}
function onPointerMove(e){if(joyActive&&e.pointerId===joyPid)moveJoy(e);}
function stopJoy(event){
  const pointerId=event?.pointerId;
  if(joyActive&&pointerId!=null&&pointerId!==joyPid)return false;
  const owned=joyPid;
  joyActive=false;joyPid=null;syncState();
  joystickState.x=0;joystickState.y=0;stick.style.transform='translate(0,0)';
  if(owned!=null){try{if(joystick.hasPointerCapture?.(owned))joystick.releasePointerCapture?.(owned);}catch{}}
  return true;
}

joystick.addEventListener('pointerdown',onPointerDown);
joystick.addEventListener('pointermove',onPointerMove);
joystick.addEventListener('pointerup',stopJoy);
joystick.addEventListener('pointercancel',stopJoy);
window.stopJoy=stopJoy;
Object.assign(API,{stop:stopJoy});
})();
