'use strict';

const { spawn } = require('child_process');
const { WebSocket } = require('ws');

const PORT = 18080;
const URL = `ws://127.0.0.1:${PORT}/ws`;
const GLOBAL = 'abyssal-wake-public-v1:global';
const ZONE = 'abyssal-wake-public-v1:zone:1:1';

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function waitFor(ws, predicate, timeout = 3500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off('message', onMessage);
      reject(new Error('timeout waiting for packet'));
    }, timeout);
    function onMessage(raw) {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (!predicate(msg)) return;
      clearTimeout(timer);
      ws.off('message', onMessage);
      resolve(msg);
    }
    ws.on('message', onMessage);
  });
}

async function connect(sessionId, name) {
  const ws = new WebSocket(URL);
  await new Promise((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });
  ws.send(JSON.stringify({ type: 'hello', sessionId, name, protocol: 'abyssal-relay-v1' }));
  await waitFor(ws, msg => msg.type === 'hello_ack' && msg.sessionId === sessionId);
  return ws;
}

async function subscribeAndTrack(ws, channel, meta) {
  ws.send(JSON.stringify({ type: 'subscribe', channel }));
  await waitFor(ws, msg => msg.type === 'subscribed' && msg.channel === channel);
  ws.send(JSON.stringify({ type: 'track', channel, meta }));
}

async function main() {
  const server = spawn(process.execPath, ['server.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: String(PORT), CHANNEL_PREFIX: 'abyssal-wake-public-v1' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let ready = false;
  server.stdout.on('data', chunk => {
    if (chunk.toString().includes('listening')) ready = true;
  });
  let stderr = '';
  server.stderr.on('data', chunk => { stderr += chunk.toString(); });

  for (let i = 0; i < 50 && !ready; i++) await delay(50);
  if (!ready) throw new Error('relay did not start: ' + stderr);

  let a, b;
  try {
    a = await connect('test-a', 'Alice');
    b = await connect('test-b', 'Bob');

    await subscribeAndTrack(a, GLOBAL, { id: 'test-a', name: 'Alice', zone: '1:1', x: 2400, y: 2400 });
    await subscribeAndTrack(b, GLOBAL, { id: 'test-b', name: 'Bob', zone: '1:1', x: 2410, y: 2400 });

    const globalPresence = await waitFor(a, msg => msg.type === 'presence_snapshot' && msg.channel === GLOBAL && Array.isArray(msg.entries) && msg.entries.length === 2);
    if (!globalPresence.entries.some(p => p.id === 'test-a') || !globalPresence.entries.some(p => p.id === 'test-b')) throw new Error('global presence mismatch');

    const chatPromise = waitFor(b, msg => msg.type === 'broadcast' && msg.channel === GLOBAL && msg.event === 'chat');
    a.send(JSON.stringify({ type: 'broadcast', channel: GLOBAL, event: 'chat', payload: { id: 'test-a', name: 'Alice', text: 'hello' } }));
    const chat = await chatPromise;
    if (chat.payload?.text !== 'hello') throw new Error('chat relay mismatch');

    await subscribeAndTrack(a, ZONE, { id: 'test-a', name: 'Alice', x: 2400, y: 2400 });
    await subscribeAndTrack(b, ZONE, { id: 'test-b', name: 'Bob', x: 2410, y: 2400 });
    await waitFor(a, msg => msg.type === 'presence_snapshot' && msg.channel === ZONE && msg.entries?.length === 2);

    const movePromise = waitFor(b, msg => msg.type === 'broadcast' && msg.channel === ZONE && msg.event === 'move');
    a.send(JSON.stringify({ type: 'broadcast', channel: ZONE, event: 'move', payload: { id: 'test-a', zone: '1:1', x: 2420, y: 2400, seq: 1 } }));
    const move = await movePromise;
    if (move.payload?.x !== 2420) throw new Error('movement relay mismatch');

    const pongPromise = waitFor(a, msg => msg.type === 'pong' && msg.id === 'ping-1');
    a.send(JSON.stringify({ type: 'ping', id: 'ping-1' }));
    await pongPromise;

    console.log('relay smoke test passed');
  } finally {
    try { a?.close(); } catch {}
    try { b?.close(); } catch {}
    server.kill('SIGTERM');
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
