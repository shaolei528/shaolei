import fs from 'node:fs';
import assert from 'node:assert/strict';

const loader = fs.readFileSync(new URL('../prototypes/successor-3-4/live-candidate.js', import.meta.url), 'utf8');
const builder = fs.readFileSync(new URL('../cloudflare/build-site.mjs', import.meta.url), 'utf8');
const manifest = JSON.parse(fs.readFileSync(new URL('../assets/awakening-v1/manifest.preview.json', import.meta.url), 'utf8'));
const sign = manifest.assets.find(asset => asset.id === 'aw_v1_prop_store_sign_mire_mart');

assert.equal(manifest.previewOnly, true, 'the old city-sign art must remain an unselected study');
assert.ok(sign, 'the archived study remains identifiable for historical asset audits');
assert.doesNotMatch(loader, /art-candidates|manifest\.preview\.json|townArtPass|AW_SUCCESSOR_TOWN_ART_PASS/,
  'the sole player route must not load city-sign or art-variant previews');
assert.doesNotMatch(builder, /manifest\.preview\.json|stardew-pixel|art-candidates/,
  'the public package must not include preview-only art data');
assert.equal(fs.existsSync(new URL('../assets/awakening-v1/manifest.json', import.meta.url)), false,
  'the project must not imply that preview art is production-ready');

console.log('PASS old city-sign art is excluded from the only player entry and public package');
