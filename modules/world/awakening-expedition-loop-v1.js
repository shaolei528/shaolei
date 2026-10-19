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
  scope:'character-save-slice',
  requiredSalvage:Object.freeze({shard:2}),
  phases:ORDER,
  authority:'local-objective-state-only',
  persistence:'v5-save-extension-v1'
});

function finite(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback;}
function inside(rect,x,y){return !!rect&&x>=rect.x&&y>=rect.y&&x<rect.x+rect.w&&y<rect.y+rect.h;}
function hasRequiredSalvage(observation){return finite(observation?.shard,0)>=CONTRACT.requiredSalvage.shard;}

function createMachine(){
  const state={phase:PHASES.PREPARE,attempt:1,history:[PHASES.PREPARE],deathPending:false,completionAnnounced:false};
  function persist(){try{return typeof saveLocal==='function'&&saveLocal()===true}catch{return false}}
  function transition(next){
    if(!next||state.phase===next)return false;
    state.phase=next;
    state.history.push(next);
    if(state.history.length>64)state.history.shift();
    persist();
    return true;
  }
  function snapshot(){return{version:1,phase:state.phase,attempt:state.attempt,history:[...state.history],deathPending:state.deathPending,completionAnnounced:state.completionAnnounced};}
  function restore(raw){
    if(raw?.version!==1)return false;
    state.phase=ORDER.includes(raw.phase)?raw.phase:PHASES.PREPARE;
    state.attempt=Math.max(1,Math.min(999,Math.floor(finite(raw.attempt,1))));
    const history=Array.isArray(raw.history)?raw.history.filter(phase=>ORDER.includes(phase)).slice(-64):[];
    state.history=history.length?history:[state.phase];
    if(state.history.at(-1)!==state.phase)state.history.push(state.phase);
    if(state.history.length>64)state.history=state.history.slice(-64);
    state.deathPending=state.phase!==PHASES.COMPLETE&&!!raw.deathPending;
    state.completionAnnounced=state.phase===PHASES.COMPLETE||!!raw.completionAnnounced;
    return true;
  }
  function step(observation={}){
    if(!observation.started)return snapshot();
    if(observation.dead){
      if(state.phase!==PHASES.PREPARE&&state.phase!==PHASES.COMPLETE&&!state.deathPending){state.deathPending=true;persist();}
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
  return{state,step,snapshot,restore,transition};
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
    zone:typeof currentZone==='string'?currentZone:'1:1',
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
      if(!observation.inCamp&&(!observation.hasKnife||finite(observation.wood)<4||finite(observation.stone)<3))return`返营整备 · 木 ${finite(observation.wood)}/4 · 石 ${finite(observation.stone)}/3`;
      if(!observation.inCamp)return '返营制作骨刀 · 工作台在营地西南';
      if(finite(observation.wood)<4||finite(observation.stone)<3)return`整备骨刀 · 木 ${finite(observation.wood)}/4 · 石 ${finite(observation.stone)}/3`;
      return '工作台制作骨刀 → 北路 MIRE MART';
    case PHASES.LEAVE_HOME:
      return snapshot.attempt>1?'再出发 · 北路 MIRE MART · 碎片 0/2':'北路前往 MIRE MART · 碎片 0/2';
    case PHASES.REACH_MIRE_MART:
      return observation.inCamp?'前往 MIRE MART · 沿北路':'抵达 MIRE MART · 沿北路继续';
    case PHASES.SEARCH_FIGHT:
      return observation.inCamp?`缺少碎片 · 前往 MIRE MART ${shard}`:`搜寻/击退爬行者 · 碎片 ${shard}`;
    case PHASES.SECURE_REQUIRED_SALVAGE:
      return`带碎片回营 · ${shard}`;
    case PHASES.RETURN_HOME:
      return`沿北路返营 · 碎片 ${shard}`;
    case PHASES.COMPLETE:{
      const home=globalThis.ABYSSAL_HOME_WORKBENCH_V1?.getState?.();
      if(home?.returnClearance&&home?.returnClearancePersisted===false)return '返营完成 · 解锁未能写入存档；重进后需要重新完成远征。';
      if(globalThis.ABYSSAL_BOSS_PROGRESSION_V1?.isCleared?.())return observation.zone==='1:2'?'南侧探索区已开放 · 搜寻异质遗物并带回营地。':'沼心守望者已击败 · 南侧探索区开放；回营后沿南路出发。';
      const next=observation.lantern?'北上挑战沼心守望者':'制作提灯后挑战沼心守望者';
      if(home?.tier>=2)return`Field Rig ONLINE · ${next}`;
      return observation.lantern?`远征完成 · ${next}`:`远征完成 · 前往工作台升级野外装备架；${next}`;
    }
    default:return null;
  }
}
const machine=createMachine();
globalThis.ABYSSAL_SAVE_EXTENSIONS_V1?.register('world.expedition-loop.v1',{snapshot:machine.snapshot,restore:machine.restore});
function updateRuntime(){
  const observation=runtimeObservation();
  const before=machine.state.phase;
  const snapshot=machine.step(observation);
  if(before!==PHASES.COMPLETE&&snapshot.phase===PHASES.COMPLETE&&!machine.state.completionAnnounced){
    machine.state.completionAnnounced=true;
    try{if(typeof saveLocal==='function')saveLocal()}catch{}
    let clearance;
    try{clearance=globalThis.ABYSSAL_HOME_WORKBENCH_V1?.recordExpeditionReturn?.({expeditionId:CONTRACT.id,attempt:snapshot.attempt,at:Date.now()});}catch{}
    try{toast(clearance?.returnClearancePersisted===false?'已安全返回，但升级解锁未写入存档；重新加载后可能丢失。请先升级野外装备架再离开游戏。':'远征完成 · MIRE MART 物资已带回安全营地。');}catch{}
  }
  const objective=objectiveText(snapshot,observation);
  const wardUntil=typeof fieldGraceUntil!=='undefined'?finite(fieldGraceUntil,0):0;
  const wardSeconds=!observation.inCamp&&wardUntil>Date.now()?Math.ceil((wardUntil-Date.now())/1000):0;
  const text=objective&&wardSeconds>0?`${objective} · 临时护网剩余 ${wardSeconds} 秒`:objective;
  if(text&&typeof questText!=='undefined'&&questText)questText.textContent=text;
  return{snapshot:machine.snapshot(),observation,text};
}

/* Expedition V1 owns the active objective display. Do not call the old temporary Awakening objective wrapper here: it used inventory delta as completion authority and could falsely complete on unrelated shard gains. */
window.updateQuest=updateQuest=function(){updateRuntime();};

globalThis.ABYSSAL_EXPEDITION_LOOP_V1={version:1,contract:CONTRACT,phases:PHASES,createMachine,hasRequiredSalvage,atMireMart,runtimeObservation,objectiveText,updateRuntime,state:machine.state};
})();
