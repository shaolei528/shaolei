'use strict';

const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');

const PORT = Number(process.env.PORT || 10000);
const CHANNEL_PREFIX = String(process.env.CHANNEL_PREFIX || 'abyssal-wake-public-v1');
const MAX_PAYLOAD = 32 * 1024;
const MAX_CHANNELS_PER_CLIENT = 8;
const MAX_MESSAGES_PER_SECOND = 120;

const clients = new Set();
const channels = new Map(); // channel -> Map(sessionId -> { ws, meta })

function send(ws, payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;
  try {
    ws.send(JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

function validChannel(value) {
  const key = String(value || '');
  return key.startsWith(CHANNEL_PREFIX + ':') && key.length <= 160;
}

function getChannel(key) {
  let map = channels.get(key);
  if (!map) {
    map = new Map();
    channels.set(key, map);
  }
  return map;
}

function presenceSnapshot(key) {
  const map = channels.get(key);
  if (!map) return [];
  return [...map.entries()].map(([id, entry]) => ({ id, ...(entry.meta || {}) }));
}

function broadcastToChannel(key, payload, except = null) {
  for (const client of clients) {
    if (client === except || client.readyState !== WebSocket.OPEN) continue;
    if (!client._abyssal?.subscriptions?.has(key)) continue;
    send(client, payload);
  }
}

function publishPresence(key) {
  const packet = { type: 'presence_snapshot', channel: key, entries: presenceSnapshot(key) };
  broadcastToChannel(key, packet);
}

function removePresence(ws, key) {
  const sessionId = ws._abyssal?.sessionId;
  if (!sessionId) return;
  const map = channels.get(key);
  if (!map) return;
  if (map.delete(sessionId)) publishPresence(key);
  if (map.size === 0) channels.delete(key);
}

function cleanup(ws) {
  const subscriptions = ws._abyssal?.subscriptions;
  if (subscriptions) {
    for (const key of [...subscriptions]) removePresence(ws, key);
    subscriptions.clear();
  }
  clients.delete(ws);
}

function rateAllowed(ws) {
  const now = Date.now();
  const state = ws._abyssal;
  if (!state) return false;
  if (!state.rateWindowAt || now - state.rateWindowAt >= 1000) {
    state.rateWindowAt = now;
    state.rateCount = 0;
  }
  state.rateCount += 1;
  return state.rateCount <= MAX_MESSAGES_PER_SECOND;
}

function parseMessage(data) {
  if (typeof data === 'string') return JSON.parse(data);
  if (Buffer.isBuffer(data)) return JSON.parse(data.toString('utf8'));
  return JSON.parse(String(data));
}

function handleMessage(ws, raw) {
  if (!rateAllowed(ws)) {
    send(ws, { type: 'error', code: 'RATE_LIMIT', message: 'Too many packets' });
    return;
  }

  let msg;
  try {
    msg = parseMessage(raw);
  } catch {
    send(ws, { type: 'error', code: 'BAD_JSON' });
    return;
  }
  if (!msg || typeof msg !== 'object') return;

  const state = ws._abyssal;

  if (msg.type === 'hello') {
    const sessionId = String(msg.sessionId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
    if (!sessionId) {
      send(ws, { type: 'error', code: 'BAD_SESSION' });
      return;
    }
    state.sessionId = sessionId;
    state.name = String(msg.name || 'Wanderer').slice(0, 32);
    send(ws, {
      type: 'hello_ack',
      sessionId,
      protocol: 'abyssal-relay-v1',
      serverTime: Date.now()
    });
    return;
  }

  if (!state.sessionId) {
    send(ws, { type: 'error', code: 'HELLO_REQUIRED' });
    return;
  }

  if (msg.type === 'ping') {
    send(ws, { type: 'pong', id: String(msg.id || ''), serverTime: Date.now() });
    return;
  }

  const key = String(msg.channel || '');
  if (!validChannel(key)) {
    send(ws, { type: 'error', code: 'BAD_CHANNEL' });
    return;
  }

  if (msg.type === 'subscribe') {
    if (!state.subscriptions.has(key) && state.subscriptions.size >= MAX_CHANNELS_PER_CLIENT) {
      send(ws, { type: 'error', code: 'TOO_MANY_CHANNELS', channel: key });
      return;
    }
    state.subscriptions.add(key);
    getChannel(key);
    send(ws, { type: 'subscribed', channel: key });
    send(ws, { type: 'presence_snapshot', channel: key, entries: presenceSnapshot(key) });
    return;
  }

  if (msg.type === 'unsubscribe') {
    removePresence(ws, key);
    state.subscriptions.delete(key);
    send(ws, { type: 'unsubscribed', channel: key });
    return;
  }

  if (!state.subscriptions.has(key)) {
    send(ws, { type: 'error', code: 'NOT_SUBSCRIBED', channel: key });
    return;
  }

  if (msg.type === 'track') {
    const meta = msg.meta && typeof msg.meta === 'object' ? msg.meta : {};
    const cleanMeta = {
      ...meta,
      id: state.sessionId,
      name: String(meta.name || state.name || 'Wanderer').slice(0, 32)
    };
    getChannel(key).set(state.sessionId, { ws, meta: cleanMeta });
    publishPresence(key);
    return;
  }

  if (msg.type === 'untrack') {
    removePresence(ws, key);
    return;
  }

  if (msg.type === 'broadcast') {
    const event = String(msg.event || '').slice(0, 64);
    if (!event) return;
    broadcastToChannel(key, {
      type: 'broadcast',
      channel: key,
      event,
      payload: msg.payload,
      from: state.sessionId,
      serverTime: Date.now()
    }, ws);
    return;
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      ok: true,
      service: 'abyssal-wake-relay',
      protocol: 'abyssal-relay-v1',
      clients: clients.size,
      channels: channels.size,
      now: Date.now()
    }));
    return;
  }

  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('ABYSSAL WAKE realtime relay\n');
});

const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD });

server.on('upgrade', (req, socket, head) => {
  let pathname = '/';
  try {
    pathname = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname;
  } catch {}
  if (pathname !== '/ws') {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
});

wss.on('connection', ws => {
  ws.isAlive = true;
  ws._abyssal = {
    sessionId: '',
    name: 'Wanderer',
    subscriptions: new Set(),
    rateWindowAt: Date.now(),
    rateCount: 0
  };
  clients.add(ws);

  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', data => handleMessage(ws, data));
  ws.on('close', () => cleanup(ws));
  ws.on('error', () => cleanup(ws));
});

const heartbeat = setInterval(() => {
  for (const ws of clients) {
    if (ws.isAlive === false) {
      try { ws.terminate(); } catch {}
      cleanup(ws);
      continue;
    }
    ws.isAlive = false;
    try { ws.ping(); } catch {}
  }
}, 25000);

server.on('close', () => clearInterval(heartbeat));
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[abyssal-relay] listening on ${PORT}`);
});
