(() => {
  'use strict';
  const adapter=window.ABYSSAL_CAMERA_ADAPTER_V1||(()=>{const api={project(x,y,cx=0,cy=0){return{x:(x-y-cx+cy)*.5,y:(x+y-cx-cy)*.25}},screenIntentToWorld(x,y){return{x:x+2*y,y:-x+2*y}},worldIntentForScreenInput(x,y){const l=Math.hypot(x,y),s=l>1?1/l:1,v=this.screenIntentToWorld(x*s,y*s);return{x:v.x/Math.sqrt(8),y:v.y/Math.sqrt(8)}},worldDeltaForScreenIntent(x,y,speed,dt){const l=Math.hypot(x,y)||1,n=l>1?{x:x/l,y:y/l}:{x,y},v=this.screenIntentToWorld(n.x,n.y);return{x:v.x*speed*dt,y:v.y*speed*dt}},screenDeltaFromResolvedWorldDelta(dx,dy){return{x:(dx-dy)*.5,y:(dx+dy)*.25}},sortByFootDepth(list){return[...list].sort((a,b)=>(a.x+a.y)-(b.x+b.y)||String(a.id).localeCompare(String(b.id)))}};return api})();
  const sourceCanvas=canvas,view=sourceCanvas,wrapper=sourceCanvas.closest('.arena-wrap');
  sourceCanvas.style.visibility='visible';
  document.querySelector('.app')?.classList.add('successor-wide');
  const style=document.createElement('style');style.textContent='.app{width:100%!important;max-width:none!important}html.abyssal-desktop-v19 .app{width:100vw!important;max-width:none!important}.arena-wrap{position:absolute!important}.successor-wide{}#connection{display:none!important}.successor-canvas{touch-action:none}.joystick,.actions,.inventory,.quest,.players,.chat-toggle,.map-toggle{z-index:20!important}html.abyssal-desktop-v19 .app.successor-wide .actions{display:block!important;right:10px!important;bottom:calc(64px + env(safe-area-inset-bottom))!important;width:74px!important;height:44px!important}html.abyssal-desktop-v19 .app.successor-wide .actions .dash,html.abyssal-desktop-v19 .app.successor-wide .actions .attack{display:none!important}html.abyssal-desktop-v19 .app.successor-wide .actions .use{display:block!important;width:74px!important;height:44px!important;border-color:#b9d0c4!important;background:#173c32f2!important;color:#f0f8f3!important;font-size:9px!important;box-shadow:0 3px 12px #0008}@media(max-width:480px){.app.successor-wide .successor-pad{display:block!important}.successor-pad{left:8px!important;width:96px!important;height:96px!important}.successor-pad i{left:28px!important;top:28px!important}#desktopControlsV19{display:none!important}.app.successor-wide .chat-toggle,.app.successor-wide .map-toggle{bottom:calc(242px + env(safe-area-inset-bottom))!important}.app.successor-wide .actions{display:grid!important}.app.successor-wide .inventory{left:calc(50% - 68px)!important;transform:none!important;gap:2px!important}.app.successor-wide .slot{width:30px!important}.app.successor-wide #inventoryToggleV19{right:68px!important;bottom:calc(242px + env(safe-area-inset-bottom))!important}#interactionPromptV12{bottom:calc(190px + env(safe-area-inset-bottom))!important}}';document.head.appendChild(style);
  const out=ctx,legacyTerrainPath=window.ABYSSAL_TERRAIN_V21?.sheetPath||'assets/art-v21/terrain-v21.png',proofTerrainPass=window.AW_SUCCESSOR_PREVIEW_ART,requestedProofTerrain=window.AW_SUCCESSOR_PREVIEW===true&&['revise-pass-2','revise-pass-3'].includes(proofTerrainPass);
  let proofTerrainActive=requestedProofTerrain,legacyTilesReady=false,proofTilesReady=false;
  const legacyTiles=new Image(),proofTiles=new Image();
  const treeCandidateQa=window.AW_SUCCESSOR_PREVIEW===true&&window.AW_DEV_QA===true&&window.AW_SUCCESSOR_TREE_CANDIDATE_QA===true,treeCandidateImage=new Image();
  treeCandidateImage.onload=()=>reportAssetStatus();treeCandidateImage.onerror=()=>reportAssetStatus();
  if(treeCandidateQa)treeCandidateImage.src='assets/art-candidates/safecamp-successor-proof-v1/reviews/tree-pass-1/salt-cedar-tree-1024x1536.png';
  const resourceArtQa=window.AW_SUCCESSOR_PREVIEW===true&&window.AW_DEV_QA===true&&window.AW_SUCCESSOR_RESOURCE_ART_QA===true,resourceCandidateImage=new Image();
  resourceCandidateImage.onload=()=>reportAssetStatus();resourceCandidateImage.onerror=()=>reportAssetStatus();
  if(resourceArtQa)resourceCandidateImage.src='assets/art-candidates/safecamp-successor-proof-v1/reviews/resource-atlas-pass-1-DRAFT/resource-atlas-2x2-1536x1024-DRAFT.png';
  const playerCandidateQa=window.AW_SUCCESSOR_PREVIEW===true&&window.AW_DEV_QA===true&&window.AW_SUCCESSOR_PLAYER_CANDIDATE_QA===true,generatedWalkAtlasQa=window.AW_SUCCESSOR_PREVIEW===true&&window.AW_DEV_QA===true&&window.AW_SUCCESSOR_GENERATED_WALK_ATLAS_QA===true,liveSurvivorAtlas=window.AW_SUCCESSOR_LIVE_SURVIVOR_ATLAS===true,pixelSurvivorLive=window.AW_SUCCESSOR_PIXEL_SURVIVOR===true,playerCandidateImage=new Image();
  playerCandidateImage.onload=()=>reportAssetStatus();playerCandidateImage.onerror=()=>reportAssetStatus();
  if(playerCandidateQa||generatedWalkAtlasQa||liveSurvivorAtlas||pixelSurvivorLive)playerCandidateImage.src=pixelSurvivorLive?'assets/art-candidates/stardew-pixel-safecamp-review-2026-10-06/stardew-pixel-survivor-atlas-draft.png':generatedWalkAtlasQa?'assets/art-candidates/modern-survivor-spritesheet-review-2026-10-06/modern-survivor-generated-walk-atlas-6frame-DRAFT.png':'assets/art-candidates/modern-survivor-spritesheet-review-2026-10-06/modern-survivor-original-4dir-4frame-atlas-768x1280.png';
  if(liveSurvivorAtlas)fetch('assets/art-candidates/modern-survivor-spritesheet-review-2026-10-06/modern-survivor-original-atlas-frames.json',{cache:'force-cache'}).then(response=>{if(!response.ok)throw new Error(`survivor atlas metadata HTTP ${response.status}`);return response.json()}).then(metadata=>{window.AW_SURVIVOR_ATLAS_FRAMES=metadata;reportAssetStatus()}).catch(()=>{});
  const characterPortraitQa=window.AW_SUCCESSOR_PREVIEW===true&&window.AW_DEV_QA===true&&window.AW_SUCCESSOR_CHARACTER_PORTRAIT_QA===true,characterPortraitImage=new Image();
  characterPortraitImage.onload=()=>reportAssetStatus();characterPortraitImage.onerror=()=>reportAssetStatus();
  if(characterPortraitQa)characterPortraitImage.src='assets/art-candidates/modern-survivor-spritesheet-review-2026-10-06/modern-survivor-front-portrait-150x298.png';
  let localAction='none',localActionAt=0,choppedResourceId='';
  const playableGroundDraft=window.AW_SUCCESSOR_PREVIEW===true&&window.AW_DEV_QA===true&&window.AW_SUCCESSOR_PLAYABLE_GROUND_DRAFT===true,continuousGroundStudy=['pass6','pass7'].includes(window.AW_SUCCESSOR_GROUND_STUDY)?window.AW_SUCCESSOR_GROUND_STUDY:'',continuousGroundQa=window.AW_SUCCESSOR_PREVIEW===true&&window.AW_DEV_QA===true&&window.AW_SUCCESSOR_CONTINUOUS_GROUND_QA===true&&(!!continuousGroundStudy||window.AW_SUCCESSOR_BLACKMARSH_GROUND_QA===true),blackmarshGroundQa=window.AW_SUCCESSOR_PREVIEW===true&&window.AW_DEV_QA===true&&window.AW_SUCCESSOR_BLACKMARSH_GROUND_QA===true,generatedGroundQa=window.AW_SUCCESSOR_PREVIEW===true&&window.AW_DEV_QA===true&&window.AW_SUCCESSOR_GENERATED_GROUND_QA===true,liveGroundArt=window.AW_SUCCESSOR_LIVE_GROUND_ART===true,continuousGroundImage=new Image();
  continuousGroundImage.onload=()=>reportAssetStatus();continuousGroundImage.onerror=()=>reportAssetStatus();
  if(playableGroundDraft||continuousGroundQa||generatedGroundQa||liveGroundArt)continuousGroundImage.src=playableGroundDraft?'assets/art-candidates/stardew-pixel-safecamp-review-2026-10-06/safecamp-playable-ground-draft-v1.png':liveGroundArt?'assets/awakening-v1/intake/whole-game-art-candidate-v3/safe-camp-meadow-repeat-2x2-draft.png':generatedGroundQa?'assets/art-candidates/safecamp-successor-proof-v1/reviews/safecamp-generated-harbor-ground-no-fire-1408x704-DRAFT.png':continuousGroundStudy==='pass7'?'assets/art-candidates/safecamp-successor-proof-v1/reviews/revise-pass-7/safecamp-pass7-harbor-coast-1x.png':'assets/art-candidates/safecamp-successor-proof-v1/reviews/revise-pass-6/safecamp-pass6-port-ground-1x.png';
  const continuousWaterImage=new Image();continuousWaterImage.onload=()=>reportAssetStatus();continuousWaterImage.onerror=()=>reportAssetStatus();
  if(liveGroundArt)continuousWaterImage.src='assets/awakening-v1/intake/whole-game-art-candidate-v3/safe-camp-water-repeat-2x2-draft.png';
  const continuousSandImage=new Image();continuousSandImage.onload=()=>reportAssetStatus();continuousSandImage.onerror=()=>reportAssetStatus();
  if(liveGroundArt)continuousSandImage.src='assets/awakening-v1/intake/whole-game-art-candidate-v3/safe-camp-sand-repeat-2x2-draft.png';
  const continuousRoadImage=new Image();continuousRoadImage.onload=()=>reportAssetStatus();continuousRoadImage.onerror=()=>reportAssetStatus();
  if(liveGroundArt)continuousRoadImage.src='assets/awakening-v1/intake/whole-game-art-candidate-v3/safe-camp-road-repeat-2x2-draft.png';
  const blackmarshGroundImage=new Image();blackmarshGroundImage.onload=()=>reportAssetStatus();blackmarshGroundImage.onerror=()=>reportAssetStatus();
  if(blackmarshGroundQa)blackmarshGroundImage.src='assets/art-candidates/safecamp-successor-proof-v1/reviews/revise-pass-8-blackmarsh/blackmarsh-pass8-north-road-1x.png';
  legacyTiles.onload=()=>legacyTilesReady=true;legacyTiles.onerror=()=>legacyTilesReady=false;
  proofTiles.onload=()=>{if(proofTiles.naturalWidth!==384||proofTiles.naturalHeight!==320){proofTerrainActive=false;proofTilesReady=false;reportAssetStatus();return}proofTilesReady=true;reportAssetStatus()};
  proofTiles.onerror=()=>{proofTerrainActive=false;proofTilesReady=false;reportAssetStatus()};
  legacyTiles.src=legacyTerrainPath;
  if(requestedProofTerrain)proofTiles.src=`assets/art-candidates/safecamp-successor-proof-v1/reviews/${proofTerrainPass}/terrain-atlas-128x64-3x5.png`;
  const terrain=window.ABYSSAL_TERRAIN_V21,worldApi=window.ABYSSAL_AWAKENING_WORLD_V1,metroStore=worldApi?.poi||{x:2112,y:640,w:640,h:448},METRO_CLUE_WORLD={x:metroStore.x+metroStore.w+32,y:metroStore.y+Math.round(metroStore.h*.30)};
  const metroB2Room=window.ABYSSAL_METRO_B2_ROOM_V1;
  const grayboxBuildingQa=window.AW_SUCCESSOR_PREVIEW===true&&window.AW_DEV_QA===true&&window.AW_SUCCESSOR_GRAYBOX_BUILDING===true;
  const grayboxBuildingStart=grayboxBuildingQa&&window.AW_SUCCESSOR_PREVIEW_START_AT_GRAYBOX===true;
  const cozyPixelProof=window.AW_SUCCESSOR_COZY_PIXEL_PROOF===true&&(window.AW_SUCCESSOR_PREVIEW===true&&window.AW_DEV_QA===true||window.AW_SUCCESSOR_GRAYBOX_CONTINUITY===true),cozyPixelArt=window.ABYSSAL_COZY_PIXEL_PROOF_V1,townArtPass=Math.max(0,Number(window.AW_SUCCESSOR_TOWN_ART_PASS)||0);
  const grayboxContinuity=cozyPixelProof&&window.AW_SUCCESSOR_GRAYBOX_CONTINUITY===true;
  const highDetailActor=()=>pixelSurvivorLive?(playerCandidateImage.complete&&playerCandidateImage.naturalWidth===1254&&playerCandidateImage.naturalHeight===1254):generatedWalkAtlasQa?(playerCandidateImage.complete&&playerCandidateImage.naturalWidth===1536&&playerCandidateImage.naturalHeight===1024):((playerCandidateQa||liveSurvivorAtlas)&&playerCandidateImage.complete&&playerCandidateImage.naturalWidth===768&&playerCandidateImage.naturalHeight===1280);
  const nativeToast=toast;toast=function(message){if(String(message).startsWith('Expedition complete 锟斤拷 safe return '))return;nativeToast(message)};
  let dpr=1,lastTime=0,displayScale=1,placements=[],lastCollisionBlocked=false,updateTicks=0,pendingHitStop=0,hitStopUntil=0,visualMoving=false,visualMoveUntil=0,visualWalkClock=0,renderCameraX=me.x,renderCameraY=me.y,renderCameraScreenX=0,renderCameraScreenY=0,previousPlayerX=me.x,previousPlayerY=me.y;
  const resourceWorkFeedback=[];
  addEventListener('abyssal:resource-work-feedback',event=>{
    const hit=event.detail;if(!hit?.id)return;
    const now=performance.now();
    for(let i=resourceWorkFeedback.length-1;i>=0;i--)if(resourceWorkFeedback[i].id===hit.id)resourceWorkFeedback.splice(i,1);
    resourceWorkFeedback.push({...hit,at:now,until:now+Math.max(900,Number(hit.expiresInMs)||60000)});
    localAction=hit.type==='wood'?'harvest':'mine';localActionAt=Date.now();
    if(hit.type==='wood')choppedResourceId=String(hit.id);
    if(!hit.complete)toast(`${hit.type==='wood'?'木材':'石头'} ${hit.hit}/${hit.total}`);
    if(resourceWorkFeedback.length>12)resourceWorkFeedback.shift();
  });
  addEventListener('abyssal:combat-hit',event=>{const hit=event.detail;if(!hit?.local)return;const damage=Math.max(0,(Number(hit.hpBefore)||0)-(Number(hit.hpAfter)||0));pendingHitStop=Math.max(pendingHitStop,hit.killed?112:damage>=30?64:damage>=18?48:24)});
  const keys=new Set();
  joystick.style.display='none';
  const pad=document.createElement('div'),knob=document.createElement('i');pad.className='successor-pad';pad.setAttribute('role','group');pad.setAttribute('aria-label','Successor screen-direction movement');pad.appendChild(knob);document.querySelector('.game').appendChild(pad);
  Object.assign(pad.style,{position:'absolute',left:'18px',bottom:'calc(32px + env(safe-area-inset-bottom))',width:'112px',height:'112px',zIndex:'25',border:'2px solid #9ab3a2',borderRadius:'50%',background:'#10211dc9',boxShadow:'0 5px 16px #0007',touchAction:'none'});
  Object.assign(knob.style,{position:'absolute',left:'34px',top:'34px',width:'40px',height:'40px',border:'1px solid #eef0d7',borderRadius:'50%',background:'#d9e7d966',pointerEvents:'none'});
  function resize(){const rect=wrapper.getBoundingClientRect();if(rect.width<20||rect.height<20)return;dpr=Math.min(devicePixelRatio||1,2);const backing=adapter.backingSizeForViewport?.(rect.width,rect.height,dpr)||{width:Math.max(1,Math.round(rect.width*dpr)),height:Math.max(1,Math.round(rect.height*dpr))};if(view.width!==backing.width||view.height!==backing.height){view.width=backing.width;view.height=backing.height}out.setTransform(dpr,0,0,dpr,0,0);out.imageSmoothingEnabled=false;const baseZoom=adapter.pixelZoomForViewport?.(rect.width)||1;displayScale=baseZoom;}
  const observer=new ResizeObserver(resize);observer.observe(wrapper);resize();
   function project(x,y){const projected=adapter.project(x,y);return{x:Math.round(view.clientWidth/2)+Math.round(projected.x)-renderCameraScreenX,y:Math.round(view.clientHeight*.50)+Math.round(projected.y)-renderCameraScreenY}}
   function projectActor(x,y,self=false){return project(x,y)}
   function actorRow(worldDir=0){const face=adapter.project(Math.cos(worldDir),Math.sin(worldDir));return Math.abs(face.y)>Math.abs(face.x)?(face.y>0?0:3):(face.x<0?1:2)}
  function projectViewport(x,y){const point=project(x,y);return{x:Math.round((point.x-view.clientWidth/2)*displayScale+view.clientWidth/2),y:Math.round((point.y-view.clientHeight/2)*displayScale+view.clientHeight/2)}}
  function buildingContext(){return{zone:currentZone,player:me,entrance:worldApi?.poi?.entrance,setPosition(x,y){me.x=x;me.y=y;camera.x=x;camera.y=y;renderCameraX=x;renderCameraY=y;previousPlayerX=x;previousPlayerY=y}}}
  window.ABYSSAL_SUCCESSOR_BUILDING_ACCESS_V1=Object.freeze({interact(){return window.ABYSSAL_BUILDING_INTERIOR_PREVIEW_V1?.handleInteract?.(buildingContext())===true},tryDoorCrossing(intent){return window.ABYSSAL_BUILDING_INTERIOR_PREVIEW_V1?.handleDoorCrossing?.(buildingContext(),intent)===true},updatePrompt(){return window.ABYSSAL_BUILDING_INTERIOR_PREVIEW_V1?.updatePrompt?.(buildingContext())},isInside(){return window.ABYSSAL_BUILDING_INTERIOR_PREVIEW_V1?.isInside?.()===true}});
  function snapCamp(){const found=[],original=prop,drawCampOriginal=drawCamp;prop=(index,x,y,scale=1)=>found.push({id:`camp-prop-${found.length}`,index,x,y,scale});try{drawCampOriginal(view.width,view.height)}finally{prop=original}placements=found;}
  function drawDiamond(id,wx,wy,ts){
    const p=project(wx+ts/2,wy+ts/2),w=ts,h=ts/2;
    out.beginPath();out.moveTo(p.x,p.y-h/2);out.lineTo(p.x+w/2,p.y);out.lineTo(p.x,p.y+h/2);out.lineTo(p.x-w/2,p.y);out.closePath();
    const useProof=proofTerrainActive&&currentZone==='1:1'&&proofTilesReady,tileImage=useProof?proofTiles:legacyTiles,tilesReady=useProof?proofTilesReady:legacyTilesReady;
    if(tilesReady){
      // The shipped atlas has grass only in cell 0; cells 1 and 2 are sand.
      out.save();out.clip();out.imageSmoothingEnabled=false;
      if(useProof){
        const transition=id===terrain.tile.grass_to_sand_e||id===terrain.tile.grass_to_sand_w;
        const family=proofTerrainPass==='revise-pass-3'
          ?([terrain.tile.grass_a,terrain.tile.grass_b,terrain.tile.grass_flowers,terrain.tile.grass_to_sand_e,terrain.tile.grass_to_sand_w].includes(id)?0:[terrain.tile.road_a,terrain.tile.road_b].includes(id)?1:[terrain.tile.sand_a,terrain.tile.sand_b,terrain.tile.sand_pebbles].includes(id)?2:[terrain.tile.water_a,terrain.tile.water_b].includes(id)?3:id===terrain.tile.shore_e||id===terrain.tile.shore_se?4:-1)
          :(id<=terrain.tile.grass_flowers?0:id<=terrain.tile.sand_b?2:id<=terrain.tile.road_b?1:id<=terrain.tile.water_b?3:id<=18?4:id===19?2:-1);
        if(family>=0){let hash=Math.imul(Math.floor(wx/ts),374761393)^Math.imul(Math.floor(wy/ts),668265263)^Math.imul(id+1,2246822519);hash=Math.imul(hash^(hash>>>13),1274126177);let variant=(hash>>>0)%3;if(proofTerrainPass==='revise-pass-3'&&id===terrain.tile.shore_e)variant%=2;if(proofTerrainPass==='revise-pass-3'&&id===terrain.tile.shore_se)variant=2;
          out.drawImage(tileImage,variant*128,family*64,128,64,p.x-w/2,p.y-h/2,w,h);
          if(proofTerrainPass==='revise-pass-3'&&transition){out.save();out.beginPath();out.moveTo(p.x,p.y);if(id===terrain.tile.grass_to_sand_e){out.lineTo(p.x+w/2,p.y);out.lineTo(p.x,p.y+h/2)}else{out.lineTo(p.x-w/2,p.y);out.lineTo(p.x,p.y-h/2)}out.closePath();out.clip();out.globalAlpha=.94;out.drawImage(tileImage,variant*128,2*64,128,64,p.x-w/2,p.y-h/2,w,h);out.restore()}
        }
        else{out.fillStyle='#617c58';out.fill()}
      }else{
        const productionGrassVariant=!terrain.artPreview&&(id===terrain.tile.grass_b||id===terrain.tile.grass_flowers);
        const sourceId=productionGrassVariant?terrain.tile.grass_a:id;
        if(productionGrassVariant){out.translate(p.x,p.y);out.scale(id===terrain.tile.grass_b?-1:1,id===terrain.tile.grass_flowers?-1:1);out.drawImage(tileImage,(sourceId%5)*ts,Math.floor(sourceId/5)*ts,ts,ts,-w/2,-h/2,w,h)}
        else out.drawImage(tileImage,(sourceId%5)*ts,Math.floor(sourceId/5)*ts,ts,ts,p.x-w/2,p.y-h/2,w,h);
      }
      out.restore();
    }else{out.fillStyle=id===7||id===8?'#34737a':id===3||id===4?'#b29c76':id===5||id===6?'#887c62':'#6d865f';out.fill()}
  }
  function drawPixelGroundDiamond(id,wx,wy,ts,col,row){
    const p=project(wx+ts/2,wy+ts/2),w=ts,h=ts/2;
    out.save();out.beginPath();out.moveTo(p.x,p.y-h/2);out.lineTo(p.x+w/2,p.y);out.lineTo(p.x,p.y+h/2);out.lineTo(p.x-w/2,p.y);out.closePath();out.clip();
    const atlas=continuousGroundImage,hash=(Math.imul(col+71,374761393)^Math.imul(row-19,668265263))>>>0;
    // Three authored meadow tiles share a continuous base palette; stable mirroring multiplies their variety.
    const meadow=id<=2?hash%3:id,sourceX=(meadow%5)*64,sourceY=Math.floor(meadow/5)*64,flipX=(hash&4)?-1:1,flipY=(hash&8)?-1:1;
    out.translate(Math.round(p.x),Math.round(p.y));out.scale(flipX,flipY);out.imageSmoothingEnabled=false;
    if(liveGroundArt&&id<=2&&atlas.complete&&atlas.naturalWidth===128&&atlas.naturalHeight===128){out.drawImage(atlas,0,0,128,128,-w/2,-h/2,w,h)}
    else out.drawImage(atlas,sourceX,sourceY,64,64,-w/2,-h/2,w,h);
    // Sparse blossom pairs are tied to cell coordinates, so they never shimmer while the camera moves.
    if(id<=2&&(hash%11)===0){out.fillStyle='#f5e7b6';out.fillRect(-Math.round(w*.19),-2,2,2);out.fillStyle='#dc9b77';out.fillRect(-Math.round(w*.19)+3,-1,1,1)}
    out.restore();
  }
  function drawContinuousCells(api,ids,image){
    if(!image?.complete||image.naturalWidth!==128||image.naturalHeight!==128||typeof out.createPattern!=='function'||typeof DOMMatrix==='undefined')return false;
    const {originX,originY,cols,rows}=api.slice,ts=api.tileSize;out.save();out.beginPath();let count=0;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){if(!ids.has(api.tileAtCell(col,row)))continue;const p=project(originX+col*ts+ts/2,originY+row*ts+ts/2),w=ts,h=ts/2;out.moveTo(p.x,p.y-h/2);out.lineTo(p.x+w/2,p.y);out.lineTo(p.x,p.y+h/2);out.lineTo(p.x-w/2,p.y);out.closePath();count++}
    if(!count){out.restore();return true}out.clip();const pattern=out.createPattern(image,'repeat');if(!pattern){out.restore();return false}
    const mapOrigin=project(originX,originY);pattern.setTransform(new DOMMatrix([1,0,0,1,mapOrigin.x,mapOrigin.y]));out.globalAlpha=1;out.fillStyle=pattern;out.fillRect(0,0,view.clientWidth,view.clientHeight);out.restore();return true;
  }
  function drawGroundBeyondMap(W,H){
    // Keep the graybox ground continuous beyond the authored tile sheet.
    // The previous water backdrop had no matching world collider, so players
    // could walk across visible harbor water at the map edge.
    out.fillStyle='#788b5c';out.fillRect(0,0,W,H);
    out.save();out.imageSmoothingEnabled=false;
    const corners=[[-48,-48],[W+48,-48],[-48,H+48],[W+48,H+48]].map(([sx,sy])=>{
      const dx=sx-W/2,dy=sy-H/2;
      return{x:renderCameraX+dx+dy*2,y:renderCameraY-dx+dy*2};
    });
    const minCol=Math.floor(Math.min(...corners.map(point=>point.x))/64),maxCol=Math.ceil(Math.max(...corners.map(point=>point.x))/64);
    const minRow=Math.floor(Math.min(...corners.map(point=>point.y))/64),maxRow=Math.ceil(Math.max(...corners.map(point=>point.y))/64);
    const cameraPixel=adapter.project(renderCameraX,renderCameraY);
    for(let row=minRow;row<=maxRow;row++)for(let col=minCol;col<=maxCol;col++){
      const seed=(Math.imul(col+17,374761393)^Math.imul(row+31,668265263))>>>0;
      if((seed&3)!==0)continue;
      const worldX=col*64+8+((seed>>>5)%48),worldY=row*64+8+((seed>>>13)%48),point=adapter.project(worldX,worldY);
      const x=Math.round(W/2+point.x-cameraPixel.x),y=Math.round(H/2+point.y-cameraPixel.y);
      if(x<-16||y<-16||x>W+16||y>H+16)continue;
      out.fillStyle=(seed&4)?'#65794d':'#a0aa70';out.fillRect(x,y,7,2);
      if((seed&31)===0){out.fillStyle='#e6d29b';out.fillRect(x+4,y-2,2,1)}
    }
    out.restore();
  }
  function drawCityBeyondRegion(W,H){
    // This is a quiet, distant city layer below the authored playable tiles.
    // Its connected roofline and low contrast make the map edge read as streets
    // continuing beyond the camera, never as an unloaded black void.
    out.fillStyle='#8d8a79';out.fillRect(0,0,W,H);
    out.save();out.imageSmoothingEnabled=false;
    const rowY=Math.round(H*.35),depth=Math.max(7,Math.round(H*.018));
    const blocks=[
      {x:-.08,w:.20,h:.19,wall:'#a79b80',side:'#70796e',roof:'#58695f',glass:'#78958c',kind:'shop'},
      {x:.105,w:.19,h:.27,wall:'#8e9a89',side:'#68786e',roof:'#52675f',glass:'#7d9a91',kind:'apt'},
      {x:.285,w:.18,h:.22,wall:'#a9a084',side:'#747b70',roof:'#5c6c62',glass:'#d0b981',kind:'clinic'},
      {x:.455,w:.22,h:.30,wall:'#87958a',side:'#68796f',roof:'#50655d',glass:'#75958c',kind:'apt'},
      {x:.665,w:.18,h:.23,wall:'#a79a7d',side:'#72796d',roof:'#586a60',glass:'#d2bc89',kind:'shop'},
      {x:.835,w:.23,h:.28,wall:'#89958a',side:'#68776f',roof:'#4e635b',glass:'#79948b',kind:'apt'}
    ];
    for(let i=0;i<blocks.length;i++){
      const b=blocks[i],x=Math.round(b.x*W),w=Math.max(48,Math.round(b.w*W)),h=Math.max(48,Math.round(b.h*H)),top=rowY-h,side=Math.max(6,Math.round(w*.035));
      // Shallow right-hand depth and stepped parapets keep these background
      // facades in the same 3/4 language as the playable ground.
      out.fillStyle='#35463e';out.beginPath();out.moveTo(x+side,top+3);out.lineTo(x+w+side,top+3);out.lineTo(x+w+side,rowY-3);out.lineTo(x+w,rowY);out.lineTo(x,rowY);out.lineTo(x,top+side);out.closePath();out.fill();
      out.fillStyle=b.side;out.beginPath();out.moveTo(x+w,top+side);out.lineTo(x+w+side,top+3);out.lineTo(x+w+side,rowY-3);out.lineTo(x+w,rowY);out.closePath();out.fill();
      out.fillStyle=b.wall;out.fillRect(x,top+side,w,h-side);
      out.fillStyle=b.roof;out.beginPath();out.moveTo(x,top+side);out.lineTo(x+side,top+3);out.lineTo(x+w+side,top+3);out.lineTo(x+w,top+side);out.closePath();out.fill();
      out.fillStyle='#c8bb94';out.fillRect(x+2,top+side+2,w-4,2);
      const cols=Math.max(2,Math.floor((w-18)/19)),rows=Math.max(2,Math.floor((h-18)/22)),cell=(w-18)/cols;
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
        const wx=Math.round(x+9+c*cell),wy=top+side+9+r*22;
        out.fillStyle='#465b54';out.fillRect(wx-1,wy-1,9,12);
        out.fillStyle=(i+r+c)%5===0?'#596f67':b.glass;out.fillRect(wx,wy,7,8);
        out.fillStyle='#d7c995';out.fillRect(wx-1,wy+9,9,1);
        if(b.kind==='apt'&&(r+c+i)%3===0){out.fillStyle='#61756b';out.fillRect(wx-2,wy+11,11,1);out.fillRect(wx,wy+11,1,3);out.fillRect(wx+7,wy+11,1,3)}
      }
      if(b.kind==='shop'){
        const awning=rowY-12;out.fillStyle='#46574f';out.fillRect(x+4,awning,w-8,7);out.fillStyle=i%2?'#788d77':'#b87860';
        for(let stripe=x+5;stripe<x+w-7;stripe+=9)out.fillRect(stripe,awning+1,4,4);
        out.fillStyle='#e2d4ac';out.fillRect(x+Math.round(w*.32),awning-8,Math.round(w*.40),5);
      }
      // Roof hardware, antennas and one water tank read as a lived-in block.
      const roofX=x+Math.round(w*(i%2?.72:.34));out.fillStyle='#66786d';out.fillRect(roofX,top+side-7,14,7);out.fillStyle='#b1ad91';out.fillRect(roofX+2,top+side-9,9,3);out.fillRect(roofX+18,top+side-12,2,10);out.fillStyle='#d6c58f';out.fillRect(roofX+17,top+side-14,4,2);
    }
    // A second, quieter skyline sits behind the main storefront row. Keeping it
    // near the horizon avoids cutting apartment facades across the map's lower
    // edge, where they can look like unloaded square chunks.
    const farBase=Math.round(H*.28),farBlocks=[
      {x:.19,w:.20,h:.17,wall:'#9a987f',side:'#69776c',roof:'#4f6259',glass:'#78948a'},
      {x:.38,w:.24,h:.22,wall:'#899487',side:'#66776d',roof:'#4b6159',glass:'#829b91'},
      {x:.61,w:.18,h:.18,wall:'#a39a7f',side:'#6b776a',roof:'#51655b',glass:'#d0b981'},
      {x:.78,w:.26,h:.20,wall:'#8b978a',side:'#65766c',roof:'#4d6259',glass:'#78948a'}
    ];
    for(let i=0;i<farBlocks.length;i++){
      const b=farBlocks[i],x=Math.round(b.x*W),w=Math.max(48,Math.round(b.w*W)),h=Math.max(42,Math.round(b.h*H)),top=farBase-h,side=Math.max(6,Math.round(w*.035));
      out.fillStyle='#35463e';out.beginPath();out.moveTo(x+side,top+3);out.lineTo(x+w+side,top+3);out.lineTo(x+w+side,farBase-2);out.lineTo(x+w,farBase);out.lineTo(x,farBase);out.lineTo(x,top+side);out.closePath();out.fill();
      out.fillStyle=b.side;out.beginPath();out.moveTo(x+w,top+side);out.lineTo(x+w+side,top+3);out.lineTo(x+w+side,farBase-2);out.lineTo(x+w,farBase);out.closePath();out.fill();
      out.fillStyle=b.wall;out.fillRect(x,top+side,w,h-side);out.fillStyle=b.roof;out.beginPath();out.moveTo(x,top+side);out.lineTo(x+side,top+3);out.lineTo(x+w+side,top+3);out.lineTo(x+w,top+side);out.closePath();out.fill();
      const cols=Math.max(2,Math.floor((w-18)/22)),step=(w-18)/cols;
      for(let col=0;col<cols;col++){const wx=Math.round(x+9+col*step),wy=top+side+10;out.fillStyle='#465b54';out.fillRect(wx-1,wy-1,9,12);out.fillStyle=(col+i)%4===0?'#5a7068':b.glass;out.fillRect(wx,wy,7,8);out.fillStyle='#d5c794';out.fillRect(wx-1,wy+9,9,1)}
      out.fillStyle='#65786d';out.fillRect(x+Math.round(w*.72),top+side-6,13,6);out.fillStyle='#b1ad91';out.fillRect(x+Math.round(w*.72)+2,top+side-8,9,3);
    }
    const curbY=Math.round(H*.355);out.globalAlpha=.48;out.fillStyle='#d3c49a';out.fillRect(0,curbY,W,2);out.globalAlpha=.32;out.fillStyle='#465b53';out.fillRect(0,curbY+2,W,6);
    out.globalAlpha=.24;out.strokeStyle='#51665d';out.lineWidth=1;out.beginPath();out.moveTo(0,Math.round(H*.10));out.quadraticCurveTo(W*.5,Math.round(H*.16),W,Math.round(H*.09));out.stroke();
    out.globalAlpha=.12;const haze=out.createLinearGradient(0,0,0,H);haze.addColorStop(0,'#e6d9b544');haze.addColorStop(.6,'#d6d7bf0c');haze.addColorStop(1,'#263d3810');out.fillStyle=haze;out.fillRect(0,0,W,H);
    out.restore();
  }
  function drawCityRimOverExterior(W,H){
    // Cozy low-rise storefronts frame the roads. Camera-relative offset keeps
    // the town attached to the world instead of the HUD.
    out.save();out.imageSmoothingEnabled=false;
    const designWidth=661,designHeight=615;
    const worldPointFromDesignScreen=(screenX,screenY)=>{
      const screenDelta={x:screenX-designWidth/2,y:screenY-designHeight/2},worldDelta=adapter.screenIntentToWorld?.(screenDelta.x,screenDelta.y)||{x:screenDelta.x+screenDelta.y*2,y:-screenDelta.x+screenDelta.y*2};
      return{x:CAMP.x+worldDelta.x,y:CAMP.y+worldDelta.y};
    };
    const fillWorldPolygon=(worldPoints,color,alpha=1)=>{
      const points=worldPoints.map(point=>{const screen=project(point.x,point.y);return{x:Math.round(screen.x),y:Math.round(screen.y)}});
      out.globalAlpha=alpha;out.fillStyle=color;out.beginPath();out.moveTo(points[0].x,points[0].y);
      for(let i=1;i<points.length;i++)out.lineTo(points[i].x,points[i].y);
      out.closePath();out.fill();out.globalAlpha=1;
    };
    // A second screen-horizontal town street meets the storefront row; its
    // narrow concrete shoulders make the green pocket feel like a park block.
    // Put the cross street in front of the north storefront row so the road
    // reads as their shared frontage, then join it to the camp plaza.
    const streetCenter={x:CAMP.x-140,y:CAMP.y-140},streetHalf=430;
    const streetA={x:streetCenter.x-streetHalf,y:streetCenter.y+streetHalf},streetB={x:streetCenter.x+streetHalf,y:streetCenter.y-streetHalf};
    const band=(halfWidth,color)=>fillWorldPolygon([
      {x:streetA.x+halfWidth,y:streetA.y+halfWidth},{x:streetB.x+halfWidth,y:streetB.y+halfWidth},
      {x:streetB.x-halfWidth,y:streetB.y-halfWidth},{x:streetA.x-halfWidth,y:streetA.y-halfWidth}
    ],color);
    band(60,'#a49c84');band(50,'#737b71');
    const drawStreetBand=(from,to,halfWidth,color)=>{
      const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length;
      fillWorldPolygon([{x:from.x+nx*halfWidth,y:from.y+ny*halfWidth},{x:to.x+nx*halfWidth,y:to.y+ny*halfWidth},{x:to.x-nx*halfWidth,y:to.y-ny*halfWidth},{x:from.x-nx*halfWidth,y:from.y-ny*halfWidth}],color);
    };
    const campStreetEnd={x:CAMP.x,y:CAMP.y-36};drawStreetBand(streetCenter,campStreetEnd,44,'#a49c84');drawStreetBand(streetCenter,campStreetEnd,34,'#737b71');
    // One uninterrupted sidewalk follows the north storefront row and meets
    // the road curb. Drawing it as a shared band avoids a separate square pad
    // under every building.
    const frontageOffset={x:-80,y:-80};
    drawStreetBand({x:streetA.x+frontageOffset.x,y:streetA.y+frontageOffset.y},{x:streetB.x+frontageOffset.x,y:streetB.y+frontageOffset.y},22,'#9c9a82');
    // Mirror the footway on the camp side so the street reads as a complete
    // neighborhood block rather than a road stripe pasted onto an open lawn.
    const campSideOffset={x:80,y:80};
    drawStreetBand({x:streetA.x+campSideOffset.x,y:streetA.y+campSideOffset.y},{x:streetB.x+campSideOffset.x,y:streetB.y+campSideOffset.y},18,'#918f7c');
    out.strokeStyle='#e0d1a0a8';out.lineWidth=1;out.setLineDash([18,35]);
    const northA=project(streetA.x,streetA.y),northB=project(streetB.x,streetB.y);out.beginPath();out.moveTo(northA.x,northA.y);out.lineTo(northB.x,northB.y);out.stroke();out.setLineDash([]);
    out.setLineDash([14,30]);const connectorA=project(streetCenter.x,streetCenter.y),connectorB=project(campStreetEnd.x,campStreetEnd.y);out.beginPath();out.moveTo(connectorA.x,connectorA.y);out.lineTo(connectorB.x,connectorB.y);out.stroke();out.setLineDash([]);
    const plazaY=CAMP.y-36;
    const plaza=Array.from({length:20},(_,i)=>{
      const a=i*Math.PI/10,edge=[.94,1.04,.96,1.08,.92,1.02,.97,1.06,.95,1.01][i];
      return{x:CAMP.x+Math.round(Math.cos(a)*204*edge),y:plazaY+Math.round(Math.sin(a)*102*edge)};
    });
    const facade=(worldFoot,w,h,seed,kind)=>{
      const screenFoot=project(worldFoot.x,worldFoot.y);w=Math.round(w);h=Math.round(h);
      const x=Math.round(screenFoot.x-w/2),y=Math.round(screenFoot.y-h);
      // Keep the roof footprint shallow so street facades read as attached
      // apartments and shops, not a row of deep cubic display blocks.
      const depth=kind==='row'?16:Math.max(8,Math.min(16,Math.round(w*.08))),wallHeight=Math.max(42,h-depth),wall=['#a49a7c','#b89d7a','#899782','#b4876d'][seed%4],side=['#716e5d','#877862','#687969','#845f50'][seed%4],roof=['#8d9385','#969887','#818d82'][seed%3],glass=['#78978e','#d0b67e','#8aa69a'][seed%3];
      const cx=x+w/2,back={x:Math.round(cx),y},left={x,y:y+Math.round(depth/2)},front={x:Math.round(cx),y:y+depth},right={x:x+w,y:y+Math.round(depth/2)};
      const baseBack={x:back.x,y:y+wallHeight},baseLeft={x:left.x,y:left.y+wallHeight},baseFront={x:front.x,y:front.y+wallHeight},baseRight={x:right.x,y:right.y+wallHeight};
      const polygon=(points,color)=>{out.fillStyle=color;out.beginPath();out.moveTo(Math.round(points[0].x),Math.round(points[0].y));for(let i=1;i<points.length;i++)out.lineTo(Math.round(points[i].x),Math.round(points[i].y));out.closePath();out.fill()};
      const pointOnFace=(a,b,t,lift)=>({x:Math.round(a.x+(b.x-a.x)*t),y:Math.round(a.y+(b.y-a.y)*t-lift)});
      const windowOnFace=(a,b,t,lit,lift,width=.22)=>{
        const p0=pointOnFace(a,b,t,lift),p1=pointOnFace(a,b,t+width,lift),p2=pointOnFace(a,b,t+width,lift+14),p3=pointOnFace(a,b,t,lift+14);
        polygon([pointOnFace(a,b,t-.025,lift-2),pointOnFace(a,b,t+width+.025,lift-2),pointOnFace(a,b,t+width+.025,lift+16),pointOnFace(a,b,t-.025,lift+16)],'#46584f');
        polygon([p0,p1,p2,p3],lit?glass:'#60756a');
        polygon([pointOnFace(a,b,t+.025,lift+10),pointOnFace(a,b,t+width*.48,lift+10),pointOnFace(a,b,t+width*.48,lift+13),pointOnFace(a,b,t+.025,lift+13)],lit?'#f0d99a':'#92a18d');
        if(kind==='apt'||kind==='row'){
          // A narrow balcony rail makes apartment windows read as lived-in
          // modern homes instead of marks painted onto a solid box.
          const railA=pointOnFace(a,b,t-.035,lift-3),railB=pointOnFace(a,b,t+width+.035,lift-3),baseA=pointOnFace(a,b,t-.035,lift+1),baseB=pointOnFace(a,b,t+width+.035,lift+1);
          out.strokeStyle='#4b5b52';out.lineWidth=1;out.beginPath();out.moveTo(railA.x,railA.y);out.lineTo(railB.x,railB.y);out.moveTo(baseA.x,baseA.y);out.lineTo(baseB.x,baseB.y);
          for(const fraction of [.05,.48,.91]){const post=pointOnFace(a,b,t-.035+(width+.07)*fraction,lift-3);out.moveTo(post.x,post.y);out.lineTo(pointOnFace(a,b,t-.035+(width+.07)*fraction,lift+1).x,pointOnFace(a,b,t-.035+(width+.07)*fraction,lift+1).y)}out.stroke();
        }
      };
      out.fillStyle='#27372f55';out.beginPath();out.ellipse(cx,y+h-2,w*.31,Math.max(3,depth*.17),0,0,Math.PI*2);out.fill();
      // Two visible wall planes and a shallow diamond roof make the skyline obey the 3/4 camera.
      polygon([left,front,baseFront,baseLeft],wall);polygon([front,right,baseRight,baseFront],side);
      // Flat concrete roofs and a low parapet shift the skyline from cottages
      // toward compact coastal apartments and neighborhood storefronts.
      polygon([back,right,front,left],roof);
      polygon([back,left,{x:left.x,y:left.y+3},{x:back.x,y:back.y+3}],'#d5c39b');
      polygon([back,right,{x:right.x,y:right.y+3},{x:back.x,y:back.y+3}],'#737f73');
      polygon([left,front,{x:front.x,y:front.y+3},{x:left.x,y:left.y+3}],'#778578');
      if(kind==='apt'){
        // Pixel-sized roof plant: condenser, fan grille, and service riser.
        const ux=Math.round(cx-depth*.16),uy=Math.round(y+depth*.43);
        out.fillStyle='#6b786f';out.fillRect(ux-2,uy+2,14,7);out.fillStyle='#b3b39a';out.fillRect(ux,uy,10,6);out.fillStyle='#717d73';out.fillRect(ux+2,uy+2,2,2);out.fillRect(ux+6,uy+2,2,2);out.fillStyle='#d1c7a4';out.fillRect(ux+1,uy,8,1);
        out.fillStyle='#727f74';out.fillRect(ux+15,uy+2,4,7);out.fillStyle='#d1c7a4';out.fillRect(ux+16,uy,2,2);
      }else if(kind==='row'){
        // Several small rooftop condensers break up the long shared roofline.
        for(const fraction of [.18,.43,.68,.86]){const ux=Math.round(x+w*fraction),uy=Math.round(y+depth*.47);out.fillStyle='#68766d';out.fillRect(ux-2,uy+3,16,7);out.fillStyle='#c0b99b';out.fillRect(ux,uy,12,6);out.fillStyle='#717f75';out.fillRect(ux+2,uy+2,2,2);out.fillRect(ux+7,uy+2,2,2);out.fillStyle='#ddd2b0';out.fillRect(ux+1,uy,10,1)}
      }
       const floors=Math.max(1,Math.min(kind==='row'?2:3,Math.floor((wallHeight-24)/28))),columns=kind==='row'?5:2,windowWidth=kind==='row'?.12:.22;
       for(let row=0;row<floors;row++)for(let col=0;col<columns;col++){
         const t=kind==='row'?.06+col*.20:.18+col*.42,lift=25+row*25,lit=((seed+row*7+col*11)%4)!==0;
         windowOnFace(baseLeft,baseFront,t,lit,lift,windowWidth);
         if(kind==='row'||col===0){const light=((seed+row*11+4)%4)!==0;windowOnFace(baseFront,baseRight,t,light,lift,windowWidth)}
      }
      if(kind==='shop'||kind==='clinic'){
        // Give the street-facing shop/clinic an actual recessed entry door.
        const doorA=.46,doorB=.59;
        polygon([pointOnFace(baseFront,baseRight,doorA-.025,0),pointOnFace(baseFront,baseRight,doorB+.025,0),pointOnFace(baseFront,baseRight,doorB+.025,28),pointOnFace(baseFront,baseRight,doorA-.025,28)],'#46584f');
        polygon([pointOnFace(baseFront,baseRight,doorA,2),pointOnFace(baseFront,baseRight,doorB,2),pointOnFace(baseFront,baseRight,doorB,26),pointOnFace(baseFront,baseRight,doorA,26)],'#718276');
        polygon([pointOnFace(baseFront,baseRight,doorA+.02,18),pointOnFace(baseFront,baseRight,doorB-.02,18),pointOnFace(baseFront,baseRight,doorB-.02,25),pointOnFace(baseFront,baseRight,doorA+.02,25)],'#95aca0');
        const handle=pointOnFace(baseFront,baseRight,doorB-.025,10);out.fillStyle='#e4c987';out.fillRect(handle.x,handle.y,2,2);
        const trim=seed%2?'#bd765d':'#829a73',t0=.08,t1=.92,awningTop=pointOnFace(baseFront,baseRight,t0,30),awningEnd=pointOnFace(baseFront,baseRight,t1,30),awningBottom=pointOnFace(baseFront,baseRight,t1,23),awningStart=pointOnFace(baseFront,baseRight,t0,23);
        polygon([awningTop,awningEnd,awningBottom,awningStart],'#4c5b51');
        for(let stripe=0;stripe<7;stripe++){const a=t0+(t1-t0)*stripe/7,b=t0+(t1-t0)*(stripe+1)/7;polygon([pointOnFace(baseFront,baseRight,a,30),pointOnFace(baseFront,baseRight,b,30),pointOnFace(baseFront,baseRight,b,23),pointOnFace(baseFront,baseRight,a,23)],stripe%2?trim:'#d8cfaa')}
        const label=kind==='clinic'?'CLINIC':'MIRE MART',sign=pointOnFace(baseFront,baseRight,.5,39);out.fillStyle='#4b5b51';out.fillRect(sign.x-24,sign.y-5,48,10);out.fillStyle=kind==='clinic'?'#e4d3a0':'#e7bb82';out.font='bold 7px ui-monospace,monospace';out.textAlign='center';out.textBaseline='middle';out.fillText(label,sign.x,sign.y);
      }else if(kind==='row'){
        // One connected two-use street frontage: apartment windows above a
        // small run of shop glass, with the store/clinic names on one canopy.
        const awningA=.035,awningB=.965,awningTop=pointOnFace(baseFront,baseRight,awningA,27),awningEnd=pointOnFace(baseFront,baseRight,awningB,27),awningBottom=pointOnFace(baseFront,baseRight,awningB,20),awningStart=pointOnFace(baseFront,baseRight,awningA,20);
        polygon([awningTop,awningEnd,awningBottom,awningStart],'#4c5b51');
        for(let stripe=0;stripe<9;stripe++){const a=awningA+(awningB-awningA)*stripe/9,b=awningA+(awningB-awningA)*(stripe+1)/9;polygon([pointOnFace(baseFront,baseRight,a,27),pointOnFace(baseFront,baseRight,b,27),pointOnFace(baseFront,baseRight,b,20),pointOnFace(baseFront,baseRight,a,20)],stripe%3===0?'#bd765d':stripe%3===1?'#d8cfaa':'#829a73')}
        for(let bay=0;bay<4;bay++){
          const a=.09+bay*.215,b=a+.145,door=bay===1||bay===3;
          polygon([pointOnFace(baseFront,baseRight,a-.018,1),pointOnFace(baseFront,baseRight,b+.018,1),pointOnFace(baseFront,baseRight,b+.018,20),pointOnFace(baseFront,baseRight,a-.018,20)],'#46584f');
          polygon([pointOnFace(baseFront,baseRight,a,3),pointOnFace(baseFront,baseRight,b,3),pointOnFace(baseFront,baseRight,b,18),pointOnFace(baseFront,baseRight,a,18)],door?'#748a7e':'#89aaa0');
          if(door){const split=(a+b)/2;polygon([pointOnFace(baseFront,baseRight,split,3),pointOnFace(baseFront,baseRight,b,3),pointOnFace(baseFront,baseRight,b,18),pointOnFace(baseFront,baseRight,split,18)],'#5d766c');out.fillStyle='#e4c987';const handle=pointOnFace(baseFront,baseRight,b-.018,10);out.fillRect(handle.x,handle.y,1,2)}
          else{const mullion=(a+b)/2;polygon([pointOnFace(baseFront,baseRight,mullion-.006,3),pointOnFace(baseFront,baseRight,mullion+.006,3),pointOnFace(baseFront,baseRight,mullion+.006,18),pointOnFace(baseFront,baseRight,mullion-.006,18)],'#d4d0ad')}
        }
        for(const [label,tint,t] of [['MIRE MART','#e7bb82',.25],['CLINIC','#e4d3a0',.76]]){const sign=pointOnFace(baseFront,baseRight,t,37);out.fillStyle='#4b5b51';out.fillRect(sign.x-21,sign.y-4,42,8);out.fillStyle=tint;out.font='bold 6px ui-monospace,monospace';out.textAlign='center';out.textBaseline='middle';out.fillText(label,sign.x,sign.y)}
      }else{
        // Small rooftop vent/tank pixels are attached to the roof plane, not floating over the lawn.
        const unitX=Math.round(cx+depth*.12),unitY=Math.round(y+depth*.42);out.fillStyle='#65786c';out.fillRect(unitX,unitY,10,6);out.fillStyle='#9d9d7c';out.fillRect(unitX+2,unitY-3,7,3);
      }
      // A quiet curb apron seats the building on the same town ground plane.
      polygon([{x:baseLeft.x-1,y:baseLeft.y},{x:baseFront.x,y:baseFront.y+2},{x:baseRight.x+1,y:baseRight.y},{x:baseRight.x+1,y:baseRight.y+2},{x:baseFront.x,y:baseFront.y+4},{x:baseLeft.x-1,y:baseLeft.y+2}],'#aaa187');
    };
    const blocks=[
      {x:-8,y:designHeight*.30,w:designWidth*.21,h:designHeight*.16,kind:'shop',seed:2},
      {x:-8,y:designHeight*.47,w:designWidth*.18,h:designHeight*.15,kind:'apt',seed:1},
      {x:designWidth*.18,y:designHeight*.095,w:designWidth*.64,h:designHeight*.20,kind:'row',seed:5},
      {x:designWidth*.81,y:designHeight*.27,w:designWidth*.20,h:designHeight*.17,kind:'apt',seed:3},
      {x:designWidth*.84,y:designHeight*.45,w:designWidth*.17,h:designHeight*.16,kind:'clinic',seed:4}
    ];
    for(const b of blocks)facade(worldPointFromDesignScreen(b.x+b.w/2,b.y+b.h),b.w,b.h,b.seed,b.kind);
    // A single waterfront walk replaces the hard edge of the green lot with
    // a readable town promenade; it follows the shoreline without tile-sized
    // paving blocks or any collision/world-cell changes.
    const promenade=[{x:-24,y:408},{x:110,y:416},{x:248,y:428},{x:405,y:429},{x:548,y:421},{x:685,y:409}],promenadeUpper=promenade.map(point=>worldPointFromDesignScreen(point.x,point.y-6)),promenadeLower=[...promenade].reverse().map(point=>worldPointFromDesignScreen(point.x,point.y+6));
    fillWorldPolygon([...promenadeUpper,...promenadeLower],'#989582');
    const promenadeLip=[{x:-24,y:415},{x:110,y:423},{x:248,y:435},{x:405,y:436},{x:548,y:428},{x:685,y:416}],lipUpper=promenadeLip.map(point=>worldPointFromDesignScreen(point.x,point.y-1)),lipLower=[...promenadeLip].reverse().map(point=>worldPointFromDesignScreen(point.x,point.y+1));
    fillWorldPolygon([...lipUpper,...lipLower],'#c3b993',.62);
    // A compact glass-sided bus shelter gives the shared frontage a clear
    // contemporary town cue without turning the calm park pocket into clutter.
    {
      const point=project(streetCenter.x+150,streetCenter.y-150),x=Math.round(point.x),y=Math.round(point.y);
      out.save();out.imageSmoothingEnabled=false;
      out.fillStyle='#29372e45';out.beginPath();out.ellipse(x,y+7,23,5,0,0,Math.PI*2);out.fill();
      out.fillStyle='#a49f88';out.fillRect(x-25,y+2,50,3);out.fillStyle='#d0c4a0';out.fillRect(x-24,y+2,48,1);
      out.fillStyle='#4d6057';out.fillRect(x-21,y-19,2,21);out.fillRect(x+18,y-18,2,20);
      out.fillStyle='#7fa69b';out.globalAlpha=.66;out.fillRect(x-18,y-16,35,16);out.globalAlpha=1;
      out.fillStyle='#d1c7a5';out.fillRect(x-17,y-15,1,14);out.fillRect(x-1,y-15,1,14);out.fillRect(x+16,y-15,1,14);
      out.fillStyle='#54675d';out.beginPath();out.moveTo(x-24,y-19);out.lineTo(x-17,y-24);out.lineTo(x+19,y-24);out.lineTo(x+24,y-19);out.closePath();out.fill();
      out.fillStyle='#c47860';out.fillRect(x-22,y-20,44,2);out.fillStyle='#e1d0a5';out.fillRect(x-19,y-18,38,1);
      out.fillStyle='#4a5a51';out.fillRect(x-10,y-9,14,2);out.fillStyle='#b8a882';out.fillRect(x-9,y-11,12,2);out.fillStyle='#45554d';out.fillRect(x-8,y-9,1,5);out.fillRect(x+2,y-9,1,5);
      out.fillStyle='#53665b';out.fillRect(x-26,y-27,5,10);out.fillStyle='#e5cc8e';out.fillRect(x-25,y-26,3,2);out.fillStyle='#718d7f';out.fillRect(x-24,y-22,2,4);
      out.restore();
    }
    const dashWorld=(a,b,step=92,length=30)=>{const dx=b.x-a.x,dy=b.y-a.y,total=Math.hypot(dx,dy);for(let d=0;d<total;d+=step){const from=d/total,to=Math.min(1,(d+length)/total),p=project(a.x+dx*from,a.y+dy*from),q=project(a.x+dx*to,a.y+dy*to);out.beginPath();out.moveTo(p.x,p.y);out.lineTo(q.x,q.y);out.stroke()}};
    out.strokeStyle='#e8d8a1a0';out.lineWidth=2;out.lineCap='butt';
    dashWorld({x:CAMP.x,y:CAMP.y-512},{x:CAMP.x,y:CAMP.y+128});
    dashWorld({x:CAMP.x-320,y:CAMP.y},{x:CAMP.x+480,y:CAMP.y});
    // A single small parked car gives the frontage an unmistakably modern
    // street cue, while remaining a non-interactive preview decoration.
    {
      const point=project(streetCenter.x-165,streetCenter.y+165),cx=Math.round(point.x),cy=Math.round(point.y);
      const carPolygon=(points,color)=>{out.fillStyle=color;out.beginPath();out.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)out.lineTo(points[i][0],points[i][1]);out.closePath();out.fill()};
      out.save();out.imageSmoothingEnabled=false;
      out.fillStyle='#29372e55';out.beginPath();out.ellipse(cx,cy+5,19,6,0,0,Math.PI*2);out.fill();
      out.fillStyle='#34443b';out.fillRect(cx-12,cy-8,7,3);out.fillRect(cx+6,cy-8,7,3);out.fillRect(cx-12,cy+5,7,3);out.fillRect(cx+6,cy+5,7,3);
      carPolygon([[cx-19,cy-3],[cx-15,cy-8],[cx-6,cy-10],[cx+9,cy-9],[cx+18,cy-4],[cx+19,cy+3],[cx+14,cy+7],[cx-14,cy+7],[cx-19,cy+3]],'#3d4c42');
      carPolygon([[cx-17,cy-3],[cx-13,cy-7],[cx-5,cy-8],[cx-4,cy+4],[cx-14,cy+5],[cx-17,cy+2]],'#c67860');
      carPolygon([[cx-3,cy-8],[cx+8,cy-7],[cx+15,cy-3],[cx+14,cy+4],[cx-3,cy+4]],'#b96653');
      carPolygon([[cx-2,cy-6],[cx+6,cy-6],[cx+11,cy-3],[cx+9,cy+1],[cx-2,cy+1]],'#83a79b');
      out.fillStyle='#d9d0aa';out.fillRect(cx+15,cy-2,3,2);out.fillRect(cx-18,cy-2,2,2);
      out.fillStyle='#e3c98f';out.fillRect(cx+10,cy+4,3,1);out.restore();
    }
    // A zebra crossing gives the two old camp paths the read of town streets.
    out.strokeStyle='#f0dfb38f';out.lineWidth=3;
    for(let i=0;i<6;i++){const y=CAMP.y+42+i*10,p=project(CAMP.x-56,y),q=project(CAMP.x+56,y);out.beginPath();out.moveTo(p.x,p.y);out.lineTo(q.x,q.y);out.stroke()}
    // Keep the shelter plaza and its sidewalks above the road markings so they
    // read as one connected town block instead of isolated gray tile patches.
    fillWorldPolygon(plaza,'#928f7c',.98);
    out.globalAlpha=.48;out.strokeStyle='#d7c8a1';out.lineWidth=1;out.beginPath();
    for(let i=0;i<plaza.length;i+=4){const a=project(plaza[i].x,plaza[i].y),b=project(plaza[(i+1)%plaza.length].x,plaza[(i+1)%plaza.length].y);out.moveTo(Math.round(a.x)+.5,Math.round(a.y)+.5);out.lineTo(Math.round(b.x)+.5,Math.round(b.y)+.5)}
    out.stroke();out.globalAlpha=1;
    for(let i=0;i<36;i++){
      const a=i*2.399,rad=.16+(i%7)*.105,p=project(CAMP.x+Math.cos(a)*132*rad,plazaY+Math.sin(a)*66*rad),size=i%6===0?3:i%3===0?2:1;
      out.globalAlpha=i%4===0?.7:.4;out.fillStyle=i%5===0?'#c6bb99':'#817f6d';out.fillRect(Math.round(p.x),Math.round(p.y),size,1);
    }
    out.globalAlpha=1;
    // One overhead service cable hints at a lived-in coastal street.
    const projectDesignPoint=(x,y)=>{const world=worldPointFromDesignScreen(x,y);return project(world.x,world.y)};
    const cableStart=projectDesignPoint(0,designHeight*.20),cableControl=projectDesignPoint(designWidth*.5,designHeight*.26),cableEnd=projectDesignPoint(designWidth,designHeight*.19);
    out.strokeStyle='#53675a85';out.lineWidth=1;out.beginPath();out.moveTo(cableStart.x,cableStart.y);out.quadraticCurveTo(cableControl.x,cableControl.y,cableEnd.x,cableEnd.y);out.stroke();
    out.restore();
  }
  function drawContinuousGround(image,width,height,originX,originY,cols,rows,tileSize){const p0=project(originX,originY),p2=project(originX+cols*tileSize,originY+rows*tileSize),targetWidth=Math.round((cols+rows)*tileSize*.5),targetHeight=Math.round((cols+rows)*tileSize*.25),scaleY=targetHeight/height,left=Math.round(p0.x-cols*tileSize*.5),top=Math.round(p0.y-16*scaleY);out.save();out.imageSmoothingEnabled=false;out.drawImage(image,left,top,targetWidth,targetHeight);out.restore();return{left,top,width:targetWidth,height:targetHeight,bottomRight:{x:left+targetWidth,y:top+targetHeight},projectedBottomRight:{x:p2.x,y:p2.y}}}
  function terrainDraw(){
    const api=terrain;if(!api)return;
    if(grayboxContinuity){
      cozyPixelArt?.drawContinuationGround?.({ctx:out,project,camera:{x:renderCameraX,y:renderCameraY},width:view.clientWidth,height:view.clientHeight,camp:CAMP});
      if(currentZone==='1:1'&&api.slice)cozyPixelArt?.drawGround?.({ctx:out,api,project,width:view.clientWidth,height:view.clientHeight,terrain});
      return;
    }
    if(currentZone==='1:1'){
      // Keep the HOME map edge on its authored coast. A screen-space city row
      // beyond the playable cells looked like a flat image pasted behind camp.
      drawGroundBeyondMap(view.clientWidth,view.clientHeight);
    }
    else if(currentZone==='1:0')drawCityBeyondRegion(view.clientWidth,view.clientHeight);
    else{out.fillStyle=BIOMES[currentZone]?.[1]||'#556c52';out.fillRect(0,0,view.clientWidth,view.clientHeight)}
    if(currentZone==='1:1'&&api.slice){
      if(typeof cozyPixelProof!=='undefined'&&cozyPixelProof&&cozyPixelArt?.drawGround&&cozyPixelArt.drawGround({ctx:out,api,project,width:view.clientWidth,height:view.clientHeight,terrain}))return;
      if(playableGroundDraft&&continuousGroundImage.complete&&continuousGroundImage.naturalWidth===1774&&continuousGroundImage.naturalHeight===887){drawContinuousGround(continuousGroundImage,1774,887,api.slice.originX,api.slice.originY,api.slice.cols,api.slice.rows,api.tileSize);return}
      if(liveGroundArt&&continuousGroundImage.complete&&continuousGroundImage.naturalWidth===128&&continuousGroundImage.naturalHeight===128){const grassIds=new Set([terrain.tile.grass_a,terrain.tile.grass_b,terrain.tile.grass_flowers]),waterIds=new Set([terrain.tile.water_a,terrain.tile.water_b]),sandIds=new Set([terrain.tile.sand_a,terrain.tile.sand_b,terrain.tile.sand_pebbles,terrain.tile.shore_n,terrain.tile.shore_s,terrain.tile.shore_e,terrain.tile.shore_w,terrain.tile.shore_ne,terrain.tile.shore_nw,terrain.tile.shore_se,terrain.tile.shore_sw]),roadIds=new Set([terrain.tile.road_a,terrain.tile.road_b]),continuousGrass=drawContinuousCells(api,grassIds,continuousGroundImage),continuousWater=drawContinuousCells(api,waterIds,continuousWaterImage),continuousSand=drawContinuousCells(api,sandIds,continuousSandImage),continuousRoad=drawContinuousCells(api,roadIds,continuousRoadImage);const ts=api.tileSize,{originX,originY,cols,rows}=api.slice;for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const id=api.tileAtCell(col,row);if(id==null)continue;if(continuousGrass&&grassIds.has(id)||continuousWater&&waterIds.has(id)||continuousSand&&sandIds.has(id)||continuousRoad&&roadIds.has(id))continue;drawDiamond(id,originX+col*ts,originY+row*ts,ts)}return}
      if((continuousGroundQa||generatedGroundQa)&&continuousGroundImage.complete&&continuousGroundImage.naturalWidth===1408&&continuousGroundImage.naturalHeight===704){drawContinuousGround(continuousGroundImage,1408,704,api.slice.originX,api.slice.originY,api.slice.cols,api.slice.rows,api.tileSize);return}
      const ts=api.tileSize,{originX,originY,cols,rows}=api.slice;for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const id=api.tileAtCell(col,row);if(id!=null)drawDiamond(id,originX+col*ts,originY+row*ts,ts)}return
    }
    if(currentZone!=='1:0'||!worldApi)return;
    const region=worldApi.region;if(blackmarshGroundQa&&blackmarshGroundImage.complete&&blackmarshGroundImage.naturalWidth===1472&&blackmarshGroundImage.naturalHeight===736){drawContinuousGround(blackmarshGroundImage,1472,736,region.x,region.y,region.cols||24,region.rows||20,terrain.tileSize);return}
    if(cozyPixelProof&&cozyPixelArt?.drawUrbanGround&&cozyPixelArt.drawUrbanGround({ctx:out,worldApi,project,width:view.clientWidth,height:view.clientHeight,tileSize:terrain.tileSize}))return;
    const ts=terrain.tileSize,tileset=terrain.tile;for(let wy=region.y;wy<region.y+region.h;wy+=ts)for(let wx=region.x;wx<region.x+region.w;wx+=ts){const screen=project(wx+ts/2,wy+ts/2);if(screen.x<-ts||screen.x>view.clientWidth+ts||screen.y<-ts||screen.y>view.clientHeight+ts)continue;const material=worldApi.regionMaterial(wx,wy),id=material==='asphalt'?tileset.road_a:material==='dirt_shoulder'?tileset.sand_a:material==='cold_grass'?tileset.grass_b:tileset.road_b;drawDiamond(id,wx,wy,ts)}
  }
  function drawCityEdgeContext(W,H){
    if(currentZone!=='1:0'||!worldApi?.region)return;
    const region=worldApi.region,outline=[
      project(region.x,region.y),project(region.x+region.w,region.y),
      project(region.x+region.w,region.y+region.h),project(region.x,region.y+region.h)
    ];
    // Paint the city continuation only outside the authored world footprint.
    // This makes camera-edge areas contextual without covering or moving V21 tiles.
    out.save();out.beginPath();out.rect(0,0,W,H);out.moveTo(outline[0].x,outline[0].y);
    for(let i=1;i<outline.length;i++)out.lineTo(outline[i].x,outline[i].y);
    out.closePath();out.clip('evenodd');drawCityBeyondRegion(W,H);out.restore();
  }
  function drawMireMartNeighborhood(){
    if(currentZone!=='1:0'||!cozyPixelProof)return;
    const polygon=(points,color)=>{out.fillStyle=color;out.beginPath();out.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)out.lineTo(points[i].x,points[i].y);out.closePath();out.fill()};
    const block=(x,y,w,d,height,kind,seed)=>{
      const p=(wx,wy,lift=0)=>{const q=project(wx,wy);return{x:q.x,y:q.y-lift}};
      const a=p(x,y),b=p(x+w,y),c=p(x+w,y+d),e=p(x,y+d),ab=p(x,y,height),bb=p(x+w,y,height),cb=p(x+w,y+d,height),eb=p(x,y+d,height);
      const wall=kind==='clinic'?'#a99478':'#a49a7e',side=kind==='clinic'?'#7f756a':'#77776a',roof=seed%2?'#707c70':'#788173',trim=kind==='clinic'?'#b87860':'#78896d';
      out.fillStyle='#303a334d';out.beginPath();out.ellipse((c.x+e.x)/2,(c.y+e.y)/2+2,w*.19,5,0,0,Math.PI*2);out.fill();
      polygon([e,c,cb,eb],wall);polygon([c,b,bb,cb],side);polygon([ab,bb,cb,eb],roof);
      polygon([ab,bb,{x:bb.x,y:bb.y+3},{x:ab.x,y:ab.y+3}],'#c6b894');
      polygon([bb,cb,{x:cb.x,y:cb.y+3},{x:bb.x,y:bb.y+3}],'#66766a');
      const windowBand=(from,to,fractions)=>{
        const at=(t,lift)=>({x:Math.round(from.x+(to.x-from.x)*t),y:Math.round(from.y+(to.y-from.y)*t-lift)});
        for(const [t,width] of fractions){const low=height*.30,high=height*.68,frame=[at(t-.025,low-2),at(t+width+.025,low-2),at(t+width+.025,high+2),at(t-.025,high+2)],glass=[at(t,low),at(t+width,low),at(t+width,high),at(t,high)];polygon(frame,'#46594f');polygon(glass,(seed+Math.round(t*10))%3===0?'#d7bd83':'#8ca69b');polygon([at(t+.04,low+3),at(t+width*.43,low+3),at(t+width*.43,low+6),at(t+.04,low+6)],'#d8cfac');}
      };
      if(kind==='clinic'){
        windowBand(e,c,[[.12,.22],[.43,.22],[.74,.18]]);windowBand(c,b,[[.18,.18],[.58,.18]]);
        const signA={x:e.x+(c.x-e.x)*.34,y:e.y+(c.y-e.y)*.34-height*.18},signB={x:e.x+(c.x-e.x)*.70,y:e.y+(c.y-e.y)*.70-height*.18};
        out.strokeStyle='#526056';out.lineWidth=5;out.beginPath();out.moveTo(signA.x,signA.y);out.lineTo(signB.x,signB.y);out.stroke();out.strokeStyle='#ead9ac';out.lineWidth=3;out.beginPath();out.moveTo(signA.x,signA.y);out.lineTo(signB.x,signB.y);out.stroke();
        out.fillStyle='#58786b';out.font='bold 5px ui-monospace,monospace';out.textAlign='center';out.textBaseline='middle';out.fillText('CLINIC',(signA.x+signB.x)/2,(signA.y+signB.y)/2);
      }else{
        windowBand(e,c,[[.12,.19],[.43,.19],[.74,.19]]);windowBand(c,b,[[.16,.21],[.58,.21]]);
        const awningA={x:e.x+(c.x-e.x)*.04,y:e.y+(c.y-e.y)*.04-height*.20},awningB={x:e.x+(c.x-e.x)*.96,y:e.y+(c.y-e.y)*.96-height*.20};
        out.strokeStyle='#4d5c52';out.lineWidth=7;out.beginPath();out.moveTo(awningA.x,awningA.y);out.lineTo(awningB.x,awningB.y);out.stroke();out.strokeStyle=trim;out.lineWidth=4;out.beginPath();out.moveTo(awningA.x,awningA.y);out.lineTo(awningB.x,awningB.y);out.stroke();
      }
      // Small rooftop utility boxes tie these background homes to the same modern town.
      const unit=p(x+w*.71,y+d*.28,height+3);out.fillStyle='#59685b';out.fillRect(unit.x-5,unit.y-2,12,6);out.fillStyle='#aaa58b';out.fillRect(unit.x-3,unit.y-4,8,3);out.fillStyle='#657567';out.fillRect(unit.x+9,unit.y,2,5);
      out.strokeStyle='#4c5b51';out.lineWidth=1;out.beginPath();out.moveTo(ab.x,ab.y);out.lineTo(bb.x,bb.y);out.lineTo(cb.x,cb.y);out.stroke();
    };
    const pixelFacade=(wx,wy,kind)=>{
      const foot=project(wx,wy),cx=Math.round(foot.x),base=Math.round(foot.y),w=kind==='clinic'?92:104,h=kind==='clinic'?64:76,left=cx-Math.floor(w/2),top=base-h;
      const wall=kind==='clinic'?'#c5b79a':'#b6a48a',shade=kind==='clinic'?'#aa9477':'#9c8973',trim=kind==='clinic'?'#6f8877':'#77866d';
      out.save();out.imageSmoothingEnabled=false;
      out.fillStyle='#27372e55';out.fillRect(left+7,base-2,w-8,4);
      // Small stepped pixel silhouettes replace the broad floating roof planes.
      out.fillStyle='#5b675c';out.fillRect(left-3,top+4,w+6,5);out.fillRect(left+2,top,w-4,5);
      out.fillStyle=shade;out.fillRect(left+w-7,top+5,7,h-5);
      out.fillStyle=wall;out.fillRect(left,top+5,w-7,h-5);
      out.fillStyle=kind==='clinic'?'#c78065':'#d0b18a';out.fillRect(left+2,base-15,w-11,3);
      if(kind==='clinic'){
        out.fillStyle='#405c53';out.fillRect(left+17,top+9,w-34,9);
        out.fillStyle='#e4d5ad';out.font='bold 6px ui-monospace,monospace';out.textAlign='center';out.textBaseline='middle';out.fillText('CLINIC',cx,top+13);
      }
      const cols=kind==='clinic'?2:3,rows=kind==='clinic'?1:2,gap=kind==='clinic'?25:24,windowW=11,windowH=10;
      for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
        const wx0=cx-Math.floor((cols-1)*gap/2)+col*gap-windowW/2,wy0=top+(kind==='clinic'?27:14)+row*23;
        out.fillStyle='#536259';out.fillRect(wx0-2,wy0-2,windowW+4,windowH+4);
        out.fillStyle=(row+col)%3===0?'#d9c394':'#718b83';out.fillRect(wx0,wy0,windowW,windowH);
        out.fillStyle='#a9b2a0';out.fillRect(wx0+1,wy0+1,windowW-2,1);out.fillRect(wx0+5,wy0,1,windowH);
        out.fillStyle=shade;out.fillRect(wx0-3,wy0+windowH+2,windowW+6,2);
      }
      out.fillStyle='#59685c';out.fillRect(cx-5,base-13,10,13);out.fillStyle='#c6ae83';out.fillRect(cx+2,base-7,1,1);
      if(kind==='residential'){out.fillStyle=trim;out.fillRect(left+5,top+33,2,12);out.fillRect(left+w-13,top+33,2,12);out.fillRect(left+5,top+33,w-13,2)}
      out.restore();
    };
    out.save();out.imageSmoothingEnabled=false;
    // A single continuous service walk connects the store's east side to the
    // parking edge. It gives the hidden hatch a believable alley approach
    // without drawing a grid of isolated paving tiles or changing collision.
    if(worldApi?.poi){
      const quad=(x,y,w,h,color)=>{const points=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([wx,wy])=>project(wx,wy));polygon(points,color)};
      const alleyX=METRO_CLUE_WORLD.x-32,alleyY=METRO_CLUE_WORLD.y-12;
      quad(alleyX,alleyY,64,188,'#a49c84');
      quad(alleyX+8,alleyY+4,48,176,'#8f907d');
      const curbA=project(alleyX,alleyY+184),curbB=project(alleyX+64,alleyY+184);
      out.strokeStyle='#d2c5a1';out.lineWidth=1;out.beginPath();out.moveTo(Math.round(curbA.x)+.5,Math.round(curbA.y)+.5);out.lineTo(Math.round(curbB.x)+.5,Math.round(curbB.y)+.5);out.stroke();
      // A few broken pixel flecks make the concrete feel walked-in, not tiled.
      for(const [wx,wy,color] of [[alleyX+14,alleyY+36,'#b4a98a'],[alleyX+49,alleyY+79,'#777c6e'],[alleyX+21,alleyY+126,'#b9ad8b'],[alleyX+43,alleyY+153,'#7d8171']]){const p=project(wx,wy);out.fillStyle=color;out.fillRect(Math.round(p.x),Math.round(p.y),2,1)}
    }
    // Low-rise neighbors frame the shop. Leave a narrow service gap to the
    // clinic so the alley reads as a route instead of another solid block.
    // Pass 3 keeps the close streetscape legible: the earlier oversized
    // isometric neighbor blocks competed with the real shop and read as giant
    // geometric slabs at this camera scale.
    if(townArtPass<3){
      block(1740,720,280,160,74,'apt',3);
      block(2820,640,252,180,82,'clinic',2);
    }else{pixelFacade(1880,1200,'residential');pixelFacade(2946,1220,'clinic')}
    out.restore();
  }
  function drawPoiProp(o){
     const propId=String(o.id||''),store=worldApi?.poi,door=store?.entrance,nearStoreCutaway=currentZone==='1:0'&&cozyPixelProof&&townArtPass<3&&store&&door&&Math.hypot(me.x-(door.x+door.w*.5),me.y-door.y)<520;
     // In the close cutaway, hide the two camera-facing walls so the shop reads
     // as an open playable interior instead of a giant solid isometric box.
     if(nearStoreCutaway&&(propId==='store-wall-e'||propId.startsWith('store-wall-s-')))return;
     const{x,y,w,h}=o,foot=[project(x,y),project(x+w,y),project(x+w,y+h),project(x,y+h)],storeFront=propId.startsWith('store-wall-s-'),rise=o.kind==='wall'?(storeFront?38:24):o.kind==='fridge'?25:o.kind==='counter'?21:o.kind==='shelf'?15:8,top=foot.map(p=>({x:p.x,y:p.y-rise}));
    const polygon=(points,color)=>{out.fillStyle=color;out.beginPath();out.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)out.lineTo(points[i].x,points[i].y);out.closePath();out.fill()};
    const colors={wall:'#788477',fridge:'#71837b',counter:'#927d5b',shelf:'#887655',debris:'#756e5b',fence:'#77806f',barrier:'#a1987d'};
    if(o.kind==='wall'){
      // Solid near-facing planes replace the former pale wireframe-looking boxes.
      // Keep the cutaway readable, but lift the wall shadow so it cannot read
      // as a black unloaded patch around the shop interior.
      polygon([foot[1],foot[2],top[2],top[1]],'#68746a');
      polygon([foot[2],foot[3],top[3],top[2]],'#788477');
      polygon(top,colors.wall);
       const horizontal=w>=h,span=horizontal?w:h,step=storeFront?72:96,windowAlong=storeFront?34:20;
      for(let offset=48;offset<span-24;offset+=step){
        const base=horizontal?project(x+offset,y+h):project(x+w,y+offset),next=horizontal?project(x+offset+windowAlong,y+h):project(x+w,y+offset+windowAlong);
        const loA={x:base.x,y:base.y-rise*.28},loB={x:next.x,y:next.y-rise*.28},hiA={x:base.x,y:base.y-rise*.76},hiB={x:next.x,y:next.y-rise*.76};
        polygon([loA,loB,hiB,hiA],'#425854');
        const insetA={x:base.x+1,y:base.y-rise*.34},insetB={x:next.x-1,y:next.y-rise*.34},insetC={x:next.x-1,y:next.y-rise*.69},insetD={x:base.x+1,y:base.y-rise*.69};
        polygon([insetA,insetB,insetC,insetD],'#91aaa0');
        out.fillStyle='#e0d29a';out.fillRect(Math.round((base.x+next.x)/2),Math.round(base.y-rise*.66),2,1);
      }
       if(storeFront&&horizontal){
         const a=top[2],b=top[3],blend=(t,lift)=>({x:Math.round(a.x+(b.x-a.x)*t),y:Math.round(a.y+(b.y-a.y)*t+rise*lift)}),left=blend(.025,.08),right=blend(.975,.08),lowerLeft=blend(.025,.22),lowerRight=blend(.975,.22);
         polygon([left,right,lowerRight,lowerLeft],'#b9745e');
         for(let t=.06,i=0;t<.97;t+=.12,i++){
           const p=blend(t,.08),q=blend(Math.min(.975,t+.06),.08),r=blend(Math.min(.975,t+.06),.22),s=blend(t,.22);
           polygon([p,q,r,s],i%2?'#d2a17b':'#9c6756');
         }
         const sign=blend(.5,.34);out.fillStyle='#e1cd9b';out.fillRect(sign.x-18,sign.y-2,36,5);out.fillStyle='#4b5d53';out.font='bold 4px ui-monospace,monospace';out.textAlign='center';out.textBaseline='middle';out.fillText('MIRE MART',sign.x,sign.y+.5);
       }
    }else{
      polygon(top,colors[o.kind]||'#695f50');
      polygon([foot[1],foot[2],top[2],top[1]],'#26352c30');
    }
    out.strokeStyle=o.kind==='wall'?'#44534c88':'#5a5e5480';out.lineWidth=1;out.beginPath();out.moveTo(top[0].x,top[0].y);for(let i=1;i<4;i++)out.lineTo(top[i].x,top[i].y);out.closePath();out.stroke();
  }
  function drawTownCar(o){
    const point=(dx,dy,lift=0)=>{const p=project(o.x+dx,o.y+dy);return{x:p.x,y:p.y-lift}};
    const poly=(points,color)=>{out.fillStyle=color;out.beginPath();out.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)out.lineTo(points[i].x,points[i].y);out.closePath();out.fill()};
    const center=project(o.x,o.y);out.save();out.imageSmoothingEnabled=false;
    out.fillStyle='#26332d55';out.beginPath();out.ellipse(center.x,center.y+4,30,10,0,0,Math.PI*2);out.fill();
    const shell=[[-54,-7],[-45,-18],[28,-18],[49,-9],[54,5],[43,18],[-43,18],[-55,8]].map(([x,y])=>point(x,y,4));
    poly(shell,o.paint||'#607970');
    poly([point(-48,9),point(43,9),point(43,18),point(-43,18)],'#394a43');
    const cabin=[[-27,-15],[16,-15],[31,-7],[27,5],[-31,5],[-39,-5]].map(([x,y])=>point(x,y,11));
    poly(cabin,'#344b48');
    poly([point(-23,-12,12),point(-5,-12,12),point(-5,2,12),point(-28,2,12)],'#92aaa0');
    poly([point(-2,-12,12),point(14,-12,12),point(27,-5,12),point(24,2,12),point(-2,2,12)],'#a6b3a0');
    out.fillStyle='#26332d';for(const [x,y] of [[-32,15],[31,15]]){const w=project(o.x+x,o.y+y);out.fillRect(w.x-3,w.y-1,6,3)}
    const head=point(49,-4,5);out.fillStyle='#e8d7a4';out.fillRect(head.x-1,head.y-1,3,2);const tail=point(-51,1,5);out.fillStyle='#b96d5d';out.fillRect(tail.x-1,tail.y-1,3,2);
    out.fillStyle='#33433c';out.fillRect(Math.round(center.x-7),Math.round(center.y-3),3,1);out.fillRect(Math.round(center.x+5),Math.round(center.y-2),2,1);
    out.restore();
  }
  function drawTownStreetlight(o,now){
    const p=project(o.x,o.y);out.save();out.imageSmoothingEnabled=false;
    out.fillStyle='#26332d44';out.beginPath();out.ellipse(p.x,p.y+3,8,3,0,0,Math.PI*2);out.fill();
    out.fillStyle='#475951';out.fillRect(p.x-1,p.y-2,3,1);out.fillStyle='#3f5149';out.fillRect(p.x,p.y-43,2,42);out.fillRect(p.x+1,p.y-43,12,2);out.fillRect(p.x+10,p.y-43,2,5);
    out.fillStyle='#9aa88b';out.fillRect(p.x+8,p.y-39,6,2);out.fillStyle='#d4c991';out.fillRect(p.x+9,p.y-38,4,1);
    if(nightLevel()>.2){out.save();out.globalCompositeOperation='screen';out.globalAlpha=.2;const glow=out.createRadialGradient(p.x+11,p.y-37,1,p.x+11,p.y-37,24);glow.addColorStop(0,'#f4d891aa');glow.addColorStop(1,'#f4d89100');out.fillStyle=glow;out.fillRect(p.x-13,p.y-61,48,48);out.restore()}
    out.restore();
  }
  function drawTownBusStop(o){
    const p=(dx,dy,lift=0)=>{const q=project(o.x+dx,o.y+dy);return{x:q.x,y:q.y-lift}};
    const poly=(points,color)=>{out.fillStyle=color;out.beginPath();out.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)out.lineTo(points[i].x,points[i].y);out.closePath();out.fill()};
    out.save();out.imageSmoothingEnabled=false;
    poly([p(-34,-14),p(32,-14),p(32,14),p(-34,14)],'#59665c');
    poly([p(-31,-11,1),p(29,-11,1),p(29,11,1),p(-31,11,1)],'#858775');
    out.fillStyle='#334640';for(const x of [-30,27]){const q=p(x,0,35);out.fillRect(q.x-1,q.y-1,2,34)}
    const roof=[p(-34,-14,35),p(31,-14,35),p(35,14,35),p(-30,14,35)];poly(roof,'#53645b');poly([p(-32,-12,37),p(28,-12,37),p(32,11,37),p(-28,11,37)],'#758576');
    poly([p(-26,-8,31),p(-3,-8,31),p(-3,10,31),p(-26,10,31)],'#8eaaa0');poly([p(2,-8,31),p(23,-8,31),p(23,10,31),p(2,10,31)],'#95aaa0');
    out.fillStyle='#d9ca9b';const sign=p(-25,-12,43);out.fillRect(sign.x,sign.y,16,4);out.fillStyle='#43554c';out.font='bold 3px ui-monospace,monospace';out.textAlign='center';out.fillText('NORTH 04',sign.x+8,sign.y+3);
    out.fillStyle='#4c5348';const seat=p(-11,4,12);out.fillRect(seat.x-5,seat.y,15,2);out.fillRect(seat.x-4,seat.y+2,2,5);out.fillRect(seat.x+7,seat.y+2,2,5);
    out.restore();
  }
  function drawMireMartRoof(){
    if(currentZone!=='1:0'||!cozyPixelProof||!worldApi?.poi||townArtPass>=3)return;
    const store=worldApi.poi,roof={x:store.x-12,y:store.y-10,w:store.w+24,h:Math.round(store.h*.62)},lift=61;
    const point=(x,y,z=lift)=>{const p=project(x,y);return{x:p.x,y:p.y-z}};
    const poly=(points,color)=>{out.fillStyle=color;out.beginPath();out.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)out.lineTo(points[i].x,points[i].y);out.closePath();out.fill()};
    const a=point(roof.x,roof.y),b=point(roof.x+roof.w,roof.y),c=point(roof.x+roof.w,roof.y+roof.h),d=point(roof.x,roof.y+roof.h),inside=me.x>=store.x&&me.x<=store.x+store.w&&me.y>=store.y&&me.y<=store.y+store.h,door=store.entrance||{x:store.x+store.w*.5,y:store.y+store.h},approach=Math.hypot(me.x-(door.x+door.w*.5),me.y-door.y);
    // Hide the roof like a classic isometric cutaway when the player is at the
    // shop, instead of ghosting it over the interior and the street props.
    if(inside||approach<520)return;
    out.save();out.imageSmoothingEnabled=false;out.globalAlpha=.94;
    poly([{x:a.x,y:a.y+3},{x:b.x,y:b.y+3},{x:c.x,y:c.y+3},{x:d.x,y:d.y+3}],'#586352');
    poly([a,b,c,d],'#858a78');
    // A low parapet and three faint panel joints keep the roof readable as one
    // connected pixel-art plane instead of a stack of tile-like strips.
    out.strokeStyle='#c0b795';out.lineWidth=2;out.beginPath();out.moveTo(a.x,a.y);out.lineTo(b.x,b.y);out.lineTo(c.x,c.y);out.stroke();
    out.globalAlpha*=.42;out.strokeStyle='#59685a';out.lineWidth=1;
    for(const t of [.25,.50,.75]){const left={x:a.x+(d.x-a.x)*t,y:a.y+(d.y-a.y)*t},right={x:b.x+(c.x-b.x)*t,y:b.y+(c.y-b.y)*t};out.beginPath();out.moveTo(left.x,left.y);out.lineTo(right.x,right.y);out.stroke()}
    for(const [x,y] of [[store.x+116,store.y+78],[store.x+438,store.y+78],[store.x+486,store.y+224]]){
      const u=24,v=16,base=[point(x-u,y-v),point(x+u,y-v),point(x+u,y+v),point(x-u,y+v)],top=[point(x-u,y-v,lift+10),point(x+u,y-v,lift+10),point(x+u,y+v,lift+10),point(x-u,y+v,lift+10)];
      poly([base[1],base[2],top[2],top[1]],'#55645a');poly([base[2],base[3],top[3],top[2]],'#667367');poly(top,'#aaa88f');
      out.fillStyle='#68796b';for(let vent=0;vent<4;vent++)out.fillRect(Math.round(top[0].x+5+vent*3),Math.round(top[0].y+3),1,7);
      const pipe=point(x+u-5,y-v+4,lift+10);out.fillStyle='#d2c99e';out.fillRect(pipe.x,pipe.y-2,2,5);
    }
    const sign=point(store.x+store.w*.52,store.y+14,lift+2);out.fillStyle='#d2c89e';out.fillRect(sign.x-18,sign.y-6,36,10);out.fillStyle='#4b5b51';out.font='bold 6px ui-monospace,monospace';out.textAlign='center';out.textBaseline='middle';out.fillText('MIRE MART',sign.x,sign.y-1);
    out.restore();
  }
  function fieldRigTier(){const actual=Number(window.ABYSSAL_HOME_WORKBENCH_V1?.getState?.()?.tier)||1;return actual>=2||window.AW_SUCCESSOR_PREVIEW===true&&window.AW_DEV_QA===true&&window.AW_SUCCESSOR_PREVIEW_FIELD_RIG_TIER===2?2:1}
  function drawFieldRigUpgrade(anchor,now){
    if(fieldRigTier()<2||currentZone!=='1:1')return;
    const p=project(anchor.x+25,anchor.y-2),pulse=.72+.28*Math.sin(now/190),x=Math.round(p.x),y=Math.round(p.y);
    out.save();out.globalCompositeOperation='screen';out.globalAlpha=.28*pulse;
    const glow=out.createRadialGradient(x,y-17,1,x,y-17,27);glow.addColorStop(0,'#65e6dc99');glow.addColorStop(.45,'#3b9b9180');glow.addColorStop(1,'#164c4800');out.fillStyle=glow;out.fillRect(x-27,y-44,54,54);out.restore();
    groundShadow({x,y},13);out.save();out.imageSmoothingEnabled=false;
    // A compact docked field scanner makes the paid HOME upgrade visible in the world.
    out.fillStyle='#182522';out.fillRect(x-10,y-31,21,23);out.fillStyle='#69756b';out.fillRect(x-8,y-29,17,3);out.fillStyle='#344640';out.fillRect(x-8,y-26,17,15);
    out.fillStyle='#14201d';out.fillRect(x-6,y-24,12,8);out.fillStyle='#55e1d4';out.globalAlpha=.68+.32*pulse;out.fillRect(x-4,y-22,8,2);out.fillRect(x-2,y-19,4,2);
    out.globalAlpha=1;out.fillStyle='#9c9a79';out.fillRect(x-7,y-12,15,2);out.fillStyle='#c2b487';out.fillRect(x-4,y-10,9,2);
    out.fillStyle='#222d29';out.fillRect(x+5,y-39,2,10);out.fillRect(x+3,y-41,6,2);out.fillStyle='#72f4e5';out.fillRect(x+5,y-42,2,2);
    out.fillStyle='#10201de8';out.fillRect(x-42,y-58,84,13);out.strokeStyle='#67b7a9';out.lineWidth=1;out.strokeRect(x-41.5,y-57.5,83,12);out.fillStyle='#d1e4c7';out.font='bold 7px ui-monospace,monospace';out.textAlign='center';out.textBaseline='middle';out.fillText('WARD +10s · FIELD RIG',x,y-51.5);out.restore();
  }
  function drawPoiSign(o){
    const art=window.ABYSSAL_AWAKENING_ART_V1;
    const entry=art?.pick?.('prop','sign',0),image=entry&&art?.state?.images?.get?.(entry.file);
    const point=project(o.x+o.w/2,o.y+o.h),hasArt=art?.previewMode===true&&!!entry&&!!image?.complete&&!!image.naturalWidth;
    out.save();out.imageSmoothingEnabled=false;
    if(hasArt){
      const source=entry.sourceRect||{x:0,y:0,w:image.naturalWidth,h:image.naturalHeight},width=Math.max(1,Math.round(Number(entry.width)||source.w)),height=Math.max(1,Math.round(Number(entry.height)||source.h)),anchor=entry.anchor||{x:.5,y:1};
      out.drawImage(image,source.x,source.y,source.w,source.h,Math.round(point.x-width*Number(anchor.x??.5)),Math.round(point.y-height*Number(anchor.y??1)),width,height);
    }else{
      const x=Math.round(point.x),y=Math.round(point.y);
       out.fillStyle='#44574e';out.fillRect(x-2,y-43,4,33);out.fillRect(x-47,y-46,94,3);
       out.fillStyle='#435852';out.fillRect(x-51,y-68,102,26);out.strokeStyle='#728778';out.lineWidth=1;out.strokeRect(x-51.5,y-68.5,103,27);out.fillStyle='#cbb88b';out.fillRect(x-46,y-63,92,17);
       out.fillStyle='#657a6c';out.fillRect(x-43,y-60,86,12);out.fillStyle='#f0dca7';out.fillRect(x-39,y-58,78,9);
       out.fillStyle='#536452';out.fillRect(x-36,y-54,72,3);out.fillStyle='#48594f';out.font='bold 8px ui-monospace,monospace';out.textAlign='center';out.textBaseline='middle';out.fillText('MIRE MART',x,y-53);
    }
    const plaqueWidth=68,plaqueHeight=10,plaqueY=Math.round(point.y-31);
    out.fillStyle='#243834';out.fillRect(Math.round(point.x-plaqueWidth/2),plaqueY,plaqueWidth,plaqueHeight);out.strokeStyle='#728778';out.lineWidth=1;out.strokeRect(Math.round(point.x-plaqueWidth/2)+.5,plaqueY+.5,plaqueWidth-1,plaqueHeight-1);
    out.fillStyle='#c8c2a0';out.font='bold 6px ui-monospace,monospace';out.textAlign='center';out.textBaseline='middle';out.fillText('NO POWER',Math.round(point.x),plaqueY+plaqueHeight/2);
    out.restore();return true;
  }
  function groundShadow(p,rx=12){out.fillStyle='#07130e77';out.beginPath();out.ellipse(p.x,p.y,rx,4,0,0,Math.PI*2);out.fill()}
  function drawProp(o){const p=project(o.x,o.y);if(cozyPixelProof&&cozyPixelArt?.drawCampProp&&cozyPixelArt.drawCampProp(out,{point:p,index:o.index,scale:o.scale}))return;const scale=o.scale;groundShadow(p,16*scale);const image=img.props,cell=48;if(image?.complete&&image.naturalWidth){const col=o.index%4,row=Math.floor(o.index/4),w=cell*scale,h=cell*scale;out.drawImage(image,col*cell,row*cell,cell,cell,p.x-w/2,p.y-h*.76,w,h)}else{out.fillStyle='#806446';out.fillRect(p.x-13*scale,p.y-25*scale,26*scale,25*scale)}}
  function drawActorWeapon(screen,p,self,face){
    const presentation=window.ABYSSAL_WEAPON_PRESENTATION_V1;
    if(!presentation?.drawBoneKnife)return;
    const equipped=self?!!inventory?.knife:presentation.remoteWeapon?.(p.id)==='knife';
    if(!equipped)return;
    const poseState=presentation.poseFor?.(p,self);if(!poseState)return;
    const flash=Math.max(0,Number(self?attackFlash:p?.attack)||0),facing=Math.atan2(face.y,face.x);
    const leaning=Math.abs(face.x)>.45?Math.sign(face.x)*.42:(face.y>=0?.16:-.16);
    const angle=poseState.attacking?presentation.swingAngle(facing,flash):(poseState.safe?Math.atan2(1,leaning):facing+.38);
    const handY=highDetailActor()?pixelSurvivorLive?25:generatedWalkAtlasQa?72:78:25;
    return presentation.drawBoneKnife({...poseState,x:Math.round(screen.x+face.x*5-face.y*3),y:Math.round(screen.y-handY+face.y*4+face.x*3),angle},poseState.attacking?.84+.16*poseState.emphasis:(poseState.safe?.76:.9),out);
  }
  function drawFacingCue(screen,face){
    const length=Math.hypot(face.x,face.y)||1,dx=face.x/length,dy=face.y/length;
    const baseY=highDetailActor()?(pixelSurvivorLive?-30:-60):-17,x=Math.round(screen.x+dx*19),y=Math.round(screen.y+baseY+dy*19);
    out.save();out.globalAlpha=.72;out.fillStyle='#d9c18a';
    out.fillRect(x-Math.round(dx*2),y-Math.round(dy*2),3,3);
    out.globalAlpha=.32;out.fillStyle='#eff0d2';
    out.fillRect(Math.round(screen.x+dx*13),Math.round(screen.y-17+dy*13),2,2);out.restore();
  }
  function drawActor(p,self=false,isNetworkPlayer=false){
    const screen=projectActor(p.x,p.y,self),candidateReady=highDetailActor()&&(self||((liveSurvivorAtlas||pixelSurvivorLive)&&isNetworkPlayer));groundShadow(screen,pixelSurvivorLive&&candidateReady?10:playableGroundDraft?24:candidateReady?18:(self?10:9));const image=candidateReady?playerCandidateImage:img.player,worldDir=Number(p.dir)||0,face=adapter.project(Math.cos(worldDir),Math.sin(worldDir));
     const row=actorRow(worldDir),moving=self?visualMoving:!!p.moving,walkPhase=self?visualWalkClock:performance.now()/1000;
    // Keep the extracted concept's neutral pose for a short contact beat, then
    // cycle only its authored walk poses. A shared phase prevents local and
    // remote render paths from introducing per-frame foot-anchor wobble.
    const walkTick=Math.floor(walkPhase*7),frame=moving&&candidateReady?(generatedWalkAtlasQa?Math.floor(walkPhase*7)%6:walkTick%4===0?0:1+((walkTick-1)%3)):moving?(self?Math.floor(walkPhase*8)%4:Math.floor(performance.now()/150+(p.id?.length||0))%4):0;
    const presentation=window.ABYSSAL_WEAPON_PRESENTATION_V1,weapon=self?!!inventory?.knife:presentation?.remoteWeapon?.(p.id)==='knife';
    const flash=Math.max(0,Number(self?attackFlash:p?.attack)||0),safe=weapon&&presentation?.isSafeCamp?.(p),drawBefore=weapon&&!flash&&(safe||row===3);
    if(drawBefore)drawActorWeapon(screen,p,self,face);
    if(cozyPixelProof&&cozyPixelArt?.drawPlayer)cozyPixelArt.drawPlayer(out,{x:screen.x,y:screen.y,row,frame});else if(candidateReady&&pixelSurvivorLive){const cell=313,anchorX=157,anchorY=295,scale=view.clientWidth<520?.16:.19;out.save();out.imageSmoothingEnabled=false;out.drawImage(image,frame*cell,row*cell,cell,cell,Math.round(screen.x-anchorX*scale),Math.round(screen.y-anchorY*scale),Math.round(cell*scale),Math.round(cell*scale));out.restore()}
    else if(candidateReady&&generatedWalkAtlasQa){const sourceRow=[0,3,1,2][row],cell=256,anchorX=128,anchorY=252,scale=Math.max(.4,Math.min(.8,Number(window.AW_SUCCESSOR_GENERATED_WALK_ATLAS_SCALE)||.55));out.save();out.imageSmoothingEnabled=true;out.drawImage(image,frame*cell,sourceRow*cell,cell,cell,Math.round(screen.x-anchorX*scale),Math.round(screen.y-anchorY*scale),Math.round(cell*scale),Math.round(cell*scale));out.restore()}
    else if(candidateReady){const meta=window.AW_SURVIVOR_ATLAS_FRAMES?.frameOrder?.find?.(pose=>pose.row===row&&pose.col===frame),crop=meta?.source,cellAnchor=meta?.anchor||{x:96,y:316},cellOriginX=Math.floor((crop?.x||0)/192)*192,cellOriginY=Math.floor((crop?.y||row*320)/320)*320,foot={x:cellAnchor.x-((crop?.x||0)-cellOriginX),y:cellAnchor.y-((crop?.y||row*320)-cellOriginY)},scale=view.clientWidth<520?.62:.78;if(crop?.w&&crop?.h){out.save();out.imageSmoothingEnabled=true;out.drawImage(image,crop.x,crop.y,crop.w,crop.h,Math.round(screen.x-foot.x*scale),Math.round(screen.y-foot.y*scale),Math.round(crop.w*scale),Math.round(crop.h*scale));out.restore()}else{out.save();out.imageSmoothingEnabled=true;out.drawImage(image,frame*192,row*320,192,320,Math.round(screen.x-48),Math.round(screen.y-160),96,160);out.restore()}}
    else if(image?.complete&&image.naturalWidth)out.drawImage(image,frame*24,row*32,24,32,Math.round(screen.x-14),Math.round(screen.y-38),28,38);
    else{out.fillStyle=p.color||'#426a70';out.fillRect(screen.x-7,screen.y-22,14,20)}
    if(self&&weapon&&!safe&&flash<=0)drawFacingCue(screen,face);
    if(self&&attackFlash>0){out.strokeStyle='#f4d887';out.lineWidth=2;out.beginPath();out.arc(screen.x,screen.y-(candidateReady?(pixelSurvivorLive?33:70):18),candidateReady?(pixelSurvivorLive?27:46):25,-.8,.8);out.stroke()}
    if(weapon&&!drawBefore)drawActorWeapon(screen,p,self,face);
    if(self){const actionNow=performance.now();drawAxeSwing(screen,actionNow,candidateReady?12:8,candidateReady?22:23);drawPickSwing(screen,actionNow,candidateReady?12:9,candidateReady?22:22)}
    if(p.name&&!(cozyPixelProof&&self&&p.name==='Local Preview')){const nameOffset=candidateReady?(pixelSurvivorLive?(view.clientWidth<520?43:51):(view.clientWidth<520?194:244)):41;out.fillStyle='#fff4d3';out.font='bold 8px ui-monospace,monospace';out.textAlign='center';out.fillText(clean(p.name),screen.x,screen.y-nameOffset)}
  }
  function drawCombatImpacts(now){
    const fx=window.ABYSSAL_HIT_FEEDBACK;if(!fx)return;
    fx.sparks=fx.sparks.filter(spark=>spark.until>now);fx.impacts=fx.impacts.filter(impact=>impact.until>now);fx.labels=fx.labels.filter(label=>label.until>now);
    if(!fx.sparks.length&&!fx.impacts.length&&!fx.labels.length)return;
    out.save();out.imageSmoothingEnabled=false;
    for(const spark of fx.sparks){
      const total=spark.duration||(spark.killed?210:165),life=Math.max(0,Math.min(1,(spark.until-now)/total)),point=project(spark.x,spark.y-7);
      out.globalAlpha=.32+.68*life;out.fillStyle=spark.killed?'#fff4cf':'#fff0b3';
      out.fillRect(point.x-1,point.y-7,2,14);out.fillRect(point.x-7,point.y-1,14,2);
      out.fillStyle=spark.killed?'#f5c56f':'#e7a24b';out.fillRect(point.x-5,point.y-5,2,2);out.fillRect(point.x+4,point.y-5,2,2);out.fillRect(point.x-5,point.y+4,2,2);out.fillRect(point.x+4,point.y+4,2,2);
    }
    for(const impact of fx.impacts){
      const life=Math.max(0,Math.min(1,(impact.until-now)/impact.duration)),progress=1-life,point=project(impact.x,impact.y-7),radius=Math.round((impact.killed?8:5)+(impact.killed?17:10)*progress);
      out.globalAlpha=(impact.killed?.62:.42)*life;out.fillStyle=impact.killed?'#ffd98a':'#f0b45c';
      out.fillRect(point.x-radius,point.y-1,Math.max(2,Math.round(6*life)),2);out.fillRect(point.x+radius-Math.max(2,Math.round(6*life)),point.y-1,Math.max(2,Math.round(6*life)),2);
      out.fillRect(point.x-1,point.y-radius,2,Math.max(2,Math.round(6*life)));out.fillRect(point.x-1,point.y+radius-Math.max(2,Math.round(6*life)),2,Math.max(2,Math.round(6*life)));
      if(impact.killed){const d=Math.max(4,Math.round(radius*.66));out.fillRect(point.x-d,point.y-d,3,3);out.fillRect(point.x+d-2,point.y-d,3,3);out.fillRect(point.x-d,point.y+d-2,3,3);out.fillRect(point.x+d-2,point.y+d-2,3,3)}
      else if(life>.55){out.globalAlpha=.16*life;out.fillStyle='#fff7da';out.fillRect(point.x-4,point.y-5,8,8)}
    }
    for(const label of fx.labels){
      const life=Math.max(0,Math.min(1,(label.until-now)/label.duration)),rise=Math.round((1-life)*18),point=project(label.x,label.y-24-rise),value=`-${label.damage}`;
      out.globalAlpha=Math.min(1,life*1.5);out.font='bold 13px ui-monospace,monospace';out.textAlign='center';out.textBaseline='middle';
      out.fillStyle='#211b18';out.fillText(value,point.x+1,point.y+2);
      out.fillStyle=label.killed?'#fff0b4':'#ffe2a0';out.fillText(value,point.x,point.y);
    }
    out.restore();
  }
  function drawResourceWorkFeedback(now){
    for(let i=resourceWorkFeedback.length-1;i>=0;i--)if(resourceWorkFeedback[i].until<=now)resourceWorkFeedback.splice(i,1);
    if(!resourceWorkFeedback.length)return;
    out.save();out.imageSmoothingEnabled=false;out.textAlign='center';out.textBaseline='middle';out.font='bold 11px ui-monospace,monospace';
    for(const hit of resourceWorkFeedback){
      const age=now-hit.at,rise=Math.min(12,Math.floor(age/65)),point=project(hit.x,hit.y-20-rise),material=hit.type==='wood'?'木材':'石材',label=hit.complete?`获得 ${hit.type==='wood'?'木':'石'} ×1`:`${material} ${hit.hit}/${hit.total}`,width=Math.max(66,Math.ceil(label.length*11+18)),left=Math.round(point.x-width/2),top=Math.round(point.y-70),fade=Math.min(1,(hit.until-now)/180),tone=hit.type==='wood'?'#e7c77c':'#cad8d8';
      const pulse=age<150?Math.sin(age/17)*2:0;
      out.globalAlpha=fade;out.fillStyle='#1b2927';out.fillRect(left,top,width,20);
      out.strokeStyle=hit.complete?'#f1d286':tone;out.lineWidth=1;out.strokeRect(left+.5,top+.5,width-1,19);
      out.fillStyle=hit.complete?'#ffe3a0':'#f4f0d9';out.fillText(label,Math.round(point.x+pulse),top+8);
      if(!hit.complete){const barWidth=width-12,fillWidth=Math.max(2,Math.round(barWidth*(hit.hit/hit.total)));out.fillStyle='#3c4942';out.fillRect(left+6,top+16,barWidth,2);out.fillStyle=tone;out.fillRect(left+6,top+16,fillWidth,2)}
      if(age<320){const spread=Math.round(age/24),alpha=(1-age/320)*.95;out.globalAlpha=alpha;out.fillStyle=hit.type==='wood'?'#f1cf83':'#d9e4df';for(const [dx,dy,sx,sy] of [[-10,-7,-1,-1],[9,-5,1,-1],[-8,7,-1,1],[11,6,1,1]])out.fillRect(Math.round(point.x+dx+sx*spread),Math.round(point.y+dy+sy*spread),3,2)}
    }
    out.restore();
  }
  function drawPlayerHurt(now){
    const fx=window.ABYSSAL_HIT_FEEDBACK;if(!fx)return;
    const remain=fx.hurtUntil-now,pulse=fx.hurtPulseUntil-now;if(remain<=0&&pulse<=0)return;
    out.save();out.setTransform(dpr,0,0,dpr,0,0);
    if(pulse>0){out.globalAlpha=.07*Math.min(1,pulse/110);out.fillStyle='#d94d43';out.fillRect(0,0,view.clientWidth,view.clientHeight)}
    if(remain>0){const alpha=Math.min(1,remain/220),notch=Math.max(8,Math.min(18,Math.round(Math.min(view.clientWidth,view.clientHeight)*.035)));out.globalAlpha=.42*alpha;out.strokeStyle='#ef6b5e';out.lineWidth=6;out.strokeRect(3,3,Math.max(0,view.clientWidth-6),Math.max(0,view.clientHeight-6));out.globalAlpha=.5*alpha;out.fillStyle='#f08a7d';out.fillRect(5,5,notch,2);out.fillRect(5,5,2,notch);out.fillRect(view.clientWidth-5-notch,5,notch,2);out.fillRect(view.clientWidth-7,5,2,notch);out.fillRect(5,view.clientHeight-7,notch,2);out.fillRect(5,view.clientHeight-5-notch,2,notch);out.fillRect(view.clientWidth-5-notch,view.clientHeight-7,notch,2);out.fillRect(view.clientWidth-7,view.clientHeight-5-notch,2,notch)}
    out.restore();
  }
  function drawExplorationLighting(now){
    if(currentZone==='1:1')return;
    const poiMood=blackmarshGroundQa&&currentZone==='1:0';
    const darkness=Math.max(0,Math.min(1,nightLevel())),insanity=1-Math.max(0,Math.min(100,Number(me.sanity)||0))/100;
    if(darkness<.12&&insanity<.3&&!poiMood)return;
    const W=view.clientWidth,H=view.clientHeight,p=projectViewport(me.x,me.y),direction=adapter.project(Math.cos(Number(me.dir)||0),Math.sin(Number(me.dir)||0)),length=Math.hypot(direction.x,direction.y)||1,dx=direction.x/length,dy=direction.y/length;
    out.save();out.setTransform(dpr,0,0,dpr,0,0);
    // Low sanity should bend perception, not erase a daytime town or make the
    // finite map edge look like a failed load. Reserve stronger darkness for night.
    const overlay=Math.min(.18,(poiMood?.06:0)+darkness*.18+Math.max(0,insanity-.3)*.045);
    if(overlay>0){out.globalAlpha=overlay;out.fillStyle=insanity>.42?'#100d1a':'#050d13';out.fillRect(0,0,W,H)}
    const radius=inventory.lantern?184:126,lightX=p.x+dx*26,lightY=p.y-15+dy*26;
    out.save();out.globalCompositeOperation='screen';out.globalAlpha=(poiMood?.24:.28)+darkness*.28;
    const glow=out.createRadialGradient(lightX,lightY,3,lightX,lightY,radius);
    glow.addColorStop(0,'rgba(149,224,211,.30)');glow.addColorStop(.26,'rgba(98,173,164,.17)');glow.addColorStop(.68,'rgba(55,111,111,.055)');glow.addColorStop(1,'rgba(28,67,73,0)');
    out.fillStyle=glow;out.beginPath();out.ellipse(lightX,lightY,radius,radius*.62,0,0,Math.PI*2);out.fill();
    out.globalAlpha=.07+darkness*.075;out.fillStyle='#9bd8cd';out.beginPath();out.moveTo(p.x+dx*5-dy*7,p.y-20+dy*5+dx*7);out.lineTo(p.x+dx*radius-dy*radius*.5,p.y-20+dy*radius+dx*radius*.5);out.lineTo(p.x+dx*radius+dy*radius*.5,p.y-20+dy*radius-dx*radius*.5);out.closePath();out.fill();out.restore();
    if(darkness>.22||poiMood){out.globalAlpha=Math.min(.15,(poiMood?.08:.06)+darkness*.10);const vignette=out.createRadialGradient(W/2,H/2,Math.min(W,H)*.22,W/2,H/2,Math.max(W,H)*.72);vignette.addColorStop(0,'rgba(0,4,8,0)');vignette.addColorStop(.58,'rgba(0,4,8,.06)');vignette.addColorStop(1,'rgba(0,3,8,.30)');out.fillStyle=vignette;out.fillRect(0,0,W,H)}
    if(insanity>.3){out.globalAlpha=Math.min(.045,(insanity-.3)*.085);out.fillStyle='#713b7c';out.fillRect(0,0,W,H)}
    // A faint wet-glass grain keeps the lit pool from reading as a flat UI gradient.
    if(darkness>.3){const seed=Math.floor(now/120),grainX=(seed*37)%Math.max(1,W),grainY=(seed*61)%Math.max(1,H);out.globalAlpha=.12;out.fillStyle='#a5c7bd';out.fillRect(grainX,grainY,2,1);out.fillRect((grainX+Math.floor(W*.37))%W,(grainY+Math.floor(H*.53))%H,1,2)}
    out.restore();
  }
  function drawMob(m){if(m.hp<=0)return;const p=project(m.x,m.y),frame=Math.floor(performance.now()/180+Math.abs(m.phase||0))%4;if(m.kind==='boss'){const pulse=.5+Math.sin(performance.now()/170)*.5;groundShadow(p,22);if(m.phase<0){out.fillStyle='rgba(221,144,111,.58)';const r=32+Math.min(10,Math.abs(m.phase)*5);out.fillRect(p.x-r,p.y-2,11,2);out.fillRect(p.x+r-11,p.y-2,11,2);out.fillRect(p.x-2,p.y-r*.28,4,2);out.fillRect(p.x-2,p.y+r*.28,4,2)}out.save();out.translate(Math.round(p.x),Math.round(p.y));out.fillStyle='#182522';out.fillRect(-18,-45,36,35);out.fillRect(-25,-38,50,22);out.fillStyle='#30453b';out.fillRect(-15,-55,30,16);out.fillRect(-22,-47,44,22);out.fillStyle='#58735a';out.fillRect(-12,-54,24,6);out.fillRect(-18,-45,36,10);out.fillRect(-15,-27,30,12);out.fillStyle='#b9cf87';out.fillRect(-11,-43,5,3);out.fillRect(7,-43,5,3);out.fillStyle=`rgba(142,211,166,${(.18+pulse*.32).toFixed(2)})`;out.fillRect(-9,-43,3,2);out.fillRect(9,-43,3,2);out.restore();const ratio=Math.max(0,Math.min(1,m.hp/(m.maxHp||220))),barW=76;out.fillStyle='#17201d';out.fillRect(p.x-barW/2,p.y-68,barW,7);out.fillStyle='#cb8173';out.fillRect(p.x-barW/2+1,p.y-67,(barW-2)*ratio,5);out.fillStyle='#ede6d2';out.textAlign='center';out.font='bold 7px ui-monospace,monospace';out.fillText('沼心守望者',p.x,p.y-72);return}groundShadow(p,11);const row=m.kind==='watcher'?0:m.kind==='cultist'?1:2;if(img.monsters?.complete&&img.monsters.naturalWidth)out.drawImage(img.monsters,frame*32,row*32,32,32,p.x-19,p.y-38,38,38);else{out.fillStyle='#223b33';out.fillRect(p.x-9,p.y-18,18,18)}out.fillStyle='#1b2520';out.fillRect(p.x-12,p.y-42,24,3);out.fillStyle='#cb8173';out.fillRect(p.x-12,p.y-42,24*Math.max(0,Math.min(1,m.hp/(m.kind==='watcher'?95:m.kind==='cultist'?72:58))),3)}
  function drawPixelTree(point,variant,chopping,age){
    const fall=chopping?Math.pow(Math.max(0,Math.min(1,(age-90)/470)),1.25)*.82:0,shake=chopping?Math.sin(age/18)*.045*(1-fall):0;
    out.save();out.translate(Math.round(point.x),Math.round(point.y));out.rotate(fall+shake);out.imageSmoothingEnabled=false;out.globalAlpha=chopping?Math.max(.08,1-age/610):1;
    out.fillStyle='#26362866';out.beginPath();out.ellipse(0,-1,19,5,0,0,Math.PI*2);out.fill();
    out.fillStyle='#634b33';out.fillRect(-4,-20,9,20);out.fillStyle='#a0784b';out.fillRect(-2,-19,3,16);out.fillStyle='#493b2c';out.fillRect(3,-17,2,15);
    const leaves=variant%3===0?['#385a35','#598148','#83a75d','#b8c476']:variant%3===1?['#405d3d','#638454','#8fac68','#c0c77c']:['#4a5e36','#73844c','#a0a65f','#d0c57c'];
    const crown=[[-14,-55,28,6],[-20,-49,40,8],[-24,-41,48,9],[-25,-32,50,9],[-22,-23,44,7],[-15,-17,30,5]];
    for(const [x,y,w,h] of crown){out.fillStyle=leaves[0];out.fillRect(x-2,y,w+4,h+1);out.fillStyle=leaves[1];out.fillRect(x,y,w,h);out.fillStyle=leaves[2];out.fillRect(x+3,y+1,Math.max(3,w-10),Math.max(2,h-4))}
    const glints=[[-12,-46,5,2],[5,-50,4,2],[13,-39,5,2],[-18,-31,4,2],[2,-28,5,2]];
    out.fillStyle=leaves[3];for(const [x,y,w,h] of glints)out.fillRect(x,y,w,h);
    out.restore();
    if(chopping){out.save();out.globalAlpha=Math.max(0,1-age/560);for(let i=0;i<5;i++){const phase=age/21+i*1.7;out.fillStyle=i%2?'#c89a57':'#9fac67';out.fillRect(Math.round(point.x+Math.sin(phase)*12),Math.round(point.y-35+(age%160)*-.11+i*4),i%2?3:2,2)}out.restore()}
  }
  function drawResource(r){
    const now=Date.now(),harvestUntil=harvested.get(r.id)||0,age=now-localActionAt,nodeCell=terrain?.worldToCell?.(r.x,r.y),treeNode=(treeCandidateQa||pixelSurvivorLive||cozyPixelProof)&&r.type==='wood'&&/^camp:[0-5]$/.test(String(r.id))&&!!nodeCell&&terrain.rawMaterial(nodeCell.col,nodeCell.row)==='grass',chopping=treeNode&&String(r.id)===choppedResourceId&&localAction==='harvest'&&age>=0&&age<560;
    if(harvestUntil>now&&!chopping)return;const p=project(r.x,r.y),impact=resourceWorkFeedback.find(hit=>String(hit.id)===String(r.id)),impactAge=impact?performance.now()-impact.at:Infinity;if(impactAge<220)p.x+=Math.round(Math.sin(impactAge/16)*3*(1-impactAge/220));
    if(resourceArtQa&&(String(r.id).startsWith('camp:')||String(r.id).startsWith('poi:store:'))&&r.type!=='wood'&&resourceCandidateImage.complete&&resourceCandidateImage.naturalWidth===1536&&resourceCandidateImage.naturalHeight===1024){const cell={stone:[768,0,86,72,43,72],food:[0,512,68,54,34,54],shard:[768,512,72,66,36,66]}[r.type];if(cell){out.save();out.imageSmoothingEnabled=true;out.drawImage(resourceCandidateImage,cell[0],cell[1],768,512,Math.round(p.x-cell[4]),Math.round(p.y-cell[5]),cell[2],cell[3]);out.restore();return}}
    if(treeNode){if(cozyPixelProof&&cozyPixelArt?.drawTree){cozyPixelArt.drawTree(out,{point:p,variant:Number(String(r.id).split(':')[1])||0,chopping,age})}else if(treeCandidateQa&&treeCandidateImage.complete&&treeCandidateImage.naturalWidth===1024){const v=Number(String(r.id).split(':')[1])||0,scale=.84+(v%3)*.08,fall=chopping?Math.pow(Math.max(0,Math.min(1,(age-90)/470)),1.35)*.92:0;out.save();out.translate(Math.round(p.x),Math.round(p.y));out.rotate(fall+(chopping?Math.sin(age/18)*.05:0));out.globalAlpha=chopping?Math.max(.04,1-age/560):1;out.imageSmoothingEnabled=false;out.scale(v%2?-1:1,1);out.drawImage(treeCandidateImage,-52*scale,-156*scale,104*scale,156*scale);out.restore()}else drawPixelTree(p,Number(String(r.id).split(':')[1])||0,chopping,age);return}
    if(cozyPixelProof&&cozyPixelArt?.drawBerryBush&&r.type==='food'){cozyPixelArt.drawBerryBush(out,{point:p,variant:Number(String(r.id).split(':')[1])||0});return}
    const frame={wood:0,stone:1,food:2,shard:3}[r.type]??0,size=liveGroundArt?36:28;if(img.resources?.complete&&img.resources.naturalWidth)out.drawImage(img.resources,frame*32,0,32,32,Math.round(p.x-size/2),Math.round(p.y-size),size,size);else{out.fillStyle='#e0d4a1';out.fillRect(p.x-4,p.y-8,8,8)}
  }
  function drawAxeSwing(screen,now,offsetX=8,offsetY=23){if(localAction!=='harvest'||now-localActionAt<0||now-localActionAt>380)return;const t=(now-localActionAt)/380;out.save();out.translate(Math.round(screen.x+offsetX),Math.round(screen.y-offsetY));out.rotate(-1.15+1.8*t);out.globalAlpha=Math.min(1,(1-t)*1.5);out.fillStyle='#614936';out.fillRect(-2,-2,4,25);out.fillStyle='#a9c2bb';out.fillRect(-8,-8,13,10);out.fillStyle='#405d59';out.fillRect(-10,-5,5,13);out.restore()}
  function drawPickSwing(screen,now,offsetX=9,offsetY=22){if(localAction!=='mine'||now-localActionAt<0||now-localActionAt>380)return;const t=(now-localActionAt)/380;out.save();out.translate(Math.round(screen.x+offsetX),Math.round(screen.y-offsetY));out.rotate(-1.2+1.9*t);out.globalAlpha=Math.min(1,(1-t)*1.5);out.fillStyle='#654d38';out.fillRect(-2,-1,4,24);out.fillStyle='#c7d3cd';out.fillRect(-10,-7,20,4);out.fillRect(-10,-7,4,8);out.fillRect(6,-7,4,8);out.fillStyle='#526c68';out.fillRect(-8,-5,16,2);out.restore()}
  function drawCampfireLight(now){
    if(currentZone!=='1:1')return;
    const p=project(CAMP.x,CAMP.y),pulse=.88+Math.sin(now/190)*.055+Math.sin(now/83)*.035;
    const darkness=Math.max(0,Math.min(1,nightLevel()));
    const strength=(.12+darkness*.34)*pulse;
    out.save();out.globalCompositeOperation='screen';out.globalAlpha=strength;
    // A soft, low oval follows the ground plane; the stepped rim keeps its footprint pixel-shaped.
    out.translate(p.x,p.y-3);out.scale(1,.55);
    const glow=out.createRadialGradient(0,0,3,0,0,156);
    glow.addColorStop(0,'#ffd779');glow.addColorStop(.22,'#f7a94d');glow.addColorStop(.62,'#d56d35');glow.addColorStop(1,'#a4422500');
    out.fillStyle=glow;out.beginPath();out.arc(0,0,156,0,Math.PI*2);out.fill();out.restore();
    // Small drifting ember clusters give the existing campfire a readable, animated focal point.
    out.save();out.globalCompositeOperation='screen';
    for(let i=0;i<5;i++){
      const phase=now/390+i*1.73,life=((now/720+i*.193)%1);
      const x=p.x+Math.round(Math.sin(phase)* (7+i*3)),y=p.y-17-life*(13+i%3*4);
      const size=i%2?2:3;out.globalAlpha=(.42+darkness*.28)*(1-life*.6);
      out.fillStyle=i%3===0?'#ffe6a1':'#ffad53';out.fillRect(Math.round(x),Math.round(y),size,size);
    }
    out.restore();
  }
  function drawMireMartB2Entrance(){
    if(currentZone!=='1:0')return;
    const p=project(METRO_CLUE_WORLD.x,METRO_CLUE_WORLD.y),x=Math.round(p.x),y=Math.round(p.y);
    const polygon=(points,color)=>{out.fillStyle=color;out.beginPath();out.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)out.lineTo(points[i][0],points[i][1]);out.closePath();out.fill()};
    out.save();out.imageSmoothingEnabled=false;
    out.fillStyle='#27342d66';out.beginPath();out.ellipse(x,y+4,24,8,0,0,Math.PI*2);out.fill();
    // Tuck the service hatch into the narrow gap between the shop and clinic.
    // A recycling bin and rain pipe break its outline without advertising a door.
    out.fillStyle='#36463e';out.fillRect(x-35,y-17,14,14);out.fillStyle='#52675a';out.fillRect(x-37,y-19,17,3);out.fillStyle='#2b3932';out.fillRect(x-33,y-14,2,8);out.fillRect(x-25,y-14,2,8);out.fillStyle='#89927a';out.fillRect(x-32,y-16,8,1);
    out.fillStyle='#52665c';out.fillRect(x+22,y-28,2,30);out.fillRect(x+20,y-28,6,2);out.fillStyle='#a28d68';out.fillRect(x+21,y-4,3,2);
    // The flush iron cover reads like ordinary service-lane drainage at a glance.
    polygon([[x-14,y-5],[x,y-10],[x+14,y-5],[x,y]],'#727a6d');
    polygon([[x-11,y-5],[x,y-8],[x+11,y-5],[x,y-1]],'#45544c');
    out.fillStyle='#18241f';out.fillRect(x-7,y-5,14,3);out.fillStyle='#657266';
    for(let slot=0;slot<4;slot++)out.fillRect(x-5+slot*3,y-4,1,2);
    out.fillStyle='#a3b899';out.fillRect(x+8,y-5,1,1);
    // A half-hidden maintenance plate gives attentive players a fair clue.
    out.fillStyle='#526056';out.fillRect(x-8,y-22,17,3);out.fillStyle='#838573';out.fillRect(x-7,y-22,13,1);
    // A worn B2 stencil rewards a closer look without turning the hatch into a quest marker.
    out.fillStyle='#d0b77f';out.font='bold 5px ui-monospace,monospace';out.textAlign='center';out.textBaseline='middle';out.fillText('B2',x+2,y-20);
    out.fillStyle='#59685a';out.fillRect(x-12,y-18,2,5);out.fillStyle='#a66e53';out.fillRect(x-12,y-18,2,1);
    // A weak amber service light catches the wet rim in the daylight palette.
    out.globalAlpha=.62+.22*Math.sin(performance.now()/680);out.fillStyle='#d0a45f';out.fillRect(x+11,y-7,2,1);out.fillRect(x+9,y-5,2,1);out.globalAlpha=1;
    const label=document.querySelector('#zone');if(label)label.textContent='MIRE MART';
    out.restore();
  }
  function drawShoreAnomaly(now){
    if(currentZone!=='1:0'||metroB2Room?.isInside())return;
    // A very small wet reflection can be noticed from the street, while the
    // actual interaction prompt stays close enough to reward looking around.
    const anomaly=METRO_CLUE_WORLD,distance=Math.hypot(me.x-anomaly.x,me.y-anomaly.y),near=distance<72,intensity=Math.max(0,Math.min(1,(380-distance)/280)),discovered=!!(window.ABYSSAL_METRO_SERVICE_LOG_DISCOVERED_V1||window.ABYSSAL_SHORE_SIGNAL_DISCOVERED_V1),cycle=(now%3600)/3600,p=project(anomaly.x,anomaly.y);
    if(intensity<=0)return;
    const beat=Math.max(0,1-Math.abs(cycle-.22)/.17);
    const shimmer=Math.max(0,1-Math.abs(cycle-.30)/.11)*.5;
    const idle=.12+.10*(.5+.5*Math.sin(now/830));
    out.save();out.globalCompositeOperation='screen';
    // A passing cool glint in a puddle is the only distant clue; it should not
    // read as a glowing quest marker or outline the hidden entrance.
    const eyeReveal=Math.max(0,Math.min(1,(beat*1.8+shimmer*.9)*intensity));
    if(eyeReveal>.06){
      const eyeY=p.y+7,eyeW=11+Math.round(eyeReveal*3),gaze=Math.round(Math.sin(now/1300)*2);
      out.globalAlpha=(.11*intensity+eyeReveal*.24)*(discovered?.72:1);
      out.fillStyle='#102e32';out.beginPath();out.ellipse(p.x,eyeY,eyeW,Math.max(2,Math.round(eyeW*.34)),0,0,Math.PI*2);out.fill();
      out.globalAlpha=(.2*intensity+eyeReveal*.38)*(discovered?.78:1);out.strokeStyle='#75ddd1';out.lineWidth=1;
      out.beginPath();out.ellipse(p.x,eyeY,eyeW+2,Math.max(3,Math.round(eyeW*.42)),0,0,Math.PI*2);out.stroke();
      out.globalAlpha=(.2*intensity+eyeReveal*.42)*(discovered?.78:1);out.fillStyle='#b8fff0';
      out.fillRect(Math.round(p.x+gaze)-1,eyeY-3,2,6);out.fillRect(Math.round(p.x+gaze)-3,eyeY-1,6,2);
      out.globalAlpha=(.08*intensity+eyeReveal*.18)*(discovered?.72:1);out.strokeStyle='#84d9cf';
      for(let tendril=0;tendril<3;tendril++){
        const side=tendril-1,reach=13+tendril*4;
        out.beginPath();out.moveTo(p.x+side*4,eyeY+2);
        out.quadraticCurveTo(p.x+side*reach,eyeY+5,p.x+side*(reach+4),eyeY+2+Math.sin(now/430+tendril)*3);out.stroke();
      }
    }
    // Damp reflected pixels are deliberately tiny; there is no pulsing floor ring.
    out.globalAlpha=(idle+beat*.11+shimmer*.12)*intensity;
    out.fillStyle='#65a79b';out.fillRect(Math.round(p.x-2),Math.round(p.y-5),4,2);out.fillRect(Math.round(p.x-1),Math.round(p.y-3),2,2);
    out.globalAlpha=(.12+beat*.16)*intensity;out.fillStyle='#b2cbb0';out.fillRect(Math.round(p.x+3),Math.round(p.y-2),4,1);
    if(near){const prompt='E 检查松动的铁盖';out.globalAlpha=.92;out.font='bold 9px ui-monospace,monospace';out.textAlign='center';const width=Math.ceil(out.measureText(prompt).width)+14;out.fillStyle='#101a16ed';out.fillRect(Math.round(p.x-width/2),Math.round(p.y+13),width,16);out.strokeStyle='#778976';out.strokeRect(Math.round(p.x-width/2)+.5,Math.round(p.y+13)+.5,width-1,15);out.fillStyle='#e1e8d2';out.fillText(prompt,Math.round(p.x),Math.round(p.y+24))}
    out.restore();
  }
  function interactMetroB2(){
    if(metroB2Room?.isInside()){
      const result=metroB2Room.interact();
      if(result==='exit'){setMetroB2Hud(false);toast('你回到了 MIRE MART 后巷。B2 应急灯仍亮着。');return true}
      if(result==='clue'){window.ABYSSAL_METRO_SERVICE_LOG_DISCOVERED_V1=true;window.ABYSSAL_SHORE_SIGNAL_DISCOVERED_V1=true;const questLabel=document.querySelector('#questText');if(questLabel)questLabel.textContent='检修记录：停电后，地下指示灯亮了三次。';toast('检修记录：停电后，地下指示灯亮了三次。最后一次，灯从楼梯下面照上来。');try{window.dispatchEvent(new CustomEvent('abyssal:world-clue',{detail:{id:'metro-b2-maintenance-log',zone:'1:0',source:'mire-mart-service-entrance'}}))}catch{}return true}
      if(result==='away'){toast('配电柜在房间右侧，靠近后按 E 检查。');return true}
      return true;
    }
    if(currentZone!=='1:0'||Math.hypot(me.x-METRO_CLUE_WORLD.x,me.y-METRO_CLUE_WORLD.y)>=128)return false;
    metroB2Room?.enter();setMetroB2Hud(true);
    toast('你推开了半掩的检修门，走进 B2。');
    return true;
  }
  function drawMetroB2Interior(now){
    const room=metroB2Room?.snapshot?.();if(!room?.inside)return false;setMetroB2Hud(true,room.clueFound);
    const face=adapter.project(Math.cos(Number(me.dir)||0),Math.sin(Number(me.dir)||0)),row=Math.abs(face.y)>Math.abs(face.x)?(face.y>0?0:3):(face.x<0?1:2),frame=room.moving?Math.floor(now/170)%4:0;
    metroB2Room.draw(out,view.clientWidth,view.clientHeight,{now,player:{row,frame},drawPlayer:(x,y)=>{if(cozyPixelProof&&cozyPixelArt?.drawPlayer)cozyPixelArt.drawPlayer(out,{x,y,row,frame});else if(img.player?.complete&&img.player.naturalWidth)out.drawImage(img.player,frame*24,row*32,24,32,Math.round(x-12),Math.round(y-34),24,32);else{out.fillStyle='#d5c39b';out.fillRect(x-5,y-19,10,16);out.fillStyle='#29342d';out.fillRect(x-5,y-7,10,5)}}});
    return true;
  }
  function setMetroB2Hud(inside,clueFound=false){
    const zoneLabel=document.querySelector('#zone'),campBadge=document.querySelector('#campBadge'),questLabel=document.querySelector('#questText');
    if(inside){if(zoneLabel)zoneLabel.textContent='B2';campBadge?.classList.add('hidden');if(questLabel)questLabel.textContent=clueFound?'检修记录：停电后，地下指示灯亮了三次。':'检修层有一面配电柜还在通电。靠近后按 E 检查。';return}
    try{updateUI()}catch{if(zoneLabel)zoneLabel.textContent=currentZone==='1:0'?'MIRE MART':'CAMP';if(campBadge)campBadge.classList.toggle('hidden',!inCamp())}
  }
  function discoverShoreSignal(){
    if(metroB2Room?.isInside())return interactMetroB2();
    if(currentZone!=='1:0'||Math.hypot(me.x-METRO_CLUE_WORLD.x,me.y-METRO_CLUE_WORLD.y)>=128)return false;
    return interactMetroB2();
  }
  function drawStarterWaypoints(now){
    const bossProgress=window.ABYSSAL_BOSS_PROGRESSION_V1;
    window.ABYSSAL_ROUTE_GUIDANCE_V1?.draw?.(out,{
      zone:currentZone,player:{x:me.x,y:me.y},inventory:{...inventory},
      availableResources:resources.filter(resource=>(harvested.get(resource.id)||0)<=Date.now()).map(resource=>({...resource})),
      interactionTarget:window.ABYSSAL_INTERACTION_V12?.getTarget?.()||null,
      phase:window.ABYSSAL_EXPEDITION_LOOP_V1?.state?.phase,
      boss:bossProgress?.encounter?.spawn||null,bossCleared:bossProgress?.isCleared?.()===true,
      camp:{x:CAMP.x,y:CAMP.y},worldZone:WORLD.zone,parking:worldApi?.poi?.parking||null,
      inCamp:inCamp(),workbench:{x:2195,y:2535},projectViewport:(x,y)=>projectViewport(x,y),
      width:view.clientWidth,height:view.clientHeight,dpr,now,worldNow:Date.now()
    });
  }
   function render(){
     resize();
     const W=view.clientWidth,H=view.clientHeight;
     if(!W||!H)return;
     const viewportKey=`${W}x${H}`;
     if(viewportKey!==lastReportedViewport){lastReportedViewport=viewportKey;reportAssetStatus()}
     // V21 already resolves the camera to the player's simulation position.
     // Snap the projected camera offset once in screen space so every terrain
     // mark, prop, and actor receives the same pixel translation while walking.
     camera.x=me.x;camera.y=me.y;renderCameraX=camera.x;renderCameraY=camera.y;
     const cameraPixel=adapter.project(renderCameraX,renderCameraY);renderCameraScreenX=Math.round(cameraPixel.x);renderCameraScreenY=Math.round(cameraPixel.y);
     out.setTransform(dpr,0,0,dpr,0,0);
     out.clearRect(0,0,W,H);
     out.fillStyle=BIOMES[currentZone]?.[1]||'#556c52';out.fillRect(0,0,W,H);
     out.setTransform(dpr*displayScale,0,0,dpr*displayScale,dpr*(1-displayScale)*W/2,dpr*(1-displayScale)*H/2);
      const grayboxScene=window.ABYSSAL_BUILDING_INTERIOR_PREVIEW_V1;
      if(grayboxBuildingQa&&grayboxScene?.isInside?.()){
        grayboxScene.drawInterior({ctx:out,width:W,height:H,project,now:lastTime,drawPlayer:cozyPixelArt?.drawPlayer,row:actorRow(Number(me.dir)||0)});
        out.setTransform(dpr,0,0,dpr,0,0);return;
      }
     if(drawMetroB2Interior(lastTime)){out.setTransform(dpr,0,0,dpr,0,0);return}
      const grayboxExterior=grayboxBuildingStart&&currentZone==='1:0';
      if(grayboxExterior)grayboxScene?.drawGrayboxExterior?.({ctx:out,width:W,height:H,project,store:worldApi?.poi,entrance:worldApi?.poi?.entrance,player:me});
      else{terrainDraw();if(grayboxContinuity){if(currentZone==='1:0')grayboxScene?.drawGrayboxExterior?.({ctx:out,width:W,height:H,project,store:worldApi?.poi,entrance:worldApi?.poi?.entrance,player:me,preserveBackground:true})}else{drawCityEdgeContext(W,H);drawMireMartNeighborhood();drawMireMartB2Entrance();if(currentZone==='1:1'&&!cozyPixelProof)drawCityRimOverExterior(W,H)}}
     const list=[];
      if(currentZone==='1:1')for(const o of placements)list.push({id:`prop:${o.id}`,kind:'prop',x:o.x,y:o.y,index:o.index,scale:o.scale});
     if(currentZone==='1:1'&&fieldRigTier()>=2){const workbench=placements.find(o=>o.index===2);if(workbench)list.push({id:'home:field-rig-upgrade',kind:'fieldRig',x:workbench.x+25,y:workbench.y-2,anchor:workbench});}
     if(currentZone==='1:1'){
        const guide=window.ABYSSAL_CAMP_GUIDE_V1?.getSnapshot?.();
        if(guide)list.push({id:`npc:${guide.id}`,kind:'actor',x:guide.x,y:guide.y,ref:guide,isPlayer:false});
        for(const plot of window.ABYSSAL_FARMING_V1?.getSnapshot?.()||[])list.push({id:`farm:${plot.id}`,kind:'farmPlot',x:plot.x,y:plot.y,ref:plot});
        for(const animal of window.ABYSSAL_LIVESTOCK_V1?.getSnapshot?.()||[])list.push({id:`animal:${animal.id}`,kind:'livestock',x:animal.x,y:animal.y,ref:animal});
        const companion=window.ABYSSAL_PETS_V1?.getRenderState?.(me);if(companion)list.push({id:`companion:${companion.id}`,kind:'companion',x:companion.x,y:companion.y,ref:companion});
      }
      if(currentZone==='1:0'&&worldApi&&!grayboxExterior&&!grayboxContinuity){for(const p of worldApi.layers.props)list.push({id:p.id,kind:'poiProp',x:p.x+p.w/2,y:p.y+p.h,ref:p});if(worldApi.sign)list.push({id:worldApi.sign.id,kind:'poiSign',x:worldApi.sign.x+worldApi.sign.w/2,y:worldApi.sign.y+worldApi.sign.h,ref:worldApi.sign});if(cozyPixelProof){const lot=worldApi.poi?.parking;if(lot){list.push({id:'town:bus-stop',kind:'townBusStop',x:lot.x+70,y:lot.y+180});list.push({id:'town:abandoned-hatchback',kind:'townCar',x:lot.x+510,y:lot.y+136,paint:'#687e78'});list.push({id:'town:streetlight',kind:'townStreetlight',x:lot.x+700,y:lot.y+210})}}}
      for(const structure of window.ABYSSAL_HOME_BUILDING_V1?.getSnapshot?.()||[])if(structure.zone===currentZone)list.push({id:'building:'+structure.id,kind:'structure',x:structure.x,y:structure.y+32,ref:structure});if(!grayboxExterior)for(const r of resources){const choppingTarget=(treeCandidateQa||pixelSurvivorLive||cozyPixelProof)&&r.type==='wood'&&String(r.id)===choppedResourceId&&localAction==='harvest'&&Date.now()-localActionAt<600;if(!harvested.has(r.id)||choppingTarget)list.push({id:`resource:${r.id}`,kind:'resource',x:r.x,y:r.y,ref:r})}
      if(!grayboxExterior)for(const m of mobs)if(m.hp>0)list.push({id:`mob:${m.id}`,kind:'mob',x:m.x,y:m.y,ref:m});
     for(const p of remotes.values()){list.push({id:`remote:${p.id}`,kind:'actor',x:p.x,y:p.y,ref:p,isPlayer:true});if(p.pet)list.push({id:`remote-pet:${p.id}:${p.pet.id}`,kind:'companion',x:p.pet.x,y:p.pet.y,ref:p.pet});}
     list.push({id:`player:${SESSION_ID}`,kind:'actor',x:me.x,y:me.y,ref:me,self:true,isPlayer:true});
     if(currentZone==='1:1'){
        const bank=window.ABYSSAL_FISHING_RENDER_V1?.frontBankSortAnchor?.('camp-pool',13);
        if(bank)list.push({id:'water:camp-pool-front-bank',kind:'pondBank',x:bank.x,y:bank.y+2});
     }
     list.sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.id.localeCompare(b.id));
       if(currentZone==='1:1')window.ABYSSAL_FISHING_RENDER_V1?.drawPond?.(out,project,lastTime);
     if(currentZone==='1:1')window.ABYSSAL_LIVESTOCK_RENDER_V1?.drawPen?.(out,project);
     if(currentZone==='1:1')window.ABYSSAL_COMPANION_RENDER_V1?.drawIncubator?.(out,project,lastTime);
     const selectedAnimal=window.ABYSSAL_INTERACTION_V12?.getTarget?.(me);
     for(const o of list){if(o.kind==='pondBank')window.ABYSSAL_FISHING_RENDER_V1?.drawPondFrontBank?.(out,project);else if(o.kind==='prop')drawProp(o);else if(o.kind==='fieldRig')drawFieldRigUpgrade(o.anchor,lastTime);else if(o.kind==='farmPlot')window.ABYSSAL_FARM_RENDER_V1?.drawPlot?.(out,project,o.ref,window.ABYSSAL_FARMING_V1?.getTarget?.(me)?.plotId===o.ref.id);else if(o.kind==='structure')window.ABYSSAL_DEFENSE_STRUCTURE_RENDER_V1?.draw?.(out,project,o.ref,window.ABYSSAL_HOME_BUILDING_V1?.nearest?.(me)?.id===o.ref.id);else if(o.kind==='livestock')window.ABYSSAL_LIVESTOCK_RENDER_V1?.drawAnimal?.(out,project,o.ref,selectedAnimal?.type==='livestock'&&selectedAnimal.animalId===o.ref.id,lastTime);else if(o.kind==='companion')window.ABYSSAL_COMPANION_RENDER_V1?.drawCompanion?.(out,project,o.ref,lastTime);else if(o.kind==='poiProp')drawPoiProp(o.ref);else if(o.kind==='poiSign'){if(!drawPoiSign(o.ref)){const sign=project(o.ref.x+o.ref.w/2,o.ref.y+o.ref.h+54);out.fillStyle='#eee2bd';out.textAlign='center';out.font='bold 12px ui-monospace,monospace';out.fillText('MIRE MART · NO POWER',sign.x,sign.y)}}else if(o.kind==='townCar')drawTownCar(o);else if(o.kind==='townStreetlight')drawTownStreetlight(o,lastTime);else if(o.kind==='townBusStop')drawTownBusStop(o);else if(o.kind==='resource')drawResource(o.ref);else if(o.kind==='mob')drawMob(o.ref);else drawActor(o.ref,o.self,o.isPlayer)}
      drawResourceWorkFeedback(performance.now());
      if(!grayboxExterior&&!grayboxContinuity)drawMireMartRoof();
      if(!grayboxExterior){drawCombatImpacts(performance.now());window.ABYSSAL_GAMEPLAY_PARTICLES_V1?.draw(out,project,performance.now());}
     for(const m of mobs)if(m.hp>0&&m.phase<0){const p=project(m.x,m.y);window.ABYSSAL_HIT_FEEDBACK?.drawMobWindupCue?.(out,p.x,p.y+4,m.phase)}
     const night=Math.max(0,Math.min(.18,nightLevel()*.18));
     if(night){out.fillStyle=`rgba(4,12,17,${night})`;out.fillRect(0,0,W,H)}
      if(!grayboxExterior){drawExplorationLighting(lastTime);drawCampfireLight(lastTime);drawShoreAnomaly(lastTime);drawStarterWaypoints(lastTime);drawPlayerHurt(performance.now());}
     if(currentZone==='1:1'){out.strokeStyle='#b5d6bb55';out.setLineDash([2,8]);out.beginPath();const p=project(CAMP.x,CAMP.y);out.ellipse(p.x,p.y,CAMP.r*.48,CAMP.r*.24,0,0,Math.PI*2);out.stroke();out.setLineDash([])}
     out.setTransform(dpr,0,0,dpr,0,0);
    }
  const canonicalFrame=window.__AW_V21_CANONICAL_FRAME__;if(typeof canonicalFrame!=='function')throw new Error('Final V21 motion frame hook is unavailable');
  function simulationStep(elapsed=0){
    updateTicks++;
    const qaHarness=window.ABYSSAL_PREVIEW_QA_V1,qaInput=qaHarness?.currentInput?.(),baseX=Number(joystickState.x)||0,baseY=Number(joystickState.y)||0,sx=qaInput?qaInput.x:baseX,sy=qaInput?qaInput.y:baseY;
    if(metroB2Room?.isInside()){metroB2Room.step(sx,sy,elapsed);lastCollisionBlocked=false;return}
    const building=window.ABYSSAL_BUILDING_INTERIOR_PREVIEW_V1;
    if(grayboxBuildingQa)window.ABYSSAL_SUCCESSOR_BUILDING_ACCESS_V1?.updatePrompt?.();
    if(grayboxBuildingQa&&building?.isInside?.()){building.step({player:me,adapter,screenX:sx,screenY:sy,elapsed,context:buildingContext()});lastCollisionBlocked=!!building.snapshot?.().blocked;return}
    const screenLength=Math.min(1,Math.hypot(sx,sy)),startX=me.x,startY=me.y,campSpeed=inCamp(),dash=!!dashQueued,worldIntent=adapter.worldIntentForScreenInput(sx,sy);
    joystickState.x=worldIntent.x;joystickState.y=worldIntent.y;
    try{canonicalFrame();if(grayboxBuildingQa)window.ABYSSAL_SUCCESSOR_BUILDING_ACCESS_V1?.updatePrompt?.();if(grayboxBuildingQa&&window.ABYSSAL_SUCCESSOR_BUILDING_ACCESS_V1?.tryDoorCrossing({x:sx,y:sy})){lastCollisionBlocked=false;return}const motion=window.ABYSSAL_MOTION_V18,dt=Math.max(0,Number(motion?.lastDt)||0),screenDelta=adapter.screenDeltaFromResolvedWorldDelta(me.x-startX,me.y-startY),speed=dash?(campSpeed?270:390):(campSpeed?154:146),requestedScreen={x:sx*speed*dt/Math.sqrt(8),y:sy*speed*dt/Math.sqrt(8)},attemptedX=startX+worldIntent.x*speed*dt,attemptedY=startY+worldIntent.y*speed*dt,playerRadius=Math.min(18,Math.max(0,Number.isFinite(Number(me.r))?Number(me.r):14)),attemptedBlocked=worldApi?.isBlockedCircle?.(attemptedX,attemptedY,playerRadius)===true;if(screenLength>0&&dt>0)lastCollisionBlocked=lastCollisionBlocked||attemptedBlocked||Math.hypot(screenDelta.x-requestedScreen.x,screenDelta.y-requestedScreen.y)>1;qaHarness?.advance?.(dt,{active:started&&zoneConnected&&!dead,inCamp:inCamp()})}finally{joystickState.x=baseX;joystickState.y=baseY}
  }
  function keyVector(){let x=0,y=0;if(keys.has('a')||keys.has('ArrowLeft'))x--;if(keys.has('d')||keys.has('ArrowRight'))x++;if(keys.has('w')||keys.has('ArrowUp'))y--;if(keys.has('s')||keys.has('ArrowDown'))y++;const l=Math.hypot(x,y);joystickState.x=l>1?x/l:x;joystickState.y=l>1?y/l:y}
  addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k))e.preventDefault();if(k==='e'&&!e.repeat&&grayboxBuildingQa&&window.ABYSSAL_SUCCESSOR_BUILDING_ACCESS_V1?.interact()){e.preventDefault();return}if(k==='e'&&!e.repeat&&discoverShoreSignal()){e.preventDefault();return}keys.add(k);keyVector()});addEventListener('keyup',e=>{keys.delete(e.key.length===1?e.key.toLowerCase():e.key);keyVector()});addEventListener('blur',()=>{keys.clear();joystickState.x=0;joystickState.y=0;knob.style.transform='translate(0,0)'});
  let pointerId=null;function padMove(e){const r=pad.getBoundingClientRect(),max=r.width*.34,dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,l=Math.hypot(dx,dy)||1,k=Math.min(max,l);joystickState.x=dx/l*k/max;joystickState.y=dy/l*k/max;knob.style.transform=`translate(${dx/l*k}px,${dy/l*k}px)`}function padRelease(e){if(pointerId!==null&&e?.pointerId!==pointerId)return;pointerId=null;joystickState.x=0;joystickState.y=0;knob.style.transform='translate(0,0)'}pad.addEventListener('pointerdown',e=>{pointerId=e.pointerId;pad.setPointerCapture(e.pointerId);padMove(e)});pad.addEventListener('pointermove',e=>{if(e.pointerId===pointerId)padMove(e)});for(const eventName of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(eventName,padRelease);
  const localPreview=window.AW_SUCCESSOR_PREVIEW===true;const localPreviewEvents=[];snapCamp();if(localPreview){zoneCh={send:async packet=>{if(packet?.event==='harvest'){localAction='harvest';localActionAt=Date.now();choppedResourceId=String(packet?.payload?.rid||'')}else if(packet?.event==='attack')localAction='attack';localPreviewEvents.push({at:Date.now(),packet});if(localPreviewEvents.length>128)localPreviewEvents.shift();return'ok'},track:async()=> 'ok',leave(){return true}};if(treeCandidateQa||pixelSurvivorLive){const interaction=window.ABYSSAL_INTERACTION_V12,nativeInteract=interaction?.triggerContextInteraction;if(interaction&&typeof nativeInteract==='function')interaction.triggerContextInteraction=function(...args){const target=interaction.getTarget?.()?.resource,before=Number(inventory.wood)||0,result=nativeInteract.apply(this,args);if(target?.type==='wood'&&(Number(inventory.wood)||0)>before){localAction='harvest';localActionAt=Date.now();choppedResourceId=String(target.id)}return result}}switchZone=async function(zone){currentZone=String(zone);zoneConnected=true;zoneLeader=true;me.zone=currentZone;seedZone(currentZone);spawnMobs(currentZone);lastCollisionBlocked=false;updateUI();return{localPreview:true,key:zone}};
    // Place the guarded MIRE preview on the asphalt street, beyond the parking lot.
     const startAtMart=window.AW_SUCCESSOR_PREVIEW_START_AT_MIRE_MART===true,startAtMetroB2=window.AW_SUCCESSOR_PREVIEW_START_AT_METRO_B2===true,startAtGraybox=grayboxBuildingStart,entrance=worldApi?.poi?.entrance;if(startAtMart||startAtMetroB2||startAtGraybox){dead=false;me.hp=100;me.sanity=100;me.hunger=Math.max(75,Number(me.hunger)||75);invulnerableUntil=Number.MAX_SAFE_INTEGER;fieldGraceUntil=0;deathEl.classList.add('hidden')}started=true;zoneConnected=true;currentZone=startAtMart||startAtMetroB2||startAtGraybox?'1:0':'1:1';me.name='Local Preview';me.x=startAtGraybox&&entrance?entrance.x+entrance.w/2:startAtMart?2400:startAtMetroB2?METRO_CLUE_WORLD.x:CAMP.x;me.y=startAtGraybox&&entrance?entrance.y+entrance.h+28:startAtMart?1392:startAtMetroB2?METRO_CLUE_WORLD.y+10:CAMP.y+70;me.zone=currentZone;camera.x=me.x;camera.y=me.y;renderCameraX=me.x;renderCameraY=me.y;sessionStartedAt=Date.now();wasInCamp=!startAtMart&&!startAtMetroB2&&!startAtGraybox;zoneLeader=true;seedZone(currentZone);if(startAtGraybox)mobs=[];else spawnMobs(currentZone);gate.classList.add('hidden');game.classList.remove('hidden');if(connectionEl){connectionEl.textContent='LOCAL';connectionEl.className='connection good'}if(onlineEl)onlineEl.textContent='LOCAL 1';if(window.ABYSSAL_RELAY_V16){window.ABYSSAL_RELAY_V16.enabled=false;window.ABYSSAL_RELAY_V16.active=false}document.querySelector('#routeBadgeV16')?.replaceChildren(document.createTextNode('LOCAL PREVIEW · RELAY BLOCKED'));updateUI();}
  else {draw=()=>{}}
  if(window.AW_DEV_QA===true&&localPreview){window.ABYSSAL_SUCCESSOR_QA_BRIDGE_V1=Object.freeze({teleport(label,zone,x,y){window.ABYSSAL_PREVIEW_QA_V1?.stop?.('teleport');me.x=x;me.y=y;camera.x=x;camera.y=y;const result=switchZone(zone);wasInCamp=zone==='1:1';if(label.startsWith('FIGHT')){me.dir=0;fieldGraceUntil=Date.now()+25000;}lastCollisionBlocked=false;return result},setStep(label,x,y,duration=.05){return window.ABYSSAL_PREVIEW_QA_V1?.setStep?.(label,x,y,duration)},stop(reason){return window.ABYSSAL_PREVIEW_QA_V1?.stop?.(reason)},snapshot(){const live=mobs.filter(m=>m.hp>0),target=window.ABYSSAL_INTERACTION_V12?.getTarget?.(),nearest=live.slice().sort((a,b)=>Math.hypot(a.x-me.x,a.y-me.y)-Math.hypot(b.x-me.x,b.y-me.y))[0];return{zone:currentZone,x:Math.round(me.x),y:Math.round(me.y),ticks:updateTicks,collision:lastCollisionBlocked?'BLOCKED':'CLEAR',target:target?.resource?.id||target?.type||'none',event:localAction,liveMobs:live.length,windups:live.filter(m=>m.phase<0).length,nearest:nearest?Math.round(Math.hypot(nearest.x-me.x,nearest.y-me.y)):'none',foe:nearest?`${nearest.kind} ${Math.ceil(nearest.hp)}hp`:'none',dead:!!dead,active:!!started&&!!zoneConnected&&!dead}}});parent.postMessage({type:'successor-qa-bridge'},'*')}
  function assetStatus(image){const ready=!!image?.complete&&Number(image.naturalWidth)>0;return{loaded:ready,width:ready?image.naturalWidth:0,height:ready?image.naturalHeight:0,reason:ready?'':image?.complete?`load-failed ${image.currentSrc||image.src}`:'loading'}}
  let terrainHttpStatus='pending',terrainProbeStarted=false,lastReportedViewport=`${view.clientWidth}x${view.clientHeight}`;
  function reportAssetStatus(){const reportTiles=proofTerrainActive&&currentZone==='1:1'&&proofTilesReady?proofTiles:legacyTiles,reportReady=reportTiles===proofTiles?proofTilesReady:legacyTilesReady,assets={terrain:{loaded:reportReady,width:reportReady?reportTiles.naturalWidth:0,height:reportReady?reportTiles.naturalHeight:0,reason:reportReady?'':reportTiles.complete?`load-failed ${reportTiles.currentSrc||reportTiles.src}`:'loading',httpStatus:terrainHttpStatus}};Object.assign(assets,{player:assetStatus(img.player),props:assetStatus(img.props),resources:assetStatus(img.resources),monsters:assetStatus(img.monsters)});if(resourceArtQa){const loaded=resourceCandidateImage.complete&&resourceCandidateImage.naturalWidth===1536&&resourceCandidateImage.naturalHeight===1024;assets.resourceCandidate={loaded,width:resourceCandidateImage.naturalWidth||0,height:resourceCandidateImage.naturalHeight||0,reason:loaded?'':'loading-or-failed'}}if(playerCandidateQa||generatedWalkAtlasQa||liveSurvivorAtlas||pixelSurvivorLive){const w=pixelSurvivorLive?1254:generatedWalkAtlasQa?1536:768,h=pixelSurvivorLive?1254:generatedWalkAtlasQa?1024:1280,loaded=playerCandidateImage.complete&&playerCandidateImage.naturalWidth===w&&playerCandidateImage.naturalHeight===h;assets.playerCandidate={loaded,width:playerCandidateImage.naturalWidth||0,height:playerCandidateImage.naturalHeight||0,reason:loaded?'':'loading-or-failed'}}if(characterPortraitQa)assets.characterPortrait={loaded:characterPortraitImage.complete&&characterPortraitImage.naturalWidth===150&&characterPortraitImage.naturalHeight===298,width:characterPortraitImage.naturalWidth||0,height:characterPortraitImage.naturalHeight||0,reason:characterPortraitImage.complete&&characterPortraitImage.naturalWidth===150&&characterPortraitImage.naturalHeight===298?'':'loading-or-failed'};if(playableGroundDraft||continuousGroundQa||generatedGroundQa||liveGroundArt){const dims=playableGroundDraft?[1774,887]:liveGroundArt?[128,128]:[1408,704];assets.groundStudy={loaded:continuousGroundImage.complete&&continuousGroundImage.naturalWidth===dims[0]&&continuousGroundImage.naturalHeight===dims[1],width:continuousGroundImage.naturalWidth||0,height:continuousGroundImage.naturalHeight||0,reason:continuousGroundImage.complete?'unexpected-dimensions':'loading-or-failed'};if(blackmarshGroundQa)assets.blackmarshGround={loaded:blackmarshGroundImage.complete&&blackmarshGroundImage.naturalWidth===1472&&blackmarshGroundImage.naturalHeight===736,width:blackmarshGroundImage.naturalWidth||0,height:blackmarshGroundImage.naturalHeight||0,reason:blackmarshGroundImage.complete&&blackmarshGroundImage.naturalWidth===1472&&blackmarshGroundImage.naturalHeight===736?'':'loading-or-failed'}}if(treeCandidateQa)assets.treeCandidate={loaded:treeCandidateImage.complete&&treeCandidateImage.naturalWidth===1024,width:treeCandidateImage.naturalWidth||0,height:treeCandidateImage.naturalHeight||0,reason:treeCandidateImage.complete&&treeCandidateImage.naturalWidth===1024&&treeCandidateImage.naturalHeight===1536?'':'loading-or-failed'};parent.postMessage({type:'successor-assets',viewport:`${view.clientWidth}x${view.clientHeight}`,assets},'*');if(!terrainProbeStarted){terrainProbeStarted=true;fetch(reportTiles.currentSrc||reportTiles.src,{method:'HEAD',cache:'no-store'}).then(response=>{terrainHttpStatus=String(response.status);reportAssetStatus()}).catch(()=>{terrainHttpStatus='fetch-error';reportAssetStatus()})}}
   function frame(now){const elapsed=lastTime?Math.min(.05,Math.max(0,(now-lastTime)/1000)):0;lastTime=now;simulationStep(elapsed);const movedX=me.x-previousPlayerX,movedY=me.y-previousPlayerY,moved=Math.hypot(movedX,movedY)>.015;previousPlayerX=me.x;previousPlayerY=me.y;if(moved){visualMoving=true;visualMoveUntil=now+115;visualWalkClock+=elapsed}else if(now>visualMoveUntil)visualMoving=false;if(pendingHitStop>0){render();hitStopUntil=now+pendingHitStop;pendingHitStop=0}else if(now>=hitStopUntil)render();window.ABYSSAL_PLAYABLE_FEEL_V1?.applyCanvasKick?.(now);if(updateTicks%60===0)reportAssetStatus()}
  draw=()=>{};requestAnimationFrame(function loop(now){frame(now);requestAnimationFrame(loop)});
  const infoApp=document.querySelector('.app'),questPanel=document.querySelector('.quest'),survivorPanel=document.querySelector('.players');
  const infoStyle=document.createElement('style');infoStyle.textContent=`#successorInfoToggle{display:none}@media(max-width:480px){.app.successor-wide .quest,.app.successor-wide .players{display:none!important}.app.successor-wide.successor-info-open .quest,.app.successor-wide.successor-info-open .players{display:block!important;top:180px!important;width:calc(35% - 8px)!important;max-height:96px!important;overflow:auto!important;padding:5px!important}.app.successor-wide.successor-info-open .quest{left:8px!important}.app.successor-wide.successor-info-open .players{right:8px!important}.app.successor-wide .successor-info-toggle{display:block;position:absolute;left:50%;top:148px;transform:translateX(-50%);width:74px;height:28px;z-index:26;border:1px solid #9ab3a2;border-radius:5px;background:#10211de8;color:#edf3e6;font:700 7px ui-monospace,monospace}}`;document.head.appendChild(infoStyle);
  if(questPanel)questPanel.id='successorQuestInfo';if(survivorPanel)survivorPanel.id='successorSurvivorInfo';
  const infoToggle=document.createElement('button');infoToggle.id='successorInfoToggle';infoToggle.type='button';infoToggle.className='successor-info-toggle';infoToggle.textContent='任务 / 队友';infoToggle.setAttribute('aria-label','显示或隐藏当前任务与附近幸存者');infoToggle.setAttribute('aria-expanded','false');infoToggle.setAttribute('aria-controls','successorQuestInfo successorSurvivorInfo');
  infoToggle.addEventListener('click',()=>{const expanded=infoApp.classList.toggle('successor-info-open');infoToggle.setAttribute('aria-expanded',String(expanded));infoToggle.textContent=expanded?'收起信息':'任务 / 队友'});game.appendChild(infoToggle);
  if(characterPortraitQa){const portraitStyle=document.createElement('style');portraitStyle.textContent='.app.successor-wide .portrait{background-image:url("assets/art-candidates/modern-survivor-spritesheet-review-2026-10-06/modern-survivor-front-portrait-150x298.png")!important;background-repeat:no-repeat!important;background-position:center 12%!important;background-size:46px auto!important;image-rendering:auto!important;border-color:#d2b875!important}.app.successor-wide .successor-character-portrait{position:absolute;z-index:25;right:18px;top:18px;width:clamp(190px,23vw,290px);padding:12px 14px 13px;border:1px solid #d2b87588;border-radius:7px;background:linear-gradient(145deg,#14211eeF,#091310f2 72%);box-shadow:0 12px 34px #0008;color:#efe8d2;pointer-events:none}.successor-character-portrait header{display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;color:#e0c579;font:700 10px ui-monospace,monospace;letter-spacing:.16em}.successor-character-portrait header span{font:600 8px ui-monospace,monospace;color:#a6b4a3;letter-spacing:.06em}.successor-character-portrait figure{height:clamp(180px,32vh,320px);margin:0;display:grid;place-items:center;overflow:hidden;background:radial-gradient(ellipse at 50% 52%,#53705e55,transparent 66%)}.successor-character-portrait img{display:block;width:100%;height:100%;object-fit:contain;object-position:center;image-rendering:auto}.successor-character-portrait footer{padding-top:8px;border-top:1px solid #d2b87535;color:#c8cbb9;font:10px/1.45 ui-monospace,monospace}.successor-character-portrait footer strong{display:block;color:#f0e8cf;font-size:12px;letter-spacing:.06em}.successor-character-portrait[hidden]{display:none}@media(max-width:700px){.app.successor-wide .successor-character-portrait{right:8px;top:8px;width:116px;padding:6px;border-radius:5px}.successor-character-portrait header{font-size:7px;margin-bottom:0}.successor-character-portrait header span{font-size:6px}.successor-character-portrait figure{height:132px}.successor-character-portrait footer{padding-top:4px;font-size:7px;line-height:1.3}.successor-character-portrait footer strong{font-size:8px}}';document.head.appendChild(portraitStyle);const portrait=document.createElement('aside');portrait.className='successor-character-portrait';portrait.setAttribute('aria-label','高清幸存者角色档案');portrait.innerHTML='<header>FIELD DOSSIER <span>AW-01 / SAFE CAMP</span></header><figure><img alt="Survivor portrait" /></figure><footer><strong>THE LAST SIGNAL</strong>AW-01 · SAFE CAMP</footer>';portrait.querySelector('img').src=characterPortraitImage.src;if(window.AW_SUCCESSOR_CHARACTER_DOSSIER_QA!==false)game.appendChild(portrait);}
  parent.postMessage({type:'successor-ready',terrain:terrain?.terrainMap?.length||0,props:placements.length,resources:resources.length,mobs:mobs.length,viewport:`${view.clientWidth}x${view.clientHeight}`},'*');reportAssetStatus();
})();
