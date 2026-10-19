(()=>{
  'use strict';
  if(globalThis.ABYSSAL_SURVIVAL_FOOD_V1?.version===1)return;
  const config=globalThis.ABYSSAL_COOKING_CONFIG_V1;
  if(!config||config.version!==1||!config.meals)throw new Error('Food effects require cooking meal data');
  const saveApi=globalThis.ABYSSAL_SAVE_EXTENSIONS_V1,buffs=new Map(),events=[];
  const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const clone=value=>JSON.parse(JSON.stringify(value));
  function saveOnly(){try{return typeof saveLocal==='function'&&saveLocal()===true}catch{return false}}
  function emit(type,detail){const event={type,playerId:typeof SESSION_ID==='string'?SESSION_ID:'',zone:typeof currentZone==='string'?currentZone:'1:1',...detail};events.push(event);if(events.length>40)events.shift();try{window.dispatchEvent(new CustomEvent(type,{detail:event}))}catch{}}
  function snapshot(){return{version:1,buffs:[...buffs.entries()].map(([id,expiresAt])=>({id,expiresAt}))};}
  function restore(state){buffs.clear();if(state?.version!==1||!Array.isArray(state.buffs))return;for(const row of state.buffs){const id=String(row?.id||''),expiresAt=finite(row?.expiresAt);if(id&&expiresAt>Date.now())buffs.set(id,expiresAt);}}
  function active(now=Date.now()){for(const[id,until]of buffs)if(until<=now)buffs.delete(id);return[...buffs.entries()].map(([id,expiresAt])=>({id,expiresAt,secondsLeft:Math.max(0,Math.ceil((expiresAt-now)/1000)),name:findBuff(id)?.name||id}));}
  function findBuff(id){for(const meal of Object.values(config.meals))if(meal.buff?.id===id)return meal.buff;return null;}
  function eatMeal(itemId,{now=Date.now()}={}){
    const id=String(itemId||''),meal=config.meals[id],inv=typeof inventory!=='undefined'?inventory:null;
    if(typeof dead!=='undefined'&&dead)return{ok:false,reason:'unavailable'};
    if(!meal||!inv)return{ok:false,reason:'invalid-meal'};
    if(Number(inv[id])<1)return{ok:false,reason:'materials-required'};
    if(typeof me==='undefined'||!me)return{ok:false,reason:'survival-unavailable'};
    const before={hp:Number(me.hp)||0,hunger:Number(me.hunger)||0,sanity:Number(me.sanity)||0,buffs:snapshot()};
    const effects=meal.effects||{};me.hp=clamp(before.hp+finite(effects.hp),0,100);me.hunger=clamp(before.hunger+finite(effects.hunger),0,100);me.sanity=clamp(before.sanity+finite(effects.sanity),0,100);
    if(meal.buff?.id)buffs.set(String(meal.buff.id),Math.max(buffs.get(String(meal.buff.id))||0,now+Math.max(1,finite(meal.buff.durationSeconds,60))*1000));
    const result=globalThis.ABYSSAL_INVENTORY_TRANSACTIONS_V1?.commitItemExchange?.({costs:{[id]:1},grants:{}})||{ok:false,reason:'inventory-unavailable'};
    if(!result.ok){me.hp=before.hp;me.hunger=before.hunger;me.sanity=before.sanity;restore(before.buffs);return result;}
    emit('abyssal:meal-eaten',{item:id,name:meal.name,effects:{hp:me.hp-before.hp,hunger:me.hunger-before.hunger,sanity:me.sanity-before.sanity},buff:meal.buff?{id:meal.buff.id,expiresAt:buffs.get(meal.buff.id)}:null});
    return{ok:true,item:id,name:meal.name,hpGained:me.hp-before.hp,hungerGained:me.hunger-before.hunger,sanityGained:me.sanity-before.sanity,buff:meal.buff?{...meal.buff,secondsLeft:Math.max(0,Math.ceil((buffs.get(meal.buff.id)-now)/1000))}:null};
  }
  function hasBuff(id,now=Date.now()){return(buffs.get(String(id||''))||0)>now;}
  function sanityDrainMultiplier(now=Date.now()){let multiplier=1;for(const buff of active(now)){const data=findBuff(buff.id);if(data)multiplier=Math.min(multiplier,Math.max(.25,Math.min(1,finite(data.sanityDrainMultiplier,1))));}return multiplier;}
  if(saveApi?.register)saveApi.register('survival.food-effects.v1',{snapshot,restore});
  const base=globalThis.ABYSSAL_SURVIVAL_NEEDS_V1||{};
  globalThis.ABYSSAL_SURVIVAL_NEEDS_V1=Object.freeze({...base,eatCookedMeal:eatMeal,getFoodBuffs:active,hasFoodBuff:hasBuff,sanityDrainMultiplier,foodEvents:()=>events.map(event=>clone(event))});
  globalThis.ABYSSAL_SURVIVAL_FOOD_V1=Object.freeze({version:1,eatMeal,active,hasBuff,sanityDrainMultiplier,events:()=>events.map(event=>clone(event))});
})();
