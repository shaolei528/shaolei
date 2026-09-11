import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const art=fs.readFileSync(new URL('../modules/render/awakening-art-assets-v1.js',import.meta.url),'utf8');
const world=fs.readFileSync(new URL('../modules/world/awakening-world-v1.js',import.meta.url),'utf8');
const boot=fs.readFileSync(new URL('../survival-v21.html',import.meta.url),'utf8');
const preview=fs.readFileSync(new URL('../awakening-assets-preview.html',import.meta.url),'utf8');

for(const forbidden of ['zoneCh','saveLocal','rewardKill','handleMobAttack','STORAGE_KEY','RELAY_URL'])assert.equal(art.includes(forbidden),false,`presentation mapping must not own gameplay/network: ${forbidden}`);
assert.ok(art.includes("MANIFEST_URL=ROOT+'manifest.json'"),'runtime mapping must target the production manifest');
assert.ok(art.includes("state.status='fallback'"),'missing pack must preserve programmer-art fallback');
assert.ok(art.includes('imageSmoothingEnabled=false'),'formal assets must render nearest-neighbor');
assert.ok(art.includes('sourceRect'),'atlas/source-sheet entries must render by source rectangle');
assert.ok(world.includes('window.ABYSSAL_AWAKENING_ART_V1'),'world presentation must consume the art adapter');
assert.ok(world.includes('artApi?.drawTerrain?.'),'terrain must prefer formal mapping and retain fallback');
assert.ok(world.includes('artApi?.drawDecal?.'),'decals must prefer formal mapping and retain fallback');
assert.ok(world.includes('artApi?.drawProp?.'),'props must prefer formal mapping and retain fallback');
assert.ok(world.includes('artApi?.drawFx?.'),'FX must prefer formal mapping and retain fallback');

const artIndex=boot.indexOf("'modules/render/awakening-art-assets-v1.js'");
const worldIndex=boot.indexOf("'modules/world/awakening-world-v1.js'");
const motionIndex=boot.indexOf("'modules/main-loop/smooth-motion-v18.js'");
assert.ok(artIndex>=0&&artIndex<worldIndex&&worldIndex<motionIndex,'asset adapter must load before Awakening World and preserve collision-before-motion ordering');
assert.ok(preview.includes('imageSmoothingEnabled=false'),'preview must use nearest-neighbor canvas rendering');
assert.ok(preview.includes('3×3 repeat'),'preview must expose terrain seam inspection');
assert.ok(preview.includes('checker'),'preview must expose transparency checkerboard');

const sandbox={window:null,console,camera:{x:0,y:0},canvas:{width:360,height:600},ctx:{save(){},restore(){},drawImage(){},imageSmoothingEnabled:true},fetch:async()=>({ok:false,status:404}),Image:class{}};sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(art,sandbox,{filename:'awakening-art-assets-v1.js'});
const api=sandbox.ABYSSAL_AWAKENING_ART_V1;assert.ok(api);await api.load();
assert.equal(api.version,1);assert.equal(api.manifestUrl,'assets/awakening-v1/manifest.json');assert.equal(api.status(),'fallback','404 manifest must not fail game boot');assert.equal(api.drawTerrain('cold_grass',0,0,0),false,'formal draw must decline when pack is absent so programmer fallback can render');

console.log(JSON.stringify({ok:true,mapping:'presentation-only',manifest404:'fallback',nearestNeighbor:true,sourceRect:true,preview:['seam','alpha','scale'],loadOrder:'art->world->motion'}));
