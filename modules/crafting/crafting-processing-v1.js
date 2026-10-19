(()=>{
'use strict';

if(globalThis.ABYSSAL_CRAFTING_PROCESSING_V1?.version===1)return;

const content=globalThis.ABYSSAL_CRAFTING_RECIPES_V1;
if(content?.version!==1||!content.recipes)throw new Error('Crafting recipe data is unavailable.');
const RECIPES=content.recipes;
let lastResult={ok:false,reason:'idle'};
function emitCrafted(recipeId){try{const x=Number(me?.x)||0,y=Number(me?.y)||0;window.dispatchEvent(new CustomEvent('abyssal:item-crafted',{detail:{recipeId,x,y}}))}catch{}}

function atWorkbench(){
  try{
    if(typeof dead!=='undefined'&&dead)return false;
    if(typeof inCamp!=='function'||!inCamp())return false;
    return globalThis.ABYSSAL_INTERACTION_V12?.getTarget?.()?.type==='workbench';
  }catch{return false;}
}
function craft(recipeId){
  if(!atWorkbench())return lastResult={ok:false,reason:'workbench-required'};
  if(recipeId==='meal'){
    if(!RECIPES.meal)return lastResult={ok:false,reason:'unknown-recipe'};
    const result=globalThis.ABYSSAL_SURVIVAL_NEEDS_V1?.eatFieldMeal?.()||{ok:false,reason:'survival-unavailable'};
    if(result.ok){toast(`${RECIPES.meal.messages?.success||'野外口粮已食用'} · 饱食 +${result.hungerGained} · 生命 +${result.hpGained}`);emitCrafted('meal')}
    else toast(result.reason==='materials-required'?RECIPES.meal.messages?.materialsRequired||'需要食物。':result.reason==='no-need'?RECIPES.meal.messages?.noNeed||'状态良好，不需要消耗口粮。':result.reason==='save-failed'?RECIPES.meal.messages?.saveFailed||'进食未保存。':RECIPES.meal.messages?.unavailable||'现在无法食用。');
    return lastResult=result;
  }
  const recipe=RECIPES[recipeId];
  if(!recipe)return lastResult={ok:false,reason:'unknown-recipe'};
  if(recipe.station!=='workbench')return lastResult={ok:false,reason:'station-required'};
  const inventory=typeof globalThis.ABYSSAL_INVENTORY_TRANSACTIONS_V1!=='undefined'?globalThis.ABYSSAL_INVENTORY_TRANSACTIONS_V1:null;
  if(!inventory)return lastResult={ok:false,reason:'inventory-unavailable'};
  const result=inventory.commitCraftMutation(recipe);
  if(result.ok){toast(recipe.messages?.success||'制作成功。');emitCrafted(recipeId)}
  else if(result.reason==='already-owned')toast(recipe.messages?.alreadyOwned||'你已经拥有该物品。');
  else if(result.reason==='materials-required')toast(recipe.messages?.materialsRequired||'材料不足。');
  else if(result.reason==='save-failed')toast('制作未保存，材料和装备已恢复；请稍后重试。');
  else toast('当前无法制作，请回到营地工作台。');
  return lastResult=result;
}
function handleCraftClick(event){
  const button=event.target?.closest?.('[data-craft]');
  if(!button)return;
  event.preventDefault?.();
  craft(button.dataset.craft);
}

if(typeof craftPanel!=='undefined'&&craftPanel?.addEventListener)craftPanel.addEventListener('click',handleCraftClick);
globalThis.ABYSSAL_CRAFTING_PROCESSING_V1={version:1,craft,getLastResult:()=>({...lastResult}),recipes:RECIPES};
})();
