export const MESSAGE_TYPES = Object.freeze({ input: 'input', snapshot: 'snapshot', upgrade: 'upgrade', ping: 'ping' });

export function encodeMessage(type, payload) { return JSON.stringify({ type, payload }); }
export function decodeMessage(raw) {
  try { const value = typeof raw === 'string' ? JSON.parse(raw) : raw; return Object.values(MESSAGE_TYPES).includes(value?.type) ? value : null; } catch { return null; }
}
export function inputPacket(input, sequence) { return encodeMessage(MESSAGE_TYPES.input, { sequence, movement: input.movement, aim: input.aim, firing: Boolean(input.firing), dash: Boolean(input.dash) }); }
export function upgradePacket(upgradeId) { return encodeMessage(MESSAGE_TYPES.upgrade, { upgradeId }); }
const copyEntities = entities => entities.map(entity => ({ ...entity }));
export function createSnapshot(state, tick) {
  return {
    tick, time: state.time, state: state.state,
    players: [state.player, state.remotePlayer].map(player => ({ ...player, tail: copyEntities(player.tail) })),
    enemies: copyEntities(state.enemies), bubbles: copyEntities(state.bubbles), food: copyEntities(state.food),
    boss: state.boss ? { ...state.boss } : null,
    powerup: state.powerup ? { ...state.powerup } : null,
    bossMessageTimer: state.bossMessageTimer, powerupMessage: state.powerupMessage,
    powerupMessageTimer: state.powerupMessageTimer,
  };
}
export function snapshotPacket(state, tick) { return encodeMessage(MESSAGE_TYPES.snapshot, createSnapshot(state, tick)); }
export function isSnapshot(message) { return message?.type === MESSAGE_TYPES.snapshot && Number.isFinite(message.payload?.tick) && Array.isArray(message.payload?.players); }
