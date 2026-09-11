(()=>{
'use strict';

const existingRuntime=window.ABYSSAL_WEAPON_PRESENTATION_RUNTIME_V1;
if(existingRuntime?.bound&&window.ABYSSAL_WEAPON_PRESENTATION_V1){
  existingRuntime.reentryCount=(Number(existingRuntime.reentryCount)||0)+1;
  return;
}

const ATTACK_DURATION=.15;
const REMOTE_WEAPON=new Map();
const clamp01=value=>Math.max(0,Math.min(1,Number(value)||0));
const mix=(a,b,t)=>a+(b-a)*t;
const easeOutCubic=value=>{const x=1-clamp01(value);return 1-x*x*x;};
const easeInOutQuad=value=>{const x=clamp01(value);return x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;};
const BONE={dark:'#6f624a',mid:'#b8a77d',base:'#d8c89d',light:'#f0e0b6'};
const WRAP={dark:'#2f2923',mid:'#4b372c',light:'#7a5d42'};

function classifyAttackWeapon(payload){
  const range=Number(payload?.range)||0;
  const damage=Number(payload?.damage)||0;
  return range>=72||damage>=18?'knife':'unarmed';
}
function attackProgress(flash,duration=ATTACK_DURATION){
  const remain=Math.max(0,Number(flash)||0);
  if(remain<=0)return 1;
  return clamp01(1-remain/Math.max(.001,Number(duration)||ATTACK_DURATION));
}
function swingOffset(progress){
  const t=clamp01(progress);
  if(t<.24)return mix(-.28,-1.18,easeInOutQuad(t/.24));
  if(t<.64)return mix(-1.18,1.15,easeOutCubic((t-.24)/.40));
  return mix(1.15,.30,easeOutCubic((t-.64)/.36));
}
function swingEmphasis(progress){
  const t=clamp01(progress),distance=Math.abs(t-.5);
  return clamp01(1-distance/.34);
}
function swingAngle(dir,flash){
  return (Number(dir)||0)+swingOffset(attackProgress(flash));
}
function remoteWeapon(id){return REMOTE_WEAPON.get(String(id||''))||'unknown';}
function hasKnife(p,self){return self?!!inventory.knife:remoteWeapon(p?.id)==='knife';}
function isSafeCamp(p){
  try{return typeof inCamp==='function'&&!!inCamp(p);}catch{return false;}
}
function loweredAngle(dir){
  const x=Math.cos(Number(dir)||0),y=Math.sin(Number(dir)||0);
  const lean=Math.abs(x)>.45?Math.sign(x)*.42:(y>=0?.16:-.16);
  return Math.atan2(1,lean);
}
function poseFor(p,self){
  const dir=Number(p?.dir)||0;
  const flash=Math.max(0,Number(self?attackFlash:p?.attack)||0);
  const safe=isSafeCamp(p);
  const attacking=flash>0&&!safe;
  const progress=attacking?attackProgress(flash):1;
  const emphasis=attacking?swingEmphasis(progress):0;
  const fx=Math.cos(dir),fy=Math.sin(dir),sideX=-fy,sideY=fx;
  const side=attacking?0:(safe?3:4);
  const forward=attacking?5+Math.round(3*emphasis):(safe?1:3);
  return{
    safe,
    attacking,
    combatReady:!safe,
    dir,
    progress,
    emphasis,
    angle:attacking?swingAngle(dir,flash):(safe?loweredAngle(dir):dir+.38),
    x:Math.round(sx(p.x)+fx*forward+sideX*side),
    y:Math.round(sy(p.y)+(safe?-1:-4)+fy*(forward-1)+sideY*side)
  };
}
function drawPixelBoneKnife(pose,alpha=1){
  const angle=pose.angle,vx=Math.cos(angle),vy=Math.sin(angle),px=-vy,py=vx;
  const plot=(forward,side,size,color)=>{
    const x=Math.round(pose.x+vx*forward+px*side);
    const y=Math.round(pose.y+vy*forward+py*side);
    const s=Math.max(1,Math.round(size));
    ctx.fillStyle=color;
    ctx.fillRect(x-Math.floor(s/2),y-Math.floor(s/2),s,s);
  };
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.globalAlpha=Math.max(.25,Math.min(1,alpha));

  for(const d of [-8,-6,-4])plot(d,0,4,WRAP.dark);
  plot(-7,0,2,WRAP.light);plot(-5,0,2,WRAP.mid);plot(-3,0,2,WRAP.light);
  plot(-1,-3,3,WRAP.mid);plot(-1,3,3,WRAP.mid);

  plot(0,0,4,BONE.dark);
  plot(2,0,5,BONE.dark);plot(2,0,3,BONE.mid);
  plot(4,-1,4,BONE.mid);plot(4,-1,2,BONE.base);
  plot(6,0,4,BONE.mid);plot(6,0,2,BONE.base);
  plot(8,0,4,BONE.mid);plot(8,0,2,BONE.base);
  plot(10,1,3,BONE.mid);plot(10,1,2,BONE.base);
  plot(12,0,3,BONE.base);plot(12,0,1,BONE.light);
  plot(14,0,2,BONE.base);plot(15,0,1,BONE.light);
  plot(5,-2,1,BONE.light);plot(7,1,1,BONE.dark);plot(9,-1,1,BONE.light);plot(11,2,1,BONE.dark);
  if(pose.attacking&&pose.emphasis>.3){
    const glint=Math.max(1,Math.round(2*pose.emphasis));
    plot(13,-1,glint,BONE.light);
  }
  ctx.restore();
}

const baseOnAttack=onAttack;
onAttack=function(payload){
  if(payload?.id&&payload.id!==SESSION_ID){
    REMOTE_WEAPON.set(String(payload.id),classifyAttackWeapon(payload));
  }
  return baseOnAttack(payload);
};

const baseDrawPlayer=drawPlayer;
drawPlayer=function(p,self){
  const safe=isSafeCamp(p);
  const knife=hasKnife(p,self);
  const pose=knife?poseFor(p,self):null;
  const away=knife&&!pose.attacking&&(pose.safe||directionRow(Number(p?.dir)||0)===3);
  if(away)drawPixelBoneKnife(pose,pose.safe?.76:.88);

  let restoreFlash=null,renderPlayer=p;
  if(safe){
    if(self){restoreFlash=attackFlash;attackFlash=0;}
    else if(Number(p?.attack)>0)renderPlayer={...p,attack:0};
  }
  try{baseDrawPlayer(renderPlayer,self);}finally{
    if(self&&restoreFlash!==null)attackFlash=restoreFlash;
  }

  if(knife&&!away){
    const alpha=pose.attacking?.84+.16*pose.emphasis:.9;
    drawPixelBoneKnife(pose,alpha);
  }
};

window.ABYSSAL_WEAPON_PRESENTATION_V1={
  version:1,
  presentationRevision:2,
  weaponName:'Bone Knife',
  attackDuration:ATTACK_DURATION,
  classifyAttackWeapon,
  attackProgress,
  swingOffset,
  swingEmphasis,
  swingAngle,
  remoteWeapon,
  isSafeCamp,
  poseFor
};
window.ABYSSAL_WEAPON_PRESENTATION_RUNTIME_V1={
  version:1,bound:true,reentryCount:Number(existingRuntime?.reentryCount)||0
};
})();
