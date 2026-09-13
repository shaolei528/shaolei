export const SIGNAL_URL = '/room';

const DEFAULT_REQUEST_TIMEOUT_MS = 8000;
const DEFAULT_POLL_INTERVAL_MS = 650;
const DEFAULT_ROOM_TIMEOUT_MS = 10 * 60 * 1000;

export function normalizeRoomCode(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 6);
}

function signalError(code, message = code, stage = null) {
  const error = new Error(message);
  error.code = code;
  if (stage) error.stage = stage;
  return error;
}

function randomDigits(length = 6) {
  const values = new Uint32Array(length);
  globalThis.crypto.getRandomValues(values);
  return Array.from(values, value => String(value % 10)).join('');
}

function randomToken() {
  const bytes = new Uint8Array(24);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function createRoomIdentity() {
  return { roomCode: randomDigits(6), hostToken: randomToken() };
}

function signalEndpoint() {
  const base = globalThis.location?.origin && globalThis.location.origin !== 'null'
    ? globalThis.location.origin
    : 'https://deep-sea-duo.netlify.app';
  return new URL(SIGNAL_URL, base);
}

function timedController(timeoutMs, externalSignal) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromExternal = () => controller.abort();
  if (externalSignal?.aborted) controller.abort();
  else externalSignal?.addEventListener?.('abort', abortFromExternal, { once: true });
  return {
    controller,
    cleanup() {
      clearTimeout(timeout);
      externalSignal?.removeEventListener?.('abort', abortFromExternal);
    },
  };
}

async function readSignal(action, payload = {}, options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw signalError('signal-unavailable', 'fetch unavailable', options.stage ?? 'S1');
  const timed = timedController(options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS, options.signal);
  const url = signalEndpoint();
  url.searchParams.set('action', action);
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }

  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      signal: timed.controller.signal,
      cache: 'no-store',
      credentials: 'same-origin',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw signalError(data.error || `signal-http-${response.status}`, `HTTP ${response.status}`, options.stage ?? 'S1');
    }
    return data;
  } catch (error) {
    if (error?.code) throw error;
    if (error?.name === 'AbortError') {
      throw signalError(options.signal?.aborted ? 'signal-aborted' : 'signal-timeout', error?.message, options.stage ?? 'S1');
    }
    throw signalError('signal-unavailable', error?.message || 'Signaling unavailable', options.stage ?? 'S1');
  } finally {
    timed.cleanup();
  }
}

async function writeSignal(action, payload = {}, options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw signalError('signal-unavailable', 'fetch unavailable', options.stage ?? 'S2');
  const timed = timedController(options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS, options.signal);

  try {
    const response = await fetchImpl(signalEndpoint(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
      signal: timed.controller.signal,
      cache: 'no-store',
      credentials: 'same-origin',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw signalError(data.error || `signal-http-${response.status}`, `HTTP ${response.status}`, options.stage ?? 'S2');
    }
    return data;
  } catch (error) {
    if (error?.code) throw error;
    if (error?.name === 'AbortError') {
      throw signalError(options.signal?.aborted ? 'signal-aborted' : 'signal-timeout', error?.message, options.stage ?? 'S2');
    }
    throw signalError('signal-unavailable', error?.message || 'Signaling unavailable', options.stage ?? 'S2');
  } finally {
    timed.cleanup();
  }
}

export async function probeSignal(options = {}) {
  const data = await readSignal('health', {}, { ...options, stage: 'S1' });
  if (data?.ok !== true || Number(data?.version) < 1) {
    throw signalError('signal-invalid-response', 'health response invalid', 'S1');
  }
  return true;
}

export async function createSignalRoom(offer, options = {}) {
  if (!options.skipProbe) await probeSignal(options);
  const sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  let identity = options.identity ?? createRoomIdentity();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (attempt > 0) identity = createRoomIdentity();
    options.onRoomCode?.(identity.roomCode);
    try {
      await writeSignal('create', { ...identity, offer }, { ...options, stage: 'S2' });
    } catch (error) {
      if (error?.code === 'room_code_collision') continue;
      throw error;
    }
    await sleep(30);
    const stored = await getSignalOffer(identity.roomCode, { ...options, stage: 'S2' });
    if (stored === offer) return { ...identity, expiresIn: 600 };
  }
  throw signalError('signal-write-unconfirmed', 'room write was not confirmed', 'S2');
}

export async function getSignalOffer(roomCode, options = {}) {
  const code = normalizeRoomCode(roomCode);
  if (code.length !== 6) throw signalError('invalid-room-code', 'invalid room code', options.stage ?? 'S3');
  const data = await readSignal('offer', { roomCode: code }, { ...options, stage: options.stage ?? 'S3' });
  if (typeof data.offer !== 'string') throw signalError('signal-invalid-response', 'missing offer', options.stage ?? 'S3');
  return data.offer;
}

export async function submitSignalAnswer(roomCode, answer, options = {}) {
  const code = normalizeRoomCode(roomCode);
  if (code.length !== 6) throw signalError('invalid-room-code', 'invalid room code', 'S4');
  await writeSignal('answer', { roomCode: code, answer }, { ...options, stage: 'S4' });
  const sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await sleep(50 + attempt * 25);
    const status = await readSignal('status', { roomCode: code }, { ...options, stage: 'S4' });
    if (status?.hasAnswer === true) return true;
  }
  throw signalError('signal-write-unconfirmed', 'answer write was not confirmed', 'S4');
}

export async function pollSignalAnswer(roomCode, hostToken, options = {}) {
  const code = normalizeRoomCode(roomCode);
  const data = await readSignal('poll', { roomCode: code, hostToken }, { ...options, stage: 'S5' });
  return typeof data.answer === 'string' ? data.answer : null;
}

export async function closeSignalRoom(roomCode, hostToken, options = {}) {
  const code = normalizeRoomCode(roomCode);
  if (code.length !== 6 || !hostToken) return false;
  try {
    await writeSignal('close', { roomCode: code, hostToken }, { ...options, stage: 'S6' });
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
    if (options.signal?.aborted) throw signalError('signal-aborted', 'aborted', 'S5');
    const answer = await pollSignalAnswer(roomCode, hostToken, options);
    if (answer) return answer;
    await sleep(intervalMs);
  }
  throw signalError('room-expired', 'room timed out', 'S5');
}
