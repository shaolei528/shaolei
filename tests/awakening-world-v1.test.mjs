import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../modules/world/awakening-world-v1.js',import.meta.url),'utf8');
const boot=fs.readFileSync(new URL('../survival-v21.html',import.meta.url),'utf8');
const interaction=fs.readFileSync(new URL('../modules/input/interaction-v12.js',import.meta.url),'utf8');
const runtime=fs.readFileSync(new URL('../modules/core/runtime-state.js',import.meta.url),'utf8');
const combat=fs.readFileSync(new URL('../modules/combat/player-combat.js',import.meta.url),'utf8');
const contract=fs.readFileSync(new URL('../AWAKENING_ASSET_CONTRACT.md',import.meta.url),'utf8');

let groundCalls=0,campCalls=0,lightingCalls=0,drawImages=0,fillRects=0,questBaseCalls=0;
let now=1000;
const toasts=[];
class FakeImage{
  set src(value){this._src=value;this.complete=true;this.naturalWidth=320;queueMicrotask(()=>this.onload?.());}
  get src(){return this._src;}
}
const ctx={
  imageSmoothingEnabled:true,fillStyle:'',font:'',textAlign:'',globalAlpha:1,
  save(){},restore(){},drawImage(){drawImages++;},fillRect(){fillRects++;},fillText(){},
};
const CAMP={x:2400,y:2400,r:470,inner:330};
const sandbox={
  console,window:null,Image:FakeImage,queueMicrotask,
  performance:{now:()=>now},
  CAMP,
  camera:{x:2400,y:1280},canvas:{width:360,height:600},ctx,
  currentZone:'1:0',started:true,dead:false,hasLeftCamp:true,
  me:{x:2400,y:1280,r:14},inventory:{wood:4,stone:3,food:1,shard:0,knife:true,lantern:false},
  resources:[],mobs:[],questText:{textContent:''},
  toast(text){toasts.push(String(text));},
  drawGround(){groundCalls++;},drawCamp(){campCalls++;},drawLighting(){lightingCalls++;},
  update(){},sendMove(){},
  ABYSSAL_TERRAIN_V21:{
    tile:{grass_a:0,grass_b:1,grass_flowers:2,sand_a:3,sand_b:4,road_a:5,road_b:6,water_a:7,water_b:8},
    sheetPath:'assets/art-v21/terrain-v21.png'
  }
};
sandbox.window=sandbox;
sandbox.sx=x=>Math.round(x-sandbox.camera.x+sandbox.canvas.width/2);
sandbox.sy=y=>Math.round(y-sandbox.camera.y+sandbox.canvas.height/2);
sandbox.inCamp=(p=sandbox.me)=>Math.hypot(p.x-CAMP.x,p.y-CAMP.y)<CAMP.r;
sandbox.updateQuest=()=>{questBaseCalls++;sandbox.questText.textContent='base';};
sandbox.seedZone=()=>{sandbox.resources.length=0;};
sandbox.freshMob=(zone,index)=>({id:`base-${zone}-${index}`,kind:'crawler',x:2000+index*20,y:500,hp:58,phase:index,hitCd:0,respawnAt:0});
sandbox.spawnMobs=zone=>{sandbox.mobs=Array.from({length:6},(_,i)=>sandbox.freshMob(zone,i));};

vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'awakening-world-v1.js'});
await Promise.resolve();

const api=sandbox.ABYSSAL_AWAKENING_WORLD_V1;
assert.ok(api,'Awakening World V1 API must be exposed');
assert.equal(api.version,1);
assert.equal(api.placeholderArt,true,'programmer art must be explicitly marked temporary');
assert.equal(api.artContract,'AWAKENING_ASSET_CONTRACT.md');
assert.equal(api.stage.stage,0,'slice must begin in normal-reality Stage 0');
assert.equal(api.stage.earlyStage1,true,'only a very early Stage 1 hint is allowed');
assert.ok(api.stage.corruptionIntensity>0&&api.stage.corruptionIntensity<=.1,'early corruption must remain subtle');

const layerNames=Object.keys(api.layers).sort();
assert.deepEqual(layerNames,['collision','decals','entities','fx','interactions','props','terrain'],'world slice must expose seven separate authored layers');
assert.equal(api.layers.terrain.tileSize,64,'Awakening terrain must keep the V21 64x64 art grid');
assert.ok(api.layers.decals.length>=8,'transition road/POI must have authored decal density');
assert.ok(api.layers.props.length>=10,'POI must have composed prop density');
assert.ok(api.layers.collision.length>=10,'POI collision must be explicit gameplay data');
assert.ok(api.layers.interactions.length>=5,'POI must contain real search/loot locations');
assert.ok(api.layers.entities.length>=2,'POI must contain a deliberate enemy encounter');
assert.ok(api.layers.fx.some(v=>v.kind==='anomaly'),'POI must contain a restrained early anomaly');

const store=api.poi;
assert.equal(store.label,'Abandoned Convenience Store');
assert.equal(Math.floor(store.x/1600),1,'first POI must remain in the camp world column');
assert.equal(Math.floor(store.y/1600),0,'first POI must sit north of the camp in zone 1:0');
assert.ok(store.w>=512&&store.h>=320,'store must have readable interior scale, not a decorative icon');

// Explicit collision: walls and fixtures block, authored entrance remains open.
assert.equal(api.isBlockedPoint(store.x+80,store.y+store.h-8),true,'solid south exterior wall must block the player');
assert.equal(api.isBlockedPoint(store.entrance.x+store.entrance.w/2,store.y+store.h-8),false,'store entrance must remain physically open');
assert.equal(api.isBlockedPoint(2300,812),true,'shelf footprint must block the player independently of art');
assert.equal(api.isBlockedPoint(CAMP.x,CAMP.y),false,'Safe Camp center must remain unaffected by POI collision');
const wallCross=api.resolveMovement(store.x-40,900,store.x+80,900,10);
assert.equal(wallCross.blocked,true,'high-speed movement must not tunnel through store walls');
assert.ok(wallCross.x<store.x+8,'wall collision must resolve outside the building shell');

// Existing seedZone remains canonical; the slice adds typed POI resource nodes in zone 1:0.
sandbox.seedZone('1:0');
const poiResources=sandbox.resources.filter(r=>String(r.id).startsWith('poi:store:'));
assert.equal(poiResources.length,6,'store must seed six deterministic search/loot nodes');
assert.equal(poiResources.filter(r=>r.type==='shard').length,2,'POI must provide two high-value shard rewards for next-action progression');
assert.ok(poiResources.filter(r=>r.type==='food').length>=3,'store must provide ordinary survival supplies');
assert.ok(poiResources.every(r=>['wood','stone','food','shard'].includes(r.type)),'POI loot must reuse the existing inventory schema');
assert.ok(poiResources.every(r=>r.poi===store.id),'loot nodes must remain attributable to the POI');
sandbox.seedZone('1:1');
assert.equal(sandbox.resources.some(r=>String(r.id).startsWith('poi:store:')),false,'POI loot must not leak into Safe Camp zone seeding');

// POI interaction/loot smoke: injected loot goes through the existing canonical resource harvest path.
function block(text,startToken,endToken){
  const start=text.indexOf(startToken),end=text.indexOf(endToken,start);
  assert.ok(start>=0&&end>start,`missing source block ${startToken}`);
  return text.slice(start,end);
}
const harvestSource=block(interaction,'function harvestResource(r){','function restAtFire(){');
const sample={...api.layers.interactions.find(v=>v.type==='shard')};
const harvestCalls=[];
const lootSandbox={
  resource:sample,harvested:new Map(),inventory:{wood:0,stone:0,food:0,shard:0},
  ITEM_ZH:{wood:'木材',stone:'石头',food:'食物',shard:'异质碎片'},
  zoneConnected:true,currentZone:'1:0',
  zoneCh:{send(message){harvestCalls.push(message);return Promise.resolve('ok');}},
  saveLocal(){},updateUI(){},toast(){}
};
vm.createContext(lootSandbox);
vm.runInContext(`${harvestSource}\nharvestResource(resource);`,lootSandbox,{filename:'poi-loot-smoke.js'});
assert.equal(lootSandbox.inventory.shard,1,'existing context harvest must award injected POI shard loot');
assert.ok(lootSandbox.harvested.get(sample.id)>Date.now(),'POI loot must enter existing harvested cooldown state');
assert.equal(harvestCalls.length,1,'non-camp POI loot must use the existing shared harvest broadcast path');
assert.equal(harvestCalls[0].event,'harvest');
assert.equal(harvestCalls[0].payload.rid,sample.id);

// Deterministic encounter composes with current zone mobs and stays below inbound cap of 10.
sandbox.spawnMobs('1:0');
assert.equal(sandbox.mobs.filter(m=>String(m.id).startsWith('poi:store:crawler-')).length,2,'store encounter must seed two deliberate crawlers');
assert.ok(sandbox.mobs.length<=10,'POI encounter must remain within existing inbound mob cap');

// Environmental objective loop: north route -> search -> reward -> return HOME.
sandbox.currentZone='1:1';sandbox.me.x=2400;sandbox.me.y=1880;sandbox.inventory.shard=0;sandbox.updateQuest();
assert.ok(/北门公路|便利店/.test(sandbox.questText.textContent),'HOME must point the prepared player toward a clear north-road objective');
sandbox.currentZone='1:0';sandbox.me.x=2400;sandbox.me.y=850;sandbox.updateQuest();
assert.ok(/便利店/.test(sandbox.questText.textContent)&&/搜索/.test(sandbox.questText.textContent),'inside POI objective must tell player to search the environment');
sandbox.inventory.shard=2;sandbox.updateQuest();
assert.ok(/返回 Safe Camp/.test(sandbox.questText.textContent),'valuable POI reward must create a return-home objective');
sandbox.currentZone='1:1';sandbox.me.x=CAMP.x;sandbox.me.y=CAMP.y;sandbox.updateQuest();
assert.ok(/灯笼|下一次外出/.test(sandbox.questText.textContent),'returning HOME with shards must point toward the next preparation action');

// Rendering composes with existing layers and remains pixel-snapped/nearest-neighbor.
sandbox.currentZone='1:0';sandbox.camera.x=2400;sandbox.camera.y=1250;const beforeRects=fillRects;
sandbox.drawGround(360,600);sandbox.drawCamp(360,600);sandbox.drawLighting(360,600);
assert.equal(groundCalls,1,'existing ground renderer must remain in the chain');
assert.equal(campCalls,1,'existing prop/camp renderer must remain in the chain');
assert.equal(lightingCalls,1,'existing lighting renderer must remain in the chain');
assert.ok(fillRects>beforeRects,'authored terrain/decal/prop/FX layers must actually draw');
assert.equal(ctx.imageSmoothingEnabled,false,'world slice rendering must preserve crisp nearest-neighbor art');

// Boot/load order: terrain first, awakening collision/content next, then smooth-motion captures composed update().
const terrainIndex=boot.indexOf("'terrain-v21.js'");
const awakeningIndex=boot.indexOf("'modules/world/awakening-world-v1.js'");
const smoothIndex=boot.indexOf("'modules/main-loop/smooth-motion-v18.js'");
assert.ok(terrainIndex>=0&&awakeningIndex>terrainIndex,'Awakening world must extend the existing V21 terrain architecture');
assert.ok(smoothIndex>awakeningIndex,'Awakening collision must install before Smooth Motion captures update()');

// Preserve existing gameplay/network/save authority boundaries.
assert.ok(runtime.includes("STORAGE_KEY='abyssal_wake_save_v5'"),'player save schema must remain v5');
assert.ok(runtime.includes("inventory={wood:0,stone:0,food:2,shard:0,knife:false,lantern:false}"),'inventory schema must remain unchanged');
assert.ok(combat.includes('attackCd=inventory.knife?.32:.48'));
assert.ok(combat.includes('range:inventory.knife?80:62'));
assert.ok(combat.includes('damage:inventory.knife?22:11'));
assert.ok(interaction.includes('triggerContextInteraction'),'PC/mobile must continue through the shared context-action API');
for(const forbidden of ['new WebSocket(',"event:'attack'","event:'move'",'RELAY_URL','STORAGE_KEY=','localStorage.setItem']){
  assert.equal(source.includes(forbidden),false,`Awakening world must not alter transport/save authority: ${forbidden}`);
}
assert.equal(source.toLowerCase().includes('purple'),false,'Stage 0/early Stage 1 slice must not use a purple horror treatment');
assert.equal(source.includes('rgba(65,25,69'),false,'Stage 0/early Stage 1 slice must not reuse the insanity purple overlay as world art');

// Art Lab contract is explicit and decoupled from gameplay data.
for(const required of ['64×64','nearest-neighbor','bottom-center','Collision','transparent PNG','2–4 frames','assets/awakening-v1/','aw_v1_terrain_','aw_v1_decal_','aw_v1_prop_store_','manifest.json']){
  assert.ok(contract.includes(required),`asset contract missing ${required}`);
}
assert.ok(contract.includes('Never infer collision from PNG alpha'),'asset contract must forbid alpha-derived collision');

console.log(JSON.stringify({
  ok:true,
  stage:'0+early1',
  layers:layerNames,
  poi:store.label,
  route:'HOME->north road->store->combat/loot->HOME',
  loot:{nodes:poiResources.length,highValue:'shard',schema:'unchanged'},
  collision:'explicit-independent',
  network:'existing-harvest-and-mob-paths',
  save:'v5-unchanged',
  art:'placeholder-contract-ready'
}));