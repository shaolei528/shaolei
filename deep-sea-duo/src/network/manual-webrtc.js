import { decodeMessage } from './messages.js';

const ICE_TIMEOUT_MS = 12000;
const ICE_SERVERS = [{ urls: ['stun:stun.cloudflare.com:3478'] }];

const rtcError = (error, code = 'webrtc-init-failed', stage = 'W1') => {
  if (error?.code) return error;
  const wrapped = error instanceof Error ? error : new Error(String(error ?? code));
  wrapped.code = code;
  wrapped.stage = stage;
  return wrapped;
};

const waitForIce = peer => new Promise((resolve, reject) => {
  if (peer.iceGatheringState === 'complete') return resolve();
  const timeout = setTimeout(() => {
    cleanup();
    const error = new Error('LAN connection information timed out');
    error.code = 'ice-timeout';
    error.stage = 'W2';
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

const createPeer = () => {
  if (typeof globalThis.RTCPeerConnection !== 'function') {
    const error = new Error('RTCPeerConnection is unavailable in this browser');
    error.code = 'webrtc-unavailable';
    error.stage = 'W1';
    throw error;
  }
  try {
    // STUN only discovers candidates. It is not a relay and does not carry game traffic.
    return new RTCPeerConnection({ iceServers: ICE_SERVERS });
  } catch (error) {
    throw rtcError(error);
  }
};

const createHostChannel = peer => {
  try {
    // Preferred game channel: no head-of-line blocking for movement snapshots.
    return peer.createDataChannel('deep-sea-duo', { ordered: false, maxRetransmits: 0 });
  } catch {
    // Compatibility fallback for browsers/webviews that reject partial reliability.
    return peer.createDataChannel('deep-sea-duo');
  }
};

export async function createLanHost(handlers = {}) {
  const lifecycle = { closing: false };
  const peer = createPeer();
  attachPeerState(peer, handlers, lifecycle);
  let channel;
  try {
    channel = createHostChannel(peer);
    attachChannel(channel, handlers, lifecycle);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await waitForIce(peer);
  } catch (error) {
    lifecycle.closing = true;
    safeClose(peer);
    throw rtcError(error, error?.code ?? 'webrtc-init-failed', error?.stage ?? 'W1');
  }

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
      try {
        await peer.setRemoteDescription(answer);
      } catch (error) {
        throw rtcError(error, 'webrtc-remote-description-failed', 'W3');
      }
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
  const peer = createPeer();
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

  try {
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    await waitForIce(peer);
  } catch (error) {
    lifecycle.closing = true;
    safeClose(peer);
    throw rtcError(error, error?.code ?? 'webrtc-init-failed', error?.stage ?? 'W1');
  }

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
