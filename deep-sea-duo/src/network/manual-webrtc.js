import { decodeMessage } from './messages.js';

const ICE_GATHER_GRACE_MS = 1800;
const ICE_SERVERS = [{ urls: ['stun:stun.cloudflare.com:3478'] }];

const rtcError = (error, code = 'webrtc-init-failed', stage = 'W1') => {
  if (error?.code) return error;
  const wrapped = error instanceof Error ? error : new Error(String(error ?? code));
  wrapped.code = code;
  wrapped.stage = stage;
  return wrapped;
};

const hasCandidate = peer => /(?:^|\r?\n)a=candidate:/m.test(peer.localDescription?.sdp ?? '');

// Mobile Safari can leave ICE gathering in "gathering" for a long time when a
// STUN server is slow or blocked. For a LAN game we only need a usable local
// candidate, not a perfect end-of-candidates signal. Never fail room creation
// just because gathering did not reach "complete" in time.
const waitForUsableIce = peer => new Promise(resolve => {
  if (peer.iceGatheringState === 'complete' || hasCandidate(peer)) return resolve();

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    peer.removeEventListener('icecandidate', onCandidate);
    peer.removeEventListener('icegatheringstatechange', onState);
    resolve();
  };
  const onCandidate = event => {
    if (event.candidate || hasCandidate(peer)) finish();
  };
  const onState = () => {
    if (peer.iceGatheringState === 'complete' || hasCandidate(peer)) finish();
  };
  const timeout = setTimeout(finish, ICE_GATHER_GRACE_MS);
  peer.addEventListener('icecandidate', onCandidate);
  peer.addEventListener('icegatheringstatechange', onState);
});

const attachPeerState = (peer, handlers, lifecycle) => {
  const report = () => {
    if (lifecycle.closing) return;
    const state = peer.connectionState;

    if (state === 'connecting' && lifecycle.remoteApplied) handlers.onStatus?.('connecting');
    if (state === 'failed') handlers.onStatus?.('failed');

    // Do not label a channel that never opened as "disconnected". Safari can
    // close a pre-connection transport while renegotiating/gathering; the room
    // layer will either finish WebRTC or fall back to the relay.
    if (lifecycle.connected && ['disconnected', 'closed'].includes(state)) {
      handlers.onStatus?.(state);
    }
  };
  peer.addEventListener('connectionstatechange', report);
};

const attachChannel = (channel, handlers, lifecycle) => {
  channel.binaryType = 'arraybuffer';
  channel.onopen = () => {
    if (lifecycle.closing) return;
    lifecycle.connected = true;
    handlers.onStatus?.('connected');
  };
  channel.onclose = () => {
    if (!lifecycle.closing && lifecycle.connected) handlers.onStatus?.('closed');
  };
  channel.onerror = () => {
    if (!lifecycle.closing && lifecycle.connected) handlers.onStatus?.('error');
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
    return new RTCPeerConnection({ iceServers: ICE_SERVERS, iceTransportPolicy: 'all' });
  } catch (error) {
    throw rtcError(error);
  }
};

const createHostChannel = peer => {
  try {
    // Reliable ordered mode is intentionally used for maximum iOS/WebKit
    // compatibility. At the current 15/30 Hz game rates the LAN overhead is tiny.
    return peer.createDataChannel('deep-sea-duo', { ordered: true });
  } catch (firstError) {
    try {
      return peer.createDataChannel('deep-sea-duo');
    } catch {
      throw firstError;
    }
  }
};

const sessionDescription = value => ({ type: value.type, sdp: value.sdp });

export async function createLanHost(handlers = {}) {
  const lifecycle = { closing: false, connected: false, remoteApplied: false };
  const peer = createPeer();
  attachPeerState(peer, handlers, lifecycle);
  let channel;
  try {
    channel = createHostChannel(peer);
    attachChannel(channel, handlers, lifecycle);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await waitForUsableIce(peer);
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
        await peer.setRemoteDescription(sessionDescription(answer));
        lifecycle.remoteApplied = true;
      } catch (error) {
        throw rtcError(error, 'webrtc-remote-description-failed', 'W3');
      }
    },
    isConnected() {
      return lifecycle.connected && channel.readyState === 'open';
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
  const lifecycle = { closing: false, connected: false, remoteApplied: false };
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
    await peer.setRemoteDescription(sessionDescription(offer));
    lifecycle.remoteApplied = true;
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    await waitForUsableIce(peer);
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
    isConnected() {
      return lifecycle.connected && channel?.readyState === 'open';
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
