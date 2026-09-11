#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ASSET_ID_RE} from './lib.mjs';
import {cropRgba,decodePng,encodeRgbaPng} from './png.mjs';

export function sliceSheet(specFile){
  const specPath=path.resolve(specFile),base=path.dirname(specPath);
  const spec=JSON.parse(fs.readFileSync(specPath,'utf8'));
  if(typeof spec.source!=='string'||!spec.source.toLowerCase().endsWith('.png'))throw new Error('slice spec requires PNG source');
  if(!Array.isArray(spec.slices)||!spec.slices.length)throw new Error('slice spec requires non-empty slices array');
  const source=path.resolve(base,spec.source),decoded=decodePng(fs.readFileSync(source));
  const outputRoot=path.resolve(base,spec.outputDir||'.'),written=[];
  for(const[index,slice]of spec.slices.entries()){
    if(!slice||!ASSET_ID_RE.test(slice.id||''))throw new Error(`slice[${index}] id must match canonical aw_v1_<category>_* naming`);
    const rect={x:slice.x,y:slice.y,w:slice.w??slice.width,h:slice.h??slice.height};
    const cropped=cropRgba(decoded,rect),relative=slice.file||`${slice.id}.png`,target=path.resolve(outputRoot,relative),safe=path.relative(outputRoot,target);
    if(!relative.toLowerCase().endsWith('.png'))throw new Error(`slice[${index}] output must be .png`);
    if(safe.startsWith(`..${path.sep}`)||safe==='..'||path.isAbsolute(safe))throw new Error(`slice[${index}] output escapes outputDir`);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.writeFileSync(target,encodeRgbaPng(cropped.width,cropped.height,cropped.rgba));
    written.push({id:slice.id,file:path.relative(outputRoot,target).split(path.sep).join('/'),...rect});
  }
  return{source:path.relative(base,source).split(path.sep).join('/'),outputDir:path.relative(base,outputRoot).split(path.sep).join('/')||'.',written};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const spec=process.argv[2];
  if(!spec){console.error('usage: node tools/awakening-assets/slice-sheet.mjs <slice-spec.json>');process.exit(2);}
  try{console.log(JSON.stringify(sliceSheet(spec),null,2));}
  catch(error){console.error(`[awakening-assets] slice failed: ${error.message}`);process.exit(1);}
}
