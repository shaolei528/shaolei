(()=>{
  'use strict';
  if(globalThis.ABYSSAL_PLAYER_ACTIVITY_SYNC_V1?.version===1)return;

  const MAX_BUFFS=3,MAX_ID=48,MAX_NAME=24,MAX_FISH_MS=15000;
  let localFishing=null;
  const localFoodBuffs=new Map();
  const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,finite(value,min)));
  const safeText=(value,max=MAX_NAME)=>String(value||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,max);
  const validId=value=>/^[a-z0-9_-]{1,48}$/i.test(String(value||''));
  const currentPlayer=detail=>detail&&String(detail.playerId||'')===String(typeof SESSION_ID==='string'?SESSION_ID:'');

  function receiveFishingState(event){
    const detail=event?.detail||{};
    if(!currentPlayer(detail))return;
    const phase=String(detail.phase||'idle');
    if(phase==='idle'){localFishing=null;return;}
    const now=Date.now(),pondId=validId(detail.pondId)?String(detail.pondId):'';
    if(['waiting','bite'].includes(phase)&&!pondId)return;
    if(phase==='waiting'){
      const remainingMs=clamp(detail.remainingMs,0,MAX_FISH_MS),biteWindowMs=clamp(detail.biteWindowMs,400,MAX_FISH_MS);
      const biteAt=now+remainingMs;
      localFishing={phase,pondId,biteAt,expiresAt:biteAt+biteWindowMs,showUntil:0,fishName:''};
      return;
    }
    if(phase==='bite'){
      localFishing={phase,pondId, biteAt:now,expiresAt:now+clamp(detail.remainingMs,0,MAX_FISH_MS),showUntil:0,fishName:''};
      return;
    }
    if(['caught','escaped'].includes(phase)){
      localFishing={phase,pondId,expiresAt:0,showUntil:now+clamp(detail.holdMs,500,5000),fishName:safeText(detail.fishName,MAX_NAME)};
      return;
    }
    localFishing=null;
  }

  function receiveFoodState(event){
    const detail=event?.detail||{};
    if(!currentPlayer(detail)||!Array.isArray(detail.buffs))return;
    const now=Date.now();localFoodBuffs.clear();
    for(const row of detail.buffs.slice(0,MAX_BUFFS)){
      const id=String(row?.id||''),name=safeText(row?.name,MAX_NAME),seconds=clamp(row?.secondsLeft,0,3600);
      if(!validId(id)||!name||seconds<1)continue;
      localFoodBuffs.set(id,{id,name,expiresAt:now+seconds*1000});
    }
  }

  function getLocalSnapshot(){
    const now=Date.now();let fishing=null;
    if(localFishing){
      if(localFishing.phase==='waiting'&&now>=localFishing.biteAt)localFishing.phase='bite';
      if(['waiting','bite'].includes(localFishing.phase)&&now>=localFishing.expiresAt){localFishing.phase='escaped';localFishing.showUntil=now+2500;}
      if(['caught','escaped'].includes(localFishing.phase)&&now>=localFishing.showUntil)localFishing=null;
    }
    if(localFishing){
      const phase=localFishing.phase;
      fishing={phase,pondId:localFishing.pondId||null,secondsLeft:['waiting','bite'].includes(phase)?Math.max(0,Math.ceil(((phase==='waiting'?localFishing.biteAt:localFishing.expiresAt)-now)/1000)):0};
      if(phase==='caught'&&localFishing.fishName)fishing.fishName=localFishing.fishName;
    }
    const foodBuffs=[];
    for(const[id,buff]of localFoodBuffs){const secondsLeft=Math.max(0,Math.ceil((buff.expiresAt-now)/1000));if(secondsLeft<1){localFoodBuffs.delete(id);continue;}foodBuffs.push({id,name:buff.name,secondsLeft});}
    return{version:1,fishing,foodBuffs:foodBuffs.slice(0,MAX_BUFFS)};
  }

  function sanitizeRemoteSnapshot(payload){
    if(!payload||typeof payload!=='object'||Array.isArray(payload)||payload.version!==1||!Array.isArray(payload.foodBuffs))return null;
    let fishing=null;
    if(payload.fishing!=null){
      const row=payload.fishing,phase=String(row?.phase||'');
      if(!['waiting','bite','caught','escaped'].includes(phase))return null;
      const pondId=String(row?.pondId||'');
      if(['waiting','bite'].includes(phase)&&!validId(pondId))return null;
      fishing={phase,pondId:validId(pondId)?pondId:'',secondsLeft:Math.floor(clamp(row?.secondsLeft,0,20))};
      if(phase==='caught')fishing.fishName=safeText(row?.fishName,MAX_NAME);
    }
    const foodBuffs=[];
    for(const row of payload.foodBuffs.slice(0,MAX_BUFFS)){
      const id=String(row?.id||''),name=safeText(row?.name,MAX_NAME),secondsLeft=Math.floor(clamp(row?.secondsLeft,0,3600));
      if(validId(id)&&name&&secondsLeft>0)foodBuffs.push({id,name,secondsLeft});
    }
    return{version:1,fishing,foodBuffs};
  }

  window.addEventListener('abyssal:player-fishing-state-v1',receiveFishingState);
  window.addEventListener('abyssal:player-food-state-v1',receiveFoodState);
  if(typeof onMove==='function'){
    const previous=onMove;
    onMove=function(payload){
      previous(payload);
      if(!validMove(payload))return;
      const remote=remotes.get(payload.id);
      if(!remote)return;
      const activity=sanitizeRemoteSnapshot(payload.activity);
      if(activity)remote.activity=activity;
    };
  }

  globalThis.ABYSSAL_PLAYER_ACTIVITY_SYNC_V1=Object.freeze({version:1,getLocalSnapshot,sanitizeRemoteSnapshot});
})();
