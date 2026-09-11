import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const path=new URL('../assets/art-v21/terrain-v21.png',import.meta.url);
const png=fs.readFileSync(path);
assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','PNG signature');

const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);return c>>>0;});
function crc32(buffer){let c=0xffffffff;for(const byte of buffer)c=crcTable[(c^byte)&0xff]^(c>>>8);return(c^0xffffffff)>>>0;}
function sha(buffer){return crypto.createHash('sha256').update(buffer).digest('hex');}

const chunks=[];let off=8,width=0,height=0,colorType=-1,bitDepth=-1;
while(off+8<=png.length){
  const length=png.readUInt32BE(off),type=png.toString('ascii',off+4,off+8),end=off+12+length;
  console.log(`CHUNK offset=${off} type=${JSON.stringify(type)} length=${length} end=${end}`);
  if(end>png.length){console.log('TRUNCATED_CHUNK='+JSON.stringify({off,length,type,end,missing:end-png.length}));break;}
  const data=png.subarray(off+8,off+8+length),stored=png.readUInt32BE(off+8+length),actual=crc32(Buffer.concat([Buffer.from(type),data]));
  chunks.push({type,data,stored,actual,crcOk:stored===actual});
  console.log(`CHUNK_CRC type=${type} stored=${stored.toString(16).padStart(8,'0')} actual=${actual.toString(16).padStart(8,'0')} ok=${stored===actual}`);
  if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);bitDepth=data[8];colorType=data[9];}
  off=end;if(type==='IEND')break;
}
assert.equal(width,320);assert.equal(height,256);assert.equal(bitDepth,8);assert.equal(colorType,2);
const idat=Buffer.concat(chunks.filter(c=>c.type==='IDAT').map(c=>c.data));
const raw=zlib.inflateRawSync(idat.subarray(2,-4));
console.log('RAW_BYTES='+raw.length);console.log('RAW_PARTIAL_SHA256='+sha(raw));

const stride=width*3,rowBytes=stride+1;
let p=0,prev=Buffer.alloc(stride);const rows=[];let invalid=null;
while(p+rowBytes<=raw.length){
  const rowIndex=rows.length,filter=raw[p++];
  if(filter<0||filter>4){invalid={row:rowIndex,filter};console.log('INVALID_FILTER='+JSON.stringify(invalid));break;}
  const scan=Buffer.from(raw.subarray(p,p+stride));p+=stride;
  for(let x=0;x<stride;x++){
    const a=x>=3?scan[x-3]:0,b=prev[x],c=x>=3?prev[x-3]:0;
    if(filter===1)scan[x]=(scan[x]+a)&255;
    else if(filter===2)scan[x]=(scan[x]+b)&255;
    else if(filter===3)scan[x]=(scan[x]+Math.floor((a+b)/2))&255;
    else if(filter===4){const q=a+b-c,pa=Math.abs(q-a),pb=Math.abs(q-b),pc=Math.abs(q-c);scan[x]=(scan[x]+(pa<=pb&&pa<=pc?a:pb<=pc?b:c))&255;}
  }
  rows.push(scan);prev=scan;
}
console.log('VALID_PIXEL_ROWS='+rows.length);
for(const n of [1,8,16,32])if(rows.length>=n)console.log(`PIXEL_PREFIX_${n}_SHA256=`+sha(Buffer.concat(rows.slice(0,n))));
console.log('EXPECTED_RAW_BYTES='+(height*rowBytes));
assert.equal(raw.length,height*rowBytes,'corrupt repository PNG is incomplete; diagnostic should stay red until asset replacement');
