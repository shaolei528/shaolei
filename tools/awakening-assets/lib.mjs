import fs from 'node:fs';
import path from 'node:path';
import {decodePng,inspectRgbaRegion} from './png.mjs';

export const ASSET_ID_RE=/^aw_v1_(terrain|decal|prop|fx)_[a-z0-9]+(?:_[a-z0-9]+)*$/;
export const CATEGORIES=new Set(['terrain','decal','prop','fx']);
export const APPROVED_SEMANTIC_BINDINGS=Object.freeze({
  terrain:Object.freeze({
    cold_grass:Object.freeze(['aw_v1_terrain_cold_grass_a','aw_v1_terrain_cold_grass_b']),
    dirt_shoulder:Object.freeze(['aw_v1_terrain_dirt_shoulder_a','aw_v1_terrain_dirt_shoulder_b']),
    asphalt:Object.freeze(['aw_v1_terrain_asphalt_a','aw_v1_terrain_asphalt_b','aw_v1_terrain_asphalt_cracked']),
    store_floor:Object.freeze(['aw_v1_terrain_concrete_floor_a','aw_v1_terrain_concrete_floor_b'])
  }),
  decal:Object.freeze({
    puddle:Object.freeze(['aw_v1_decal_puddle_01']),
    crack:Object.freeze(['aw_v1_decal_asphalt_crack_01']),
    tire:Object.freeze(['aw_v1_decal_tire_mark_01']),
    glass:Object.freeze(['aw_v1_decal_broken_glass_01']),
    residue:Object.freeze(['aw_v1_decal_early_residue_01'])
  }),
  prop:Object.freeze({
    fence:Object.freeze(['aw_v1_prop_fence_01']),
    barrier:Object.freeze(['aw_v1_prop_road_barrier_01']),
    wall:Object.freeze(['aw_v1_prop_store_exterior_wall_01']),
    sign:Object.freeze(['aw_v1_prop_store_sign_mire_mart']),
    counter:Object.freeze(['aw_v1_prop_store_counter_01']),
    shelf:Object.freeze(['aw_v1_prop_store_shelf_01']),
    fridge:Object.freeze(['aw_v1_prop_store_fridge_01']),
    debris:Object.freeze(['aw_v1_prop_store_debris_01'])
  }),
  fx:Object.freeze({
    flicker:Object.freeze(['aw_v1_fx_store_failing_light_01']),
    anomaly:Object.freeze(['aw_v1_fx_store_early_residue_01'])
  })
});
export const REQUIRED_PRODUCTION_IDS=Object.freeze([
  'aw_v1_terrain_cold_grass_a',
  'aw_v1_terrain_cold_grass_b',
  'aw_v1_terrain_cold_grass_detail',
  'aw_v1_terrain_dirt_shoulder_a',
  'aw_v1_terrain_dirt_shoulder_b',
  'aw_v1_terrain_asphalt_a',
  'aw_v1_terrain_asphalt_b',
  'aw_v1_terrain_asphalt_cracked',
  'aw_v1_terrain_concrete_floor_a',
  'aw_v1_terrain_concrete_floor_b',
  'aw_v1_decal_puddle_01',
  'aw_v1_decal_asphalt_crack_01',
  'aw_v1_decal_tire_mark_01',
  'aw_v1_decal_broken_glass_01',
  'aw_v1_decal_early_residue_01',
  'aw_v1_prop_fence_01',
  'aw_v1_prop_road_barrier_01',
  'aw_v1_prop_store_exterior_wall_01',
  'aw_v1_prop_store_sign_mire_mart',
  'aw_v1_prop_store_counter_01',
  'aw_v1_prop_store_shelf_01',
  'aw_v1_prop_store_fridge_01',
  'aw_v1_prop_store_debris_01',
  'aw_v1_fx_store_failing_light_01',
  'aw_v1_fx_store_early_residue_01'
]);
const PNG_SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);
const MAX_DIMENSION=8192;
const ROOT_FIELDS=new Set(['version','pack','bindings','sheets','assets']);
const ASSET_FIELDS=new Set(['id','category','file','sourceRect','width','height','anchor','frames','frameDurationMs']);
const SHEET_FIELDS=new Set(['id','file','cellWidth','cellHeight','entries']);
const SHEET_ENTRY_FIELDS=new Set(['id','category','file','col','row','cols','rows','x','y','w','h','width','height','anchor','frames','frameDurationMs']);
const RECT_FIELDS=new Set(['x','y','w','h']);
const ANCHOR_FIELDS=new Set(['x','y']);

function positiveInt(value){return Number.isInteger(value)&&value>0;}
function plainObject(value){return Boolean(value)&&typeof value==='object'&&!Array.isArray(value);}
function safeRelativeFile(file){
  if(typeof file!=='string'||!file||file.includes('\\'))return false;
  const normalized=path.posix.normalize(file);
  return normalized===file&&!normalized.startsWith('../')&&!path.posix.isAbsolute(normalized)&&normalized.toLowerCase().endsWith('.png');
}
function rejectUnknownFields(value,allowed,currentPath,errors){
  if(!plainObject(value))return;
  for(const key of Object.keys(value))if(!allowed.has(key))errors.push(`presentation-only manifest field not allowed: ${currentPath}.${key}`);
}
function validatePresentationSchema(parsed,errors){
  if(!plainObject(parsed)){
    errors.push('manifest root must be an object');
    return;
  }
  rejectUnknownFields(parsed,ROOT_FIELDS,'manifest',errors);
  if(parsed.pack!=null&&typeof parsed.pack!=='string')errors.push('manifest.pack must be a string');
  if(parsed.assets!=null&&!Array.isArray(parsed.assets))errors.push('manifest.assets must be an array');
  if(parsed.sheets!=null&&!Array.isArray(parsed.sheets))errors.push('manifest.sheets must be an array');
  if(parsed.bindings!=null&&!plainObject(parsed.bindings))errors.push('manifest.bindings must be an object');

  for(const[category,semanticMap]of Object.entries(parsed.bindings||{})){
    if(!Object.prototype.hasOwnProperty.call(APPROVED_SEMANTIC_BINDINGS,category)){
      errors.push(`unsupported binding category: ${category}`);
      continue;
    }
    if(!plainObject(semanticMap)){
      errors.push(`manifest.bindings.${category} must be an object`);
      continue;
    }
    const approved=APPROVED_SEMANTIC_BINDINGS[category];
    for(const[semantic,ids]of Object.entries(semanticMap)){
      if(!Object.prototype.hasOwnProperty.call(approved,semantic))errors.push(`unsupported binding semantic: ${category}.${semantic}`);
      if(!Array.isArray(ids)||ids.length===0||ids.some(id=>typeof id!=='string'))errors.push(`manifest.bindings.${category}.${semantic} must be a non-empty array of asset ids`);
    }
  }

  for(const[index,asset]of (Array.isArray(parsed.assets)?parsed.assets:[]).entries()){
    const base=`manifest.assets[${index}]`;
    if(!plainObject(asset)){errors.push(`${base} must be an object`);continue;}
    rejectUnknownFields(asset,ASSET_FIELDS,base,errors);
    if(asset.sourceRect!=null){
      if(!plainObject(asset.sourceRect))errors.push(`${base}.sourceRect must be an object`);
      else rejectUnknownFields(asset.sourceRect,RECT_FIELDS,`${base}.sourceRect`,errors);
    }
    if(asset.anchor!=null){
      if(!plainObject(asset.anchor))errors.push(`${base}.anchor must be an object`);
      else rejectUnknownFields(asset.anchor,ANCHOR_FIELDS,`${base}.anchor`,errors);
    }
  }

  for(const[index,sheet]of (Array.isArray(parsed.sheets)?parsed.sheets:[]).entries()){
    const base=`manifest.sheets[${index}]`;
    if(!plainObject(sheet)){errors.push(`${base} must be an object`);continue;}
    rejectUnknownFields(sheet,SHEET_FIELDS,base,errors);
    if(sheet.entries!=null&&!Array.isArray(sheet.entries))errors.push(`${base}.entries must be an array`);
    for(const[entryIndex,entry]of (Array.isArray(sheet.entries)?sheet.entries:[]).entries()){
      const entryPath=`${base}.entries[${entryIndex}]`;
      if(!plainObject(entry)){errors.push(`${entryPath} must be an object`);continue;}
      rejectUnknownFields(entry,SHEET_ENTRY_FIELDS,entryPath,errors);
      if(entry.anchor!=null){
        if(!plainObject(entry.anchor))errors.push(`${entryPath}.anchor must be an object`);
        else rejectUnknownFields(entry.anchor,ANCHOR_FIELDS,`${entryPath}.anchor`,errors);
      }
    }
  }
}

export function inspectPngBuffer(buffer){
  if(!Buffer.isBuffer(buffer)||buffer.length<33||!buffer.subarray(0,8).equals(PNG_SIGNATURE))throw new Error('invalid PNG signature');
  let offset=8,ihdr=null,hasTrns=false,idat=0,ended=false;
  while(offset+12<=buffer.length){
    const length=buffer.readUInt32BE(offset),type=buffer.toString('ascii',offset+4,offset+8),dataStart=offset+8,dataEnd=dataStart+length;
    if(dataEnd+4>buffer.length)throw new Error(`truncated PNG chunk ${type}`);
    if(type==='IHDR'){
      if(length!==13||i²È="25É½ÝÌ¤ý•¹ÑÉä¹É½ÝÌèÄì(€€€€€½¹ÍÐÍ½ÕÉ•I•Ðõ¡…ÍI•Ð(€€€€€€€€ýíàé9Õµ‰•È¡•¹ÑÉä¹à¤±äé9Õµ‰•È¡•¹ÑÉä¹ä¤±Üé9Õµ‰•È¡•¹ÑÉä¹Ü¤± é9Õµ‰•È¡•¹ÑÉä¹ ¥ô(€€€€€€€€éíàé9Õµ‰•È¡•¹ÑÉä¹½±ñðÀ¤©•±±]¥‘Ñ ±äé9Õµ‰•È¡•¹ÑÉä¹É½ÝñðÀ¤©•±±!•¥¡Ð±Üé½±Ì©•±±]¥‘Ñ ± éÉ½ÝÌ©•±±!•¥¡Ñôì(€€€€€…ÍÍ•ÑÌ¹ÁÕÍ ¡ì¸¸¹•¹ÑÉä±™¥±”é•¹ÑÉä¹™¥±•ññÍ¡••Ð¹™¥±”±Í½ÕÉ•I•Ð±Ý¥‘Ñ é•¹ÑÉä¹Ý¥‘Ñ¡ññÍ½ÕÉ•I•Ð¹Ü±¡•¥¡Ðé•¹ÑÉä¹¡•¥¡ÑññÍ½ÕÉ•I•Ð¹ ±Í¡••ÐéÍ¡••Ð¹¥‘ññÍ¡••Ð¹™¥±•ô¤ì(€€€ô(€ô(€É•ÑÕÉ¹ì¸¸¹¥¹ÁÕÐ±…ÍÍ•ÑÍôì)ô()™Õ¹Ñ¥½¸½±±•Ñ	¥¹‘¥¹¹ÑÉ¥•Ì¡‰¥¹‘¥¹Ì¥ì(€½¹ÍÐ½ÕÐõmtì(€™½È¡½¹ÍÑm…Ñ•½Éä±Í•µ…¹Ñ¥5…Áu½˜=‰©•Ð¹•¹ÑÉ¥•Ì¡‰¥¹‘¥¹Íññíô¤¥ì(€€€¥˜ …Á±…¥¹=‰©•Ð¡Í•µ…¹Ñ¥5…À¤¥½¹Ñ¥¹Õ”ì(€€€™½È¡½¹ÍÑmÍ•µ…¹Ñ¥Œ±¥‘Íu½˜=‰©•Ð¹•¹ÑÉ¥•Ì¡Í•µ…¹Ñ¥5…À¤¥¥˜¡ÉÉ…ä¹¥ÍÉÉ…ä¡¥‘Ì¤¥™½È¡½¹ÍÐ¥½˜¥‘Ì¥½ÕÐ¹ÁÕÍ ¡í…Ñ•½Éä±Í•µ…¹Ñ¥Œ±¥‘ô¤ì(€ô(€É•ÑÕÉ¸½ÕÐì)ô)™Õ¹Ñ¥½¸Ù…±¥‘…Ñ•MÑÉ¥ÑI•ÅÕ¥É•¡µ…¹¥™•ÍÐ±Í••¸±•ÉÉ½ÉÌ¥ì(€™½È¡½¹ÍÐ¥½˜IEU%I}AI=UQ%=9}%L¥¥˜ …Í••¸¹¡…Ì¡¥¤¥•ÉÉ½ÉÌ¹ÁÕÍ ¡É•ÅÕ¥É•ÁÉ½‘ÕÑ¥½¸…ÍÍ•Ðµ¥ÍÍ¥¹œè€‘í¥‘õ€¤ì(€½¹ÍÐ‰¥¹‘¥¹Ìõµ…¹¥™•ÍÐ¹‰¥¹‘¥¹Íññíôì(€™½È¡½¹ÍÑm…Ñ•½Éä±Í•µ…¹Ñ¥Íu½˜=‰©•Ð¹•¹ÑÉ¥•Ì¡AAI=Y}M59Q%}	%9%9L¤¥ì(€€€™½È¡½¹ÍÑmÍ•µ…¹Ñ¥Œ±É•ÅÕ¥É•‘%‘Íu½˜=‰©•Ð¹•¹ÑÉ¥•Ì¡Í•µ…¹Ñ¥Ì¤¥ì(€€€€€½¹ÍÐ…ÑÕ…°õ‰¥¹‘¥¹Ìü¹m…Ñ•½Éåtü¹mÍ•µ…¹Ñ¥tì(€€€€€¥˜ …ÉÉ…ä¹¥ÍÉÉ…ä¡…ÑÕ…°¥ññ…ÑÕ…°¹±•¹Ñ ôôôÀ¥ì(€€€€€€€•ÉÉ½ÉÌ¹ÁÕÍ ¡É•ÅÕ¥É•ÁÉ½‘ÕÑ¥½¸‰¥¹‘¥¹œµ¥ÍÍ¥¹œè€‘í…Ñ•½Éåô¸‘íÍ•µ…¹Ñ¥õ€¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€™½È¡½¹ÍÐ¥½˜É•ÅÕ¥É•‘%‘Ì¥¥˜ ……ÑÕ…°¹¥¹±Õ‘•Ì¡¥¤¥•ÉÉ½ÉÌ¹ÁÕÍ ¡É•ÅÕ¥É•ÁÉ½‘ÕÑ¥½¸‰¥¹‘¥¹œ€‘í…Ñ•½Éåô¸‘íÍ•µ…¹Ñ¥ôµÕÍÐ¥¹±Õ‘”€‘í¥‘õ€¤ì(€€€ô(€ô)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸Ù…±¥‘…Ñ•A…¬¡É½½Ñ¥È±íÉ•…‘¥±”õ™Ì¹É•…‘¥±•Må¹Œ±•á¥ÍÑÌõ™Ì¹•á¥ÍÑÍMå¹Œ±ÍÑÉ¥ÑI•ÅÕ¥É•õ™…±Í•ôõíô¥ì(€½¹ÍÐ•ÉÉ½ÉÌõmt±Ý…É¹¥¹Ìõmt±Á¹…¡”õ¹•Ü5…À ¤±‘•½‘•‘…¡”õ¹•Ü5…À ¤ì(€½¹ÍÐµ…¹¥™•ÍÑA…Ñ õÁ…Ñ ¹©½¥¸¡É½½Ñ¥È°µ…¹¥™•ÍÐ¹©Í½¸œ¤ì(€¥˜ …•á¥ÍÑÌ¡µ…¹¥™•ÍÑA…Ñ ¤¥É•ÑÕÉ¹í½¬é™…±Í”±•ÉÉ½ÉÌélµ¥ÍÍ¥¹œµ…¹¥™•ÍÐ¹©Í½¸t±Ý…É¹¥¹Ì±…ÍÍ•ÑÌémt±™¥±•Ìémuôì(€±•ÐÁ…ÉÍ•ì(€ÑÉåíÁ…ÉÍ•õ)M=8¹Á…ÉÍ”¡É•…‘¥±”¡µ…¹¥™•ÍÑA…Ñ °ÕÑ˜àœ¤¤íõ…Ñ ¡•ÉÉ½È¥íÉ•ÑÕÉ¹í½¬é™…±Í”±•ÉÉ½ÉÌém¥¹Ù…±¥µ…¹¥™•ÍÐ¹©Í½¸è€‘í•ÉÉ½È¹µ•ÍÍ…•õt±Ý…É¹¥¹Ì±…ÍÍ•ÑÌémt±™¥±•Ìémuôíô(€Ù…±¥‘…Ñ•AÉ•Í•¹Ñ…Ñ¥½¹M¡•µ„¡Á…ÉÍ•±•ÉÉ½ÉÌ¤ì(€¥˜¡Á…ÉÍ•¹Ù•ÉÍ¥½¸„ôôÄ¥•ÉÉ½ÉÌ¹ÁÕÍ  µ…¹¥™•ÍÐ¹Ù•ÉÍ¥½¸µÕÍÐ‰”€Äœ¤ì(€½¹ÍÐµ…¹¥™•ÍÐõ¹½Éµ…±¥é•5…¹¥™•ÍÐ¡Á…ÉÍ•¤±…ÍÍ•ÑÌõµ…¹¥™•ÍÐ¹…ÍÍ•ÑÍññmt±Í••¸õ¹•ÜM•Ð ¤±…ÍÍ•Ñ	å%õ¹•Ü5…À ¤±™¥±•Ìõ¹•ÜM•Ð ¤ì(€¥˜ ……ÍÍ•ÑÌ¹±•¹Ñ ¥•ÉÉ½ÉÌ¹ÁÕÍ  µ…¹¥™•ÍÐµÕÍÐ‘•±…É”…Ð±•…ÍÐ½¹”…ÍÍ•Ð½ÈÍ¡••Ð•¹ÑÉäœ¤ì((€™½È¡½¹ÍÐ…ÍÍ•Ð½˜…ÍÍ•ÑÌ¥ì(€€€½¹ÍÐ¥õ…ÍÍ•Ðü¹¥±…Ñ•½Éäõ…ÍÍ•Ðü¹…Ñ•½Éä±™¥±”õ…ÍÍ•Ðü¹™¥±”ì(€€€¥˜ …MMQ}%}I¹Ñ•ÍÐ¡MÑÉ¥¹œ¡¥‘ñðœœ¤¤¥•ÉÉ½ÉÌ¹ÁÕÍ ¡¥¹Ù…±¥…ÍÍ•Ð¥è€‘í¥‘ñðœñµ¥ÍÍ¥¹œøõ€¤ì(€€€¥˜¡Í••¸¹¡…Ì¡¥¤¥•ÉÉ½ÉÌ¹ÁÕÍ ¡‘ÕÁ±¥…Ñ”¥è€‘í¥‘õ€¤í•±Í”¥˜¡¥¥íÍ••¸¹…‘¡¥¤í…ÍÍ•Ñ	å%¹Í•Ð¡¥±…ÍÍ•Ð¤íô(€€€¥˜ …Q=I%L¹¡…Ì¡…Ñ•½Éä¤¥•ÉÉ½ÉÌ¹ÁÕÍ ¡€‘í¥‘ñðœñµ¥ÍÍ¥¹œøôè¥¹Ù…±¥…Ñ•½Éä€‘í…Ñ•½Éåõ€¤ì(€€€•±Í”¥˜¡¥˜˜…MÑÉ¥¹œ¡¥¤¹ÍÑ…ÉÑÍ]¥Ñ ¡…Ý}ØÅ|‘í…Ñ•½Éåõ}€¤¥•ÉÉ½ÉÌ¹ÁÕÍ ¡€‘í¥‘ôè¥½…Ñ•½Éäµ¥Íµ…Ñ € ‘í…Ñ•½Éåô¥€¤ì(€€€¥˜ …Í…™•I•±…Ñ¥Ù•¥±”¡™¥±”¤¥í•ÉÉ½ÉÌ¹ÁÕÍ ¡€‘í¥‘ñðœñµ¥ÍÍ¥¹œøôè¥¹Ù…±¥A9™¥±”Á…Ñ €‘í™¥±•ñðœñµ¥ÍÍ¥¹œøõ€¤í½¹Ñ¥¹Õ”íô(€€€™¥±•Ì¹…‘¡™¥±”¤ì(€€€½¹ÍÐ™Õ±°õÁ…Ñ ¹©½¥¸¡É½½Ñ¥È°¸¸¹™¥±”¹ÍÁ±¥Ð œ¼œ¤¤ì(€€€¥˜ …•á¥ÍÑÌ¡™Õ±°¤¥í•ÉÉ½ÉÌ¹ÁÕÍ ¡€‘í¥‘ôèµ¥ÍÍ¥¹œ™¥±”€‘í™¥±•õ€¤í½¹Ñ¥¹Õ”íô(€€€±•Ð‰Õ™™•È±Á¹œõÁ¹…¡”¹•Ð¡™¥±”¤ì(€€€¥˜ …Á¹œ¥ì(€€€€€ÑÉåí‰Õ™™•ÈõÉ•…‘¥±”¡™Õ±°¤íÁ¹œõ¥¹ÍÁ•ÑA¹	Õ™™•È¡‰Õ™™•È¤íÁ¹…¡”¹Í•Ð¡™¥±”±Á¹œ¤íõ…Ñ ¡•ÉÉ½È¥í•ÉÉ½ÉÌ¹ÁÕÍ ¡€‘í¥‘ôè€‘í™¥±•ôè€‘í•ÉÉ½È¹µ•ÍÍ…•õ€¤í½¹Ñ¥¹Õ”íô(€€€ô(€€€½¹ÍÐÉ•Ðõ…ÍÍ•Ð¹Í½ÕÉ•I•Ðì(€€€½¹ÍÐÉÜõÉ•Ðý9Õµ‰•È¡É•Ð¹Ü¤éÁ¹œ¹Ý¥‘Ñ ±É õÉ•Ðý9Õµ‰•È¡É•Ð¹ ¤éÁ¹œ¹¡•¥¡Ðì(€€€¥˜¡É•Ð¥ì(€€€€€½¹ÍÐÉàõ9Õµ‰•È¡É•Ð¹à¤±Éäõ9Õµ‰•È¡É•Ð¹ä¤ì(€€€€€¥˜ …mÉà±Éä±ÉÜ±É¡t¹•Ù•Éä¡9Õµ‰•È¹¥Í%¹Ñ••È¥ññÉàðÁññÉäðÁññÉÜðôÁññÉ ðôÁññÉà­ÉÜùÁ¹œ¹Ý¥‘Ñ¡ññÉä­É ùÁ¹œ¹¡•¥¡Ð¥•ÉÉ½ÉÌ¹ÁÕÍ ¡€‘í¥‘ôèÍ½ÕÉ•I•Ð½ÕÑÍ¥‘”€‘í™¥±•ô€ ‘íÁ¹œ¹Ý¥‘Ñ¡õà‘íÁ¹œ¹¡•¥¡Ñô¥€¤ì(€€€ô(€€€¥˜¡Á½Í¥Ñ¥Ù•%¹Ð¡…ÍÍ•Ð¹Ý¥‘Ñ ¤˜™9Õµ‰•È¡…ÍÍ•Ð¹Ý¥‘Ñ ¤„ôõÉÜ¥•ÉÉ½ÉÌ¹ÁÕÍ ¡€‘í¥‘ôè‘•±…É•Ý¥‘Ñ €‘í…ÍÍ•Ð¹Ý¥‘Ñ¡ô€„ôÍ½ÕÉ”Ý¥‘Ñ €‘íÉÝõ€¤ì(€€€¥˜¡Á½Í¥Ñ¥Ù•%¹Ð¡…ÍÍ•Ð¹¡•¥¡Ð¤˜™9Õµ‰•È¡…ÍÍ•Ð¹¡•¥¡Ð¤„ôõÉ ¥•ÉÉ½ÉÌ¹ÁÕÍ ¡€‘í¥‘ôè‘•±…É•¡•¥¡Ð€‘í…ÍÍ•Ð¹¡•¥¡Ñô€„ôÍ½ÕÉ”¡•¥¡Ð€‘íÉ¡õ€¤ì(€€€¥˜¡…Ñ•½ÉäôôôÑ•ÉÉ…¥¸œ¥ì(€€€€€¥˜¡Á¹œ¹Ý¥‘Ñ ”ØÐ„ôôÁññÁ¹œ¹¡•¥¡Ð”ØÐ„ôôÀ¥•ÉÉ½ÉÌ¹ÁÕÍ ¡€‘í¥‘ôèÑ•ÉÉ…¥¸A9‘¥µ•¹Í¥½¹ÌµÕÍÐ‰”€ØÑàØÐ½È€ØÑÁàµÕ±Ñ¥Á±•Ìì½Ð€‘íÁ¹œ¹Ý¥‘Ñ¡õà‘íÁ¹œ¹¡•¥¡Ñõ€¤ì(€€€€€¥˜¡É•Ð˜˜¡ÉÜ”ØÐ„ôôÁññÉ ”ØÐ„ôôÀ¤¥•ÉÉ½ÉÌ¹ÁÕÍ ¡€‘í¥‘ôèÑ•ÉÉ…¥¸Í½ÕÉ•I•ÐµÕÍÐÕÍ”€ØÑÁàµÕ±Ñ¥Á±•Ìì½Ð€‘íÉÝõà‘íÉ¡õ€¤ì(€€€õ•±Í•ì(€€€€€¥˜ …Á¹œ¹¡…Í±Á¡„¥•ÉÉ½ÉÌ¹ÁÕÍ ¡€‘í¥‘ôè€‘í…Ñ•½ÉåôA9µÕÍÐ•áÁ½Í”…¸…±Á¡„¡…¹¹•°€¡I	½½ÈÑI9L¥€¤ì(€€€€€•±Í•ì(€€€€€€€ÑÉåì(€€€€€€€€€±•Ð‘•½‘•õ‘•½‘•‘…¡”¹•Ð¡™¥±”¤ì(€€€€€€€€€¥˜ …‘•½‘•¥ì(€€€€€€€€€€€¥˜ …‰Õ™™•È¥‰Õ™™•ÈõÉ•…‘¥±”¡™Õ±°¤ì(€€€€€€€€€€€‘•½‘•õ‘•½‘•A¹œ¡‰Õ™™•È¤í‘•½‘•‘…¡”¹Í•Ð¡™¥±”±‘•½‘•¤ì(€€€€€€€€€ô(€€€€€€€€€½¹ÍÐ…±Á¡„õÉ•Ðý¥¹ÍÁ•ÑI‰…I•¥½¸¡‘•½‘•±íàé9Õµ‰•È¡É•Ð¹à¤±äé9Õµ‰•È¡É•Ð¹ä¤±ÜéÉÜ± éÉ¡ô¤é¥¹ÍÁ•ÑI‰…I•¥½¸¡‘•½‘•±íàèÀ±äèÀ±Üé‘•½‘•¹Ý¥‘Ñ ± é‘•½‘•¹¡•¥¡Ñô¤ì(€€€€€€€€€¥˜ ……±Á¡„¹¡…ÍQÉ…¹ÍÁ…É•¹ÑA¥á•±Ì¥•ÉÉ½ÉÌ¹ÁÕÍ ¡€‘í¥‘ôè€‘í…Ñ•½ÉåôA9½Í½ÕÉ•I•ÐµÕÍÐ½¹Ñ…¥¸…Ð±•…ÍÐ½¹”ÑÉ…¹ÍÁ…É•¹ÐÁ¥á•±€¤ì(€€€€€€€õ…Ñ ¡•ÉÉ½È¥í•ÉÉ½ÉÌ¹ÁÕÍ ¡€‘í¥‘ôè€‘í™¥±•ôèÁ¥á•°ÑÉ…¹ÍÁ…É•¹äÙ…±¥‘…Ñ¥½¸™…¥±•è€‘í•ÉÉ½È¹µ•ÍÍ…•õ€¤íô(€€€€€ô(€€€ô(€€€¥˜¡…Ñ•½ÉäôôôÁÉ½Àœ¥ì(€€€€€½¹ÍÐ…àõ9Õµ‰•È¡…ÍÍ•Ð¹…¹¡½Èü¹à¤±…äõ9Õµ‰•È¡…ÍÍ•Ð¹…¹¡½Èü¹ä¤ì(€€€€€¥˜¡…à„ôôÀ¸Õññ…ä„ôôÄ¥•ÉÉ½ÉÌ¹ÁÕÍ ¡€‘í¥‘ôèÁÉ½À…¹¡½ÈµÕÍÐ‰”‰½ÑÑ½´µ•¹Ñ•ÈíàèÀ¸Ô±äèÅõ€¤ì(€€€õ•±Í”¥˜¡…ÍÍ•Ð¹…¹¡½È¥ì(€€€€€½¹ÍÐ…àõ9Õµ‰•È¡…ÍÍ•Ð¹…¹¡½È¹à¤±…äõ9Õµ‰•È¡…ÍÍ•Ð¹…¹¡½È¹ä¤ì(€€€€€¥˜ …9Õµ‰•È¹¥Í¥¹¥Ñ”¡…à¥ñð…9Õµ‰•È¹¥Í¥¹¥Ñ”¡…ä¥ññ…àðÁññ…àøÅññ…äðÁññ…äøÄ¥•ÉÉ½ÉÌ¹ÁÕÍ ¡€‘í¥‘ôè…¹¡½ÈµÕÍÐ‰”¹½Éµ…±¥é•€À¸¸Å€¤ì(€€€ô(€€€¥˜¡…ÍÍ•Ð¹™É…µ•Ì„õ¹Õ±°˜˜ …Á½Í¥Ñ¥Ù•%¹Ð¡9Õµ‰•È¡…ÍÍ•Ð¹™É…µ•Ì¤¥ññ9Õµ‰•È¡…ÍÍ•Ð¹™É…µ•Ì¤øØÐ¤¥•ÉÉ½ÉÌ¹ÁÕÍ ¡€‘í¥‘ôè™É…µ•ÌµÕÍÐ‰”…¸¥¹Ñ••È™É½´€ÄÑ¼€ØÑ€¤ì(€€€¥˜¡…ÍÍ•Ð¹™É…µ•ÕÉ…Ñ¥½¹5Ì„õ¹Õ±°˜˜ …Á½Í¥Ñ¥Ù•%¹Ð¡9Õµ‰•È¡…ÍÍ•Ð¹™É…µ•ÕÉ…Ñ¥½¹5Ì¤¥ññ9Õµ‰•È¡…ÍÍ•Ð¹™É…µ•ÕÉ…Ñ¥½¹5Ì¤øØÀÀÀÀ¤¥•ÉÉ½ÉÌ¹ÁÕÍ ¡€‘í¥‘ôè™É…µ•ÕÉ…Ñ¥½¹5ÌµÕÍÐ‰”…¸¥¹Ñ••È™É½´€ÄÑ¼€ØÀÀÀÁ€¤ì(€ô((€½¹ÍÐ‰¥¹‘¥¹¹ÑÉ¥•Ìõ½±±•Ñ	¥¹‘¥¹¹ÑÉ¥•Ì¡µ…¹¥™•ÍÐ¹‰¥¹‘¥¹Íññíô¤ì(€™½È¡½¹ÍÑí…Ñ•½Éä±Í•µ…¹Ñ¥Œ±¥‘õ½˜‰¥¹‘¥¹¹ÑÉ¥•Ì¥ì(€€€¥˜ …Í••¸¹¡…Ì¡¥¤¥í•ÉÉ½ÉÌ¹ÁÕÍ ¡‰¥¹‘¥¹œÉ•™•É•¹•Ìµ¥ÍÍ¥¹œ…ÍÍ•Ð¥è€‘í¥‘õ€¤í½¹Ñ¥¹Õ”íô(€€€½¹ÍÐ…ÍÍ•Ðõ…ÍÍ•Ñ	å%¹•Ð¡¥¤ì(€€€¥˜¡…ÍÍ•Ðü¹…Ñ•½Éä„ôõ…Ñ•½Éä¥•ÉÉ½ÉÌ¹ÁÕÍ ¡‰¥¹‘¥¹œ€‘í…Ñ•½Éåô¸‘íÍ•µ…¹Ñ¥ôÉ•™•É•¹•Ì€‘í¥‘ôÝ¥Ñ …Ñ•½Éä€‘í…ÍÍ•Ðü¹…Ñ•½Éåñðœñµ¥ÍÍ¥¹œøõ€¤ì(€ô(€½¹ÍÐ‰½Õ¹‘%‘Ìõ‰¥¹‘¥¹¹ÑÉ¥•Ì¹µ…À¡•¹ÑÉäôù•¹ÑÉä¹¥¤ì(€™½È¡½¹ÍÐ¥½˜Í••¸¥¥˜ …‰½Õ¹‘%‘Ì¹¥¹±Õ‘•Ì¡¥¤¥Ý…É¹¥¹Ì¹ÁÕÍ ¡Õ¹‰½Õ¹…ÍÍ•Ðè€‘í¥‘õ€¤ì(€™½È¡½¹ÍÐÍ¡••Ð½˜ÉÉ…ä¹¥ÍÉÉ…ä¡Á…ÉÍ•¹Í¡••ÑÌ¤ýÁ…ÉÍ•¹Í¡••ÑÌémt¥ì(€€€¥˜ …Í…™•I•±…Ñ¥Ù•¥±”¡Í¡••Ð¹™¥±”¤¥•ÉÉ½ÉÌ¹ÁÕÍ ¡¥¹Ù…±¥Í¡••Ð™¥±”Á…Ñ è€‘íÍ¡••Ð¹™¥±•ñðœñµ¥ÍÍ¥¹œøõ€¤ì(€€€¥˜ …Á½Í¥Ñ¥Ù•%¹Ð¡9Õµ‰•È¡Í¡••Ð¹•±±]¥‘Ñ ¤¥ñð…Á½Í¥Ñ¥Ù•%¹Ð¡9Õµ‰•È¡Í¡••Ð¹•±±!•¥¡Ð¤¤¥•ÉÉ½ÉÌ¹ÁÕÍ ¡€‘íÍ¡••Ð¹¥‘ññÍ¡••Ð¹™¥±•ñðœñÍ¡••Ðøôè•±±]¥‘Ñ ½•±±!•¥¡ÐµÕÍÐ‰”Á½Í¥Ñ¥Ù”¥¹Ñ••ÉÍ€¤ì(€ô(€¥˜¡ÍÑÉ¥ÑI•ÅÕ¥É•¥Ù…±¥‘…Ñ•MÑÉ¥ÑI•ÅÕ¥É•¡µ…¹¥™•ÍÐ±Í••¸±•ÉÉ½ÉÌ¤ì(€É•ÑÕÉ¹í½¬é•ÉÉ½ÉÌ¹±•¹Ñ ôôôÀ±•ÉÉ½ÉÌ±Ý…É¹¥¹Ì±…ÍÍ•ÑÌ±™¥±•Ìél¸¸¹™¥±•Ít¹Í½ÉÐ ¤±µ…¹¥™•ÍÑôì)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸ÉÕ¹Ñ¥µ•5…¹¥™•ÍÐ¡µ…¹¥™•ÍÐ¥ì(€½¹ÍÐ¹½Éµ…±¥é•õ¹½Éµ…±¥é•5…¹¥™•ÍÐ¡µ…¹¥™•ÍÐ¤ì(€½¹ÍÐ…ÍÍ•ÑÌõ¹½Éµ…±¥é•¹…ÍÍ•ÑÌ¹µ…À¡…ÍÍ•Ðôùì(€€€½¹ÍÐ½ÕÐõí¥é…ÍÍ•Ð¹¥±…Ñ•½Éäé…ÍÍ•Ð¹…Ñ•½Éä±™¥±”é…ÍÍ•Ð¹™¥±”±Ý¥‘Ñ é…ÍÍ•Ð¹Ý¥‘Ñ ±¡•¥¡Ðé…ÍÍ•Ð¹¡•¥¡Ñôì(€€€¥˜¡…ÍÍ•Ð¹Í½ÕÉ•I•Ð¥½ÕÐ¹Í½ÕÉ•I•Ðõ…ÍÍ•Ð¹Í½ÕÉ•I•Ðì(€€€¥˜¡…ÍÍ•Ð¹…¹¡½È¥½ÕÐ¹…¹¡½Èõ…ÍÍ•Ð¹…¹¡½Èì(€€€¥˜¡…ÍÍ•Ð¹™É…µ•Ì¥½ÕÐ¹™É…µ•Ìõ…ÍÍ•Ð¹™É…µ•Ìì(€€€¥˜¡…ÍÍ•Ð¹™É…µ•ÕÉ…Ñ¥½¹5Ì¥½ÕÐ¹™É…µ•ÕÉ…Ñ¥½¹5Ìõ…ÍÍ•Ð¹™É…µ•ÕÉ…Ñ¥½¹5Ìì(€€€É•ÑÕÉ¸½ÕÐì(€ô¤ì(€É•ÑÕÉ¹íÙ•ÉÍ¥½¸èÄ±Á…¬é¹½Éµ…±¥é•¹Á…­ñðÝ…­•¹¥¹œ]½É±ÉÐA…¬œ±‰¥¹‘¥¹Ìé¹½Éµ…±¥é•¹‰¥¹‘¥¹Íññíô±…ÍÍ•ÑÍôì)ô