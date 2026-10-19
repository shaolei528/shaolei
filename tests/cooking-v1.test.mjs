import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const config=JSON.parse(read('data/cooking/recipes-v1.json'));
const inventory={wood:0,stone:0,food:3,shard:0,seed:0,egg:1,milk:1,wool:0,fish_reedcarp:2,fish_glassminnow:1,fish_holloweye:1,meal_river_stew:0,meal_glass_porridge:0,meal_holloweye_chowder:0,meal_trail_stew:0,knife:false,lantern:false};
const unlockedRecipes=new Set();
let saveResult=true,savedExtensions=null,saveCalls=0;
const playerStateEvents=[];
const sandbox={
  console,
  inventory,
  me:{hp:50,hunger:20,sanity:30,x:2400,y:2400},
  CAMP:{x:2400,y:2400,r:470},
  currentZone:'1:1',SESSION_ID:'cooking-test',dead:false,
  clamp:(value,min,max)=>Math.max(min,Math.min(max,value)),
  inCamp:actor=>Math.hypot(actor.x-2400,actor.y-2400)<470,
  toast(){},
  dispatchEvent(event){playerStateEvents.push(event);return true;},
  CustomEvent:class CustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail;}},
  localStorage:{getItem(){return null;}},
};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
sandbox.saveLocal=()=>{saveCalls++;if(saveResult)savedExtensions=sandbox.ABYSSAL_SAVE_EXTENSIONS_V1?.snapshot?.()||null;return saveResult;};
vm.createContext(sandbox);
sandbox.ABYSSAL_COOKING_CONFIG_V1=config;
sandbox.ABYSSAL_NPC_SOCIAL_V1={hasUnlock:id=>unlockedRecipes.has(id)};
vm.runInContext(read('modules/items/inventory-transactions-v1.js'),sandbox,{filename:'inventory-transactions-v1.js'});
vm.runInContext(read('modules/core/save-extensions-v1.js'),sandbox,{filename:'save-extensions-v1.js'});
vm.runInContext(read('modules/survival/needs-consumption-v1.js'),sandbox,{filename:'needs-consumption-v1.js'});
vm.runInContext(read('modules/survival/food-effects-v1.js'),sandbox,{filename:'food-effects-v1.js'});
vm.runInContext(read('modules/cooking/cooking-v1.js'),sandbox,{filename:'cooking-v1.js'});

const cooking=sandbox.ABYSSAL_COOKING_V1;
assert.equal(cooking.version,1);
assert.equal(cooking.listRecipes().length,4);
assert.equal(cooking.cookRecipe('guide-trail-stew',{actor:sandbox.me}).reason,'recipe-locked','social recipes remain unavailable before a relationship unlock');
assert.equal(cooking.cookRecipe('reedcarp-stew',{actor:sandbox.me}).ok,true,'nearby available recipe cooks');
assert.deepEqual({fish:inventory.fish_reedcarp,food:inventory.food,meal:inventory.meal_river_stew},{fish:1,food:2,meal:1},'cooking atomically consumes ingredients and grants one meal');
unlockedRecipes.add('guide-trail-stew');
assert.equal(cooking.cookRecipe('guide-trail-stew',{actor:sandbox.me}).ok,true,'the unlocked social recipe is usable through the same cooking transaction');
assert.equal(inventory.meal_trail_stew,1,'the social unlock grants a real cookable survival meal');

const now=Date.now();
const eaten=cooking.eatMeal('meal_river_stew',{actor:sandbox.me,now});
assert.equal(eaten.ok,true);
assert.deepEqual({hp:sandbox.me.hp,hunger:sandbox.me.hunger,sanity:sandbox.me.sanity},{hp:58,hunger:58,sanity:38},'eating applies configured survival effects');
assert.equal(inventory.meal_river_stew,0,'eating consumes the meal');
assert.equal(sandbox.ABYSSAL_SURVIVAL_NEEDS_V1.hasFoodBuff('steady-breath',now+1),true);
assert.equal(sandbox.ABYSSAL_SURVIVAL_NEEDS_V1.sanityDrainMultiplier(now+1),0.82,'the meal buff reduces field sanity drain');
assert.ok(playerStateEvents.some(event=>event.type==='abyssal:player-food-state-v1'&&event.detail.buffs.some(buff=>buff.id==='steady-breath')),'meal effects publish the timed food-buff view for teammate display');
assert.equal(sandbox.ABYSSAL_COOKING_V1.eatMeal('meal_river_stew',{actor:sandbox.me,now}).reason,'materials-required','a consumed meal cannot grant its effect twice');
assert.equal(savedExtensions?.owners?.['survival.food-effects.v1']?.buffs?.[0]?.id,'steady-breath','food effects are part of the V5 owner-extension save');

inventory.meal_glass_porridge=1;
const before={hp:sandbox.me.hp,hunger:sandbox.me.hunger,sanity:sandbox.me.sanity,buffs:sandbox.ABYSSAL_SURVIVAL_FOOD_V1.active(now)};
saveResult=false;
const failed=cooking.eatMeal('meal_glass_porridge',{actor:sandbox.me,now});
assert.equal(failed.reason,'save-failed','failed persistence rejects the food action');
assert.equal(inventory.meal_glass_porridge,1,'failed save restores the meal');
assert.deepEqual({hp:sandbox.me.hp,hunger:sandbox.me.hunger,sanity:sandbox.me.sanity},{hp:before.hp,hunger:before.hunger,sanity:before.sanity},'failed save restores survival state');
assert.deepEqual(sandbox.ABYSSAL_SURVIVAL_FOOD_V1.active(now),before.buffs,'failed save restores timed buffs');
assert.ok(saveCalls>=3,'each successful or attempted cooking transaction persists through the existing save hook');

console.log(JSON.stringify({ok:true,recipes:4,socialRecipeGate:true,atomicCooking:true,mealEffects:true,sanityBuff:true,saveRollback:true,v5Extension:true}));
