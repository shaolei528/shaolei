(()=>{
  'use strict';
  if(globalThis.ABYSSAL_COOKING_V1?.version===1)return;
  const config=globalThis.ABYSSAL_COOKING_CONFIG_V1;
  if(!config||config.version!==1||!Array.isArray(config.recipes)||!config.meals)throw new Error('Cooking V1 requires recipe and meal data');
  const recipes=new Map(config.recipes.map(recipe=>[String(recipe.id),recipe])),events=[];let lastResult={ok:false,reason:'idle'};
  const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  function nearFire(actor=typeof me!=='undefined'?me:null){if(!actor||typeof inCamp!=='function'||!inCamp(actor)||typeof currentZone==='string'&&currentZone!=='1:1')return false;const origin=typeof CAMP!=='undefined'?CAMP:{x:2400,y:2400};return Math.hypot(finite(actor.x)-finite(origin.x),finite(actor.y)-finite(origin.y))<=78;}
  function emit(type,detail){const event={type,playerId:typeof SESSION_ID==='string'?SESSION_ID:'',zone:typeof currentZone==='string'?currentZone:'1:1',...detail};events.push(event);if(events.length>40)events.shift();try{window.dispatchEvent(new CustomEvent(type,{detail:event}))}catch{}}
  function listRecipes(){return config.recipes.map(recipe=>{const unlocked=!recipe.unlockId||globalThis.ABYSSAL_NPC_SOCIAL_V1?.hasUnlock?.(recipe.unlockId)===true;return{id:recipe.id,name:recipe.name,result:recipe.result,description:recipe.description,costs:{...recipe.costs},unlockId:recipe.unlockId||null,unlocked,available:unlocked&&Object.entries(recipe.costs).every(([item,count])=>Number(inventory?.[item])>=count)};});}
  function cookRecipe(recipeId,{actor=typeof me!=='undefined'?me:null}={}){
    const recipe=recipes.get(String(recipeId||''));if(!recipe)return lastResult={ok:false,reason:'unknown-recipe'};
    if(!nearFire(actor))return lastResult={ok:false,reason:'fire-required'};
    if(recipe.unlockId&&globalThis.ABYSSAL_NPC_SOCIAL_V1?.hasUnlock?.(recipe.unlockId)!==true)return lastResult={ok:false,reason:'recipe-locked'};
    if(!config.meals[recipe.result])return lastResult={ok:false,reason:'invalid-result'};
    const result=globalThis.ABYSSAL_INVENTORY_TRANSACTIONS_V1?.commitItemExchange?.({costs:recipe.costs,grants:{[recipe.result]:1}})||{ok:false,reason:'inventory-unavailable'};
    if(!result.ok){lastResult=result;return result;}
    emit('abyssal:meal-cooked',{recipeId:recipe.id,item:recipe.result,name:recipe.name});
    try{toast(`做好了：${recipe.name}`)}catch{}
    return lastResult={ok:true,recipeId:recipe.id,item:recipe.result,name:recipe.name};
  }
  function eatMeal(itemId,options={}){
    if(!nearFire(options.actor|| (typeof me!=='undefined'?me:null)))return lastResult={ok:false,reason:'fire-required'};
    const result=globalThis.ABYSSAL_SURVIVAL_NEEDS_V1?.eatCookedMeal?.(itemId,options)||{ok:false,reason:'survival-unavailable'};
    if(result.ok){emit('abyssal:meal-served',{item:itemId,name:result.name});try{toast(`${result.name} · 饱食 +${result.hungerGained} · 生命 +${result.hpGained} · 理智 ${result.sanityGained>=0?'+':''}${result.sanityGained}${result.buff?` · ${result.buff.name} ${result.buff.secondsLeft}秒`:''}`)}catch{}}
    else try{toast(result.reason==='materials-required'?'背包里没有这份料理。':result.reason==='save-failed'?'进食未保存，料理与状态已恢复。':'现在无法食用。')}catch{}
    lastResult=result;return result;
  }
  globalThis.ABYSSAL_COOKING_V1=Object.freeze({version:1,listRecipes,cookRecipe,eatMeal,nearFire,getLastResult:()=>({...lastResult}),events:()=>events.map(event=>({...event}))});
})();
