import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NTFY_BASE_URL,
  SIGNAL_URL,
  createRoomIdentity,
  createSignalRoom,
  getSignalBackend,
  getSignalOffer,
  normalizeRoomCode,
  pollSignalAnswer,
  probeSignal,
  submitSignalAnswer,
  waitForSignalAnswer,
} from '../src/network/signaling.js';

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json' },
});

const textResponse = (body, status = 200) => new Response(body, {
  status,
  headers: { 'content-type': 'application/x-ndjson' },
});

test('uses same-origin Netlify API and explicit ntfy fallback backends', () => {
  assert.equal(SIGNAL_URL, '/room');
  assert.equal(NTFY_BASE_URL, 'https://ntfy.sh');
  assert.equal(getSignalBackend({ backend: 'netlify' }), 'netlify');
  assert.equal(getSignalBackend({ backend: 'ntfy' }), 'ntfy');
});

test('normalizes a room code to six digits', () => {
  assert.equal(normalizeRoomCode(' 12-34 56 xyz 78 '), '123456');
  assert.equal(normalizeRoomCode('42'), '42');
});

test('creates a local room identity before WebRTC finishes', () => {
  const identity = createRoomIdentity();
  assert.match(identity.roomCode, /^\d{6}$/);
  assert.match(identity.hostToken, /^[a-f0-9]{48}$/);
});

test('health probe accepts Netlify signaling v1', async () => {
  const ok = await probeSignal({
    backend: 'netlify',
    fetchImpl: async url => {
      assert.match(String(url), /\/room\?action=health/);
      return jsonResponse({ ok: true, version: 1 });
    },
  });
  assert.equal(ok, true);
});

test('creates a Netlify signaling room with JSON POST and confirms the stored offer', async () => {
  let stored = null;
  let writeContentType = null;
  const announcedCodes = [];
  const offer = '{"type":"offer","sdp":"demo-offer"}';
  const identity = { roomCode: '482731', hostToken: 'a'.repeat(48) };
  const result = await createSignalRoom(offer, {
    backend: 'netlify',
    skipProbe: true,
    identity,
    onRoomCode: code => announcedCodes.push(code),
    sleep: async () => {},
    fetchImpl: async (url, init = {}) => {
      if (init.method === 'POST') {
        writeContentType = init.headers['content-type'];
        stored = JSON.parse(init.body);
        return jsonResponse({ ok: true });
      }
      const requestUrl = new URL(url);
      assert.equal(requestUrl.searchParams.get('action'), 'offer');
      assert.equal(requestUrl.searchParams.get('roomCode'), stored.roomCode);
      return jsonResponse({ offer: stored.offer });
    },
  });
  assert.equal(result.roomCode, '482731');
  assert.equal(result.hostToken, identity.hostToken);
  assert.deepEqual(announcedCodes, ['482731']);
  assert.equal(stored.roomCode, result.roomCode);
  assert.equal(stored.hostToken, result.hostToken);
  assert.equal(stored.offer, offer);
  assert.equal(writeContentType, 'application/json');
});

test('Netlify signaling retries when a generated room code collides', async () => {
  let writes = 0;
  let latestOffer = null;
  const offer = '{"type":"offer","sdp":"demo-offer"}';
  const result = await createSignalRoom(offer, {
    backend: 'netlify',
    skipProbe: true,
    identity: { roomCode: '111111', hostToken: 'a'.repeat(48) },
    sleep: async () => {},
    fetchImpl: async (_url, init = {}) => {
      if (init.method === 'POST') {
        writes += 1;
        if (writes === 1) return jsonResponse({ error: 'room_code_collision' }, 409);
        latestOffer = JSON.parse(init.body).offer;
        return jsonResponse({ ok: true });
      }
      return jsonResponse({ offer: latestOffer });
    },
  });
  assert.equal(writes, 2);
  assert.match(result.roomCode, /^\d{6}$/);
  assert.notEqual(result.roomCode, '111111');
});

test('surfaces room-not-found from the Netlify signaling service', async () => {
  await assert.rejects(
    () => getSignalOffer('123456', {
      backend: 'netlify',
      fetchImpl: async () => jsonResponse({ error: 'room_not_found' }, 404),
    }),
    error => error.code === 'room_not_found' && error.stage === 'S3',
  );
});

test('Netlify host polling resolves when the guest answer appears', async () => {
  let calls = 0;
  const answer = '{"type":"answer","sdp":"demo"}';
  const result = await waitForSignalAnswer('654321', 'b'.repeat(48), {
    backend: 'netlify',
    intervalMs: 0,
    timeoutMs: 1000,
    sleep: async () => {},
    fetchImpl: async url => {
      const requestUrl = new URL(url);
      assert.equal(requestUrl.searchParams.get('action'), 'poll');
      calls += 1;
      return jsonResponse({ answer: calls < 3 ? null : answer });
    },
  });
  assert.equal(result, answer);
  assert.equal(calls, 3);
});

test('ntfy health probe uses the public health endpoint', async () => {
  const ok = await probeSignal({
    backend: 'ntfy',
    fetchImpl: async url => {
      assert.equal(String(url), 'https://ntfy.sh/v1/health');
      return jsonResponse({ healthy: true });
    },
  });
  assert.equal(ok, true);
});

test('ntfy chunks and reassembles long Offer and Answer payloads', async () => {
  const published = [];
  const fetchImpl = async (url, init = {}) => {
    const value = String(url);
    if (value === 'https://ntfy.sh/v1/health') return jsonResponse({ healthy: true });
    if (init.method === 'POST') {
      published.push(String(init.body));
      return jsonResponse({ id: String(published.length), time: Math.floor(Date.now() / 1000) });
    }
    if (value.includes('/json?poll=1')) {
      return textResponse(published.map((message, index) => JSON.stringify({
        id: String(index + 1),
        time: Math.floor(Date.now() / 1000),
        event: 'message',
        topic: 'demo',
        message,
      })).join('\n'));
    }
    throw new Error(`unexpected mocked URL: ${value}`);
  };

  const identity = { roomCode: '739281', hostToken: 'c'.repeat(48) };
  const offer = JSON.stringify({ type: 'offer', sdp: `v=0\r\n${'offer-候选-'.repeat(800)}` });
  const answer = JSON.stringify({ type: 'answer', sdp: `v=0\r\n${'answer-候选-'.repeat(650)}` });

  await probeSignal({ backend: 'ntfy', fetchImpl });
  const session = await createSignalRoom(offer, {
    backend: 'ntfy',
    skipProbe: true,
    identity,
    fetchImpl,
  });
  assert.equal(session.backend, 'ntfy');
  assert.ok(published.length > 1, 'long SDP should be split into multiple ntfy messages');

  const fetchedOffer = await getSignalOffer(identity.roomCode, {
    backend: 'ntfy',
    fetchImpl,
    sleep: async () => {},
  });
  assert.equal(fetchedOffer, offer);

  const offerChunkCount = published.length;
  await submitSignalAnswer(identity.roomCode, answer, { backend: 'ntfy', fetchImpl });
  assert.ok(published.length > offerChunkCount + 1, 'long answer should also be chunked');

  const fetchedAnswer = await pollSignalAnswer(identity.roomCode, identity.hostToken, {
    backend: 'ntfy',
    fetchImpl,
  });
  assert.equal(fetchedAnswer, answer);
});
