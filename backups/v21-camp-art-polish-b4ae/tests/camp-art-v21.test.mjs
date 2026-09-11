import fs from 'node:fs';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';

const props=fs.readFileSync(new URL('../assets/camp_props.png',import.meta.url));
assert.equal(props.toString('ascii',1,4),'PNG');
assert.equal(props.readUInt32BE(16),192,'camp prop sheet width must remain 4x48');
assert.equal(props.readUInt32BE(20),96,'camp prop sheet height must remain 2x48');

function decodePngRGBA(buffer){
  let off=8,width=0,height=0,raw=[];
  while(off<buffer.length){
    const len=buffer.readUInt32BE(off),type=buffer.toString('ascii',off+4,off+8),data=buffer.subarray(off+8,off+8+len);
    off+=12+len;
    if(type==='IHDR'){
      width=data.readUInt32BE(0);height=data.readUInt32BE(4);
      assert.equal(data[8],8,'camp props must remain PNG8');
      assert.equal(data[9],6,'camp props must remain RGBA');
    }
    if(type==='IDAT')raw.push(data);
    if(type==='IEND')break;
  }
  const inflated=zlib.inflateSync(Buffer.concat(raw)),stride=width*4,rows=[];
  let p=0,prev=Buffer.alloc(stride);
  for(let y=0;y<height;y++){
    const filter=inflated[p++],scan=Buffer.from(inflated.subarray(p,p+stride));p+=stride;
    for(let x=0;x<stride;x++){
      const a=x>=4?scan[x-4]:0,b=prev[x],c=x>=4?prev[x-4]:0;
      if(filter===1)scan[x]=(scan[x]+a)&255;
      else if(filter===2)scan[x]=(scan[x]+b)&255;
      else if(filter===3)scan[x]=(scan[x]+Math.floor((a+b)/2))&255;
      else if(filter===4){const q=a+b-c,pa=Math.abs(q-a),pb=Math.abs(q-b),pc=Math.abs(q-c);scan[x]=(scan[x]+(pa<=pb&&pa<=pc?a:pb<=pc?b:c))&255;}
      else assert.equal(filter,0);
    }
    rows.push(scan);prev=scan;
  }
  return{width,height,rows};
}

const decoded=decodePngRGBA(props);
for(let frame=0;frame<8;frame++){
  const fx=(frame%4)*48,fy=Math.floor(frame/4)*48;
  let opaque=0;
  for(let y=fy;y<fy+48;y++)for(let x=fx;x<fx+48;x++)if(decoded.rows[y][x*4+3]>0)opaque++;
  assert.ok(opaque>=30,`camp prop frame ${frame} must contain visible pixel art`);
}

console.log(JSON.stringify({ok:true,sheet:'192x96',frames:8,frameSize:'48x48',alpha:'valid',layout:'unchanged'}));
