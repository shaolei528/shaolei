(()=>{
  'use strict';

  if(globalThis.ABYSSAL_LOOT_REWARDS_V1?.version===1)return;
  const config=globalThis.ABYSSAL_CREATURE_REWARDS_CONFIG_V1;
  const saveApi=globalThis.ABYSSAL_SAVE_EXTENSIONS_V1;
  const inventoryApi=globalThis.ABYSSAL_INVENTORY_TRANSACTIONS_V1;
  if(config?.version!==1||!config.creatures||!saveApi||!inventoryApi)throw new Error('Creature Rewards V1 dependencies are unavailable.');

  const lastClaimedAtByMob=new Map();
  const num=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const safeId=value=>/^[a-zA-Z0-9:_-]{1,96}$/.test(String(value||''));
  const rewardKeyFor=(mobId,defeatedAt)=>`companion-egg:${mobId}:${defeatedAt}`;

  function parseRewardKey(value){
    const match=/^companion-egg:([a-zA-Z0-9:_-]{1,96}):(\d{1,16})$/.exec(String(value||''));
    if(!match)return null;
    const defeatedAt=Number(match[2]);
    return Number.isSafeInteger(defeatedAt)&&defeatedAt>0?{mobId:match[1],defeatedAt}:null;
  }

  function hash01(value){
    let hash=2166136261;
    for(const char of String(value))hash=Math.imul(hash^char.charCodeAt(0),16777619);
    return(hash>>>0)/4294967295;
  }

  function grantsFor(kind,rewardKey){
    const definition=config.creatures[String(kind||'')];
    if(!definition||!rewardKey)return null;
    const grants={};
    for(const[item,amount]of Object.entries(definition.guaranteed||{})){
      if(!['shard','food'].includes(item)||!Number.isInteger(amount)||amount<0||amount>99)return null;
      if(amount)grants[item]=amount;
    }
    for(const[index,drop]of (Array.isArray(definition.chanceDrops)?definition.chanceDrops:[]).entries()){
      const item=String(drop?.item||''),amount=Number(drop?.amount),chance=Number(drop?.chance);
      if(!['shard','food'].includes(item)||!Number.isInteger(amount)||amount<1||amount>99||!Number.isFinite(chance)||chance<0||chance>1)return null;
      if(hash01(`${rewardKey}|${index}`)<chance)grants[item]=(grants[item]||0)+amount;
    }
    return Object.keys(grants).length?grants:null;
  }

  function createMobReward(targetId,kind,mob,extra={}){
    const mobId=String(mob?.id||''),defeatedAt=Math.floor(num(mob?.defeatedAt,Date.now()));
    if(!safeId(mobId)||defeatedAt<=0)return null;
    const rewardKey=rewardKeyFor(mobId,defeatedAt),grants=grantsFor(kind,rewardKey);
    if(!grants)return null;
    return{
      ...(extra&&typeof extra==='object'?extra:{}),
      target:String(targetId||''),
      mobKind:String(kind||''),
      shard:grants.shard||0,
      food:grants.food||0,
      mobRewardKey:rewardKey
    };
  }

  function restore(raw){
    lastClaimedAtByMob.clear();
    const entries=Array.isArray(raw?.lastClaimedAtByMob)?raw.lastClaimedAtByMob:[];
    for(const entry of entries.slice(-512)){
      const mobId=String(entry?.mobId||''),at=Math.floor(num(entry?.at));
      if(safeId(mobId)&&at>0)lastClaimedAtByMob.set(mobId,Math.max(at,lastClaimedAtByMob.get(mobId)||0));
    }
  }

  function snapshot(){
    return{version:1,lastClaimedAtByMob:[...lastClaimedAtByMob].slice(-512).map(([mobId,at])=>({mobId,at}))};
  }

  function claim(payload){
    if(!payload||payload.target!==SESSION_ID)return false;
    const key=parseRewardKey(payload.mobRewardKey);
    if(!key)return false;
    const grants=grantsFor(payload.mobKind,payload.mobRewardKey);
    if(!grants)return false;
    const previous=lastClaimedAtByMob.get(key.mobId)||0;
    if(key.defeatedAt<=previous)return false;
    if(!lastClaimedAtByMob.has(key.mobId)&&lastClaimedAtByMob.size>=512)return false;
    lastClaimedAtByMob.set(key.mobId,key.defeatedAt);
    const result=inventoryApi.commitItemGrant({grants});
    if(!result?.ok){
      if(previous)lastClaimedAtByMob.set(key.mobId,previous);
      else lastClaimedAtByMob.delete(key.mobId);
      return false;
    }
    const detail={playerId:String(payload.target),mobId:key.mobId,mobKind:String(payload.mobKind),rewardKey:payload.mobRewardKey,grants:{...grants}};
    if(typeof dispatchEvent==='function'&&typeof CustomEvent==='function')dispatchEvent(new CustomEvent('abyssal:loot-claimed',{detail}));
    try{toast(grants.shard?`获得 ${grants.shard} 枚 eldritch shard。`:'获得了食物。')}catch{}
    return true;
  }

  const baseOnLoot=typeof onLoot==='function'?onLoot:null;
  if(baseOnLoot)onLoot=function(payload){
    if(payload?.mobRewardKey!=null)return claim(payload);
    return baseOnLoot(payload);
  };

  if(!saveApi.register('loot.creature-rewards.v1',{snapshot,restore}))throw new Error('Creature Rewards save owner registration failed.');
  globalThis.ABYSSAL_LOOT_REWARDS_V1=Object.freeze({version:1,createMobReward,claim,snapshot});
})();
