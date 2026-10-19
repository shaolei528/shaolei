import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const runtime=fs.readFileSync(new URL('../modules/core/runtime-state.js',import.meta.url),'utf8');
const legacyAggregate=fs.readFileSync(new URL('../game-core.js',import.meta.url),'utf8');

function runLoadLocal({now,v5=null,v4=null,rawV5=null,runtimeSource=runtime}){
  const start=runtimeSource.indexOf('function loadLocal(){');
  const end=runtimeSource.indexOf('loadLocal();',start);
  assert.ok(start>=0&&end>start,'loadLocal implementation must be present');
  const loadLocalSource=runtimeSource.slice(start,end);
  const values=new Map();
  if(rawV5!==null)values.set('abyssal_wake_save_v5',rawV5);
  else if(v5!==null)values.set('abyssal_wake_save_v5',JSON.stringify(v5));
  if(v4!==null)values.set('abyssal_wake_save_v4',JSON.stringify(v4));
  const state={
    Date:{now:()=>now},
    localStorage:{getItem:key=>values.get(key)??null},
    STORAGE_KEY:'abyssal_wake_save_v5',OLD_STORAGE_KEY:'abyssal_wake_save_v4',
    inventory:{wood:0,stone:0,food:2,shard:0,knife:false,lantern:false},
    me:{x:2400,y:2470,hp:100,hunger:100,sanity:100},hasLeftCamp:false,
    nameInput:{value:''},CAMP:{x:2400,y:2400},WORLD:{w:4800,h:4800},
    clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
    finite:(v,f=0)=>Number.isFinite(Number(v))?Number(v):f,
    clean:s=>(String(s||'').replace(/[<>]/g,'').trim().slice(0,16)||'Wanderer')
  };
  vm.createContext(state);
  vm.runInContext(`${loadLocalSource}\nloadLocal();`,state);
  return state;
}

const now=2_000_000_000_000;
const oldV5={v:5,at:now-49*60*60*1000,name:'Latest',x:900,y:1100,hp:63,hunger:41,sanity:72,inventory:{wood:19,food:8},hasLeftCamp:true};
const oldV4={v:4,name:'Legacy',hunger:80,inventory:{wood:2,stone:5}};

const v5Only=runLoadLocal({now,v5:oldV5});
assert.equal(v5Only.me.x,900,'an aged v5 save must restore player position');
assert.equal(v5Only.me.y,1100,'an aged v5 save must restore player position');
assert.equal(v5Only.me.hp,63,'an aged v5 save must restore health');
assert.equal(v5Only.inventory.wood,19,'an aged v5 save must restore inventory');
assert.equal(v5Only.hasLeftCamp,true,'an aged v5 save must restore expedition state');

const both=runLoadLocal({now,v5:oldV5,v4:oldV4});
assert.equal(both.nameInput.value,'Latest','older v4 data must not override a valid v5 save');
assert.equal(both.me.x,900,'valid v5 data must take priority over legacy v4');
assert.equal(both.inventory.wood,19,'valid v5 inventory must take priority over legacy v4');

const migrated=runLoadLocal({now,v4:oldV4});
assert.equal(migrated.me.x,2400,'v4 migration must still place the player in camp');
assert.equal(migrated.inventory.wood,2,'v4 migration must still restore legacy inventory');

const recoveredFromCorruptV5=runLoadLocal({now,rawV5:'{broken-json',v4:oldV4});
assert.equal(recoveredFromCorruptV5.inventory.wood,2,'a malformed V5 record must not block a valid V4 fallback');
assert.equal(recoveredFromCorruptV5.me.x,2400,'corrupt V5 fallback must preserve the V4 migration spawn behavior');

const legacyRecovery=runLoadLocal({now,rawV5:'{broken-json',v4:oldV4,runtimeSource:legacyAggregate});
assert.equal(legacyRecovery.inventory.wood,2,'the legacy aggregate entry must also recover from corrupt V5 using valid V4');

console.log(JSON.stringify({ok:true,agedV5:'restored',v5Priority:'preserved',v4Migration:'preserved',corruptV5Fallback:'module+legacy'}));
