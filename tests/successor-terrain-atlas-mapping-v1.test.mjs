import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const renderer=fs.readFileSync(new URL('../prototypes/successor-3-4/successor-renderer.js',import.meta.url),'utf8');
const start=renderer.indexOf('function drawDiamond(');
const end=renderer.indexOf('function terrainDraw(',start);
assert.ok(start>=0&&end>start,'successor terrain diamond renderer must exist');
const drawCalls=[],transforms=[];
const tileImage={kind:'production-terrain-sheet'};
const sandbox={
  project:(x,y)=>({x,y}),proofTerrainActive:false,proofTerrainPass:'revise-pass-2',currentZone:'1:1',proofTilesReady:false,legacyTilesReady:true,legacyTiles:tileImage,proofTiles:{kind:'isolated-proof-terrain'},
  terrain:{artPreview:false,tile:{grass_a:0,grass_b:1,grass_flowers:2,sand_a:3,sand_b:4,road_a:5,road_b:6,water_a:7,water_b:8,shore_n:9,shore_s:10,shore_e:11,shore_w:12,shore_ne:13,shore_nw:14,shore_se:15,shore_sw:16,grass_to_sand_e:17,grass_to_sand_w:18,sand_pebbles:19}},
  out:{
    imageSmoothingEnabled:true,fillStyle:'',beginPath(){},moveTo(){},lineTo(){},closePath(){},save(){},clip(){},restore(){},fill(){},
    translate(x,y){transforms.push(['translate',x,y]);},
    scale(x,y){transforms.push(['scale',x,y]);},
    drawImage(...args){drawCalls.push(args);}
  }
};
vm.createContext(sandbox);
vm.runInContext(`${renderer.slice(start,end)}\nglobalThis.drawDiamond=drawDiamond;`,sandbox,{filename:'successor-terrain-atlas-mapping.js'});

sandbox.drawDiamond(1,0,0,64);
assert.equal(drawCalls.at(-1)[0],tileImage);
assert.deepEqual(drawCalls.at(-1).slice(1,5),[0,0,64,64],'grass_b must sample the actual grass cell in the shipped sheet');
assert.deepEqual(transforms,[['translate',32,32],['scale',-1,1]],'grass_b must mirror the real grass texture for variation');

drawCalls.length=0;transforms.length=0;
sandbox.drawDiamond(2,0,0,64);
assert.deepEqual(drawCalls.at(-1).slice(1,5),[0,0,64,64],'grass_flowers must not sample the sand cell while no production flower cell exists');
assert.deepEqual(transforms,[['translate',32,32],['scale',1,-1]],'grass_flowers keeps a distinct mirrored grass variation until authored art is available');

drawCalls.length=0;transforms.length=0;
sandbox.drawDiamond(3,0,0,64);
assert.deepEqual(drawCalls.at(-1).slice(1,5),[192,0,64,64],'sand_a must retain its current atlas cell');
assert.deepEqual(transforms,[],'non-grass terrain must not be mirrored');

sandbox.terrain.artPreview=true;drawCalls.length=0;transforms.length=0;
sandbox.drawDiamond(1,0,0,64);
assert.deepEqual(drawCalls.at(-1).slice(1,5),[64,0,64,64],'explicit art preview must retain its own cell mapping');
assert.deepEqual(transforms,[],'art preview variants must not inherit the production-sheet workaround');

sandbox.terrain.artPreview=false;sandbox.proofTerrainActive=true;sandbox.proofTilesReady=true;drawCalls.length=0;transforms.length=0;
sandbox.drawDiamond(1,64,128,64);
assert.equal(drawCalls.at(-1)[0],sandbox.proofTiles,'the explicitly gated local draft must sample the candidate atlas');
assert.deepEqual(drawCalls.at(-1).slice(1,5),[0,0,128,64],'grass uses the native 128x64 candidate cell');
assert.deepEqual(drawCalls.at(-1).slice(5),[64,144,64,32],'native candidate is projected into the existing 64x32 world diamond');

drawCalls.length=0;
sandbox.drawDiamond(8,128,64,64);
assert.equal(drawCalls.at(-1)[0],sandbox.proofTiles,'water IDs must select the isolated candidate atlas');
assert.deepEqual(drawCalls.at(-1).slice(1,5),[0,192,128,64],'water IDs map to the water atlas row');

sandbox.proofTerrainPass='revise-pass-3';drawCalls.length=0;
sandbox.drawDiamond(17,0,0,64);
assert.equal(drawCalls.length,2,'grass-to-sand east transition must layer a sand wedge over its authored grass cell');
assert.equal(drawCalls[0][0],sandbox.proofTiles);
assert.equal(drawCalls[0][2],0,'transition base remains on the grass row');
assert.equal(drawCalls[1][2],128,'east transition overlay samples the sand row');
drawCalls.length=0;
sandbox.drawDiamond(18,0,0,64);
assert.equal(drawCalls.length,2,'grass-to-sand west transition must use the same two-layer tile treatment');
assert.equal(drawCalls[1][2],128,'west transition overlay samples the sand row');
drawCalls.length=0;
sandbox.drawDiamond(11,0,0,64);
assert.ok([0,128].includes(drawCalls[0][1]),'east shore selects one of its two compatible edge variants');
assert.equal(drawCalls[0][2],256,'east shore uses the authored shore row');
drawCalls.length=0;
sandbox.drawDiamond(15,0,0,64);
assert.equal(drawCalls[0][1],256,'southeast shore uses the authored corner variant');
assert.equal(drawCalls[0][2],256,'southeast shore uses the authored shore row');

drawCalls.length=0;sandbox.currentZone='1:0';
sandbox.proofTerrainPass='revise-pass-3';
sandbox.drawDiamond(1,0,0,64);
assert.equal(drawCalls.at(-1)[0],tileImage,'the draft atlas is restricted to SafeCamp and cannot leak into the expedition');

console.log('PASS production and legacy mappings remain unchanged; gated SafeCamp draft uses native 128x64 cells and stays out of the expedition');
