import { decodeMessage } from './messages.js';

const waitForIce = peer => new Promise((resolve, reject) => {
  if (peer.iceGatheringState === 'complete') return resolve();
  const timeout = setTimeout(() => reject(new Error('局域网连接信息生成超时')), 8000);
  const complete = () => { if (peer.iceGatheringState === 'complete') { clearTimeout(timeout); peer.removeEventListener('icegatheringstatechange', complete); resolve(); } };
  peer.addEventListener('icegatheringstatechange', complete);
});

const attachChannel = (channel, handlers) => {
  channel.onopen = () => handlers.onStatus?.('connected');
  channel.onclose = () => handlers.onStatus?.('closed');
  channel.onerror = () => handlers.onStatus?.('error');
  channel.onmessage = event => { const message = decodeMessage(event.data); if (message) handlers.onMessage?.(message); };
};

export async function createLanHost(handlers = {}) {
  const peer = new RTCPeerConnection({ iceServers: [] });
  const channel = peer.createDataChannel('deep-sea-duo', { ordered: false, maxRetransmits: 0 });
  attachChannel(channel, handlers);
  const offer = await peer.createOffer(); await peer.setLocalDescription(offer); await waitForIce(peer);
  return { peer, send: message => { if (channel.readyState !== 'open' || channel.bufferedAmount > 65536) return false; channel.send(message); return true; }, offerCode: JSON.stringify(peer.localDescription), acceptAnswer: async answerCode => { await peer.setRemoteDescription(JSON.parse(answerCode)); } };
}

export async function joinLanHost(offerCode, handlers = {}) {
  const peer = new RTCPeerConnection({ iceServers: [] });
  let channel = null; peer.ondatachannel = event => { channel = event.channel; attachChannel(channel, handlers); };
  await peer.setRemoteDescription(JSON.parse(offerCode)); const answer = await peer.createAnswer(); await peer.setLocalDescription(answer); await waitForIce(peer);
  return { peer, answerCode: JSON.stringify(peer.localDescription), send: message => { if (channel?.readyState !== 'open' || channel.bufferedAmount > 65536) return false; channel.send(message); return true; } };
}
