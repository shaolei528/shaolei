import fs from 'node:fs';
import assert from 'node:assert/strict';

const pairs={
  'modules/core/game-core.js':'game-core.js',
  'modules/combat/game-play.js':'game-play.js',
  'modules/render/game-render.js':'game-render.js',
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

for(const [modulePath,sourcePath] of Object.entries(pairs)){
  const moduleBytes=fs.readFileSync(new URL('../'+modulePath,import.meta.url));
  const sourceBytes=fs.readFileSync(new URL('../'+sourcePath,import.meta.url));
  assert.equal(Buffer.compare(moduleBytes,sourceBytes),0,`${modulePath} must remain byte-identical to ${sourcePath}`);
}

const boot=fs.readFileSync(new URL('../survival-v21.html',import.meta.url),'utf8');
const expected=[
  'modules/core/game-core.js',
  'modules/combat/game-play.js',
  'modules/render/game-render.js',
  'modules/safe-camp/game-v7-patch.js',
  'modules/input/mobile-fixes.js',
  'modules/network/network-v9.js',
  'modules/survival/gameplay-v9.js',
  'modules/safe-camp/content-v9.js',
  'terrain-v21.js',
  'modules/render/render-v9.js',
  'modules/core/optimize-v9.js',
  'modules/ui/ux-cn-v11.js',
  'modules/input/interaction-v12.js',
  'modules/input/platform-inventory-v19.js',
  'modules/network/network-relay-v16.js',
  'modules/network/network-quality-v20.js',
  'modules/main-loop/smooth-motion-v18.js',
  'modules/ui/regression-v14.js'
];
let previous=-1;
for(const path of expected){
  const index=boot.indexOf(`'${path}'`);
  assert.ok(index>previous,`${path} must exist and preserve the active V21 load order`);
  previous=index;
}
for(const oldPath of Object.values(pairs)){
  assert.equal(boot.includes(`'${oldPath}'`),false,`V21 must load categorized module path instead of root ${oldPath}`);
}
assert.ok(boot.includes("const VER='21a'"),'module sorting must not alter the V21 cache/version contract');

const core=fs.readFileSync(new URL('../modules/core/game-core.js',import.meta.url),'utf8');
assert.ok(core.includes("STORAGE_KEY='abyssal_wake_save_v5'"),'v5 save key must remain unchanged');
assert.ok(core.includes("OLD_STORAGE_KEY='abyssal_wake_save_v4'"),'v4 migration key must remain unchanged');
const relay=fs.readFileSync(new URL('../modules/network/network-relay-v16.js',import.meta.url),'utf8');
assert.ok(relay.includes("protocol:'abyssal-relay-v1'"),'relay protocol must remain unchanged');

console.log(JSON.stringify({ok:true,modules:Object.keys(pairs).length,byteIdentical:true,loadOrder:'preserved',saveFormat:'unchanged',relayProtocol:'unchanged'}));
