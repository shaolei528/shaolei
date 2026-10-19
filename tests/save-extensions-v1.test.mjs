import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../modules/core/save-extensions-v1.js',import.meta.url),'utf8');
const stored={v:5,extensions:{version:1,owners:{'world.boss-progression.v1':{cleared:['fen-warden'],claimed:[]}}}};
const localStorage={getItem:key=>key==='abyssal_wake_save_v5'?JSON.stringify(stored):null};
const context=vm.createContext({STORAGE_KEY:'abyssal_wake_save_v5',localStorage,globalThis:null,console});
context.globalThis=context;
vm.runInContext(source,context,{filename:'save-extensions-v1.js'});
let restored=null,state={cleared:['fen-warden'],claimed:[]};
assert.equal(context.ABYSSAL_SAVE_EXTENSIONS_V1.register('world.boss-progression.v1',{snapshot:()=>state,restore:value=>{restored=value}}),true);
assert.deepEqual(JSON.parse(JSON.stringify(restored)),stored.extensions.owners['world.boss-progression.v1']);
state={cleared:['fen-warden'],claimed:['boss:fen-warden:clear:v1']};
assert.deepEqual(JSON.parse(JSON.stringify(context.ABYSSAL_SAVE_EXTENSIONS_V1.snapshot())),{version:1,owners:{'world.boss-progression.v1':state}});
assert.equal(context.ABYSSAL_SAVE_EXTENSIONS_V1.register('world.boss-progression.v1',{snapshot:()=>({}),restore:()=>{}}),false,'duplicate owners cannot replace a registered save provider');

const runtime=fs.readFileSync(new URL('../modules/core/runtime-state.js',import.meta.url),'utf8');
assert.match(runtime,/extensions:globalThis\.ABYSSAL_SAVE_EXTENSIONS_V1\?\.snapshot\?\.\(\)/,'the existing v5 record carries additive owner snapshots');
assert.ok(runtime.includes("STORAGE_KEY='abyssal_wake_save_v5'"),'the save key and old format remain compatible');

console.log(JSON.stringify({ok:true,v5OwnerHydration:true,snapshot:true,duplicateOwnerRejected:true}));
