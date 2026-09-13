import {
  applyHostSnapshot,
  applyRemoteInput,
  chooseRemoteUpgrade,
  chooseUpgrade,
  createGame,
  step,
} from '../game/simulation.js';

const HOST_SNAPSHOT_RATE = 15;
const GUEST_INPUT_RATE = 30;

const copyVector = (value, fallback) => ({
  x: Number.isFinite(value?.x) ? value.x : fallback.x,
  y: Number.isFinite(value?.y) ? value.y : fallback.y,
});

function sanitizeInput(input = {}) {
  return {
    movement: copyVector(input.movement, { x: 0, y: 0 }),
    aim: copyVector(input.aim, { x: 1, y: 0 }),
    firing: Boolean(input.firing),
    dash: Boolean(input.dash),
  };
}

export function createGameSession(options = {}) {
  const random = options.random ?? Math.random;
  let game = createGame(random);
  let role = null;
  let connected = false;
  let snapshotClock = 0;
  let inputClock = 0;
  let snapshotSequence = 0;
  let pendingGuestDash = false;

  function resetClocks() {
    snapshotClock = 0;
    inputClock = 0;
    snapshotSequence = 0;
    pendingGuestDash = false;
  }

  function begin(nextRole) {
    if (nextRole !== 'host' && nextRole !== 'guest') {
      throw new TypeError(`Invalid game-session role: ${nextRole}`);
    }
    game = createGame(random);
    role = nextRole;
    connected = false;
    resetClocks();
    return game;
  }

  function reset() {
    game = createGame(random);
    role = null;
    connected = false;
    resetClocks();
    return game;
  }

  function connect() {
    if (role !== 'host' && role !== 'guest') return false;
    connected = true;
    snapshotClock = 0;
    inputClock = 0;
    pendingGuestDash = false;
    return true;
  }

  function disconnect() {
    connected = false;
    pendingGuestDash = false;
  }

  function tick(dt, rawInput, transport = {}) {
    if (!connected || game.state !== 'playing') return { stepped: false, inputSent: false, snapshotSent: false };
    const input = sanitizeInput(rawInput);
    const safeDt = Math.max(0, Math.min(Number.isFinite(dt) ? dt : 0, 0.05));

    if (role === 'guest') {
      pendingGuestDash ||= input.dash;
      inputClock -= safeDt;
      let inputSent = false;
      if (inputClock <= 0) {
        inputSent = transport.sendInput?.({ ...input, dash: pendingGuestDash }) === true;
        pendingGuestDash = false;
        inputClock = 1 / GUEST_INPUT_RATE;
      }
      return { stepped: false, inputSent, snapshotSent: false };
    }

    step(game, input, safeDt);
    snapshotClock -= safeDt;
    let snapshotSent = false;
    if (snapshotClock <= 0) {
      snapshotSequence += 1;
      snapshotSent = transport.sendSnapshot?.(game, snapshotSequence) === true;
      snapshotClock = 1 / HOST_SNAPSHOT_RATE;
    }
    return { stepped: true, inputSent: false, snapshotSent };
  }

  return {
    begin,
    reset,
    connect,
    disconnect,
    tick,
    get game() { return game; },
    get role() { return role; },
    get connected() { return connected; },
    get localPlayer() { return role === 'guest' ? game.remotePlayer : game.player; },
    applyRemoteInput(input) { return applyRemoteInput(game, input); },
    applySnapshot(snapshot) { return applyHostSnapshot(game, snapshot); },
    chooseLocalUpgrade(upgrade) {
      if (!upgrade) return false;
      chooseUpgrade(game, upgrade);
      return true;
    },
    chooseRemoteUpgrade(upgrade) { return chooseRemoteUpgrade(game, upgrade); },
  };
}
