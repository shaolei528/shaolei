import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../modules/network/network-relay-v16.js',import.meta.url),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
class FakeWebSocket{
  static OPEN=1;static instances=[];
  constructor(url){this.url=url;this.readyState=0;this.handlers={};this.sent=[];FakeWebSocket.instances.push(this)}
  addEventListener(type,fn){(this.handlers[type]??=[]).push(fn)}
  send(packet){this.sent.push(JSON.parse(packet))}
  open(){this.readyState=FakeWebSocket.OPEN;this.emit('open',{})}
  message(data){this.emit('message',{data:JSON.stringify(data)})}
  emit(type,event){for(const fn of this.handlers[type]||[])fn(event)}
}
const timers=[];
const el=()=>({id:'',style:{},textContent:'',className:'',addEventListener(){},appendChild(){}});
const sandbox={
  console:{warn(){},log(){},error(){}},window:null,URLSearchParams,location:{search:''},
  cfg:{RELAY_URL:'wss://fixture.invalid/ws',WORLD_CHANNEL:'qa'},WebSocket:FakeWebSocket,
  document:{getElementById(){return null},createElement(){return el()}},game:el(),connectionEl:el(),pingEl:el(),jitterEl:el(),lossEl:el(),onlineEl:el(),
  globalConnected:false,zoneConnected:false,globalPresenceIds:new Set(),zonePresenceIds:new Set(),started:true,
  globalCh:null,zoneCh:null,currentZone:'1:1',switchNonce:0,switching:false,zoneLeader:false,zoneLeaderId:'',recvSeq:0,missedSeq:0,
  me:{name:'QA',id:'qa',color:'#fff',x:2400,y:2470,dir:0},fieldGraceUntil:0,pingSamples:[],SESSION_ID:'qa',nameInput:{value:'QA'},
  remotes:new Map(),lastSeqById:new Map(),mobs:[],resources:[],harvested:new Map(),updateUI(){},baseUpdateUIV16(){},seedZone(){},globalMeta(){return{id:'qa'}},
  onMove(){},onAttack(){},onMobs(){},onMobHit(){},onLoot(){},onHarvest(){},onWorld(){},electLeader(){},toast(){},
  finite(v,f=0){return Number.isFinite(Number(v))?Number(v):f},clean(v){return String(v||'')},
  performance:{now(){return 1}},setTimeout(fn,ms){const t={fn,ms,cleared:false};timers.push(t);return t},clearTimeout(t){if(t)t.cleared=true},
  setInterval(){return 0},addEventListener(){},connectGlobal(){},switchZone(){},measurePing(){},connectionQuality(){return['reconnect','reconnect']}
};
sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'network-relay-v16.js'});
const attempt=sandbox.switchZone('1:1');
await Promise.resolve();
const socket=FakeWebSocket.instances[0];assert.ok(socket,'zone entry should construct the configured Relay socket');
socket.open();socket.message({type:'hello_ack',protocol:'abyssal-relay-v1'});
for(let i=0;i<4;i++)await tick();
const key='qa:zone:1:1';
const firstChannel=sandbox.ABYSSAL_RELAY_V16.channels.get(key);
assert.ok(socket.sent.some(packet=>packet.type==='subscribe'&&packet.channel===key),'hello_ack should request the Zone subscription');
assert.equal(sandbox.zoneConnected,false,'simulation gate must remain closed before Zone acknowledgement');
const timeout=timers.findLast(timer=>timer.ms===8000&&!timer.cleared);
assert.ok(timeout,'a bounded Zone subscription timeout should be armed');
timeout.fn();
assert.equal(await attempt,null,'a missing acknowledgement must settle zone entry as a failure');
assert.equal(sandbox.zoneConnected,false,'timeout must keep simulation gated');
assert.equal(firstChannel.closed,true,'timed-out channel must close so stale acknowledgements cannot revive it');
assert.equal(sandbox.ABYSSAL_RELAY_V16.channels.has(key),false,'timed-out channel must be removed from the dispatch map');
socket.message({type:'subscribed',channel:key});
assert.equal(sandbox.zoneConnected,false,'a late acknowledgement for a closed channel must be ignored');

const retry=sandbox.switchZone('1:1');
for(let i=0;i<4;i++)await tick();
const retrySocket=FakeWebSocket.instances.at(-1);
assert.ok(retrySocket&&retrySocket!==socket,'a timeout retry must use a fresh WebSocket');
retrySocket.open();retrySocket.message({type:'hello_ack',protocol:'abyssal-relay-v1'});
for(let i=0;i<4;i++)await tick();
const retryChannel=sandbox.ABYSSAL_RELAY_V16.channels.get(key);
assert.ok(retryChannel,'a retry should create a fresh Zone channel');
retrySocket.message({type:'subscribed',channel:key});
assert.equal((await retry)?.key,key,'a fresh delayed acknowledgement should release the retry');
assert.equal(sandbox.zoneConnected,true,'the simulation gate should open after the current channel is acknowledged');

const sameZoneOld=sandbox.switchZone('4:1');
for(let i=0;i<4;i++)await tick();
const sameZoneKey='qa:zone:4:1';
const staleGeneration=sandbox.ABYSSAL_RELAY_V16.channels.get(sameZoneKey);
assert.ok(staleGeneration,'first same-key generation should be pending');
const sameZoneLatest=sandbox.switchZone('4:1');
for(let i=0;i<4;i++)await tick();
const currentGeneration=sandbox.ABYSSAL_RELAY_V16.channels.get(sameZoneKey);
assert.ok(currentGeneration&&currentGeneration!==staleGeneration,'same-key retry should replace the channel generation');
assert.equal(await sameZoneOld,null,'the superseded same-key attempt should settle');
retrySocket.message({type:'subscribed',channel:sameZoneKey});
assert.equal(sandbox.zoneConnected,false,'the old generation acknowledgement must not confirm the current channel');
assert.equal(currentGeneration.subscribed,false,'the first same-key acknowledgement belongs to the closed generation');
retrySocket.message({type:'subscribed',channel:sameZoneKey});
assert.equal((await sameZoneLatest)?.key,sameZoneKey,'the current generation acknowledgement should complete entry');
assert.equal(sandbox.zoneConnected,true,'only the current generation may open the simulation gate');

const superseded=sandbox.switchZone('2:1');
for(let i=0;i<4;i++)await tick();
const newZone=sandbox.switchZone('3:1');
for(let i=0;i<4;i++)await tick();
assert.equal(await superseded,null,'switching zones should settle the superseded join');
const latestKey='qa:zone:3:1';
retrySocket.message({type:'subscribed',channel:latestKey});
assert.equal((await newZone)?.key,latestKey,'only the latest zone acknowledgement should complete entry');
assert.equal(sandbox.currentZone,'3:1');
assert.equal(sandbox.zoneConnected,true);

const globalJoin=sandbox.connectGlobal();
for(let i=0;i<4;i++)await tick();
const globalSocket=FakeWebSocket.instances.at(-1);
assert.equal(globalSocket,retrySocket,'global subscription should reuse the recovered open socket');
const globalKey='qa:global';
assert.ok(globalSocket.sent.some(packet=>packet.type==='subscribe'&&packet.channel===globalKey),'global entry should request its own channel acknowledgement');
const globalChannel=sandbox.ABYSSAL_RELAY_V16.channels.get(globalKey);
const globalTimeout=timers.findLast(timer=>timer.ms===8000&&!timer.cleared);
assert.ok(globalTimeout,'global channel should have a bounded acknowledgement timeout');
globalTimeout.fn();
assert.equal(await globalJoin,null,'a missing global acknowledgement must settle as a failure');
assert.equal(sandbox.globalConnected,false,'global timeout must not report a false connection');
assert.equal(globalChannel.closed,true,'timed-out global channel must close');
assert.equal(sandbox.ABYSSAL_RELAY_V16.channels.has(globalKey),false,'timed-out global channel must be removed');

console.log(JSON.stringify({ok:true,zoneMissingAck:'settles-after-timeout',globalMissingAck:'settles-after-timeout',lateAck:'ignored',retry:'fresh-socket-connects',rapidSwitch:'superseded-join-settles',sameChannelGenerationAck:'stale-generation-ignored',protocol:'unchanged'}));
