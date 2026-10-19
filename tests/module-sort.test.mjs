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
  'game-core.js':['modules/core/runtime-state.js','modules/ui/base-ui.js','modules/world/world-state.js','modules/network/session-zone.js','modules/network/inbound-events.js','modules/network/outbound-sync.js','modules/network/chat-sync.js'],
  'game-play.js':['modules/safe-camp/base-interactions.js','modules/combat/player-combat.js','modules/survival/lifecycle.js','modules/input/joystick.js','modules/survival/status.js','modules/main-loop/simulation-update.js','modules/combat/mob-combat.js','modules/survival/day-night.js'],
  'game-render.js':['modules/render/base-renderer.js','modules/main-loop/legacy-scheduler.js']
};
for(const [sourcePath,parts] of Object.entries(reconstructions)){
  const source=fs.readFileSync(new URL('../'+sourcePath,import.meta.url),'utf8');
  const rebuilt=parts.map(path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8')).join('\n');
  const normalized=value=>value.replace(/\r\n/g,'\n');
  assert.equal(normalized(rebuilt),normalized(source),`${sourcePath} must reconstruct from categorized parts without semantic drift`);
}

const boot=fs.readFileSync(new URL('../survival-v21.html',import.meta.url),'utf8');
const coreParts=reconstructions['game-core.js'];
const expected=[
  coreParts[0],'modules/core/save-extensions-v1.js',...coreParts.slice(1,3),'modules/world/world-spatial-v1.js','modules/world/water-bodies-v1.js',...coreParts.slice(3,5),'modules/loot/creature-rewards-v1.js',...coreParts.slice(5),...reconstructions['game-play.js'],...reconstructions['game-render.js'],
  'modules/safe-camp/game-v7-patch.js','modules/input/mobile-fixes.js','modules/network/network-v9.js','modules/survival/gameplay-v9.js','modules/safe-camp/content-v9.js','modules/network/player-activity-state-v1.js','terrain-v21.js','modules/render/render-v9.js','modules/core/optimize-v9.js','modules/ui/ux-cn-v11.js','modules/input/interaction-v12.js','modules/input/platform-inventory-v19.js','modules/network/network-relay-v16.js','modules/network/network-quality-v20.js','modules/render/awakening-art-assets-v1.js','modules/world/awakening-world-v1.js','modules/world/awakening-expedition-loop-v1.js','modules/main-loop/smooth-motion-v18.js','modules/ui/regression-v14.js','modules/combat/boss-combat-v1.js','modules/world/boss-progression-v1.js','modules/farming/farming-v1.js','modules/render/farm-plot-render-v1.js','modules/farming/livestock-v1.js','modules/render/livestock-render-v1.js','modules/fishing/fishing-v1.js','modules/render/fishing-render-v1.js','modules/cooking/cooking-v1.js','modules/survival/food-effects-v1.js','modules/ui/cooking-panel-v1.js','modules/pets/companions-v1.js','modules/render/companion-pet-render-v1.js','modules/ui/pet-companion-panel-v1.js','modules/social/npc-social-v1.js','modules/ui/npc-social-panel-v1.js','modules/home/home-building-v1.js'
];
let previous=-1;
for(const path of expected){const index=boot.indexOf(`'${path}'`);assert.ok(index>previous,`${path} must exist and preserve the active V21 load order`);previous=index;}
for(const oldPath of [...Object.values(unchangedPairs),'game-core.js','game-play.js','game-render.js'])assert.equal(boot.includes(`'${oldPath}'`),false,`V21 must not load legacy aggregate/root path ${oldPath}`);
for(const aggregatePath of ['modules/core/game-core.js','modules/combat/game-play.js','modules/render/game-render.js'])assert.equal(boot.includes(`'${aggregatePath}'`),false,`V21 must load split modules instead of aggregate ${aggregatePath}`);
assert.ok(boot.includes("const VER='21g'"),'Awakening runtime must use the current V21g cache/version contract');
assert.ok(boot.includes("'modules/world/water-bodies-v1.js'"),'World Water must load before gameplay modules use spatial collision');
assert.ok(boot.includes("data/world/water-bodies-v1.json"),'the static water-body definition must load as gameplay data');
assert.ok(boot.includes("fetch('./data/fishing/fish-v1.json?v='+VER"),'V21 must load the data-driven fish and camp pond definitions');
assert.ok(boot.includes("fetch('./data/cooking/recipes-v1.json?v='+VER"),'V21 must load the data-driven cooking recipes and meal effects');
assert.ok(boot.includes("fetch('./data/pets/companions-v1.json?v='+VER"),'V21 must load companion drops, incubation, and growth data');
assert.ok(boot.includes("fetch('./data/social/npc-relationships-v1.json?v='+VER"),'V21 must load data-driven resident gifts and recipe unlocks');
assert.ok(boot.includes("fetch('./data/building/structures-v1.json?v='+VER"),'V21 must load data-driven home structures');
const spatialIndex=boot.indexOf("'modules/world/world-spatial-v1.js'"),playerCombatIndex=boot.indexOf("'modules/combat/player-combat.js'"),mobCombatIndex=boot.indexOf("'modules/combat/mob-combat.js'");
assert.ok(spatialIndex>=0&&spatialIndex<playerCombatIndex&&spatialIndex<mobCombatIndex,'World Spatial must be available before canonical combat modules');
const inboundIndex=boot.indexOf("'modules/network/inbound-events.js'"),hurtGraceIndex=boot.indexOf("'modules/survival/hurt-grace-v1.js'");
assert.ok(inboundIndex>=0&&inboundIndex<hurtGraceIndex&&hurtGraceIndex<playerCombatIndex,'Survival hurt grace must wrap the inbound damage handler before combat starts');
const lootIndex=boot.indexOf("'modules/loot/creature-rewards-v1.js'");
assert.ok(inboundIndex<lootIndex&&lootIndex<playerCombatIndex,'Loot settlement must wrap inbound loot before Combat creates creature rewards');
const saveExtensionsIndex=boot.indexOf("'modules/core/save-extensions-v1.js'"),runtimeStateIndex=boot.indexOf("'modules/core/runtime-state.js'"),bossCombatIndex=boot.indexOf("'modules/combat/boss-combat-v1.js'"),bossProgressionIndex=boot.indexOf("'modules/world/boss-progression-v1.js'");
assert.ok(runtimeStateIndex<saveExtensionsIndex,'Save extensions load after the V21 storage key is defined');
assert.ok(mobCombatIndex<bossCombatIndex&&bossCombatIndex<bossProgressionIndex,'Boss combat behavior and world progression load after their base owners');
assert.ok(fs.readFileSync(new URL('../modules/world/world-state.js',import.meta.url),'utf8').includes('bossProgress:globalThis.ABYSSAL_BOSS_PROGRESSION_V1'),'The existing world snapshot carries additive boss progression');
const terrainIndex=boot.indexOf("'terrain-v21.js'"),artIndex=boot.indexOf("'modules/render/awakening-art-assets-v1.js'"),awakeningIndex=boot.indexOf("'modules/world/awakening-world-v1.js'"),expeditionIndex=boot.indexOf("'modules/world/awakening-expedition-loop-v1.js'"),motionIndex=boot.indexOf("'modules/main-loop/smooth-motion-v18.js'");
assert.ok(terrainIndex>=0&&terrainIndex<artIndex,'Art adapter must load after the existing terrain foundation');
assert.ok(artIndex<awakeningIndex,'Art adapter must be available before Awakening World installs presentation wrappers');
assert.ok(spatialIndex<awakeningIndex,'World Spatial must exist before MIRE MART geometry registration');
assert.ok(awakeningIndex<expeditionIndex,'Expedition progression must load after MIRE MART world data exists');
assert.ok(expeditionIndex<motionIndex,'Expedition objective must load before the final motion/UI tail');
assert.ok(awakeningIndex<motionIndex,'Awakening collision must install before Smooth Motion captures update()');

const runtime=fs.readFileSync(new URL('../modules/core/runtime-state.js',import.meta.url),'utf8');
assert.ok(runtime.includes("STORAGE_KEY='abyssal_wake_save_v5'"),'v5 save key must remain unchanged');
assert.ok(runtime.includes("OLD_STORAGE_KEY='abyssal_wake_save_v4'"),'v4 migration key must remain unchanged');
const relay=fs.readFileSync(new URL('../modules/network/network-relay-v16.js',import.meta.url),'utf8');
assert.ok(relay.includes("protocol:'abyssal-relay-v1'"),'relay protocol must remain unchanged');
assert.ok(relay.includes("if(window.AW_SUCCESSOR_PREVIEW===true)return '本地 1'"),'isolated successor preview must use its explicit local-player label');
assert.ok(relay.includes("if(!globalPresenceSynced)return '同步中'"),'Relay presence display must wait for a fresh snapshot after subscription or reconnect');
assert.ok(relay.includes('return \'在线 \'+globalPresenceIds.size'),'live presence display must use the actual synced count without a forced minimum');
const ux=fs.readFileSync(new URL('../modules/ui/ux-cn-v11.js',import.meta.url),'utf8');
assert.equal(ux.includes('Math.max(1,globalPresenceIds.size)'),false,'Chinese UI refresh must not overwrite the network-owned online state with a fabricated minimum');

console.log(JSON.stringify({ok:true,splitSources:3,splitParts:17,unchangedCopies:Object.keys(unchangedPairs).length,reconstruction:'byte-identical',loadOrder:'preserved+world-spatial+art-pipeline+awakening+expedition+boss+farm+livestock+fishing+cooking+food-effects+companions+social+panels',saveFormat:'v5+owner extensions',relayProtocol:'unchanged'}));
