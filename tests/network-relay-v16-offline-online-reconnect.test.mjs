import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../modules/network/network-relay-v16.js',import.meta.url),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));

class FakeWebSocket{
  static OPEN=1;
  static instances=[];
  constructor(url){this.url=url;this.readyState=0;this.handlers={};this.sent=[];FakeWebSocket.instances.push(this);}
  addEventListener(type,handler){(this.handlers[type]??=[]).push(handler);}
  send(message){this.sent.push(JSON.parse(message));}
  open(){this.readyState=FakeWebSocket.OPEN;this.emit('open',{});}
  message(data){this.emit('message',{data:JSON.stringify(data)});}
  close(){if(this.readyState===3)return;this.readyState=3;this.emit('close',{});}
  emit(type,event){for(const handler of this.handlers[type]||[])handler(event);}
}

const timers=[];
const listeners={};
const makeElement=()=>({id:'',style:{},textContent:'',className:'',addEventListener(){},appendChild(){}});
const sandbox={
  console:{warn(){},log(){},error(){}},window:null,URLSearchParams,location:{search:''},navigator:{onLine:true},
  cfg:{RELAY_URL:'wss://relay.fixture.invalid/ws',WORLD_CHANNEL:'fixture-world'},WebSocket:FakeWebSocket,
  document:{getElementById(){return null;},createElement(){return makeElement();}},game:makeElement(),
  connectionEl:makeElement(),pingEl:makeElement(),jitterEl:makeElement(),lossEl:makeElement(),onlineEl:makeElement(),
  globalConnected:false,zoneConnected:false,globalPresenceIds:new Set(),zonePresenceIds:new Set(),started:true,
  globalCh:null,zoneCh:null,currentZone:'1:1',switchNonce:0,switching:false,zoneLeader:false,zoneLeaderId:'',recvSeq:0,missedSeq:0,
  me:{name:'QA',id:'qa-session',color:'#fff',x:10,y:20,dir:0},fieldGraceUntil:0,pingSamples:[],
  SESSION_ID:'qa-session',nameInput:{value:'QA'},remotes:new Map(),lastSeqById:new Map(),mobs:[],resources:[],harvested:new Map(),
  updateUI(){},baseUpdateUIV16(){},seedZone(){},globalMeta(){return{id:'qa-session'};},
  onMove(){},onAttack(){},onMobs(){},onMobHit(){},onLoot(){},onHarvest(){},onWorld(){},electLeader(){},toast(){},
  finite(value,fallback=0){return Number.isFinite(Number(value))?Number(value):fallback;},clean(value){return String(value||'');},
  performance:{now(){return 1;}},setTimeout(callback,ms){const timer={callback,ms,cleared:false};timers.push(timer);return timer;},
  clearTimeout(timer){if(timer)timer.cleared=true;},setInterval(){return 0;},
  addEventListener(type,handler){(listeners[type]??=[]).push(handler);}
};
sandbox.window=sandbox;
const initialSandbox={...sandbox};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'network-relay-v16.js'});
const dispatch=type=>{for(const listener of listeners[type]||[])listener();};
const relay=sandbox.ABYSSAL_RELAY_V16;
sandbox.AW_SUCCESSOR_PREVIEW=true;sandbox.updateUI();
assert.equal(sandbox.onlineEl.textContent,'本地 1','isolated successor preview must identify its one local player, not claim Relay presence');
sandbox.AW_SUCCESSOR_PREVIEW=false;
sandbox.updateUI();
assert.equal(sandbox.onlineEl.textContent,'未连接','an empty disconnected presence set must not be displayed as one online player');

const globalJoin=sandbox.connectGlobal();
const first=FakeWebSocket.instances[0];
first.open();
first.message({type:'hello_ack',protocol:'abyssal-relay-v1'});
for(let i=0;i<5;i++)await tick();
first.message({type:'subscribed',channel:'fixture-world:global'});
await globalJoin;
const zoneJoin=sandbox.switchZone('1:1');
for(let i=0;i<5;i++)await tick();
first.message({type:'subscribed',channel:'fixture-world:zone:1:1'});
await zoneJoin;
assert.equal(sandbox.zoneConnected,true,'the fixture starts with a live zone subscription');
sandbox.globalCh._applyPresence([{id:'qa-session'},{id:'peer-1'}]);
sandbox.updateUI();
assert.equal(sandbox.onlineEl.textContent,'在线 2','a confirmed presence snapshot should show the exact participant count');

const retryCountBefore=timers.length;
sandbox.navigator.onLine=false;
dispatch('offline');
assert.equal(sandbox.zoneConnected,false,'offline closes the simulation gate');
assert.equal(sandbox.globalPresenceIds.size,0,'disconnect must discard the last known presence snapshot');
assert.equal(sandbox.onlineEl.textContent,'离线','offline must not continue to display stale participants as online');
assert.equal(relay.connected,false,'offline must invalidate the stale open socket state');
assert.equal(relay.channels.get('fixture-world:zone:1:1').subscribed,false,'offline must invalidate the stale channel subscription');
assert.equal(first.readyState,3,'offline must close the old socket so recovery does not orphan it');
assert.equal(timers.slice(retryCountBefore).some(timer=>timer.ms===1800&&!timer.cleared),false,'offline should wait for the browser online event before retrying');

sandbox.navigator.onLine=true;
dispatch('online');
const retry=timers.findLast(timer=>timer.ms===1800&&!timer.cleared);
assert.ok(retry,'online should schedule a reconnect');
const reconnecting=retry.callback();
for(let i=0;i<3;i++)await tick();
const second=FakeWebSocket.instances[1];
assert.ok(second,'reconnect should create a fresh WebSocket');
second.open();
second.message({type:'hello_ack',protocol:'abyssal-relay-v1'});
for(let i=0;i<5;i++)await tick();
assert.ok(second.sent.some(packet=>packet.type==='subscribe'&&packet.channel==='fixture-world:global'));
assert.ok(second.sent.some(packet=>packet.type==='subscribe'&&packet.channel==='fixture-world:zone:1:1'));
second.message({type:'subscribed',channel:'fixture-world:global'});
second.message({type:'subscribed',channel:'fixture-world:zone:1:1'});
await reconnecting;
assert.equal(sandbox.globalConnected,true);
assert.equal(sandbox.zoneConnected,true,'the simulation gate should reopen only after the zone acknowledgement');
assert.equal(sandbox.onlineEl.textContent,'同步中','reconnection should wait for a fresh presence snapshot instead of reviving the old count');
sandbox.globalCh._applyPresence([]);
assert.equal(sandbox.onlineEl.textContent,'在线 0','a fresh empty presence snapshot must not be forced up to one');
sandbox.globalCh._applyPresence([{id:'qa-session'},{id:'peer-2'}]);
sandbox.updateUI();
assert.equal(sandbox.onlineEl.textContent,'在线 2','a new presence snapshot should restore the accurate count after reconnect');

const startupListeners={};
const startupSandbox={...initialSandbox,navigator:{onLine:false}};
startupSandbox.window=startupSandbox;
startupSandbox.addEventListener=(type,handler)=>{(startupListeners[type]??=[]).push(handler);};
vm.createContext(startupSandbox);
vm.runInContext(source,startupSandbox,{filename:'network-relay-v16-startup-offline.js'});
const startupAttempt=startupSandbox.connectGlobal();
FakeWebSocket.instances.at(-1).close();
assert.equal(await startupAttempt,null,'a startup socket lost before handshake should fail cleanly');
assert.equal(startupSandbox.ABYSSAL_RELAY_V16.retryTimer,0,'offline startup should wait for browser recovery');
const startupTimerCount=timers.length;
startupSandbox.navigator.onLine=true;
for(const listener of startupListeners.online||[])listener();
const startupRetry=timers.slice(startupTimerCount).find(timer=>timer.ms===1800&&!timer.cleared);
assert.ok(startupRetry,'online should resume a startup retry before the first hello acknowledgement');
const startupRecovery=startupRetry.callback();
for(let i=0;i<3;i++)await tick();
const startupSocket=FakeWebSocket.instances.at(-1);
startupSocket.open();
startupSocket.message({type:'hello_ack',protocol:'abyssal-relay-v1'});
for(let i=0;i<5;i++)await tick();
startupSocket.message({type:'subscribed',channel:'fixture-world:global'});
for(let i=0;i<5;i++)await tick();
startupSocket.message({type:'subscribed',channel:'fixture-world:zone:1:1'});
await startupRecovery;
assert.equal(startupSandbox.ABYSSAL_RELAY_V16.active,true,'startup should complete after browser recovery');
assert.equal(startupSandbox.zoneConnected,true,'startup recovery should enable the zone only after its acknowledgement');

console.log(JSON.stringify({ok:true,offlineInvalidatesOpenSocket:true,onlineReconnectsAndResubscribes:true,startupOfflineRecovers:true}));
