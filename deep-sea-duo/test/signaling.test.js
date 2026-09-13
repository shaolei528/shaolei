import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSignalRoom,
  getSignalOffer,
  normalizeRoomCode,
  waitForSignalAnswer,
} from '../src/network/signaling.js';

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json' },
});

test('normalizes a room code to six digits', () => {
  assert.equal(normalizeRoomCode(' 12-34 56 xyz 78 '), '123456');
  assert.equal(normalizeRoomCode('42'), '42');
});

test('creates a signaling room with a Safari-safe simple POST', async () => {
  let requestBody = null;
  let requestInit = null;
  const result = await createSignalRoom('{"type":"offer","sdp":"demo"}', {
    fetchImpl: async (_url, init) => {
      requestInit = init;
      requestBody = JSON.parse(init.body);
      return jsonResponse({ roomCode: '482731', hostToken: 'a'.repeat(48), expiresIn: 600 });
    },
  });
  assert.equal(requestBody.action, 'create');
  assert.equal(result.roomCode, '482731');
  assert.equal(result.hostToken.length, 48);
  assert.equal(requestInit.method, 'POST');
  assert.equal(requestInit.mode, 'cors');
  assert.match(requestInit.headers['Content-Type'], /^text\/plain/i);
  assert.equal(Object.keys(requestInit.headers).length, 1);
});

test('surfaces room-not-found from the signaling service', async () => {
  await assert.rejects(
    () => getSignalOffer('123456', { fetchImpl: async () => jsonResponse({ error: 'room_not_found' }, 404) }),
    error => error.code === 'room_not_found',
  );
});

test('host polling resolves when the guest answer appears', async () => {
  let calls = 0;
  const answer = '{"type":"answer","sdp":"demo"}';
  const result = await waitForSignalAnswer('654321', 'b'.repeat(48), {
    intervalMs: 0,
    timeoutMs: 1000,
    sleep: async () => {},
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse({ answer: calls < 3 ? null : answer });
    },
  });
  assert.equal(result, answer);
  assert.equal(calls, 3);
});
