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

const DIRECT_CONNECT_TIMEOUT_MS = 12_000;

export function createRoomController(
  onStatus = () => {},
  onInput = () => {},
  onSnapshot = () => {},
  onUpgrade = () => {},
  options = {},
) {
  const createLanHostImpl = options.createLanHost ?? createLanHost;
  const joinLanHostImpl = options.joinLanHost ?? joinLanHost;
  const probeSignalImpl = options.probeSignal ?? probeSignal;
  const createSignalRoomImpl = options.createSignalRoom ?? createSignalRoom;
  const getSignalOfferImpl = options.getSignalOffer ?? getSignalOffer;
  const submitSignalAnswerImpl = options.submitSignalAnswer ?? submitSignalAnswer;
  const waitForSignalAnswerImpl = options.waitForSignalAnswer ?? waitForSignalAnswer;
  const closeSignalRoomImpl = options.closeSignalRoom ?? closeSignalRoom;
  const setTimeoutImpl = options.setTimeout ?? globalThis.setTimeout;
  const clearTimeoutImpl = options.clearTimeout ?? globalThis.clearTimeout;
  const directConnectTimeoutMs = options.directConnectTimeoutMs ?? DIRECT_CONNECT_TIMEOUT_MS;

  let host = null;
  let guest = null;
  let sequence = 0;
  let signalAbort = null;
  let signalSession = null;
  let generation = 0;
  let connected = false;
  let directConnectTimer = null;

  const deliverMessage = message => {
    if (message.type === 'input') onInput(message.payload);
    if (message.type === 'snapshot') onSnapshot(message.payload);
    if (message.type === 'upgrade') onUpgrade(message.payload.upgradeId);
  };

  const activeTransport = () => guest ?? host;

  const clearDirectConnectTimer = () => {
    if (directConnectTimer !== null) clearTimeoutImpl?.(directConnectTimer);
    directConnectTimer = null;
  };

  const armDirectConnectTimer = runId => {
    clearDirectConnectTimer();
    if (!Number.isFinite(directConnectTimeoutMs) || directConnectTimeoutMs <= 0) return;
    directConnectTimer = setTimeoutImpl?.(() => {
      directConnectTimer = null;
      if (runId !== generation || connected) return;
      onStatus('failed');
    }, directConnectTimeoutMs) ?? null;
  };

  const stopSignalSession = () => {
    signalAbort?.abort();
    signalAbort = null;
    const current = signalSession;
    signalSession = null;
    if (current?.roomCode && current?.hostToken) {
      closeSignalRoomImpl(current.roomCode, current.hostToken).catch(() => {});
    }
  };

  const closeCurrent = () => {
    generation += 1;
    clearDirectConnectTimer();
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
        clearDirectConnectTimer();
        onStatus('connected-direct');
        return;
      }
      if (status === 'connecting') {
        if (!connected) onStatus('connecting');
        return;
      }
      if (status === 'failed' || status === 'error') {
        clearDirectConnectTimer();
        connected = false;
        onStatus(status);
        return;
      }
      if (['disconnected', 'closed'].includes(status)) {
        if (!connected) return;
        clearDirectConnectTimer();
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
    clearDirectConnectTimer();
    onStatus(error?.code || 'signal-error');
  };

  return {
    async createQuickRoom(onRoomCode = () => {}) {
      closeCurrent();
      const runId = generation;
      const identity = createRoomIdentity();

      onRoomCode(identity.roomCode);
      onStatus('signal-check');
      await probeSignalImpl();

      onStatus('webrtc-preparing');
      host = await createLanHostImpl(makeHandlers(runId));
      if (runId !== generation) return identity.roomCode;

      onStatus('signal-saving');
      const session = await createSignalRoomImpl(host.offerCode, {
        skipProbe: true,
        identity,
        onRoomCode,
      });
      if (runId !== generation) return session.roomCode;

      signalSession = session;
      signalAbort = new AbortController();
      onStatus('host-waiting');

      waitForSignalAnswerImpl(session.roomCode, session.hostToken, { signal: signalAbort.signal })
        .then(async answer => {
          if (runId !== generation || !host || signalAbort?.signal.aborted) return;
          try {
            await host.acceptAnswer(answer);
            if (runId !== generation) return;
            onStatus('waitingDirect');
            armDirectConnectTimer(runId);
            const finished = signalSession;
            signalSession = null;
            signalAbort = null;
            if (finished) closeSignalRoomImpl(finished.roomCode, finished.hostToken).catch(() => {});
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
      await probeSignalImpl();
      onStatus('joining-room');
      const offer = await getSignalOfferImpl(roomCode);
      if (runId !== generation) return false;

      onStatus('webrtc-preparing');
      guest = await joinLanHostImpl(offer, makeHandlers(runId));
      if (runId !== generation) return false;

      onStatus('signal-saving');
      await submitSignalAnswerImpl(roomCode, guest.answerCode);
      if (runId === generation && !connected) {
        onStatus('waitingDirect');
        armDirectConnectTimer(runId);
      }
      return true;
    },

    async createRoom() {
      closeCurrent();
      const runId = generation;
      host = await createLanHostImpl(makeHandlers(runId));
      onStatus('把房主连接码发给朋友');
      return host.offerCode;
    },

    async joinRoom(offerCode) {
      closeCurrent();
      const runId = generation;
      guest = await joinLanHostImpl(offerCode, makeHandlers(runId));
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
      setTimeoutImpl?.(() => {
        if (transport === activeTransport()) transport.send(packet);
      }, 55);
      setTimeoutImpl?.(() => {
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
