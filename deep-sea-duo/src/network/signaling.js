export const SIGNAL_URL = 'https://kqwlkleuguixkgutwuda.supabase.co/functions/v1/deep-sea-duo-signal';

const DEFAULT_REQUEST_TIMEOUT_MS = 8000;
const DEFAULT_POLL_INTERVAL_MS = 650;
const DEFAULT_ROOM_TIMEOUT_MS = 10 * 60 * 1000;

export function normalizeRoomCode(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 6);
}

function signalError(code, message = code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export async function requestSignal(action, payload = {}, options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw signalError('signal-unavailable');

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const externalSignal = options.signal;
  const abortFromExternal = () => controller.abort();
  if (externalSignal?.aborted) controller.abort();
  else externalSignal?.addEventListener?.('abort', abortFromExternal, { once: true });

  try {
    const response = await fetchImpl(SIGNAL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw signalError(data.error || `signal-http-${response.status}`);
    return data;
  } catch (error) {
    if (error?.code) throw error;
    if (error?.name === 'AbortError') {
      throw signalError(externalSignal?.aborted ? 'signal-aborted' : 'signal-timeout');
    }
    throw signalError('signal-unavailable', error?.message || 'Signaling unavailable');
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener?.('abort', abortFromExternal);
  }
}

export async function createSignalRoom(offer, options) {
  const data = await requestSignal('create', { offer }, options);
  if (!/^\d{6}$/.test(data.roomCode) || typeof data.hostToken !== 'string') {
    throw signalError('signal-invalid-response');
  }
  return data;
}

export async function getSignalOffer(roomCode, options) {
  const code = normalizeRoomCode(roomCode);
  if (code.length !== 6) throw signalError('invalid-room-code');
  const data = await requestSignal('offer', { roomCode: code }, options);
  if (typeof data.offer !== 'string') throw signalError('signal-invalid-response');
  return data.offer;
}

export async function submitSignalAnswer(roomCode, answer, options) {
  const code = normalizeRoomCode(roomCode);
  if (code.length !== 6) throw signalError('invalid-room-code');
  await requestSignal('answer', { roomCode: code, answer }, options);
  return true;
}

export async function pollSignalAnswer(roomCode, hostToken, options) {
  const code = normalizeRoomCode(roomCode);
  const data = await requestSignal('poll', { roomCode: code, hostToken }, options);
  return typeof data.answer === 'string' ? data.answer : null;
}

export async function closeSignalRoom(roomCode, hostToken, options) {
  const code = normalizeRoomCode(roomCode);
  if (code.length !== 6 || !hostToken) return false;
  try {
    await requestSignal('close', { roomCode: code, hostToken }, options);
    return true;
  } catch {
    return false;
  }
}

export async function waitForSignalAnswer(roomCode, hostToken, options = {}) {
  const started = Date.now();
  const timeoutMs = options.timeoutMs ?? DEFAULT_ROOM_TIMEOUT_MS;
  const intervalMs = options.intervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));

  while (Date.now() - started < timeoutMs) {
    if (options.signal?.aborted) throw signalError('signal-aborted');
    const answer = await pollSignalAnswer(roomCode, hostToken, options);
    if (answer) return answer;
    await sleep(intervalMs);
  }
  throw signalError('room-expired');
}
