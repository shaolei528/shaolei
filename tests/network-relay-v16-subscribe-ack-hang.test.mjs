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
  onMove(){},onAttack(){},onMobs(){},onMobHit(){},onLoot(){},onHarvest(){},onWorld(){},electLeader(){},toast(){},finite(v,f=0){return Number.isFinite(Number(v))?Number(v):f},clean(v){return String(v||'')},
  performance:{now(){return 1}},setTimeout(fn,ms){const t={fn,ms};timers.push(t);return t},clearTimeout(){},setInterval(){return 0},addEventListener(){},connectGlobal(){},switchZone(){},measurePing(){},connectionQuality(){return['reconnect','reconnect']}
};
sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'network-relay-v16.js'});
const attempt=sandbox.switchZone('1:1');
await Promise.resolve();
const socket=FakeWebSocket.instances[0];assert.ok(socket,'zone entry should construct the configured Relay socket');
socket.open();socket.message({type:'hello_ack',protocol:'abyssal-relay-v1'});
for(let i=0;i<4;i++)await tick();
const zoneSubscribe=socket.sent.find(packet=>packet.type==='subscribe'&&packet.channel==='qa:zone:1:1');
assert.ok(zoneSubscribe,'hello_ack should proceed to request the Zone subscription');
assert.equal(sandbox.zoneConnected,false,'simulation gate must remain closed before Zone acknowledgement');
const outcome=await Promise.race([attempt.then(()=> 'settled',()=> 'settled'),Promise.resolve().then(()=>tick()).then(()=> 'pending')]);
assert.equal(outcome,'pending','without subscribed acknowledgement switchZone stays pending');
assert.equal(sandbox.ABYSSAL_RELAY_V16.channels.get('qa:zone:1:1')?.subscribed,false);
socket.message({type:'subscribed',channel:'qa:zone:1:1'});
const resolved=await attempt;
assert.equal(resolved?.key,'qa:zone:1:1','a delayed acknowledgement must release the pending zone entry');
assert.equal(sandbox.zoneConnected,true,'the existing gate opens only after acknowledgement');
console.log(JSON.stringify({ok:true,classification:'CONFIRMED_REPRODUCTION',noAck:'pending',delayedAck:'resolves',physicalRelay:'not-tested'}));
