import fs from 'node:fs';

const PNG_SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);
const CHANNELS={0:1,2:3,3:1,4:2,6:4};

function crc32(buffer){
  let c=0xffffffff;
  for(const byte of buffer){
    c^=byte;
    for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);
  }
  return (c^0xffffffff)>>>0;
}
function pngChunk(type,data){
  const t=Buffer.from(type,'ascii');
  const body=Buffer.concat([t,data]);
  const out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0);
  t.copy(out,4);
  data.copy(out,8);
  out.writeUInt32BE(crc32(body),8+data.length);
  return out;
}
function paeth(a,b,c){
  const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
  return pa<=pb&&pa<=pc?a:pb<=pc?b:c;
}

export function parsePng(buffer){
  if(!Buffer.isBuffer(buffer))buffer=Buffer.from(buffer);
  if(buffer.length<33||!buffer.subarray(0,8).equals(PNG_SIGNATURE))throw new Error('not a PNG file');
  let off=8,width=0,height=0,bitDepth=0,colorType=-1,interlace=-1,palette=null,trns=null;
  const idat=[];
  while(off+12<=buffer.length){
    const len=buffer.readUInt32BE(off);
    const type=buffer.toString('ascii',off+4,off+8);
    const data=buffer.subarray(off+8,off+8+len);
    if(off+12+len>buffer.length)throw new Error('truncated PNG chunk');
    off+=12+len;
    if(type==='IHDR'){
      width=data.readUInt32BE(0);height=data.readUInt32BE(4);bitDepth=data[8];colorType=data[9];
      if(data[10]!==0||data[11]!==0)throw new Error('unsupported PNG compression/filter method');
      interlace=data[12];
    }else if(type==='PLTE')palette=Buffer.from(data);
    else if(type==='tRNS')trns=Buffer.from(data);
    else if(type==='IDAT')idat.push(Buffer.from(data));
    else if(type==='IEND')break;
  }
  if(!width||!height)throw new Error('PNG missing IHDR');
  if(bitDepth!==8)throw new Error(`unsupported PNG bit depth ${bitDepth}; export 8-bit PNG`);
  if(!(colorType in CHANNELS))throw new Error(`unsupported PNG color type ${colorType}`);
  if(interlace!==0)throw new Error('interlaced PNG unsupported; export non-interlaced PNG');
  if(!idat.length)throw new Error('PNG missing IDAT');
  if(colorType===3&&!palette)throw new Error('indexed PNG missing PLTE');
  return{width,height,bitDepth,colorType,interlace,palette,trns,idat};
}

export async function decodePng(buffer){
  const zlib=await import('node:zlib');
  const meta=parsePng(buffer);
  const channels=CHANNELS[meta.colorType],stride=meta.width*channels;
  const inflated=zlib.inflateSync(Buffer.concat(meta.idat));
  const expected=(stride+1)*meta.height;
  if(inflated.length!==expected)throw new Error(`unexpected PNG data length ${inflated.length}; expected ${expected}`);
  const rows=[];let p=0,prev=Buffer.alloc(stride);
  for(let y=0;y<meta.height;y++){
    const filter=inflated[p++],scan=Buffer.from(inflated.subarray(p,p+stride));p+=stride;
    if(filter>4)throw new Error(`unsupported PNG filter ${filter}`);
    for(let x=0;x<stride;x++){
      const a=x>=channels?scan[x-channels]:0,b=prev[x],c=x>=channels?prev[x-channels]:0;
      if(filter===1)scan[x]=(scan[x]+a)&255;
      else if(filter===2)scan[x]=(scan[x]+b)&255;
      else if(filter===3)scan[x]=(scan[x]+Math.floor((a+b)/2))&255;
      else if(filter===4)scan[x]=(scan[x]+paeth(a,b,c))&255;
    }
    rows.push(scan);prev=scan;
  }
  const rgba=Buffer.alloc(meta.width*meta.height*4);
  let q=0;
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
        const idx=row[x],i=idx*3;
        if(i+2>=meta.palette.length)throw new Error(`palette index ${idx} out of range`);
        r=meta.palette[i];g=meta.palette[i+1];b=meta.palette[i+2];
        if(meta.trns&&idx<meta.trns.length)a=meta.trns[idx];
      }
      rgba[q++]=r;rgba[q++]=g;rgba[q++]=b;rgba[q++]=a;
    }
  }
  return{...meta,rgba};
}

export async function analyzePng(buffer){
  const decoded=await decodePng(buffer);
  let transparentPixels=0,semiTransparentPixels=0;
  for(let i=3;i<decoded.rgba.length;i+=4){
    const a=decoded.rgba[i];
    if(a<255)transparentPixels++;
    if(a>0&&a<255)semiTransparentPixels++;
  }
  return{
    width:decoded.width,height:decoded.height,bitDepth:decoded.bitDepth,colorType:decoded.colorType,
    hasAlphaChannel:decoded.colorType===4||decoded.colorType===6||Boolean(decoded.trns),
    hasTransparentPixels:transparentPixels>0,hasSemiTransparentPixels:semiTransparentPixels>0,
    transparentPixels,semiTransparentPixels,isOpaque:transparentPixels===0
  };
}

export async function analyzePngFile(file){
  return analyzePng(fs.readFileSync(file));
}

export async function encodeRgbaPng(width,height,rgba){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<=0||height<=0)throw new Error('invalid PNG dimensions');
  if(!Buffer.isBuffer(rgba))rgba=Buffer.from(rgba);
  if(rgba.length!==width*height*4)throw new Error(`RGBA buffer length ${rgba.length} does not match ${width}x${height}`);
  const zlib=await import('node:zlib');
  const raw=Buffer.alloc((width*4+1)*height);
  let src=0,dst=0;
  for(let y=0;y<height;y++){
    raw[dst++]=0;
    rgba.copy(raw,dst,src,src+width*4);
    src+=width*4;dst+=width*4;
  }
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
  return Buffer.concat([PNG_SIGNATURE,pngChunk('IHDR',ihdr),pngChunk('IDAT',zlib.deflateSync(raw)),pngChunk('IEND',Buffer.alloc(0))]);
}

export function cropRgba(decoded,rect){
  const {x,y,w,h}=rect;
  for(const [name,v] of Object.entries({x,y,w,h}))if(!Number.isInteger(v))throw new Error(`${name} must be an integer`);
  if(w<=0||h<=0||x<0||y<0||x+w>decoded.width||y+h>decoded.height)throw new Error('crop rectangle is outside source image');
  const out=Buffer.alloc(w*h*4);
  for(let row=0;row<h;row++){
    const from=((y+row)*decoded.width+x)*4;
    decoded.rgba.copy(out,row*w*4,from,from+w*4);
  }
  return{width:w,height:h,rgba:out};
}

export function inspectRgbaRegion(decoded,rect){
  const cropped=cropRgba(decoded,rect);
  let transparentPixels=0,semiTransparentPixels=0;
  for(let i=3;i<cropped.rgba.length;i+=4){
    const a=cropped.rgba[i];
    if(a<255)transparentPixels++;
    if(a>0&&a<255)semiTransparentPixels++;
  }
  return{width:cropped.width,height:cropped.height,hasTransparentPixels:transparentPixels>0,hasSemiTransparentPixels:semiTransparentPixels>0,transparentPixels,semiTransparentPixels,isOpaque:transparentPixels===0};
}
