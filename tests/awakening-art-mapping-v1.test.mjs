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
const preview=fs.readFileSync(new URL('../awakening-assets-preview.html',import.meta.url),'utf8');
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
assert.ok(preview.includes('imageSmoothingEnabled=false'),'preview must use nearest-neighbor canvas rendering');
assert.ok(preview.includes("for(let y=0;y<3;y++)for(let x=0;x<3;x++)"),'preview must render terrain as an actual 3x3 repeat for seam inspection');
assert.ok(preview.includes("className='checker'"),'preview must expose transparency checkerboard');
assert.ok(preview.includes("className='anchor-crosshair'"),'preview must visualize prop anchors with a crosshair');
assert.ok(preview.includes("params.get('manifest')"),'preview must support an optional manifest URL query parameter');
assert.ok(preview.includes("new URL(file,manifestRoot)"),'preview asset URLs must resolve relative to the selected manifest');

const sandbox={window:null,console,camera:{x:0,y:0},canvas:{width:360,height:600},ctx:{save(){},restore(){},drawImage(){},imageSmoothingEnabled:true},fetch:async()=>({ok:false,status:404}),Image:class{}};sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(art,sandbox,{filename:'awakening-art-assets-v1.js'});
const api=sandbox.ABYSSAL_AWAKENING_ART_V1;assert.ok(api);await api.load();
assert.equal(api.version,1);assert.equal(api.manifestUrl,'assets/awakening-v1/manifest.json');assert.equal(api.status(),'fallback','404 manifest must not fail game boot');assert.equal(api.drawTerrain('cold_grass',0,0,0),false,'formal draw must decline when pack is absent so programmer fallback can render');

assert.equal(previewManifest.previewOnly,true,'G intake must stay outside the production manifest');
assert.equal(previewManifest.assets.length,50,'the development catalog must include all 50 G PNGs');
assert.deepEqual(Object.keys(previewManifest.bindings).sort(),['decal','prop'],'preview bindings must use only currently supported presentation categories');
assert.equal(previewManifest.bindings.prop.sign[0],'aw_v1_prop_store_sign_mire_mart','MIRE MART sign binding must stay explicit');
for(const [section,bindings] of Object.entries(previewManifest.bindings))for(const key of Object.keys(bindings))assert.equal(['grime','entrance','bollard'].includes(key),false,`unsupported semantic must remain unbound: ${section}.${key}`);
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
  assert.ok(pixels.hasTransparentPixels,`${entry.file} must have real transparency`);
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
for(const id of ['aw_v1_terrain_cold_grass_a','aw_v1_decal_early_residue_01','aw_v1_prop_store_debris_01','aw_v1_fx_store_failing_light_01','aw_v1_fx_store_early_residue_01'])assert.ok(strictIntake.errors.some(error=>error.includes(id)),`strict production gate must report missing blocker ${id}`);
assert.equal(fs.existsSync(canonicalManifestPath),false,'no partial production manifest may be created');
let previewRequested='';let previewBadgeNode=null;
class PreviewImage{set src(value){this._src=value;this.naturalWidth=16;this.naturalHeight=16;this.onload?.();}}
const previewSandbox={window:null,console,URLSearchParams,camera:{x:0,y:0},canvas:{width:360,height:600},ctx:{save(){},restore(){},drawImage(){},imageSmoothingEnabled:true},location:{search:'?awArtPreview=1'},fetch:async(url)=>{previewRequested=url;return{ok:true,json:async()=>previewManifest};},Image:PreviewImage,document:{body:{appendChild(node){previewBadgeNode=node;}},createElement(){return{style:{},setAttribute(){},textContent:''};}}};
previewSandbox.window=previewSandbox;previewSandbox.window.location=previewSandbox.location;vm.createContext(previewSandbox);vm.runInContext(art,previewSandbox,{filename:'awakening-art-assets-preview-v1.js'});
const previewApi=previewSandbox.ABYSSAL_AWAKENING_ART_V1;await previewApi.load();
assert.equal(previewApi.previewMode,true);assert.equal(previewApi.manifestUrl,'assets/awakening-v1/manifest.preview.json');assert.equal(previewRequested,'assets/awakening-v1/manifest.preview.json');
assert.equal(previewApi.status(),'ready');assert.equal(previewApi.state.images.size,50,'all G reference PNGs must load in the explicit preview mode');
assert.match(previewBadgeNode?.textContent||'',/DEV ART PREVIEW — NOT PRODUCTION.*50\/50 files/,'the in-game preview must clearly identify its non-production status');

console.log(JSON.stringify({ok:true,mapping:'presentation-only',manifest404:'fallback',nearestNeighbor:true,sourceRect:true,Gpreview:'50/50 raw RGBA PNGs',previewBindings:'existing semantics only',preview:['seam','alpha','scale','prop-anchor','manifest-url'],loadOrder:'art->world->motion'}));
