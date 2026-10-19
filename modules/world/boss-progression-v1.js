(()=>{
  'use strict';

  if(globalThis.ABYSSAL_BOSS_PROGRESSION_V1?.version===1)return;
  const data=globalThis.ABYSSAL_BOSS_CONFIG_V1;
  const combat=globalThis.ABYSSAL_BOSS_COMBAT_V1;
  const encounter=data?.version===1?data.encounters?.fen_warden:null;
  if(!encounter||combat?.version!==1)throw new Error('Boss progression dependencies are unavailable.');

  const cleared=new Set(),claimed=new Set();
  let bossIntroShown=false,lockToastAt=0,moveOrigin=null;
  const id=String(encounter.id),rewardId=String(encounter.reward?.id||'');
  const num=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const eligible=()=>Array.isArray(encounter.requires)&&encounter.requires.every(key=>inventory?.[key]===true);
  const isCleared=key=>cleared.has(String(key||id));
  const isZoneUnlocked=zone=>!encounter.unlocks?.includes(String(zone))||isCleared(id);
  const save=()=>{try{return typeof saveLocal==='function'?saveLocal():false}catch{return false}};
  function restore(raw){
    const completed=Array.isArray(raw?.cleared)?raw.cleared:[],rewards=Array.isArray(raw?.claimed)?raw.claimed:[];
    cleared.clear();claimed.clear();
    for(const value of completed)if(value===id)cleared.add(id);
    for(const value of rewards)if(value===rewardId)claimed.add(rewardId);
  }
  const snapshot=()=>({cleared:[...cleared],claimed:[...claimed]});
  globalThis.ABYSSAL_SAVE_EXTENSIONS_V1?.register('world.boss-progression.v1',{snapshot,restore});

  function makeBoss(){return{id:`boss:${id}`,encounterId:id,kind:'boss',x:num(encounter.spawn?.x,2400),y:num(encounter.spawn?.y,1272),hp:num(encounter.health,220),maxHp:num(encounter.health,220),phase:1.2,hitCd:0,hitCdUntil:0,respawnAt:0,bossStage:0};}
  function ensureBoss(zone=currentZone){
    if(String(zone)!==String(encounter.zone)||!zoneLeader||isCleared(id)||!eligible())return null;
    let boss=mobs.find(m=>m.encounterId===id||String(m.id)===`boss:${id}`);
    if(!boss){boss=makeBoss();mobs.push(boss);}
    if(!bossIntroShown){bossIntroShown=true;toast(encounter.messages?.approach||`${encounter.name} appeared.`)}
    return boss;
  }
  const baseSpawn=spawnMobs;
  if(typeof baseSpawn==='function')spawnMobs=function(zone){const result=baseSpawn(zone);ensureBoss(zone);return result;};

  const baseUpdateMobs=updateMobs;
  if(typeof baseUpdateMobs==='function')updateMobs=function(dt){
    ensureBoss(currentZone);
    const result=baseUpdateMobs(dt);
    for(const mob of mobs)if(mob.kind==='boss'&&mob.hp>0){
      mob.maxHp=num(encounter.health,220);mob.bossStage=combat.phaseFor(mob);
    }
    return result;
  };

  if(typeof window?.addEventListener==='function')window.addEventListener('abyssal:boss-phase',event=>{
    const detail=event?.detail;
    if(String(detail?.id||'')!==id)return;
    const stage=Math.floor(num(detail?.stage,-1));
    if(stage!==1&&stage!==2)return;
    const message=encounter.messages?.[stage===1?'phase2':'phase3'];
    if(message)toast(message);
  });

  function networkSnapshot(){return{version:1,cleared:[...cleared]};}
  function applyWorldSnapshot(value){
    if(value?.version!==1||!Array.isArray(value.cleared))return false;
    let changed=false;
    for(const key of value.cleared)if(key===id&&!cleared.has(id)){cleared.add(id);changed=true;}
    if(changed){save();toast(`${encounter.name} defeated · 新区域已开放。`);}
    return true;
  }
  const baseOnWorld=onWorld;
  if(typeof baseOnWorld==='function')onWorld=function(payload){const result=baseOnWorld(payload);if(payload?.bossProgress)applyWorldSnapshot(payload.bossProgress);return result;};

  function completeBoss(targetId,mob){
    if(!zoneLeader||isCleared(id)||!rewardId)return false;
    cleared.add(id);mob.hp=0;mob.respawnAt=0;mob.defeatedAt=Date.now();
    const saved=save();
    if(!saved){cleared.delete(id);mob.hp=num(encounter.health,220);mob.respawnAt=0;toast('区域进度未能保存，守望者恢复了。请稍后重试。');return false;}
    const payload={target:targetId,shard:clamp(Math.floor(num(encounter.reward?.shard,0)),0,3),food:clamp(Math.floor(num(encounter.reward?.food,0)),0,2),rewardId};
    if(targetId===SESSION_ID)onLoot(payload);else zoneCh?.send({type:'broadcast',event:'loot',payload});
    toast(encounter.reward?.message||`${encounter.name} defeated · 新区域已开放。`);
    broadcastWorld();
    return true;
  }
  const baseReward=rewardKill;
  if(typeof baseReward==='function')rewardKill=function(targetId,kind,mob){
    if(kind!=='boss')return baseReward(targetId,kind,mob);
    const bossMob=mobs.find(item=>item.kind==='boss'&&item.hp<=0&&item.respawnAt>0)||mobs.find(item=>item.kind==='boss'&&item.hp<=0);
    if(!bossMob)return false;
    return completeBoss(targetId,bossMob);
  };

  const inventoryApi=globalThis.ABYSSAL_INVENTORY_TRANSACTIONS_V1;
  const baseOnLoot=onLoot;
  if(typeof baseOnLoot==='function')onLoot=function(payload){
    if(payload?.rewardId!==rewardId)return baseOnLoot(payload);
    if(payload.target!==SESSION_ID||claimed.has(rewardId))return;
    const grants={shard:clamp(Math.floor(num(payload.shard,0)),0,3),food:clamp(Math.floor(num(payload.food,0)),0,2)};
    claimed.add(rewardId);
    const result=inventoryApi?.commitItemGrant?.({grants});
    if(!result?.ok){claimed.delete(rewardId);return false;}
    toast(encounter.reward?.message||'Boss reward claimed.');
    return true;
  };

  const baseSwitchZone=switchZone;
  if(typeof baseSwitchZone==='function')switchZone=function(zone){
    if(!isZoneUnlocked(zone)&&String(zone)!==String(currentZone)){
      if(moveOrigin){me.x=moveOrigin.x;me.y=moveOrigin.y;currentZone=moveOrigin.zone;me.zone=moveOrigin.zone;}
      if(Date.now()-lockToastAt>1600){lockToastAt=Date.now();toast(encounter.messages?.locked||'该区域尚未开放。')}
      return Promise.resolve(null);
    }
    return baseSwitchZone(zone);
  };
  const baseUpdate=update;
  if(typeof baseUpdate==='function')update=function(dt){
    const origin={x:me.x,y:me.y,zone:currentZone};moveOrigin=origin;
    try{
      const result=baseUpdate(dt),destination=zoneOf(me.x,me.y);
      if(!isZoneUnlocked(destination)&&isZoneUnlocked(origin.zone)){me.x=origin.x;me.y=origin.y;currentZone=origin.zone;me.zone=origin.zone;}
      return result;
    }finally{moveOrigin=null;}
  };

  const baseUI=updateUI;
  if(typeof baseUI==='function')updateUI=function(){baseUI();const boss=mobs.find(m=>m.kind==='boss'&&m.hp>0);if(questText&&boss&&currentZone===encounter.zone)questText.textContent=`${encounter.name} · ${Math.round(boss.hp)}/${encounter.health} · 骨刃 + 提灯`;};

  globalThis.ABYSSAL_BOSS_PROGRESSION_V1=Object.freeze({
    version:1,encounter,ensureBoss,isCleared,isZoneUnlocked,networkSnapshot,applyWorldSnapshot,
    getState:()=>({cleared:[...cleared],claimed:[...claimed],unlockedZones:encounter.unlocks?.filter(isZoneUnlocked)||[]})
  });
})();
