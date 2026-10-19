import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('modules/render/awakening-art-assets-v1.js', 'utf8');
const manifest = JSON.parse(fs.readFileSync('assets/awakening-v1/manifest.preview.json', 'utf8'));
const light = manifest.assets.find((asset) => asset.id === 'aw_v1_fx_store_failing_light_01');
assert.ok(light, 'preview manifest should declare the flickering light effect');
const drawCalls = [];
const context = { save() {}, restore() {}, drawImage(...args) { drawCalls.push(args); } };
const sandbox = {
  window: { location: { search: '?awArtPreview=1' } }, URLSearchParams,
  canvas: { width: 100, height: 100 }, camera: { x: 0, y: 0 }, ctx: context,
  fetch: undefined, Image: undefined,
};
vm.runInNewContext(source, sandbox, { filename: 'awakening-art-assets-v1.js' });

const api = sandbox.window.ABYSSAL_AWAKENING_ART_V1;
const image = { naturalWidth: 96, naturalHeight: 16 };
const [twoFrameLight] = api.normalizeManifest({
  sheets: [{ file: 'two-frame-light.png', cellWidth: 48, cellHeight: 16,
    entries: [{ id: light.id, category: 'fx', row: 0, cols: 1, width: 48, height: 16,
      frames: 2, frameDurationMs: 50, sourceRect: { x: 0, y: 0, w: 48, h: 16 }, anchor: { x: 0.5, y: 0.5 } }] }],
}).assets;
api.state.assets.set(light.id, twoFrameLight);
api.state.images.set(twoFrameLight.file, image);
const placement = { id: 'light-test', kind: 'flicker', x: 10, y: 20, w: 48, h: 16 };

assert.equal(api.drawFx(placement, 50), true, 'second animation frame should draw');
assert.equal(api.drawFx(placement, 100), true, 'animation should wrap to its first frame');
assert.equal(drawCalls.length, 2);
assert.deepEqual(drawCalls[0].slice(1, 5), [48, 0, 48, 16], 'second frame should advance by one source-frame width');
assert.deepEqual(drawCalls[1].slice(1, 5), [0, 0, 48, 16], 'frame selection should wrap without changing the source rect');
assert.equal(drawCalls[0][0], image);

const puddle = manifest.assets.find((asset) => asset.id === 'aw_v1_decal_puddle_01');
assert.ok(puddle, 'preview manifest should declare the puddle art');
api.state.assets.set(puddle.id, puddle);
api.state.bindings = { ...api.state.bindings, decal: { puddle: [puddle.id] } };
api.state.images.set(puddle.file, { naturalWidth: puddle.width, naturalHeight: puddle.height });
const puddlePlacement = { id: 'puddle-test', kind: 'puddle', x: 200, y: 300, w: 72, h: 26 };
assert.equal(api.drawDecal(puddlePlacement), true, 'puddle decal should draw with its world-water footprint');
const puddleDraw = drawCalls.at(-1);
assert.deepEqual(puddleDraw.slice(5), [250, 350, 72, 26], 'puddle art must use configured water bounds instead of the taller source image dimensions');

console.log('awakening art multi-frame FX regression passed');
