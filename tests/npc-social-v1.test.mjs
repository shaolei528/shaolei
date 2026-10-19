import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const config=JSON.parse(read('data/social/npc-relationships-v1.json'));
const cookingConfig=JSON.parse(read('data/cooking/recipes-v1.json'));
const inventory={wood:0,stone:0,food:3,shard:0,seed:0,egg:1,milk:1,wool:1,fish_reedcarp:1,fish_glassminnow:1,fish_holloweye:0,companion_egg:0,meal_river_stew:0,meal_glass_porridge:0,meal_holloweye_chowder:0,meal_trail_stew:0,knife:false,lantern:false};
let saveResult=true,savedExtensions=null;
const sandbox={
  console,inventory,me:{x:2400,y:2400,hp:60,hunger:50,sanity:50,dir:0},
  currentZone:'1:1',SESSION_ID:'social-test',CAMP:{x:2400,y:2400,r:470},
  inCamp:actor=>Math.hypot(actor.x-2400,actor.y-2400)<470,
  ABYSSAL_CAMP_GUIDE_V1:{getSnapshot:()=>({x:2400,y:2400})},
  toast(){},dispatchEvent(){return true;},CustomEvent:class CustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail;}},
  localStorage:{getItem(){return null;}}
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
sandbox.saveLocal=()=>{if(saveResult)savedExtensions=sandbox.ABYSSAL_SAVE_EXTENSIONS_V1?.snapshot?.()||null;return saveResult;};
vm.createContext(sandbox);
sandbox.ABYSSAL_NPC_SOCIAL_CONFIG_V1=config;
sandbox.ABYSSAL_COOKING_CONFIG_V1=cookingConfig;
vm.runInContext(read('modules/items/inventory-transactions-v1.js'),sandbox,{filename:'inventory-transactions-v1.js'});
vm.runInContext(read('modules/core/save-extensions-v1.js'),sandbox,{filename:'save-extensions-v1.js'});
vm.runInContext(read('modules/social/npc-social-v1.js'),sandbox,{filename:'npc-social-v1.js'});
vm.runInContext(read('modules/cooking/cooking-v1.js'),sandbox,{filename:'cooking-v1.js'});

const social=sandbox.ABYSSAL_NPC_SOCIAL_V1,cooking=sandbox.ABYSSAL_COOKING_V1;
assert.equal(social.getSnapshot().favor,0);
assert.equal(cooking.listRecipes().find(recipe=>recipe.id==='guide-trail-stew').unlocked,false,'the recipe begins locked');
assert.equal(cooking.cookRecipe('guide-trail-stew',{actor:sandbox.me}).reason,'recipe-locked');
assert.equal(social.giveGift('food',{actor:{x:2200,y:2200}}).reason,'npc-required','gifts require the player to be beside the resident');
assert.equal(social.giveGift('companion_egg').reason,'gift-not-accepted','only data-listed gifts are accepted');
assert.equal(social.giveGift('food').ok,true);
assert.equal(social.getSnapshot().favor,1);
assert.equal(inventory.food,2,'one gift consumes one item');
const second=social.giveGift('food');
assert.equal(second.ok,true);
assert.equal(second.newlyUnlocked[0]?.id,'guide-trail-stew','the favor threshold unlocks exactly the configured recipe');
assert.equal(social.hasUnlock('guide-trail-stew'),true);
assert.equal(cooking.listRecipes().find(recipe=>recipe.id==='guide-trail-stew').unlocked,true);
assert.equal(cooking.cookRecipe('guide-trail-stew',{actor:sandbox.me}).ok,true,'the relationship reward leads to a playable recipe');
assert.equal(inventory.meal_trail_stew,1);
assert.equal(savedExtensions?.owners?.['social.npc-relationships.v1']?.favor,2,'relationship state persists through the V5 owner extension');

inventory.milk=1;saveResult=false;
const failed=social.giveGift('milk');
assert.equal(failed.reason,'save-failed');
assert.equal(inventory.milk,1,'failed persistence restores the gift item');
assert.equal(social.getSnapshot().favor,2,'failed persistence restores favor and unlock state');

const restored={console,inventory:{...inventory},currentZone:'1:1',SESSION_ID:'social-reload',CAMP:sandbox.CAMP,inCamp:sandbox.inCamp,ABYSSAL_CAMP_GUIDE_V1:sandbox.ABYSSAL_CAMP_GUIDE_V1,toast(){},dispatchEvent(){return true;},CustomEvent:sandbox.CustomEvent,localStorage:{getItem:()=>JSON.stringify({v:5,extensions:savedExtensions})}};
restored.window=restored;restored.globalThis=restored;restored.saveLocal=()=>true;vm.createContext(restored);restored.ABYSSAL_NPC_SOCIAL_CONFIG_V1=config;
vm.runInContext(read('modules/core/save-extensions-v1.js'),restored,{filename:'save-extensions-v1.js'});
vm.runInContext(read('modules/social/npc-social-v1.js'),restored,{filename:'npc-social-v1.js'});
assert.equal(restored.ABYSSAL_NPC_SOCIAL_V1.getSnapshot().favor,2,'relationship survives a V5 save reload');
assert.equal(restored.ABYSSAL_NPC_SOCIAL_V1.hasUnlock('guide-trail-stew'),true,'the saved unlock survives reload');

console.log(JSON.stringify({ok:true,giftTransaction:true,favor:true,recipeUnlock:true,saveRollback:true,v5Reload:true}));
