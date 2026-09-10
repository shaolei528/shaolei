import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../terrain-v21.js',import.meta.url),'utf8');
const boot=fs.readFileSync(new URL('../survival-v21.html',import.meta.url),'utf8');
const png=fs.readFileSync(new URL('../assets/art-v21/terrain-v21.png',import.meta.url));

const sandbox={console,window:null,performance:{now:()=>0}};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'terrain-v21.js'});
const api=sandbox.ABYSSAL_TERRAIN_V21;
assert.ok(api,'V21 terrain API must be exposed');
assert.equal(api.version,21);
assert.equal(api.tileSize,64,'terrain art grid must remain 64x64');
assert.equal(api.sheetPath,'assets/art-v21/terrain-v21.png');

assert.equal(api.rawMaterial(12,10),'road','camp center route should be authored terrain, not water');
assert.equal(api.collisionAtWorld(2400,2400),'walkable','safe-camp center must remain walkable');
assert.equal(api.collisionAtWorld(1000,1000),'legacy','outside vertical slice must preserve legacy collision behavior');

let foundWater=false,foundSand=false,foundGrass=false;
for(let row=0;row<20;row++)for(let col=0;col<24;col++){
  const m=api.rawMaterial(col,row);
  foundWater ||= m==='water';foundSand ||= m==='sand';foundGrass ||= m==='grass';
}
assert.ok(foundWater&&foundSand&&foundGrass,'slice must contain grass, sand and water');

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

assert.ok(source.includes('const baseSendMove='),'terrain adapter must canonicalize collision before legacy movement packets are sent');
assert.ok(source.includes('const baseUpdate='),'terrain adapter must resolve local movement every simulation update');
assert.ok(source.includes('drawGround=function(W,H)'),'terrain adapter must preserve legacy ground as a fallback');
const terrainIndex=boot.indexOf("'terrain-v21.js'");
const renderV9Index=boot.indexOf("'render-v9.js'");
const motionIndex=boot.indexOf("'smooth-motion-v18.js'");
assert.ok(terrainIndex>=0&&terrainIndex<renderV9Index,'V21 terrain must load before the extended render loop');
assert.ok(terrainIndex<motionIndex,'terrain collision must be present before smooth-motion wraps update');
assert.ok(boot.includes("const VER='21a'"),'V21a cache key must be present');

for(const forbidden of ['new WebSocket(',"event:'move'","event:'attack'",'zoneCh.send(','RELAY_URL']){
  assert.equal(source.includes(forbidden),false,`terrain slice must not alter multiplayer transport/payload semantics: ${forbidden}`);
}

console.log(JSON.stringify({ok:true,tileSize:64,terrain:['grass','sand','water','shore','road'],collision:'separate-explicit',dashTunneling:'blocked',network:'unchanged'}));
