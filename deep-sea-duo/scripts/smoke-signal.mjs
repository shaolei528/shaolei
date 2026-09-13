const endpoint = 'https://kqwlkleuguixkgutwuda.supabase.co/functions/v1/deep-sea-duo-signal';
const browserOrigin = 'https://rawcdn.githack.com';

const withOrigin = { Origin: browserOrigin };

async function read(action, payload = {}) {
  const url = new URL(endpoint);
  url.searchParams.set('action', action);
  for (const [key, value] of Object.entries(payload)) url.searchParams.set(key, String(value));
  const response = await fetch(url, { headers: withOrigin, cache: 'no-store' });
  if (response.headers.get('access-control-allow-origin') !== '*') {
    throw new Error(`missing GET CORS header for ${action}`);
  }
  const data = await response.json();
  if (!response.ok) throw new Error(`${action} GET failed: ${response.status} ${JSON.stringify(data)}`);
  return data;
}

async function write(action, payload = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Origin: browserOrigin, 'content-type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({ action, ...payload }),
  });
  if (response.headers.get('access-control-allow-origin') !== '*') {
    throw new Error(`missing POST CORS header for ${action}`);
  }
  const data = await response.json();
  if (!response.ok) throw new Error(`${action} POST failed: ${response.status} ${JSON.stringify(data)}`);
  return data;
}

const preflight = await fetch(endpoint, {
  method: 'OPTIONS',
  headers: {
    Origin: browserOrigin,
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type',
  },
});
if (!preflight.ok || preflight.headers.get('access-control-allow-origin') !== '*') {
  throw new Error(`CORS preflight failed: ${preflight.status}`);
}

const health = await read('health');
if (health.ok !== true || Number(health.version) < 3) throw new Error(`unexpected health: ${JSON.stringify(health)}`);

const values = new Uint32Array(6);
crypto.getRandomValues(values);
const roomCode = Array.from(values, value => String(value % 10)).join('');
const tokenBytes = new Uint8Array(24);
crypto.getRandomValues(tokenBytes);
const hostToken = Array.from(tokenBytes, byte => byte.toString(16).padStart(2, '0')).join('');
const offer = JSON.stringify({ type: 'offer', sdp: 'v=0\r\no=deep-sea-duo 1 1 IN IP4 127.0.0.1\r\ns=smoke-offer\r\nt=0 0\r\n' });
const answer = JSON.stringify({ type: 'answer', sdp: 'v=0\r\no=deep-sea-duo 2 2 IN IP4 127.0.0.1\r\ns=smoke-answer\r\nt=0 0\r\n' });

await write('create', { roomCode, hostToken, offer });
const fetched = await read('offer', { roomCode });
if (fetched.offer !== offer) throw new Error('offer round-trip mismatch');

await write('answer', { roomCode, answer });
const status = await read('status', { roomCode });
if (status.hasAnswer !== true) throw new Error('answer write was not confirmed');
const polled = await read('poll', { roomCode, hostToken });
if (polled.answer !== answer) throw new Error('answer round-trip mismatch');

await write('close', { roomCode, hostToken });
console.log(`signal v3 browser-path smoke test passed for room ${roomCode}`);
