import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../modules/network/session-zone.js',import.meta.url),'utf8');
function fixture(zoneChannel){
  const toasts=[];
  const scheduled=[];
  const calls={mobSpawn:0,worldBroadcast:0,campStateBroadcast:0};
  const sandbox={
    cfg:{RELAY_URL:'wss://relay.fixture.invalid/ws'},started:false,STORAGE_KEY:'save-key',
    SESSION_ID:'player-local',zonePresenceIds:new Set(),zoneLeaderId:'',zoneLeader:false,mobs:[],
    me:{name:'',x:100,y:200,zone:'1:1'},nameInput:{value:'QA',addEventListener(){}},
    setup:{classList:{remove(){}},textContent:''},gate:{classList:{add(){}}},game:{classList:{remove(){}}},
    enterBtn:{addEventListener(){}},localStorage:{getItem(){return 'existing-save';}},
    CAMP:{x:100,y:200},camera:{},currentZone:'1:1',sessionStartedAt:0,wasInCamp:false,
    window:{ABYSSAL_CAMP_WORLD_SYNC_V1:{sendAll(){calls.campStateBroadcast++;}}},
    clean(value){return String(value||'');},zoneOf(){return '1:1';},inCamp(){return true;},
    resizeCanvas(){},seedZone(){},updateUI(){},connectGlobal(){},switchZone:async()=>zoneChannel,
    spawnMobs(){calls.mobSpawn++;},broadcastWorld(){calls.worldBroadcast++;},setTimeout(callback){scheduled.push(callback);return scheduled.length;},
    toast(message){toasts.push(message);},Date,Math
  };
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:'session-zone.js'});
  return {sandbox,toasts,scheduled,calls};
}

{
  const {sandbox,toasts}=fixture(null);
  await sandbox.enter();
  assert.equal(sandbox.started,true,'entry attempt remains active while reconnecting');
  assert.ok(toasts.includes('Connection lost. Reconnecting…'),'failed zone join must report reconnection');
  assert.equal(toasts.includes('Welcome to Mirewood Camp. You are safe here.'),false,'a failed zone join must not claim the player entered camp');
}

{
  const {sandbox,toasts}=fixture({key:'fixture-zone'});
  await sandbox.enter();
  assert.ok(toasts.includes('Welcome to Mirewood Camp. You are safe here.'),'successful zone subscription must retain the welcome message');
  assert.equal(toasts.includes('Connection lost. Reconnecting…'),false);
}

{
  const {sandbox,scheduled,calls}=fixture({key:'fixture-zone'});
  sandbox.zonePresenceIds=new Set(['player-local','player-other']);
  sandbox.zoneLeaderId='player-other';
  sandbox.zoneLeader=false;
  sandbox.electLeader();
  assert.equal(sandbox.zoneLeaderId,'player-local','the lowest presence id becomes the zone leader');
  assert.equal(sandbox.zoneLeader,true);
  assert.equal(calls.mobSpawn,1,'leader election retains existing mob authority handoff');
  assert.equal(scheduled.length,1,'leader election schedules its canonical snapshot');
  scheduled[0]();
  assert.equal(calls.worldBroadcast,1,'leader election still broadcasts the existing V21 world snapshot');
  assert.equal(calls.campStateBroadcast,1,'new leader also publishes farm, livestock and building snapshots');
}

console.log(JSON.stringify({ok:true,failedJoin:'reconnecting-message-no-false-welcome',successfulJoin:'welcome-preserved',leaderHandoff:'v21-world-and-camp-domain-snapshots'}));
