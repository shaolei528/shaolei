import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoomController } from '../src/network/room.js';

const noop = () => {};

function makeGuestHarness() {
  const statuses = [];
  let handlers;
  let timeoutCallback;
  const room = createRoomController(status => statuses.push(status), noop, noop, noop, {
    probeSignal: async () => true,
    getSignalOffer: async () => '{"type":"offer","sdp":"demo"}',
    joinLanHost: async (_offer, nextHandlers) => {
      handlers = nextHandlers;
      return { answerCode: '{"type":"answer","sdp":"demo"}', send: () => true, close() {} };
    },
    submitSignalAnswer: async () => true,
    closeSignalRoom: async () => true,
    directConnectTimeoutMs: 100,
    setTimeout: callback => { timeoutCallback = callback; return 1; },
    clearTimeout: () => {},
  });
  return { room, statuses, get handlers() { return handlers; }, get timeoutCallback() { return timeoutCallback; } };
}

test('pre-connect WebRTC failure is surfaced', async () => {
  const statuses = [];
  let handlers;
  const room = createRoomController(status => statuses.push(status), noop, noop, noop, {
    probeSignal: async () => true,
    createLanHost: async nextHandlers => {
      handlers = nextHandlers;
      return { offerCode: '{"type":"offer","sdp":"demo"}', send: () => true, close() {} };
    },
    createSignalRoom: async (_offer, { identity }) => ({ ...identity, expiresIn: 600 }),
    waitForSignalAnswer: async () => new Promise(noop),
    closeSignalRoom: async () => true,
  });
  await room.createQuickRoom();
  handlers.onStatus('failed');
  assert.equal(statuses.at(-1), 'failed');
});

test('quick guest times out if direct connection never opens', async () => {
  const harness = makeGuestHarness();
  await harness.room.joinQuickRoom('123456');
  assert.equal(harness.statuses.at(-1), 'waitingDirect');
  harness.timeoutCallback();
  assert.equal(harness.statuses.at(-1), 'failed');
});

test('connected guest ignores a stale timeout callback', async () => {
  const harness = makeGuestHarness();
  await harness.room.joinQuickRoom('654321');
  harness.handlers.onStatus('connected');
  const before = harness.statuses.length;
  harness.timeoutCallback();
  assert.equal(harness.statuses.length, before);
  assert.equal(harness.statuses.at(-1), 'connected-direct');
});
