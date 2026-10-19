(()=>{
  'use strict';

  if(globalThis.ABYSSAL_BOSS_COMBAT_V1?.version===1)return;
  const data=globalThis.ABYSSAL_BOSS_CONFIG_V1;
  const encounter=data?.version===1?data.encounters?.fen_warden:null;
  if(!encounter)throw new Error('Boss combat data is unavailable.');
  const num=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  function phaseFor(mob){
    const ratio=clamp(num(mob?.hp,0)/Math.max(1,num(encounter.health,1)),0,1);
    const phases=encounter.phases||[];let index=0;
    for(let i=1;i<phases.length;i++)if(ratio<=num(phases[i].atHealthRatio,0))index=i;
    return Math.min(phases.length-1,index);
  }
  function emitPhaseChange(mob,previousStage){
    if(!mob||mob.kind!=='boss'||mob.hp<=0||previousStage==null)return false;
    const stage=phaseFor(mob);
    if(stage===previousStage)return false;
    try{if(typeof window!=='undefined'&&typeof window.dispatchEvent==='function'&&typeof CustomEvent==='function')window.dispatchEvent(new CustomEvent('abyssal:boss-phase',{detail:{id:mob.encounterId||encounter.id,stage,previousStage}}))}catch{}
    return true;
  }

  const baseWindup=mobWindupSeconds,baseCooldown=mobAttackCooldownSeconds;
  if(typeof baseWindup==='function')mobWindupSeconds=function(kind,mob){if(kind!=='boss')return baseWindup(kind,mob);const target=mob||mobs.find(item=>item.kind==='boss'&&item.hp>0);return num(encounter.phases?.[phaseFor(target)]?.windupSeconds,.8);};
  if(typeof baseCooldown==='function')mobAttackCooldownSeconds=function(kind,mob){if(kind!=='boss')return baseCooldown(kind,mob);const target=mob||mobs.find(item=>item.kind==='boss'&&item.hp>0);return num(encounter.phases?.[phaseFor(target)]?.cooldownSeconds,1.5);};

  const baseDamage=applyMobDamage;
  if(typeof baseDamage==='function')applyMobDamage=function(target,kind,mob){
    if(kind!=='boss')return baseDamage(target,kind,mob);
    const phase=encounter.phases?.[phaseFor(mob)]||{},payload={target,damage:clamp(num(phase.damage,8),1,16),sanity:clamp(num(phase.sanity,5),0,12),kind:'boss',mobId:String(mob?.id||''),hitCd:num(mob?.hitCd,0),hitCdUntil:num(mob?.hitCdUntil,0)};
    if(target===SESSION_ID)onMobHit(payload);
    zoneCh?.send({type:'broadcast',event:'mob_hit',payload});
  };

  const baseUpdateMobs=updateMobs;
  if(typeof baseUpdateMobs==='function')updateMobs=function(dt){
    const before=new Map(mobs.filter(m=>m.kind==='boss').map(m=>[m.id,phaseFor(m)]));
    const result=baseUpdateMobs(dt);
    for(const mob of mobs)if(mob.kind==='boss'&&mob.hp>0){mob.maxHp=num(encounter.health,220);mob.bossStage=phaseFor(mob);if(before.has(mob.id))emitPhaseChange(mob,before.get(mob.id));}
    return result;
  };

  const baseHandleMobAttack=typeof handleMobAttack==='function'?handleMobAttack:null;
  if(baseHandleMobAttack)handleMobAttack=function(payload){
    const before=new Map(mobs.filter(m=>m.kind==='boss').map(m=>[m.id,phaseFor(m)]));
    const result=baseHandleMobAttack(payload);
    for(const mob of mobs)if(mob.kind==='boss'&&before.has(mob.id)){mob.bossStage=phaseFor(mob);emitPhaseChange(mob,before.get(mob.id));}
    return result;
  };

  const baseOnMobs=onMobs;
  if(typeof baseOnMobs==='function')onMobs=function(payload){
    if(!payload||!Array.isArray(payload.mobs))return baseOnMobs(payload);
    const before=new Map(mobs.filter(m=>m.kind==='boss').map(m=>[String(m.id),phaseFor(m)]));
    const bosses=payload.mobs.filter(m=>m?.kind==='boss').map(m=>({id:String(m.id||''),hp:clamp(num(m.hp,0),0,num(encounter.health,220))}));
    const normalized={...payload,mobs:payload.mobs.map(m=>m?.kind==='boss'?{...m,kind:'crawler',hp:Math.min(120,num(m.hp,1))}:m)};
    const result=baseOnMobs(normalized);
    for(const record of bosses){const mob=mobs.find(item=>String(item.id)===record.id);if(mob){mob.kind='boss';mob.encounterId=encounter.id;mob.hp=record.hp;mob.maxHp=num(encounter.health,220);mob.bossStage=phaseFor(mob);if(before.has(record.id))emitPhaseChange(mob,before.get(record.id));}}
    return result;
  };

  globalThis.ABYSSAL_BOSS_COMBAT_V1=Object.freeze({version:1,encounter,phaseFor,getStage:phaseFor});
})();
