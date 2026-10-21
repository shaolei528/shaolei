import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const root = read('../index.html');
const oldPreview = read('../prototypes/successor-3-4/index.html');
const page = read('../prototypes/successor-3-4/live-candidate.html');
const loader = read('../prototypes/successor-3-4/live-candidate.js');
const preview = read('../prototypes/successor-3-4/preview.js');
const runtime = read('../survival-v21.html');

assert.match(root, /live-candidate\.html/, 'root must lead to the one playable entry');
assert.doesNotMatch(root, /assets\/|survival-v(?:3|7|8|9|1[0-7])\.html/i, 'root shell must not present old art or versions');
assert.match(oldPreview, /\.\.\/\.\.\/index\.html/, 'the former variant chooser must redirect to the one player entry');
assert.match(page, /title="深渊苏醒统一灰盒"/);
assert.match(loader, /survival-v21\.html\?awView=34/, 'the player entry must select the explicit 3/4 boot mode');
assert.doesNotMatch(loader, /fetch\(|srcdoc|entryHook|moduleHook|injectRenderer/, 'the player entry must not rewrite V21 source text');
assert.match(runtime, /const successor34=new URLSearchParams\(globalThis\.location\?\.search\|\|''\)\.get\('awView'\)==='34'/);
assert.match(runtime, /if\(successor34\)\{window\.AW_DEV_QA=false;window\.AW_SUCCESSOR_PREVIEW=false/);
assert.match(runtime, /successor34&&name==='modules\/main-loop\/smooth-motion-v18\.js'/);
assert.match(runtime, /if\(successor34\)\{window\.__AW_V21_CANONICAL_FRAME__=draw;draw=\(\)=>\{\};for\(const name of \['modules\/render\/graybox-scene-painter\.js','modules\/interaction\/resource-work\.js'/,
  'the explicit mode must load the canonical scene and interaction modules before its renderer');
assert.match(runtime, /fetch\('\.\/ui-shell\.html\?ui=/, 'the active simulation must load the renamed internal UI shell');
assert.match(runtime, /RELAY_URL/, 'the active simulation still owns the existing Relay connection');
assert.match(preview, /PreviewSocketBlocked/);
assert.match(preview, /__previewStorage/);

for (const retired of [
  '../survival-v3.html', '../survival-v7.html', '../survival-v8.html', '../survival-v17.html',
  '../survival-v17c.html', '../index-v7-direct-backup.html', '../world-v2.html', '../boot-v8.js', '../boot-v9.js',
  '../prototypes/camera-3-4-v1/index.html', '../prototypes/camera-3-4-v2/index.html',
  '../awakening-assets-preview.html', '../awakening-scene-preview.html'
]) {
  assert.equal(fs.existsSync(new URL(retired, import.meta.url)), false, `${retired} must not return as a player-facing legacy entry`);
}

const frameListeners = new Map();
const childDocumentListeners = new Map();
let focusCalls = 0;
const canvas = {};
const childDocument = {
  querySelector(selector) { return selector === 'canvas' ? canvas : null; },
  addEventListener(type, listener) { childDocumentListeners.set(type, listener); }
};
const frame = {
  hidden: false, src: '', contentDocument: childDocument,
  addEventListener(type, listener) { frameListeners.set(type, listener); },
  focus() { focusCalls++; }
};
const error = { hidden: true, textContent: '' };
const context = {
  document: { querySelector(selector) { return selector === '#game' ? frame : error; } },
  location: { href: 'https://game.example/prototypes/successor-3-4/live-candidate.html' },
  URL
};
vm.runInNewContext(loader, context);
assert.equal(frame.src, 'https://game.example/survival-v21.html?awView=34');
frameListeners.get('load')?.();
childDocumentListeners.get('pointerdown')?.({ target: canvas });
assert.equal(focusCalls, 1, 'clicking the game canvas must focus it for keyboard input');
assert.equal(error.hidden, true, 'compatible boot must not show the load error surface');

console.log('PASS single player entry, explicit 3/4 boot contract, retired old entry files, and preserved V21 Relay/save runtime');
