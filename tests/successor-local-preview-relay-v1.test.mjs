import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../prototypes/successor-3-4/local-preview-relay.js',import.meta.url),'utf8');
const preview=fs.readFileSync(new URL('../prototypes/successor-3-4/preview.js',import.meta.url),'utf8');
const boot=fs.readFileSync(new URL('../survival-v21.html',import.meta.url),'utf8');

assert.ok(preview.includes("if(name==='modules/network/network-relay-v16.js')await loadModule('prototypes/successor-3-4/local-preview-relay.js')"),
  'the local adapter must load after the normal Relay owner and before gameplay starts');
assert.ok(preview.includes("if(name==='modules/main-loop/smooth-motion-v18.js'){started=true;zoneConnected=true;draw=function(){}}await loadModule(name)"),
  'the guarded preview must hide only the V21 draw layer before V18 captures the real simulation update frame');
assert.ok(boot.indexOf("'modules/network/network-relay-v16.js'")<boot.indexOf("'modules/main-loop/smooth-motion-v18.js'"),
  'the normal V21 Relay module must retain its boot position ahead of the preview-only adapter hook');

const seeded=[],uiUpdates=[],sandbox={
  console,window:null,AW_SUCCESSOR_PREVIEW:true,SESSION_ID:'local-player',
  currentZone:'1:1',me:{zone:'1:1'},switchNonce:0,switching:false,
  globalConnected:true,globalCh:{},zoneConnected:false,zoneLeader:false,zoneLeaderId:'remote',zoneCh:null,
  zonePresenceIds:new Set(['remote']),
  remotes:new Map([['remote',{id:'remote'}]]),lastSeqById:new Map([['remote',1]]),recvSeq:3,missedSeq:1,
  mobs:[{id:'old-mob'}],
  seedZone(zone){seeded.push(zone)},spawnMobs(zone){sandbox.mobs=[{id:`mob-${zone}`} ]},
  updateUI(){uiUpdates.push(sandbox.currentZone)},
  async connectGlobal(){throw new Error('real Relay path must not be used in guarded preview')},
  async switchZone(){throw new Error('real Relay switch must not be used in guarded preview')},
};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'local-preview-relay.js'});

assert.equal(sandbox.globalConnected,false,'a local-only preview must not report public presence');
assert.equal(sandbox.globalCh,null,'global Relay access must remain disabled');
assert.equal(await sandbox.ABYSSAL_LOCAL_PREVIEW_RELAY_V1.switchZone('1:0'),sandbox.zoneCh,
  'a guarded area switch should return a local stub channel');
assert.equal(sandbox.zoneConnected,true,'the local simulation must stay active after changing zones');
assert.equal(sandbox.zoneLeader,true,'the local player owns the preview simulation');
assert.equal(sandbox.zoneLeaderId,'local-player');
assert.equal(sandbox.me.zone,'1:0');
assert.deepEqual(seeded,['1:0']);
assert.equal(sandbox.mobs[0].id,'mob-1:0');
assert.equal(sandbox.remotes.size,0,'remote players must not be fabricated');
assert.equal(sandbox.lastSeqById.size,0);
assert.equal(sandbox.recvSeq,0);
assert.equal(sandbox.missedSeq,0);
assert.equal(await sandbox.zoneCh.send({type:'broadcast'}),'ok');
assert.equal(await sandbox.zoneCh.track({id:'local-player'}),null);
assert.equal(sandbox.ABYSSAL_LOCAL_PREVIEW_RELAY_V1.isConnected(),true);
assert.deepEqual(uiUpdates,['1:0']);

console.log(JSON.stringify({ok:true,previewOnly:true,relayProtocol:'untouched',zoneSimulation:'local-authoritative',broadcast:'no-op'}));
