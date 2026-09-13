import {
  createRoomIdentity,
  createSignalRoom,
  getSignalOffer,
  pollSignalAnswer,
  probeSignal,
  submitSignalAnswer,
} from '../src/network/signaling.js';

const BROWSER_ORIGIN = 'https://rawcdn.githack.com';
const browserFetch = async (input, init = {}) => {
  const headers = new Headers(init.headers ?? {});
  headers.set('Origin', BROWSER_ORIGIN);
  const response = await fetch(input, { ...init, headers });
  const allowOrigin = response.headers.get('access-control-allow-origin');
  if (allowOrigin !== '*' && allowOrigin !== BROWSER_ORIGIN) {
    throw new Error(`ntfy CORS rejected ${BROWSER_ORIGIN}: ${allowOrigin ?? 'missing header'}`);
  }
  return response;
};

const identity = createRoomIdentity();
const offer = JSON.stringify({
  type: 'offer',
  sdp: `v=0\r\no=deep-sea-duo 1 1 IN IP4 127.0.0.1\r\ns=ntfy-smoke-offer\r\nt=0 0\r\n${'a=candidate:smoke-offer 1 UDP 2122260223 192.0.2.1 5000 typ host\r\n'.repeat(110)}`,
});
const answer = JSON.stringify({
  type: 'answer',
  sdp: `v=0\r\no=deep-sea-duo 2 2 IN IP4 127.0.0.1\r\ns=ntfy-smoke-answer\r\nt=0 0\r\n${'a=candidate:smoke-answer 1 UDP 2122260223 192.0.2.2 5001 typ host\r\n'.repeat(90)}`,
});

await probeSignal({ backend: 'ntfy', requestTimeoutMs: 12000, fetchImpl: browserFetch });

const room = await createSignalRoom(offer, {
  backend: 'ntfy',
  skipProbe: true,
  identity,
  requestTimeoutMs: 12000,
  fetchImpl: browserFetch,
});
if (room.roomCode !== identity.roomCode || room.hostToken !== identity.hostToken) {
  throw new Error('ntfy room identity mismatch');
}

const fetchedOffer = await getSignalOffer(identity.roomCode, {
  backend: 'ntfy',
  requestTimeoutMs: 12000,
  fetchImpl: browserFetch,
});
if (fetchedOffer !== offer) throw new Error('ntfy offer round-trip mismatch');

await submitSignalAnswer(identity.roomCode, answer, {
  backend: 'ntfy',
  requestTimeoutMs: 12000,
  fetchImpl: browserFetch,
});

let fetchedAnswer = null;
for (let attempt = 0; attempt < 6 && !fetchedAnswer; attempt += 1) {
  fetchedAnswer = await pollSignalAnswer(identity.roomCode, identity.hostToken, {
    backend: 'ntfy',
    requestTimeoutMs: 12000,
    fetchImpl: browserFetch,
  });
  if (!fetchedAnswer) await new Promise(resolve => setTimeout(resolve, 800));
}
if (fetchedAnswer !== answer) throw new Error('ntfy answer round-trip mismatch');

console.log(`ntfy browser-CORS signaling smoke passed for room ${identity.roomCode}; offer=${offer.length}B answer=${answer.length}B`);
