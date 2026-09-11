(()=>{
'use strict';

const existingRuntime=window.ABYSSAL_HIT_FEEDBACK_RUNTIME_V1;
if(existingRuntime?.bound&&window.ABYSSAL_HIT_FEEDBACK){
  existingRuntime.reentryCount=(Number(existingRuntime.reentryCount)||0)+1;
  return;
}

const FX={sparks:[],impacts:[],hurtUntil:0,hurtPulseUntil:0,lastVibrateAt:0};
window.ABYSSAL_HIT_FEEDBACK=FX;
const nowMs=()=>typeof performance!=='undefined'?performance.now():Date.now();
const clamp01=value=>Math.max(0,Math.min(1,Number(value)||0));

function confirmedMobHit(m,local=false,killed=false){
  if(!m)return;
  const now=nowMs(),x=Number(m.x)||0,y=Number(m.y)||0;
  FX.sparks.push({x,y,until:now+(killed?210:165),killed:!!killed});
  FX.impacts.push({x,y,until:now+(killed?280:145),duration:killed?280:145,killed:!!killed,local:!!local});
  if(FX.sparks.length>12)FX.sparks.splice(0,FX.sparks.length-12);
  if(FX.impacts.length>16)FX.impacts.splice(0,FX.impacts.length-16);
  if(local&&now-FX.lastVibrateAt>80){
    FX.lastVibrateAt=now;
    try{globalThis.navigator?.vibrate?.(14)}catch{}
  }
}
function recordHurt(before){
  if(Number(me?.hp)<Number(before)){
    const now=nowMs();
    FX.hurtUntil=now+220;
    FX.hurtPulseUntil=now+110;
  }
}

const baseHandleMobAttack=handleMobAttack;
handleMobAttack=function(p){
  const before=new Map(mobs.map(m=>[m.id,Number(m.hp)||0]));
  baseHandleMobAttack(p);
  const local=p?.id===SESSION_ID;
  for(const m of mobs){
    const hp=before.get(m.id),after=Number(m.hp)||0;
    if(hp!=null&&after<hp)confirmedMobHit(m,local,hp>0&&after<=0);
  }
};

const baseOnMobs=onMobs;
onMobs=function(p){
  const before=new Map(mobs.map(m=>[m.id,Number(m.hp)||0]));
  baseOnMobs(p);
  for(const m of mobs){
    const hp=before.get(m.id),after=Number(m.hp)||0;
    if(hp!=null&&after<hp)confirmedMobHit(m,false,hp>0&&after<=0);
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
  FX.impacts=FX.impacts.filter(p=>p.until>now);
  if(!FX.sparks.length&&!FX.impacts.length)return;
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  for(const s of FX.sparks){
    const total=s.killed?210:165,life=clamp01((s.until-now)/total);
    const x=sx(s.x),y=sy(s.y)-7;
    ctx.globalAlpha=.32+.68*life;
    ctx.fillStyle=s.killed?'#fff4cf':'#fff0b3';
    ctx.fillRect(x-1,y-7,2,14);
    ctx.fillRect(x-7,y-1,14,2);
    ctx.fillStyle=s.killed?'#f5c56f':'#e7a24b';
    ctx.fillRect(x-5,y-5,2,2);ctx.fillRect(x+4,y-5,2,2);
    ctx.fillRect(x-5,y+4,2,2);ctx.fillRect(x+4,y+4,2,2);
  }
  for(const p of FX.impacts){
    const life=clamp01((p.until-now)/p.duration),progress=1-life;
    const x=Math.round(sx(p.x)),y=Math.round(sy(p.y)-7);
    const radius=Math.round((p.killed?8:5)+(p.killed?17:10)*progress);
    ctx.globalAlpha=(p.killed?.62:.42)*life;
    ctx.fillStyle=p.killed?'#ffd98a':'#f0b45c';
    ctx.fillRect(x-radius,y-1,Math.max(2,Math.round(6*life)),2);
    ctx.fillRect(x+radius-Math.max(2,Math.round(6*life)),y-1,Math.max(2,Math.round(6*life)),2);
    ctx.fillRect(x-1,y-radius,2,Math.max(2,Math.round(6*life)));
    ctx.fillRect(x-1,y+radius-Math.max(2,Math.round(6*life)),2,Math.max(2,Math.round(6*life)));
    if(p.killed){
      const d=Math.max(4,Math.round(radius*.66));
      ctx.fillRect(x-d,y-d,3,3);ctx.fillRect(x+d-2,y-d,3,3);
      ctx.fillRect(x-d,y+d-2,3,3);ctx.fillRect(x+d-2,y+d-2,3,3);
    }else if(life>.55){
      ctx.globalAlpha=.16*life;ctx.fillStyle='#fff7da';ctx.fillRect(x-4,y-5,8,8);
    }
  }
  ctx.restore();
};

const baseDrawPlayer=drawPlayer;
drawPlayer=function(p,self){
  baseDrawPlayer(p,self);
  const flash=Number(self?attackFlash:p?.attack)||0;
  if(flash<=0)return;
  const x=sx(p.x),y=sy(p.y),dir=Number(p.dir)||0,alpha=Math.min(1,flash/.15);
  const progress=clamp01(1-flash/.15),contact=1-Math.min(1,Math.abs(progress-.5)/.32);
  ctx.save();
  ctx.globalAlpha=.22+.46*alpha+.18*contact;
  ctx.strokeStyle=self?'#ffe6a0':'#d9c9aa';
  ctx.lineWidth=self?3:2;
  ctx.beginPath();ctx.arc(x,y,31,dir-.92,dir+.92);ctx.stroke();
  ctx.globalAlpha=(.12+.12*contact)*alpha;
  ctx.lineWidth=5;
  ctx.beginPath();ctx.arc(x,y,34,dir-.72,dir+.72);ctx.stroke();
  ctx.restore();
};

const baseDrawLighting=drawLighting;
drawLighting=function(W,H){
  baseDrawLighting(W,H);
  const now=nowMs(),remain=FX.hurtUntil-now,pulseRemain=FX.hurtPulseUntil-now;
  if(remain<=0&&pulseRemain<=0)return;
  ctx.save();
  if(pulseRemain>0){
    const pulse=clamp01(pulseRemain/110);
    ctx.globalAlpha=.07*pulse;
    ctx.fillStyle='#d94d43';
    ctx.fillRect(0,0,Math.max(0,W),Math.max(0,H));
  }
  if(remain>0){
    const alpha=clamp01(remain/220);
    ctx.globalAlpha=.42*alpha;
    ctx.strokeStyle='#ef6b5e';ctx.lineWidth=6;
    ctx.strokeRect(3,3,Math.max(0,W-6),Math.max(0,H-6));
    ctx.globalAlpha=.5*alpha;ctx.fillStyle='#f08a7d';
    const notch=Math.max(8,Math.min(18,Math.round(Math.min(W,H)*.035)));
    ctx.fillRect(5,5,notch,2);ctx.fillRect(5,5,2,notch);
    ctx.fillRect(Math.max(5,W-5-notch),5,notch,2);ctx.fillRect(Math.max(5,W-7),5,2,notch);
    ctx.fillRect(5,Math.max(5,H-7),notch,2);ctx.fillRect(5,Math.max(5,H-5-notch),2,notch);
    ctx.fillRect(Math.max(5,W-5-notch),Math.max(5,H-7),notch,2);ctx.fillRect(Math.max(5,W-7),Math.max(5,H-5-notch),2,notch);
  }
  ctx.restore();
};
window.ABYSSAL_HIT_FEEDBACK_RUNTIME_V1={
  version:1,bound:true,reentryCount:Number(existingRuntime?.reentryCount)||0
};
})();
