(()=>{
'use strict';

const existingRuntime=window.ABYSSAL_HIT_FEEDBACK_RUNTIME_V1;
if(existingRuntime?.bound&&window.ABYSSAL_HIT_FEEDBACK){
  existingRuntime.reentryCount=(Number(existingRuntime.reentryCount)||0)+1;
  return;
}

const FX={sparks:[],impacts:[],labels:[],hurtUntil:0,hurtPulseUntil:0,lastVibrateAt:0};
window.ABYSSAL_HIT_FEEDBACK=FX;
const nowMs=()=>typeof performance!=='undefined'?performance.now():Date.now();
const clamp01=value=>Math.max(0,Math.min(1,Number(value)||0));
function drawMobWindupCue(targetCtx,x,y,phase){
  if(!targetCtx||!(Number(phase)<0))return false;
  const pulse=.78+.22*(.5+.5*Math.sin(nowMs()*.055));
  targetCtx.save();
  targetCtx.imageSmoothingEnabled=false;
  targetCtx.globalAlpha=pulse;
  targetCtx.strokeStyle='#ffd27a';
  targetCtx.lineWidth=2;
  targetCtx.beginPath();
  targetCtx.ellipse(Math.round(x),Math.round(y),22,10,0,0,Math.PI*2);
  targetCtx.stroke();
  targetCtx.beginPath();
  targetCtx.moveTo(Math.round(x),Math.round(y)-63);
  targetCtx.lineTo(Math.round(x)-10,Math.round(y)-45);
  targetCtx.lineTo(Math.round(x)+10,Math.round(y)-45);
  targetCtx.closePath();
  targetCtx.fillStyle='#ffd05c';
  targetCtx.fill();
  targetCtx.strokeStyle='#18231f';
  targetCtx.lineWidth=2;
  targetCtx.stroke();
  targetCtx.fillStyle='#18231f';
  targetCtx.font='bold 13px monospace';
  targetCtx.textAlign='center';
  targetCtx.textBaseline='middle';
  targetCtx.fillText('!',Math.round(x),Math.round(y)-51);
  targetCtx.restore();
  return true;
}
FX.drawMobWindupCue=drawMobWindupCue;

function confirmedMobHit(m,local=false,killed=false,damage=0){
  if(!m)return;
  const now=nowMs(),x=Number(m.x)||0,y=Number(m.y)||0;
  const sparkDuration=killed?480:390;
  FX.sparks.push({x,y,until:now+sparkDuration,duration:sparkDuration,killed:!!killed});
  FX.impacts.push({x,y,until:now+(killed?520:390),duration:killed?520:390,killed:!!killed,local:!!local});
  if(Number(damage)>0){
    FX.labels.push({x,y,damage:Math.round(Number(damage)),until:now+(killed?700:620),duration:killed?700:620,killed:!!killed});
    if(FX.labels.length>16)FX.labels.splice(0,FX.labels.length-16);
  }
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
    if(hp!=null&&after<hp)confirmedMobHit(m,local,hp>0&&after<=0,hp-after);
  }
};

const baseOnMobs=onMobs;
onMobs=function(p){
  const before=new Map(mobs.map(m=>[m.id,Number(m.hp)||0]));
  baseOnMobs(p);
  for(const m of mobs){
    const hp=before.get(m.id),after=Number(m.hp)||0;
    if(hp!=null&&after<hp)confirmedMobHit(m,false,hp>0&&after<=0,hp-after);
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
  FX.labels=FX.labels.filter(label=>label.until>now);
  if(!FX.sparks.length&&!FX.impacts.length&&!FX.labels.length)return;
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  for(const s of FX.sparks){
    const total=s.duration||(s.killed?210:165),life=clamp01((s.until-now)/total);
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
  for(const label of FX.labels){
    const life=clamp01((label.until-now)/label.duration),rise=Math.round((1-life)*18);
    const x=Math.round(sx(label.x)),y=Math.round(sy(label.y)-24-rise);
    const value=`-${label.damage}`;
    ctx.globalAlpha=Math.min(1,life*1.5);
    ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#211b18';ctx.fillText(value,x+1,y+2);
    ctx.fillStyle=label.killed?'#fff0b4':'#ffe2a0';ctx.fillText(value,x,y);
  }
  ctx.restore();
};

const baseDrawWithWindup=typeof draw==='function'?draw:null;
if(baseDrawWithWindup)draw=function(){
  const result=baseDrawWithWindup.apply(this,arguments);
  for(const m of mobs)if(m.hp>0&&m.phase<0)drawMobWindupCue(ctx,sx(m.x),sy(m.y)+4,m.phase);
  return result;
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
