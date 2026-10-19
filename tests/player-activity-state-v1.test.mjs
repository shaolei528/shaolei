import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../modules/network/player-activity-state-v1.js',import.meta.url),'utf8');
let now=1_000_000;
class TestDate extends Date{static now(){return now;}}
const listeners=new Map(),remotes=new Map([['friend',{}]]);
const sandbox={
  SESSION_ID:'local',Date:TestDate,Map,remotes,
  validMove:payload=>!!payload&&payload.id==='friend',
  onMove(payload){const remote=remotes.get(payload.id);if(remote)remote.x=payload.x;},
  window:{addEventListener(type,listener){listeners.set(type,listener);}},
};
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'player-activity-state-v1.js'});
const dispatch=(type,detail)=>listeners.get(type)?.({detail});
const sync=sandbox.ABYSSAL_PLAYER_ACTIVITY_SYNC_V1;

dispatch('abyssal:player-fishing-state-v1',{playerId:'someone-else',phase:'waiting',pondId:'camp-pool',remainingMs:1000,biteWindowMs:1200});
assert.equal(sync.getLocalSnapshot().fishing,null,'other players cannot change the local activity snapshot');
dispatch('abyssal:player-fishing-state-v1',{playerId:'local',phase:'waiting',pondId:'camp-pool',remainingMs:1000,biteWindowMs:1200});
assert.equal(sync.getLocalSnapshot().fishing.phase,'waiting','a local cast appears as waiting for a bite');
now+=1000;
const bite=sync.getLocalSnapshot().fishing;
assert.equal(bite.phase,'bite','the cast changes to bite after its wait timer');
assert.equal(bite.secondsLeft,2,'the remaining bite window is rounded for teammate display');
now+=1201;
assert.equal(sync.getLocalSnapshot().fishing.phase,'escaped','a missed bite closes without claiming a catch');
now+=2500;
assert.equal(sync.getLocalSnapshot().fishing,null,'the escaped feedback expires cleanly');

dispatch('abyssal:player-food-state-v1',{playerId:'local',buffs:[{id:'steady-breath',name:'稳息 <夜>',secondsLeft:120}]});
let food=sync.getLocalSnapshot().foodBuffs;
assert.equal(food[0].name,'稳息 夜','display text is sanitized');
now+=2000;
assert.equal(sync.getLocalSnapshot().foodBuffs[0].secondsLeft,118,'food buffs count down locally between move packets');
dispatch('abyssal:player-fishing-state-v1',{playerId:'local',phase:'caught',pondId:'camp-pool',fishName:'<空眼鱼>',holdMs:1500});
assert.equal(sync.getLocalSnapshot().fishing.fishName,'空眼鱼','catch feedback is safe to display to teammates');

sandbox.onMove({id:'friend',x:10,activity:{version:1,fishing:{phase:'bite',pondId:'camp-pool',secondsLeft:3},foodBuffs:[{id:'steady-breath',name:'稳息',secondsLeft:20}]}});
assert.equal(remotes.get('friend').activity.fishing.phase,'bite','valid remote activity is retained beside the teammate');
sandbox.onMove({id:'friend',x:11,activity:{version:7,fishing:null,foodBuffs:[]}});
assert.equal(remotes.get('friend').activity.fishing.phase,'bite','invalid remote activity cannot overwrite the last valid view');

console.log(JSON.stringify({ok:true,fishingPhases:true,foodBuffCountdown:true,remoteSanitization:true}));
