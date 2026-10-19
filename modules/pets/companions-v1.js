(()=>{
  'use strict';
  if(globalThis.ABYSSAL_PETS_V1?.version===1)return;
  const config=globalThis.ABYSSAL_PETS_CONFIG_V1;
  if(config?.version!==1||config.eggItem!=='companion_egg'||!config.companion)throw new Error('Companions V1 requires data and incubation settings');
  const saveApi=globalThis.ABYSSAL_SAVE_EXTENSIONS_V1,events=[],claimedRewardKeys=new Set();
  const camp=()=>typeof CAMP!=='undefined'?CAMP:{x:2400,y:2400};
  const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,finite(value,min)));
  const clone=value=>JSON.parse(JSON.stringify(value));
  let incubation=null,companion=null,killsObserved=0;
  function saveOnly(){try{return typeof saveLocal==='function'&&saveLocal()===true}catch{return false}}
  function emit(type,detail){const event={type,playerId:typeof SESSION_ID==='string'?SESSION_ID:'',zone:typeof currentZone==='string'?currentZone:'1:1',...detail};events.push(event);if(events.length>48)events.shift();try{window.dispatchEvent(new CustomEvent(type,{detail:event}))}catch{}}
  function safeCamp(actor){return !!actor&&typeof inCamp==='function'&&inCamp(actor)&&(typeof currentZone==='undefined'||currentZone==='1:1');}
  function stationPoint(){return{x:finite(camp().x)+finite(config.incubator?.offset?.x),y:finite(camp().y)+finite(config.incubator?.offset?.y)}}
  function inReach(actor){const point=stationPoint();return safeCamp(actor)&&Math.hypot(finite(actor.x)-point.x,finite(actor.y)-point.y)<=Math.max(24,finite(config.incubator?.radius,82));}
  function snapshot(){return{version:1,killsObserved,incubation:incubation?clone(incubation):null,companion:companion?clone(companion):null,claimedRewardKeys:[...claimedRewardKeys].slice(-96)}}
  function restore(raw){
    killsObserved=Math.max(0,Math.floor(finite(raw?.killsObserved,0)));claimedRewardKeys.clear();
    for(const key of Array.isArray(raw?.claimedRewardKeys)?raw.claimedRewardKeys.slice(-96):[])if(typeof key==='string'&&key.length<=160)claimedRewardKeys.add(key);
    const pet=raw?.companion;if(pet?.id===config.companion.id){companion={id:config.companion.id,name:String(pet.name||config.companion.name).replace(/[<>]/g,'').trim().slice(0,14)||config.companion.name,xp:Math.max(0,Math.floor(finite(pet.xp,0))),evolved:pet.evolved===true,command:pet.command==='WAIT'?'WAIT':'FOLLOW',anchor:{x:clamp(pet.anchor?.x,0,4800),y:clamp(pet.anchor?.y,0,4800)}};}else companion=null;
    const egg=raw?.incubation;if(egg?.eggItem===config.eggItem&&Number.isFinite(Number(egg.hatchesAt)))incubation={eggItem:config.eggItem,startedAt:Math.max(0,finite(egg.startedAt)),hatchesAt:Math.max(0,finite(egg.hatchesAt))};else incubation=null;
  }
  saveApi?.register?.('pets.companions.v1',{snapshot,restore});
  function hatchIfReady(now=Date.now()){
    if(!incubation||now<incubation.hatchesAt)return false;
    const previous=clone(incubation);incubation=null;
    const prior=companion;companion={id:config.companion.id,name:config.companion.name,xp:0,evolved:false,command:'FOLLOW',anchor:{x:finite(me?.x,stationPoint().x),y:finite(me?.y,stationPoint().y)}};
    if(!saveOnly()){incubation=previous;companion=prior;return false;}
    emit('abyssal:companion-hatched',{companionId:companion.id,name:companion.name});try{toast(`${companion.name}从蛋壳里探出头来。`)}catch{}return true;
  }
  function getSnapshot(now=Date.now()){hatchIfReady(now);return{incubation:incubation?{startedAt:incubation.startedAt,hatchesAt:incubation.hatchesAt,secondsLeft:Math.max(0,Math.ceil((incubation.hatchesAt-now)/1000))}:null,companion:companion?clone(companion):null,killsObserved,xpToEvolve:companion&&!companion.evolved?Math.max(0,finite(config.companion.evolutionXp,3)-companion.xp):0}}
  function getTarget(actor=typeof me!=='undefined'?me:null,now=Date.now()){
    if(!inReach(actor))return null;hatchIfReady(now);const point=stationPoint();
    let label='【互动】检查营地孵化器';if(incubation)label=`伙伴蛋孵化中 · ${Math.max(0,Math.ceil((incubation.hatchesAt-now)/1000))}秒`;else if(!companion&&Number(inventory?.[config.eggItem])>0)label='【互动】放入深渊伙伴蛋';else if(companion)label=`【互动】伙伴 · ${companion.name} · ${companion.command==='FOLLOW'?'跟随':'留守'}`;
    return{type:'pet-station',d:Math.hypot(finite(actor.x)-point.x,finite(actor.y)-point.y),label,x:point.x,y:point.y};
  }
  function beginIncubation({now=Date.now(),actor=typeof me!=='undefined'?me:null}={}){
    if(!inReach(actor))return{ok:false,reason:'station-required'};hatchIfReady(now);
    if(companion)return{ok:false,reason:'companion-owned'};if(incubation)return{ok:false,reason:'already-incubating'};
    const previous=incubation;incubation={eggItem:config.eggItem,startedAt:now,hatchesAt:now+Math.max(1,finite(config.incubationSeconds,20))*1000};
    const result=globalThis.ABYSSAL_INVENTORY_TRANSACTIONS_V1?.commitItemExchange?.({costs:{[config.eggItem]:1},grants:{}})||{ok:false,reason:'inventory-unavailable'};
    if(!result.ok){incubation=previous;return result;}emit('abyssal:egg-incubated',{hatchesAt:incubation.hatchesAt});return{ok:true,seconds:Math.ceil((incubation.hatchesAt-now)/1000)};
  }
  function rename(name){
    if(!companion)return{ok:false,reason:'no-companion'};const cleaned=String(name||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,14);if(!cleaned)return{ok:false,reason:'empty-name'};
    const previous=companion.name;companion.name=cleaned;if(!saveOnly()){companion.name=previous;return{ok:false,reason:'save-failed'};}emit('abyssal:companion-named',{companionId:companion.id,name:cleaned});return{ok:true,name:cleaned};
  }
  function command(command,{actor=typeof me!=='undefined'?me:null}={}){
    if(!companion)return{ok:false,reason:'no-companion'};const next=String(command||'').toUpperCase();if(!['FOLLOW','WAIT'].includes(next))return{ok:false,reason:'invalid-command'};
    const previous=clone(companion);companion.command=next;if(next==='WAIT'&&actor){const direction=finite(actor.dir,0);companion.anchor={x:clamp(finite(actor.x)-Math.cos(direction)*30,0,4800),y:clamp(finite(actor.y)-Math.sin(direction)*30+14,0,4800)};}
    if(!saveOnly()){companion=previous;return{ok:false,reason:'save-failed'};}emit('abyssal:companion-commanded',{companionId:companion.id,command:next});return{ok:true,command:next};
  }
  function addXp(amount,source){
    if(!companion||companion.command!=='FOLLOW')return false;const before=clone(companion);companion.xp=Math.min(999,companion.xp+Math.max(0,Math.floor(finite(amount))));
    const threshold=Math.max(1,finite(config.companion.evolutionXp,3)),evolvedNow=!companion.evolved&&companion.xp>=threshold;if(evolvedNow)companion.evolved=true;
    if(companion.xp===before.xp)return false;if(!saveOnly()){companion=before;return false;}
    emit(evolvedNow?'abyssal:companion-evolved':'abyssal:companion-grown',{companionId:companion.id,xp:companion.xp,source});if(evolvedNow)try{toast(`${config.companion.evolvedName}完成了一次进阶。`)}catch{}return true;
  }
  function recordCombatXp(payload){
    if(!companion||companion.command!=='FOLLOW')return false;const raw=String(payload?.mobRewardKey||'');if(!raw)return addXp(config.companion.combatXp,'combat');const key=`combat-xp:${raw}`;if(claimedRewardKeys.has(key))return false;claimedRewardKeys.add(key);if(!addXp(config.companion.combatXp,'combat')){claimedRewardKeys.delete(key);return false;}return true;
  }
  function rollMonsterDrop(kind,mob){
    if(!['crawler','cultist','watcher'].includes(String(kind)))return{};
    const previous=killsObserved;killsObserved=Math.min(100000,killsObserved+1);const key=`companion-egg:${String(mob?.id||kind)}:${Math.max(0,Math.floor(finite(mob?.defeatedAt,Date.now())))}`;
    const chance=clamp(config.eggDrops?.chanceByKind?.[kind],0,1),hash=(()=>{let n=2166136261;for(const char of key)n=Math.imul(n^char.charCodeAt(0),16777619);return(n>>>0)/4294967295})();
    const dropped=killsObserved>=Math.max(1,Math.floor(finite(config.eggDrops?.guaranteedAfterKills,3)))||hash<chance;
    if(!saveOnly()){killsObserved=previous;return{};}
    return dropped?{companionEgg:true,companionRewardKey:key,mobRewardKey:key,mobKind:String(kind)}:{mobRewardKey:key,mobKind:String(kind)};
  }
  function getRenderState(actor=typeof me!=='undefined'?me:null){
    if(!companion||!actor)return null;hatchIfReady();let x=companion.anchor.x,y=companion.anchor.y;
    if(companion.command==='FOLLOW'){const direction=finite(actor.dir);x=finite(actor.x)-Math.cos(direction)*30;y=finite(actor.y)-Math.sin(direction)*30+14;}
    return{id:companion.id,name:companion.name,x,y,command:companion.command,xp:companion.xp,evolved:companion.evolved,stage:companion.evolved?config.companion.evolvedName:config.companion.name};
  }
  function attackBonus(){return companion?.command==='FOLLOW'?Math.max(0,finite(config.companion.attackBonus,0)):0;}
  function claimEggDrop(payload){
    if(payload?.target!==SESSION_ID||payload.companionEgg!==true)return false;const key=String(payload.companionRewardKey||'');if(!key||claimedRewardKeys.has(key))return false;
    claimedRewardKeys.add(key);const grant=globalThis.ABYSSAL_INVENTORY_TRANSACTIONS_V1?.commitItemGrant?.({grants:{[config.eggItem]:1}})||{ok:false,reason:'inventory-unavailable'};
    if(!grant.ok){claimedRewardKeys.delete(key);return false;}emit('abyssal:companion-egg-dropped',{rewardKey:key,mobKind:String(payload.mobKind||'creature')});try{toast('怪物掉落了一枚深渊伙伴蛋。回营地放入孵化器。')}catch{}return true;
  }
  if(typeof onLoot==='function'){
    const baseLoot=onLoot;onLoot=function(payload){const result=baseLoot(payload);claimEggDrop(payload);if(payload?.target===SESSION_ID&&payload?.mobKind)recordCombatXp(payload);return result;};
  }
  window.addEventListener('abyssal:resource-collected',event=>{const detail=event.detail||{};if(companion&&companion.command==='FOLLOW')addXp(config.companion.harvestXp,`gather:${String(detail.kind||'resource')}`);});
  globalThis.ABYSSAL_PETS_V1=Object.freeze({version:1,getSnapshot,getTarget,beginIncubation,rename,command,getRenderState,attackBonus,rollMonsterDrop,claimEggDrop,events:()=>events.map(event=>clone(event))});
})();
