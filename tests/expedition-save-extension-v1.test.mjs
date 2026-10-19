import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const saveSource=fs.readFileSync(new URL('../modules/core/save-extensions-v1.js',import.meta.url),'utf8');
const expeditionSource=fs.readFileSync(new URL('../modules/world/awakening-expedition-loop-v1.js',import.meta.url),'utf8');
const stored={raw:null},returnRecords=[];
const CAMP={x:2400,y:2400,r:500};
class TestDate extends Date{static now(){return 2000}}

function boot({dead=false,position={x:2400,y:1800}}={}){
  let context;
  const localStorage={
    getItem:()=>stored.raw,
    setItem:(_key,value)=>{stored.raw=value;}
  };
  const contextInventory={wood:4,stone:3,food:0,shard:0,knife:true,lantern:true};
  try{
    const record=JSON.parse(stored.raw||'null');
    if(record?.v===5&&record.inventory)Object.assign(contextInventory,record.inventory);
  }catch{}
  context=vm.createContext({
    console,Date:TestDate,window:null,globalThis:null,STORAGE_KEY:'abyssal_wake_save_v5',localStorage,
    CAMP,me:{x:position.x,y:position.y},inventory:contextInventory,currentZone:'1:1',started:true,dead,
    questText:{textContent:''},fieldGraceUntil:0,updateQuest:()=>{},
    ABYSSAL_AWAKENING_WORLD_V1:{poi:{x:2112,y:640,w:640,h:448,parking:{x:2048,y:1088,w:768,h:288}}},
    ABYSSAL_HOME_WORKBENCH_V1:{recordExpeditionReturn:()=>{returnRecords.push('completed');return{returnClearancePersisted:true};},getState:()=>({tier:0})},
    inCamp:player=>Math.hypot(player.x-CAMP.x,player.y-CAMP.y)<CAMP.r,
    saveLocal(){
      const extensions=context.ABYSSAL_SAVE_EXTENSIONS_V1?.snapshot?.()||{version:1,owners:{}};
      localStorage.setItem('abyssal_wake_save_v5',JSON.stringify({v:5,inventory:{...context.inventory},extensions}));
      return true;
    },
    toast:()=>{}
  });
  context.window=context;context.globalThis=context;
  vm.runInContext(saveSource,context,{filename:'save-extensions-v1.js'});
  vm.runInContext(expeditionSource,context,{filename:'awakening-expedition-loop-v1.js'});
  return context;
}

let game=boot();
game.updateQuest();
assert.equal(game.ABYSSAL_EXPEDITION_LOOP_V1.state.phase,'LEAVE_HOME');
game.updateQuest();
assert.equal(game.ABYSSAL_EXPEDITION_LOOP_V1.state.phase,'REACH_MIRE_MART');
assert.equal(JSON.parse(stored.raw).extensions.owners['world.expedition-loop.v1'].phase,'REACH_MIRE_MART');

game=boot();
assert.equal(game.ABYSSAL_EXPEDITION_LOOP_V1.state.phase,'REACH_MIRE_MART','the route resumes after reloading the V5 save');
game.me.x=2400;game.me.y=800;
game.updateQuest();
assert.equal(game.ABYSSAL_EXPEDITION_LOOP_V1.state.phase,'SEARCH_FIGHT');

game=boot();
assert.equal(game.ABYSSAL_EXPEDITION_LOOP_V1.state.phase,'SEARCH_FIGHT');
game.inventory.shard=2;
game.updateQuest();
assert.equal(game.ABYSSAL_EXPEDITION_LOOP_V1.state.phase,'SECURE_REQUIRED_SALVAGE');
game.me.x=2400;game.me.y=1800;
game.updateQuest();
assert.equal(game.ABYSSAL_EXPEDITION_LOOP_V1.state.phase,'RETURN_HOME');
game.me.x=CAMP.x;game.me.y=CAMP.y;
game.updateQuest();
assert.equal(game.ABYSSAL_EXPEDITION_LOOP_V1.state.phase,'COMPLETE');
assert.equal(returnRecords.length,1,'the return reward is recorded exactly once when the expedition completes');

game=boot();
assert.equal(game.ABYSSAL_EXPEDITION_LOOP_V1.state.phase,'COMPLETE');
assert.equal(game.ABYSSAL_EXPEDITION_LOOP_V1.state.completionAnnounced,true);
game.updateQuest();
assert.equal(returnRecords.length,1,'loading a completed route does not grant or announce its return reward again');

const saved=JSON.parse(stored.raw);
assert.equal(saved.v,5,'the existing save version remains unchanged');
assert.equal(saved.extensions.version,1,'the existing additive save extension envelope remains unchanged');
assert.equal(saved.inventory.shard,2,'player inventory persists alongside expedition progress');

stored.raw=JSON.stringify({v:5,inventory:{knife:false},extensions:{version:1,owners:{}}});
game=boot();
assert.equal(game.ABYSSAL_EXPEDITION_LOOP_V1.state.phase,'PREPARE','a legacy V5 save without an expedition owner starts cleanly');

stored.raw=null;
game=boot();
game.updateQuest();game.updateQuest();
game.dead=true;game.updateQuest();
assert.equal(JSON.parse(stored.raw).extensions.owners['world.expedition-loop.v1'].deathPending,true,'an interrupted expedition records its pending recovery');
game=boot({position:{x:CAMP.x,y:CAMP.y}});
assert.equal(game.ABYSSAL_EXPEDITION_LOOP_V1.state.deathPending,true,'the recovery marker survives a reload');
game.updateQuest();
assert.equal(game.ABYSSAL_EXPEDITION_LOOP_V1.state.attempt,2,'returning to camp after reload starts the next expedition attempt');
assert.equal(game.ABYSSAL_EXPEDITION_LOOP_V1.state.phase,'LEAVE_HOME');
console.log(JSON.stringify({ok:true,scope:'v5-save-extension-reload-simulation',phases:['REACH_MIRE_MART','SEARCH_FIGHT','SECURE_REQUIRED_SALVAGE','RETURN_HOME','COMPLETE'],returnRewards:1,saveVersion:saved.v}));
