(()=>{
'use strict';

if(globalThis.ABYSSAL_SURVIVAL_NEEDS_V1?.version===1)return;

function eatFieldMeal(){
  if(typeof dead!=='undefined'&&dead)return{ok:false,reason:'unavailable'};
  if(typeof inventory==='undefined'||!inventory)return{ok:false,reason:'inventory-unavailable'};
  const meal=globalThis.ABYSSAL_CRAFTING_RECIPES_V1?.recipes?.meal;
  if(!meal||!meal.costs||!meal.effects)return{ok:false,reason:'recipe-unavailable'};
  for(const[key,cost]of Object.entries(meal.costs))if(Number(inventory[key])<Number(cost))return{ok:false,reason:'materials-required'};
  if(typeof me==='undefined'||!me)return{ok:false,reason:'survival-unavailable'};
  const before={hunger:Number(me.hunger)||0,hp:Number(me.hp)||0};
  if(before.hunger>=95&&before.hp>=95)return{ok:false,reason:'no-need'};
  me.hunger=clamp(before.hunger+Math.max(0,Number(meal.effects.hunger)||0),0,100);
  me.hp=clamp(before.hp+Math.max(0,Number(meal.effects.hp)||0),0,100);
  const result=globalThis.ABYSSAL_INVENTORY_TRANSACTIONS_V1?.commitCraftMutation({costs:meal.costs})||{ok:false,reason:'inventory-unavailable'};
  if(!result.ok){me.hunger=before.hunger;me.hp=before.hp;return result;}
  return{ok:true,hungerGained:me.hunger-before.hunger,hpGained:me.hp-before.hp};
}

globalThis.ABYSSAL_SURVIVAL_NEEDS_V1={version:1,eatFieldMeal};
})();
