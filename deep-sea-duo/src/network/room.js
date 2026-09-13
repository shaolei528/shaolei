import { createLanHost, joinLanHost } from './manual-webrtc.js';
import { createRealtimeRelay } from './realtime-relay.js';
import { inputPacket, snapshotPacket, upgradePacket } from './messages.js';
import {
  closeSignalRoom,
  createRelayToken,
  createRoomIdentity,
  createSignalRoom,
  getSignalOffer,
  probeSignal,
  submitSignalAnswer,
  waitForSignalAnswer,
} from './signaling.js';

const RELAY_ONLY_SDP = 'deep-sea-duo-relay-only';

function packOffer(offerCode, relayToken, relayOnly = false) {
  if (relayOnly) {
    return JSON.stringify({ type: 'offer', sdp: RELAY_ONLY_SDP, relayToken, relayOnly: true });
  }
  const offer = JSON.parse(offerCode);
  return JSON.stringify({ ...offer, relayToken, relayOnly: false });
}

function offerMeta(offerCode) {
  try {
    const offer = JSON.parse(offerCode);
    return {
      relayToken: typeof offer?.relayToken === 'string' ? offer.relayToken : null,
      relayOnly: offer?.relayOnly === true || offer?.sdp === RELAY_ONLY_SDP,
    };
  } catch {
    return { relayToken: null, relayOnly: false };
  }
}

export function createRoomController(onStatus = () => {}, onInput = () => {}, onSnapshot = () => {}, onUpgrade = () => {}) {
  let host = null;
  let guest = null;
  let relay = null;
  let sequence = 0;
  let signalAbort = null;
  let signalSession = null;
  let generation = 0;
  let directConnected = false;
  let relayConnected = false;
  let primary = null;

  const deliverMessage = message => {
    if (message.type === 'input') onInput(message.payload);
    if (message.type === 'snapshot') onSnapshot(message.payload);
    if (message.type === 'upgrade') onUpgrade(message.payload.upgradeId);
  };

  const directTransport = () => guest ?? host;
  const activeTransport = () => primary === 'relay' ? relay : directTransport();

  const stopSignalSession = () => {
    signalAbort?.abort();
    signalAbort = null;
    const current = signalSession;
    signalSession = null;
    if (current?.roomCode && current?.hostToken) {
      closeSignalRoom(current.roomCode, current.hostToken).catch(() => {});
    }
  };

  const closeCurrent = () => {
    generation += 1;
    stopSignalSession();
    relay?.close?.();
    guest?.close?.();
    host?.close?.();
    relay = null;
    guest = null;
    host = null;
    sequence = 0;
    directConnected = false;
    relayConnected = false;
    primary = null;
  };

  const makeDirectHandlers = runId => ({
    onStatus: status => {
      if (runId !== generation) return;
      if (status === 'connected') {
        directConnected = true;
        primary = 'direct';
        onStatus('connected-direct');
        return;
      }
      if (status === 'connecting') {
        if (!relayConnected && !primary) onStatus('connecting');
        return;
      }
      if (['disconnected', 'failed', 'closed', 'error'].includes(status)) {
        const wasPrimary = primary === 'direct';
        directConnected = false;
        if (relayConnected) {
          primary = 'relay';
          if (wasPrimary) onStatus('connected-relay');
        } else if (wasPrimary) {
          primary = null;
          onStatus(status);
        }
        // A direct transport that never opened is not a user-visible
        // disconnection. The relay is still allowed to finish connecting.
      }
    },
    onMessage: message => {
      if (runId === generation && primary === 'direct') deliverMessage(message);
    },
  });

  const makeRelayHandlers = runId => ({
    onStatus: status => {
      if (runId !== generation) return;
      if (status === 'relay-connected') {
        relayConnected = true;
        if (!directConnected) {
          primary = 'relay';
          onStatus('connected-relay');
        }
        return;
      }
      if (status === 'relay-error' || status === 'relay-closed') {
        const wasPrimary = primary === 'relay';
        relayConnected = false;
        if (wasPrimary && directConnected) {
          primary = 'direct';
          onStatus('connected-direct');
        } else if (wasPrimary || !directConnected) {
          primary = directConnected ? 'direct' : null;
          onStatus(status);
        }
      }
    },
    onMessage: message => {
      if (runId === generation && primary === 'relay') deliverMessage(message);
    },
  });

  const startRelay = async (roomCode, relayToken, role, runId) => {
    if (!relayToken || runId !== generation) return null;
    try {
      const nextRelay = await createRealtimeRelay({
        roomCode,
        relayToken,
        role,
        handlers: makeRelayHandlers(runId),
      });
      if (runId !== generation) {
        nextRelay.close();
        return null;
      }
      relay?.close?.();
      relay = nextRelay;
      return nextRelay;
    } catch (error) {
      if (runId === generation && !directConnected) onStatus(error?.code || 'relay-error');
      return null;
    }
  };

  const reportSignalFailure = (error, runId) => {
    if (runId !== generation || error?.code === 'signal-aborted') return;
    if (!relayConnected && !directConnected) onStatus(error?.code || 'signal-error');
  };

  return {
    async createQuickRoom(onRoomCode = () => {}) {
      closeCurrent();
      const runId = generation;
      const identity = createRoomIdentity();
      const relayToken = createRelayToken();

      // Show a usable six-digit code immediately. WebRTC and cloud signaling
      // prepare in the background instead of leaving the player staring at dots.
      onRoomCode(identity.roomCode);
      onStatus('signal-check');
      await probeSignal();

      let signaledOffer;
      onStatus('webrtc-preparing');
      try {
        host = await createLanHost(makeDirectHandlers(runId));
        signaledOffer = packOffer(host.offerCode, relayToken, false);
      } catch {
        host = null;
        signaledOffer = packOffer(null, relayToken, true);
      }

      onStatus('signal-saving');
      const session = await createSignalRoom(signaledOffer, {
        skipProbe: true,
        identity,
        onRoomCode,
      });
      if (runId !== generation) return session.roomCode;

      signalSession = session;
      signalAbort = new AbortController();
      onStatus('host-waiting');
      void startRelay(session.roomCode, relayToken, 'host', runId);

      if (host) {
        waitForSignalAnswer(session.roomCode, session.hostToken, { signal: signalAbort.signal })
          .then(async answer => {
            if (runId !== generation || !host || signalAbort?.signal.aborted) return;
            try {
              await host.acceptAnswer(answer);
              if (!relayConnected) onStatus('waitingDirect');
            } catch (error) {
              if (!relayConnected) onStatus(error?.code || 'failed');
            }
          })
          .catch(error => reportSignalFailure(error, runId));
      }

      return session.roomCode;
    },

    async joinQuickRoom(roomCode) {
      closeCurrent();
      const runId = generation;
      onStatus('signal-check');
      await probeSignal();
      onStatus('joining-room');
      const offer = await getSignalOffer(roomCode);
      const meta = offerMeta(offer);

      // Start the reliable cloud fallback first. WebRTC races it in parallel;
      // whichever path becomes usable gives the player a working game.
      void startRelay(roomCode, meta.relayToken, 'guest', runId);

      if (!meta.relayOnly) {
        onStatus('webrtc-preparing');
        try {
          guest = await joinLanHost(offer, makeDirectHandlers(runId));
          if (runId === generation) {
            await submitSignalAnswer(roomCode, guest.answerCode);
            if (!relayConnected) onStatus('waitingDirect');
          }
        } catch {
          guest?.close?.();
          guest = null;
          // Relay remains active as the transparent compatibility fallback.
        }
      }
      return true;
    },

    async createRoom() {
      closeCurrent();
      const runId = generation;
      host = await createLanHost(makeDirectHandlers(runId));
      onStatus('把房主连接码发给朋友');
      return host.offerCode;
    },

    async joinRoom(offerCode) {
      closeCurrent();
      const runId = generation;
      guest = await joinLanHost(offerCode, makeDirectHandlers(runId));
      onStatus('把加入者应答码发回房主');
      return guest.answerCode;
    },

    async acceptGuest(answerCode) {
      if (!host) {
        const error = new Error('Create a room first');
        error.code = 'host-not-ready';
        throw error;
      }
      await host.acceptAnswer(answerCode);
      onStatus('正在等待直连');
    },

    sendInput(input) {
      return activeTransport()?.send(inputPacket(input, ++sequence)) ?? false;
    },

    sendSnapshot(state, tick) {
      return activeTransport()?.send(snapshotPacket(state, tick)) ?? false;
    },

    sendUpgrade(upgradeId) {
      const transport = activeTransport();
      if (!transport) return false;
      const packet = upgradePacket(upgradeId);
      const sent = transport.send(packet);
      setTimeout(() => {
        if (transport === activeTransport()) transport.send(packet);
      }, 55);
      setTimeout(() => {
        if (transport === activeTransport()) transport.send(packet);
      }, 140);
      return sent;
    },

    reset() {
      closeCurrent();
      onStatus('idle');
    },
  };
}
