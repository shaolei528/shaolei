import test from 'node:test';
import assert from 'node:assert/strict';
import { createLanHost } from '../src/network/manual-webrtc.js';

class FakeDataChannel {
  constructor() {
    this.readyState = 'connecting';
    this.bufferedAmount = 0;
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
  }
  send() {}
  open() {
    this.readyState = 'open';
    this.onopen?.();
  }
  closeUnexpectedly() {
    this.readyState = 'closed';
    this.onclose?.();
  }
}

class FakePeerConnection extends EventTarget {
  constructor(config) {
    super();
    this.config = config;
    this.connectionState = 'new';
    this.iceGatheringState = 'complete';
    this.localDescription = null;
    this.channel = null;
    this.channelOptions = null;
  }
  createDataChannel(_name, options) {
    this.channelOptions = options;
    this.channel = new FakeDataChannel();
    return this.channel;
  }
  async createOffer() {
    return { type: 'offer', sdp: 'v=0\r\ns=fake\r\n' };
  }
  async setLocalDescription(description) {
    this.localDescription = description;
  }
  async setRemoteDescription() {}
  close() {
    this.connectionState = 'closed';
    this.dispatchEvent(new Event('connectionstatechange'));
  }
}

test('pre-connect channel close is ignored, but a real connected close is reported', async () => {
  const Original = globalThis.RTCPeerConnection;
  globalThis.RTCPeerConnection = FakePeerConnection;
  const statuses = [];
  try {
    const host = await createLanHost({ onStatus: status => statuses.push(status) });
    assert.equal(host.peer.channelOptions.ordered, true);

    host.peer.channel.closeUnexpectedly();
    assert.deepEqual(statuses, []);

    host.peer.channel.open();
    host.peer.channel.closeUnexpectedly();
    assert.deepEqual(statuses, ['connected', 'closed']);

    host.close();
  } finally {
    if (Original === undefined) delete globalThis.RTCPeerConnection;
    else globalThis.RTCPeerConnection = Original;
  }
});
