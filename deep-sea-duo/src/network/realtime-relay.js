import { decodeMessage } from './messages.js';

const SUPABASE_URL = 'https://kqwlkleuguixkgutwuda.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_F5j_5pFw4tTDvYLe-mxzXQ_S1l37mUJ';
const SDK_URLS = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm',
  'https://esm.sh/@supabase/supabase-js@2.116.0?bundle',
];

let clientFactoryPromise = null;

const relayError = (code, message = code) => {
  const error = new Error(message);
  error.code = code;
  error.stage = 'R1';
  return error;
};

async function loadClientFactory() {
  if (clientFactoryPromise) return clientFactoryPromise;
  clientFactoryPromise = (async () => {
    let lastError = null;
    for (const url of SDK_URLS) {
      try {
        const module = await import(url);
        if (typeof module.createClient === 'function') return module.createClient;
      } catch (error) {
        lastError = error;
      }
    }
    throw relayError('relay-sdk-unavailable', lastError?.message || 'Realtime SDK unavailable');
  })();
  return clientFactoryPromise;
}

function validRoom(roomCode, relayToken, role) {
  return /^\d{6}$/.test(String(roomCode ?? ''))
    && /^[a-f0-9]{32,128}$/i.test(String(relayToken ?? ''))
    && ['host', 'guest'].includes(role);
}

export async function createRealtimeRelay({ roomCode, relayToken, role, handlers = {} }) {
  if (!validRoom(roomCode, relayToken, role)) throw relayError('relay-invalid-room');

  const createClient = await loadClientFactory();
  const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const topic = `deep-sea-duo:${roomCode}:${relayToken}`;
  const channel = client.channel(topic, {
    config: {
      private: false,
      broadcast: { self: false, ack: false },
    },
  });

  let closed = false;
  let subscribed = false;
  let peerSeen = false;
  let helloTimer = null;

  const sendHello = () => {
    if (closed || !subscribed) return;
    Promise.resolve(channel.send({
      type: 'broadcast',
      event: 'hello',
      payload: { role },
    })).catch(() => {});
  };

  const stopHello = () => {
    if (helloTimer) clearInterval(helloTimer);
    helloTimer = null;
  };

  channel.on('broadcast', { event: 'hello' }, ({ payload }) => {
    if (closed || payload?.role === role || !['host', 'guest'].includes(payload?.role)) return;
    const firstPeerSeen = !peerSeen;
    peerSeen = true;
    stopHello();
    if (firstPeerSeen) {
      handlers.onStatus?.('relay-connected');
      sendHello();
    }
  });

  channel.on('broadcast', { event: 'packet' }, ({ payload }) => {
    if (closed || !peerSeen || payload?.role === role || typeof payload?.data !== 'string') return;
    const message = decodeMessage(payload.data);
    if (message) handlers.onMessage?.(message);
  });

  channel.subscribe(status => {
    if (closed) return;
    if (status === 'SUBSCRIBED') {
      subscribed = true;
      sendHello();
      if (!helloTimer) helloTimer = setInterval(sendHello, 650);
      return;
    }
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      handlers.onStatus?.('relay-error');
      return;
    }
    if (status === 'CLOSED') {
      subscribed = false;
      if (peerSeen) handlers.onStatus?.('relay-closed');
    }
  });

  return {
    mode: 'relay',
    send(message) {
      if (closed || !subscribed || !peerSeen || typeof message !== 'string') return false;
      Promise.resolve(channel.send({
        type: 'broadcast',
        event: 'packet',
        payload: { role, data: message },
      })).catch(() => handlers.onStatus?.('relay-error'));
      return true;
    },
    isConnected() {
      return !closed && subscribed && peerSeen;
    },
    close() {
      if (closed) return;
      closed = true;
      stopHello();
      Promise.resolve(client.removeChannel(channel)).catch(() => {});
      try { client.realtime.disconnect(); } catch {}
    },
  };
}
