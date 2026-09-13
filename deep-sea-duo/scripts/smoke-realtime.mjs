import { createClient } from '@supabase/supabase-js';

const url = 'https://kqwlkleuguixkgutwuda.supabase.co';
const key = 'sb_publishable_F5j_5pFw4tTDvYLe-mxzXQ_S1l37mUJ';
const token = crypto.randomUUID().replaceAll('-', '');
const topic = `deep-sea-duo:999999:${token}`;

const makeClient = () => createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const clientA = makeClient();
const clientB = makeClient();
const channelA = clientA.channel(topic, { config: { private: false, broadcast: { self: false, ack: true } } });
const channelB = clientB.channel(topic, { config: { private: false, broadcast: { self: false, ack: true } } });

const timeout = (label, ms = 12000) => new Promise((_, reject) => {
  setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
});

const subscribe = (channel, label) => Promise.race([
  new Promise((resolve, reject) => {
    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') resolve();
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(new Error(`${label} subscribe ${status}`));
    });
  }),
  timeout(`${label} subscribe`),
]);

const receiveOnce = (channel, expected, label) => Promise.race([
  new Promise(resolve => {
    channel.on('broadcast', { event: 'packet' }, ({ payload }) => {
      if (payload?.value === expected) resolve(payload.value);
    });
  }),
  timeout(`${label} receive`),
]);

try {
  const receiveB = receiveOnce(channelB, 'A-to-B', 'B');
  const receiveA = receiveOnce(channelA, 'B-to-A', 'A');
  await Promise.all([subscribe(channelA, 'A'), subscribe(channelB, 'B')]);

  const resultA = await channelA.send({ type: 'broadcast', event: 'packet', payload: { value: 'A-to-B' } });
  if (resultA !== 'ok') throw new Error(`A send failed: ${resultA}`);
  if (await receiveB !== 'A-to-B') throw new Error('B payload mismatch');

  const resultB = await channelB.send({ type: 'broadcast', event: 'packet', payload: { value: 'B-to-A' } });
  if (resultB !== 'ok') throw new Error(`B send failed: ${resultB}`);
  if (await receiveA !== 'B-to-A') throw new Error('A payload mismatch');

  console.log(`realtime relay smoke test passed on ${topic}`);
} finally {
  await Promise.allSettled([
    clientA.removeChannel(channelA),
    clientB.removeChannel(channelB),
  ]);
  try { clientA.realtime.disconnect(); } catch {}
  try { clientB.realtime.disconnect(); } catch {}
}
