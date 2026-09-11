(()=>{
'use strict';

if(globalThis.ABYSSAL_EXPEDITION_LOOP_V1?.version===1)return;

const PHASES=Object.freeze({
  PREPARE:'PREPARE',
  LEAVE_HOME:'LEAVE_HOME',
  REACH_MIRE_MART:'REACH_MIRE_MART',
  SEARCH_FIGHT:'SEARCH_FIGHT',
  SECURE_REQUIRED_SALVAGE:'SECURE_REQUIRED_SALVAGE',
  RETURN_HOME:'RETURN_HOME',
  COMPLETE:'COMPLETE'
});
const ORDER=Object.freeze([
  PHASES.PREPARE,
  PHASES.LEAVE_HOME,
  PHASES.REACH_MIRE_MART,
  PHASES.SEARCH_FIGHT,
  PHASES.SECURE_REQUIRED_SALVAGE,
  PHASES.RETURN_HOME,
  PHASES.COMPLETE
]);
const CONTRACT=Object.freeze({
  id:'mire-mart-expedition-v1',
  scope:'session-local-slice',
  requiredSalvage:Object.freeze({shard:2}),
  phases:ORDER,
  authority:'local-objective-state-only',
  persistence:'none-v1'
});

function finite(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback;}
function inside(rect,x,y){return !!rect&&x>=rect.x&&y>=rect.y&&x<rect.x+rect.w&&y<rect.y+rect.h;}
function hasRequiredSalvage(observation){return finite(observation?.shard,0)>=CONTRACT.requiredSalvage.shard;}

function createMachine(){
  const state={phase:PHASES.PREPARE,attempt:1,history:[PHASES.PREPARE],deathPending:false,completionAnnounced:false};
  function transition(next){
    if(!next||state.phase===next)return false;
    state.phase=next;
    state.history.push(next);
    return true;
  }
  function snapshot(){return{phase:state.phase,attempt:state.attempt,history:[...state.history],deathPending:state.deathPending,completionAnnounced:state.completionAnnounced};}
  function step(observation={}){
    if(!observation.started)return snapshot();
    if(observation.dead){
      if(state.phase!==PHASES.PREPARE&&state.phase!==PHASES.COMPLETE)state.deathPending=true;
      return snapshot();
    }
    if(state.deathPending&&observation.inCamp&&state.phase!==PHASES.COMPLETE){
      state.deathPending=false;
      state.attempt++;
      transition(observation.hasKnife?PHASES.LEAVE_HOME:PHASES.PREPARE);
      return snapshot();
    }
    const secured=hasRequiredSalvage(observation);
    switch(state.phase){
      case PHASES.PREPARE:
        if(observation.hasKnife)transition(PHASES.LEAVE_HOME);
        break;
      case PHASES.LEAVE_HOME:
        if(!observation.inCamp)transition(PHASES.REACH_MIRE_MART);
        break;
      case PHASES.REACH_MIRE_MART:
        if(observation.atMart)transition(PHASES.SEARCH_FIGHT);
        break;
      case PHASES.SEARCH_FIGHT:
        if(secured)transition(PHASES.SECURE_REQUIRED_SALVAGE);
        break;
      case PHASES.SECURE_REQUIRED_SALVAGE:
        if(!secured)transition(PHASES.SEARCH_FIGHT);
        else if(!observation.atMart)transition(PHASES.RETURN_HOME);
        break;
      case PHASES.RETURN_HOME:
        if(!secured)transition(PHASES.SEARCH_FIGHT);
        else if(observation.inCamp)transition(PHASES.COMPLETE);
        break;
      case PHASES.COMPLETE:
        break;
    }
    return snapshot();
  }
  return{state,step,snapshot,transition};
}

function atMireMart(player){
  const poi=globalThis.ABYSSAL_AWAKENING_WORLD_V1?.poi;
  if(!poi||!player)return false;
  const x=finite(player.x,NaN),y=finite(player.y,NaN);
  if(!Number.isFinite(x)||!Number.isFinite(y))return false;
  return inside(poi,x,y)||inside(poi.parking,x,y);
}
function runtimeObservation(){
  const inv=typeof inventory!=='undefined'&&inventory?inventory:{};
  const player=typeof me!=='undefined'?me:null;
  return{
    started:typeof started!=='undefined'&&!!started,
    dead:typeof dead!=='undefined'&&!!dead,
    inCamp:typeof inCamp==='function'&&player?!!inCamp(player):false,
    atMart:atMireMart(player),
    hasKnife:!!inv.knife,
    lantern:!!inv.lantern,
    wood:finite(inv.wood),stone:finite(inv.stone),food:finite(inv.food),shard:finite(inv.shard)
  };
}
function objectiveText(snapshot,observation={}){
  if(!observation.started)return null;
  const shard=`${Math.min(CONTRACT.requiredSalvage.shard,Math.max(0,finite(observation.shard)))}/${CONTRACT.requiredSalvage.shard}`;
  switch(snapshot.phase){
    case PHASES.PREPARE:
      if(finite(observation.wood)<4||finite(observation.stone)<3)return`PREPARE · MIRE MART 停电后留下异常残留。先准备骨刃：木材 ${finite(observation.wood)}/4 · 石头 ${finite(observation.stone)}/3。`;
      return 'PREPARE · 前往营地西南侧工作台制作骨刃。远征目标：调查 MIRE MART，并带回 2 个异质碎片。';
    case PHASES.LEAVE_HOME:
      return snapshot.attempt>1?'LEAVE HOME · 上次远征因死亡中断。重新整备后沿北门公路前往 MIRE MART。':'LEAVE HOME · 沿北门公路离开 Safe Camp → MIRE MART。目标物资：异质碎片 2。';
    case PHASES.REACH_MIRE_MART:
      return observation.inCamp?'REACH MIRE MART · 远征尚未完成。重新沿北路前往 MIRE MART。':'REACH MIRE MART · 沿破损北路继续北上，找到 MIRE MART / NO POWER。';
    case PHASES.SEARCH_FIGHT:
      return observation.inCamp?`SEARCH / FIGHT · 提前返回不会完成远征。回到 MIRE MART 取得异质碎片 ${shard}。`:`SEARCH / FIGHT · 搜索货架、冰柜、碎屑与异常残留；必要时清理爬行者。异质碎片 ${shard}。`;
    case PHASES.SECURE_REQUIRED_SALVAGE:
      return`SECURE SALVAGE · 目标物资已取得 ${shard}。离开 MIRE MART，开始返程。`;
    case PHASES.RETURN_HOME:
      return`RETURN HOME · 异质碎片 ${shard} 已取得。沿北路返回 Safe Camp。`;
    case PHASES.COMPLETE:
      return observation.lantern?'COMPLETE · MIRE MART 物资已安全带回。下一步：补给并准备下一次远征。':'COMPLETE · MIRE MART 物资已安全带回。下一步：前往工作台，用碎片准备提灯。';
    default:return null;
  }
}

const machine=createMachine();
function updateRuntime(){
  const observation=runtimeObservation();
  const before=machine.state.phase;
  const snapshot=machine.step(observation);
  if(before!==PHASES.COMPLETE&&snapshot.phase===PHASES.COMPLETE&&!machine.state.completionAnnounced){
    machine.state.completionAnnounced=true;
    try{toast('远征完成 · MIRE MART 物资已带回 Safe Camp。');}catch{}
  }
  const text=objectiveText(snapshot,observation);
  if(text&&typeof questText!=='undefined'&&questText)questText.textContent=text;
  return{snapshot:machine.snapshot(),observation,text};
}

/* Expedition V1 owns the active objective display. Do not call the old temporary Awakening objective wrapper here: it used inventory delta as completion authority and could falsely complete on unrelated shard gains. */
window.updateQuest=updateQuest=function(){updateRuntime();};

globalThis.ABYSSAL_EXPEDITION_LOOP_V1={version:1,contract:CONTRACT,phases:PHASES,createMachine,hasRequiredSalvage,atMireMart,runtimeObservation,objectiveText,updateRuntime,state:machine.state};
})();
