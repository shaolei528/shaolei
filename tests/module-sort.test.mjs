import fs from 'node:fs';
import assert from 'node:assert/strict';

const unchangedPairs={
  'modules/safe-camp/game-v7-patch.js':'game-v7-patch.js',
  'modules/input/mobile-fixes.js':'mobile-fixes.js',
  'modules/network/network-v9.js':'network-v9.js',
  'modules/survival/gameplay-v9.js':'gameplay-v9.js',
  'modules/safe-camp/content-v9.js':'content-v9.js',
  'modules/render/render-v9.js':'render-v9.js',
  'modules/core/optimize-v9.js':'optimize-v9.js',
  'modules/ui/ux-cn-v11.js':'ux-cn-v11.js',
  'modules/input/interaction-v12.js':'interaction-v12.js',
  'modules/input/platform-inventory-v19.js':'platform-inventory-v19.js',
  'modules/network/network-relay-v16.js':'network-relay-v16.js',
  'modules/network/network-quality-v20.js':'network-quality-v20.js',
  'modules/main-loop/smooth-motion-v18.js':'smooth-motion-v18.js',
  'modules/ui/regression-v14.js':'regression-v14.js'
};

for(const [modulePath,sourcePath] of Object.entries(unchangedPairs)){
  const moduleBytes=fs.readFileSync(new URL('../'+modulePath,import.meta.url));
  const sourceBytes=fs.readFileSync(new URL('../'+sourcePath,import.meta.url));
  assert.equal(Buffer.compare(moduleBytes,sourceBytes),0,`${modulePath} must remain byte-identical to ${sourcePath}`);
}

const reconstructions={
  'game-core.js':[
    'modules/core/runtime-state.js','modules/ui/base-ui.js','modules/world/world-state.js',
    'modules/network/session-zone.js','modules/network/inbound-events.js','modules/network/outbound-sync.js','modules/network/chat-sync.js'
  ],
  'game-play.js':[
    'modules/safe-camp/base-interactions.js','modules/combat/player-combat.js','modules/survival/lifecycle.js',
    'modules/input/joystick.js','modules/survival/status.js','modules/main-loop/simulation-update.js',
    'modules/combat/mob-combat.js','modules/survival/day-night.js'
  ],
  'game-render.js':['modules/render/base-renderer.js','modules/main-loop/legacy-scheduler.js']
};

for(const [sourcePath,parts] of Object.entries(reconstructions)){
  const source=fs.readFileSync(new URL('../'+sourcePath,import.meta.url),'utf8');
  const rebuilt=parts.map(path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8')).join('\n');
  assert.equal(rebuilt,source,`${sourcePath} must reconstruct byte-for-byte from categorized parts`);
}

const boot=fs.readFileSync(new URL('../survival-v21.html',import.meta.url),'utf8');
const expected=[
  ...reconstructions['game-core.js'],
  ...reconstructions['game-play.js'],
  ...reconstructions['game-render.js'],
  'modules/safe-camp/game-v7-patch.js','modules/input/mobile-fixes.js','modules/network/network-v9.js',
  'modules/survival/gameplay-v9.js','modules/safe-camp/content-v9.js','terrain-v21.js','modules/render/render-v9.js',
  'modules/core/optimize-v9.js','modules/ui/ux-cn-v11.js','modules/input/interaction-v12.js',
  'modules/input/platform-inventory-v19.js','modules/network/network-relay-v16.js','modules/network/network-quality-v20.js',
  'modules/main-loop/smooth-motion-v18.js','modules/ui/regression-v14.js'
];
let previous=-1;
for(const path of expected){
  const index=boot.indexOf(`'${path}'`);
  assert.ok(index>previous,`${path} must exist and preserve the active V21 load order`);
  previous=index;
}

for(const oldPath of [...Object.values(unchangedPairs),'game-core.js','game-play.js','game-render.js']){
  assert.equal(boot.includes(`'${oldPath}'`),false,`V21 must not load legacy aggregate/root path ${oldPath}`);
}
for(const aggregatePath of ['modules/core/game-core.js','modules/combat/game-play.js','modules/render/game-render.js']){
  assert.equal(boot.includes(`'${aggregatePath}'`),false,`V21 must load split modules instead of aggregate ${aggregatePath}`);
}
assert.ok(boot.includes("const VER='21a'"),'module sorting must not alter the V21 cache/version contract');

const runtime=fs.readFileSync(new URL('../modules/core/runtime-state.js',import.meta.url),'utf8');
assert.ok(runtime.includes("STORAGE_KEY='abyssal_wake_save_v5'"),'v5 save key must remain unchanged');
assert.ok(runtime.includes("OLD_STORAGE_KEY='abyssal_wake_save_v4'"),'v4 migration key must remain unchanged');
const relay=fs.readFileSync(new URL('../modules/network/network-relay-v16.js',import.meta.url),'utf8');
assert.ok(relay.includes("protocol:'abyssal-relay-v1'"),'relay protocol must remain unchanged');

console.log(JSON.stringify({ok:true,splitSources:3,splitParts:17,unchangedCopies:Object.keys(unchangedPairs).length,reconstruction:'byte-identical',loadOrder:'preserved',saveFormat:'unchanged',relayProtocol:'unchanged'}));
