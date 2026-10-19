import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const patchSource=fs.readFileSync('modules/safe-camp/game-v7-patch.js','utf8');
const loaderSource=fs.readFileSync('survival-v21.html','utf8');
const worldSource=fs.readFileSync('modules/world/world-state.js','utf8');
const recipeData=JSON.parse(fs.readFileSync('data/crafting/recipes-v1.json','utf8'));
const waterConfig=JSON.parse(fs.readFileSync('data/world/water-bodies-v1.json','utf8'));
const addResourcesAssignment=patchSource.match(/addCampResources=function\(\)\{[^]*?\};/)?.[0];
const seedZoneDefinition=worldSource.match(/function seedZone\(zone\)\{[^]*?\}function freshMob/)?.[0]?.replace(/function freshMob$/,'');

assert.ok(addResourcesAssignment,'SafeCamp must provide a deterministic starter-resource layout');
assert.ok(seedZoneDefinition,'the active world module must define seedZone before its mob helper');
const worldLoad=loaderSource.indexOf("'modules/world/world-state.js'");
const safeCampLoad=loaderSource.indexOf("'modules/safe-camp/game-v7-patch.js'");
const interactionLoad=loaderSource.indexOf("'modules/input/interaction-v12.js'");
assert.ok(
  worldLoad>=0&&safeCampLoad>worldLoad&&interactionLoad>safeCampLoad,
  'world seeding must load before the SafeCamp override, which must load before interaction guidance'
);
assert.match(patchSource,/CAMP\.r=500;/,'the reviewed starter resources rely on the SafeCamp protection radius');
assert.equal(recipeData.recipes.knife.costs.wood,4,'the first weapon data must preserve its 4-wood cost');
assert.equal(recipeData.recipes.knife.costs.stone,3,'the first weapon data must preserve its 3-stone cost');
assert.equal(recipeData.recipes.knife.gathering.woodHits,2,'the crafted knife must carry its authored wood-gathering modifier');
assert.ok(loaderSource.includes("fetch('./data/crafting/recipes-v1.json?v='+VER"),'V21 must load the data-owned recipe before crafting starts');

const sandbox=vm.createContext({resources:[],CAMP:{x:2400,y:2400,r:500}});
vm.runInContext(`${addResourcesAssignment}; addCampResources();`,sandbox);
const campResources=sandbox.resources;
const count=type=>campResources.filter(resource=>resource.type===type).length;
assert.ok(count('wood')>=4,`SafeCamp must provide the 4 wood needed for a knife; found ${count('wood')}`);
assert.ok(count('stone')>=3,`SafeCamp must provide the 3 stone needed for a knife; found ${count('stone')}`);
assert.ok(campResources.every(resource=>Math.hypot(resource.x-sandbox.CAMP.x,resource.y-sandbox.CAMP.y)<sandbox.CAMP.r),
  'every deterministic starter material must be reachable inside the protection radius');
for(const resource of campResources){
  for(const body of waterConfig.bodies.filter(item=>item.anchor==='camp')){
    const centerX=sandbox.CAMP.x+body.offset.x,centerY=sandbox.CAMP.y+body.offset.y;
    const halfWidth=body.halfWidth+body.collisionPadding+14,halfHeight=body.halfHeight+body.collisionPadding+14;
    const left=centerX-halfWidth,right=centerX+halfWidth,top=centerY-halfHeight,bottom=centerY+halfHeight;
    const insideExpandedWater=resource.x>=left&&resource.x<=right&&resource.y>=top&&resource.y<=bottom;
    if(insideExpandedWater){
      const exitDistance=Math.min(resource.x-left,right-resource.x,resource.y-top,bottom-resource.y);
      assert.ok(exitDistance<77,`${resource.id} must have a dry standing point within interaction range of camp water`);
    }
  }
}

// Run the active zone seeder with the SafeCamp override installed, as happens
// after the module loader has loaded the whole V21 module list.
const seeded=vm.createContext({
  resources:[],
  CAMP:{x:2400,y:2400,r:500},
  WORLD:{zone:3200},
  hash:()=>0.5,
  campDist:(x,y)=>Math.hypot(x-2400,y-2400)
});
vm.runInContext(`${addResourcesAssignment}; ${seedZoneDefinition}; seedZone('1:1');`,seeded);
const seededCamp=seeded.resources.filter(resource=>resource.id.startsWith('camp:'));
assert.equal(seededCamp.length,14,'fresh SafeCamp seeding must invoke the active camp-resource override');
assert.ok(seededCamp.filter(resource=>resource.type==='wood').length>=7,'fresh SafeCamp must support the knife and lantern material loop');
assert.ok(seededCamp.filter(resource=>resource.type==='stone').length>=3,'fresh zero-inventory camp must contain enough stone for the knife');

assert.ok(patchSource.includes("if(until>now&&!String(rid).startsWith('camp:'))out.push([rid,until])"),
  'camp-only resources must be excluded from shared world snapshots');
assert.ok(patchSource.includes("const rid=String(p.rid||'');if(rid.startsWith('camp:'))return;"),
  'camp-only resource harvest events from other clients must be ignored');
assert.ok(patchSource.includes("if(!localCamp)zoneCh?.send({type:'broadcast',event:'harvest'"),
  'local SafeCamp harvests must not consume or broadcast shared world nodes');

console.log(JSON.stringify({ok:true,wood:count('wood'),stone:count('stone'),insideSafeCamp:campResources.length,freshSeedCampNodes:seededCamp.length,knifeCosts:{wood:4,stone:3},campHarvestIsolated:true}));
