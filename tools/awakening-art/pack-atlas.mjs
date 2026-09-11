import fs from 'node:fs';
import path from 'node:path';
import {decodePng,encodeRgbaPng} from './png.mjs';
import {ID_RE} from './validator.mjs';

function alignUp(v,a){return Math.ceil(v/a)*a;}
export async function packAtlas(items,{maxWidth=1024,align=1,padding=0}={}){
  if(!Number.isInteger(maxWidth)||maxWidth<=0)throw new Error('maxWidth must be a positive integer');
  if(!Number.isInteger(align)||align<=0)throw new Error('align must be a positive integer');
  if(!Number.isInteger(padding)||padding<0)throw new Error('padding must be an integer >= 0');
  const decoded=[];
  for(const item of items){
    if(!ID_RE.test(item.id||''))throw new Error(`invalid asset id ${item.id}`);
    const png=await decodePng(fs.readFileSync(item.file));
    if(png.width>maxWidth)throw new Error(`${item.id} width ${png.width} exceeds maxWidth ${maxWidth}`);
    decoded.push({...item,png});
  }
  let x=0,y=0,rowH=0,usedW=0,placements=[];
  for(const item of decoded){
    x=alignUp(x,align);
    if(x>0&&x+item.png.width>maxWidth){x=0;y=alignUp(y+rowH+padding,align);rowH=0;}
    const px=alignUp(x,align),py=alignUp(y,align);
    placements.push({id:item.id,x:px,y:py,w:item.png.width,h:item.png.height,file:item.file});
    x=px+item.png.width+padding;rowH=Math.max(rowH,item.png.height);usedW=Math.max(usedW,px+item.png.width);
  }
  const width=alignUp(Math.max(1,usedW),align),height=alignUp(Math.max(1,y+rowH),align);
  const rgba=Buffer.alloc(width*height*4);
  for(let i=0;i<rgba.length;i+=4){rgba[i]=0;rgba[i+1]=0;rgba[i+2]=0;rgba[i+3]=0;}
  for(let n=0;n<decoded.length;n++){
    const src=decoded[n].png,p=placements[n];
    for(let row=0;row<src.height;row++){
      const from=row*src.width*4,to=((p.y+row)*width+p.x)*4;
      src.rgba.copy(rgba,to,from,from+src.width*4);
    }
  }
  return{width,height,rgba,placements};
}
function parseArgs(argv){
  const o={maxWidth:1024,align:1,padding:0,inputs:[]};
  for(let i=0;i<argv.length;i++){
    const a=argv[i];
    if(a==='--out')o.out=argv[++i];
    else if(a==='--map')o.map=argv[++i];
    else if(a==='--max-width')o.maxWidth=Number(argv[++i]);
    else if(a==='--align')o.align=Number(argv[++i]);
    else if(a==='--padding')o.padding=Number(argv[++i]);
    else o.inputs.push(a);
  }
  return o;
}
if(import.meta.url===new URL(process.argv[1],'file:').href){
  const a=parseArgs(process.argv.slice(2));
  if(!a.out||!a.inputs.length){console.error('usage: node tools/awakening-art/pack-atlas.mjs --out atlas.png [--map atlas.json] [--max-width 1024] [--align 64] <png...>');process.exit(2);}
  try{
    const items=a.inputs.map(file=>({file:path.resolve(file),id:path.basename(file,'.png')}));
    const packed=await packAtlas(items,a);
    fs.mkdirSync(path.dirname(path.resolve(a.out)),{recursive:true});
    fs.writeFileSync(a.out,await encodeRgbaPng(packed.width,packed.height,packed.rgba));
    const map={width:packed.width,height:packed.height,assets:packed.placements.map(p=>({id:p.id,sourceRect:{x:p.x,y:p.y,w:p.w,h:p.h}}))};
    if(a.map){fs.mkdirSync(path.dirname(path.resolve(a.map)),{recursive:true});fs.writeFileSync(a.map,JSON.stringify(map,null,2)+'\n');}
    console.log(JSON.stringify(map,null,2));
  }catch(err){console.error(`[awakening-art] atlas pack failed: ${err.message}`);process.exit(1);}
}
