import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const path=new URL('../assets/art-v21/terrain-v21.png',import.meta.url);
const png=fs.readFileSync(path);
const signature=png.subarray(0,8);
assert.equal(signature.toString('hex'),'89504e470d0a1a0a','PNG signature');

const crcTable=Array.from({length:256},(_,n)=>{
  let c=n;
  for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);
  return c>>>0;
});
function crc32(buffer){
  let c=0xffffffff;
  for(const byte of buffer)c=crcTable[(c^byte)&0xff]^(c>>>8);
  return (c^0xffffffff)>>>0;
}
function makeChunk(type,data){
  const name=Buffer.from(type,'ascii');
  const length=Buffer.alloc(4);length.writeUInt32BE(data.length);
  const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([name,data])));
  return Buffer.concat([length,name,data,crc]);
}

console.log('PNG_BYTES='+png.length);
console.log('PNG_TAIL_HEX='+png.subarray(Math.max(0,png.length-48)).toString('hex'));
const chunks=[];
let off=8,width=0,height=0,colorType=-1,bitDepth=-1,truncated=null;
while(off+8<=png.length){
  const length=png.readUInt32BE(off);
  const type=png.toString('ascii',off+4,off+8);
  const end=off+12+length;
  console.log(`CHUNK offset=${off} type=${JSON.stringify(type)} length=${length} end=${end} available=${png.length-off}`);
  if(end>png.length){
    truncated={off,length,type,end,missing:end-png.length};
    console.log('TRUNCATED_CHUNK='+JSON.stringify(truncated));
    console.log('TRUNCATED_REMAINDER_HEX='+png.subarray(off).toString('hex'));
    break;
  }
  const data=png.subarray(off+8,off+8+length);
  const stored=png.readUInt32BE(off+8+length);
  const actual=crc32(Buffer.concat([Buffer.from(type),data]));
  chunks.push({type,data,stored,actual,crcOk:stored===actual});
  console.log(`CHUNK_CRC type=${type} stored=${stored.toString(16).padStart(8,'0')} actual=${actual.toString(16).padStart(8,'0')} ok=${stored===actual}`);
  if(type==='IHDR'){
    width=data.readUInt32BE(0);height=data.readUInt32BE(4);bitDepth=data[8];colorType=data[9];
  }
  off=end;
  if(type==='IEND')break;
}
console.log('PARSED_TYPES='+chunks.map(c=>c.type).join(','));
console.log('DIMENSIONS='+width+'x'+height+' depth='+bitDepth+' color='+colorType);

if(!truncated&&chunks.some(c=>c.type==='IDAT')){
  const idat=Buffer.concat(chunks.filter(c=>c.type==='IDAT').map(c=>c.data));
  try{
    const raw=zlib.inflateSync(idat);
    console.log('NORMAL_INFLATE_OK=true');
    console.log('RAW_BYTES='+raw.length);
    console.log('PIXEL_STREAM_SHA256='+crypto.createHash('sha256').update(raw).digest('hex'));
  }catch(error){
    console.log('NORMAL_INFLATE_OK=false');
    console.log('NORMAL_INFLATE_ERROR='+String(error?.code||error?.message||error));
    if(idat.length>6){
      try{
        const raw=zlib.inflateRawSync(idat.subarray(2,-4));
        console.log('RAW_INFLATE_OK=true');
        console.log('RAW_BYTES='+raw.length);
        console.log('PIXEL_STREAM_SHA256='+crypto.createHash('sha256').update(raw).digest('hex'));
      }catch(rawError){
        console.log('RAW_INFLATE_OK=false');
        console.log('RAW_INFLATE_ERROR='+String(rawError?.code||rawError?.message||rawError));
      }
    }
  }
}

// This diagnostic intentionally exits non-zero while the source PNG is structurally invalid.
if(truncated)throw new Error(`PNG truncated in ${JSON.stringify(truncated.type)}: missing ${truncated.missing} bytes`);
assert.equal(width,320);assert.equal(height,256);assert.equal(bitDepth,8);assert.equal(colorType,2);
