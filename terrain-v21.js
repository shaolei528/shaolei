(()=>{
'use strict';

/*
  V21 terrain vertical slice.
  - 64x64 art/map grid around Mirewood Safe Camp.
  - World/network coordinates remain unchanged.
  - Terrain render data and collision data are separate explicit layers.
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
  grass_a:0,grass_b:1,grass_flowers:2,sand_a:3,sand_b:4,
  road_a:5,road_b:6,water_a:7,water_b:8,
  shore_n:9,shore_s:10,shore_e:11,shore_w:12,
  shore_ne:13,shore_nw:14,shore_se:15,shore_sw:16,
  grass_to_sand_e:17,grass_to_sand_w:18,sand_pebbles:19
};
const TILE_NAMES=Object.fromEntries(Object.entries(TILE).map(([name,id])=>[id,name]));
const WATER_TILES=new Set([TILE.water_a,TILE.water_b]);

const COLLISION={
  walkable:0,water:1,shore_n:2,shore_s:3,shore_e:4,shore_w:5,
  shore_ne:6,shore_nw:7,shore_se:8,shore_sw:9
};
const COLLISION_NAMES=Object.fromEntries(Object.entries(COLLISION).map(([name,id])=>[id,name]));

function hash2(x,y,seed=0){
  let n=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(seed|0,69069))|0;
  n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;
  return(n>>>0)/4294967295;
}
function insideCell(col,row){return col>=0&&row>=0&&col<SLICE_COLS&&row<SLICE_ROWS;}
function coastLine(row){return 21.1-Math.max(0,row-3)*.28-Math.max(0,row-14)*.44;}
function authoredWater(col,row){
  if(!insideCell(col,row))return false;
  return col>=Math.ceil(coastLine(row));
}
function authoredSand(col,row){
  if(!insideCell(col,row)||authoredWater(col,row))return false;
  return col>=Math.ceil(coastLine(row))-2;
}
function rawMaterial(col,row){
  if(!insideCell(col,row))return'legacy';
  if(authoredWater(col,row))return'water';
  if(authoredSand(col,row))return'sand';
  const vertical=(col>=11&&col<=12&&row>=2&&row<=10);
  const eastSpur=(row>=9&&row<=10&&col>=12&&col<=Math.floor(coastLine(row))-2);
  const westSpur=(row===10&&col>=7&&col<=11);
  if(vertical||eastSpur||westSpur)return'road';
  return'grass';
}
function materialNeighbor(col,row,dx,dy){return rawMaterial(col+dx,row+dy);}
function chooseTile(col,row){
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

/* Visual terrain map: immutable tile ids for the authored slice. */
const TERRAIN_MAP=new Uint8Array(SLICE_COLS*SLICE_ROWS);
for(let row=0;row<SLICE_ROWS;row++)for(let col=0;col<SLICE_COLS;col++){
  TERRAIN_MAP[row*SLICE_COLS+col]=chooseTile(col,row);
}
function tileAtCell(col,row){return insideCell(col,row)?TERRAIN_MAP[row*SLICE_COLS+col]:null;}

/* Collision map is authored independently from visual tile ids. */
function chooseCollisionShape(col,row){
  if(!insideCell(col,row))return null;
  if(authoredWater(col,row))return COLLISION.water;
  if(!authoredSand(col,row))return COLLISION.walkable;
  const n=authoredWater(col,row-1),s=authoredWater(col,row+1),e=authoredWater(col+1,row),w=authoredWater(col-1,row);
  if(n&&e)return COLLISION.shore_ne;
  if(n&&w)return COLLISION.shore_nw;
  if(s&&e)return COLLISION.shore_se;
  if(s&&w)return COLLISION.shore_sw;
  if(n)return COLLISION.shore_n;
  if(s)return COLLISION.shore_s;
  if(e)return COLLISION.shore_e;
  if(w)return COLLISION.shore_w;
  return COLLISION.walkable;
}
const COLLISION_MAP=new Uint8Array(SLICE_COLS*SLICE_ROWS);
for(let row=0;row<SLICE_ROWS;row++)for(let col=0;col<SLICE_COLS;col++){
  COLLISION_MAP[row*SLICE_COLS+col]=chooseCollisionShape(col,row);
}
function collisionShapeAtCell(col,row){return insideCell(col,row)?COLLISION_MAP[row*SLICE_COLS+col]:null;}

function worldToCell(x,y){
  const nx=Number(x),ny=Number(y);
  if(!Number.isFinite(nx)||!Number.isFinite(ny))return null;
  const col=Math.floor((nx-ORIGIN_X)/TILE_SIZE),row=Math.floor((ny-ORIGIN_Y)/TILE_SIZE);
  if(!insideCell(col,row))return null;
  return{col,row,lx:nx-(ORIGIN_X+col*TILE_SIZE),ly:ny-(ORIGIN_Y+row*TILE_SIZE)};
}
function isWaterPart(shape,lx,ly){
  if(shape===COLLISION.water)return true;
  const x=Number(lx),y=Number(ly),edgeLow=20,edgeHigh=42,r=34;
  if(shape===COLLISION.shore_n)return y<=edgeLow;
  if(shape===COLLISION.shore_s)return y>=edgeHigh;
  if(shape===COLLISION.shore_e)return x>=edgeHigh;
  if(shape===COLLISION.shore_w)return x<=edgeLow;
  if(shape===COLLISION.shore_ne)return Math.hypot(63-x,y)<=r;
  if(shape===COLLISION.shore_nw)return Math.hypot(x,y)<=r;
  if(shape===COLLISION.shore_se)return Math.hypot(63-x,63-y)<=r;
  if(shape===COLLISION.shore_sw)return Math.hypot(x,63-y)<=r;
  return false;
}
function collisionAtWorld(x,y){
  const cell=worldToCell(x,y);
  if(!cell)return'legacy';
  return isWaterPart(collisionShapeAtCell(cell.col,cell.row),cell.lx,cell.ly)?'water':'walkable';
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
  const tx=Number(toX),ty=Number(toY),fx=Number(fromX),fy=Number(fromY);
  if(![x,y,tx,ty,fx,fy].every(Number.isFinite))return{x:fx||0,y:fy||0,blocked:false};
  const dist=Math.hypot(tx-x,ty-y),steps=Math.max(1,Math.ceil(dist/8));
  let blocked=false;
  for(let i=1;i<=steps;i++){
    const wantX=fx+(tx-fx)*(i/steps),wantY=fy+(ty-fy)*(i/steps);
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
  sheet.onerror=()=>{sheetReady=false;console.warn('[Abyssal V21 terrain] tilesheet failed to load; legacy ground remains visible.');};
  sheet.src=SHEET_PATH;
}
function sliceIntersectsView(cameraX,cameraY,W,H){
  const left=cameraX-W/2,right=cameraX+W/2,top=cameraY-H/2,bottom=cameraY+H/2;
  const sliceRight=ORIGIN_X+SLICE_COLS*TILE_SIZE,sliceBottom=ORIGIN_Y+SLICE_ROWS*TILE_SIZE;
  return right>=ORIGIN_X&&left<=sliceRight&&bottom>=ORIGIN_Y&&top<=sliceBottom;
}
function appendCollisionShape(context,shape,x,y){
  if(shape===COLLISION.water){context.rect(x,y,TILE_SIZE,TILE_SIZE);return true;}
  if(shape===COLLISION.shore_n){context.rect(x,y,TILE_SIZE,21);return true;}
  if(shape===COLLISION.shore_s){context.rect(x,y+42,TILE_SIZE,22);return true;}
  if(shape===COLLISION.shore_e){context.rect(x+42,y,22,TILE_SIZE);return true;}
  if(shape===COLLISION.shore_w){context.rect(x,y,21,TILE_SIZE);return true;}
  const centers={
    [COLLISION.shore_ne]:[x+63,y],[COLLISION.shore_nw]:[x,y],
    [COLLISION.shore_se]:[x+63,y+63],[COLLISION.shore_sw]:[x,y+63]
  };
  const c=centers[shape];if(!c)return false;
  context.arc(c[0],c[1],34,0,Math.PI*2);return true;
}
function renderTerrainGround(args={}){
  const context=args.ctx,cameraLike=args.camera,W=Number(args.W)||0,H=Number(args.H)||0;
  if(!context||!cameraLike||args.currentZone!=='1:1'||!sheetReady||!sheet)return false;
  if(!sliceIntersectsView(cameraLike.x,cameraLike.y,W,H))return false;
  context.save();context.imageSmoothingEnabled=false;
  const minCol=Math.max(0,Math.floor((cameraLike.x-W/2-ORIGIN_X)/TILE_SIZE)-1);
  const maxCol=Math.min(SLICE_COLS-1,Math.ceil((cameraLike.x+W/2-ORIGIN_X)/TILE_SIZE)+1);
  const minRow=Math.max(0,Math.floor((cameraLike.y-H/2-ORIGIN_Y)/TILE_SIZE)-1);
  const maxRow=Math.min(SLICE_ROWS-1,Math.ceil((cameraLike.y+H/2-ORIGIN_Y)/TILE_SIZE)+1);
  const phase=Math.floor((typeof performance!=='undefined'?performance.now():0)/700)&1;
  for(let row=minRow;row<=maxRow;row++)for(let col=minCol;col<=maxCol;col++){
    let tile=tileAtCell(col,row);
    if(WATER_TILES.has(tile))tile=((tile+phase-7)&1)+7;
    const srcX=(tile%SHEET_COLS)*TILE_SIZE,srcY=Math.floor(tile/SHEET_COLS)*TILE_SIZE;
    const worldX=ORIGIN_X+col*TILE_SIZE,worldY=ORIGIN_Y+row*TILE_SIZE;
    const x=Math.round(worldX-cameraLike.x+W/2),y=Math.round(worldY-cameraLike.y+H/2);
    context.drawImage(sheet,srcX,srcY,TILE_SIZE,TILE_SIZE,x,y,TILE_SIZE,TILE_SIZE);
    if(debug){
      const shape=collisionShapeAtCell(col,row);
      context.save();
      if(shape===COLLISION.walkable){context.globalAlpha=.07;context.fillStyle='#4bd27a';context.fillRect(x,y,TILE_SIZE,TILE_SIZE);}
      else{context.globalAlpha=.30;context.fillStyle='#4ab5ff';context.beginPath();appendCollisionShape(context,shape,x,y);context.fill();}
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
  collision:COLLISION,collisionNames:COLLISION_NAMES,
  slice:{originX:ORIGIN_X,originY:ORIGIN_Y,cols:SLICE_COLS,rows:SLICE_ROWS,width:SLICE_COLS*TILE_SIZE,height:SLICE_ROWS*TILE_SIZE},
  rawMaterial,tileAtCell,collisionShapeAtCell,worldToCell,isWaterPart,collisionAtWorld,isBlockedPoint,isBlockedCircle,resolveMovement,
  drawGround:renderTerrainGround,setDebug,isDebug,
  terrainMap:TERRAIN_MAP,collisionMap:COLLISION_MAP
};
window.ABYSSAL_TERRAIN_V21=API;

/* Preserve the legacy ground first, then overlay only authored V21 cells. */
const legacyDrawGround=(typeof window.drawGround==='function')?window.drawGround:null;
if(legacyDrawGround){
  window.drawGround=function(W,H){
    legacyDrawGround(W,H);
    return renderTerrainGround({ctx,W,H,camera,currentZone});
  };
}

let movementOrigin=null;
const baseSendMove=(typeof window.sendMove==='function')?window.sendMove:null;
if(baseSendMove){
  window.sendMove=function(...args){
    if(movementOrigin&&typeof me!=='undefined'){
      const resolved=resolveMovement(movementOrigin.x,movementOrigin.y,me.x,me.y,Math.min(12,me.r||10));
      me.x=resolved.x;me.y=resolved.y;
    }
    return baseSendMove(...args);
  };
}
const baseUpdate=(typeof window.update==='function')?window.update:null;
if(baseUpdate){
  window.update=function(dt){
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
API.installed=!!(legacyDrawGround&&baseUpdate);

if(typeof addEventListener==='function')addEventListener('keydown',event=>{
  if(event.code!=='F2'||event.repeat)return;
  const tag=String(event.target?.tagName||'').toUpperCase();
  if(tag==='INPUT'||tag==='TEXTAREA'||event.target?.isContentEditable)return;
  event.preventDefault();setDebug(!debug);
  try{toast?.(`碰撞调试：${debug?'开启':'关闭'}`);}catch{}
});
})();
