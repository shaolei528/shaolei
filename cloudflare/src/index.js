const PROTOCOL = 'abyssal-relay-v1';
const WORLD_NAME = 'abyssal-wake-public-v1';
const CHANNEL_PREFIX = 'abyssal-wake-public-v1:';
const ZONE_CHANNEL_PREFIX = CHANNEL_PREFIX + 'zone:';
const MAX_MESSAGE_CHARS = 48 * 1024;
const MAX_CHANNELS = 8;
const MAX_MESSAGES_PER_SECOND = 120;
const PLAYER_IDENTITY_EVENTS = new Set(['move', 'attack', 'chat', 'map_pos', 'state_req']);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*'
    }
  });
}

function sanitizeSessionId(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
}

function sanitizeName(value) {
  return String(value || 'Wanderer').slice(0, 32);
}

function validChannel(value) {
  const key = String(value || '');
  return key.startsWith(CHANNEL_PREFIX) && key.length <= 160;
}

function zoneFromChannel(channel) {
  const key = String(channel || '');
  if (!key.startsWith(ZONE_CHANNEL_PREFIX)) return '';
  const zone = key.slice(ZONE_CHANNEL_PREFIX.length);
  return /^\d+:\d+$/.test(zone) ? zone : '';
}

function canonicalBroadcastPayload(event, payload, state, channel) {
  if (!PLAYER_IDENTITY_EVENTS.has(event)) return payload;
  const input = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const output = {
    ...input,
    id: state.sessionId,
    name: sanitizeName(state.name)
  };
  const zone = zoneFromChannel(channel);
  if (zone && (event === 'move' || event === 'attack' || event === 'state_req')) output.zone = zone;
  return output;
}

function defaultSocketState() {
  return {
    sessionId: '',
    name: 'Wanderer',
    subscriptions: [],
    presence: {},
    rateWindowAt: 0,
    rateCount: 0
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return json({
        ok: true,
        service: 'abyssal-wake-cloudflare-relay',
        protocol: PROTOCOL,
        transport: 'durable-object-websocket-hibernation',
        now: Date.now()
      });
    }

    if (url.pathname === '/ws') {
      if ((request.headers.get('Upgrade') || '').toLowerCase() !== 'websocket') {
        return new Response('WebSocket upgrade required', { status: 426 });
      }
      const id = env.WORLD.idFromName(WORLD_NAME);
      return env.WORLD.get(id).fetch(request);
    }

    return new Response('ABYSSAL WAKE Cloudflare realtime relay\n', {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store'
      }
    });
  }
};

export class GameWorld {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    if ((request.headers.get('Upgrade') || '').toLowerCase() !== 'websocket') {
      return new Response('WebSocket upgrade required', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment(defaultSocketState());
    return new Response(null, { status: 101, webSocket: client });
  }

  socketState(ws) {
    try {
      const value = ws.deserializeAttachment();
      if (value && typeof value === 'object') {
        return {
          ...defaultSocketState(),
          ...value,
          subscriptions: Array.isArray(value.subscriptions) ? value.subscriptions : [],
          presence: value.presence && typeof value.presence === 'object' ? value.presence : {}
        };
      }
    } catch {}
    return defaultSocketState();
  }

  saveState(ws, state) {
    try { ws.serializeAttachment(state); } catch {}
  }

  send(ws, packet) {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(packet));
        return true;
      }
    } catch {}
    return false;
  }

  openSockets() {
    return this.ctx.getWebSockets().filter(ws => ws.readyState === WebSocket.OPEN);
  }

  subscribers(channel, except = null) {
    const out = [];
    for (const ws of this.openSockets()) {
      if (ws === except) continue;
      const state = this.socketState(ws);
      if (state.subscriptions.includes(channel)) out.push({ ws, state });
    }
    return out;
  }

  presenceSnapshot(channel, except = null) {
    const entries = [];
    const seen = new Set();
    for (const { state } of this.subscribers(channel, except)) {
      const meta = state.presence[channel];
      if (!state.sessionId || !meta || seen.has(state.sessionId)) continue;
      seen.add(state.sessionId);
      entries.push({ ...meta, id: state.sessionId, name: sanitizeName(state.name) });
    }
    return entries;
  }

  publishPresence(channel, except = null) {
    const packet = {
      type: 'presence_snapshot',
      channel,
      entries: this.presenceSnapshot(channel, except)
    };
    for (const { ws } of this.subscribers(channel, except)) this.send(ws, packet);
  }

  rateAllowed(ws, state) {
    const now = Date.now();
    if (!state.rateWindowAt || now - state.rateWindowAt >= 1000) {
      state.rateWindowAt = now;
      state.rateCount = 0;
    }
    state.rateCount += 1;
    this.saveState(ws, state);
    return state.rateCount <= MAX_MESSAGES_PER_SECOND;
  }

  async webSocketMessage(ws, message) {
    let text;
    if (typeof message === 'string') text = message;
    else if (message instanceof ArrayBuffer) text = new TextDecoder().decode(message);
    else text = String(message || '');

    if (!text || text.length > MAX_MESSAGE_CHARS) {
      this.send(ws, { type: 'error', code: 'MESSAGE_TOO_LARGE' });
      return;
    }

    let msg;
    try { msg = JSON.parse(text); }
    catch {
      this.send(ws, { type: 'error', code: 'BAD_JSON' });
      return;
    }
    if (!msg || typeof msg !== 'object') return;

    const state = this.socketState(ws);
    if (!this.rateAllowed(ws, state)) {
      this.send(ws, { type: 'error', code: 'RATE_LIMIT' });
      return;
    }

    if (msg.type === 'hello') {
      const sessionId = sanitizeSessionId(msg.sessionId);
      if (!sessionId) {
        this.send(ws, { type: 'error', code: 'BAD_SESSION' });
        return;
      }
      for (const peer of this.openSockets()) {
        if (peer === ws) continue;
        const old = this.socketState(peer);
        if (old.sessionId !== sessionId) continue;
        const affected = Object.keys(old.presence || {});
        old.subscriptions = [];
        old.presence = {};
        this.saveState(peer, old);
        try { peer.close(4001, 'replaced'); } catch {}
        for (const channel of affected) this.publishPresence(channel, peer);
      }
      state.sessionId = sessionId;
      state.name = sanitizeName(msg.name);
      this.saveState(ws, state);
      this.send(ws, {
        type: 'hello_ack',
        sessionId,
        protocol: PROTOCOL,
        serverTime: Date.now()
      });
      return;
    }

    if (!state.sessionId) {
      this.send(ws, { type: 'error', code: 'HELLO_REQUIRED' });
      return;
    }

    if (msg.type === 'ping') {
      this.send(ws, { type: 'pong', id: String(msg.id || ''), serverTime: Date.now() });
      return;
    }

    const channel = String(msg.channel || '');
    if (!validChannel(channel)) {
      this.send(ws, { type: 'error', code: 'BAD_CHANNEL' });
      return;
    }

    if (msg.type === 'subscribe') {
      if (!state.subscriptions.includes(channel)) {
        if (state.subscriptions.length >= MAX_CHANNELS) {
          this.send(ws, { type: 'error', code: 'TOO_MANY_CHANNELS', channel });
          return;
        }
        state.subscriptions.push(channel);
        this.saveState(ws, state);
      }
      this.send(ws, { type: 'subscribed', channel });
      this.send(ws, { type: 'presence_snapshot', channel, entries: this.presenceSnapshot(channel) });
      return;
    }

    if (msg.type === 'unsubscribe') {
      const hadPresence = Boolean(state.presence[channel]);
      state.subscriptions = state.subscriptions.filter(key => key !== channel);
      delete state.presence[channel];
      this.saveState(ws, state);
      this.send(ws, { type: 'unsubscribed', channel });
      if (hadPresence) this.publishPresence(channel);
      return;
    }

    if (!state.subscriptions.includes(channel)) {
      this.send(ws, { type: 'error', code: 'NOT_SUBSCRIBED', channel });
      return;
    }

    if (msg.type === 'track') {
      const input = msg.meta && typeof msg.meta === 'object' ? msg.meta : {};
      state.presence[channel] = {
        ...input,
        id: state.sessionId,
        name: sanitizeName(state.name)
      };
      this.saveState(ws, state);
      this.publishPresence(channel);
      return;
    }

    if (msg.type === 'untrack') {
      const hadPresence = Boolean(state.presence[channel]);
      delete state.presence[channel];
      this.saveState(ws, state);
      if (hadPresence) this.publishPresence(channel);
      return;
    }

    if (msg.type === 'broadcast') {
      const event = String(msg.event || '').slice(0, 64);
      if (!event) return;
      const packet = {
        type: 'broadcast',
        channel,
        event,
        payload: canonicalBroadcastPayload(event, msg.payload, state, channel),
        from: state.sessionId,
        serverTime: Date.now()
      };
      for (const { ws: peer } of this.subscribers(channel, ws)) this.send(peer, packet);
    }
  }

  async webSocketClose(ws, code, reason) {
    const state = this.socketState(ws);
    const affected = Object.keys(state.presence || {});
    for (const channel of affected) this.publishPresence(channel, ws);
    try { ws.close(code, reason); } catch {}
  }

  async webSocketError(ws) {
    const state = this.socketState(ws);
    const affected = Object.keys(state.presence || {});
    for (const channel of affected) this.publishPresence(channel, ws);
  }
}
