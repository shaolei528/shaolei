(()=>{
  'use strict';

  if(globalThis.ABYSSAL_FISHING_V1?.version===1)return;
  const config=globalThis.ABYSSAL_FISHING_CONFIG_V1;
  if(!config||config.version!==1||!Array.isArray(config.ponds)||!Array.isArray(config.fish)||!config.cast)throw new Error('Fishing V1 requires pond, timing, and fish data');
  const ponds=new Map(config.ponds.map(pond=>[String(pond.id),pond])),fishById=new Map(config.fish.map(fish=>[String(fish.id),fish])),events=[];
  const water=globalThis.ABYSSAL_WATER_BODIES_V1;
  if(!water?.getAccessPoint)throw new Error('Fishing V1 requires World Water access points.');
  const saveApi=globalThis.ABYSSAL_SAVE_EXTENSIONS_V1;let state=null,nextAttempt=1,busy=false;
  const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const pointFor=pond=>water.getAccessPoint(pond.waterBodyId||pond.id);
  function inSafeCamp(actor){return !!actor&&typeof inCamp==='function'&&inCamp(actor)&&(typeof currentZone==='undefined'||currentZone==='1:1');}
  function saveOnly(){try{return typeof saveLocal==='function'&&saveLocal()===true}catch{return false}}
  function emit(type,detail){const event={type,playerId:typeof SESSION_ID==='string'?SESSION_ID:'',zone:typeof currentZone==='string'?currentZone:'1:1',...detail};events.push(event);if(events.length>48)events.shift();try{window.dispatchEvent(new CustomEvent(type,{detail:event}))}catch{}}
  function chooseFish(random){const total=config.fish.reduce((sum,fish)=>sum+Math.max(0,finite(fish.weight)),0);let cursor=Math.max(0,Math.min(.999999,finite(random,Math.random())))*total;for(const fish of config.fish){cursor-=Math.max(0,finite(fish.weight));if(cursor<0)return fish;}return config.fish.at(-1);}
  function phaseAt(now=Date.now()){if(!state)return'idle';if(now<state.biteAt)return'waiting';if(now<=state.expiresAt)return'bite';return'expired';}
  function cleanState(saved){if(saved?.version!==1)return{state:null,nextAttempt:1};const row=saved.state;if(!row||!ponds.has(String(row.pondId))||!Number.isFinite(Number(row.castAt))||!Number.isFinite(Number(row.biteAt))||!Number.isFinite(Number(row.expiresAt)))return{state:null,nextAttempt:Math.max(1,Math.floor(finite(saved.nextAttempt,1)))};return{state:{attempt:Math.max(1,Math.floor(finite(row.attempt,1))),pondId:String(row.pondId),castAt:Math.max(0,finite(row.castAt)),biteAt:Math.max(0,finite(row.biteAt)),expiresAt:Math.max(0,finite(row.expiresAt))},nextAttempt:Math.max(1,Math.floor(finite(saved.nextAttempt,1)))};}
  function snapshot(now=Date.now()){return{phase:phaseAt(now),pondId:state?.pondId||null,attempt:state?.attempt||0,biteInMs:state?Math.max(0,state.biteAt-now):0,windowLeftMs:state&&phaseAt(now)==='bite'?Math.max(0,state.expiresAt-now):0,catches:clone(catches)};}
  function saveSnapshot(){return{version:1,nextAttempt,state:state?clone(state):null,catches};}
  let catches=[];
  function restore(saved){const cleaned=cleanState(saved);state=cleaned.state;nextAttempt=cleaned.nextAttempt;catches=Array.isArray(saved?.catches)?saved.catches.filter(id=>fishById.has(String(id))).map(String).slice(-64):[];}
  function nearestPond(actor){let best=null;for(const pond of ponds.values()){const point=pointFor(pond);if(!point)continue;const d=Math.hypot(finite(actor.x)-point.x,finite(actor.y)-point.y);if(d<=Math.max(24,finite(point.interactionRange,54))&&(!best||d<best.d))best={pond,point,d};}return best;}
  function getTarget(actor=typeof me!=='undefined'?me:null,now=Date.now()){
    if(!inSafeCamp(actor))return null;const near=nearestPond(actor);if(!near)return null;
    const phase=state?.pondId===near.pond.id?phaseAt(now):'idle';let label='【互动】抛竿';
    if(phase==='waiting')label=`鱼线入水 · 等待咬钩 ${Math.max(1,(Math.ceil((state.biteAt-now)/100)/10)).toFixed(1)}秒`;
    else if(phase==='bite')label=`【互动】收杆！ ${Math.max(0,(Math.ceil((state.expiresAt-now)/100)/10)).toFixed(1)}秒`;
    else if(phase==='expired')label='鱼跑掉了 · 【互动】重新抛竿';
    return{type:'fishing',pondId:near.pond.id,d:near.d,label,stage:phase,x:near.point.x,y:near.point.y};
  }
  function castFishingLine({now=Date.now(),actor=typeof me!=='undefined'?me:null,random=Math.random}={}){
    if(!inSafeCamp(actor))return{ok:false,reason:'outside-camp'};
    const near=nearestPond(actor);if(!near)return{ok:false,reason:'no-water'};
    if(busy)return{ok:false,reason:'busy'};
    if(state?.pondId===near.pond.id){const phase=phaseAt(now);if(phase==='waiting')return{ok:false,reason:'waiting',secondsLeft:Math.max(1,Math.ceil((state.biteAt-now)/1000))};if(phase==='bite')return reelIn({now,random});if(phase==='expired'){const previous=clone(state);state=null;if(!saveOnly()){state=previous;return{ok:false,reason:'save-failed'};}emit('abyssal:fish-escaped',{attempt:previous.attempt,pondId:previous.pondId});return{ok:false,reason:'escaped'};}}
    const previous=state,previousAttempt=nextAttempt,waitMin=Math.max(500,finite(config.cast.waitMinMs,2200)),waitMax=Math.max(waitMin,finite(config.cast.waitMaxMs,5200)),delay=Math.round(waitMin+Math.max(0,Math.min(.999999,finite(random(),0)))*(waitMax-waitMin));
    state={attempt:nextAttempt++,pondId:near.pond.id,castAt:now,biteAt:now+delay,expiresAt:now+delay+Math.max(400,finite(config.cast.biteWindowMs,1750))};
    if(!saveOnly()){state=previous;nextAttempt=previousAttempt;return{ok:false,reason:'save-failed'};}
    emit('abyssal:line-cast',{attempt:state.attempt,pondId:state.pondId,biteAt:state.biteAt});return{ok:true,phase:'waiting',attempt:state.attempt,biteInMs:delay};
  }
  function reelIn({now=Date.now(),random=Math.random,actor=typeof me!=='undefined'?me:null}={}){
    if(!inSafeCamp(actor))return{ok:false,reason:'outside-camp'};
    const near=nearestPond(actor);if(!near||state&&near.pond.id!==state.pondId)return{ok:false,reason:'no-water'};
    if(!state)return{ok:false,reason:'no-cast'};const phase=phaseAt(now);
    if(phase==='waiting')return{ok:false,reason:'waiting',secondsLeft:Math.max(1,Math.ceil((state.biteAt-now)/1000))};
    if(phase==='expired'){const previous=clone(state);state=null;if(!saveOnly()){state=previous;return{ok:false,reason:'save-failed'};}emit('abyssal:fish-escaped',{attempt:previous.attempt,pondId:previous.pondId});return{ok:false,reason:'escaped'};}
    if(busy)return{ok:false,reason:'busy'};
    const fish=chooseFish(random()),previous=clone(state),previousCatches=[...catches];state=null;catches.push(fish.id);if(catches.length>64)catches=catches.slice(-64);busy=true;
    const grant=globalThis.ABYSSAL_INVENTORY_TRANSACTIONS_V1?.commitItemGrant?.({grants:{[fish.item]:1}})||{ok:false,reason:'inventory-unavailable'};
    if(!grant.ok){state=previous;catches=previousCatches;busy=false;return grant;}
    busy=false;emit('abyssal:fish-caught',{attempt:previous.attempt,pondId:previous.pondId,fishId:fish.id,item:fish.item,food:finite(fish.food),sanity:finite(fish.sanity)});return{ok:true,fishId:fish.id,name:fish.name,item:fish.item,food:finite(fish.food),sanity:finite(fish.sanity),attempt:previous.attempt};
  }
  function interact(options={}){return castFishingLine(options);}
  if(saveApi?.register)saveApi.register('fishing.v1',{snapshot:saveSnapshot,restore});
  globalThis.ABYSSAL_FISHING_V1=Object.freeze({version:1,getSnapshot:snapshot,getTarget,castFishingLine,reelIn,interact,events:()=>events.map(event=>clone(event))});
})();
