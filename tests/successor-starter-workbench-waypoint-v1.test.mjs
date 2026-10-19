import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const renderer=read('prototypes/successor-3-4/successor-renderer.js');
const guidance=read('modules/ui/route-guidance-v1.js');
const liveCandidate=read('prototypes/successor-3-4/live-candidate.js');
const preview=read('prototypes/successor-3-4/preview.js');
const build=read('cloudflare/build-site.mjs');
const safeCamp=read('modules/safe-camp/game-v7-patch.js');
const worldRenderer=read('modules/render/base-renderer.js');
const runtime=read('modules/core/runtime-state.js');

const workbench=safeCamp.match(/const WORKBENCH=\{x:(\d+),y:(\d+)\}/);
assert.ok(workbench,'SafeCamp must expose one authoritative workbench anchor');
assert.ok(renderer.includes(`workbench:{x:${workbench[1]},y:${workbench[2]}}`),
  'the renderer adapter must pass the active V21 workbench anchor as a UI snapshot');
assert.ok(guidance.includes('distance <= 350'),
  'the workbench waypoint must stay near the player and clamp to the visible gameplay edge when needed');
assert.ok(guidance.includes('if (inventory.knife)')&&guidance.includes("type: 'exit'"),
  'a crafted knife must reveal a right-up route marker at the real MIRE MART zone edge');
assert.ok(guidance.includes("['1:1', '1:0', '1:2']"),
  'route guidance must stay active in Safe Camp, MIRE MART and the unlocked southern zone');
assert.ok(renderer.includes('boss:bossProgress?.encounter?.spawn||null,bossCleared:bossProgress?.isCleared?.()===true'),
  'the renderer adapter must pass boss location and unlock state to the wayfinding module');
assert.ok(renderer.includes('homeUpgrade:window.ABYSSAL_HOME_WORKBENCH_V1?.getState?.()||null'),
  'the renderer adapter must pass the HOME-owned upgrade snapshot to the wayfinding module');
for(const marker of [
  "phase === 'REACH_MIRE_MART'",
  "phase === 'SEARCH_FIGHT'",
  "phase === 'SECURE_REQUIRED_SALVAGE' || phase === 'RETURN_HOME'",
])assert.ok(guidance.includes(marker),`the 3/4 route must expose the expedition objective ${marker}`);
assert.ok(guidance.includes('ctx.setTransform(Number(state.dpr)')&&guidance.includes('projectViewport(goal.x, goal.y)'),
  'starter guidance must render in stable viewport pixels while tracking zoomed world anchors');
assert.ok(!guidance.includes('viewportPoint('), 'starter guidance must not call the removed projection helper');
assert.ok(guidance.includes('goal.edge ? Math.min')&&guidance.includes('ctx.rotate(Math.atan2(dy, dx))'),
  'off-screen objectives must clamp to a viewport edge and point toward their world anchors');
for(const label of ['木材','石料','前往工作台','→ MIRE MART','搜索 MIRE MART','异质碎片','→ 返回安全营地','篝火 · 安全营地','任务 / 队友','收起信息']){
  assert.ok(renderer.includes(label)||guidance.includes(label),`the visible 3/4 route guidance must use readable Chinese labels: ${label}`);
}
for(const mojibake of ['鏈ㄦ潗','鐭虫枡','宸ヤ綔鍙','鈫?MIRE MART','璋冩煡 MIRE MART','寮傝川娈嬬暀','杩斿洖瀹夊叏','绡濈伀','浠诲姟 / 闃熷弸','鏀惰捣淇℃伅']){
  assert.ok(!renderer.includes(mojibake)&&!guidance.includes(mojibake),`player-facing route guidance must not contain mojibake: ${mojibake}`);
}
assert.ok(renderer.includes('window.ABYSSAL_ROUTE_GUIDANCE_V1?.draw?.(out,{'),
  'the large renderer must delegate wayfinding to its separate presentation module');
assert.ok(renderer.includes('function projectViewport(x,y)')&&renderer.includes('projectViewport:(x,y)=>projectViewport(x,y)')&&!guidance.includes('displayScale'),
  'the adapter must reuse the existing screen projection instead of duplicating camera math');
assert.ok(liveCandidate.indexOf("modules/ui/route-guidance-v1.js")<liveCandidate.indexOf("prototypes/successor-3-4/successor-renderer.js"),
  'the live candidate must load the route UI module before the renderer adapter');
assert.ok(preview.indexOf("modules/ui/route-guidance-v1.js")<preview.indexOf("prototypes/successor-3-4/successor-renderer.js"),
  'the preview must load the route UI module before the renderer adapter');
assert.ok(build.includes("'modules/ui/route-guidance-v1.js'"),
  'the canonical Cloudflare package must include the route UI module');

const labelsFor=({zone,phase,player,inventory,resources=[],interactionTarget=null,inCamp=false,bossCleared=false,boss=null,homeUpgrade=null,width=800,height=600,projection}={})=>{
  const labels=[],points=[],ctx={
    save(){},restore(){},setTransform(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},fill(){},fillRect(){},strokeRect(){},
    translate(x,y){points.push({x,y})},rotate(){},measureText(text){return{width:String(text).length*6}},
    fillText(text){labels.push(String(text))},
  };
  const apiContext=vm.createContext({});
  vm.runInContext(guidance,apiContext);
  const frozenResources=Object.freeze(resources.map(resource=>Object.freeze({...resource})));
  const state=Object.freeze({
    zone,phase,player:Object.freeze({...player}),inventory:Object.freeze({...inventory}),availableResources:frozenResources,
    interactionTarget,camp:Object.freeze({x:2400,y:2400}),worldZone:1600,bossCleared,boss,homeUpgrade,
    parking:Object.freeze({x:2200,y:900,w:300,h:200}),inCamp,workbench:Object.freeze({x:2195,y:2535}),
    projectViewport:projection||((x,y)=>({x:400+(x-player.x)*.5,y:300+(y-player.y)*.25})),
    width,height,dpr:1,now:1200,worldNow:1200,
  });
  assert.equal(apiContext.ABYSSAL_ROUTE_GUIDANCE_V1.draw(ctx,state),true);
  return {labels,points};
};

const shardTarget={type:'resource',d:0,label:'【互动】采集异质碎片',resource:{id:'poi:store:shard-a',type:'shard',x:2400,y:1300}};
const shardLabels=labelsFor({zone:'1:0',phase:'SEARCH_FIGHT',player:{x:2400,y:1300},inventory:{knife:true},resources:[shardTarget.resource],interactionTarget:shardTarget}).labels;
assert.ok(shardLabels.includes('异质碎片')&&shardLabels.includes('E / 互动  采集异质碎片'),
  'MIRE MART must show the real selected shard action separately from its route marker');
const farmWinsNearbyWood=labelsFor({zone:'1:1',phase:'',player:{x:2400,y:2400},inventory:{wood:0,stone:0},resources:[{id:'camp:wood-nearby',type:'wood',x:2410,y:2400}],interactionTarget:{type:'farm',d:20,label:'【互动】播种盐风叶菜',plotId:'plot-a'},inCamp:true}).labels;
assert.ok(farmWinsNearbyWood.includes('木材')&&farmWinsNearbyWood.includes('E / 互动  播种盐风叶菜'),
  'when a nearby farm wins interaction selection, the visible E prompt must say planting and the wood marker must stay non-actionable');
assert.ok(!farmWinsNearbyWood.includes('木材 · 按 E 采集'),
  'an unselected resource must never claim that E will collect it');
assert.ok(labelsFor({zone:'1:0',phase:'SECURE_REQUIRED_SALVAGE',player:{x:2400,y:1500},inventory:{knife:true,shard:1}}).labels.includes('→ 返回安全营地'),
  'after securing salvage the MIRE MART scene must show the return route');
const rigLocked={returnClearance:true,tier:1,cost:{stone:3,shard:2}};
const needRigShard=labelsFor({zone:'1:1',phase:'COMPLETE',player:{x:2400,y:2470},inventory:{knife:true,stone:0,shard:1},homeUpgrade:rigLocked,inCamp:true}).labels;
assert.ok(needRigShard.includes('→ MIRE MART · 碎片'),'after first return, the camp must direct a player missing a shard back to the salvage area');
const shardResource={id:'poi:store:shard-b',type:'shard',x:2400,y:1310};
const findRigShard=labelsFor({zone:'1:0',phase:'COMPLETE',player:{x:2400,y:1272},inventory:{knife:true,stone:0,shard:1},resources:[shardResource],homeUpgrade:rigLocked}).labels;
assert.ok(findRigShard.includes('装备架碎片'),'MIRE MART must point to an available shard while the upgrade is short one');
const returnToRig=labelsFor({zone:'1:0',phase:'COMPLETE',player:{x:2400,y:1272},inventory:{knife:true,stone:3,shard:2},homeUpgrade:rigLocked}).labels;
assert.ok(returnToRig.includes('→ 返营强化装备架'),'once upgrade materials are ready, the route must switch to HOME');
const upgradeRig=labelsFor({zone:'1:1',phase:'COMPLETE',player:{x:2400,y:2470},inventory:{knife:true,stone:3,shard:2},homeUpgrade:rigLocked,inCamp:true}).labels;
assert.ok(upgradeRig.includes('强化野外装备架'),'at HOME with the required materials, the marker must point to the workbench');
assert.ok(labelsFor({zone:'1:1',phase:'RETURN_HOME',player:{x:2400,y:1900},inventory:{knife:true,shard:1},inCamp:false}).labels.includes('篝火 · 安全营地'),
  'the last stretch back inside HOME must keep a visible camp destination');
assert.ok(labelsFor({zone:'1:1',phase:'LEAVE_HOME',player:{x:Number(workbench[1]),y:Number(workbench[2])},inventory:{wood:4,stone:3},inCamp:true}).labels.includes('前往工作台'),
  'the SafeCamp workbench cue must use the V21 anchor after gathering supplies');
assert.ok(labelsFor({zone:'1:1',phase:'COMPLETE',player:{x:2400,y:2470},inventory:{knife:true,lantern:true},inCamp:true,bossCleared:false}).labels.includes('→ 挑战沼心守望者'),
  'after making the lantern, the camp should point north to the boss expedition');
assert.ok(labelsFor({zone:'1:0',phase:'COMPLETE',player:{x:2400,y:1272},inventory:{knife:true,lantern:true},boss:{x:2400,y:1272}}).labels.includes('沼心守望者'),
  'the MIRE MART route should point directly to the active boss');
assert.ok(labelsFor({zone:'1:0',phase:'COMPLETE',player:{x:2400,y:1272},inventory:{knife:true,lantern:true},bossCleared:true}).labels.includes('返营 · 南侧新区已开放'),
  'a boss victory should guide the player back through camp toward the unlocked south');
assert.ok(labelsFor({zone:'1:1',phase:'COMPLETE',player:{x:2400,y:2470},inventory:{knife:true},inCamp:true,bossCleared:true}).labels.includes('→ 南侧探索区'),
  'the returned player should get a visible route to the newly opened southern region');
const southShard={id:'south:shard',type:'shard',x:2460,y:4810};
const southShardLabels=labelsFor({zone:'1:2',phase:'COMPLETE',player:{x:2400,y:4810},inventory:{knife:true},bossCleared:true,resources:[southShard],interactionTarget:{type:'resource',d:60,label:'【互动】采集新区异质遗物',resource:southShard}}).labels;
assert.ok(southShardLabels.includes('新区异质遗物')&&southShardLabels.includes('E / 互动  采集新区异质遗物'),
  'the new zone must separate its shard route marker from the currently selected interaction');

const mobileWidth=390,mobileHeight=844,rawExit={x:635,y:202},center={x:mobileWidth/2,y:mobileHeight/2};
const edgeLabels=labelsFor({zone:'1:1',phase:'LEAVE_HOME',player:{x:2400,y:1000},inventory:{knife:true},width:mobileWidth,height:mobileHeight,inCamp:false,projection:()=>rawExit});
assert.ok(edgeLabels.points.some(point=>point.x>mobileWidth-25&&point.y>24&&point.y<mobileHeight-24),
  'the SafeCamp exit should resolve to a visible right-edge cue on a 390px viewport');
assert.ok(worldRenderer.includes(`prop(2,CAMP.x-205,CAMP.y+135,1.22)`),
  'the player-visible workbench prop anchor must remain aligned with SafeCamp layout');
assert.ok(safeCamp.includes('Math.hypot(me.x-WORKBENCH.x,me.y-WORKBENCH.y)<125'),
  'the interaction radius must remain the V21 workbench activation rule');
const dimensions=runtime.match(/const WORLD=\{w:(\d+),h:(\d+),zone:(\d+)\},CAMP=\{x:(\d+),y:(\d+)/);
assert.ok(dimensions,'runtime world and camp coordinates must remain discoverable');
const [,worldWidth,,zoneSize,campX,campY]=dimensions.map(Number);
const exitX=campX,exitY=zoneSize-10;
assert.equal(Math.floor(exitX/zoneSize),1,'the route marker must stay in MIRE MART column 1');
assert.equal(Math.floor(exitY/zoneSize),0,'the route marker must cross into MIRE MART row 0');
const screenDelta={x:(exitX-campX-(exitY-campY))*.5,y:(exitX-campX+exitY-campY)*.25};
assert.ok(screenDelta.x>0&&screenDelta.y<0,'MIRE MART must lie upper-right from SafeCamp in the 3/4 camera');
console.log(JSON.stringify({ok:true,module:'route-guidance-v1',workbench:{x:Number(workbench[1]),y:Number(workbench[2])},activationRadius:125,exit:{x:exitX,y:exitY,zone:'1:0',screenDirection:'upper-right'}}));
