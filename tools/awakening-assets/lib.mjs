import fs from 'node:fs';
import path from 'node:path';

export const ASSET_ID_RE=/^aw_v1_(terrain|decal|prop|fx)_[a-z0-9]+(?:_[a-z0-9]+)*$/;
export const CATEGORIES=new Set(['terrain','decal','prop','fx']);
const PNG_SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);
const MAX_DIMENSION=8192;

function positiveInt(value){return Number.isInteger(value)&&value>0;}
function safeRelativeFile(file){
  if(typeof file!=='string'||!file||file.includes('\\'))return false;
  const normalized=path.posix.normalize(file);
  return normalized===file&&!normalized.startsWith('../')&&!path.posix.isAbsolute(normalized)&&normalized.toLowerCase().endsWith('.png');
}

export function inspectPngBuffer(buffer){
  if(!Buffer.isBuffer(buffer)||buffer.length<33||!buffer.subarray(0,8).equals(PNG_SIGNATURE))throw new Error('invalid PNG signature');
  let offset=8,ihdr=null,hasTrns=false,idat=0,ended=false;
  while(offset+12<=buffer.length){
    const length=buffer.readUInt32BE(offset),type=buffer.toString('ascii',offset+4,offset+8),dataStart=offset+8,dataEnd=dataStart+length;
    if(dataEnd+4>buffer.length)throw new Error(`truncated PNG chunk ${type}`);
    if(type==='IHDR'){
      if(length!==13||ihdr)throw new Error('invalid PNG IHDR');
      ihdr={width:buffer.readUInt32BE(dataStart),height:buffer.readUInt32BE(dataStart+4),bitDepth:buffer[dataStart+8],colorType:buffer[dataStart+9],compression:buffer[dataStart+10],filter:buffer[dataStart+11],interlace:buffer[dataStart+12]};
    }else if(type==='tRNS')hasTrns=true;
    else if(type==='IDAT')idat++;
    else if(type==='IEND'){ended=true;break;}
    offset=dataEnd+4;
  }
  if(!ihdr)throw new Error('PNG missing IHDR');
  if(!idat)throw new Error('PNG missing IDAT');
  if(!ended)throw new Error('PNG missing IEND');
  if(!positiveInt(ihdr.width)||!positiveInt(ihdr.height)||ihdr.width>MAX_DIMENSION||ihdr.height>MAX_DIMENSION)throw new Error(`illegal PNG dimensions ${ihdr.width}x${ihdr.height}`);
  if(ihdr.compression!==0||ihdr.filter!==0||![0,1].includes(ihdr.interlace))throw new Error('unsupported PNG header flags');
  const hasAlpha=[4,6].includes(ihdr.colorType)||hasTrns;
  return{...ihdr,hasAlpha,hasTrns,idatChunks:idat};
}

export function normalizeManifest(manifest){
  const input=manifest&&typeof manifest==='object'?manifest:{};
  const assets=Array.isArray(input.assets)?input.assets.map(asset=>({...asset})):[];
  for(const sheet of Array.isArray(input.sheets)?input.sheets:[]){
    const cellWidth=Number(sheet.cellWidth),cellHeight=Number(sheet.cellHeight);
    for(const entry of Array.isArray(sheet.entries)?sheet.entries:[]){
      const hasRect=[entry.x,entry.y,entry.w,entry.h].every(Number.isFinite);
      const cols=positiveInt(entry.cols)?entry.cols:1,rows=positiveInt(entry.rows)?entry.rows:1;
      const sourceRect=hasRect
        ?{x:Number(entry.x),y:Number(entry.y),w:Number(entry.w),h:Number(entry.h)}
        :{x:Number(entry.col||0)*cellWidth,y:Number(entry.row||0)*cellHeight,w:cols*cellWidth,h:rows*cellHeight};
      assets.push({...entry,file:entry.file||sheet.file,sourceRect,width:entry.width||sourceRect.w,height:entry.height||sourceRect.h,sheet:sheet.id||sheet.file});
    }
  }
  return{...input,assets};
}

function collectBindingIds(value,out=[]){
  if(typeof value==='string')out.push(value);
  else if(Array.isArray(value))for(const item of value)collectBindingIds(item,out);
  else if(value&&typeof value==='object')for(const item of Object.values(value))collectBindingIds(item,out);
  return out;
}

export function validatePack(rootDir,{readFile=fs.readFileSync,exists=fs.existsSync}={}){
  const errors=[],warnings=[],pngCache=new Map();
  const manifestPath=path.join(rootDir,'manifest.json');
  if(!exists(manifestPath))return{ok:false,errors:['missing manifest.json'],warnings,assets:[],files:[]};
  let parsed;
  try{parsed=JSON.parse(readFile(manifestPath,'utf8'));}catch(error){return{ok:false,errors:[`invalid manifest.json: ${error.message}`],warnings,assets:[],files:[]};}
  if(parsed.version!==1)errors.push('manifest.version must be 1');
  const manifest=normalizeManifest(parsed),assets=manifest.assets||[],seen=new Set(),files=new Set();
  if(!assets.length)errors.push('manifest must declare at least one asset or sheet entry');

  for(const asset of assets){
    const id=asset?.id,category=asset?.category,file=asset?.file;
    if(!ASSET_ID_RE.test(String(id||'')))errors.push(`invalid asset id: ${id||'<missing>'}`);
    if(seen.has(id))errors.push(`duplicate id: ${id}`);else if(id)seen.add(id);
    if(!CATEGORIES.has(category))errors.push(`${id||'<missing>'}: invalid category ${category}`);
    else if(id&&!String(id).startsWith(`aw_v1_${category}_`))errors.push(`${id}: id/category mismatch (${category})`);
    if(!safeRelativeFile(file)){errors.push(`${id||'<missing>'}: invalid PNG file path ${file||'<missing>'}`);continue;}
    files.add(file);
    const full=path.join(rootDir,...file.split('/'));
    if(!exists(full)){errors.push(`${id}: missing file ${file}`);continue;}
    let png=pngCache.get(file);
    if(!png){
      try{png=inspectPngBuffer(readFile(full));pngCache.set(file,png);}catch(error){errors.push(`${id}: ${file}: ${error.message}`);continue;}
    }
    const rect=asset.sourceRect;
    const rw=rect?Number(rect.w):png.width,rh=rect?Number(rect.h):png.height;
    if(rect){
      const rx=Number(rect.x),ry=Number(rect.y);
      if(![rx,ry,rw,rh].every(Number.isInteger)||rx<0||ry<0||rw<=0||rh<=0||rx+rw>png.width||ry+rh>png.height)errors.push(`${id}: sourceRect outside ${file} (${png.width}x${png.height})`);
    }
    if(positiveInt(asset.width)&&Number(asset.width)!==rw)errors.push(`${id}: declared width ${asset.width} != source width ${rw}`);
    if(positiveInt(asset.height)&&Number(asset.height)!==rh)errors.push(`${id}: declared height ${asset.height} != source height ${rh}`);
    if(category==='terrain'){
      if(png.width%64!==0||png.height%64!==0)errors.push(`${id}: terrain PNG dimensions must be 64x64 or 64px multiples; got ${png.width}x${png.height}`);
      if(rect&&(rw%64!==0||rh%64!==0))errors.push(`${id}: terrain sourceRect must use 64px multiples; got ${rw}x${rh}`);
    }else if(!png.hasAlpha){
      errors.push(`${id}: ${category} PNG must expose an alpha channel (RGBA/GA or tRNS)`);
    }
    if(asset.anchor){
      const ax=Number(asset.anchor.x),ay=Number(asset.anchor.y);
      if(!Number.isFinite(ax)||!Number.isFinite(ay)||ax<0||ax>1||ay<0||ay>1)errors.push(`${id}: anchor must be normalized 0..1`);
    }
    if(asset.frames!=null&&(!positiveInt(Number(asset.frames))||Number(asset.frames)>64))errors.push(`${id}: frames must be an integer from 1 to 64`);
  }

  const boundIds=collectBindingIds(manifest.bindings||{});
  for(const id of boundIds)if(!seen.has(id))errors.push(`binding references missing asset id: ${id}`);
  for(const id of seen)if(!boundIds.includes(id))warnings.push(`unbound asset: ${id}`);
  for(const sheet of Array.isArray(parsed.sheets)?parsed.sheets:[]){
    if(!safeRelativeFile(sheet.file))errors.push(`invalid sheet file path: ${sheet.file||'<missing>'}`);
    if(!positiveInt(Number(sheet.cellWidth))||!positiveInt(Number(sheet.cellHeight)))errors.push(`${sheet.id||sheet.file||'<sheet>'}: cellWidth/cellHeight must be positive integers`);
  }
  return{ok:errors.length===0,errors,warnings,assets,files:[...files].sort(),manifest};
}

export function runtimeManifest(manifest){
  const normalized=normalizeManifest(manifest);
  const assets=normalized.assets.map(asset=>{
    const out={id:asset.id,category:asset.category,file:asset.file,width:asset.width,height:asset.height};
    if(asset.sourceRect)out.sourceRect=asset.sourceRect;
    if(asset.anchor)out.anchor=asset.anchor;
    if(asset.frames)out.frames=asset.frames;
    if(asset.frameDurationMs)out.frameDurationMs=asset.frameDurationMs;
    return out;
  });
  return{version:1,pack:normalized.pack||'Awakening World Art Pack',bindings:normalized.bindings||{},assets};
}
