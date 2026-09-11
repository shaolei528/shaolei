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

const chunks=[];
let off=8,width=0,height=0,colorType=-1,bitDepth=-1;
while(off<png.length){
  const length=png.readUInt32BE(off);
  const type=png.toString('ascii',off+4,off+8);
  const data=png.subarray(off+8,off+8+length);
  const stored=png.readUInt32BE(off+8+length);
  const actual=crc32(Buffer.concat([Buffer.from(type),data]));
  chunks.push({type,data,stored,actual,crcOk:stored===actual});
  if(type==='IHDR'){
    width=data.readUInt32BE(0);height=data.readUInt32BE(4);bitDepth=data[8];colorType=data[9];
  }
  off+=12+length;
  if(type==='IEND')break;
}
assert.equal(width,320);assert.equal(height,256);assert.equal(bitDepth,8);assert.equal(colorType,2);
const idat=Buffer.concat(chunks.filter(c=>c.type==='IDAT').map(c=>c.data));
let normalOk=true,raw;
try{raw=zlib.inflateSync(idat);}catch(error){
  normalOk=false;
  console.log('NORMAL_INFLATE_ERROR='+String(error?.code||error?.message||error));
  assert.ok(idat.length>6,'IDAT zlib stream must contain header/body/checksum');
  raw=zlib.inflateRawSync(idat.subarray(2,-4));
}
const expected=height*(1+width*3);
assert.equal(raw.length,expected,'raw scanline length must exactly match 320x256 RGB8');
const repairedIdat=zlib.deflateSync(raw,{level:9});
assert.deepEqual(zlib.inflateSync(repairedIdat),raw,'repaired zlib stream must round-trip');

const out=[signature];
let inserted=false;
for(const chunk of chunks){
  if(chunk.type==='IDAT'){
    if(!inserted){out.push(makeChunk('IDAT',repairedIdat));inserted=true;}
    continue;
  }
  out.push(makeChunk(chunk.type,chunk.data));
}
const repaired=Buffer.concat(out);
const chunkSummary=chunks.map(c=>`${c.type}:${c.data.length}:${c.crcOk?'crc-ok':'crc-bad'}`).join(',');
console.log('PNG_CHUNKS='+chunkSummary);
console.log('RAW_BYTES='+raw.length);
console.log('ORIGINAL_SHA256='+crypto.createHash('sha256').update(png).digest('hex'));
console.log('REPAIRED_SHA256='+crypto.createHash('sha256').update(repaired).digest('hex'));
console.log('REPAIRED_BYTES='+repaired.length);
console.log('PIXEL_STREAM_SHA256='+crypto.createHash('sha256').update(raw).digest('hex'));
console.log('NORMAL_INFLATE_OK='+normalOk);
console.log('REPAIRED_BASE64='+repaired.toString('base64'));
