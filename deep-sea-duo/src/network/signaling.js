export const SIGNAL_URL = '/room';
export const NTFY_BASE_URL = 'https://ntfy.sh';

const DEFAULT_REQUEST_TIMEOUT_MS = 8000;
const DEFAULT_POLL_INTERVAL_MS = 650;
const DEFAULT_ROOM_TIMEOUT_MS = 10 * 60 * 1000;
const NTFY_CHUNK_SIZE = 2400;
const NTFY_MAX_AGE_MS = 10 * 60 * 1000;
const ntfySessions = new Map();

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

export function getSignalBackend(options = {}) {
  if (options.backend === 'netlify' || options.backend === 'ntfy') return options.backend;
  const host = String(globalThis.location?.hostname ?? '').toLowerCase();
  return host.endsWith('.netlify.app') ? 'netlify' : 'ntfy';
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

async function netlifyRead(action, payload = {}, options = {}) {
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
    if (!response.ok) throw signalError(data.error || `signal-http-${response.status}`, `HTTP ${response.status}`, options.stage ?? 'S1');
    return data;
  } catch (error) {
    if (error?.code) throw error;
    if (error?.name === 'AbortError') throw signalError(options.signal?.aborted ? 'signal-aborted' : 'signal-timeout', error?.message, options.stage ?? 'S1');
    throw signalError('signal-unavailable', error?.message || 'Signaling unavailable', options.stage ?? 'S1');
  } finally {
    timed.cleanup();
  }
}

async function netlifyWrite(action, payload = {}, options = {}) {
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
    if (!response.ok) throw signalError(data.error || `signal-http-${response.status}`, `HTTP ${response.status}`, options.stage ?? 'S2');
    return data;
  } catch (error) {
    if (error?.code) throw error;
    if (error?.name === 'AbortError') throw signalError(options.signal?.aborted ? 'signal-aborted' : 'signal-timeout', error?.message, options.stage ?? 'S2');
    throw signalError('signal-unavailable', error?.message || 'Signaling unavailable', options.stage ?? 'S2');
  } finally {
    timed.cleanup();
  }
}

function ntfyTopic(roomCode) {
  return `deep-sea-duo-${normalizeRoomCode(roomCode)}-signal`;
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x4000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x4000));
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function base64UrlToText(value) {
  const padded = String(value).replaceAll('-', '+').replaceAll('_', '/') + '==='.slice((String(value).length + 3) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function ntfyChunks(kind, session, payload) {
  const data = bytesToBase64Url(new TextEncoder().encode(payload));
  const total = Math.max(1, Math.ceil(data.length / NTFY_CHUNK_SIZE));
  const timestamp = Date.now();
  return Array.from({ length: total }, (_, part) => ({
    app: 'deep-sea-duo',
    v: 1,
    kind,
    session,
    ts: timestamp,
    part,
    total,
    data: data.slice(part * NTFY_CHUNK_SIZE, (part + 1) * NTFY_CHUNK_SIZE),
  }));
}

function parseNtfyEnvelope(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (parsed?.app !== 'deep-sea-duo' || parsed?.v !== 1) return null;
    if (!['offer', 'answer'].includes(parsed.kind)) return null;
    if (!/^[a-f0-9]{32,128}$/i.test(String(parsed.session ?? ''))) return null;
    if (!Number.isInteger(parsed.part) || !Number.isInteger(parsed.total) || parsed.part < 0 || parsed.total < 1 || parsed.part >= parsed.total) return null;
    if (typeof parsed.data !== 'string' || !Number.isFinite(parsed.ts)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function ntfyPayloadFromEnvelopes(envelopes, kind, expectedSession = null) {
  const groups = new Map();
  const now = Date.now();
  for (const raw of envelopes) {
    const envelope = parseNtfyEnvelope(raw);
    if (!envelope || envelope.kind !== kind) continue;
    if (expectedSession && envelope.session !== expectedSession) continue;
    if (Math.abs(now - envelope.ts) > NTFY_MAX_AGE_MS) continue;
    let group = groups.get(envelope.session);
    if (!group || envelope.ts > group.ts) {
      group = { ts: envelope.ts, total: envelope.total, parts: new Map() };
      groups.set(envelope.session, group);
    }
    if (envelope.ts === group.ts && envelope.total === group.total) group.parts.set(envelope.part, envelope.data);
  }

  const complete = [...groups.entries()]
    .filter(([, group]) => group.parts.size === group.total)
    .sort((a, b) => b[1].ts - a[1].ts);
  if (!complete.length) return null;
  const [session, group] = complete[0];
  const encoded = Array.from({ length: group.total }, (_, part) => group.parts.get(part) ?? '').join('');
  try {
    return { session, payload: base64UrlToText(encoded), ts: group.ts };
  } catch {
    return null;
  }
}

async function ntfyFetchMessages(roomCode, options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw signalError('signal-unavailable', 'fetch unavailable', options.stage ?? 'N1');
  const timed = timedController(options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS, options.signal);
  const topic = ntfyTopic(roomCode);
  const url = `${NTFY_BASE_URL}/${topic}/json?poll=1&since=10m`;
  try {
    const response = await fetchImpl(url, { method: 'GET', signal: timed.controller.signal, cache: 'no-store', mode: 'cors' });
    if (!response.ok) throw signalError(`signal-http-${response.status}`, `HTTP ${response.status}`, options.stage ?? 'N1');
    const text = await response.text();
    return text.split(/\r?\n/).filter(Boolean).flatMap(line => {
      try {
        const item = JSON.parse(line);
        if (item?.event !== 'message' || typeof item.message !== 'string') return [];
        const envelope = parseNtfyEnvelope(item.message);
        return envelope ? [envelope] : [];
      } catch {
        return [];
      }
    });
  } catch (error) {
    if (error?.code) throw error;
    if (error?.name === 'AbortError') throw signalError(options.signal?.aborted ? 'signal-aborted' : 'signal-timeout', error?.message, options.stage ?? 'N1');
    throw signalError('signal-unavailable', error?.message || 'ntfy unavailable', options.stage ?? 'N1');
  } finally {
    timed.cleanup();
  }
}

async function ntfyPublish(roomCode, kind, session, payload, options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw signalError('signal-unavailable', 'fetch unavailable', options.stage ?? 'N2');
  const topic = ntfyTopic(roomCode);
  const chunks = ntfyChunks(kind, session, payload);
  for (const envelope of chunks) {
    const timed = timedController(options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS, options.signal);
    try {
      const response = await fetchImpl(`${NTFY_BASE_URL}/${topic}?firebase=no`, {
        method: 'POST',
        body: JSON.stringify(envelope),
        signal: timed.controller.signal,
        cache: 'no-store',
        mode: 'cors',
      });
      if (!response.ok) throw signalError(`signal-http-${response.status}`, `HTTP ${response.status}`, options.stage ?? 'N2');
    } catch (error) {
      if (error?.code) throw error;
      if (error?.name === 'AbortError') throw signalError(options.signal?.aborted ? 'signal-aborted' : 'signal-timeout', error?.message, options.stage ?? 'N2');
      throw signalError('signal-unavailable', error?.message || 'ntfy unavailable', options.stage ?? 'N2');
    } finally {
      timed.cleanup();
    }
  }
}

async function probeNtfy(options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw signalError('signal-unavailable', 'fetch unavailable', 'N1');
  const timed = timedController(options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS, options.signal);
  try {
    const response = await fetchImpl(`${NTFY_BASE_URL}/v1/health`, { method: 'GET', signal: timed.controller.signal, cache: 'no-store', mode: 'cors' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.healthy !== true) throw signalError('signal-unavailable', 'ntfy health check failed', 'N1');
    return true;
  } catch (error) {
    if (error?.code) throw error;
    if (error?.name === 'AbortError') throw signalError(options.signal?.aborted ? 'signal-aborted' : 'signal-timeout', error?.message, 'N1');
    throw signalError('signal-unavailable', error?.message || 'ntfy unavailable', 'N1');
  } finally {
    timed.cleanup();
  }
}

export async function probeSignal(options = {}) {
  if (getSignalBackend(options) === 'ntfy') return probeNtfy(options);
  const data = await netlifyRead('health', {}, { ...options, stage: 'S1' });
  if (data?.ok !== true || Number(data?.version) < 1) throw signalError('signal-invalid-response', 'health response invalid', 'S1');
  return true;
}

export async function createSignalRoom(offer, options = {}) {
  if (!options.skipProbe) await probeSignal(options);
  const backend = getSignalBackend(options);
  const sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  let identity = options.identity ?? createRoomIdentity();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (attempt > 0) identity = createRoomIdentity();
    options.onRoomCode?.(identity.roomCode);

    if (backend === 'ntfy') {
      const existing = ntfyPayloadFromEnvelopes(await ntfyFetchMessages(identity.roomCode, { ...options, stage: 'N2' }), 'offer');
      if (existing) continue;
      await ntfyPublish(identity.roomCode, 'offer', identity.hostToken, offer, { ...options, stage: 'N2' });
      ntfySessions.set(identity.roomCode, identity.hostToken);
      return { ...identity, expiresIn: 600, backend: 'ntfy' };
    }

    try {
      await netlifyWrite('create', { ...identity, offer }, { ...options, stage: 'S2' });
    } catch (error) {
      if (error?.code === 'room_code_collision') continue;
      throw error;
    }
    await sleep(30);
    const stored = await getSignalOffer(identity.roomCode, { ...options, backend: 'netlify', stage: 'S2' });
    if (stored === offer) return { ...identity, expiresIn: 600, backend: 'netlify' };
  }
  throw signalError('signal-write-unconfirmed', 'room write was not confirmed', backend === 'ntfy' ? 'N2' : 'S2');
}

export async function getSignalOffer(roomCode, options = {}) {
  const code = normalizeRoomCode(roomCode);
  if (code.length !== 6) throw signalError('invalid-room-code', 'invalid room code', options.stage ?? 'S3');

  if (getSignalBackend(options) === 'ntfy') {
    const sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const found = ntfyPayloadFromEnvelopes(await ntfyFetchMessages(code, { ...options, stage: 'N3' }), 'offer');
      if (found) {
        ntfySessions.set(code, found.session);
        return found.payload;
      }
      await sleep(500);
    }
    throw signalError('room_not_found', 'room not found', 'N3');
  }

  const data = await netlifyRead('offer', { roomCode: code }, { ...options, stage: options.stage ?? 'S3' });
  if (typeof data.offer !== 'string') throw signalError('signal-invalid-response', 'missing offer', options.stage ?? 'S3');
  return data.offer;
}

export async function submitSignalAnswer(roomCode, answer, options = {}) {
  const code = normalizeRoomCode(roomCode);
  if (code.length !== 6) throw signalError('invalid-room-code', 'invalid room code', 'S4');

  if (getSignalBackend(options) === 'ntfy') {
    const session = ntfySessions.get(code);
    if (!session) throw signalError('room_not_found', 'host session missing', 'N4');
    await ntfyPublish(code, 'answer', session, answer, { ...options, stage: 'N4' });
    return true;
  }

  await netlifyWrite('answer', { roomCode: code, answer }, { ...options, stage: 'S4' });
  const sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await sleep(50 + attempt * 25);
    const status = await netlifyRead('status', { roomCode: code }, { ...options, stage: 'S4' });
    if (status?.hasAnswer === true) return true;
  }
  throw signalError('signal-write-unconfirmed', 'answer write was not confirmed', 'S4');
}

export async function pollSignalAnswer(roomCode, hostToken, options = {}) {
  const code = normalizeRoomCode(roomCode);
  if (getSignalBackend(options) === 'ntfy') {
    const found = ntfyPayloadFromEnvelopes(await ntfyFetchMessages(code, { ...options, stage: 'N5' }), 'answer', hostToken);
    return found?.payload ?? null;
  }
  const data = await netlifyRead('poll', { roomCode: code, hostToken }, { ...options, stage: 'S5' });
  return typeof data.answer === 'string' ? data.answer : null;
}

export async function closeSignalRoom(roomCode, hostToken, options = {}) {
  const code = normalizeRoomCode(roomCode);
  if (code.length !== 6 || !hostToken) return false;
  if (getSignalBackend(options) === 'ntfy') {
    ntfySessions.delete(code);
    return true;
  }
  try {
    await netlifyWrite('close', { roomCode: code, hostToken }, { ...options, stage: 'S6' });
    return true;
  } catch {
    return false;
  }
}

export async function waitForSignalAnswer(roomCode, hostToken, options = {}) {
  const started = Date.now();
  const timeoutMs = options.timeoutMs ?? DEFAULT_ROOM_TIMEOUT_MS;
  const backend = getSignalBackend(options);
  const sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  let attempt = 0;

  while (Date.now() - started < timeoutMs) {
    if (options.signal?.aborted) throw signalError('signal-aborted', 'aborted', backend === 'ntfy' ? 'N5' : 'S5');
    const answer = await pollSignalAnswer(roomCode, hostToken, options);
    if (answer) return answer;
    attempt += 1;
    const intervalMs = options.intervalMs ?? (backend === 'ntfy' ? (attempt < 12 ? 1400 : 4500) : DEFAULT_POLL_INTERVAL_MS);
    await sleep(intervalMs);
  }
  throw signalError('room-expired', 'room timed out', backend === 'ntfy' ? 'N5' : 'S5');
}
