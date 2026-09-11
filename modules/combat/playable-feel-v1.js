(()=>{
'use strict';

/*
  Local presentation bridge for the playable slice.
  Existing hit-feedback remains authoritative for sparks, attack trails, hurt flash
  and haptics. This layer only emits semantic audio events and adds a tiny
  reduced-motion-aware canvas kick; it never changes combat numbers or networking.
*/
const FEEL={version:1,shakeUntil:0,shakeStrength:0};
window.ABYSSAL_PLAYABLE_FEEL_V1=FEEL;
const nowMs=()=>typeof performance!=='undefined'?performance.now():Date.now();
function emit(type,detail){try{window.dispatchEvent(new CustomEvent(type,{detail}));}catch{}}
function reducedMotion(){try{return !!window.ABYSSAL_SHELL_V1?.getSettings?.().reducedMotion;}catch{return false;}}
function kick(strength,duration){
  if(reducedMotion())return;
  const now=nowMs();
  FEEL.shakeUntil=Math.max(FEEL.shakeUntil,now+Math.max(0,Number(duration)||0));
  FEEL.shakeStrength=Math.max(FEEL.shakeStrength,Math.max(0,Number(strength)||0));
}
function applyCanvasKick(now=nowMs()){
  if(typeof canvas==='undefined'||!canvas?.style)return;
  const remain=FEEL.shakeUntil-now;
  if(remain<=0||reducedMotion()){
    if(canvas.style.translate)canvas.style.translate='';
    if(remain<=0)FEEL.shakeStrength=0;
    return;
  }
  const strength=FEEL.shakeStrength*Math.max(0,Math.min(1,remain/120));
  const x=Math.round(Math.sin(now*.19)*strength),y=Math.round(Math.cos(now*.23)*strength*.65);
  canvas.style.translate=`${x}px ${y}px`;
}
function changedMobs(before,local){
  for(const mob of mobs){
    const hp=before.get(mob.id);
    if(hp!=null&&Number(mob.hp)<hp){
      emit('abyssal:combat-hit',{x:Number(mob.x)||0,y:Number(mob.y)||0,kind:mob.kind||'unknown',local:!!local});
      if(local)kick(2.2,95);
    }
  }
}
function recordHurt(before){
  const after=Number(me?.hp);
  if(after<Number(before)){
    kick(3.2,125);
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
