import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const layout = JSON.parse(read('../data/world/mire-mart-interior-preview-v1.json'));
const successorRenderer = read('../prototypes/successor-3-4/successor-renderer.js');
const elements = new Map();
function element() {
  return {
    style: {},
    attributes: {},
    addEventListener() {},
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; }
  };
}
const game = { appendChild(node) { elements.set(node.id, node); } };
const prompt = { style: {}, textContent: '' };
const document = {
  addEventListener() {},
  getElementById(id) { return id === 'game' ? game : id === 'interactionPromptV12' ? prompt : elements.get(id) || null; },
  createElement() { return element(); },
  head: { appendChild() {} }
};
const sandbox = {
  document,
  window: null,
  globalThis: null,
  Math,
  WeakSet,
  console,
  AW_SUCCESSOR_PREVIEW: true,
  AW_DEV_QA: true,
  AW_SUCCESSOR_GRAYBOX_BUILDING: true,
  AW_MIRE_MART_INTERIOR_LAYOUT_PREVIEW_V1: layout
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(read('../prototypes/successor-3-4/camera-adapter.js'), sandbox, { filename: 'camera-adapter.js' });
vm.runInContext(read('../modules/world/building-collision-preview-v1.js'), sandbox, { filename: 'building-collision-preview-v1.js' });
vm.runInContext(read('../modules/render/building-interior-renderer-preview-v1.js'), sandbox, { filename: 'building-interior-renderer-preview-v1.js' });
vm.runInContext(read('../modules/safe-camp/building-access-preview-v1.js'), sandbox, { filename: 'building-access-preview-v1.js' });

const access = sandbox.ABYSSAL_BUILDING_INTERIOR_PREVIEW_V1;
assert.ok(access, 'guarded MIRE MART access module should install');
const entrance = { x: 2392, y: 1072, w: 80, h: 16 };
const player = { x: entrance.x + entrance.w / 2, y: entrance.y + 18 };
const context = { player, entrance, setPosition(x, y) { player.x = x; player.y = y; } };
const move = (worldX, worldY, seconds) => {
  const projected = sandbox.ABYSSAL_CAMERA_ADAPTER_V1.screenDeltaFromResolvedWorldDelta(worldX, worldY);
  const length = Math.hypot(projected.x, projected.y) || 1;
  let remaining = seconds;
  while (remaining > 0 && access.isInside()) {
    const elapsed = Math.min(1 / 60, remaining);
    access.step({
      player,
      context,
      adapter: sandbox.ABYSSAL_CAMERA_ADAPTER_V1,
      screenX: projected.x / length,
      screenY: projected.y / length,
      elapsed
    });
    remaining -= elapsed;
  }
};

access.updatePrompt(context);
const actionButton = elements.get('aw-building-action-preview-v1');
assert.equal(actionButton?.textContent, '进门', 'the normal outside position should show the enter prompt');
assert.equal(access.handleInteract(context), true, 'interacting at the street threshold should enter the store');
assert.equal(access.isInside(), true);
access.updatePrompt(context);
assert.equal(actionButton.textContent, '出门', 'the interior doorway should offer a return action');

// Follow a clear lane between the shelves, then inspect the small counter clue.
move(0, -1, 4.05);
move(-1, 0, 2.5);
assert.equal(access.snapshot().blocked, false, 'the open route around the shelves should remain walkable');
assert.ok(Number.isFinite(player.dir), 'actual interior movement should update the shared player facing');
access.updatePrompt(context);
assert.equal(actionButton.textContent, '调查', 'the clue should become interactable from the clear lane');
assert.equal(access.handleInteract(context), true);
assert.equal(access.snapshot().searched, true);
assert.match(layout.clue.text, /02:13/, 'the inspected clue should be the authored environmental story');

const renderedText = [], renderedPlayers = [];
const ctx = new Proxy({
  measureText(text) { return { width: String(text).length * 6 }; },
  fillText(text) { renderedText.push(String(text)); }
}, { get(target, key) { return key in target ? target[key] : () => {}; } });
const playerFace = sandbox.ABYSSAL_CAMERA_ADAPTER_V1.project(Math.cos(player.dir), Math.sin(player.dir));
const playerRow = Math.abs(playerFace.y) > Math.abs(playerFace.x) ? (playerFace.y > 0 ? 0 : 3) : (playerFace.x < 0 ? 1 : 2);
access.drawInterior({
  ctx,
  width: 800,
  height: 600,
  project: sandbox.ABYSSAL_CAMERA_ADAPTER_V1.project,
  now: 600,
  row: playerRow,
  drawPlayer(_ctx, actor) { renderedPlayers.push(actor); }
});
assert.equal(renderedPlayers.length, 1, 'the interior should delegate its actor to the shared pixel player painter');
assert.equal(renderedPlayers[0].row, 1, 'the actor should retain the direction faced while walking around the shelves');
assert.ok(Number.isInteger(renderedPlayers[0].x) && Number.isInteger(renderedPlayers[0].y), 'the shared actor foot anchor should stay on integer pixels');
assert.ok(renderedText.some(text => text.includes('02:13')), 'the inspected clue should be rendered in the room');
assert.match(successorRenderer, /drawPlayer:cozyPixelArt\?\.drawPlayer\s*,\s*row:actorRow\(Number\(me\.dir\)\|\|0\)/, 'the guarded MIRE interior should use the same pixel actor and facing as the street scene');

// Walk back to the south doorway using normal movement and verify it returns to the street.
move(1, 0, 2.5);
move(0, 1, 4.8);
assert.equal(access.isInside(), false, 'walking through the open south doorway should return outside');
assert.equal(player.x, entrance.x + entrance.w / 2);
assert.equal(player.y, entrance.y + entrance.h + 28);

console.log(JSON.stringify({ ok: true, enterPrompt: true, clue: true, exit: true, collision: 'authored-layout' }));
