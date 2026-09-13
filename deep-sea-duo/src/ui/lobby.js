import { t } from '../i18n.js';

const STATUS_KEYS = Object.freeze({
  idle: 'roomLan',
  connected: 'connected',
  'connected-direct': 'connected',
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
  'signal-error': 'signalUnavailable',
  'signal-unavailable': 'signalUnavailable',
  'signal-timeout': 'signalTimeout',
  'room-expired': 'roomExpired',
  room_not_found: 'roomNotFound',
  room_not_found_or_joined: 'roomUnavailable',
  '把房主连接码发给朋友': 'manualHostReady',
  '把加入者应答码发回房主': 'manualGuestReady',
  '正在等待直连': 'waitingDirect',
  waitingDirect: 'waitingDirect',
});

const ERROR_KEYS = Object.freeze({
  'ice-timeout': 'errorIceTimeout',
  'invalid-code': 'errorInvalidCode',
  'expected-answer': 'errorExpectedAnswer',
  'expected-offer': 'errorExpectedOffer',
  'host-not-ready': 'errorHostNotReady',
  'invalid-room-code': 'invalidRoomCode',
  'signal-unavailable': 'signalUnavailable',
  'signal-timeout': 'signalTimeout',
  room_not_found: 'roomNotFound',
  room_not_found_or_joined: 'roomUnavailable',
  'room-expired': 'roomExpired',
});

export function localizeRoomStatus(status) {
  return STATUS_KEYS[status] ? t(STATUS_KEYS[status]) : String(status ?? '');
}

export function localizeRoomError(error) {
  const base = t(ERROR_KEYS[error?.code] ?? 'connectionError');
  const diagnostic = [error?.stage, error?.code, error?.name]
    .filter(Boolean)
    .map(value => String(value).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 36))
    .filter((value, index, list) => value && list.indexOf(value) === index)
    .join(':');
  return diagnostic ? `${base} [${diagnostic}]` : base;
}

export function createLobbyUi(root = globalThis.document) {
  const elements = {
    roomPanel: root.querySelector('#room-panel'),
    roomStatus: root.querySelector('#room-status'),
    buildBadge: root.querySelector('#build-badge'),
    createRoomButton: root.querySelector('#create-room'),
    joinRoomButton: root.querySelector('#join-room'),
    lobbyActions: root.querySelector('#lobby-actions'),
    hostRoomView: root.querySelector('#host-room-view'),
    hostRoomCode: root.querySelector('#host-room-code'),
    joinRoomView: root.querySelector('#join-room-view'),
    quickRoomInput: root.querySelector('#quick-room-code'),
    quickJoinButton: root.querySelector('#quick-join'),
    retryRoomButton: root.querySelector('#retry-room'),
    manualCode: root.querySelector('#manual-code'),
    manualCreateButton: root.querySelector('#manual-create'),
    manualJoinButton: root.querySelector('#manual-join'),
    manualActionButton: root.querySelector('#manual-action'),
  };

  function setView(view = 'home') {
    elements.lobbyActions.classList.toggle('is-hidden', view !== 'home');
    elements.hostRoomView.classList.toggle('is-hidden', view !== 'host');
    elements.joinRoomView.classList.toggle('is-hidden', view !== 'join');
    elements.retryRoomButton.classList.toggle('is-hidden', view === 'home');
  }

  function showGame() {
    elements.roomPanel.classList.add('is-hidden');
    root.body?.classList.remove('in-lobby');
  }

  function showLobby() {
    elements.roomPanel.classList.remove('is-hidden');
    root.body?.classList.add('in-lobby');
  }

  function resetFields() {
    elements.manualCode.value = '';
    elements.quickRoomInput.value = '';
    elements.quickJoinButton.disabled = true;
    elements.hostRoomCode.textContent = '------';
    elements.manualActionButton.classList.add('is-hidden');
    elements.manualActionButton.disabled = false;
  }

  return {
    elements,
    setView,
    showGame,
    showLobby,
    resetFields,
    setBuildId(value) { elements.buildBadge.textContent = value; },
    setStatus(status) { elements.roomStatus.textContent = localizeRoomStatus(status); },
    setText(value) { elements.roomStatus.textContent = value; },
    setError(error) { elements.roomStatus.textContent = localizeRoomError(error); },
  };
}
