import { BUILD_ID } from './build.js';
import { createGameSession } from './app/game-session.js';
import { createInput } from './game/input.js';
import { getUpgradeChoices } from './game/simulation.js';
import { UPGRADES } from './game/constants.js';
import { render, resizeCanvas } from './game/renderer.js';
import { hideUpgrades, showUpgrades, updateHud } from './ui/hud.js';
import { createLobbyUi } from './ui/lobby.js';
import { createRoomController } from './network/room.js';
import { normalizeRoomCode } from './network/signaling.js';
import { applyDocumentTranslations, onLanguageChange, t, toggleLanguage } from './i18n.js';
import { createAdaptiveAudio } from './audio/audio.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d', { alpha: false });
const hud = document.querySelector('#hud');
const panel = document.querySelector('#upgrade-panel');
const dashButton = document.querySelector('#dash-button');
const languageButton = document.querySelector('#language-button');
const audioButton = document.querySelector('#audio-button');
const lobby = createLobbyUi(document);
const {
  roomStatus,
  createRoomButton,
  joinRoomButton,
  hostRoomCode,
  quickRoomInput,
  quickJoinButton,
  retryRoomButton,
  manualCode,
  manualCreateButton,
  manualJoinButton,
  manualActionButton,
} = lobby.elements;

const controller = createInput(canvas);
const session = createGameSession();
const audio = createAdaptiveAudio();
let last = performance.now();
let choices = [];
let hudClock = 0;
let lastRoomStatus = 'idle';
let wakeLock = null;
let manualGeneratedCode = '';

lobby.setBuildId(BUILD_ID);

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

function resetPairingUi(messageKey = 'roomLan') {
  session.reset();
  clearMatchUi();
  manualGeneratedCode = '';
  lobby.resetFields();
  lobby.setView('home');
  lobby.showLobby();
  lobby.setText(t(messageKey));
}

const room = createRoomController(
  status => {
    const isConnectedStatus = status === 'connected' || status === 'connected-direct';

    if (!session.connected && ['closed', 'disconnected'].includes(status)) return;

    lastRoomStatus = status;
    lobby.setStatus(status);
    if (isConnectedStatus) {
      session.connect();
      lobby.showGame();
      requestWakeLock();
      return;
    }
    if (['disconnected', 'failed', 'closed', 'error', 'signal-error', 'signal-unavailable', 'signal-timeout', 'room-expired', 'room_not_found', 'room_not_found_or_joined'].includes(status)) {
      session.disconnect();
      clearMatchUi();
      releaseWakeLock();
      lobby.showLobby();
      retryRoomButton.classList.remove('is-hidden');
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
  lobby.setStatus(lastRoomStatus);
  if (choices.length) showUpgrades(panel, choices, selectUpgrade);
  hudClock = 0;
}

createRoomButton.addEventListener('click', async () => {
  await audio.unlock();
  room.reset();
  prepareSession('host');
  lobby.setView('host');
  hostRoomCode.textContent = '······';
  lobby.setText(t('creatingRoom'));
  try {
    const code = await room.createQuickRoom(nextCode => {
      hostRoomCode.textContent = nextCode;
    });
    hostRoomCode.textContent = code;
    if (!session.connected) lobby.setText(t('hostWaiting'));
  } catch (error) {
    console.error('Deep Sea Duo create room failed', error);
    lobby.setError(error);
    retryRoomButton.classList.remove('is-hidden');
  }
});

joinRoomButton.addEventListener('click', async () => {
  await audio.unlock();
  room.reset();
  prepareSession('guest');
  lobby.setView('join');
  lobby.setText(t('enterRoomCode'));
  setTimeout(() => quickRoomInput.focus(), 50);
});

quickRoomInput.addEventListener('input', () => {
  quickRoomInput.value = normalizeRoomCode(quickRoomInput.value);
  quickJoinButton.disabled = quickRoomInput.value.length !== 6;
});

async function joinQuickRoom() {
  const code = normalizeRoomCode(quickRoomInput.value);
  if (code.length !== 6) {
    lobby.setText(t('invalidRoomCode'));
    quickRoomInput.focus();
    return;
  }
  quickJoinButton.disabled = true;
  lobby.setText(t('joiningRoom'));
  try {
    await room.joinQuickRoom(code);
  } catch (error) {
    console.error('Deep Sea Duo join room failed', error);
    lobby.setError(error);
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
  lobby.setText(t('manualCreating'));
  try {
    manualCode.value = await room.createRoom();
    manualGeneratedCode = manualCode.value;
    manualActionButton.textContent = t('manualAcceptAnswer');
    manualActionButton.classList.remove('is-hidden');
  } catch (error) {
    lobby.setError(error);
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
  lobby.setText(t('manualPasteOffer'));
  manualCode.focus();
});

manualActionButton.addEventListener('click', async () => {
  const code = manualCode.value.trim();
  try {
    if (session.role === 'host') {
      if (!code || code === manualGeneratedCode) {
        lobby.setText(t('needGuestAnswer'));
        return;
      }
      await room.acceptGuest(code);
      manualActionButton.disabled = true;
      lobby.setText(t('waitingDirect'));
    } else if (session.role === 'guest') {
      if (!code) {
        lobby.setText(t('needHostOffer'));
        return;
      }
      manualCode.value = await room.joinRoom(code);
      manualGeneratedCode = manualCode.value;
      manualActionButton.classList.add('is-hidden');
    }
  } catch (error) {
    lobby.setError(error);
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
lobby.showLobby();
refreshStaticText();
lobby.setView('home');

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

  session.tick(dt, controller.frame(), {
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
