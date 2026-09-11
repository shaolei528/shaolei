import fs from 'node:fs';
import path from 'node:path';
import {decodePng,cropRgba,encodeRgbaPng} from './png.mjs';
import {ID_RE} from './validator.mjs';

export async function sliceSheet(specFile){
  const specPath=path.resolve(specFile),base=path.dirname(specPath);
  const spec=JSON.parse(fs.readFileSync(specPath,'utf8'));
  if(typeof spec.source!=='string')throw new Error('slice spec requires source');
  if(!Array.isArray(spec.slices)||!spec.slices.length)throw new Error('slice spec requires non-empty slices array');
  const source=path.resolve(base,spec.source),decoded=await decodePng(fs.readFileSync(source));
  const outputRoot=path.resolve(base,spec.outputDir||'.');
  const written=[];
  for(const [i,s] of spec.slices.entries()){
    if(!s||!ID_RE.test(s.id||''))throw new Error(`slice[${i}] id must match aw_v1_*`);
    const rect={x:s.x,y:s.y,w:s.w??s.width,h:s.h??s.height};
    const crop=cropRgba(decoded,rect);
    const rel=s.file||`${s.id}.png`,target=path.resolve(outputRoot,rel);
    const safe=path.relative(outputRoot,target);
    if(safe.startsWith('..'+path.sep)||safe==='..'||path.isAbsolute(safe))throw new Error(`slice[${i}] output escapes outputDir`);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.writeFileSync(target,await encodeRgbaPng(crop.width,crop.height,crop.rgba));
    written.push({id:s.id,file:path.relative(outputRoot,target).replaceAll(path.sep,'/'),...rect});
  }
  return{source:path.relative(base,source).replaceAll(path.sep,'/'),outputDir:path.relative(base,outputRoot).replaceAll(path.sep,'/')||'.',written};
}
if(import.meta.url===new URL(process.argv[1],'file:').href){
  const spec=process.argv[2];
  if(!spec){console.error('usage: node tools/awakening-art/slice-sheet.mjs <slice-spec.json>');process.exit(2);}
  try{console.log(JSON.stringify(await sliceSheet(spec),null,2));}
  catch(err){console.error(`[awakening-art] slice failed: ${err.message}`);process.exit(1);}
}
