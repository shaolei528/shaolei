import WebSocket from 'ws';

const URL = process.env.LIVE_RELAY_URL || 'wss://abyssal-wake-relay.zuoranzhang.workers.dev/ws';
const PROTOCOL = 'abyssal-relay-v1';
const GLOBAL = 'abyssal-wake-public-v1:global';
const ZONE = 'abyssal-wake-public-v1:zone:1:1';
const runId = Date.now().toString(36);

class Client {
  constructor(name) {
    this.name = name;
    this.id = `${name}-${runId}`;
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

  close() {
    try { this.ws?.close(); } catch {}
  }
}

function hasBoth(entries, a, b) {
  const ids = new Set((entries || []).map(x => x?.id));
  return ids.has(a) && ids.has(b);
}

const a = new Client('liveA');
const b = new Client('liveB');

try {
  await Promise.all([a.connect(), b.connect()]);

  a.send({ type: 'hello', sessionId: a.id, name: 'Live A', protocol: PROTOCOL });
  b.send({ type: 'hello', sessionId: b.id, name: 'Live B', protocol: PROTOCOL });
  await Promise.all([
    a.waitFor(m => m.type === 'hello_ack' && m.protocol === PROTOCOL, 'hello_ack'),
    b.waitFor(m => m.type === 'hello_ack' && m.protocol === PROTOCOL, 'hello_ack')
  ]);

  a.send({ type: 'subscribe', channel: GLOBAL });
  b.send({ type: 'subscribe', channel: GLOBAL });
  await Promise.all([
    a.waitFor(m => m.type === 'subscribed' && m.channel === GLOBAL, 'global subscribed'),
    b.waitFor(m => m.type === 'subscribed' && m.channel === GLOBAL, 'global subscribed')
  ]);
  a.send({ type: 'track', channel: GLOBAL, meta: { id: a.id, name: 'Live A', zone: '1:1' } });
  b.send({ type: 'track', channel: GLOBAL, meta: { id: b.id, name: 'Live B', zone: '1:1' } });
  await Promise.all([
    a.waitFor(m => m.type === 'presence_snapshot' && m.channel === GLOBAL && hasBoth(m.entries, a.id, b.id), 'global presence=2'),
    b.waitFor(m => m.type === 'presence_snapshot' && m.channel === GLOBAL && hasBoth(m.entries, a.id, b.id), 'global presence=2')
  ]);

  const chatToken = `hello-${runId}`;
  a.send({ type: 'broadcast', channel: GLOBAL, event: 'chat', payload: { id: a.id, name: 'Live A', text: chatToken } });
  await b.waitFor(m => m.type === 'broadcast' && m.channel === GLOBAL && m.event === 'chat' && m.payload?.text === chatToken, 'chat A->B');

  a.send({ type: 'subscribe', channel: ZONE });
  b.send({ type: 'subscribe', channel: ZONE });
  await Promise.all([
    a.waitFor(m => m.type === 'subscribed' && m.channel === ZONE, 'zone subscribed'),
    b.waitFor(m => m.type === 'subscribed' && m.channel === ZONE, 'zone subscribed')
  ]);
  a.send({ type: 'track', channel: ZONE, meta: { id: a.id, name: 'Live A', x: 2400, y: 2470 } });
  b.send({ type: 'track', channel: ZONE, meta: { id: b.id, name: 'Live B', x: 2420, y: 2470 } });
  await Promise.all([
    a.waitFor(m => m.type === 'presence_snapshot' && m.channel === ZONE && hasBoth(m.entries, a.id, b.id), 'zone presence=2'),
    b.waitFor(m => m.type === 'presence_snapshot' && m.channel === ZONE && hasBoth(m.entries, a.id, b.id), 'zone presence=2')
  ]);

  const seq = 777;
  a.send({ type: 'broadcast', channel: ZONE, event: 'move', payload: { id: a.id, x: 2450, y: 2470, dir: 0, seq } });
  await b.waitFor(m => m.type === 'broadcast' && m.channel === ZONE && m.event === 'move' && m.payload?.seq === seq, 'move A->B');

  const pingId = `p-${runId}`;
  a.send({ type: 'ping', id: pingId });
  await a.waitFor(m => m.type === 'pong' && m.id === pingId, 'pong');

  console.log('LIVE RELAY PASS: hello + global presence2 + chat + zone presence2 + move + ping');
} finally {
  a.close();
  b.close();
}
