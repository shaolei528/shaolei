import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const farmingConfig=JSON.parse(read('data/farming/crops-v1.json'));
const livestockConfig=JSON.parse(read('data/farming/livestock-v1.json'));
const fishingConfig=JSON.parse(read('data/fishing/fish-v1.json'));
const cookingConfig=JSON.parse(read('data/cooking/recipes-v1.json'));
const saveSource=read('modules/core/save-extensions-v1.js');
const inventorySource=read('modules/items/inventory-transactions-v1.js');
const needsSource=read('modules/survival/needs-consumption-v1.js');
const foodEffectsSource=read('modules/survival/food-effects-v1.js');
const farmingSource=read('modules/farming/farming-v1.js');
const livestockSource=read('modules/farming/livestock-v1.js');
const fishingSource=read('modules/fishing/fishing-v1.js');
const cookingSource=read('modules/cooking/cooking-v1.js');

let savedRecord=null;
let now=1000;
class FixedDate extends Date{static now(){return now;}}
const water={getAccessPoint:id=>id==='camp-pool'?{x:2770,y:2374,interactionRange:54}:null};
const CAMP={x:2400,y:2400,r:470};
const inventorySeed={
  wood:0,stone:0,food:2,shard:0,seed:3,egg:0,milk:0,wool:0,
  fish_reedcarp:0,fish_glassminnow:0,fish_holloweye:0,
  meal_river_stew:0,meal_glass_porridge:0,meal_holloweye_chowder:0,meal_trail_stew:0,
  companion_egg:0,knife:false,lantern:false
};

function makeSandbox(inventory={...inventorySeed},stored=savedRecord){
  let sandbox;
  sandbox={
    ABYSSAL_FARMING_CONFIG_V1:farmingConfig,
    ABYSSAL_LIVESTOCK_CONFIG_V1:livestockConfig,
    ABYSSAL_FISHING_CONFIG_V1:fishingConfig,
    ABYSSAL_COOKING_CONFIG_V1:cookingConfig,
    ABYSSAL_WATER_BODIES_V1:water,
    STORAGE_KEY:'abyssal_wake_save_v5',
    SESSION_ID:'food-chain-player',currentZone:'1:1',CAMP,started:true,dead:false,
    me:{x:2770,y:2374,hp:40,hunger:18,sanity:26},inventory,
    localStorage:{getItem:()=>stored?JSON.stringify(stored):null},
    inCamp:actor=>Math.hypot(actor.x-CAMP.x,actor.y-CAMP.y)<CAMP.r,
    clamp:(value,min,max)=>Math.max(min,Math.min(max,value)),
    Date:FixedDate,Math,Map,Set,console,
    window:null,globalThis:null,
    CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail;}},
    dispatchEvent(){return true;},toast(){},updateUI(){},
    saveLocal(){
      savedRecord={v:5,inventory:{...sandbox.inventory},extensions:sandbox.ABYSSAL_SAVE_EXTENSIONS_V1.snapshot()};
      return true;
    }
  };
  sandbox.window=sandbox;
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  for(const[source,name]of[
    [saveSource,'save-extensions-v1.js'],
    [inventorySource,'inventory-transactions-v1.js'],
    [needsSource,'needs-consumption-v1.js'],
    [foodEffectsSource,'food-effects-v1.js'],
    [farmingSource,'farming-v1.js'],
    [livestockSource,'livestock-v1.js'],
    [fishingSource,'fishing-v1.js'],
    [cookingSource,'cooking-v1.js']
  ])vm.runInContext(source,sandbox,{filename:name});
  return sandbox;
}

const player=makeSandbox({...inventorySeed,food:0,seed:1});
assert.equal(player.ABYSSAL_FARMING_V1.plantCrop('camp-bed-1',{now:1000}).ok,true,'a seed starts a real camp crop');
now=43_000;
assert.deepEqual(
  {...player.ABYSSAL_FARMING_V1.harvestCrop('camp-bed-1',{now}).yield},
  {food:2,seed:1},
  'a grown crop supplies the food used to care for animals'
);
assert.deepEqual({food:player.inventory.food,seed:player.inventory.seed},{food:2,seed:1});

const cow=player.ABYSSAL_LIVESTOCK_V1.getSnapshot(now).find(animal=>animal.id==='cow-a');
player.me.x=cow.x;player.me.y=cow.y;
now=44_000;
assert.equal(player.ABYSSAL_LIVESTOCK_V1.interact(cow.id,{now,actor:player.me}).ok,true,'farm food feeds a cow through its normal owner command');
now=72_000;
assert.equal(player.ABYSSAL_LIVESTOCK_V1.interact(cow.id,{now,actor:player.me}).item,'milk','the cared-for animal produces a cooking ingredient');
assert.deepEqual({food:player.inventory.food,milk:player.inventory.milk},{food:1,milk:1});

player.me.x=2770;player.me.y=2374;
now=75_000;
const cast=player.ABYSSAL_FISHING_V1.castFishingLine({now,random:()=>0});
assert.equal(cast.ok,true,'the player can cast from the reachable camp pond');
assert.equal(player.ABYSSAL_FISHING_V1.reelIn({now:76_801,random:()=>.62}).item,'fish_glassminnow','the bite grants the matching fish ingredient');
assert.equal(player.inventory.fish_glassminnow,1);

player.me.x=CAMP.x;
player.me.y=CAMP.y;
const cooked=player.ABYSSAL_COOKING_V1.cookRecipe('glassmilk-porridge',{actor:player.me});
assert.equal(cooked.ok,true,'farm, livestock, and fishing ingredients become a meal at the fire');
assert.deepEqual(
  {fish:player.inventory.fish_glassminnow,milk:player.inventory.milk,food:player.inventory.food,meal:player.inventory.meal_glass_porridge},
  {fish:0,milk:0,food:1,meal:1},
  'the meal transaction consumes both ingredients exactly once'
);

now=80_000;
const eaten=player.ABYSSAL_COOKING_V1.eatMeal('meal_glass_porridge',{actor:player.me,now});
assert.equal(eaten.ok,true,'the meal restores survival needs');
assert.deepEqual(
  {hp:player.me.hp,hunger:player.me.hunger,sanity:player.me.sanity,meal:player.inventory.meal_glass_porridge},
  {hp:46,hunger:50,sanity:44,meal:0},
  'the cooked meal is consumed while healing and restoring sanity'
);
assert.equal(player.ABYSSAL_SURVIVAL_NEEDS_V1.sanityDrainMultiplier(now+1),0.68,'the cooked buff reduces later field sanity drain');

const reloaded=makeSandbox({...savedRecord.inventory},savedRecord);
assert.equal(reloaded.ABYSSAL_FARMING_V1.getSnapshot(now)[0].stage,'empty','the harvested plot stays empty after reload');
assert.equal(reloaded.ABYSSAL_LIVESTOCK_V1.getSnapshot(now).find(animal=>animal.id==='cow-a').productStage,'none','the collected milk is not awarded twice after reload');
assert.equal(reloaded.ABYSSAL_FISHING_V1.getSnapshot(now+1).catches[0],'glassminnow','the same save retains the fishing journal');
assert.equal(reloaded.ABYSSAL_SURVIVAL_FOOD_V1.hasBuff('clear-water',now+1),true,'the same save retains the survival buff');
assert.equal(reloaded.inventory.fish_glassminnow,0);
assert.equal(reloaded.inventory.milk,0);
assert.equal(reloaded.inventory.meal_glass_porridge,0);

console.log(JSON.stringify({ok:true,chain:['farming','livestock','fishing','cooking','survival','v5-reload'],crop:'saltwind-greens',animalProduct:'milk',fish:'glassminnow',meal:'glassmilk-porridge',buff:'clear-water'}));
