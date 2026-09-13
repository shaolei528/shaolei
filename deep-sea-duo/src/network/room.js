import { createLanHost, joinLanHost } from './manual-webrtc.js';
import { inputPacket, snapshotPacket, upgradePacket } from './messages.js';
import {
  closeSignalRoom,
  createSignalRoom,
  getSignalOffer,
  submitSignalAnswer,
  waitForSignalAnswer,
} from './signaling.js';

export function createRoomController(onStatus = () => {}, onInput = () => {}, onSnapshot = () => {}, onUpgrade = () => {}) {
  let host = null;
  let guest = null;
  let sequence = 0;
  let signalAbort = null;
  let signalSession = null;

  const handlers = {
    onStatus,
    onMessage: message => {
      if (message.type === 'input') onInput(message.payload);
      if (message.type === 'snapshot') onSnapshot(message.payload);
      if (message.type === 'upgrade') onUpgrade(message.payload.upgradeId);
    },
  };

  const activePeer = () => guest ?? host;

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
    stopSignalSession();
    guest?.close?.();
    host?.close?.();
    guest = null;
    host = null;
    sequence = 0;
  };

  const reportSignalFailure = error => {
    if (error?.code === 'signal-aborted') return;
    onStatus(error?.code || 'signal-error');
  };

  return {
    async createQuickRoom() {
      closeCurrent();
      onStatus('creating-room');
      host = await createLanHost(handlers);
      try {
        const session = await createSignalRoom(host.offerCode);
        signalSession = session;
        signalAbort = new AbortController();
        onStatus('host-waiting');

        waitForSignalAnswer(session.roomCode, session.hostToken, { signal: signalAbort.signal })
          .then(async answer => {
            if (!host || signalAbort?.signal.aborted) return;
            await host.acceptAnswer(answer);
            onStatus('waitingDirect');
            const finished = signalSession;
            signalSession = null;
            signalAbort = null;
            if (finished) closeSignalRoom(finished.roomCode, finished.hostToken).catch(() => {});
          })
          .catch(reportSignalFailure);

        return session.roomCode;
      } catch (error) {
        host?.close?.();
        host = null;
        throw error;
      }
    },

    async joinQuickRoom(roomCode) {
      closeCurrent();
      onStatus('joining-room');
      const offer = await getSignalOffer(roomCode);
      guest = await joinLanHost(offer, handlers);
      try {
        await submitSignalAnswer(roomCode, guest.answerCode);
        onStatus('waitingDirect');
        return true;
      } catch (error) {
        guest?.close?.();
        guest = null;
        throw error;
      }
    },

    async createRoom() {
      closeCurrent();
      host = await createLanHost(handlers);
      onStatus('把房主连接码发给朋友');
      return host.offerCode;
    },

    async joinRoom(offerCode) {
      closeCurrent();
      guest = await joinLanHost(offerCode, handlers);
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
      return activePeer()?.send(inputPacket(input, ++sequence)) ?? false;
    },

    sendSnapshot(state, tick) {
      return host?.send(snapshotPacket(state, tick)) ?? false;
    },

    sendUpgrade(upgradeId) {
      const transport = guest ?? host;
      if (!transport) return false;
      const packet = upgradePacket(upgradeId);
      const sent = transport.send(packet);
      setTimeout(() => transport.send(packet), 55);
      setTimeout(() => transport.send(packet), 140);
      return sent;
    },

    reset() {
      closeCurrent();
      onStatus('idle');
    },
  };
}
