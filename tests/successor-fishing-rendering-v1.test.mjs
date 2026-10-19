import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const fishingRenderer=read('modules/render/fishing-render-v1.js');
const successorRenderer=read('prototypes/successor-3-4/successor-renderer.js');
const fills=[];
let points=[];
const ctx={
  fillStyle:'',strokeStyle:'',lineWidth:1,imageSmoothingEnabled:true,
  save(){},restore(){},beginPath(){points=[]},moveTo(x,y){points.push([x,y])},lineTo(x,y){points.push([x,y])},
  closePath(){},fill(){fills.push({color:this.fillStyle,points:[...points]})},stroke(){},fillRect(){},clip(){}
};
const sandbox={
  ABYSSAL_FISHING_CONFIG_V1:{ponds:[{waterBodyId:'camp-pool'}]},
  ABYSSAL_WATER_BODIES_V1:{getBody:id=>id==='camp-pool'?{cx:200,cy:160,halfWidth:54,halfHeight:54,collisionPadding:64,access:{x:384,y:344}}:null}
};
sandbox.globalThis=sandbox;
vm.runInNewContext(fishingRenderer,sandbox,{filename:'fishing-render-v1.js'});
const api=sandbox.ABYSSAL_FISHING_RENDER_V1;
const project=(x,y)=>({x,y});

assert.equal(api.drawPond(ctx,project,0),true,'the water surface remains a separate ground layer');
assert.equal('drawAccessPier' in api,false,'the graybox does not draw a walkable-looking pier over the water edge');
assert.equal(api.drawPondFrontBank(ctx,project),true,'the front bank can be depth-sorted with world actors');
assert.equal(fills.at(-1).color,'#ad976c','the foreground bank redraws the widened dry shoreline');
assert.equal(fills.at(-1).points.length,6,'the foreground band covers only the near half of the pond');
assert.deepEqual(JSON.parse(JSON.stringify(api.frontBankSortAnchor('camp-pool',13))),{x:331,y:291},
  'the bank depth anchor includes the same padded shoreline used by collision and art');
assert.equal(api.frontBankSortAnchor('missing'),null,'unknown water bodies cannot create a depth-sorted bank');
assert.match(successorRenderer,/frontBankSortAnchor\?\.\('camp-pool',13\)/,
  'the renderer delegates the pond depth anchor to the water presentation module');
assert.doesNotMatch(successorRenderer,/drawAccessPier/,
  'the successor does not place a decorative pier across the shoreline');
assert.match(successorRenderer,/list\.sort\([\s\S]*?drawPond\?\.\(out,project,lastTime\)[\s\S]*?for\(const o of list\)\{if\(o\.kind==='pondBank'\)window\.ABYSSAL_FISHING_RENDER_V1\?\.drawPondFrontBank/,
  'the pond surface draws as ground and its front bank draws at the sorted depth');

console.log(JSON.stringify({ok:true,pond:'ground-layer',shore:'depth-sorted',collision:'unchanged'}));
