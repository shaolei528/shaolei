import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('modules/world/awakening-world-v1.js');
function draw(previewMode){
  const rectangles=[],sprites=[];
  const sandbox={window:null,inventory:{shard:0},camera:{x:2432,y:1056},canvas:{width:1600,height:1600},currentZone:'1:0',
    ctx:{save(){},restore(){},fillRect(...args){rectangles.push(args);},fillText(){}},
    drawCamp(){},ABYSSAL_AWAKENING_ART_V1:{previewMode,drawProp(p){sprites.push(p.id);return true;}}};
  sandbox.window=sandbox;
  sandbox.sx=x=>x-sandbox.camera.x+800;sandbox.sy=y=>y-sandbox.camera.y+800;
  vm.createContext(sandbox);
  vm.runInContext(read('modules/world/world-spatial-v1.js'),sandbox);
  vm.runInContext(source,sandbox);
  sandbox.drawCamp(1600,1600);
  return {sandbox,rectangles,sprites,world:sandbox.ABYSSAL_AWAKENING_WORLD_V1};
}
const preview=draw(true),production=draw(false);
assert.deepEqual(preview.sprites,production.sprites,'preview must still draw all bound original prop images');
assert.equal(new Set(preview.sprites).size,preview.sprites.length,'each prop draws once');
assert.ok(preview.rectangles.length>0,'preview retains visible fallback obstacle footprints beneath small native PNGs');
assert.equal(production.rectangles.length,0,'production bound props must not gain preview underlays');
assert.deepEqual(JSON.parse(JSON.stringify(preview.world.layers.collision)),JSON.parse(JSON.stringify(production.world.layers.collision)),'preview cannot alter authoritative geometry');
assert.equal(preview.world.isBlockedPoint(2116,900),true);
assert.equal(preview.world.isBlockedPoint(2432,1080),false,'store entrance stays open');
assert.equal(preview.world.sign.kind,'sign');
assert.equal(preview.world.sign.x+preview.world.sign.w/2,preview.world.poi.x+preview.world.poi.w/2,'exposed sign placement must match actual renderer');
assert.equal(fs.existsSync(new URL('../awakening-scene-preview.html',import.meta.url)),false,'the former standalone art scene must not remain as a second game page');
console.log('PASS scene geometry: native prop overlay, visible obstacles, unchanged collision; standalone scene page retired');
