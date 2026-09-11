import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const approx=(actual,expected,label)=>assert.ok(Math.abs(actual-expected)<1e-9,`${label}: expected ${expected}, got ${actual}`);

// V21 is Relay-only: no dead Supabase shim or fallback may re-enter the active path.
const v21Boot=read('survival-v21.html');
const relay=read('modules/network/network-relay-v16.js');
const runtimeState=read('modules/core/runtime-state.js');
const sessionZone=read('modules/network/session-zone.js');
assert.ok(v21Boot.includes("Cloudflare relay URL is not configured"),'V21 boot must require a configured Relay URL');
assert.equal(v21Boot.includes('installRelayShim'),false,'V21 boot must not install a dead Supabase shim');
assert.equal(v21Boot.includes('@supabase/supabase-js'),false,'V21 boot must not load the Supabase SDK fallback');
assert.equal(runtimeState.includes('window.supabase.createClient'),false,'active V21 runtime state must not require a Supabase client');
assert.ok(sessionZone.includes('cfg.RELAY_URL'),'V21 entry guard must require the Relay URL');
assert.equal(sessionZone.includes('supabase'),false,'active V21 zone wiring must not retain Supabase runtime paths');
assert.ok(v21Boot.indexOf("'modules/network/network-v9.js'")<v21Boot.indexOf("'modules/network/network-relay-v16.js'"),'Relay must continue to load after the preserved V9 compatibility layer');
for(const deadFallback of ['fallBackToSupabase','Supabase 备用','originalConnectGlobal','originalSwitchZone','originalMeasurePing','originalConnectionQuality'])assert.equal(relay.includes(deadFallback),false,`dead V21 fallback must be absent: ${deadFallback}`);
assert.ok(relay.includes('if(NET_V9)NET_V9.disposed=true'),'Relay must disable the retained V9 compatibility lifecycle');

// Survival state: execute the exact active split module with controlled globals.
const survival={
  console,
  me:{x:0,y:0,hp:50,hunger:50,sanity:50},
  inventory:{lantern:false},
  mobs:[],
  inCamp:()=>true,
  clamp,
  nightLevel:()=>0,
  died:false,
  die(){survival.died=true;}
};
vm.createContext(survival);
vm.runInContext(read('modules/survival/status.js'),survival,{filename:'modules/survival/status.js'});
survival.applyLocalSurvival(10);
approx(survival.me.hp,56.5,'camp hp recovery');
approx(survival.me.sanity,71,'camp sanity recovery');
approx(survival.me.hunger,49.82,'camp hunger drain');
assert.equal(survival.died,false,'safe camp recovery must not kill the player');

survival.me.hp=50;survival.me.hunger=50;survival.me.sanity=50;survival.inCamp=()=>false;
survival.applyLocalSurvival(10);
approx(survival.me.hp,50,'field hp without starvation/zero sanity');
approx(survival.me.hunger,49.05,'field hunger drain');
approx(survival.me.sanity,49.91,'field sanity drain in daylight without nearby mobs');

// SafeCamp combat: execute the exact active player-combat module.
const sent=[],toasts=[];
const combat={
  console,
  started:true,dead:false,attackCd:0,dashCd:0,dashQueued:false,attackFlash:0,zoneConnected:true,
  inventory:{knife:false},me:{name:'Smoke',x:10,y:20,dir:.5},SESSION_ID:'local',currentZone:'1:1',
  zoneLeader:false,zoneCh:{send(packet){sent.push(packet);return'ok';}},
  inCamp:()=>true,toast:text=>toasts.push(text),dashBtn:{addEventListener(){}},attackBtn:{addEventListener(){}},
  finite:(v,f=0)=>Number.isFinite(Number(v))?Number(v):f,campDist:()=>999,CAMP:{r:470},mobs:[],clamp,
  onLoot(){}
};
vm.createContext(combat);
vm.runInContext(read('modules/combat/player-combat.js'),combat,{filename:'modules/combat/player-combat.js'});
combat.attack();
assert.equal(sent.length,0,'SafeCamp attack must not emit a network attack');
assert.equal(toasts.at(-1),'Weapons stay lowered inside Safe Camp.','SafeCamp attack feedback must remain unchanged');
combat.inCamp=()=>false;combat.attackCd=0;combat.attack();
assert.equal(sent.length,1,'field attack must emit exactly one network attack');
assert.equal(sent[0].event,'attack');
assert.equal(sent[0].payload.damage,11,'unarmed damage must remain unchanged');
assert.equal(sent[0].payload.range,62,'unarmed range must remain unchanged');
combat.inventory.knife=true;combat.attackCd=0;combat.attack();
assert.equal(sent[1].payload.damage,22,'knife damage must remain unchanged');
assert.equal(sent[1].payload.range,80,'knife range must remain unchanged');

// Final V12 SafeCamp interaction dispatcher and recovery/resource rules.
const interaction=read('modules/input/interaction-v12.js');
function block(startToken,endToken){
  const start=interaction.indexOf(startToken),end=interaction.indexOf(endToken,start);
  assert.ok(start>=0,`missing ${startToken}`);assert.ok(end>start,`missing ${endToken}`);
  return interaction.slice(start,end);
}
const target=block('function interactionTarget(){','function harvestResource(r){');
for(const type of ['guide','workbench','chest','fire','resource'])assert.ok(target.includes(`type:'${type}'`),`interaction target ${type} must remain available`);
const harvest=block('function harvestResource(r){','function restAtFire(){');
assert.ok(harvest.includes("const localCamp=String(r.id).startsWith('camp:')"),'camp resources must remain locally scoped');
assert.ok(harvest.includes('localCamp?12000:60000'),'camp/public resource cooldowns must remain unchanged');
assert.ok(harvest.includes('if(!localCamp&&zoneConnected&&zoneCh)'),'camp resources must not broadcast harvest state');
const rest=block('function restAtFire(){','async function openChest(){');
assert.ok(rest.includes('fireCooldownUntil=now+12000'),'campfire cooldown must remain 12s');
assert.ok(rest.includes('me.hp=clamp(me.hp+24,0,100)'),'campfire HP recovery must remain +24');
assert.ok(rest.includes('me.sanity=clamp(me.sanity+34,0,100)'),'campfire sanity recovery must remain +34');
const dispatch=block('function interact(){','function replaceInteractionButton(){');
for(const branch of ["guide","fire","workbench","chest","resource"])assert.ok(dispatch.includes(`target.type==='${branch}'`),`interaction dispatch ${branch} must remain wired`);

console.log(JSON.stringify({ok:true,survival:{campRecovery:'pass',fieldDrain:'pass'},combat:{safeCampBlocked:'pass',fieldAttack:'pass'},safeCamp:{targets:5,campfire:'pass',localResources:'pass'}}));
