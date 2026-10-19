import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(relative)=>fs.readFileSync(path.join(root,relative),'utf8');
const safeCamp=read('modules/safe-camp/game-v7-patch.js');
const safeCampRoot=read('game-v7-patch.js');
const interaction=read('modules/input/interaction-v12.js');
const interactionRoot=read('interaction-v12.js');
const renderer=read('prototypes/successor-3-4/successor-renderer.js');
const boot=read('survival-v21.html');

assert.equal(safeCampRoot,safeCamp,'the legacy/root and V21 SafeCamp extension copies must stay aligned');
assert.equal(interactionRoot,interaction,'the root and V21 interaction copies must stay aligned');
assert.match(safeCamp,/const GUIDE=\{x:2325,y:2370\};[\s\S]*?window\.ABYSSAL_CAMP_GUIDE_V1=\{getSnapshot\(\)\{return\{id:'camp-guide',name:'营地向导',x:GUIDE\.x,y:GUIDE\.y/,
  'the existing SafeCamp guide coordinates must supply one read-only NPC snapshot');
assert.match(interaction,/window\.ABYSSAL_CAMP_GUIDE_V1\?\.getSnapshot\?\.\(\)/,
  'the interaction target must read the Guide from its canonical snapshot');
assert.doesNotMatch(interaction,/const GUIDE=\{x:2325,y:2370\}/,
  'interaction must not create a second Guide position');
assert.match(renderer,/if\s*\(currentZone==='1:1'\)\s*\{\s*const guide=window\.ABYSSAL_CAMP_GUIDE_V1\?\.getSnapshot\?\.\(\);\s*if\s*\(guide\)\s*list\.push\(\{id:`npc:\$\{guide\.id\}`,kind:'actor',x:guide\.x,y:guide\.y,ref:guide,isPlayer:false\}\);/,
  'the successor HOME scene must depth-sort the shared Guide snapshot');
assert.match(renderer,/for\(const plot of window\.ABYSSAL_FARMING_V1\?\.getSnapshot\?\.\(\)\|\|\[\]\)list\.push\(\{id:`farm:\$\{plot\.id\}`,kind:'farmPlot',x:plot\.x,y:plot\.y,ref:plot\}\)/,
  'the successor HOME scene must render canonical farm-plot snapshots');
assert.match(renderer,/for\(const animal of window\.ABYSSAL_LIVESTOCK_V1\?\.getSnapshot\?\.\(\)\|\|\[\]\)list\.push\(\{id:`animal:\$\{animal\.id\}`,kind:'livestock',x:animal\.x,y:animal\.y,ref:animal\}\)/,
  'the successor HOME scene must render canonical livestock snapshots');
assert.match(renderer,/window\.ABYSSAL_PETS_V1\?\.getRenderState\?\.\(me\)/,
  'the successor HOME scene must render the local companion state');
assert.match(boot,/modules\/safe-camp\/game-v7-patch\.js[\s\S]*?modules\/input\/interaction-v12\.js/,
  'V21 must initialize the Guide snapshot before interaction consumes it');

console.log(JSON.stringify({ok:true,guidePositionOwner:'SafeCamp',interaction:'shared-snapshot',successorScene:'visible-depth-sorted-actor',saveCombatRelay:'unchanged'}));
