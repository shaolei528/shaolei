import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../modules/network/camp-world-sync-v1.js', import.meta.url), 'utf8');
const listeners = new Map();
const sent = [];
const applied = [];
const states = {
  farm: { version: 1, plants: [{ plotId: 'bed-a', cropId: 'saltleaf', plantedAt: 10 }] },
  livestock: { version: 1, nextId: 2, animals: [{ id: 'chicken-a' }] },
  building: { version: 1, nextId: 2, structures: [{ id: 'barrier-a', zone: '1:1' }] }
};
const zoneChannel = {
  send(packet) { sent.push(packet); return 'ok'; }
};
const context = vm.createContext({
  SESSION_ID: 'player-local',
  currentZone: '1:1',
  zoneConnected: true,
  zoneLeader: false,
  zoneLeaderId: 'player-leader',
  zoneCh: zoneChannel,
  window: { addEventListener(type, listener) { listeners.set(type, listener); } },
  ABYSSAL_FARMING_V1: {
    exportWorldSnapshot: () => states.farm,
    applyRemoteSnapshot: state => { applied.push(['farm', state]); return true; }
  },
  ABYSSAL_LIVESTOCK_V1: {
    exportWorldSnapshot: () => states.livestock,
    applyRemoteSnapshot: state => { applied.push(['livestock', state]); return true; }
  },
  ABYSSAL_HOME_BUILDING_V1: {
    snapshotForZone: zone => zone === '1:1' ? states.building : { version: 1, nextId: 1, structures: [] },
    applyRemoteZoneSnapshot: (zone, state) => { applied.push(['building', zone, state]); return true; }
  }
});
context.globalThis = context;
vm.runInContext(source, context, { filename: 'camp-world-sync-v1.js' });
const sync = context.ABYSSAL_CAMP_WORLD_SYNC_V1;

assert.equal(sync.version, 1);
assert.equal(sync.sendDomain('farm'), true, 'a connected local owner publishes its domain snapshot');
const farmPacket = sent.at(-1);
assert.equal(farmPacket.event, 'camp_world_v1');
assert.equal(farmPacket.payload.sessionId, 'player-local');
assert.ok(farmPacket.payload.epoch.length >= 8, 'publisher epoch makes sequence counters safe across reloads');
assert.equal(farmPacket.payload.domain, 'farm');

listeners.get('abyssal:crop-planted')({ detail: { playerId: 'player-local', zone: '1:1' } });
assert.equal(sent.at(-1).payload.domain, 'farm', 'local farming owner events publish an updated snapshot');
const packetCountBeforeWrongOwner = sent.length;
listeners.get('abyssal:crop-planted')({ detail: { playerId: 'someone-else', zone: '1:1' } });
assert.equal(sent.length, packetCountBeforeWrongOwner, 'events from another player are not republished');

assert.equal(sync.requestZoneState('1:1'), true);
assert.equal(sent.at(-1).event, 'camp_world_request_v1');
assert.equal(sync.respondToRequest({ version: 1, zone: '1:1' }, { from: 'player-visitor' }), false, 'only the elected zone leader answers snapshots');

const remoteFarm = {
  version: 1, domain: 'farm', zone: '1:1', sessionId: 'player-leader', epoch: 'epoch-remote-0001', seq: 1,
  state: { version: 1, plants: [{ plotId: 'bed-b', cropId: 'saltleaf', plantedAt: 20 }] }
};
assert.equal(sync.receive(remoteFarm, { from: 'player-leader', serverTime: 100 }), true);
assert.deepEqual(applied.at(-1), ['farm', remoteFarm.state]);
assert.equal(sync.receive(remoteFarm, { from: 'player-leader' }), false, 'replayed snapshots are rejected');
assert.equal(sync.receive({ ...remoteFarm, epoch: 'epoch-remote-0002', seq: 1 }, { from: 'player-leader' }), true, 'a fresh page session may restart its sequence');
assert.equal(sync.receive(remoteFarm, { from: 'spoofed-player' }), false, 'payload identity must match relay sender metadata');
assert.equal(sync.receive({ ...remoteFarm, zone: '1:2', epoch: 'epoch-remote-0003' }, { from: 'player-leader' }), false, 'updates from another zone are rejected');
const durableRelaySnapshot={...remoteFarm,sessionId:'abyssal-relay',epoch:'abyssal-relay-world-v1',seq:1};
assert.equal(sync.receive(durableRelaySnapshot,{from:'abyssal-relay'}),false,'followers only accept the elected zone leader, not the storage relay');
context.currentZone = '1:2';
assert.equal(sync.sendDomain('farm'), false, 'farm snapshots are limited to their home zone');
context.currentZone = '1:1';

context.zoneLeader = true;
context.zoneLeaderId = 'player-local';
assert.equal(sync.respondToRequest({ version: 1, zone: '1:1', sessionId: 'spoofed-player' }, { from: 'player-visitor' }), false, 'join requests must match relay-authenticated sender identity');
assert.equal(sync.respondToRequest({ version: 1, zone: '1:1', sessionId: 'player-visitor' }, { from: 'player-visitor' }), true);
assert.deepEqual(sent.slice(-3).map(packet => packet.payload.domain), ['farm', 'livestock', 'building'], 'joining players receive all zone-owned camp snapshots');
const sentBeforeDurable = sent.length;
assert.equal(sync.receive(durableRelaySnapshot,{from:'abyssal-relay'}),true,'the elected zone leader accepts the persisted snapshot relayed by the Worker');
assert.deepEqual(applied.at(-1),['farm',durableRelaySnapshot.state]);
assert.equal(sent.length,sentBeforeDurable+1,'the elected leader republishes the restored snapshot through the owner sync');
const sentBeforeCanonical = sent.length;
assert.equal(sync.receive({ ...remoteFarm, sessionId: 'player-visitor', epoch: 'epoch-remote-0004', seq: 1 }, { from: 'player-visitor' }), true);
assert.equal(sent.length, sentBeforeCanonical + 1, 'the elected leader republishes the joining player snapshot as the zone snapshot');

console.log(JSON.stringify({ ok: true, localEvents: true, joinSnapshot: true, senderValidation: true, zoneIsolation: true, replayProtection: true, reloadEpoch: true, leaderRelay: true }));
