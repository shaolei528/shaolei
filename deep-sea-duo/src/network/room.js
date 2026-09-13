import { createLanHost, joinLanHost } from './manual-webrtc.js';
import { inputPacket, snapshotPacket, upgradePacket } from './messages.js';
import {
  closeSignalRoom,
  createRoomIdentity,
  createSignalRoom,
  getSignalOffer,
  probeSignal,
  submitSignalAnswer,
  waitForSignalAnswer,
} from './signaling.js';

export function createRoomController(onStatus = () => {}, onInput = () => {}, onSnapshot = () => {}, onUpgrade = () => {}) {
  let host = null;
  let guest = null;
  let sequence = 0;
  let signalAbort = null;
  let signalSession = null;
  let generation = 0;
  let connected = false;

  const deliverMessage = message => {
    if (message.type === 'input') onInput(message.payload);
    if (message.type === 'snapshot') onSnapshot(message.payload);
    if (message.type === 'upgrade') onUpgrade(message.payload.upgradeId);
  };

  const activeTransport = () => guest ?? host;

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
    guest?.close?.();
    host?.close?.();
    guest = null;
    host = null;
    sequence = 0;
    connected = false;
  };

  const makeHandlers = runId => ({
    onStatus: status => {
      if (runId !== generation) return;
      if (status === 'connected') {
        connected = true;
        onStatus('connected-direct');
        return;
      }
      if (status === 'connecting') {
        if (!connected) onStatus('connecting');
        return;
      }
      if (['disconnected', 'failed', 'closed', 'error'].includes(status)) {
        if (!connected) return;
        connected = false;
        onStatus(status);
      }
    },
    onMessage: message => {
      if (runId === generation) deliverMessage(message);
    },
  });

  const reportSignalFailure = (error, runId) => {
    if (runId !== generation || error?.code === 'signal-aborted') return;
    onStatus(error?.code || 'signal-error');
  };

  return {
    async createQuickRoom(onRoomCode = () => {}) {
      closeCurrent();
      const runId = generation;
      const identity = createRoomIdentity();

      // Show the code immediately, then prepare signaling and WebRTC.
      onRoomCode(identity.roomCode);
      onStatus('signal-check');
      await probeSignal();

      onStatus('webrtc-preparing');
      host = await createLanHost(makeHandlers(runId));
      if (runId !== generation) return identity.roomCode;

      onStatus('signal-saving');
      const session = await createSignalRoom(host.offerCode, {
        skipProbe: true,
        identity,
        onRoomCode,
      });
      if (runId !== generation) return session.roomCode;

      signalSession = session;
      signalAbort = new AbortController();
      onStatus('host-waiting');

      waitForSignalAnswer(session.roomCode, session.hostToken, { signal: signalAbort.signal })
        .then(async answer => {
          if (runId !== generation || !host || signalAbort?.signal.aborted) return;
          try {
            await host.acceptAnswer(answer);
            onStatus('waitingDirect');
            const finished = signalSession;
            signalSession = null;
            signalAbort = null;
            if (finished) closeSignalRoom(finished.roomCode, finished.hostToken).catch(() => {});
          } catch (error) {
            reportSignalFailure(error, runId);
          }
        })
        .catch(error => reportSignalFailure(error, runId));

      return session.roomCode;
    },

    async joinQuickRoom(roomCode) {
      closeCurrent();
      const runId = generation;
      onStatus('signal-check');
      await probeSignal();
      onStatus('joining-room');
      const offer = await getSignalOffer(roomCode);
      if (runId !== generation) return false;

      onStatus('webrtc-preparing');
      guest = await joinLanHost(offer, makeHandlers(runId));
      if (runId !== generation) return false;

      onStatus('signal-saving');
      await submitSignalAnswer(roomCode, guest.answerCode);
      if (runId === generation && !connected) onStatus('waitingDirect');
      return true;
    },

    async createRoom() {
      closeCurrent();
      const runId = generation;
      host = await createLanHost(makeHandlers(runId));
      onStatus('把房主连接码发给朋友');
      return host.offerCode;
    },

    async joinRoom(offerCode) {
      closeCurrent();
      const runId = generation;
      guest = await joinLanHost(offerCode, makeHandlers(runId));
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
      return host?.send(snapshotPacket(state, tick)) ?? false;
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
