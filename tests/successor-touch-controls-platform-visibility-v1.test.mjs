import assert from 'node:assert/strict';
import fs from 'node:fs';

const platform=fs.readFileSync(new URL('../modules/input/platform-inventory-v19.js',import.meta.url),'utf8');
const renderer=fs.readFileSync(new URL('../prototypes/successor-3-4/successor-renderer.js',import.meta.url),'utf8');

assert.match(platform,/html\.abyssal-desktop-v19 \.successor-pad\{display:none!important\}/,'desktop input mode must hide the successor touch pad');
assert.match(platform,/classList\.toggle\('abyssal-desktop-v19',API\.desktop\)/,'desktop pad visibility must follow the existing platform owner');
assert.match(platform,/classList\.toggle\('abyssal-touch-v19',!API\.desktop\)/,'touch mode must remain separately represented');
assert.match(renderer,/pad\.className='successor-pad'/,'the successor touch pad must retain its stable presentation hook');
assert.match(renderer,/html\.abyssal-desktop-v19 \.app\.successor-wide \.actions\{display:block!important/,'the desktop 3/4 game must expose its contextual interaction control');
assert.match(renderer,/\.actions \.dash,html\.abyssal-desktop-v19 \.app\.successor-wide \.actions \.attack\{display:none!important/,'desktop 3/4 keeps only the contextual action visible instead of stacking touch buttons');
assert.match(renderer,/\.actions \.use\{display:block!important;width:74px!important;height:44px!important/,'the visible interaction control must remain a usable button-sized target');
assert.match(renderer,/@media\(max-width:480px\)\{\.app\.successor-wide \.successor-pad\{display:block!important\}/,'narrow successor layouts must restore the touch pad even when hybrid-device detection selected desktop mode');
assert.match(renderer,/pad\.addEventListener\('pointerdown'/,'touch-mode pointer input must remain available');
assert.match(renderer,/pad\.addEventListener\('pointermove'/,'touch-mode pointer movement must remain available');

console.log('PASS successor touch pad follows the canonical desktop/touch mode without changing touch input');
