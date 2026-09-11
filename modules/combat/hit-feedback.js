(()=>{
'use strict';

const FX={sparks:[],hurtUntil:0,lastVibrateAt:0};
window.ABYSSAL_HIT_FEEDBACK=FX;
const nowMs=()=>typeof performance!=='undefined'?performance.now():Date.now();

function confirmedMobHit(m,local=false){
  if(!m)return;
  const now=nowMs();
  FX.sparks.push({x:Number(m.x)||0,y:Number(m.y)||0,until:now+160});
  if(FX.sparks.length>12)FX.sparks.splice(0,FX.sparks.length-12);
  if(local&&now-FX.lastVibrateAt>80){
    FX.lastVibrateAt=now;
    try{globalThis.navigator?.vibrate?.(14)}catch{}
  }
}
function recordHurt(before){
  if(Number(me?.hp)<Number(before))FX.hurtUntil=nowMs()+180;
}

const baseHandleMobAttack=handleMobAttack;
handleMobAttack=function(p){
  const before=new Map(mobs.map(m=>[m.id,Number(m.hp)||0]));
  baseHandleMobAttack(p);
  const local=p?.id===SESSION_ID;
  for(const m of mobs){
    const hp=before.get(m.id);
    if(hp!=null&&Number(m.hp)<hp)confirmedMobHit(m,local);
  }
};

const baseOnMobs=onMobs;
onMobs=function(p){
  const before=new Map(mobs.map(m=>[m.id,Number(m.hp)||0]));
  baseOnMobs(p);
  for(const m of mobs){
    const hp=before.get(m.id);
    if(hp!=null&&Number(m.hp)<hp)confirmedMobHit(m,false);
  }
};

const baseOnMobHit=onMobHit;
onMobHit=function(p){
  const before=Number(me?.hp);
  baseOnMobHit(p);
  recordHurt(before);
};

const baseOnAttack=onAttack;
onAttack=function(p){
  const before=Number(me?.hp);
  baseOnAttack(p);
  recordHurt(before);
};

const baseDrawMobs=drawMobs;
drawMobs=function(W,H){
  baseDrawMobs(W,H);
  const now=nowMs();
  FX.sparks=FX.sparks.filter(s=>s.until>now);
  if(!FX.sparks.length)return;
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  for(const s of FX.sparks){
    const life=Math.max(0,Math.min(1,(s.until-now)/160));
    const x=sx(s.x),y=sy(s.y)-7;
    ctx.globalAlpha=.35+.65*life;
    ctx.fillStyle='#fff0b3';
    ctx.fillRect(x-1,y-6,2,12);
    ctx.fillRect(x-6,y-1,12,2);
    ctx.fillStyle='#e7a24b';
    ctx.fillRect(x-4,y-4,2,2);
    ctx.fillRect(x+3,y-4,2,2);
    ctx.fillRect(x-4,y+3,2,2);
    ctx.fillRect(x+3,y+3,2,2);
  }
  ctx.restore();
};

const baseDrawPlayer=drawPlayer;
drawPlayer=function(p,self){
  baseDrawPlayer(p,self);
  const flash=Number(self?attackFlash:p?.attack)||0;
  if(flash<=0)return;
  const x=sx(p.x),y=sy(p.y),dir=Number(p.dir)||0,alpha=Math.min(1,flash/.15);
  ctx.save();
  ctx.globalAlpha=.25+.55*alpha;
  ctx.strokeStyle=self?'#ffe6a0':'#d9c9aa';
  ctx.lineWidth=self?3:2;
  ctx.beginPath();
  ctx.arc(x,y,31,dir-.92,dir+.92);
  ctx.stroke();
  ctx.globalAlpha=.18*alpha;
  ctx.lineWidth=5;
  ctx.beginPath();
  ctx.arc(x,y,34,dir-.72,dir+.72);
  ctx.stroke();
  ctx.restore();
};

const baseDrawLighting=drawLighting;
drawLighting=function(W,H){
  baseDrawLighting(W,H);
  const remain=FX.hurtUntil-nowMs();
  if(remain<=0)return;
  const alpha=Math.max(0,Math.min(1,remain/180));
  ctx.save();
  ctx.globalAlpha=.38*alpha;
  ctx.strokeStyle='#ef6b5e';
  ctx.lineWidth=6;
  ctx.strokeRect(3,3,Math.max(0,W-6),Math.max(0,H-6));
  ctx.restore();
};
})();