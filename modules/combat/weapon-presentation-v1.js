(()=>{
'use strict';

const ATTACK_DURATION=.15;
const REMOTE_WEAPON=new Map();
const clamp01=value=>Math.max(0,Math.min(1,Number(value)||0));
const mix=(a,b,t)=>a+(b-a)*t;

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
  if(t<.20)return mix(-.35,-1.05,t/.20);          // anticipation
  if(t<.72)return mix(-1.05,1.02,(t-.20)/.52);    // slash
  return mix(1.02,.30,(t-.72)/.28);               // recovery
}
function swingAngle(dir,flash){
  return (Number(dir)||0)+swingOffset(attackProgress(flash));
}
function remoteWeapon(id){return REMOTE_WEAPON.get(String(id||''))||'unknown';}
function hasKnife(p,self){return self?!!inventory.knife:remoteWeapon(p?.id)==='knife';}
function poseFor(p,self){
  const dir=Number(p?.dir)||0;
  const flash=Math.max(0,Number(self?attackFlash:p?.attack)||0);
  const attacking=flash>0;
  const fx=Math.cos(dir),fy=Math.sin(dir),sideX=-fy,sideY=fx;
  const side=attacking?0:4;
  const forward=attacking?6:3;
  return{
    attacking,
    dir,
    angle:attacking?swingAngle(dir,flash):dir+.38,
    x:Math.round(sx(p.x)+fx*forward+sideX*side),
    y:Math.round(sy(p.y)-4+fy*(forward-1)+sideY*side)
  };
}
function drawPixelKnife(pose,alpha=1){
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

  // Dark wrapped survival-knife handle.
  for(const d of [-7,-5,-3])plot(d,0,4,'#242520');
  plot(-6,0,2,'#65513a');
  plot(-4,0,2,'#4d4334');
  plot(-2,0,2,'#6c5940');
  plot(-1,-3,3,'#81735c');
  plot(-1,3,3,'#81735c');

  // Short worn steel blade, built from snapped pixel blocks (no canvas rotation).
  for(const d of [1,3,5,7,9,11,13]){
    plot(d,0,4,'#303735');
    plot(d,0,2,d>=11?'#b7b8a7':'#aab2aa');
  }
  plot(15,0,2,'#d2cfb5');
  plot(8,1,2,'#76543a');
  plot(4,-1,1,'#d8d7c0');
  plot(0,0,3,'#5f5a4c');
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
  const knife=hasKnife(p,self);
  const pose=knife?poseFor(p,self):null;
  const away=knife&&!pose.attacking&&directionRow(Number(p?.dir)||0)===3;
  if(away)drawPixelKnife(pose,.88);
  baseDrawPlayer(p,self);
  if(knife&&!away){
    const flash=Math.max(0,Number(self?attackFlash:p?.attack)||0);
    const alpha=pose.attacking ? .88+Math.min(.12,flash/.15*.12) : .9;
    drawPixelKnife(pose,alpha);
  }
};

window.ABYSSAL_WEAPON_PRESENTATION_V1={
  version:1,
  attackDuration:ATTACK_DURATION,
  classifyAttackWeapon,
  attackProgress,
  swingOffset,
  swingAngle,
  remoteWeapon
};
})();