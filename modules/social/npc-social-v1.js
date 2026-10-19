(()=>{
  'use strict';
  if(globalThis.ABYSSAL_NPC_SOCIAL_V1?.version===1)return;
  const config=globalThis.ABYSSAL_NPC_SOCIAL_CONFIG_V1;
  const resident=config?.residents?.['camp-guide'];
  if(config?.version!==1||!resident||!Array.isArray(resident.giftItems)||!Array.isArray(resident.unlocks))throw new Error('NPC Social V1 requires resident relationship data');
  const saveApi=globalThis.ABYSSAL_SAVE_EXTENSIONS_V1;
  const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const gifts=new Map(resident.giftItems.map(gift=>[gift.itemId,gift]));
  const unlockDefs=new Map(resident.unlocks.map(unlock=>[unlock.id,unlock]));
  let favor=0,unlocked=new Set();
  function snapshot(){return{favor,unlocked:[...unlocked].filter(id=>unlockDefs.has(id))};}
  function restore(raw){favor=Math.max(0,Math.min(999,Math.floor(finite(raw?.favor))));unlocked=new Set(Array.isArray(raw?.unlocked)?raw.unlocked.filter(id=>unlockDefs.has(id)&&favor>=unlockDefs.get(id).atFavor):[]);for(const[id,unlock]of unlockDefs)if(favor>=unlock.atFavor)unlocked.add(id);}
  saveApi?.register?.('social.npc-relationships.v1',{snapshot,restore});
  function guideSnapshot(){try{return globalThis.ABYSSAL_CAMP_GUIDE_V1?.getSnapshot?.()||null}catch{return null}}
  function inReach(actor=typeof me!=='undefined'?me:null){
    if(!actor||typeof inCamp==='function'&&!inCamp(actor)||typeof currentZone==='string'&&currentZone!=='1:1')return false;
    const guide=guideSnapshot();return !!guide&&Math.hypot(finite(actor.x)-finite(guide.x),finite(actor.y)-finite(guide.y))<=92;
  }
  function levelFor(value=favor){let result=resident.relationshipLevels?.[0]||{label:'刚认识',atFavor:0};for(const level of resident.relationshipLevels||[])if(value>=level.atFavor)result=level;return result;}
  function getSnapshot(){const next=(resident.relationshipLevels||[]).find(level=>level.atFavor>favor);return{npcId:'camp-guide',title:resident.title,favor,level:levelFor().label,nextFavor:next?.atFavor??null,unlocked:[...unlocked].map(id=>({id,...unlockDefs.get(id)}))};}
  function hasUnlock(id){return unlocked.has(String(id||''));}
  function giftOptions(){return resident.giftItems.map(gift=>({...gift,count:Math.max(0,Math.floor(finite(inventory?.[gift.itemId])))}));}
  function emit(type,detail){const event={type,playerId:typeof SESSION_ID==='string'?SESSION_ID:'',zone:typeof currentZone==='string'?currentZone:'1:1',npcId:'camp-guide',...detail};try{window.dispatchEvent(new CustomEvent(type,{detail:event}))}catch{}return event;}
  function giveGift(itemId,{actor=typeof me!=='undefined'?me:null}={}){
    const gift=gifts.get(String(itemId||''));if(!gift)return{ok:false,reason:'gift-not-accepted'};
    if(!inReach(actor))return{ok:false,reason:'npc-required'};
    if(finite(inventory?.[gift.itemId])<1)return{ok:false,reason:'materials-required',item:gift.itemId};
    const before={favor,unlocked:new Set(unlocked)},previous=getSnapshot();favor=Math.min(999,favor+Math.max(1,Math.floor(finite(gift.favor,1))));
    const newlyUnlocked=[];for(const[id,unlock]of unlockDefs)if(favor>=unlock.atFavor&&!unlocked.has(id)){unlocked.add(id);newlyUnlocked.push({...unlock});}
    const transaction=globalThis.ABYSSAL_INVENTORY_TRANSACTIONS_V1?.commitItemExchange?.({costs:{[gift.itemId]:1},grants:{}})||{ok:false,reason:'inventory-unavailable'};
    if(!transaction.ok){favor=before.favor;unlocked=before.unlocked;return transaction;}
    const state=getSnapshot();emit('abyssal:npc-gift-given',{itemId:gift.itemId,favor,state});emit('abyssal:npc-relationship-changed',{previous,state,newlyUnlocked});
    return{ok:true,itemId:gift.itemId,favor:gift.favor,addedFavor:state.favor-previous.favor,level:state.level,response:gift.response,newlyUnlocked};
  }
  globalThis.ABYSSAL_NPC_SOCIAL_V1=Object.freeze({version:1,getSnapshot,giftOptions,giveGift,hasUnlock,inReach});
})();
