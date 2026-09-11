import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {decodePng,encodeRgbaPng,analyzePng} from '../tools/awakening-art/png.mjs';
import {validatePack} from '../tools/awakening-art/validator.mjs';
import {sliceSheet} from '../tools/awakening-art/slice-sheet.mjs';
import {packAtlas} from '../tools/awakening-art/pack-atlas.mjs';

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'awakening-art-'));
const pack=path.join(tmp,'assets','awakening-v1');
fs.mkdirSync(path.join(pack,'terrain'),{recursive:true});
fs.mkdirSync(path.join(pack,'decals'),{recursive:true});
fs.mkdirSync(path.join(pack,'props'),{recursive:true});

function rgba(w,h,{transparent=false,semi=false}={}){
  const b=Buffer.alloc(w*h*4);
  for(let i=0;i<b.length;i+=4){b[i]=40+(i/4)%37;b[i+1]=70;b[i+2]=90;b[i+3]=255}
  if(transparent)b[3]=0;
  if(semi&&b.length>=8)b[7]=128;
  return b;
}
async function writePng(file,w,h,opt){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,await encodeRgbaPng(w,h,rgba(w,h,opt)))}

await writePng(path.join(pack,'terrain','awakening-terrain-v1.png'),128,64,{});
await writePng(path.join(pack,'decals','aw_v1_decal_puddle_01.png'),32,24,{transparent:true,semi:true});
await writePng(path.join(pack,'props','aw_v1_prop_fence_01.png'),64,96,{transparent:true});
await writePng(path.join(pack,'props','aw_v1_prop_fence_placeholder.png'),64,96,{transparent:true});

const manifest={
  assets:[
    {id:'aw_v1_terrain_cold_grass_a',category:'terrain',atlas:'terrain/awakening-terrain-v1.png',sourceRect:{x:0,y:0,w:64,h:64},width:64,height:64,frameCount:1},
    {id:'aw_v1_terrain_cold_grass_b',category:'terrain',atlas:'terrain/awakening-terrain-v1.png',sourceRect:{x:64,y:0,w:64,h:64},width:64,height:64},
    {id:'aw_v1_decal_puddle_01',category:'decal',file:'decals/aw_v1_decal_puddle_01.png',width:32,height:24},
    {id:'aw_v1_prop_fence_placeholder',category:'prop',file:'props/aw_v1_prop_fence_placeholder.png',width:64,height:96,anchor:{x:.5,y:1}},
    {id:'aw_v1_prop_fence_01',category:'prop',file:'props/aw_v1_prop_fence_01.png',width:64,height:96,anchor:{x:.5,y:1},fallback:'aw_v1_prop_fence_placeholder'}
  ],
  fallbacks:{aw_v1_prop_road_barrier_requested:'aw_v1_prop_fence_placeholder'}
};
fs.writeFileSync(path.join(pack,'manifest.json'),JSON.stringify(manifest,null,2));

let result=await validatePack(pack);
assert.equal(result.ok,true,JSON.stringify(result,null,2));
assert.equal(result.stats.assets,5);
assert.equal(result.stats.files,4);

const sample=await analyzePng(fs.readFileSync(path.join(pack,'decals','aw_v1_decal_puddle_01.png')));
assert.equal(sample.width,32);assert.equal(sample.height,24);assert.equal(sample.hasTransparentPixels,true);assert.equal(sample.hasSemiTransparentPixels,true);
const decoded=await decodePng(fs.readFileSync(path.join(pack,'terrain','awakening-terrain-v1.png')));
assert.equal(decoded.rgba.length,128*64*4);

const bad=structuredClone(manifest);
bad.assets.push({...bad.assets[0]});
bad.assets.push({id:'bad-name',category:'decal',file:'decals/missing.png'});
bad.assets[2].anchor={x:0,y:0};
fs.writeFileSync(path.join(pack,'manifest.json'),JSON.stringify(bad));
result=await validatePack(pack);
assert.equal(result.ok,false);
assert.ok(result.errors.some(e=>e.includes('duplicate id')));
assert.ok(result.errors.some(e=>e.includes('id must match aw_v1_*')));
assert.ok(result.errors.some(e=>e.includes('missing file')));

const opaque=path.join(pack,'decals','aw_v1_decal_opaque.png');await writePng(opaque,32,32,{});
fs.writeFileSync(path.join(pack,'manifest.json'),JSON.stringify({assets:[{id:'aw_v1_decal_opaque',category:'decal',file:'decals/aw_v1_decal_opaque.png'}]}));
result=await validatePack(pack);assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('must contain transparent pixels')));

const illegalTerrain=path.join(pack,'terrain','aw_v1_terrain_bad.png');await writePng(illegalTerrain,65,64,{});
fs.writeFileSync(path.join(pack,'manifest.json'),JSON.stringify({assets:[{id:'aw_v1_terrain_bad',category:'terrain',file:'terrain/aw_v1_terrain_bad.png'}]}));
result=await validatePack(pack);assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('must be multiples of 64')));

fs.writeFileSync(path.join(pack,'manifest.json'),JSON.stringify({assets:[
  {id:'aw_v1_prop_a',category:'prop',file:'props/aw_v1_prop_fence_01.png',anchor:{x:.5,y:1},fallback:'aw_v1_prop_b'},
  {id:'aw_v1_prop_b',category:'prop',file:'props/aw_v1_prop_fence_placeholder.png',anchor:{x:.5,y:1},fallback:'aw_v1_prop_a'}
]}));
result=await validatePack(pack);assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('fallback cycle')));

const sheet=path.join(tmp,'sheet.png');await writePng(sheet,128,64,{transparent:true});
const spec=path.join(tmp,'slice.json');
fs.writeFileSync(spec,JSON.stringify({source:'sheet.png',outputDir:'sliced',slices:[
  {id:'aw_v1_decal_sheet_a',x:0,y:0,w:64,h:64,file:'decals/aw_v1_decal_sheet_a.png'},
  {id:'aw_v1_decal_sheet_b',x:64,y:0,w:64,h:64,file:'decals/aw_v1_decal_sheet_b.png'}
]}));
const sliced=await sliceSheet(spec);
assert.equal(sliced.written.length,2);
assert.ok(fs.existsSync(path.join(tmp,'sliced','decals','aw_v1_decal_sheet_a.png')));
assert.equal((await decodePng(fs.readFileSync(path.join(tmp,'sliced','decals','aw_v1_decal_sheet_b.png')))).width,64);

const atlasA=path.join(tmp,'aw_v1_decal_atlas_a.png'),atlasB=path.join(tmp,'aw_v1_decal_atlas_b.png');
await writePng(atlasA,20,12,{transparent:true});await writePng(atlasB,18,16,{transparent:true});
const packed=await packAtlas([{id:'aw_v1_decal_atlas_a',file:atlasA},{id:'aw_v1_decal_atlas_b',file:atlasB}],{maxWidth:64,align:4,padding:0});
assert.equal(packed.placements.length,2);assert.equal(packed.width%4,0);assert.equal(packed.height%4,0);
const packedPng=await encodeRgbaPng(packed.width,packed.height,packed.rgba);assert.equal((await decodePng(packedPng)).width,packed.width);

const preview=fs.readFileSync(new URL('../tools/awakening-art/preview.html',import.meta.url),'utf8');
assert.ok(preview.includes('image-rendering:pixelated'));
assert.ok(preview.includes('Terrain seam 3×3'));
assert.ok(preview.includes('Prop anchor / fallback'));
assert.equal(preview.includes('modules/world/awakening-world-v1.js'),false);

console.log(JSON.stringify({ok:true,validator:['manifest','png','64-grid','alpha','naming','duplicates','missing','fallbacks'],helpers:['slice','atlas'],preview:['nearest-neighbor','terrain-seam','transparency','prop-anchor'],runtime:'untouched'}));
