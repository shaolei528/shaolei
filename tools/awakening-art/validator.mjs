import fs from 'node:fs';
import path from 'node:path';
import {decodePng,inspectRgbaRegion} from './png.mjs';

export const ID_RE=/^aw_v1_[a-z0-9]+(?:_[a-z0-9]+)*$/;
export const REQUIRED_BASE_IDS=[
  'aw_v1_terrain_cold_grass_a','aw_v1_terrain_cold_grass_b','aw_v1_terrain_cold_grass_detail',
  'aw_v1_terrain_dirt_shoulder_a','aw_v1_terrain_dirt_shoulder_b',
  'aw_v1_terrain_asphalt_a','aw_v1_terrain_asphalt_b','aw_v1_terrain_asphalt_cracked',
  'aw_v1_terrain_concrete_floor_a','aw_v1_terrain_concrete_floor_b'
];
const CATEGORIES=new Set(['terrain','decal','prop','fx']);
const TRANSPARENT_CATEGORIES=new Set(['decal','prop','fx']);
const COLLISION_KEYS=new Set(['collision','collider','hitbox','hitboxes','solid','walkable','blocked']);

function inferCategory(id=''){
  for(const c of CATEGORIES)if(id.startsWith(`aw_v1_${c}_`))return c;
  return null;
}
function isTransitionId(id=''){
  return /(?:transition|edge|corner|threshold|shore|blend)/.test(id);
}
function inside(root,target){
  const rel=path.relative(root,target);
  return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));
}
function getEntries(manifest){
  if(Array.isArray(manifest))return manifest;
  if(manifest&&Array.isArray(manifest.assets))return manifest.assets;
  return null;
}
function sourceInfo(entry){
  if(entry.atlas&&typeof entry.atlas==='object'){
    const a=entry.atlas;
    return{file:a.file||a.source,rect:a.sourceRect||a.source||((Number.isInteger(a.x))?{x:a.x,y:a.y,w:a.w??a.width,h:a.h??a.height}:null)};
  }
  if(typeof entry.atlas==='string')return{file:entry.atlas,rect:entry.sourceRect||entry.source||null};
  return{file:entry.file,rect:null};
}
function anchorXY(anchor){
  if(Array.isArray(anchor)&&anchor.length>=2)return{x:Number(anchor[0]),y:Number(anchor[1])};
  if(anchor&&typeof anchor==='object')return{x:Number(anchor.x??anchor.anchorX),y:Number(anchor.y??anchor.anchorY)};
  return null;
}
function pushForbiddenCollision(errors,obj,where){
  if(!obj||typeof obj!=='object')return;
  for(const key of Object.keys(obj))if(COLLISION_KEYS.has(key))errors.push(`${where}: manifest must not contain authoritative gameplay field "${key}"`);
}
function validRect(rect){
  return rect&&['x','y','w','h'].every(k=>Number.isInteger(rect[k]))&&rect.w>0&&rect.h>0&&rect.x>=0&&rect.y>=0;
}

export async function validatePack(packDir,{manifestPath='manifest.json',strictRequired=false}={}){
  const root=path.resolve(packDir);
  const errors=[],warnings=[];
  const manifestFile=path.resolve(root,manifestPath);
  if(!inside(root,manifestFile))return{ok:false,errors:['manifest path escapes pack root'],warnings,stats:{assets:0,files:0}};
  if(!fs.existsSync(manifestFile))return{ok:false,errors:[`missing manifest: ${path.relative(process.cwd(),manifestFile)||manifestFile}`],warnings,stats:{assets:0,files:0}};
  let manifest;
  try{manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));}catch(err){return{ok:false,errors:[`invalid manifest JSON: ${err.message}`],warnings,stats:{assets:0,files:0}};}
  return validateManifest(root,manifest,{strictRequired,errors,warnings});
}

export async function validateManifest(packDir,manifest,{strictRequired=false,errors=[],warnings=[]}={}){
  const root=path.resolve(packDir),entries=getEntries(manifest);
  if(!entries){errors.push('manifest must be an array or an object with an assets array');return{ok:false,errors,warnings,stats:{assets:0,files:0}};}
  pushForbiddenCollision(errors,manifest,'manifest root');
  const ids=new Map(),fileCache=new Map(),decodedCache=new Map(),seenFiles=new Set();
  async function loadDecoded(rel,where){
    if(typeof rel!=='string'||!rel){errors.push(`${where}: missing PNG file/atlas path`);return null;}
    if(path.extname(rel).toLowerCase()!=='.png')errors.push(`${where}: asset source must be a .png file`);
    const full=path.resolve(root,rel);
    if(!inside(root,full)){errors.push(`${where}: source path escapes pack root: ${rel}`);return null;}
    seenFiles.add(rel);
    if(!fs.existsSync(full)){errors.push(`${where}: missing file ${rel}`);return null;}
    if(fileCache.has(full))return fileCache.get(full);
    try{
      const decoded=await decodePng(fs.readFileSync(full));
      const record={full,rel,decoded};
      fileCache.set(full,record);decodedCache.set(rel,decoded);return record;
    }catch(err){errors.push(`${where}: invalid/unsupported PNG ${rel}: ${err.message}`);return null;}
  }

  for(let i=0;i<entries.length;i++){
    const e=entries[i],where=`asset[${i}]${e?.id?` ${e.id}`:''}`;
    if(!e||typeof e!=='object'||Array.isArray(e)){errors.push(`${where}: entry must be an object`);continue;}
    pushForbiddenCollision(errors,e,where);
    const id=e.id;
    if(typeof id!=='string'||!ID_RE.test(id))errors.push(`${where}: id must match aw_v1_* lowercase snake_case`);
    if(typeof id==='string'){
      if(ids.has(id))errors.push(`${where}: duplicate id also used at asset[${ids.get(id)}]`);
      else ids.set(id,i);
    }
    const inferred=inferCategory(id),category=e.category??inferred;
    if(!CATEGORIES.has(category))errors.push(`${where}: category must be terrain, decal, prop, or fx`);
    else if(inferred&&e.category&&e.category!==inferred)errors.push(`${where}: category "${e.category}" conflicts with id prefix "${inferred}"`);

    if(e.frameCount!==undefined&&(!Number.isInteger(e.frameCount)||e.frameCount<1))errors.push(`${where}: frameCount must be an integer >= 1`);
    if((e.frameCount??1)>1){
      if(e.frameDuration!==undefined&&(!(Number(e.frameDuration)>0)))errors.push(`${where}: frameDuration must be > 0`);
      if(e.fallbackFrame!==undefined&&e.fallbackFrame!==0)errors.push(`${where}: animated assets must preserve frame 0 as static fallback`);
    }
    if(e.fallback!==undefined&&typeof e.fallback!=='string')errors.push(`${where}: fallback must be an asset id string`);

    const src=sourceInfo(e);
    if(!src.file){errors.push(`${where}: declare file or atlas source`);continue;}
    if(!src.rect&&typeof e.file==='string'&&path.basename(e.file)!=='awakening-terrain-v1.png'){
      const stem=path.basename(e.file,'.png');
      if(!ID_RE.test(stem))errors.push(`${where}: direct asset filename must use aw_v1_* naming`);
    }
    const loaded=await loadDecoded(src.file,where);
    if(!loaded)continue;
    const d=loaded.decoded;
    let region={width:d.width,height:d.height,hasTransparentPixels:false,isOpaque:true};
    if(src.rect){
      const r={x:src.rect.x,y:src.rect.y,w:src.rect.w??src.rect.width,h:src.rect.h??src.rect.height};
      if(!validRect(r))errors.push(`${where}: sourceRect must contain non-negative integer x/y and positive integer w/h`);
      else if(r.x+r.w>d.width||r.y+r.h>d.height)errors.push(`${where}: sourceRect exceeds atlas bounds ${d.width}x${d.height}`);
      else region=inspectRgbaRegion(d,r);
      if(category==='terrain'&&validRect(r)){
        if([r.x,r.y,r.w,r.h].some(v=>v%64!==0))errors.push(`${where}: terrain atlas sourceRect x/y/w/h must align to 64px grid`);
      }
      if(e.width!==undefined&&e.width!==r.w)errors.push(`${where}: width ${e.width} does not match sourceRect width ${r.w}`);
      if(e.height!==undefined&&e.height!==r.h)errors.push(`${where}: height ${e.height} does not match sourceRect height ${r.h}`);
    }else{
      let transparentPixels=0;
      for(let p=3;p<d.rgba.length;p+=4)if(d.rgba[p]<255)transparentPixels++;
      region={width:d.width,height:d.height,hasTransparentPixels:transparentPixels>0,isOpaque:transparentPixels===0};
      if(e.width!==undefined&&e.width!==d.width)errors.push(`${where}: width ${e.width} does not match PNG width ${d.width}`);
      if(e.height!==undefined&&e.height!==d.height)errors.push(`${where}: height ${e.height} does not match PNG height ${d.height}`);
    }

    if(category==='terrain'){
      if(d.width%64!==0||d.height%64!==0)errors.push(`${where}: terrain PNG/atlas dimensions ${d.width}x${d.height} must be multiples of 64`);
      if(region.width%64!==0||region.height%64!==0)errors.push(`${where}: terrain source dimensions ${region.width}x${region.height} must be 64px multiples`);
      if(region.hasTransparentPixels&&!isTransitionId(id))warnings.push(`${where}: base terrain contains transparency; only transition overlays should normally be transparent`);
    }
    if(TRANSPARENT_CATEGORIES.has(category)&&!region.hasTransparentPixels)errors.push(`${where}: ${category} PNG must contain transparent pixels`);

    if(category==='prop'){
      const a=anchorXY(e.anchor);
      if(!a)errors.push(`${where}: prop requires bottom-center anchor {x:0.5,y:1}`);
      else if(Math.abs(a.x-0.5)>1e-9||Math.abs(a.y-1)>1e-9)errors.push(`${where}: prop anchor must be bottom-center {x:0.5,y:1}`);
    }
  }

  const assetIds=new Set(entries.map(e=>e&&e.id).filter(Boolean));
  for(let i=0;i<entries.length;i++){
    const e=entries[i];if(!e||typeof e!=='object')continue;
    if(e.fallback&&(!assetIds.has(e.fallback)))errors.push(`asset[${i}] ${e.id}: fallback target ${e.fallback} does not exist`);
    if(e.fallback===e.id)errors.push(`asset[${i}] ${e.id}: fallback cannot point to itself`);
  }
  const fallbacks=(manifest&&typeof manifest==='object'&&!Array.isArray(manifest)&&manifest.fallbacks&&typeof manifest.fallbacks==='object')?manifest.fallbacks:{};
  for(const [from,to] of Object.entries(fallbacks)){
    if(!ID_RE.test(from))errors.push(`fallback ${from}: source id must match aw_v1_*`);
    if(typeof to!=='string'||!assetIds.has(to))errors.push(`fallback ${from}: target ${String(to)} does not exist in assets`);
    if(from===to)errors.push(`fallback ${from}: cannot point to itself`);
  }
  const graph=new Map();
  for(const e of entries)if(e?.id&&e?.fallback)graph.set(e.id,e.fallback);
  for(const [from,to] of Object.entries(fallbacks))if(typeof to==='string')graph.set(from,to);
  for(const start of graph.keys()){
    const seen=new Set();let cur=start;
    while(graph.has(cur)){
      if(seen.has(cur)){errors.push(`fallback cycle detected from ${start}`);break;}
      seen.add(cur);cur=graph.get(cur);
    }
  }
  if(strictRequired){
    for(const id of REQUIRED_BASE_IDS)if(!assetIds.has(id))errors.push(`required base asset missing: ${id}`);
  }
  return{ok:errors.length===0,errors:[...new Set(errors)],warnings:[...new Set(warnings)],stats:{assets:entries.length,files:seenFiles.size}};
}

function parseArgs(argv){
  const out={packDir:'assets/awakening-v1',strictRequired:false,json:false};
  for(let i=0;i<argv.length;i++){
    const a=argv[i];
    if(a==='--strict-required')out.strictRequired=true;
    else if(a==='--json')out.json=true;
    else if(a==='--manifest')out.manifestPath=argv[++i];
    else if(!a.startsWith('-'))out.packDir=a;
    else throw new Error(`unknown argument ${a}`);
  }
  return out;
}
if(import.meta.url===new URL(process.argv[1], 'file:').href){
  let args;
  try{args=parseArgs(process.argv.slice(2));}catch(err){console.error(err.message);process.exit(2);}
  const result=await validatePack(args.packDir,args);
  if(args.json)console.log(JSON.stringify(result,null,2));
  else{
    console.log(`[awakening-art] ${result.ok?'PASS':'FAIL'} assets=${result.stats.assets} files=${result.stats.files}`);
    for(const w of result.warnings)console.warn(`WARN: ${w}`);
    for(const e of result.errors)console.error(`ERROR: ${e}`);
  }
  process.exitCode=result.ok?0:1;
}
