import fs from 'node:fs';
import {deflateSync,inflateSync} from 'node:zlib';

const PNG_SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);
const CHANNELS={0:1,2:3,3:1,4:2,6:4};
const MAX_DIMENSION=8192;

function crc32(buffer){
  let c=0xffffffff;
  for(const byte of buffer){
    c^=byte;
    for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);
  }
  return(c^0xffffffff)>>>0;
}
function pngChunk(type,data){
  const t=Buffer.from(type,'ascii'),body=Buffer.concat([t,data]),out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0);t.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc32(body),8+data.length);return out;
}
function paeth(a,b,c){
  const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
  return pa<=pb&&pa<=pc?a:pb<=pc?b:c;
}

export function parsePng(buffer){
  if(!Buffer.isBuffer(buffer))buffer=Buffer.from(buffer);
  if(buffer.length<33||!buffer.subarray(0,8).equals(PNG_SIGNATURE))throw new Error('invalid PNG signature');
  let offset=8,width=0,height=0,bitDepth=0,colorType=-1,interlace=-1,palette=null,trns=null,ended=false;
  const idat=[];
  while(offset+12<=buffer.length){
    const length=buffer.readUInt32BE(offset),type=buffer.toString('ascii',offset+4,offset+8),dataStart=offset+8,dataEnd=dataStart+length;
    if(dataEnd+4>buffer.length)throw new Error(`truncated PNG chunk ${type}`);
    const data=buffer.subarray(dataStart,dataEnd);
    if(type==='IHDR'){
      if(length!==13||width||height)throw new Error('invalid PNG IHDR');
      width=data.readUInt32BE(0);height=data.readUInt32BE(4);bitDepth=data[8];colorType=data[9];
      if(data[10]!==0||data[11]!==0)throw new Error('unsupported PNG compression/filter method');
      interlace=data[12];
    }else if(type==='PLTE')palette=Buffer.from(data);
    else if(type==='tRNS')trns=Buffer.from(data);
    else if(type==='IDAT')idat.push(Buffer.from(data));
    else if(type==='IEND'){ended=true;break;}
    offset=dataEnd+4;
  }
  if(!width||!height)throw new Error('PNG missing IHDR');
  if(width>MAX_DIMENSION||height>MAX_DIMENSION)throw new Error(`illegal PNG dimensions ${width}x${height}`);
  if(!ended)throw new Error('PNG missing IEND');
  if(bitDepth!==8)throw new Error(`pixel inspection requires 8-bit PNG; got bit depth ${bitDepth}`);
  if(!(colorType in CHANNELS))throw new Error(`unsupported PNG color type ${colorType}`);
  if(interlace!==0)throw new Error('pixel inspection requires non-interlaced PNG');
  if(!idat.length)throw new Error('PNG missing IDAT');
  if(colorType===3&&!palette)throw new Error('indexed PNG missing PLTE');
  return{width,height,bitDepth,colorType,interlace,palette,trns,idat};
}

export function decodePng(buffer){
  const meta=parsePng(buffer),channels=CHANNELS[meta.colorType],stride=meta.width*channels;
  const inflated=inflateSync(Buffer.concat(meta.idat)),expected=(stride+1)*meta.height;
  if(inflated.length!==expected)throw new Error(`unexpected PNG data length ${inflated.length}; expected ${expected}`);
  const rows=[];let cursor=0,previous=Buffer.alloc(stride);
  for(let y=0;y<meta.height;y++){
    const filter=inflated[cursor++],scan=Buffer.from(inflated.subarray(cursor,cursor+stride));cursor+=stride;
    if(filter>4)throw new Error(`unsupported PNG filter ${filter}`);
    for(let x=0;x<stride;x++){
      const left=x>=channels?scan[x-channels]:0,up=previous[x],upLeft=x>=channels?previous[x-channels]:0;
      if(filter===1)scan[x]=(scan[x]+left)&255;
      else if(filter===2)scan[x]=(scan[x]+up)&255;
      else if(filter===3)scan[x]=(scan[x]+Math.floor((left+up)/2))&255;
      else if(filter===4)scan[x]=(scan[x]+paeth(left,up,upLeft))&255;
    }
    rows.push(scan);previous=scan;
  }
  const rgba=Buffer.alloc(meta.width*meta.height*4);let out=0;
  for(let y=0;y<meta.height;y++){
    const row=rows[y];
    for(let x=0;x<meta.width;x++){
      let r,g,b,a=255;
      if(meta.colorType===6){
        const i=x*4;r=row[i];g=row[i+1];b=row[i+2];a=row[i+3];
      }else if(meta.colorType===2){
        const i=x*3;r=row[i];g=row[i+1];b=row[i+2];
        if(meta.trns&&meta.trns.length>=6){
          const kr=meta.trns.readUInt16BE(0)&255,kg=meta.trns.readUInt16BE(2)&255,kb=meta.trns.readUInt16BE(4)&255;
          if(r===kr&&g===kg&&b===kb)a=0;
        }
      }else if(meta.colorType===4){
        const i=x*2;r=g=b=row[i];a=row[i+1];
      }else if(meta.colorType===0){
        r=g=b=row[x];
        if(meta.trns&&meta.trns.length>=2&&r===(meta.trns.readUInt16BE(0)&255))a=0;
      }else{
        const index=row[x],i=index*3;
        if(i+2>=meta.palette.length)throw new Error(`palette index ${index} out of range`);
        r=meta.palette[i];g=meta.palette[i+1];b=meta.palette[i+2];
        if(meta.trns&&index<meta.trns.length)a=meta.trns[index];
      }
      rgba[out++]=r;rgba[out++]=g;rgba[out++]=b;rgba[out++]=a;
    }
  }
  return{...meta,rgba};
}

function alphaSummary(rgba){
  let transparentPixels=0,semiTransparentPixels=0;
  for(let i=3;i<rgba.length;i+=4){
    const alpha=rgba[i];
    if(alpha<255)transparentPixels++;
    if(alpha>0&&alpha<255)semiTransparentPixels++;
  }
  return{hasTransparentPixels:transparentPixels>0,hasSemiTransparentPixels:semiTransparentPixels>0,transparentPixels,semiTransparentPixels,isOpaque:transparentPixels===0};
}

export function analyzePng(buffer){
  const decoded=decodePng(buffer);
  return{
    width:decoded.width,height:decoded.height,bitDepth:decoded.bitDepth,colorType:decoded.colorType,
    hasAlphaChannel:decoded.colorType===4||decoded.colorType===6||Boolean(decoded.trns),
    ...alphaSummary(decoded.rgba)
  };
}

export function analyzePngFile(file){return analyzePng(fs.readFileSync(file));}

export function cropRgba(decoded,rect){
  const{x,y,w,h}=rect;
  for(const[name,value]of Object.entries({x,y,w,h}))if(!Number.isInteger(value))throw new Error(`${name} must be an integer`);
  if(w<=0||h<=0||x<0||y<0||x+w>decoded.width||y+h>decoded.height)throw new Error('crop rectangle is outside source image');
  const rgba=Buffer.alloc(w*h*4);
  for(let row=0;row<h;row++){
    const from=((y+row)*decoded.width+x)*4;
    decoded.rgba.copy(rgba,row*w*4,from,from+w*4);
  }
  return{width:w,height:h,rgba};
}

export function inspectRgbaRegion(decoded,rect){return{width:rect.w,height:rect.h,...alphaSummary(cropRgba(decoded,rect).rgba)};}

export function encodeRgbaPng(width,height,rgba){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<=0||height<=0||width>MAX_DIMENSION||height>MAX_DIMENSION)throw new Error('invalid PNG dimensions');
  if(!Buffer.isBuffer(rgba))rgba=Buffer.from(rgba);
  if(rgba.length!==width*height*4)throw new Error(`RGBA buffer length ${rgba.length} does not match ${width}x${height}`);
  const raw=Buffer.alloc((width*4+1)*height);let source=0,target=0;
  for(let y=0;y<height;y++){
    raw[target++]=0;rgba.copy(raw,target,source,source+width*4);source+=width*4;target+=width*4;
  }
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([PNG_SIGNATURE,pngChunk('IHDR',ihdr),pngChunk('IDAT',deflateSync(raw)),pngChunk('IEND',Buffer.alloc(0))]);
}
