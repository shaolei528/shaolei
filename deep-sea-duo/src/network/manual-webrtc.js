import { decodeMessage } from './messages.js';

const ICE_TIMEOUT_MS = 10000;

const waitForIce = peer => new Promise((resolve, reject) => {
  if (peer.iceGatheringState === 'complete') return resolve();
  const timeout = setTimeout(() => {
    cleanup();
    const error = new Error('LAN connection information timed out');
    error.code = 'ice-timeout';
    reject(error);
  }, ICE_TIMEOUT_MS);
  const complete = () => {
    if (peer.iceGatheringState !== 'complete') return;
    cleanup();
    resolve();
  };
  const cleanup = () => {
    clearTimeout(timeout);
    peer.removeEventListener('icegatheringstatechange', complete);
  };
  peer.addEventListener('icegatheringstatechange', complete);
});

const attachPeerState = (peer, handlers, lifecycle) => {
  const report = () => {
    if (lifecycle.closing) return;
    const state = peer.connectionState;
    if (['connecting', 'disconnected', 'failed', 'closed'].includes(state)) handlers.onStatus?.(state);
  };
  peer.addEventListener('connectionstatechange', report);
};

const attachChannel = (channel, handlers, lifecycle) => {
  channel.binaryType = 'arraybuffer';
  channel.onopen = () => {
    if (!lifecycle.closing) handlers.onStatus?.('connected');
  };
  channel.onclose = () => {
    if (!lifecycle.closing) handlers.onStatus?.('closed');
  };
  channel.onerror = () => {
    if (!lifecycle.closing) handlers.onStatus?.('error');
  };
  channel.onmessage = event => {
    if (lifecycle.closing) return;
    const message = decodeMessage(event.data);
    if (message) handlers.onMessage?.(message);
  };
};

const safeClose = peer => {
  try { peer.close(); } catch {}
};

export async function createLanHost(handlers = {}) {
  const lifecycle = { closing: false };
  const peer = new RTCPeerConnection({ iceServers: [] });
  attachPeerState(peer, handlers, lifecycle);
  const channel = peer.createDataChannel('deep-sea-duo', { ordered: false, maxRetransmits: 0 });
  attachChannel(channel, handlers, lifecycle);
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  await waitForIce(peer);
  return {
    peer,
    offerCode: JSON.stringify(peer.localDescription),
    send(message) {
      if (lifecycle.closing || channel.readyState !== 'open' || channel.bufferedAmount > 65536) return false;
      channel.send(message);
      return true;
    },
    async acceptAnswer(answerCode) {
      let answer;
      try { answer = JSON.parse(answerCode); } catch {
        const error = new Error('Invalid connection code');
        error.code = 'invalid-code';
        throw error;
      }
      if (answer?.type !== 'answer' || typeof answer?.sdp !== 'string') {
        const error = new Error('Expected a guest answer code');
        error.code = 'expected-answer';
        throw error;
      }
      await peer.setRemoteDescription(answer);
    },
    close() {
      lifecycle.closing = true;
      channel.onclose = null;
      channel.onerror = null;
      safeClose(peer);
    },
  };
}

export async function joinLanHost(offerCode, handlers = {}) {
  const lifecycle = { closing: false };
  const peer = new RTCPeerConnection({ iceServers: [] });
  attachPeerState(peer, handlers, lifecycle);
  let channel = null;
  peer.ondatachannel = event => {
    channel = event.channel;
    attachChannel(channel, handlers, lifecycle);
  };
  let offer;
  try { offer = JSON.parse(offerCode); } catch {
    lifecycle.closing = true;
    safeClose(peer);
    const error = new Error('Invalid connection code');
    error.code = 'invalid-code';
    throw error;
  }
  if (offer?.type !== 'offer' || typeof offer?.sdp !== 'string') {
    lifecycle.closing = true;
    safeClose(peer);
    const error = new Error('Expected a host offer code');
    error.code = 'expected-offer';
    throw error;
  }
  await peer.setRemoteDescription(offer);
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  await waitForIce(peer);
  return {
    peer,
    answerCode: JSON.stringify(peer.localDescription),
    send(message) {
      if (lifecycle.closing || channel?.readyState !== 'open' || channel.bufferedAmount > 65536) return false;
      channel.send(message);
      return true;
    },
    close() {
      lifecycle.closing = true;
      if (channel) {
        channel.onclose = null;
        channel.onerror = null;
      }
      safeClose(peer);
    },
  };
}
