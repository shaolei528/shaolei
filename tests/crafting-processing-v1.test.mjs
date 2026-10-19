import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const inventorySource=read('modules/items/inventory-transactions-v1.js');
const survivalSource=read('modules/survival/needs-consumption-v1.js');
const craftingSource=read('modules/crafting/crafting-processing-v1.js');
const baseInteractionSource=read('modules/safe-camp/base-interactions.js');
const bootSource=read('survival-v21.html');
const recipeData=JSON.parse(read('data/crafting/recipes-v1.json'));

function createRuntime({saveResult=true,atWorkbench=true,inventory={wood:4,stone:3,food:2,shard:2,knife:false,lantern:false},hunger=40,hp=50}={}){
  let saveCalls=0,uiCalls=0;
  const toasts=[],listeners=new Map();
  const sandbox={
    console,Date,dead:false,inventory,me:{hunger,hp},
    ABYSSAL_CRAFTING_RECIPES_V1:recipeData,
    inCamp:()=>atWorkbench,
    saveLocal(){saveCalls++;return saveResult;},
    updateUI(){uiCalls++;},
    toast(message){toasts.push(String(message));},
    craftPanel:{addEventListener(type,fn){listeners.set(type,fn);}},
    ABYSSAL_INTERACTION_V12:{getTarget:()=>atWorkbench?{type:'workbench'}:null}
  };
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  sandbox.clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  vm.createContext(sandbox);
  vm.runInContext(inventorySource,sandbox,{filename:'inventory-transactions-v1.js'});
  vm.runInContext(survivalSource,sandbox,{filename:'status.js'});
  vm.runInContext(craftingSource,sandbox,{filename:'crafting-processing-v1.js'});
  return{sandbox,listeners,toasts,getSaveCalls:()=>saveCalls,getUiCalls:()=>uiCalls};
}

// The shipped V21 entry must load its own recipe handler and Inventory transaction owner.
assert.match(bootSource,/modules\/items\/inventory-transactions-v1\.js/);
assert.match(bootSource,/modules\/crafting\/crafting-processing-v1\.js/);
assert.match(bootSource,/data\/crafting\/recipes-v1\.json/,'V21 must load the data-owned recipe catalog before gameplay modules');
assert.deepEqual(recipeData.recipes.knife.costs,{wood:4,stone:3});
assert.deepEqual(recipeData.recipes.meal,{station:'workbench',costs:{food:2},effects:{hunger:48,hp:10},messages:{success:'野外口粮已食用',materialsRequired:'需要 2 份食物。',noNeed:'状态良好，不需要消耗口粮。',saveFailed:'进食未保存，食物和状态已恢复。',unavailable:'现在无法食用。'}});
assert.ok(bootSource.indexOf('modules/core/runtime-state.js')<bootSource.indexOf('modules/items/inventory-transactions-v1.js'));
assert.ok(bootSource.indexOf('modules/items/inventory-transactions-v1.js')<bootSource.indexOf('modules/survival/needs-consumption-v1.js'));
assert.ok(bootSource.indexOf('modules/survival/needs-consumption-v1.js')<bootSource.indexOf('modules/crafting/crafting-processing-v1.js'));
assert.ok(bootSource.indexOf('modules/input/interaction-v12.js')<bootSource.indexOf('modules/crafting/crafting-processing-v1.js'));

// Exact Bone Knife recipe commits once and reports duplicate equipment without charging again.
{
  const runtime=createRuntime();
  const s=runtime.sandbox;
  const result=s.ABYSSAL_CRAFTING_PROCESSING_V1.craft('knife');
  assert.equal(result.ok,true);
  assert.equal(s.inventory.wood,0);
  assert.equal(s.inventory.stone,0);
  assert.equal(s.inventory.knife,true);
  assert.equal(runtime.getSaveCalls(),1);
  assert.equal(runtime.getUiCalls(),1);
  assert.equal(s.ABYSSAL_CRAFTING_PROCESSING_V1.craft('knife').reason,'already-owned');
  assert.equal(runtime.getSaveCalls(),1);
}

// Do not charge food when both survival bars are already effectively full.
{
  const runtime=createRuntime({inventory:{wood:0,stone:0,food:2,shard:0,knife:false,lantern:false},hunger:100,hp:100});
  const s=runtime.sandbox;
  const result=s.ABYSSAL_CRAFTING_PROCESSING_V1.craft('meal');
  assert.equal(result.reason,'no-need');
  assert.equal(s.inventory.food,2);
  assert.equal(s.me.hunger,100);
  assert.equal(s.me.hp,100);
  assert.equal(runtime.getSaveCalls(),0);
}

// Lantern and meal preserve their established costs and effects through their domain owners.
{
  const runtime=createRuntime({inventory:{wood:3,stone:0,food:2,shard:2,knife:false,lantern:false}});
  const s=runtime.sandbox;
  assert.equal(s.ABYSSAL_CRAFTING_PROCESSING_V1.craft('lantern').ok,true);
  assert.equal(s.inventory.wood,0);
  assert.equal(s.inventory.shard,0);
  assert.equal(s.inventory.lantern,true);
  assert.equal(s.ABYSSAL_CRAFTING_PROCESSING_V1.craft('meal').ok,true);
  assert.equal(s.inventory.food,0);
  assert.equal(s.me.hunger,88);
  assert.equal(s.me.hp,60);
  assert.equal(runtime.getSaveCalls(),2);
}

// Insufficient materials and a stale/non-workbench panel do not change inventory or save.
{
  const runtime=createRuntime({inventory:{wood:3,stone:3,food:1,shard:2,knife:false,lantern:false}});
  const s=runtime.sandbox;
  assert.equal(s.ABYSSAL_CRAFTING_PROCESSING_V1.craft('knife').reason,'materials-required');
  assert.equal(s.inventory.wood,3);
  assert.equal(s.inventory.stone,3);
  assert.equal(s.ABYSSAL_CRAFTING_PROCESSING_V1.craft('meal').reason,'materials-required');
  assert.equal(runtime.getSaveCalls(),0);
  const away=createRuntime({atWorkbench:false});
  assert.equal(away.sandbox.ABYSSAL_CRAFTING_PROCESSING_V1.craft('knife').reason,'workbench-required');
  assert.equal(away.sandbox.inventory.wood,4);
}

// A rejected player save restores both recipe materials and Survival-owned meal effects.
{
  const runtime=createRuntime({saveResult:false});
  const s=runtime.sandbox;
  assert.equal(s.ABYSSAL_CRAFTING_PROCESSING_V1.craft('knife').reason,'save-failed');
  assert.equal(s.inventory.wood,4);
  assert.equal(s.inventory.stone,3);
  assert.equal(s.inventory.knife,false);
  assert.equal(s.me.hunger,40);
  assert.equal(s.me.hp,50);
  assert.equal(s.ABYSSAL_CRAFTING_PROCESSING_V1.craft('meal').reason,'save-failed');
  assert.equal(s.inventory.food,2);
  assert.equal(s.me.hunger,40);
  assert.equal(s.me.hp,50);
  assert.equal(runtime.getSaveCalls(),2);
}

// The actual displayed data-craft click routes through the same service.
{
  const runtime=createRuntime();
  const s=runtime.sandbox;
  const handler=runtime.listeners.get('click');
  assert.equal(typeof handler,'function');
  let prevented=false;
  handler({target:{closest:()=>({dataset:{craft:'knife'}})},preventDefault(){prevented=true;}});
  assert.equal(prevented,true);
  assert.equal(s.inventory.knife,true);
  assert.equal(runtime.getSaveCalls(),1);
}

// V21 previously installed an older recipe click handler before the canonical owner.
// Reproduce both boot modules and ensure one visible click has one transaction and one toast.
{
  const handlers=[],toasts=[];let saves=0;
  const s={
    console,Date,dead:false,inventory:{wood:4,stone:3,food:1,shard:0,knife:false,lantern:false},
    ABYSSAL_CRAFTING_RECIPES_V1:recipeData,
    resources:[],harvested:new Map(),me:{hunger:50,hp:100},currentZone:'1:1',zoneCh:null,
    useBtn:{addEventListener(){}},closeCraft:{addEventListener(){}},
    craftPanel:{addEventListener(type,fn){if(type==='click')handlers.push(fn);}},
    inCamp:()=>true,saveLocal(){saves++;return true;},updateUI(){},toast(message){toasts.push(String(message));},
    distance:()=>Infinity
  };
  s.window=s;s.globalThis=s;s.clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  s.ABYSSAL_INTERACTION_V12={getTarget:()=>({type:'workbench'})};
  vm.createContext(s);
  vm.runInContext(inventorySource,s,{filename:'inventory-transactions-v1.js'});
  vm.runInContext(baseInteractionSource,s,{filename:'base-interactions.js'});
  assert.equal(handlers.length,0,'the legacy SafeCamp module must not register a second recipe handler');
  vm.runInContext(craftingSource,s,{filename:'crafting-processing-v1.js'});
  assert.equal(handlers.length,1,'V21 must have exactly one owner for visible recipe clicks');
  const event={target:{closest:()=>({dataset:{craft:'knife'}})},preventDefault(){}};
  for(const handler of handlers)handler(event);
  assert.equal(s.inventory.knife,true);
  assert.equal(s.inventory.wood,0);
  assert.equal(s.inventory.stone,0);
  assert.equal(saves,1,'one player click must commit exactly one save transaction');
  assert.deepEqual(toasts,['制作成功：骨刃已装备。'],'one player click must not end with a stale duplicate-craft error');
}

console.log(JSON.stringify({ok:true,recipes:['knife','lantern','meal'],inventoryOwner:'atomic-local-save',survival:'meal-effects-with-rollback',stationGate:true,relay:'unchanged'}));
