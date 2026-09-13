import { BUILD_ID } from './build.js';
import { createGameSession } from './app/game-session.js';
import { createInput } from './game/input.js';
import { getUpgradeChoices } from './game/simulation.js';
import { UPGRADES } from './game/constants.js';
import { render, resizeCanvas } from './game/renderer.js';
import { hideUpgrades, showUpgrades, updateHud } from './ui/hud.js';
import { createRoomController } from './network/room.js';
import { normalizeRoomCode } from './network/signaling.js';
import { applyDocumentTranslations, onLanguageChange, t, toggleLanguage } from './i18n.js';
import { createAdaptiveAudio } from './audio/audio.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d', { alpha: false });
const hud = document.querySelector('#hud');
const panel = document.querySelector('#upgrade-panel');
const dashButton = document.querySelector('#dash-button');
const roomPanel = document.querySelector('#room-panel');
const roomStatus = document.querySelector('#room-status');
const buildBadge = document.querySelector('#build-badge');
const languageButton = document.querySelector('#language-button');
const audioButton = document.querySelector('#audio-button');
const createRoomButton = document.querySelector('#create-room');
const joinRoomButton = document.querySelector('#join-room');
const lobbyActions = document.querySelector('#lobby-actions');
const hostRoomView = document.querySelector('#host-room-view');
const hostRoomCode = document.querySelector('#host-room-code');
const joinRoomView = document.querySelector('#join-room-view');
const quickRoomInput = document.querySelector('#quick-room-code');
const quickJoinButton = document.querySelector('#quick-join');
const retryRoomButton = document.querySelector('#retry-room');
const manualCode = document.querySelector('#manual-code');
const manualCreateButton = document.querySelector('#manual-create');
const manualJoinButton = document.querySelector('#manual-join');
const manualActionButton = document.querySelector('#manual-action');

const controller = createInput(canvas);
const session = createGameSession();
const audio = createAdaptiveAudio();
let last = performance.now();
let choices = [];
let hudClock = 0;
let lastRoomStatus = 'idle';
let wakeLock = null;
let manualGeneratedCode = '';

if (buildBadge) buildBadge.textContent = BUILD_ID;

function localizeStatus(status) {
  const known = {
    idle: 'roomLan',
    connected: 'connected',
    'connected-direct': 'connected',
    'connected-relay': 'connectedRelay',
    connecting: 'connecting',
    disconnected: 'disconnected',
    failed: 'failed',
    closed: 'closed',
    error: 'connectionError',
    'creating-room': 'creatingRoom',
    'signal-check': 'creatingRoom',
    'webrtc-preparing': 'preparingConnection',
    'signal-saving': 'savingRoom',
    'host-waiting': 'hostWaiting',
    'joining-room': 'joiningRoom',
    'relay-error': 'relayUnavailable',
    'relay-closed': 'relayUnavailable',
    'relay-sdk-unavailable': 'relayUnavailable',
    'signal-error': 'signalUnavailable',
    'signal-unavailable': 'signalUnavailable',
    'signal-timeout': 'signalTimeout',
    'room-expired': 'roomExpired',
    'room_not_found': 'roomNotFound',
    'room_not_found_or_joined': 'roomUnavailable',
    '把房主连接码发给朋友': 'manualHostReady',
    '把加入者应答码发回房主': 'manualGuestReady',
    '正在等待直连': 'waitingDirect',
    waitingDirect: 'waitingDirect',
  };
  return known[status] ? t(known[status]) : status;
}

function localizeError(error) {
  const known = {
    'ice-timeout': 'errorIceTimeout',
    'invalid-code': 'errorInvalidCode',
    'expected-answer': 'errorExpectedAnswer',
    'expected-offer': 'errorExpectedOffer',
    'host-not-ready': 'errorHostNotReady',
    'invalid-room-code': 'invalidRoomCode',
    'signal-unavailable': 'signalUnavailable',
    'signal-timeout': 'signalTimeout',
    'room_not_found': 'roomNotFound',
    'room_not_found_or_joined': 'roomUnavailable',
    'room-expired': 'roomExpired',
    'relay-sdk-unavailable': 'relayUnavailable',
    'relay-invalid-room': 'relayUnavailable',
  };
  const base = t(known[error?.code] ?? 'connectionError');
  const diagnostic = [error?.stage, error?.code, error?.name]
    .filter(Boolean)
    .map(value => String(value).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 36))
    .filter((value, index, list) => value && list.indexOf(value) === index)
    .join(':');
  return diagnostic ? `${base} [${diagnostic}]` : base;
}

async function requestWakeLock() {
  if (!session.connected || !globalThis.navigator?.wakeLock?.request || wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; }, { once: true });
  } catch {}
}

async function releaseWakeLock() {
  const lock = wakeLock;
  wakeLock = null;
  try { await lock?.release?.(); } catch {}
}

function clearMatchUi() {
  choices = [];
  hideUpgrades(panel);
  controller.reset();
  hudClock = 0;
}

function prepareSession(role) {
  session.begin(role);
  clearMatchUi();
}

function setLobbyView(view = 'home') {
  lobbyActions.classList.toggle('is-hidden', view !== 'home');
  hostRoomView.classList.toggle('is-hidden', view !== 'host');
  joinRoomView.classList.toggle('is-hidden', view !== 'join');
  retryRoomButton.classList.toggle('is-hidden', view === 'home');
}

function resetPairingUi(messageKey = 'roomLan') {
  session.reset();
  clearMatchUi();
  manualGeneratedCode = '';
  manualCode.value = '';
  quickRoomInput.value = '';
  quickJoinButton.disabled = true;
  hostRoomCode.textContent = '------';
  manualActionButton.classList.add('is-hidden');
  manualActionButton.disabled = false;
  setLobbyView('home');
  roomPanel.classList.remove('is-hidden');
  roomStatus.textContent = t(messageKey);
  document.body.classList.add('in-lobby');
}

const room = createRoomController(
  status => {
    const isConnectedStatus = ['connected', 'connected-direct', 'connected-relay'].includes(status);

    if (!session.connected && ['closed', 'disconnected'].includes(status)) return;

    lastRoomStatus = status;
    roomStatus.textContent = localizeStatus(status);
    if (isConnectedStatus) {
      session.connect();
      roomPanel.classList.add('is-hidden');
      document.body.classList.remove('in-lobby');
      requestWakeLock();
      return;
    }
    if (['disconnected', 'failed', 'closed', 'error', 'relay-error', 'relay-closed', 'relay-sdk-unavailable', 'signal-error', 'signal-unavailable', 'signal-timeout', 'room-expired', 'room_not_found', 'room_not_found_or_joined'].includes(status)) {
      session.disconnect();
      clearMatchUi();
      releaseWakeLock();
      roomPanel.classList.remove('is-hidden');
      retryRoomButton.classList.remove('is-hidden');
      document.body.classList.add('in-lobby');
    }
  },
  input => session.applyRemoteInput(input),
  snapshot => session.applySnapshot(snapshot),
  id => session.chooseRemoteUpgrade(UPGRADES.find(upgrade => upgrade.id === id)),
);

function currentPlayer() {
  return session.localPlayer;
}

function selectUpgrade(id) {
  if (session.role === 'guest') room.sendUpgrade(id);
  else session.chooseLocalUpgrade(choices.find(choice => choice.id === id));
  choices = [];
  hideUpgrades(panel);
}

function refreshStaticText() {
  applyDocumentTranslations(document);
  languageButton.textContent = t('languageButton');
  languageButton.setAttribute('aria-label', t('languageAria'));
  audioButton.textContent = t(audio.isEnabled() ? 'audioOn' : 'audioOff');
  audioButton.setAttribute('aria-label', t('audioAria'));
  roomStatus.textContent = localizeStatus(lastRoomStatus);
  if (choices.length) showUpgrades(panel, choices, selectUpgrade);
  hudClock = 0;
}

createRoomButton.addEventListener('click', async () => {
  await audio.unlock();
  room.reset();
  prepareSession('host');
  setLobbyView('host');
  hostRoomCode.textContent = '······';
  roomStatus.textContent = t('creatingRoom');
  try {
    const code = await room.createQuickRoom(nextCode => {
      hostRoomCode.textContent = nextCode;
    });
    hostRoomCode.textContent = code;
    if (!session.connected) roomStatus.textContent = t('hostWaiting');
  } catch (error) {
    console.error('Deep Sea Duo create room failed', error);
    roomStatus.textContent = localizeError(error);
    retryRoomButton.classList.remove('is-hidden');
  }
});

joinRoomButton.addEventListener('click', async () => {
  await audio.unlock();
  room.reset();
  prepareSession('guest');
  setLobbyView('join');
  roomStatus.textContent = t('enterRoomCode');
  setTimeout(() => quickRoomInput.focus(), 50);
});

quickRoomInput.addEventListener('input', () => {
  quickRoomInput.value = normalizeRoomCode(quickRoomInput.value);
  quickJoinButton.disabled = quickRoomInput.value.length !== 6;
});

async function joinQuickRoom() {
  const code = normalizeRoomCode(quickRoomInput.value);
  if (code.length !== 6) {
    roomStatus.textContent = t('invalidRoomCode');
    quickRoomInput.focus();
    return;
  }
  quickJoinButton.disabled = true;
  roomStatus.textContent = t('joiningRoom');
  try {
    await room.joinQuickRoom(code);
  } catch (error) {
    console.error('Deep Sea Duo join room failed', error);
    roomStatus.textContent = localizeError(error);
    quickJoinButton.disabled = false;
    retryRoomButton.classList.remove('is-hidden');
  }
}

quickJoinButton.addEventListener('click', joinQuickRoom);
quickRoomInput.addEventListener('keydown', event => {
  if (event.key === 'Enter' && quickRoomInput.value.length === 6) joinQuickRoom();
});

retryRoomButton.addEventListener('click', () => {
  room.reset();
  releaseWakeLock();
  resetPairingUi('pairingReset');
});

manualCreateButton.addEventListener('click', async () => {
  await audio.unlock();
  room.reset();
  prepareSession('host');
  roomStatus.textContent = t('manualCreating');
  try {
    manualCode.value = await room.createRoom();
    manualGeneratedCode = manualCode.value;
    manualActionButton.textContent = t('manualAcceptAnswer');
    manualActionButton.classList.remove('is-hidden');
  } catch (error) {
    roomStatus.textContent = localizeError(error);
  }
});

manualJoinButton.addEventListener('click', async () => {
  await audio.unlock();
  room.reset();
  prepareSession('guest');
  manualGeneratedCode = '';
  manualCode.value = '';
  manualCode.placeholder = t('pasteOffer');
  manualActionButton.textContent = t('manualGenerateAnswer');
  manualActionButton.classList.remove('is-hidden');
  roomStatus.textContent = t('manualPasteOffer');
  manualCode.focus();
});

manualActionButton.addEventListener('click', async () => {
  const code = manualCode.value.trim();
  try {
    if (session.role === 'host') {
      if (!code || code === manualGeneratedCode) {
        roomStatus.textContent = t('needGuestAnswer');
        return;
      }
      await room.acceptGuest(code);
      manualActionButton.disabled = true;
      roomStatus.textContent = t('waitingDirect');
    } else if (session.role === 'guest') {
      if (!code) {
        roomStatus.textContent = t('needHostOffer');
        return;
      }
      manualCode.value = await room.joinRoom(code);
      manualGeneratedCode = manualCode.value;
      manualActionButton.classList.add('is-hidden');
    }
  } catch (error) {
    roomStatus.textContent = localizeError(error);
    manualActionButton.disabled = false;
  }
});

languageButton.addEventListener('click', toggleLanguage);
audioButton.addEventListener('click', async () => {
  if (!audio.isUnlocked()) await audio.unlock();
  audio.toggle();
  audioButton.textContent = t(audio.isEnabled() ? 'audioOn' : 'audioOff');
});

onLanguageChange(refreshStaticText);
document.body.classList.add('in-lobby');
refreshStaticText();
setLobbyView('home');

const unlockAudio = () => { audio.unlock(); };
window.addEventListener('pointerdown', unlockAudio, { once: true, capture: true });
window.addEventListener('keydown', unlockAudio, { once: true, capture: true });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') requestWakeLock();
});

function restartMatch() {
  if (!session.restart()) return;
  clearMatchUi();
}

function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  const frameInput = controller.frame();
  session.tick(dt, frameInput, {
    sendInput: input => room.sendInput(input),
    sendSnapshot: (state, tick) => room.sendSnapshot(state, tick),
  });

  if (session.connected) {
    const levelingPlayer = currentPlayer();
    if (levelingPlayer.pendingLevel && !choices.length) {
      choices = getUpgradeChoices();
      showUpgrades(panel, choices, selectUpgrade);
    }
    audio.sync(session.game, levelingPlayer);
  }

  hudClock -= dt;
  if (hudClock <= 0) {
    updateHud(hud, session.game, currentPlayer());
    hudClock = 0.1;
  }

  render(ctx, session.game);
  requestAnimationFrame(loop);
}

dashButton.addEventListener('pointerdown', event => {
  event.preventDefault();
  if (!session.connected) return;
  controller.requestDash();
  audio.unlock();
});

canvas.addEventListener('pointerdown', () => {
  if (session.connected && session.game.state === 'gameover' && session.role !== 'guest') restartMatch();
});

function handleResize() { resizeCanvas(canvas); }
window.addEventListener('resize', handleResize, { passive: true });
globalThis.visualViewport?.addEventListener('resize', handleResize, { passive: true });
handleResize();
requestAnimationFrame(loop);
