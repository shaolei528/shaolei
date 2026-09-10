(()=>{
'use strict';

/*
  V21 terrain vertical slice.
  - 64x64 art/map grid around Mirewood Safe Camp.
  - World/network coordinates remain unchanged.
  - Visual terrain and collision are separate explicit data layers.
  - Outside the slice the legacy renderer/collision behavior remains untouched.
*/

const TILE_SIZE=64;
const SHEET_COLS=5;
const SHEET_PATH='assets/art-v21/terrain-v21.png';
const SLICE_COLS=24;
const SLICE_ROWS=20;
const FALLBACK_CAMP_X=2400;
const FALLBACK_CAMP_Y=2400;
const CAMP_X=(typeof CAMP!=='undefined'&&Number.isFinite(CAMP?.x))?CAMP.x:FALLBACK_CAMP_X;
const CAMP_Y=(typeof CAMP!=='undefined'&&Number.isFinite(CAMP?.y))?CAMP.y:FALLBACK_CAMP_Y;
const ORIGIN_X=CAMP_X-12*TILE_SIZE;
const ORIGIN_Y=CAMP_Y-10*TILE_SIZE;

const TILE={
  grass_a:0, grass_b:1, grass_flowers:2, sand_a:3, sand_b:4,
  road_a:5, road_b:6, water_a:7, water_b:8,
  shore_n:9, shore_s:10, shore_e:11, shore_w:12,
  shore_ne:13, shore_nw:14, shore_se:15, shore_sw:16,
  grass_to_sand_e:17, grass_to_sand_w:18, sand_pebbles:19
};
const TILE_NAMES=Object.fromEntries(Object.entries(TILE).map(([name,id])=>[id,name]));
const WATER_TILES=new Set([TILE.water_a,TILE.water_b]);
const SHORE_TILES=new Set([TILE.shore_n,TILE.shore_s,TILE.shore_e,TILE.shore_w,TILE.shore_ne,TILE.shore_nw,TILE.shore_se,TILE.shore_sw]);

function hash2(x,y,seed=0){
  let n=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(seed|0,69069))|0;
  n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;
  return(n>>>0)/4294967295;
}
function insideCell(col,row){return col>=0&&row>=0&&col<SLICE_COLS&&row<SLICE_ROWS;}
function coastLine(row){
  return 21.1-Math.max(0,row-3)*.28-Math.max(0,row-14)*.44;
}
function rawMaterial(col,row){
  if(!insideCell(col,row))return'legacy';
  const edge=coastLine(row);
  if(col>=Math.ceil(edge))return'water';
  if(col>=Math.ceil(edge)-2)return'sand';
  const vertical=(col>=11&&col<=12&&row>=2&&row<=10);
  const eastSpur=(row>=9&&row<=10&&col>=12&&col<=Math.floor(edge)-2);
  const westSpur=(row===10&&col>=7&&col<=11);
  if(vertical||eastSpur||westSpur)return'road';
  return'grass';
}
function materialNeighbor(col,row,dx,dy){return rawMaterial(col+dx,row+dy);}
function tileAtCell(col,row){
  const material=rawMaterial(col,row);
  if(material==='legacy')return null;
  const h=hash2(col,row,211);
  if(material==='water')return h>.52?TILE.water_b:TILE.water_a;
  if(material==='road')return h>.58?TILE.road_b:TILE.road_a;
  if(material==='sand'){
    const n=materialNeighbor(col,row,0,-1)==='water';
    const s=materialNeighbor(col,row,0,1)==='water';
    const e=materialNeighbor(col,row,1,0)==='water';
    const w=materialNeighbor(col,row,-1,0)==='water';
    if(n&&e)return TILE.shore_ne;
    if(n&&w)return TILE.shore_nw;
    if(s&&e)return TILE.shore_se;
    if(s&&w)return TILE.shore_sw;
    if(n)return TILE.shore_n;
    if(s)return TILE.shore_s;
    if(e)return TILE.shore_e;
    if(w)return TILE.shore_w;
    return h>.68?TILE.sand_pebbles:(h>.34?TILE.sand_b:TILE.sand_a);
  }
  const east=materialNeighbor(col,row,1,0);
  const west=materialNeighbor(col,row,-1,0);
  if(east==='sand')return TILE.grass_to_sand_e;
  if(west==='sand')return TILE.grass_to_sand_w;
  if(h>.88)return TILE.grass_flowers;
  return h>.47?TILE.grass_b:TILE.grass_a;
}
function worldToCell(x,y){
  const col=Math.floor((Number(x)-ORIGIN_X)/TILE_SIZE);
  const row=Math.floor((Number(y)-ORIGIN_Y)/TILE_SIZE);
  if(!insideCell(col,row))return null;
  return{col,row,lx:Number(x)-(ORIGIN_X+col*TILE_SIZE),ly:Number(y)-(ORIGIN_Y+row*TILE_SIZE)};
}
function isWaterPart(tile,lx,ly){
  if(WATER_TILES.has(tile))return true;
  if(!SHORE_TILES.has(tile))return false;
  const x=Number(lx),y=Number(ly),edgeLow=20,edgeHigh=42,r=34;
  if(tile===TILE.shore_n)return y<=edgeLow;
  if(tile===TILE.shore_s)return y>=edgeHigh;
  if(tile===TILE.shore_e)return x>=edgeHigh;
  if(tile===TILE.shore_w)return x<=edgeLow;
  if(tile===TILE.shore_ne)return Math.hypot(63-x,y)<=r;
  if(tile===TILE.shore_nw)return Math.hypot(x,y)<=r;
  if(tile===TILE.shore_se)return Math.hypot(63-x,63-y)<=r;
  if(tile===TILE.shore_sw)return Math.hypot(x,63-y)<=r;
  return false;
}
function collisionAtWorld(x,y){
  const cell=worldToCell(x,y);
  if(!cell)return'legacy';
  const tile=tileAtCell(cell.col,cell.row);
  return isWaterPart(tile,cell.lx,cell.ly)?'water':'walkable';
}
function isBlockedPoint(x,y){return collisionAtWorld(x,y)==='water';}
function isBlockedCircle(x,y,radius=10){
  const r=Math.max(0,Math.min(18,Number(radius)||0));
  if(isBlockedPoint(x,y))return true;
  if(r<=0)return false;
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;
    if(isBlockedPoint(x+Math.cos(a)*r,y+Math.sin(a)*r))return true;
  }
  return false;
}
function resolveMovement(fromX,fromY,toX,toY,radius=10){
  let x=Number(fromX),y=Number(fromY);
  const tx=Number(toX),ty=Number(toY);
  if(![x,y,tx,ty].every(Number.isFinite))return{x:Number(fromX)||0,y:Number(fromY)||0,blocked:false};
  const dist=Math.hypot(tx-x,ty-y);
  const steps=Math.max(1,Math.ceil(dist/8));
  let blocked=false;
  for(let i=1;i<=steps;i++){
    const wantX=fromX+(tx-fromX)*(i/steps);
    const wantY=fromY+(ty-fromY)*(i/steps);
    if(!isBlockedCircle(wantX,wantY,radius)){x=wantX;y=wantY;continue;}
    blocked=true;
    if(!isBlockedCircle(wantX,y,radius))x=wantX;
    if(!isBlockedCircle(x,wantY,radius))y=wantY;
  }
  return{x,y,blocked};
}

let debug=false;
let sheet=null;
let sheetReady=false;
if(typeof Image!=='undefined'){
  sheet=new Image();
  sheet.onload=()=>{sheetReady=true;};
  sheet.onerror=()=>{sheetReady=false;console.warn('[Abyssal V21 terrain] tilesheet failed to load; legacy ground remains available.');};
  sheet.src=SHEET_PATH;
}
function sliceIntersectsView(cameraX,cameraY,W,H){
  const left=cameraX-W/2,right=cameraX+W/2,top=cameraY-H/2,bottom=cameraY+H/2;
  const sliceRight=ORIGIN_X+SLICE_COLS*TILE_SIZE,sliceBottom=ORIGIN_Y+SLICE_ROWS*TILE_SIZE;
  return right>=ORIGIN_X&&left<=sliceRight&&bottom>=ORIGIN_Y&&top<=sliceBottom;
}
function debugWaterShape(context,tile,x,y){
  context.beginPath();
  if(WATER_TILES.has(tile)){context.rect(x,y,TILE_SIZE,TILE_SIZE);return;}
  if(tile===TILE.shore_n){context.rect(x,y,TILE_SIZE,21);return;}
  if(tile===TILE.shore_s){context.rect(x,y+42,TILE_SIZE,22);return;}
  if(tile===TILE.shore_e){context.rect(x+42,y,22,TILE_SIZE);return;}
  if(tile===TILE.shore_w){context.rect(x,y,21,TILE_SIZE);return;}
  const centers={
    [TILE.shore_ne]:[x+63,y],[TILE.shore_nw]:[x,y],
    [TILE.shore_se]:[x+63,y+63],[TILE.shore_sw]:[x,y+63]
  };
  const c=centers[tile];if(!c)return;
  context.arc(c[0],c[1],34,0,Math.PI*2);
}
function drawGround(args={}){
  const context=args.ctx;
  const cameraLike=args.camera;
  const W=Number(args.W)||0,H=Number(args.H)||0;
  if(!context||!cameraLike||args.currentZone!=='1:1'||!sheetReady||!sheet)return false;
  if(!sliceIntersectsView(cameraLike.x,cameraLike.y,W,H))return false;
  context.save();
  context.imageSmoothingEnabled=false;
  context.fillStyle='#466f54';context.fillRect(0,0,W,H);
  const minCol=Math.max(0,Math.floor((cameraLike.x-W/2-ORIGIN_X)/TILE_SIZE)-1);
  const maxCol=Math.min(SLICE_COLS-1,Math.ceil((cameraLike.x+W/2-ORIGIN_X)/TILE_SIZE)+1);
  const minRow=Math.max(0,Math.floor((cameraLike.y-H/2-ORIGIN_Y)/TILE_SIZE)-1);
  const maxRow=Math.min(SLICE_ROWS-1,Math.ceil((cameraLike.y+H/2-ORIGIN_Y)/TILE_SIZE)+1);
  const phase=Math.floor((typeof performance!=='undefined'?performance.now():0)/700)&1;
  for(let row=minRow;row<=maxRow;row++)for(let col=minCol;col<=maxCol;col++){
    let tile=tileAtCell(col,row);
    if(tile===null)continue;
    if(WATER_TILES.has(tile))tile=((tile+phase-7)&1)+7;
    const srcX=(tile%SHEET_COLS)*TILE_SIZE,srcY=Math.floor(tile/SHEET_COLS)*TILE_SIZE;
    const worldX=ORIGIN_X+col*TILE_SIZE,worldY=ORIGIN_Y+row*TILE_SIZE;
    const x=Math.round(worldX-cameraLike.x+W/2),y=Math.round(worldY-cameraLike.y+H/2);
    context.drawImage(sheet,srcX,srcY,TILE_SIZE,TILE_SIZE,x,y,TILE_SIZE,TILE_SIZE);
    if(debug){
      context.save();
      context.globalAlpha=.28;context.fillStyle='#4ab5ff';
      debugWaterShape(context,tile,x,y);context.fill();
      context.globalAlpha=.34;context.strokeStyle='#d7efe3';context.lineWidth=1;context.strokeRect(x+.5,y+.5,TILE_SIZE-1,TILE_SIZE-1);
      context.restore();
    }
  }
  context.restore();
  return true;
}
function setDebug(value){debug=!!value;return debug;}
function isDebug(){return debug;}

const API={
  version:21,tileSize:TILE_SIZE,sheetPath:SHEET_PATH,tile:TILE,tileNames:TILE_NAMES,
  slice:{originX:ORIGIN_X,originY:ORIGIN_Y,cols:SLICE_COLS,rows:SLICE_ROWS,width:SLICE_COLS*TILE_SIZE,height:SLICE_ROWS*TILE_SIZE},
  rawMaterial,tileAtCell,worldToCell,isWaterPart,collisionAtWorld,isBlockedPoint,isBlockedCircle,resolveMovement,drawGround,setDebug,isDebug
};
window.ABYSSAL_TERRAIN_V21=API;

const baseDrawGround=(typeof drawGround==='function')?drawGround:null;
if(baseDrawGround){
  drawGround=function(W,H){
    const rendered=API.drawGround({ctx,W,H,camera,currentZone});
    if(!rendered)return baseDrawGround(W,H);
  };
}

let movementOrigin=null;
const baseSendMove=(typeof sendMove==='function')?sendMove:null;
if(baseSendMove){
  sendMove=function(...args){
    if(movementOrigin&&typeof me!=='undefined'){
      const resolved=resolveMovement(movementOrigin.x,movementOrigin.y,me.x,me.y,Math.min(12,me.r||10));
      me.x=resolved.x;me.y=resolved.y;
    }
    return baseSendMove(...args);
  };
}
const baseUpdate=(typeof update==='function')?update:null;
if(baseUpdate){
  update=function(dt){
    if(typeof me==='undefined')return baseUpdate(dt);
    movementOrigin={x:me.x,y:me.y};
    try{
      const result=baseUpdate(dt);
      const resolved=resolveMovement(movementOrigin.x,movementOrigin.y,me.x,me.y,Math.min(12,me.r||10));
      me.x=resolved.x;me.y=resolved.y;
      return result;
    }finally{movementOrigin=null;}
  };
}
API.installed=!!(baseDrawGround&&baseUpdate);

if(typeof addEventListener==='function')addEventListener('keydown',event=>{
  if(event.code!=='F2'||event.repeat)return;
  const tag=String(event.target?.tagName||'').toUpperCase();
  if(tag==='INPUT'||tag==='TEXTAREA'||event.target?.isContentEditable)return;
  event.preventDefault();setDebug(!debug);
  try{toast?.(`碰撞调试：${debug?'开启':'关闭'}`);}catch{}
});
})();
