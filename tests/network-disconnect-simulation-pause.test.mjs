import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../modules/main-loop/simulation-update.js',import.meta.url),'utf8');
function runUpdate(zoneConnected){
  const calls=[];
  const sandbox={
    started:true,zoneConnected,WORLD:{w:4800,h:4800},currentZone:'1:1',switching:false,attackCd:1,dashCd:1,attackFlash:1,dead:false,
    joystickState:{x:1,y:0},isMoving:false,walkClock:0,me:{x:100,y:100,dir:0},
    inCamp(){return false;},zoneOf(){return '1:1';},switchZone(){},dashQueued:false,clamp(value,min,max){return Math.max(min,Math.min(max,value));},
    wasInCamp:false,hasLeftCamp:false,fieldGraceUntil:0,Date,
    ABYSSAL_HOME_WORKBENCH_V1:{departureWardMs(){return 15000;}},
    toast(){calls.push('toast');},applyLocalSurvival(){calls.push('survival');},
    remotes:new Map(),lerp(a,b,t){return a+(b-a)*t;},zoneLeader:true,updateMobs(){calls.push('mobs');},
    moveTimer:0,adaptiveInterval(){return .14;},sendMove(){calls.push('move');},mobSendTimer:0,mobs:[],zoneCh:null,
    pingTimer:0,measurePing(){calls.push('ping');},globalTrackTimer:0,globalCh:null,globalMeta(){return{};},
    saveTimer:0,saveLocal(){calls.push('save');},uiTimer:0,updateUI(){calls.push('ui');}
  };
  vm.createContext(sandbox);
  vm.runInContext(`${source}\nupdate(.5);`,sandbox,{filename:'simulation-update.js'});
  return{sandbox,calls};
}

{
  const {sandbox,calls}=runUpdate(false);
  assert.deepEqual({x:sandbox.me.x,attackCd:sandbox.attackCd,dashCd:sandbox.dashCd,walkClock:sandbox.walkClock},{x:100,attackCd:1,dashCd:1,walkClock:0},'movement and combat timers must pause without an active zone subscription');
  assert.deepEqual(calls,[],'survival, mobs, network sends, and saves must pause while disconnected');
}

{
  const {sandbox,calls}=runUpdate(true);
  assert.ok(sandbox.me.x>100,'movement must resume after zone subscription returns');
  assert.ok(calls.includes('survival'),'survival simulation must resume after reconnection');
}

console.log(JSON.stringify({ok:true,disconnected:'simulation-and-save-paused',reconnected:'simulation-resumes'}));
