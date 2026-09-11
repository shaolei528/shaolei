(()=>{
'use strict';

const ROOT='assets/awakening-v1/';
const MANIFEST_URL=ROOT+'manifest.json';
const DEFAULT_BINDINGS={
  terrain:{
    cold_grass:['aw_v1_terrain_cold_grass_a','aw_v1_terrain_cold_grass_b','aw_v1_terrain_cold_grass_detail'],
    dirt_shoulder:['aw_v1_terrain_dirt_shoulder_a','aw_v1_terrain_dirt_shoulder_b'],
    asphalt:['aw_v1_terrain_asphalt_a','aw_v1_terrain_asphalt_b','aw_v1_terrain_asphalt_cracked'],
    store_floor:['aw_v1_terrain_concrete_floor_a','aw_v1_terrain_concrete_floor_b']
  },
  decal:{
    puddle:['aw_v1_decal_puddle_01'],
    crack:['aw_v1_decal_asphalt_crack_01'],
    tire:['aw_v1_decal_tire_mark_01'],
    glass:['aw_v1_decal_broken_glass_01'],
    residue:['aw_v1_decal_early_residue_01']
  },
  prop:{
    fence:['aw_v1_prop_fence_01'],barrier:['aw_v1_prop_road_barrier_01'],wall:['aw_v1_prop_store_exterior_wall_01'],
    counter:['aw_v1_prop_store_counter_01'],shelf:['aw_v1_prop_store_shelf_01'],fridge:['aw_v1_prop_store_fridge_01'],debris:['aw_v1_prop_store_debris_01']
  },
  fx:{flicker:['aw_v1_fx_store_failing_light_01'],anomaly:['aw_v1_fx_store_early_residue_01']}
};

const state={status:'idle',reason:'',manifest:null,assets:new Map(),images:new Map(),bindings:DEFAULT_BINDINGS,loadPromise:null};
function hashString(value){let h=2166136261;for(const c of String(value||'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function mergeBindings(base,extra){const out={};for(const section of new Set([...Object.keys(base||{}),...Object.keys(extra||{})]))out[section]={...(base?.[section]||{}),...(extra?.[section]||{})};return out;}
function normalizeManifest(input){
  const assets=Array.isArray(input?.assets)?input.assets.map(a=>({...a})):[];
  for(const sheet of Array.isArray(input?.sheets)?input.sheets:[]){
    const cw=Number(sheet.cellWidth),ch=Number(sheet.cellHeight);
    for(const entry of Array.isArray(sheet.entries)?sheet.entries:[]){
      const direct=[entry.x,entry.y,entry.w,entry.h].every(Number.isFinite),cols=Number.isInteger(entry.cols)&&entry.cols>0?entry.cols:1,rows=Number.isInteger(entry.rows)&&entry.rows>0?entry.rows:1;
      const sourceRect=direct?{x:Number(entry.x),y:Number(entry.y),w:Number(entry.w),h:Number(entry.h)}:{x:Number(entry.col||0)*cw,y:Number(entry.row||0)*ch,w:cols*cw,h:rows*ch};
      assets.push({...entry,file:entry.file||sheet.file,sourceRect,width:entry.width||sourceRect.w,height:entry.height||sourceRect.h});
    }
  }
  return{...input,assets};
}
function imageFor(file){return state.images.get(file)||null;}
function entryAvailable(entry){return !!entry&&!!imageFor(entry.file);}
function candidateList(section,key){const value=state.bindings?.[section]?.[key];return Array.isArray(value)?value:(typeof value==='string'?[value]:[]);}
function pick(section,key,seed=0){
  const candidates=candidateList(section,key).filter(id=>entryAvailable(state.assets.get(id)));
  if(!candidates.length)return null;
  return state.assets.get(candidates[Math.abs(Number(seed)||0)%candidates.length]);
}
function drawEntry(context,entry,worldX,worldY,opts={}){
  const image=imageFor(entry?.file);if(!context||!image||!entry)return false;
  const src=entry.sourceRect||{x:0,y:0,w:image.naturalWidth||entry.width,h:image.naturalHeight||entry.height};
  const width=Number(opts.width||entry.width||src.w),height=Number(opts.height||entry.height||src.h);
  if(!(width>0&&height>0))return false;
  const anchor=opts.anchor||entry.anchor||{x:.5,y:1};
  const sxp=Math.round(worldX-camera.x+canvas.width/2-width*Number(anchor.x??.5));
  const syp=Math.round(worldY-camera.y+canvas.height/2-height*Number(anchor.y??1));
  context.save();context.imageSmoothingEnabled=false;
  context.drawImage(image,src.x,src.y,src.w,src.h,sxp,syp,width,height);
  context.restore();return true;
}
function hasBinding(section,key){return !!pick(section,key,0);}
function drawTerrain(material,wx,wy,seed=0){const entry=pick('terrain',material,seed);return drawEntry(ctx,entry,wx,wy,{width:64,height:64,anchor:{x:0,y:0}});}
function drawDecal(placement){const entry=pick('decal',placement?.kind,hashString(placement?.id));if(!entry)return false;const w=entry.width||entry.sourceRect?.w,h=entry.height||entry.sourceRect?.h;return drawEntry(ctx,entry,Number(placement.x)+Number(placement.w||w)/2,Number(placement.y)+Number(placement.h||h)/2,{width:w,height:h,anchor:entry.anchor||{x:.5,y:.5}});}
function drawProp(placement){const entry=pick('prop',placement?.kind,hashString(placement?.id));if(!entry)return false;return drawEntry(ctx,entry,Number(placement.x)+Number(placement.w)/2,Number(placement.y)+Number(placement.h),{anchor:entry.anchor||{x:.5,y:1}});}
function drawFx(placement,time=0){const entry=pick('fx',placement?.kind,hashString(placement?.id));if(!entry)return false;let source=entry.sourceRect;if(entry.frames>1&&source){const frame=Math.floor(Number(time||0)/Math.max(1,Number(entry.frameDurationMs)||120))%entry.frames;source={...source,x:source.x+source.w*frame};entry={...entry,sourceRect:source};}return drawEntry(ctx,entry,Number(placement.x)+Number(placement.w)/2,Number(placement.y)+Number(placement.h)/2,{anchor:entry.anchor||{x:.5,y:.5}});}

async function load(){
  if(state.loadPromise)return state.loadPromise;
  state.status='loading';state.reason='';
  state.loadPromise=(async()=>{
    if(typeof fetch!=='function'){state.status='fallback';state.reason='fetch-unavailable';return false;}
    let response;try{response=await fetch(MANIFEST_URL,{cache:'no-store'});}catch(error){state.status='fallback';state.reason='manifest-fetch-failed';return false;}
    if(!response?.ok){state.status='fallback';state.reason=`manifest-${response?.status||'missing'}`;return false;}
    let manifest;try{manifest=normalizeManifest(await response.json());}catch(error){state.status='fallback';state.reason='manifest-invalid-json';return false;}
    state.manifest=manifest;state.assets=new Map((manifest.assets||[]).filter(a=>a?.id&&a?.file).map(a=>[a.id,a]));state.bindings=mergeBindings(DEFAULT_BINDINGS,manifest.bindings||{});
    if(typeof Image==='undefined'){state.status='fallback';state.reason='image-unavailable';return false;}
    const files=[...new Set([...state.assets.values()].map(a=>a.file))];
    await Promise.all(files.map(file=>new Promise(resolve=>{const image=new Image();image.onload=()=>{state.images.set(file,image);resolve();};image.onerror=()=>resolve();image.src=ROOT+file;})));
    state.status=state.images.size?'ready':'fallback';state.reason=state.images.size?'':'png-load-failed';return state.status==='ready';
  })();
  return state.loadPromise;
}

const API={version:1,root:ROOT,manifestUrl:MANIFEST_URL,state,load,status:()=>state.status,reason:()=>state.reason,hasBinding,drawTerrain,drawDecal,drawProp,drawFx,pick,normalizeManifest,defaults:DEFAULT_BINDINGS};
window.ABYSSAL_AWAKENING_ART_V1=API;
load();
})();
