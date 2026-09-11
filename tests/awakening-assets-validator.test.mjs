import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {validatePack,normalizeManifest,runtimeManifest,inspectPngBuffer} from '../tools/awakening-assets/lib.mjs';
import {decodePng,encodeRgbaPng} from '../tools/awakening-assets/png.mjs';
import {sliceSheet} from '../tools/awakening-assets/slice-sheet.mjs';

function write(root,file,buffer){const full=path.join(root,...file.split('/'));fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,buffer);}
function rgba(width,height,alpha=255){
  const out=Buffer.alloc(width*height*4);
  for(let i=0;i<width*height;i++){
    const p=i*4;out[p]=(40+i)%255;out[p+1]=(80+i*3)%255;out[p+2]=(120+i*7)%255;out[p+3]=typeof alpha==='function'?alpha(i):alpha;
  }
  return out;
}
function png(width,height,alpha=255){return encodeRgbaPng(width,height,rgba(width,height,alpha));}
function makePack(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'aw-assets-'));
  write(root,'terrain/awakening-terrain-v1.png',png(128,64,255));
  write(root,'decals/aw_v1_decal_puddle_01.png',png(32,32,i=>i===0?0:255));
  write(root,'props/aw_v1_prop_fence_01.png',png(64,80,i=>i%17===0?0:255));
  const manifest={
    version:1,
    bindings:{terrain:{cold_grass:['aw_v1_terrain_cold_grass_a']},decal:{puddle:['aw_v1_decal_puddle_01']},prop:{fence:['aw_v1_prop_fence_01']}},
    sheets:[{id:'terrain',file:'terrain/awakening-terrain-v1.png',cellWidth:64,cellHeight:64,entries:[{id:'aw_v1_terrain_cold_grass_a',category:'terrain',col:0,row:0}]}],
    assets:[
      {id:'aw_v1_decal_puddle_01',category:'decal',file:'decals/aw_v1_decal_puddle_01.png',width:32,height:32},
      {id:'aw_v1_prop_fence_01',category:'prop',file:'props/aw_v1_prop_fence_01.png',width:64,height:80,anchor:{x:.5,y:1}}
    ]
  };
  fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest));return{root,manifest};
}

const header=inspectPngBuffer(png(64,64,255));assert.equal(header.width,64);assert.equal(header.height,64);assert.equal(header.hasAlpha,true);
{
  const{root,manifest}=makePack();const result=validatePack(root);assert.equal(result.ok,true,result.errors.join('\n'));assert.equal(result.assets.length,3);assert.deepEqual(result.files,['decals/aw_v1_decal_puddle_01.png','props/aw_v1_prop_fence_01.png','terrain/awakening-terrain-v1.png']);
  const normalized=normalizeManifest(manifest);const terrain=normalized.assets.find(a=>a.id==='aw_v1_terrain_cold_grass_a');assert.deepEqual(terrain.sourceRect,{x:0,y:0,w:64,h:64});
  const runtime=runtimeManifest(manifest);assert.equal(runtime.assets.length,3);assert.deepEqual(runtime.assets.find(a=>a.id==='aw_v1_terrain_cold_grass_a').sourceRect,{x:0,y:0,w:64,h:64});
}
{
  const{root,manifest}=makePack();manifest.assets.push({...manifest.assets[0]});fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest));const result=validatePack(root);assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('duplicate id')));
}
{
  const{root,manifest}=makePack();manifest.assets[0].file='decals/missing.png';fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest));const result=validatePack(root);assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('missing file')));
}
{
  const{root}=makePack();write(root,'terrain/awakening-terrain-v1.png',png(96,64,255));const result=validatePack(root);assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('64px multiples')));
}
{
  const{root}=makePack();write(root,'decals/aw_v1_decal_puddle_01.png',png(32,32,255));const result=validatePack(root);assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('must contain at least one transparent pixel')));
}
{
  const{root,manifest}=makePack();manifest.assets[1].anchor={x:.5,y:.9};fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest));const result=validatePack(root);assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('prop anchor must be bottom-center')));
}
{
  const{root,manifest}=makePack();delete manifest.assets[1].anchor;fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest));const result=validatePack(root);assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('prop anchor must be bottom-center')));
}
{
  const{root,manifest}=makePack();manifest.assets[0].collision={solid:true};fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest));const result=validatePack(root);assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('manifest.assets[0].collision')));
}
{
  const{root,manifest}=makePack();manifest.assets[0].id='Bad Name';manifest.bindings.decal.puddle=['Bad Name'];fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest));const result=validatePack(root);assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('invalid asset id')));
}
{
  const{root}=makePack();const normal=validatePack(root);assert.equal(normal.ok,true,normal.errors.join('\n'));const strict=validatePack(root,{strictRequired:true});assert.equal(strict.ok,false);assert.ok(strict.errors.some(e=>e.includes('required production asset missing: aw_v1_terrain_cold_grass_b')));
  const cli=spawnSync(process.execPath,['tools/awakening-assets/validate-pack.mjs',root,'--strict-required','--json'],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
  assert.equal(cli.status,1);const output=JSON.parse(cli.stdout);assert.equal(output.strictRequired,true);assert.equal(output.ok,false);
}
{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'aw-assets-region-'));
  const pixels=rgba(64,32,i=>i%64<32?0:255);write(root,'decals/aw_v1_decal_sheet.png',encodeRgbaPng(64,32,pixels));
  const manifest={version:1,bindings:{decal:{opaque:['aw_v1_decal_opaque_region']}},assets:[{id:'aw_v1_decal_opaque_region',category:'decal',file:'decals/aw_v1_decal_sheet.png',sourceRect:{x:32,y:0,w:32,h:32},width:32,height:32}]};
  fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest));const result=validatePack(root);assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('must contain at least one transparent pixel')));
}
{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'aw-assets-empty-'));const result=validatePack(root);assert.equal(result.ok,false);assert.deepEqual(result.errors,['missing manifest.json']);
}
{
  const work=fs.mkdtempSync(path.join(os.tmpdir(),'aw-slice-')),source=path.join(work,'sheet.png'),outDir=path.join(work,'out');
  const pixels=Buffer.from([
    255,0,0,255, 0,255,0,255, 0,0,255,0, 255,255,0,255,
    10,20,30,255, 40,50,60,255, 70,80,90,128, 100,110,120,255
  ]);
  fs.writeFileSync(source,encodeRgbaPng(4,2,pixels));
  const spec=path.join(work,'slice.json');
  fs.writeFileSync(spec,JSON.stringify({source:'sheet.png',outputDir:'out',slices:[{id:'aw_v1_decal_slice_test',x:2,y:0,w:2,h:2,file:'decals/aw_v1_decal_slice_test.png'}]}));
  const result=sliceSheet(spec);assert.equal(result.written.length,1);
  const sliced=decodePng(fs.readFileSync(path.join(outDir,'decals/aw_v1_decal_slice_test.png')));assert.equal(sliced.width,2);assert.equal(sliced.height,2);
  assert.deepEqual([...sliced.rgba],[
    0,0,255,0, 255,255,0,255,
    70,80,90,128, 100,110,120,255
  ]);
}

console.log(JSON.stringify({ok:true,validator:['manifest','png-exists','terrain-64-grid','pixel-transparency','naming','duplicate-id','missing-file','source-sheet-normalize','prop-anchor','gameplay-field-ban','strict-required'],physicalSlicing:'pixel-exact',runtimeManifest:'pass'}));
