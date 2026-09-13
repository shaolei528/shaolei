import { createInput } from './game/input.js';
import { applyHostSnapshot, applyRemoteInput, createGame, chooseRemoteUpgrade, chooseUpgrade, getUpgradeChoices, step } from './game/simulation.js';
import { UPGRADES } from './game/constants.js';
import { render, resizeCanvas } from './game/renderer.js';
import { hideUpgrades, showUpgrades, updateHud } from './ui/hud.js';
import { createRoomController } from './network/room.js';
import { applyDocumentTranslations, onLanguageChange, t, toggleLanguage } from './i18n.js';
import { createAdaptiveAudio } from './audio/audio.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d', { alpha: false });
const hud = document.querySelector('#hud');
const panel = document.querySelector('#upgrade-panel');
const dashButton = document.querySelector('#dash-button');
const roomPanel = document.querySelector('#room-panel');
const roomCode = document.querySelector('#room-code');
const roomAction = document.querySelector('#room-action');
const roomStatus = document.querySelector('#room-status');
const languageButton = document.querySelector('#language-button');
const audioButton = document.querySelector('#audio-button');
const copyCodeButton = document.querySelector('#copy-code');
const pasteCodeButton = document.querySelector('#paste-code');
const shareCodeButton = document.querySelector('#share-code');
const retryRoomButton = document.querySelector('#retry-room');

const controller = createInput(canvas);
const audio = createAdaptiveAudio();
let game = createGame();
let last = performance.now();
let choices = [];
let snapshotClock = 0;
let inputClock = 0;
let hudClock = 0;
let pendingGuestDash = false;
let roomMode = null;
let lastRoomStatus = 'idle';
let lastGeneratedCode = '';
let connectionActive = false;
let wakeLock = null;

function localizeStatus(status) {
  const known = {
    idle: 'roomLan',
    connected: 'connected',
    connecting: 'connecting',
    disconnected: 'disconnected',
    failed: 'failed',
    closed: 'closed',
    error: 'connectionError',
    '把房主连接码发给朋友': 'hostOfferReady',
    '把加入者应答码发回房主': 'guestAnswerReady',
    '正在等待直连': 'waitingDirect',
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
  };
  return t(known[error?.code] ?? 'connectionError');
}

async function requestWakeLock() {
  if (!connectionActive || !globalThis.navigator?.wakeLock?.request || wakeLock) return;
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

function resetPairingUi(messageKey = 'roomLan') {
  roomMode = null;
  lastGeneratedCode = '';
  roomCode.value = '';
  roomCode.placeholder = t('roomCodePlaceholder');
  roomAction.classList.add('is-hidden');
  roomAction.disabled = false;
  retryRoomButton.classList.add('is-hidden');
  roomStatus.textContent = t(messageKey);
}

const room = createRoomController(
  status => {
    lastRoomStatus = status;
    roomStatus.textContent = localizeStatus(status);
    if (status === 'connected') {
      connectionActive = true;
      retryRoomButton.classList.add('is-hidden');
      roomPanel.classList.add('is-hidden');
      requestWakeLock();
      return;
    }
    if (['disconnected', 'failed', 'closed', 'error'].includes(status)) {
      connectionActive = false;
      releaseWakeLock();
      roomPanel.classList.remove('is-hidden');
      retryRoomButton.classList.remove('is-hidden');
      roomAction.disabled = false;
    }
  },
  input => applyRemoteInput(game, input),
  snapshot => applyHostSnapshot(game, snapshot),
  id => chooseRemoteUpgrade(game, UPGRADES.find(upgrade => upgrade.id === id)),
);

function currentPlayer() {
  return roomMode === 'guest' ? game.remotePlayer : game.player;
}

function selectUpgrade(id) {
  if (roomMode === 'guest') room.sendUpgrade(id);
  else chooseUpgrade(game, choices.find(choice => choice.id === id));
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
  roomAction.textContent = roomMode === 'host' ? t('pasteAnswer') : roomMode === 'guest' ? t('generateAnswer') : t('roomActionConfirm');
  if (choices.length) showUpgrades(panel, choices, selectUpgrade);
  hudClock = 0;
}

async function copyCurrentCode() {
  const text = roomCode.value.trim();
  if (!text) { roomStatus.textContent = t('codeEmpty'); return false; }
  try {
    await navigator.clipboard.writeText(text);
    roomStatus.textContent = t('codeCopied');
    return true;
  } catch {
    roomCode.focus();
    roomCode.select();
    try {
      const copied = document.execCommand?.('copy');
      roomStatus.textContent = copied ? t('codeCopied') : t('pasteManual');
      return Boolean(copied);
    } catch {
      roomStatus.textContent = t('pasteManual');
      return false;
    }
  }
}

async function pasteCurrentCode() {
  try {
    const text = (await navigator.clipboard.readText()).trim();
    if (!text) throw new Error('empty clipboard');
    roomCode.value = text;
    roomStatus.textContent = t('codePasted');
    roomCode.focus();
    return true;
  } catch {
    roomStatus.textContent = t('pasteManual');
    roomCode.focus();
    return false;
  }
}

async function shareCurrentCode() {
  const text = roomCode.value.trim();
  if (!text) { roomStatus.textContent = t('codeEmpty'); return; }
  if (navigator.share) {
    try {
      await navigator.share({ title: t('gameTitle'), text });
      roomStatus.textContent = t('codeShared');
      return;
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
  }
  await copyCurrentCode();
}

document.querySelector('#create-room').onclick = async () => {
  await audio.unlock();
  connectionActive = false;
  retryRoomButton.classList.add('is-hidden');
  roomMode = 'host';
  roomCode.value = '';
  roomAction.classList.add('is-hidden');
  try {
    roomCode.value = await room.createRoom();
    lastGeneratedCode = roomCode.value;
    roomAction.textContent = t('pasteAnswer');
    roomAction.disabled = false;
    roomAction.classList.remove('is-hidden');
  } catch (error) {
    roomStatus.textContent = localizeError(error);
    retryRoomButton.classList.remove('is-hidden');
  }
};

document.querySelector('#join-room').onclick = async () => {
  await audio.unlock();
  connectionActive = false;
  retryRoomButton.classList.add('is-hidden');
  roomMode = 'guest';
  lastGeneratedCode = '';
  roomCode.value = '';
  roomCode.placeholder = t('pasteOffer');
  roomStatus.textContent = t('guestPastePrompt');
  roomAction.textContent = t('generateAnswer');
  roomAction.disabled = false;
  roomAction.classList.remove('is-hidden');
  roomCode.focus();
};

roomAction.onclick = async () => {
  await audio.unlock();
  const code = roomCode.value.trim();
  if (roomMode === 'host' && (!code || code === lastGeneratedCode)) {
    roomStatus.textContent = t('needGuestAnswer');
    roomCode.focus();
    return;
  }
  if (roomMode === 'guest' && !code) {
    roomStatus.textContent = t('needHostOffer');
    roomCode.focus();
    return;
  }
  try {
    if (roomMode === 'host') {
      await room.acceptGuest(code);
      roomAction.textContent = t('waiting');
      roomAction.disabled = true;
    } else {
      roomCode.value = await room.joinRoom(code);
      lastGeneratedCode = roomCode.value;
      roomAction.classList.add('is-hidden');
    }
  } catch (error) {
    roomStatus.textContent = localizeError(error);
    roomAction.disabled = false;
    retryRoomButton.classList.remove('is-hidden');
  }
};

copyCodeButton.addEventListener('click', copyCurrentCode);
pasteCodeButton.addEventListener('click', pasteCurrentCode);
shareCodeButton.addEventListener('click', shareCurrentCode);
retryRoomButton.addEventListener('click', () => {
  room.reset();
  connectionActive = false;
  releaseWakeLock();
  resetPairingUi('pairingReset');
});

languageButton.addEventListener('click', () => {
  toggleLanguage();
});

audioButton.addEventListener('click', async () => {
  if (!audio.isUnlocked()) await audio.unlock();
  audio.toggle();
  audioButton.textContent = t(audio.isEnabled() ? 'audioOn' : 'audioOff');
});

onLanguageChange(refreshStaticText);
refreshStaticText();

const unlockAudio = () => { audio.unlock(); };
window.addEventListener('pointerdown', unlockAudio, { once: true, capture: true });
window.addEventListener('keydown', unlockAudio, { once: true, capture: true });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') requestWakeLock();
});

function reset() {
  game = createGame();
  choices = [];
  hideUpgrades(panel);
  hudClock = 0;
}

function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  controller.input.dash ||= controller.consumeDash();

  inputClock -= dt;
  if (roomMode === 'guest') {
    pendingGuestDash ||= controller.input.dash;
    if (inputClock <= 0) {
      room.sendInput({ ...controller.input, dash: pendingGuestDash });
      pendingGuestDash = false;
      inputClock = 1 / 30;
    }
  } else {
    step(game, controller.input, dt);
  }

  snapshotClock -= dt;
  if (roomMode === 'host' && snapshotClock <= 0) {
    room.sendSnapshot(game, Math.floor(now));
    snapshotClock = 1 / 15;
  }
  controller.input.dash = false;

  const levelingPlayer = currentPlayer();
  if (levelingPlayer.pendingLevel && !choices.length) {
    choices = getUpgradeChoices();
    showUpgrades(panel, choices, selectUpgrade);
  }

  hudClock -= dt;
  if (hudClock <= 0) {
    updateHud(hud, game, levelingPlayer);
    hudClock = 0.1;
  }

  audio.sync(game, levelingPlayer);
  render(ctx, game);
  requestAnimationFrame(loop);
}

dashButton.addEventListener('pointerdown', event => {
  event.preventDefault();
  controller.input.dash = true;
  audio.unlock();
});

canvas.addEventListener('pointerdown', () => {
  if (game.state === 'gameover' && roomMode !== 'guest') reset();
});

function handleResize() {
  resizeCanvas(canvas);
}
window.addEventListener('resize', handleResize, { passive: true });
globalThis.visualViewport?.addEventListener('resize', handleResize, { passive: true });
handleResize();
requestAnimationFrame(loop);
