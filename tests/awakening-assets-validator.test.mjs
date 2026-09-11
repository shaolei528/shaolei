import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {validatePack,normalizeManifest,runtimeManifest,inspectPngBuffer} from '../tools/awakening-assets/lib.mjs';

function chunk(type,data=Buffer.alloc(0)){const head=Buffer.alloc(8);head.writeUInt32BE(data.length,0);head.write(type,4,4,'ascii');return Buffer.concat([head,data,Buffer.alloc(4)]);}
function png(width,height,colorType=6){const sig=Buffer.from([137,80,78,71,13,10,26,10]),ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=colorType;return Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',Buffer.from([0])),chunk('IEND')]);}
function write(root,file,buffer){const full=path.join(root,...file.split('/'));fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,buffer);}
function makePack(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'aw-assets-'));
  write(root,'terrain/awakening-terrain-v1.png',png(128,64,6));
  write(root,'decals/aw_v1_decal_puddle_01.png',png(32,32,6));
  write(root,'props/aw_v1_prop_fence_01.png',png(64,80,6));
  const manifest={version:1,bindings:{terrain:{cold_grass:['aw_v1_terrain_cold_grass_a']},decal:{puddle:['aw_v1_decal_puddle_01']},prop:{fence:['aw_v1_prop_fence_01']}},sheets:[{id:'terrain',file:'terrain/awakening-terrain-v1.png',cellWidth:64,cellHeight:64,entries:[{id:'aw_v1_terrain_cold_grass_a',category:'terrain',col:0,row:0}]}],assets:[{id:'aw_v1_decal_puddle_01',category:'decal',file:'decals/aw_v1_decal_puddle_01.png',width:32,height:32},{id:'aw_v1_prop_fence_01',category:'prop',file:'props/aw_v1_prop_fence_01.png',width:64,height:80,anchor:{x:.5,y:1}}]};
  fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest));return{root,manifest};
}

const header=inspectPngBuffer(png(64,64,6));assert.equal(header.width,64);assert.equal(header.height,64);assert.equal(header.hasAlpha,true);
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
  const{root}=makePack();write(root,'terrain/awakening-terrain-v1.png',png(96,64,6));const result=validatePack(root);assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('64px multiples')));
}
{
  const{root}=makePack();write(root,'decals/aw_v1_decal_puddle_01.png',png(32,32,2));const result=validatePack(root);assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('alpha channel')));
}
{
  const{root,manifest}=makePack();manifest.assets[0].id='Bad Name';manifest.bindings.decal.puddle=['Bad Name'];fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest));const result=validatePack(root);assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('invalid asset id')));
}
{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'aw-assets-empty-'));const result=validatePack(root);assert.equal(result.ok,false);assert.deepEqual(result.errors,['missing manifest.json']);
}
console.log(JSON.stringify({ok:true,validator:['manifest','png-exists','terrain-64-grid','alpha-channel','naming','duplicate-id','missing-file','source-sheet-normalize'],runtimeManifest:'pass'}));
