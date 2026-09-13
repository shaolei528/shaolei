import { createLanHost, joinLanHost } from './manual-webrtc.js';
import { inputPacket, snapshotPacket, upgradePacket } from './messages.js';

export function createRoomController(onStatus = () => {}, onInput = () => {}, onSnapshot = () => {}, onUpgrade = () => {}) {
  let host = null; let guest = null;
  const handlers = { onStatus, onMessage: message => { if (message.type === 'input') onInput(message.payload); if (message.type === 'snapshot') onSnapshot(message.payload); if (message.type === 'upgrade') onUpgrade(message.payload.upgradeId); } };
  let sequence = 0;
  return {
    async createRoom() { host = await createLanHost(handlers); onStatus('把房主连接码发给朋友'); return host.offerCode; },
    async joinRoom(offerCode) { guest = await joinLanHost(offerCode, handlers); onStatus('把加入者应答码发回房主'); return guest.answerCode; },
    async acceptGuest(answerCode) { if (!host) throw new Error('请先创建房间'); await host.acceptAnswer(answerCode); onStatus('正在等待直连'); },
    sendInput(input) { (guest ?? host)?.send(inputPacket(input, ++sequence)); },
    sendSnapshot(state, tick) { host?.send(snapshotPacket(state, tick)); },
    sendUpgrade(upgradeId) { guest?.send(upgradePacket(upgradeId)); },
  };
}
