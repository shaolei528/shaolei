import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const routeSource=read('modules/ui/route-guidance-v1.js');
const rendererSource=read('prototypes/successor-3-4/successor-renderer.js');
const projected=[],labels=[];
const ctx={
  save(){},restore(){},setTransform(){},fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},fill(){},
  measureText(text){return{width:String(text).length*6};},
  fillText(text){labels.push(String(text));}
};
const sandbox={globalThis:null,width:800,height:600};
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(routeSource,sandbox,{filename:'route-guidance-v1.js'});
const base={
  zone:'1:0',player:{x:2100,y:1100},inventory:{knife:true,shard:1},
  availableResources:[{id:'poi:store:residue-shard-a',type:'shard',x:2120,y:1110}],
  mobs:[
    {id:'poi:store:crawler-dead',x:2102,y:1102,hp:0},
    {id:'poi:store:crawler-far',x:2450,y:1250,hp:58},
    {id:'poi:store:crawler-near',x:2300,y:1200,hp:20}
  ],
  hasDefeatedCreature:false,phase:'SEARCH_FIGHT',camp:{x:2400,y:2400},worldZone:1600,
  dpr:1,width:800,height:600,now:0,worldNow:0,
  projectViewport(x,y){projected.push([x,y]);return{x:400,y:300};}
};

assert.equal(sandbox.ABYSSAL_ROUTE_GUIDANCE_V1.draw(ctx,base),true);
assert.deepEqual(projected,[[2300,1200]],'before the encounter is secured, the route marker targets the nearest living authored crawler');
assert.ok(labels.includes('击退爬行者'),'the marker tells the player which encounter to approach');
assert.ok(!labels.includes('异质碎片'),'the marker does not send the player to loot before the required kill');

projected.length=0;labels.length=0;
assert.equal(sandbox.ABYSSAL_ROUTE_GUIDANCE_V1.draw(ctx,{...base,hasDefeatedCreature:true}),true);
assert.deepEqual(projected,[[2120,1110]],'after a confirmed kill, the marker advances to the nearest required salvage');
assert.ok(labels.includes('异质碎片'),'the next marker identifies the required salvage');

assert.ok(rendererSource.includes('mobs:mobs.map(mob=>({...mob}))'),'the live renderer supplies current encounter snapshots');
assert.ok(rendererSource.includes('hasDefeatedCreature:window.ABYSSAL_EXPEDITION_LOOP_V1?.state?.hasDefeatedCreature===true'),'the live renderer supplies the expedition kill proof');
console.log(JSON.stringify({ok:true,route:['living crawler','required salvage'],nearestTarget:true,deadTargetsIgnored:true}));
