import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8'));
const packageDir = path.resolve(root, config.assets.directory);
const manifest = JSON.parse(fs.readFileSync(path.join(packageDir, '.abyssal-build-manifest.json'), 'utf8'));
const files = manifest.files;
const candidate = 'prototypes/successor-3-4/live-candidate.html';

for (const required of [
  'index.html', candidate, 'prototypes/successor-3-4/live-candidate.js',
  'prototypes/successor-3-4/successor-renderer.js', 'modules/render/graybox-scene-painter.js',
  'modules/interaction/resource-work.js', 'survival-v21.html', 'ui-shell.html',
  'data/crafting/recipes-v1.json', 'data/farming/crops-v1.json', 'data/farming/livestock-v1.json',
  'data/fishing/fish-v1.json', 'data/cooking/recipes-v1.json', 'data/pets/companions-v1.json',
  'data/social/npc-relationships-v1.json', 'data/building/structures-v1.json', 'data/world/water-bodies-v1.json',
  'modules/farming/farming-v1.js', 'modules/farming/livestock-v1.js', 'modules/fishing/fishing-v1.js',
  'modules/cooking/cooking-v1.js', 'modules/survival/food-effects-v1.js', 'modules/pets/companions-v1.js',
  'modules/social/npc-social-v1.js', 'modules/home/home-building-v1.js', 'modules/network/network-relay-v16.js'
]) assert.ok(files[required], `release package must include ${required}`);

const rootHtml = fs.readFileSync(path.join(packageDir, 'index.html'), 'utf8');
assert.match(rootHtml, /window\.location\.replace\('\.\/prototypes\/successor-3-4\/live-candidate\.html'\)/,
  'release root must redirect to the single 3/4 game entry');
assert.match(rootHtml, /<a href="\.\/prototypes\/successor-3-4\/live-candidate\.html">/,
  'the root must keep a fallback link');
assert.doesNotMatch(rootHtml, /V17|Mirewood Island|assets\//i, 'root redirect must not flash old version branding or artwork');
assert.doesNotMatch(Object.keys(files).join('\n'), /art-candidates|whole-game-art-candidate|survival-v(?:3|8|9|1[0-7])\.html/,
  'release must omit retired game pages and rejected art studies');

const loader = fs.readFileSync(path.join(packageDir, 'prototypes/successor-3-4/live-candidate.js'), 'utf8');
assert.match(loader, /AW_SUCCESSOR_GRAYBOX_CONTINUITY=true/);
assert.doesNotMatch(loader, /art-candidates|stardew-pixel|PreviewSocketBlocked|__previewStorage/);
const runtime = fs.readFileSync(path.join(packageDir, 'survival-v21.html'), 'utf8');
assert.match(runtime, /fetch\('\.\/ui-shell\.html\?ui=/, 'V21 must load its internal shell from the new functional path');
for (const modulePath of [
  'modules/farming/farming-v1.js', 'modules/farming/livestock-v1.js', 'modules/fishing/fishing-v1.js',
  'modules/cooking/cooking-v1.js', 'modules/survival/food-effects-v1.js', 'modules/pets/companions-v1.js',
  'modules/social/npc-social-v1.js', 'modules/home/home-building-v1.js'
]) assert.ok(runtime.includes(`'${modulePath}'`), `V21 runtime must load ${modulePath}`);

console.log(`PASS single graybox entry packaged (${Object.keys(files).length} files); retired pages and candidate art are absent`);
