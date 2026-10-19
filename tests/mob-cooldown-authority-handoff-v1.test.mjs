import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const mobSource=fs.readFileSync(new URL('../modules/combat/mob-combat.js',import.meta.url),'utf8');
const inboundSource=fs.readFileSync(new URL('../modules/network/inbound-events.js',import.meta.url),'utf8');
const worldSource=fs.readFileSync(new URL('../modules/world/world-state.js',import.meta.url),'utf8');

function makePeer({id,leader=false,clockOffsetMs=0}){
  const sent=[];
  const RealDate=Date;
  class PeerDate extends RealDate{static now(){return RealDate.now()+clockOffsetMs;}}
  const sandbox={
    console,Date:PeerDate,Math,
    CAMP:{x:0,y:0,r:100},WORLD:{zone:1600,w:4800,h:4800},
    SESSION_ID:id,currentZone:'1:0',zoneLeader:leader,fieldGraceUntil:0,
    dead:false,invulnerableUntil:0,
    me:{id,x:100,y:100,r:14,hp:100,sanity:100},
    remotes:new Map([['target',{id:'target',x:2500,y:500,r:14,hp:100}]]),
    mobs:[],harvested:new Map(),inventory:{shard:0,food:0},
    zoneCh:{send(message){sent.push(message);return Promise.resolve('ok');}},
    sent,
    finite(value,fallback=0){return Number.isFinite(Number(value))?Number(value):fallback;},
    clamp(value,min,max){return Math.max(min,Math.min(max,value));},
    campDist(){return 1000;},inCamp(){return false;},toast(){},die(){},saveLocal(){},updateUI(){},
    rewardKill(){},freshMob(){throw new Error('unexpected mob respawn');}
  };
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(mobSource,sandbox,{filename:'mob-combat.js'});
  vm.runInContext(inboundSource,sandbox,{filename:'inbound-events.js'});
  vm.runInContext(worldSource,sandbox,{filename:'world-state.js'});
  return sandbox;
}

const originalLeader=makePeer({id:'old-leader',leader:true});
originalLeader.me.x=1500;originalLeader.me.y=1500;
originalLeader.mobs=[{id:'mob-a',kind:'crawler',x:2500,y:500,hp:58,phase:0,hitCd:0,respawnAt:0}];
originalLeader.updateMobs(0);
assert.equal(originalLeader.sent.length,0,'contact must begin with a visible windup instead of immediate damage');
assert.equal(originalLeader.mobs[0].phase,-.8,'crawler windup time must be synchronized in phase');
originalLeader.updateMobs(.8);
assert.equal(originalLeader.sent.length,1,'an in-range mob should broadcast one hit to the remote target');
const hit=originalLeader.sent[0].payload;
assert.equal(originalLeader.sent[0].event,'mob_hit');
assert.equal(hit.target,'target');
assert.equal(hit.mobId,'mob-a','mob-hit event must identify the cooldown owner');
assert.ok(hit.hitCdUntil>Date.now(),'mob-hit event must carry the cooldown deadline');
assert.equal(originalLeader.mobs[0].hitCdUntil,hit.hitCdUntil,'the leader mob state and broadcast deadline must agree');
originalLeader.zoneConnected=true;
originalLeader.broadcastWorld();
assert.equal(originalLeader.sent.at(-1).event,'world');
assert.equal(originalLeader.sent.at(-1).payload.mobs[0].hitCdUntil,hit.hitCdUntil,'full world snapshots must preserve the cooldown deadline');

const nextLeader=makePeer({id:'next-leader'});
const legacyMob={id:'mob-a',kind:'crawler',x:2500,y:500,hp:58,phase:0,respawnAt:0};
nextLeader.onMobs({zone:'1:0',mobs:[legacyMob]});
nextLeader.onMobHit(hit);
assert.equal(nextLeader.me.hp,100,'a cooldown sync for another player must not damage the receiver');
assert.ok(nextLeader.mobs[0].hitCd>0&&nextLeader.mobs[0].hitCd<=.12,'the receiver must restore only the cooldown remaining after windup');
nextLeader.onMobs({zone:'1:0',mobs:[legacyMob]});
assert.ok(nextLeader.mobs[0].hitCd>0,'a stale legacy snapshot must not erase a cooldown learned from mob_hit');
nextLeader.zoneLeader=true;
nextLeader.updateMobs(.1);
assert.equal(nextLeader.sent.length,0,'a newly elected leader must not immediately repeat the hit');
assert.ok(nextLeader.mobs[0].phase<0,'after the remaining cooldown elapses, the promoted leader should start a visible windup');
assert.equal(nextLeader.me.hp,100,'the promoted leader must not take damage before the next windup completes');

const selfHitLeader=makePeer({id:'self-hit-leader',leader:true});
selfHitLeader.me.x=2500;selfHitLeader.me.y=500;selfHitLeader.remotes.clear();
selfHitLeader.mobs=[{id:'mob-self-hit',kind:'crawler',x:2500,y:500,hp:58,phase:0,hitCd:0,respawnAt:0}];
selfHitLeader.updateMobs(0);
assert.equal(selfHitLeader.me.hp,100,'the leader must not take damage before the windup completes');
selfHitLeader.updateMobs(.8);
assert.equal(selfHitLeader.me.hp,96,'the authority leader must still apply its local damage exactly once');
assert.equal(selfHitLeader.sent.length,1,'a local leader hit must also broadcast cooldown state to peers');
const selfHitPacket=selfHitLeader.sent[0].payload;
assert.equal(selfHitPacket.target,'self-hit-leader');
assert.equal(selfHitPacket.mobId,'mob-self-hit');
assert.ok(selfHitPacket.hitCdUntil>Date.now());
const peerAfterSelfHit=makePeer({id:'peer-after-self-hit'});
peerAfterSelfHit.onMobs({zone:'1:0',mobs:[{id:'mob-self-hit',kind:'crawler',x:2500,y:500,hp:58,phase:0,respawnAt:0}]});
peerAfterSelfHit.onMobHit(selfHitPacket);
assert.equal(peerAfterSelfHit.me.hp,100,'another peer must sync cooldown without taking the leader player damage');
peerAfterSelfHit.zoneLeader=true;
peerAfterSelfHit.updateMobs(.1);
assert.equal(peerAfterSelfHit.sent.length,0,'a peer promoted after the local hit must not immediately repeat it');

const skewedPeer=makePeer({id:'clock-skewed-peer',clockOffsetMs:5000});
skewedPeer.onMobs({zone:'1:0',mobs:[legacyMob]});
skewedPeer.onMobHit(hit);
assert.ok(skewedPeer.mobs[0].hitCd>0&&skewedPeer.mobs[0].hitCd<=.12,'relative cooldown data must survive clients with different wall clocks');

const snapshotReceiver=makePeer({id:'snapshot-receiver'});
snapshotReceiver.onWorld({zone:'1:0',mobs:[{...legacyMob,hitCd:.6,hitCdUntil:Date.now()+600}],harvested:[]});
assert.ok(snapshotReceiver.mobs[0].hitCd>.5&&snapshotReceiver.mobs[0].hitCd<=.6,'world snapshots must restore only the remaining cooldown time');
const skewedSnapshotReceiver=makePeer({id:'skewed-snapshot-receiver',clockOffsetMs:-5000});
skewedSnapshotReceiver.onWorld({zone:'1:0',mobs:[{...legacyMob,hitCd:.6,hitCdUntil:Date.now()+600}],harvested:[]});
assert.ok(skewedSnapshotReceiver.mobs[0].hitCd>.5&&skewedSnapshotReceiver.mobs[0].hitCd<=.6,'relative snapshot cooldown must survive receivers with slow clocks');

const periodicSnapshotSource=fs.readFileSync(new URL('../modules/main-loop/simulation-update.js',import.meta.url),'utf8');
assert.ok(periodicSnapshotSource.includes('hitCd:m.hitCd||0,hitCdUntil:m.hitCdUntil||0'),'periodic mob snapshots must carry relative and absolute cooldown state');
assert.ok(worldSource.includes('hitCd:m.hitCd||0,hitCdUntil:m.hitCdUntil||0'),'full world snapshots must carry relative and absolute cooldown state');

const oldProtocolReceiver=makePeer({id:'old-protocol-receiver'});
oldProtocolReceiver.onMobHit({target:'old-protocol-receiver',damage:4,sanity:1,kind:'crawler'});
assert.equal(oldProtocolReceiver.me.hp,96,'legacy mob_hit payloads must keep their existing player-damage behavior');

console.log(JSON.stringify({ok:true,authorityHandoffCooldown:true,staleLegacySnapshotPreservesCooldown:true,clockSkewFallback:true,legacyPayloadCompatible:true}));
