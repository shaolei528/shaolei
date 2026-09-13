import { createLanHost, joinLanHost } from './manual-webrtc.js';
import { inputPacket, snapshotPacket, upgradePacket } from './messages.js';

export function createRoomController(onStatus = () => {}, onInput = () => {}, onSnapshot = () => {}, onUpgrade = () => {}) {
  let host = null;
  let guest = null;
  let sequence = 0;

  const handlers = {
    onStatus,
    onMessage: message => {
      if (message.type === 'input') onInput(message.payload);
      if (message.type === 'snapshot') onSnapshot(message.payload);
      if (message.type === 'upgrade') onUpgrade(message.payload.upgradeId);
    },
  };

  const activePeer = () => guest ?? host;
  const closeCurrent = () => {
    guest?.close?.();
    host?.close?.();
    guest = null;
    host = null;
    sequence = 0;
  };

  return {
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
      // The realtime data channel is intentionally unreliable. Repeating this
      // idempotent control message sharply reduces the chance of a lost level-up.
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
