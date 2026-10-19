import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const outbound={
  ABYSSAL_PETS_V1:{getRenderState:()=>({id:'mireling',name:'灯尾',x:123.4,y:456.6,evolved:true,command:'FOLLOW'})},
  SESSION_ID:'local',me:{x:120,y:450,seq:0,name:'Local'},zoneCh:{send:packet=>outbound.sent.push(packet)},
  zoneConnected:true,dead:false,currentZone:'1:1',attackFlash:0,sent:[],
};
outbound.globalThis=outbound;
vm.createContext(outbound);
vm.runInContext(read('modules/network/outbound-sync.js'),outbound,{filename:'outbound-sync.js'});
outbound.sendMove();
assert.equal(outbound.sent[0].event,'move','companions remain on the existing move Relay event');
assert.deepEqual({...outbound.sent[0].payload.pet},{id:'mireling',name:'灯尾',x:123,y:457,evolved:true,command:'FOLLOW'},'move payload carries a compact pet display snapshot');
outbound.ABYSSAL_PETS_V1.getRenderState=()=>null;
assert.equal(outbound.companionMoveSnapshot(),null,'players without a companion send a clear value');

const inbound={
  SESSION_ID:'local',currentZone:'1:1',WORLD:{w:4800,h:4800},
  remotes:new Map(),lastSeqById:new Map(),missedSeq:0,recvSeq:0,
  finite:(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback,
  clamp:(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0)),
  clean:value=>String(value||'').replace(/[<>]/g,'').slice(0,32),
};
inbound.globalThis=inbound;
vm.createContext(inbound);
vm.runInContext(read('modules/network/inbound-events.js'),inbound,{filename:'inbound-events.js'});
inbound.onMove({id:'remote',name:'Friend',zone:'1:1',x:100,y:200,seq:1,pet:{id:'mireling',name:'<灯尾>',x:90,y:210,evolved:true,command:'WAIT'}});
assert.deepEqual({...inbound.remotes.get('remote').pet},{id:'mireling',name:'灯尾',x:90,y:210,evolved:true,command:'WAIT'},'remote movement stores a sanitized remote pet snapshot');
inbound.onMove({id:'remote',name:'Friend',zone:'1:1',x:101,y:200,seq:2,pet:{id:'bad',name:'bad',x:NaN,y:0}});
assert.equal(inbound.remotes.get('remote').pet,null,'invalid remote pet coordinates clear instead of drawing a broken pet');
inbound.onMove({id:'other-zone',name:'Far',zone:'1:0',x:101,y:200,seq:1,pet:{id:'mireling',x:90,y:210}});
assert.equal(inbound.remotes.has('other-zone'),false,'existing zone filtering still applies');

const renderer=read('prototypes/successor-3-4/successor-renderer.js');
assert.ok(renderer.includes('if(p.pet)list.push({id:`remote-pet:'),'successor renderer draws the received companion beside remote players');
console.log(JSON.stringify({ok:true,transport:'existing move event',remotePet:'sanitized and rendered',protocol:'additive'}));
