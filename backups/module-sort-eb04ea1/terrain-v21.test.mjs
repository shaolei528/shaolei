import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../terrain-v21.js',import.meta.url),'utf8');
const boot=fs.readFileSync(new URL('../survival-v21.html',import.meta.url),'utf8');
const preview=fs.readFileSync(new URL('../terrain-v21-preview.html',import.meta.url),'utf8');
const png=fs.readFileSync(new URL('../assets/art-v21/terrain-v21.png',import.meta.url));

let legacyDraws=0,drawImages=0;
class FakeImage{
  set src(value){this._src=value;this.complete=true;this.naturalWidth=320;queueMicrotask(()=>this.onload?.());}
  get src(){return this._src;}
}
const fakeCtx={
  imageSmoothingEnabled:true,fillStyle:'',strokeStyle:'',globalAlpha:1,lineWidth:1,
  save(){},restore(){},fillRect(){},strokeRect(){},beginPath(){},rect(){},arc(){},fill(){},drawImage(){drawImages++;}
};
const sandbox={
  console,window:null,performance:{now:()=>0},Image:FakeImage,queueMicrotask,
  camera:{x:2400,y:2400},currentZone:'1:1',ctx:fakeCtx,
  drawGround(){legacyDraws++;},
  update(){},sendMove(){},
  me:{x:2400,y:2400,r:14},
  addEventListener(){},
};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'terrain-v21.js'});
await Promise.resolve();
const api=sandbox.ABYSSAL_TERRAIN_V21;
assert.ok(api,'V21 terrain API must be exposed');
assert.equal(api.version,21);
assert.equal(api.tileSize,64,'terrain art grid must remain 64x64');
assert.equal(api.sheetPath,'assets/art-v21/terrain-v21.png');
assert.equal(api.terrainMap.length,24*20,'terrain map must cover the authored slice');
assert.equal(api.collisionMap.length,24*20,'collision map must be an independent authored layer');

assert.equal(api.rawMaterial(12,10),'road','camp center route should be authored terrain, not water');
assert.equal(api.collisionAtWorld(2400,2400),'walkable','safe-camp center must remain walkable');
assert.equal(api.collisionAtWorld(1000,1000),'legacy','outside vertical slice must preserve legacy collision behavior');

let foundWater=false,foundSand=false,foundGrass=false,foundRoad=false;
for(let row=0;row<20;row++)for(let col=0;col<24;col++){
  const m=api.rawMaterial(col,row);
  foundWater ||= m==='water';foundSand ||= m==='sand';foundGrass ||= m==='grass';foundRoad ||= m==='road';
}
assert.ok(foundWater&&foundSand&&foundGrass&&foundRoad,'slice must contain grass, sand, water and road');

const campCell=api.worldToCell(2400,2400);
const campIndex=campCell.row*24+campCell.col;
const originalVisual=api.terrainMap[campIndex];
api.terrainMap[campIndex]=api.tile.water_a;
assert.equal(api.collisionAtWorld(2400,2400),'walkable','collision must not be inferred from visual terrain tile ids');
api.terrainMap[campIndex]=originalVisual;

const east=api.slice.originX+api.slice.width-20;
const midY=api.slice.originY+10*64+32;
assert.equal(api.isBlockedPoint(east,midY),true,'east shoreline water must be blocked');
const startX=api.slice.originX+16*64;
const dash=api.resolveMovement(startX,midY,east,midY,10);
assert.equal(dash.blocked,true,'high-speed movement crossing water must collide');
assert.ok(dash.x<east-8,'segment sampling must prevent dash tunneling into water');
assert.equal(api.isBlockedCircle(dash.x,dash.y,10),false,'resolved position must remain walkable');

assert.equal(png.readUInt32BE(16),320,'tilesheet width must be 5x64');
assert.equal(png.readUInt32BE(20),256,'tilesheet height must be 4x64');

// Repeating full-material tiles must have matching outer edges for seam-safe nearest-neighbor repetition.
const zlib=await import('node:zlib');
function decodePngRGB(buffer){
  assert.equal(buffer.toString('ascii',1,4),'PNG');
  let off=8,width=0,height=0,raw=[];
  while(off<buffer.length){const len=buffer.readUInt32BE(off),type=buffer.toString('ascii',off+4,off+8),data=buffer.subarray(off+8,off+8+len);off+=12+len;if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);assert.equal(data[8],8);assert.equal(data[9],2);}if(type==='IDAT')raw.push(data);if(type==='IEND')break;}
  const inflated=zlib.inflateSync(Buffer.concat(raw)),stride=width*3,rows=[];let p=0,prev=Buffer.alloc(stride);
  for(let y=0;y<height;y++){const filter=inflated[p++],scan=Buffer.from(inflated.subarray(p,p+stride));p+=stride;for(let x=0;x<stride;x++){const a=x>=3?scan[x-3]:0,b=prev[x],c=x>=3?prev[x-3]:0;if(filter===1)scan[x]=(scan[x]+a)&255;else if(filter===2)scan[x]=(scan[x]+b)&255;else if(filter===3)scan[x]=(scan[x]+Math.floor((a+b)/2))&255;else if(filter===4){const q=a+b-c,pa=Math.abs(q-a),pb=Math.abs(q-b),pc=Math.abs(q-c);scan[x]=(scan[x]+(pa<=pb&&pa<=pc?a:pb<=pc?b:c))&255;}else assert.equal(filter,0);}rows.push(scan);prev=scan;}return{width,height,rows};
}
const decoded=decodePngRGB(png);
for(const tileId of [api.tile.grass_a,api.tile.grass_b,api.tile.sand_a,api.tile.sand_b,api.tile.road_a,api.tile.road_b,api.tile.water_a,api.tile.water_b]){
  const tx=(tileId%5)*64,ty=Math.floor(tileId/5)*64;
  for(let y=0;y<64;y++)assert.deepEqual(decoded.rows[ty+y].subarray(tx*3,tx*3+3),decoded.rows[ty+y].subarray((tx+63)*3,(tx+64)*3),`tile ${tileId} left/right seam`);
  assert.deepEqual(Buffer.concat(decoded.rows.slice(ty,ty+1).map(r=>r.subarray(tx*3,(tx+64)*3))),Buffer.concat(decoded.rows.slice(ty+63,ty+64).map(r=>r.subarray(tx*3,(tx+64)*3))),`tile ${tileId} top/bottom seam`);
}

const before=drawImages;sandbox.drawGround(360,600);
assert.equal(legacyDraws,1,'legacy ground must render first for progressive replacement');
assert.ok(drawImages>before,'V21 renderer must overlay authored tiles after legacy ground');
assert.equal(fakeCtx.imageSmoothingEnabled,false,'terrain rendering must force nearest-neighbor smoothing off');
const afterInside=drawImages;sandbox.camera.x=200;sandbox.camera.y=200;sandbox.drawGround(360,600);
assert.equal(legacyDraws,2,'legacy ground must remain active outside the slice');
assert.equal(drawImages,afterInside,'V21 renderer must not replace terrain outside the authored slice');

assert.ok(source.includes("const legacyDrawGround=(typeof window.drawGround==='function')"),'terrain renderer must capture the real legacy global ground function');
assert.ok(source.includes('const baseSendMove='),'terrain adapter must canonicalize collision before legacy movement packets are sent');
assert.ok(source.includes('const baseUpdate='),'terrain adapter must resolve local movement every simulation update');
const terrainIndex=boot.indexOf("'terrain-v21.js'");
const renderV9Index=boot.indexOf("'render-v9.js'");
const motionIndex=boot.indexOf("'smooth-motion-v18.js'");
assert.ok(terrainIndex>=0&&terrainIndex<renderV9Index,'V21 terrain must load before the extended render loop');
assert.ok(terrainIndex<motionIndex,'terrain collision must be present before smooth-motion wraps update');
assert.ok(preview.includes('terrain-v21.js')&&preview.includes('Collision: OFF'),'static terrain preview must load V21 and expose collision debug');

for(const forbidden of ['new WebSocket(',"event:'move'","event:'attack'",'zoneCh.send(','RELAY_URL']){
  assert.equal(source.includes(forbidden),false,`terrain slice must not alter multiplayer transport/payload semantics: ${forbidden}`);
}

console.log(JSON.stringify({ok:true,tileSize:64,terrain:['grass','sand','water','shore','road'],collision:'separate-explicit',progressiveRenderer:true,dashTunneling:'blocked',staticPreview:true,network:'unchanged'}));
