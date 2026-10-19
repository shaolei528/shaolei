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
const campSyncEvents=[];
const makeElement=()=>({id:'',style:{},textContent:'',className:'',addEventListener(){},appendChild(){}});
const game=makeElement();
const sandbox={
  console:{warn(){},log(){},error(){}},window:null,URLSearchParams,location:{search:''},
  cfg:{RELAY_URL:'wss://relay.fixture.invalid/ws',WORLD_CHANNEL:'fixture-world'},WebSocket:FakeWebSocket,
  document:{getElementById(){return null;},createElement(){return makeElement();}},game,
  connectionEl:makeElement(),pingEl:makeElement(),jitterEl:makeElement(),lossEl:makeElement(),onlineEl:makeElement(),
  globalConnected:false,zoneConnected:false,globalPresenceIds:new Set(),zonePresenceIds:new Set(),started:true,
  globalCh:null,zoneCh:null,currentZone:'1:1',switchNonce:0,switching:false,zoneLeader:false,zoneLeaderId:'',recvSeq:0,missedSeq:0,
  me:{name:'QA',id:'qa-session',color:'#fff',x:10,y:20,dir:0},fieldGraceUntil:0,pingSamples:[],
  SESSION_ID:'qa-session',nameInput:{value:'QA'},remotes:new Map(),lastSeqById:new Map(),mobs:[],resources:[],harvested:new Map(),
  updateUI(){},baseUpdateUIV16(){},seedZone(){},globalMeta(){return{id:'qa-session'};},
  onMove(){},onAttack(){},onMobs(){},onMobHit(){},onLoot(){},onHarvest(){},onWorld(){},electLeader(){},toast(){},
  ABYSSAL_CAMP_WORLD_SYNC_V1:{receive(payload,meta){campSyncEvents.push({kind:'state',payload,meta});},respondToRequest(payload,meta,channel){campSyncEvents.push({kind:'request',payload,meta,channel});}},
  finite(value,fallback=0){return Number.isFinite(Number(value))?Number(value):fallback;},clean(value){return String(value||'');},
  performance:{now(){return 1;}},setTimeout(callback,ms){const timer={callback,ms,cleared:false};timers.push(timer);return timer;},
  clearTimeout(timer){if(timer)timer.cleared=true;},setInterval(){return 0;},addEventListener(){},
  connectGlobal(){},switchZone(){},measurePing(){},connectionQuality(){return['重新连接','reconnect'];}
};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'network-relay-v16.js'});

const relay=sandbox.ABYSSAL_RELAY_V16;
const globalAttempt=sandbox.connectGlobal();
const zoneAttempt=sandbox.switchZone('1:1');
globalAttempt.catch(()=>{});zoneAttempt.catch(()=>{});
await Promise.resolve();
const first=FakeWebSocket.instances[0];
first.open();
first.close();
await tick();

assert.equal(relay.connecting,false,'a socket close before hello_ack must settle the pending connection');
assert.ok(relay.retryTimer,'a started session must schedule a retry even before the first hello_ack');
const firstRetry=timers.find(timer=>timer===relay.retryTimer);
assert.equal(firstRetry.ms,1800,'the first retry must use the established backoff');

const reconnecting=firstRetry.callback();
await Promise.resolve();
const second=FakeWebSocket.instances[1];
second.open();
second.message({type:'hello_ack',protocol:'abyssal-relay-v1'});
for(let i=0;i<5;i++)await tick();
assert.ok(second.sent.some(packet=>packet.type==='subscribe'&&packet.channel==='fixture-world:global'),'initial recovery must restore the global subscription');
second.message({type:'subscribed',channel:'fixture-world:global'});
for(let i=0;i<5;i++)await tick();
assert.ok(second.sent.some(packet=>packet.type==='subscribe'&&packet.channel==='fixture-world:zone:1:1'),'initial recovery must restore the zone subscription');
second.message({type:'subscribed',channel:'fixture-world:zone:1:1'});
await reconnecting;
assert.equal(relay.channels.size,2,'successful initial recovery must restore both session channels');
assert.equal(sandbox.globalConnected,true);
assert.equal(sandbox.zoneConnected,true);

second.close();
const steadyRetry=relay.retryTimer;
assert.ok(steadyRetry,'disconnect after a successful session must retain automatic reconnection');
assert.equal(steadyRetry.ms,1800);
const steadyReconnect=steadyRetry.callback();
await Promise.resolve();
const third=FakeWebSocket.instances[2];
third.open();
third.message({type:'hello_ack',protocol:'abyssal-relay-v1'});
for(let i=0;i<5;i++)await tick();
assert.ok(third.sent.some(packet=>packet.type==='subscribe'&&packet.channel==='fixture-world:global'),'established recovery must resubscribe the global channel');
assert.ok(third.sent.some(packet=>packet.type==='subscribe'&&packet.channel==='fixture-world:zone:1:1'),'established recovery must resubscribe the zone channel');
third.message({type:'subscribed',channel:'fixture-world:global'});
third.message({type:'subscribed',channel:'fixture-world:zone:1:1'});
await steadyReconnect;
assert.equal(relay.channels.size,2,'established recovery must not duplicate session channels');
assert.equal(sandbox.globalConnected,true);
assert.equal(sandbox.zoneConnected,true);

const zoneChannel=relay.channels.get('fixture-world:zone:1:1');
zoneChannel._emitBroadcast('camp_world_v1',{sessionId:'peer-a',domain:'farm'},{from:'peer-a',serverTime:123});
assert.equal(campSyncEvents.at(-1).kind,'state','the existing relay channel routes shared-world events');
assert.equal(campSyncEvents.at(-1).meta.from,'peer-a','relay sender metadata reaches world-state validation');
assert.equal(campSyncEvents.at(-1).meta.serverTime,123,'relay timing metadata is preserved');
zoneChannel._emitBroadcast('camp_world_request_v1',{sessionId:'peer-a'},{from:'peer-a'});
assert.equal(campSyncEvents.at(-1).kind,'request','the existing relay channel routes join snapshot requests');
assert.equal(campSyncEvents.at(-1).channel,zoneChannel,'join requests respond on the subscribed zone channel');

console.log(JSON.stringify({ok:true,firstHandshakeDisconnect:'settled-and-retried',initialRecovery:'global+zone-resubscribed',establishedRecovery:'channels-resubscribed-without-duplicates',campWorldRelayRouting:true}));
