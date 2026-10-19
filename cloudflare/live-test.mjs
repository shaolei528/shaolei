import WebSocket from 'ws';

const URL = process.env.LIVE_RELAY_URL || 'wss://abyssal-wake-relay.zuoranzhang.workers.dev/ws';
const PROTOCOL = 'abyssal-relay-v1';
const GLOBAL = 'abyssal-wake-public-v1:global';
const ZONE = 'abyssal-wake-public-v1:zone:1:1';
const runId = Date.now().toString(36);

class Client {
  constructor(name, id = null) {
    this.name = name;
    this.id = id || `${name}-${runId}`;
    this.ws = null;
    this.messages = [];
    this.waiters = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(URL, { handshakeTimeout: 10000 });
      this.ws = ws;
      const timer = setTimeout(() => reject(new Error(`${this.name} open timeout`)), 12000);
      ws.on('open', () => {
        clearTimeout(timer);
        resolve();
      });
      ws.on('message', data => {
        let msg;
        try { msg = JSON.parse(data.toString()); } catch { return; }
        this.messages.push(msg);
        for (const waiter of [...this.waiters]) {
          if (waiter.predicate(msg)) {
            clearTimeout(waiter.timer);
            this.waiters.splice(this.waiters.indexOf(waiter), 1);
            waiter.resolve(msg);
          }
        }
      });
      ws.on('error', err => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  send(packet) {
    this.ws.send(JSON.stringify(packet));
  }

  waitFor(predicate, label, timeoutMs = 10000) {
    for (const msg of this.messages) {
      if (predicate(msg)) return Promise.resolve(msg);
    }
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve, reject, timer: null };
      waiter.timer = setTimeout(() => {
        const i = this.waiters.indexOf(waiter);
        if (i >= 0) this.waiters.splice(i, 1);
        reject(new Error(`${this.name} timeout waiting for ${label}; seen=${JSON.stringify(this.messages.slice(-8))}`));
      }, timeoutMs);
      this.waiters.push(waiter);
    });
  }

  clearMessages() {
    this.messages.length = 0;
  }

  closeAndWait(timeoutMs = 5000) {
    return new Promise(resolve => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) return resolve();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      this.ws.once('close', finish);
      try { this.ws.close(); } catch { finish(); }
      setTimeout(finish, timeoutMs);
    });
  }

  close() {
    try { this.ws?.close(); } catch {}
  }
}

function ids(entries) {
  return new Set((entries || []).map(x => x?.id));
}

function hasBoth(entries, a, b) {
  const set = ids(entries);
  return set.has(a) && set.has(b);
}

function hasAWithoutB(entries, a, b) {
  const set = ids(entries);
  return set.has(a) && !set.has(b);
}

async function hello(client, displayName) {
  client.send({ type: 'hello', sessionId: client.id, name: displayName, protocol: PROTOCOL });
  await client.waitFor(m => m.type === 'hello_ack' && m.protocol === PROTOCOL, 'hello_ack');
}

async function subscribeAndTrackGlobal(client, displayName) {
  client.send({ type: 'subscribe', channel: GLOBAL });
  await client.waitFor(m => m.type === 'subscribed' && m.channel === GLOBAL, 'global subscribed');
  client.send({ type: 'track', channel: GLOBAL, meta: { id: client.id, name: displayName, zone: '1:1' } });
}

async function subscribeAndTrackZone(client, displayName, x) {
  client.send({ type: 'subscribe', channel: ZONE });
  await client.waitFor(m => m.type === 'subscribed' && m.channel === ZONE, 'zone subscribed');
  client.send({ type: 'track', channel: ZONE, meta: { id: client.id, name: displayName, x, y: 2470 } });
}

const a = new Client('liveA');
const b = new Client('liveB');
let bReconnect = null;

try {
  await Promise.all([a.connect(), b.connect()]);
  await Promise.all([hello(a, 'Live A'), hello(b, 'Live B')]);

  await Promise.all([
    subscribeAndTrackGlobal(a, 'Live A'),
    subscribeAndTrackGlobal(b, 'Live B')
  ]);
  await Promise.all([
    a.waitFor(m => m.type === 'presence_snapshot' && m.channel === GLOBAL && hasBoth(m.entries, a.id, b.id), 'global presence=2'),
    b.waitFor(m => m.type === 'presence_snapshot' && m.channel === GLOBAL && hasBoth(m.entries, a.id, b.id), 'global presence=2')
  ]);

  const chatToken = `hello-${runId}`;
  a.send({ type: 'broadcast', channel: GLOBAL, event: 'chat', payload: { id: a.id, name: 'Live A', text: chatToken } });
  await b.waitFor(m => m.type === 'broadcast' && m.channel === GLOBAL && m.event === 'chat' && m.payload?.text === chatToken, 'chat A->B');

  await Promise.all([
    subscribeAndTrackZone(a, 'Live A', 2400),
    subscribeAndTrackZone(b, 'Live B', 2420)
  ]);
  await Promise.all([
    a.waitFor(m => m.type === 'presence_snapshot' && m.channel === ZONE && hasBoth(m.entries, a.id, b.id), 'zone presence=2'),
    b.waitFor(m => m.type === 'presence_snapshot' && m.channel === ZONE && hasBoth(m.entries, a.id, b.id), 'zone presence=2')
  ]);

  const seqA = 777;
  a.send({ type: 'broadcast', channel: ZONE, event: 'move', payload: { id: a.id, zone: '1:1', x: 2450, y: 2470, dir: 0, seq: seqA } });
  await b.waitFor(m => m.type === 'broadcast' && m.channel === ZONE && m.event === 'move' && m.payload?.id === a.id && m.payload?.seq === seqA, 'move A->B');

  const seqB = 778;
  b.send({ type: 'broadcast', channel: ZONE, event: 'move', payload: { id: b.id, zone: '1:1', x: 2440, y: 2480, dir: 3.14, seq: seqB } });
  await a.waitFor(m => m.type === 'broadcast' && m.channel === ZONE && m.event === 'move' && m.payload?.id === b.id && m.payload?.seq === seqB, 'move B->A');

  a.send({
    type: 'broadcast', channel: ZONE, event: 'attack',
    payload: { id: a.id, name: 'Live A', x: 2450, y: 2470, dir: 0, range: 62, damage: 11, zone: '1:1' }
  });
  await b.waitFor(m => m.type === 'broadcast' && m.channel === ZONE && m.event === 'attack' && m.payload?.id === a.id && m.payload?.damage === 11, 'attack sync');

  const mobId = `mob-${runId}`;
  a.send({
    type: 'broadcast', channel: ZONE, event: 'mobs',
    payload: { zone: '1:1', mobs: [{ id: mobId, kind: 'crawler', x: 2520, y: 2500, hp: 58, phase: 0, respawnAt: 0 }] }
  });
  await b.waitFor(m => m.type === 'broadcast' && m.channel === ZONE && m.event === 'mobs' && m.payload?.mobs?.[0]?.id === mobId, 'monster state sync');

  const resourceId = `resource-${runId}`;
  const until = Date.now() + 60000;
  a.send({ type: 'broadcast', channel: ZONE, event: 'harvest', payload: { zone: '1:1', rid: resourceId, until } });
  await b.waitFor(m => m.type === 'broadcast' && m.channel === ZONE && m.event === 'harvest' && m.payload?.rid === resourceId, 'resource state sync');

  const pingId = `p-${runId}`;
  a.send({ type: 'ping', id: pingId });
  await a.waitFor(m => m.type === 'pong' && m.id === pingId, 'pong');

  a.clearMessages();
  await b.closeAndWait();
  await a.waitFor(m => m.type === 'presence_snapshot' && m.channel === GLOBAL && hasAWithoutB(m.entries, a.id, b.id), 'global presence after B exit');
  await a.waitFor(m => m.type === 'presence_snapshot' && m.channel === ZONE && hasAWithoutB(m.entries, a.id, b.id), 'zone presence after B exit');

  bReconnect = new Client('liveB-reconnect', b.id);
  await bReconnect.connect();
  await hello(bReconnect, 'Live B');
  await subscribeAndTrackGlobal(bReconnect, 'Live B');
  await subscribeAndTrackZone(bReconnect, 'Live B', 2430);

  a.clearMessages();
  bReconnect.clearMessages();
  a.send({ type: 'track', channel: GLOBAL, meta: { id: a.id, name: 'Live A', zone: '1:1' } });
  a.send({ type: 'track', channel: ZONE, meta: { id: a.id, name: 'Live A', x: 2450, y: 2470 } });
  await Promise.all([
    a.waitFor(m => m.type === 'presence_snapshot' && m.channel === GLOBAL && hasBoth(m.entries, a.id, b.id), 'global presence=2 after reconnect'),
    a.waitFor(m => m.type === 'presence_snapshot' && m.channel === ZONE && hasBoth(m.entries, a.id, b.id), 'zone presence=2 after reconnect')
  ]);

  const worldMobId = `world-mob-${runId}`;
  a.send({
    type: 'broadcast', channel: ZONE, event: 'world',
    payload: { zone: '1:1', mobs: [{ id: worldMobId, kind: 'crawler', x: 2500, y: 2500, hp: 58, phase: 0, respawnAt: 0 }], harvested: [[resourceId, until]] }
  });
  await bReconnect.waitFor(m => m.type === 'broadcast' && m.channel === ZONE && m.event === 'world' && m.payload?.mobs?.[0]?.id === worldMobId && m.payload?.harvested?.[0]?.[0] === resourceId, 'world state delivery after reconnect');

  const reconnectSeq = 779;
  bReconnect.send({ type: 'broadcast', channel: ZONE, event: 'move', payload: { id: b.id, zone: '1:1', x: 2460, y: 2490, dir: 1.57, seq: reconnectSeq } });
  await a.waitFor(m => m.type === 'broadcast' && m.channel === ZONE && m.event === 'move' && m.payload?.id === b.id && m.payload?.seq === reconnectSeq, 'move after reconnect');

  console.log('LIVE RELAY PASS: A/B connect + online2 + chat + bidirectional move + attack + mobs + resource + exit presence + reconnect + world delivery + ping');
} finally {
  a.close();
  b.close();
  bReconnect?.close();
}
