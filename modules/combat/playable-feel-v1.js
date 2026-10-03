(()=>{
'use strict';

/*
  Local presentation bridge for the playable slice.
  Existing hit-feedback remains authoritative for sparks, attack trails, hurt flash
  and haptics. This layer emits semantic presentation events and applies a tiny,
  reduced-motion-aware canvas kick. It never changes combat numbers or networking.
  TRUE HIT-STOP IS DEFERRED: canonical simulation/network clocks are never paused here.
*/
const FEEL={version:1,presentationRevision:2,shakeUntil:0,shakeStrength:0,lastHitKilled:false};
window.ABYSSAL_PLAYABLE_FEEL_V1=FEEL;
const nowMs=()=>typeof performance!=='undefined'?performance.now():Date.now();
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
function emit(type,detail){try{window.dispatchEvent(new CustomEvent(type,{detail}));}catch{}}
function reducedMotion(){try{return !!window.ABYSSAL_SHELL_V1?.getSettings?.().reducedMotion;}catch{return false;}}
function kick(strength,duration){
  if(reducedMotion())return false;
  const now=nowMs(),safeStrength=clamp(strength,0,3.6),safeDuration=clamp(duration,0,140);
  FEEL.shakeUntil=Math.max(FEEL.shakeUntil,now+safeDuration);
  FEEL.shakeStrength=Math.max(FEEL.shakeStrength,safeStrength);
  return safeStrength>0&&safeDuration>0;
}
function applyCanvasKick(now=nowMs()){
  if(typeof canvas==='undefined'||!canvas?.style)return;
  const remain=FEEL.shakeUntil-now;
  if(remain<=0||reducedMotion()){
    if(canvas.style.translate)canvas.style.translate='';
    if(remain<=0){FEEL.shakeStrength=0;FEEL.shakeUntil=0;}
    return;
  }
  const envelope=Math.max(0,Math.min(1,remain/140));
  const strength=Math.min(3.6,FEEL.shakeStrength)*envelope;
  const x=Math.round((Math.sin(now*.21)+Math.sin(now*.047)*.35)*strength*.72);
  const y=Math.round((Math.cos(now*.27)+Math.sin(now*.063)*.25)*strength*.52);
  canvas.style.translate=`${x}px ${y}px`;
}
function changedMobs(before,local){
  for(const mob of mobs){
    const hp=before.get(mob.id),after=Number(mob.hp)||0;
    if(hp!=null&&after<hp){
      const killed=Number(hp)>0&&after<=0;
      const detail={x:Number(mob.x)||0,y:Number(mob.y)||0,kind:mob.kind||'unknown',local:!!local,killed,hpBefore:Number(hp)||0,hpAfter:after};
      FEEL.lastHitKilled=killed;
      emit('abyssal:combat-hit',detail);
      if(killed)emit('abyssal:mob-death',detail);
      if(local)kick(killed?3.1:2.35,killed?112:86);
    }
  }
}
function recordHurt(before){
  const after=Number(me?.hp);
  if(after<Number(before)){
    kick(3.4,118);
    emit('abyssal:player-hurt',{hp:Number.isFinite(after)?after:0,delta:Number(before)-after});
  }
}

if(typeof attack==='function'){
  const baseAttack=attack;
  attack=function(){
    const beforeCd=Number(attackCd)||0,beforeFlash=Number(attackFlash)||0;
    const result=baseAttack.apply(this,arguments);
    if(beforeCd<=0&&Number(attackCd)>0&&Number(attackFlash)>beforeFlash){
      let knife=false;try{knife=!!inventory?.knife;}catch{}
      emit('abyssal:player-swing',{knife});
    }
    return result;
  };
}

const baseHandleMobAttack=handleMobAttack;
handleMobAttack=function(payload){
  const before=new Map(mobs.map(mob=>[mob.id,Number(mob.hp)||0]));
  const result=baseHandleMobAttack(payload);
  changedMobs(before,payload?.id===SESSION_ID);
  return result;
};

const baseOnMobs=onMobs;
onMobs=function(payload){
  const before=new Map(mobs.map(mob=>[mob.id,Number(mob.hp)||0]));
  const result=baseOnMobs(payload);
  changedMobs(before,false);
  return result;
};

const baseOnMobHit=onMobHit;
onMobHit=function(payload){
  const before=Number(me?.hp);
  const result=baseOnMobHit(payload);
  recordHurt(before);
  return result;
};

const baseOnAttack=onAttack;
onAttack=function(payload){
  const before=Number(me?.hp);
  const result=baseOnAttack(payload);
  recordHurt(before);
  return result;
};

const baseDrawLighting=drawLighting;
drawLighting=function(W,H){
  const result=baseDrawLighting(W,H);
  applyCanvasKick(nowMs());
  return result;
};

Object.assign(FEEL,{kick,applyCanvasKick,reducedMotion});
})();
