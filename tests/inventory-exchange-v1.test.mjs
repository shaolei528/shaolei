import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../modules/items/inventory-transactions-v1.js',import.meta.url),'utf8');
const inventory={wood:0,stone:0,food:1,shard:0,seed:2,egg:0,milk:0,wool:0,fish_reedcarp:0,fish_glassminnow:0,fish_holloweye:0,companion_egg:0,meal_river_stew:0,meal_glass_porridge:0,meal_holloweye_chowder:0,knife:false,lantern:false};
let saved=true,updates=0;
const context=vm.createContext({inventory,saveLocal:()=>saved,updateUI:()=>updates++,globalThis:null});context.globalThis=context;
vm.runInContext(source,context,{filename:'inventory-transactions-v1.js'});
const api=context.ABYSSAL_INVENTORY_TRANSACTIONS_V1;

assert.deepEqual({...api.commitItemExchange({costs:{seed:1},grants:{food:2,seed:1}})},{ok:true});
assert.equal(inventory.seed,2,'a harvest can consume and return a seed in one inventory transaction');
assert.equal(inventory.food,3);
assert.equal(updates,1);

assert.deepEqual({...api.commitItemExchange({costs:{food:1},grants:{egg:2,milk:1,wool:1,fish_reedcarp:1}})},{ok:true});
assert.deepEqual({food:inventory.food,egg:inventory.egg,milk:inventory.milk,wool:inventory.wool,fish:inventory.fish_reedcarp},{food:2,egg:2,milk:1,wool:1,fish:1},'animal products and fish must use the same atomic inventory transaction');

saved=false;
assert.deepEqual({...api.commitItemExchange({costs:{seed:1},grants:{food:2}})},{ok:false,reason:'save-failed'});
assert.equal(inventory.seed,2,'failed save restores consumed seeds');
assert.equal(inventory.food,2,'failed save restores output items');
assert.deepEqual({...api.commitItemExchange({costs:{seed:1},grants:{invalid:1}})},{ok:false,reason:'invalid-exchange'});
assert.equal(updates,2,'failed and invalid exchanges do not refresh UI');

console.log(JSON.stringify({ok:true,atomicSeedAndFoodExchange:true,failedSaveRollback:true,invalidOutputRejected:true}));
