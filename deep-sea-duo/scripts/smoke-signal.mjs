const endpoint = 'https://kqwlkleuguixkgutwuda.supabase.co/functions/v1/deep-sea-duo-signal';

async function call(action, payload = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${action} failed: ${response.status} ${JSON.stringify(data)}`);
  return data;
}

const offer = JSON.stringify({ type: 'offer', sdp: 'v=0\r\no=deep-sea-duo 1 1 IN IP4 127.0.0.1\r\ns=smoke-offer\r\nt=0 0\r\n' });
const answer = JSON.stringify({ type: 'answer', sdp: 'v=0\r\no=deep-sea-duo 2 2 IN IP4 127.0.0.1\r\ns=smoke-answer\r\nt=0 0\r\n' });

const created = await call('create', { offer });
if (!/^\d{6}$/.test(created.roomCode)) throw new Error(`invalid room code: ${created.roomCode}`);
if (typeof created.hostToken !== 'string' || created.hostToken.length < 32) throw new Error('invalid host token');

const fetched = await call('offer', { roomCode: created.roomCode });
if (fetched.offer !== offer) throw new Error('offer round-trip mismatch');

await call('answer', { roomCode: created.roomCode, answer });
const polled = await call('poll', { roomCode: created.roomCode, hostToken: created.hostToken });
if (polled.answer !== answer) throw new Error('answer round-trip mismatch');

await call('close', { roomCode: created.roomCode, hostToken: created.hostToken });
console.log(`signal smoke test passed for room ${created.roomCode}`);
