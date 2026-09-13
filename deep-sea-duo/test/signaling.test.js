import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRelayToken,
  createRoomIdentity,
  createSignalRoom,
  getSignalOffer,
  normalizeRoomCode,
  probeSignal,
  waitForSignalAnswer,
} from '../src/network/signaling.js';

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
});

test('normalizes a room code to six digits', () => {
  assert.equal(normalizeRoomCode(' 12-34 56 xyz 78 '), '123456');
  assert.equal(normalizeRoomCode('42'), '42');
});

test('creates local room and relay identities before WebRTC finishes', () => {
  const identity = createRoomIdentity();
  const relayToken = createRelayToken();
  assert.match(identity.roomCode, /^\d{6}$/);
  assert.match(identity.hostToken, /^[a-f0-9]{48}$/);
  assert.match(relayToken, /^[a-f0-9]{48}$/);
  assert.notEqual(identity.hostToken, relayToken);
});

test('health probe accepts signaling v3', async () => {
  const ok = await probeSignal({
    fetchImpl: async url => {
      assert.match(String(url), /action=health/);
      return jsonResponse({ ok: true, version: 3 });
    },
  });
  assert.equal(ok, true);
});

test('creates a signaling room with a supplied identity and exposes its code immediately', async () => {
  let stored = null;
  let writeContentType = null;
  const announcedCodes = [];
  const offer = '{"type":"offer","sdp":"demo-offer"}';
  const identity = { roomCode: '482731', hostToken: 'a'.repeat(48) };
  const result = await createSignalRoom(offer, {
    skipProbe: true,
    identity,
    onRoomCode: code => announcedCodes.push(code),
    sleep: async () => {},
    fetchImpl: async (url, init = {}) => {
      if (init.method === 'POST') {
        writeContentType = init.headers['Content-Type'];
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
  assert.equal(writeContentType, 'text/plain;charset=UTF-8');
});

test('surfaces room-not-found from the signaling service', async () => {
  await assert.rejects(
    () => getSignalOffer('123456', { fetchImpl: async () => jsonResponse({ error: 'room_not_found' }, 404) }),
    error => error.code === 'room_not_found' && error.stage === 'S3',
  );
});

test('host polling resolves when the guest answer appears', async () => {
  let calls = 0;
  const answer = '{"type":"answer","sdp":"demo"}';
  const result = await waitForSignalAnswer('654321', 'b'.repeat(48), {
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
