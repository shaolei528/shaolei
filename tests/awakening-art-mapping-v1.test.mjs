import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {analyzePng} from '../tools/awakening-assets/png.mjs';
import {validatePack} from '../tools/awakening-assets/lib.mjs';

const art=fs.readFileSync(new URL('../modules/render/awakening-art-assets-v1.js',import.meta.url),'utf8');
const world=fs.readFileSync(new URL('../modules/world/awakening-world-v1.js',import.meta.url),'utf8');
const boot=fs.readFileSync(new URL('../survival-v21.html',import.meta.url),'utf8');
const previewManifest=JSON.parse(fs.readFileSync(new URL('../assets/awakening-v1/manifest.preview.json',import.meta.url),'utf8'));

for(const forbidden of ['zoneCh','saveLocal','rewardKill','handleMobAttack','STORAGE_KEY','RELAY_URL'])assert.equal(art.includes(forbidden),false,`presentation mapping must not own gameplay/network: ${forbidden}`);
assert.ok(art.includes("?'manifest.preview.json':'manifest.json'"),'production manifest must remain the default outside explicit development preview mode');
assert.ok(art.includes("MANIFEST_URL=ROOT+(PREVIEW_MODE?'manifest.preview.json':'manifest.json')"),'only the explicit development query may select the isolated preview manifest');
assert.ok(art.includes('DEV ART PREVIEW — NOT PRODUCTION'),'development art must be visibly labelled in-game');
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
assert.equal(fs.existsSync(new URL('../awakening-assets-preview.html',import.meta.url)),false,'the former standalone art catalog must not remain a player-facing page');

const sandbox={window:null,console,camera:{x:0,y:0},canvas:{width:360,height:600},ctx:{save(){},restore(){},drawImage(){},imageSmoothingEnabled:true},fetch:async()=>({ok:false,status:404}),Image:class{}};sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(art,sandbox,{filename:'awakening-art-assets-v1.js'});
const api=sandbox.ABYSSAL_AWAKENING_ART_V1;assert.ok(api);await api.load();
assert.equal(api.version,1);assert.equal(api.manifestUrl,'assets/awakening-v1/manifest.json');assert.equal(api.status(),'fallback','404 manifest must not fail game boot');assert.equal(api.drawTerrain('cold_grass',0,0,0),false,'formal draw must decline when pack is absent so programmer fallback can render');

assert.equal(previewManifest.previewOnly,true,'G intake must stay outside the production manifest');
assert.equal(previewManifest.assets.length,57,'the development catalog must include 50 G PNGs plus seven blocker candidates');
assert.deepEqual(Object.keys(previewManifest.bindings).sort(),['decal','fx','prop','terrain'],'preview bindings must cover supported presentation categories');
assert.equal(previewManifest.bindings.prop.sign[0],'aw_v1_prop_store_sign_mire_mart','MIRE MART sign binding must stay explicit');
for(const [section,bindings] of Object.entries(previewManifest.bindings))for(const key of Object.keys(bindings))assert.equal(['grime','entrance','bollard'].includes(key),false,`unsupported semantic must remain unbound: ${section}.${key}`);
const blockerSpecs={
  aw_v1_terrain_cold_grass_a:{category:'terrain',width:64,height:64,opaque:true,semantic:'cold_grass'},
  aw_v1_terrain_cold_grass_b:{category:'terrain',width:64,height:64,opaque:true,semantic:'cold_grass'},
  aw_v1_terrain_cold_grass_detail:{category:'terrain',width:64,height:64,opaque:true,semantic:'cold_grass'},
  aw_v1_decal_early_residue_01:{category:'decal',width:96,height:72,anchor:{x:.5,y:.5},semantic:'residue'},
  aw_v1_prop_store_debris_01:{category:'prop',width:80,height:64,anchor:{x:.5,y:1},semantic:'debris'},
  aw_v1_fx_store_failing_light_01:{category:'fx',width:96,height:16,anchor:{x:.5,y:.5},semantic:'flicker'},
  aw_v1_fx_store_early_residue_01:{category:'fx',width:96,height:72,anchor:{x:.5,y:.5},semantic:'anomaly'}
};
for(const [id,spec] of Object.entries(blockerSpecs)){
  const entry=previewManifest.assets.find(asset=>asset.id===id);
  assert.ok(entry,`preview manifest must include ${id}`);
  for(const key of ['category','width','height'])assert.equal(entry[key],spec[key],`${id} ${key} must match the frozen blocker contract`);
  if(spec.anchor)assert.deepEqual(entry.anchor,spec.anchor,`${id} anchor must match the frozen blocker contract`);
  assert.ok(previewManifest.bindings[spec.category]?.[spec.semantic]?.includes(id),`${id} must be reachable through its development-preview semantic`);
}
for(const entry of previewManifest.assets){
  const bytes=fs.readFileSync(new URL(`../assets/awakening-v1/${entry.file}`,import.meta.url));
  assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a',`${entry.file} must be PNG`);
  assert.equal(bytes[24],8,`${entry.file} must be 8-bit`);
  assert.equal(bytes[25],6,`${entry.file} must be RGBA`);
  assert.equal(bytes.readUInt32BE(16),entry.width,`${entry.id} width must match raw PNG pixels`);
  assert.equal(bytes.readUInt32BE(20),entry.height,`${entry.id} height must match raw PNG pixels`);
  const pixels=analyzePng(bytes);
  assert.equal(pixels.bitDepth,8,`${entry.file} must be 8-bit`);
  assert.equal(pixels.colorType,6,`${entry.file} must decode as RGBA`);
  assert.equal(pixels.hasTransparentPixels,entry.category!=='terrain',`${entry.file} alpha must match its asset category`);
  assert.equal(pixels.hasSemiTransparentPixels,false,`${entry.file} must not carry fringe alpha`);
}
const intakeRoot=fileURLToPath(new URL('../assets/awakening-v1/',import.meta.url));
const canonicalManifestPath=path.resolve(intakeRoot,'manifest.json');
const intakeManifest={...previewManifest};delete intakeManifest.previewOnly;
const intakeReadFile=(file,encoding)=>path.resolve(file)===canonicalManifestPath?JSON.stringify(intakeManifest):fs.readFileSync(file,encoding);
const intakeExists=file=>path.resolve(file)===canonicalManifestPath?true:fs.existsSync(file);
const intakeValidation=validatePack(intakeRoot,{readFile:intakeReadFile,exists:intakeExists});
assert.equal(intakeValidation.ok,true,`the unbound G inventory must pass canonical mechanical validation: ${intakeValidation.errors.join('; ')}`);
const strictIntake=validatePack(intakeRoot,{readFile:intakeReadFile,exists:intakeExists,strictRequired:true});
assert.equal(strictIntake.ok,false,'G-only intake must not pass the full production gate');
assert.ok(strictIntake.errors.length>0,'the preview inventory must not pass as a full production pack while other required production art remains absent');
assert.equal(fs.existsSync(canonicalManifestPath),false,'no partial production manifest may be created');
let previewRequested='';let previewBadgeNode=null;
class PreviewImage{set src(value){this._src=value;this.naturalWidth=16;this.naturalHeight=16;this.onload?.();}}
const previewSandbox={window:null,console,URLSearchParams,camera:{x:0,y:0},canvas:{width:360,height:600},ctx:{save(){},restore(){},drawImage(){},imageSmoothingEnabled:true},location:{search:'?awArtPreview=1'},fetch:async(url)=>{previewRequested=url;return{ok:true,json:async()=>previewManifest};},Image:PreviewImage,document:{body:{appendChild(node){previewBadgeNode=node;}},createElement(){return{style:{},setAttribute(){},textContent:''};}}};
previewSandbox.window=previewSandbox;previewSandbox.window.location=previewSandbox.location;vm.createContext(previewSandbox);vm.runInContext(art,previewSandbox,{filename:'awakening-art-assets-preview-v1.js'});
const previewApi=previewSandbox.ABYSSAL_AWAKENING_ART_V1;await previewApi.load();
assert.equal(previewApi.previewMode,true);assert.equal(previewApi.manifestUrl,'assets/awakening-v1/manifest.preview.json');assert.equal(previewRequested,'assets/awakening-v1/manifest.preview.json');
assert.equal(previewApi.status(),'ready');assert.equal(previewApi.state.images.size,57,'all G assets and seven blocker candidates must load in explicit preview mode');
assert.match(previewBadgeNode?.textContent||'',/DEV ART PREVIEW — NOT PRODUCTION.*57\/57 files/,'the in-game preview must clearly identify its non-production status');

console.log(JSON.stringify({ok:true,mapping:'presentation-only',manifest404:'fallback',nearestNeighbor:true,sourceRect:true,previewAssets:'57/57 G plus seven blocker candidates',previewBindings:'existing semantics only',preview:['seam','alpha','scale','prop-anchor','manifest-url'],loadOrder:'art->world->motion'}));
