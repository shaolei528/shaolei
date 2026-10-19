import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const safeCamp = read('../modules/safe-camp/game-v7-patch.js');
const interaction = read('../modules/input/interaction-v12.js');
const stateStart = safeCamp.indexOf('window.ABYSSAL_CAMP_GUIDE_V1=');
const stateEnd = safeCamp.indexOf('\n  const WORKBENCH', stateStart);
const stateApi = safeCamp.slice(stateStart, stateEnd).trim();
const drawGuide = safeCamp.match(/function drawGuide\(\)\{.*?\}(?=const oldDrawCamp)/s)?.[0];
const openGuide = interaction.match(/function openGuideDialog\(\)\{[\s\S]*?\n  \}/)?.[0];
assert.ok(stateStart >= 0 && stateEnd > stateStart && drawGuide && openGuide, 'source-owned Guide state, renderer and dialog entry must exist');

const saved = new Map();
const markerText = [];
const sandbox = {
  GUIDE: { x: 2325, y: 2370 },
  guideTalked: false,
  localStorage: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, String(value)) },
  window: null,
  sx: x => x,
  sy: y => y,
  img: {},
  drawSprite() {},
  ctx: { strokeRect() {}, fillText(text) { markerText.push(String(text)); } },
  safeStop() {},
  hideOtherPanels() {},
  dialogOpen: false,
  makeDialog() { return { classList: { add() {} } }; },
  showDialogPage() {},
  updateQuest() {},
  updateUI() {},
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(stateApi, sandbox);
vm.runInContext(`${drawGuide};${openGuide};`, sandbox);

sandbox.drawGuide();
assert.ok(markerText.includes('!'), 'unseen Guide should show its first-talk marker');
assert.equal(saved.get('abyssal_guide_v7'), undefined, 'opening state has not been saved yet');
sandbox.openGuideDialog();
assert.equal(saved.get('abyssal_guide_v7'), '1', 'the actual V12 dialog entry persists the existing Guide key');
assert.equal(sandbox.guideTalked, true, 'V12 dialog entry updates the SafeCamp-owned in-memory state');
markerText.length = 0;
sandbox.drawGuide();
assert.ok(!markerText.includes('!'), 'the marker disappears immediately in the same session');
console.log('PASS Guide talk state and marker stay synchronized without changing the save key');
