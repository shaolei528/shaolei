import { createInput } from './game/input.js';
import { applyHostSnapshot, applyRemoteInput, createGame, chooseRemoteUpgrade, chooseUpgrade, getUpgradeChoices, step } from './game/simulation.js';
import { UPGRADES } from './game/constants.js';
import { render, resizeCanvas } from './game/renderer.js';
import { hideUpgrades, showUpgrades, updateHud } from './ui/hud.js';
import { createRoomController } from './network/room.js';

const canvas = document.querySelector('#game'); const ctx = canvas.getContext('2d'); const hud = document.querySelector('#hud'); const panel = document.querySelector('#upgrade-panel'); const dashButton = document.querySelector('#dash-button');
const controller = createInput(canvas); let game = createGame(); let last = performance.now(); let choices = [];
let snapshotClock = 0; let inputClock = 0; let pendingGuestDash = false;
const roomPanel = document.querySelector('#room-panel'); const roomCode = document.querySelector('#room-code'); const roomAction = document.querySelector('#room-action'); const roomStatus = document.querySelector('#room-status'); const room = createRoomController(status => { roomStatus.textContent = status === 'connected' ? '局域网直连成功' : status; if (status === 'connected') roomPanel.classList.add('is-hidden'); }, input => applyRemoteInput(game, input), snapshot => applyHostSnapshot(game, snapshot), id => chooseRemoteUpgrade(game, UPGRADES.find(upgrade => upgrade.id === id))); let roomMode = null;
document.querySelector('#create-room').onclick = async () => { roomMode = 'host'; roomCode.value = await room.createRoom(); roomAction.textContent = '粘贴朋友应答码后确认'; roomAction.classList.remove('is-hidden'); };
document.querySelector('#join-room').onclick = () => { roomMode = 'guest'; roomCode.value = ''; roomCode.placeholder = '粘贴房主连接码'; roomAction.textContent = '生成我的应答码'; roomAction.classList.remove('is-hidden'); };
roomAction.onclick = async () => { if (roomMode === 'host') { await room.acceptGuest(roomCode.value); roomAction.textContent = '等待朋友连接…'; roomAction.disabled = true; } else { roomCode.value = await room.joinRoom(roomCode.value); roomAction.classList.add('is-hidden'); } };
function reset() { game = createGame(); choices = []; hideUpgrades(panel); }
function loop(now) { const dt = Math.min((now - last) / 1000, 0.05); last = now; controller.input.dash ||= controller.consumeDash(); inputClock -= dt; if (roomMode === 'guest') { pendingGuestDash ||= controller.input.dash; if (inputClock <= 0) { room.sendInput({...controller.input, dash:pendingGuestDash}); pendingGuestDash = false; inputClock = 1 / 30; } } else step(game, controller.input, dt); snapshotClock -= dt; if (roomMode === 'host' && snapshotClock <= 0) { room.sendSnapshot(game, Math.floor(now)); snapshotClock = 1 / 15; } controller.input.dash = false;
  const levelingPlayer = roomMode === 'guest' ? game.remotePlayer : game.player;
  if (levelingPlayer.pendingLevel && !choices.length) { choices = getUpgradeChoices(); showUpgrades(panel, choices, id => { if (roomMode === 'guest') room.sendUpgrade(id); else chooseUpgrade(game, choices.find(choice => choice.id === id)); choices = []; hideUpgrades(panel); }); }
  updateHud(hud, game, roomMode === 'guest' ? game.remotePlayer : game.player); render(ctx, game); requestAnimationFrame(loop); }
dashButton.addEventListener('pointerdown', event => { event.preventDefault(); controller.input.dash = true; });
canvas.addEventListener('pointerdown', () => { if (game.state === 'gameover' && roomMode !== 'guest') reset(); });
window.addEventListener('resize', () => resizeCanvas(canvas)); resizeCanvas(canvas); requestAnimationFrame(loop);
