import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const outbound={
  ABYSSAL_PETS_V1:{getRenderState:()=>({id:'mireling',name:'灯尾',x:123.4,y:456.6,evolved:true,command:'FOLLOW'})},
  SESSION_ID:'local',me:{x:120,y:450,seq:0,name:'Local',hp:83,hunger:47,sanity:62},
  inventory:{wood:4,stone:3,food:2,shard:1,seed:5,egg:1,milk:0,wool:0,fish_reedcarp:2,fish_glassminnow:0,fish_holloweye:1,companion_egg:1,meal_river_stew:0,meal_glass_porridge:1,meal_holloweye_chowder:0,meal_trail_stew:0,knife:true,lantern:false},
  zoneCh:{send:packet=>outbound.sent.push(packet)},
  zoneConnected:true,dead:false,currentZone:'1:1',attackFlash:0,sent:[],
};
outbound.globalThis=outbound;
vm.createContext(outbound);
vm.runInContext(read('modules/network/outbound-sync.js'),outbound,{filename:'outbound-sync.js'});
outbound.sendMove();
assert.equal(outbound.sent[0].event,'move','companions remain on the existing move Relay event');
assert.deepEqual({...outbound.sent[0].payload.pet},{id:'mireling',name:'灯尾',x:123,y:457,evolved:true,command:'FOLLOW'},'move payload carries a compact pet display snapshot');
assert.equal(outbound.sent[0].payload.hunger,47,'existing movement snapshots carry current hunger for co-op survival');
assert.deepEqual({...outbound.sent[0].payload.inventory},{wood:4,stone:3,food:2,shard:1,seed:5,egg:1,milk:0,wool:0,fish_reedcarp:2,fish_glassminnow:0,fish_holloweye:1,companion_egg:1,meal_river_stew:0,meal_glass_porridge:1,meal_holloweye_chowder:0,meal_trail_stew:0,knife:true,lantern:false},'the move packet carries the complete compact teammate inventory snapshot');
const content=read('modules/safe-camp/content-v9.js');
const activeSendStart=content.indexOf('sendMove = function(){');
const activeSendEnd=content.indexOf('\n  const baseOnMoveContentV9',activeSendStart);
assert.ok(activeSendStart>=0&&activeSendEnd>activeSendStart,'the active V21 team-ready sendMove override must exist');
Object.assign(outbound,{CONTENT:{ready:true},GAMEPLAY:{getLocalState:()=>({prepared:true,expedition:true})},fieldGraceUntil:0});
outbound.sent.length=0;
vm.runInContext(content.slice(activeSendStart,activeSendEnd),outbound,{filename:'active-v21-send-move.js'});
outbound.sendMove();
assert.equal(outbound.sent[0].event,'move','the final V21 override keeps the established Relay event');
assert.equal(outbound.sent[0].payload.hunger,47,'the active V21 move override retains hunger');
assert.deepEqual({...outbound.sent[0].payload.inventory},{wood:4,stone:3,food:2,shard:1,seed:5,egg:1,milk:0,wool:0,fish_reedcarp:2,fish_glassminnow:0,fish_holloweye:1,companion_egg:1,meal_river_stew:0,meal_glass_porridge:1,meal_holloweye_chowder:0,meal_trail_stew:0,knife:true,lantern:false},'the active V21 override retains the teammate inventory snapshot');
assert.deepEqual({...outbound.sent[0].payload.pet},{id:'mireling',name:'灯尾',x:123,y:457,evolved:true,command:'FOLLOW'},'the active V21 override retains the teammate pet snapshot');
assert.deepEqual({...outbound.sent[0].payload.v9},{prepared:true,expedition:true,ready:true},'the active override preserves the existing ready/expedition fields');
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
const sharedInventory={wood:4,stone:3,food:2,shard:1,seed:5,egg:1,milk:0,wool:0,fish_reedcarp:2,fish_glassminnow:0,fish_holloweye:1,companion_egg:1,meal_river_stew:0,meal_glass_porridge:1,meal_holloweye_chowder:0,meal_trail_stew:0,knife:true,lantern:false};
inbound.onMove({id:'remote',name:'Friend',zone:'1:1',x:101,y:200,seq:2,hunger:34,inventory:sharedInventory,pet:{id:'bad',name:'bad',x:NaN,y:0}});
assert.equal(inbound.remotes.get('remote').pet,null,'invalid remote pet coordinates clear instead of drawing a broken pet');
assert.equal(inbound.remotes.get('remote').hunger,34,'remote hunger is clamped and kept as a display-only teammate value');
assert.deepEqual({...inbound.remotes.get('remote').inventory},sharedInventory,'remote inventory is sanitized and retained for teammate coordination');
inbound.onMove({id:'remote',name:'Friend',zone:'1:1',x:102,y:200,seq:3,hunger:1000,inventory:{wood:-1},pet:null});
assert.equal(inbound.remotes.get('remote').hunger,100,'remote hunger values are clamped to the survival range');
assert.equal(inbound.remotes.get('remote').inventory.wood,4,'malformed inventory snapshots cannot overwrite the last valid teammate bag');
inbound.onMove({id:'other-zone',name:'Far',zone:'1:0',x:101,y:200,seq:1,pet:{id:'mireling',x:90,y:210}});
assert.equal(inbound.remotes.has('other-zone'),false,'existing zone filtering still applies');

const renderer=read('prototypes/successor-3-4/successor-renderer.js');
assert.ok(renderer.includes('if(p.pet)list.push({id:`remote-pet:'),'successor renderer draws the received companion beside remote players');
assert.ok(content.includes('inventory:inventoryMoveSnapshot()')&&content.includes('pet:companionMoveSnapshot()')&&content.includes('hunger:Math.round(me.hunger)'), 'the final V21 move override must retain co-op hunger, inventory, and pet state');
assert.ok(content.includes('bag.shard')&&content.includes('remote.pet.name'),'the teammate list must visibly summarize useful supplies and companion presence');
console.log(JSON.stringify({ok:true,transport:'existing move event',remotePet:'sanitized and rendered',protocol:'additive'}));
