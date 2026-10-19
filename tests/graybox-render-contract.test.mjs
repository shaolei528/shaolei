import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const loader = read('../prototypes/successor-3-4/live-candidate.js');
const renderer = read('../prototypes/successor-3-4/successor-renderer.js');
const painter = read('../modules/render/graybox-scene-painter.js');
const preview = read('../prototypes/successor-3-4/preview.js');
const builder = read('../cloudflare/build-site.mjs');

assert.match(loader, /AW_SUCCESSOR_GRAYBOX_CONTINUITY=true/);
assert.match(loader, /AW_SUCCESSOR_PIXEL_SURVIVOR=false[\s\S]*?AW_SUCCESSOR_LIVE_GROUND_ART=false/);
assert.doesNotMatch(loader, /art-candidates|stardew-pixel|townArtPass|AW_SUCCESSOR_TOWN_ART_PASS/);

const terrainDraw = renderer.slice(renderer.indexOf('function terrainDraw(){'), renderer.indexOf('\n  function drawCityEdgeContext', renderer.indexOf('function terrainDraw(){')));
assert.match(terrainDraw, /if\(grayboxContinuity\)[\s\S]*?drawContinuationGround[\s\S]*?drawGround[\s\S]*?return/,
  'the unified route must draw the shared mapped ground and return before legacy city/terrain branches');
assert.match(painter, /const seamlessGraybox = window\.AW_SUCCESSOR_GRAYBOX_CONTINUITY === true/,
  'the unified graybox scene must explicitly select its seamless ground contract');
assert.match(painter, /if \(!seamlessGraybox\) drawMaterial\(ctx, api, water/,
  'legacy coast water must not reappear at the edge of the unified entry scene');
assert.match(painter, /if \(!seamlessGraybox\) drawCoastJoin/,
  'coast foam must remain outside the selected seamless graybox route');
assert.match(renderer, /if\(grayboxContinuity\)\{if\(currentZone==='1:0'\)[\s\S]*?\}else\{drawCityEdgeContext/,
  'city scenery branches must stay outside the unified graybox route');
assert.doesNotMatch(painter, /new Image\(|drawImage\(/, 'the shared painter must not stretch a scene image into the game');
assert.match(preview, /modules\/render\/graybox-scene-painter\.js/);
assert.match(preview, /modules\/interaction\/resource-work\.js/);
assert.doesNotMatch(builder, /art-candidates|whole-game-art-candidate|stardew-pixel/,
  'the fixed player package must not bring old art studies back into the game');

console.log('PASS unified route selects one shared graybox painter and bypasses legacy city/art branches');
