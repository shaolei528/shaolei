import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../modules/items/inventory-transactions-v1.js',import.meta.url),'utf8');
const inventory={wood:2,stone:1,food:0,shard:0,knife:false,lantern:false};
let saved=true,updates=0;
const context=vm.createContext({inventory,saveLocal:()=>saved,updateUI:()=>updates++,globalThis:null});
context.globalThis=context;
vm.runInContext(source,context,{filename:'inventory-transactions-v1.js'});
const api=context.ABYSSAL_INVENTORY_TRANSACTIONS_V1;

assert.deepEqual({...api.commitItemGrant({grants:{shard:3,food:2}})},{ok:true});
assert.equal(inventory.shard,3);
assert.equal(inventory.food,2);
assert.equal(updates,1);

saved=false;
assert.deepEqual({...api.commitItemGrant({grants:{shard:1}})},{ok:false,reason:'save-failed'});
assert.equal(inventory.shard,3,'failed saves roll back the item grant');
assert.deepEqual({...api.commitItemGrant({grants:{tentacle:1}})},{ok:false,reason:'invalid-grant'});
assert.equal(updates,1,'failed and invalid grants do not update the UI');

console.log(JSON.stringify({ok:true,validGrant:true,failedSaveRollback:true,invalidItemRejected:true}));
