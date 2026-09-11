(()=>{
'use strict';

/* Awakening World Vertical Slice V1 — Stage 0 + very early Stage 1. */
const VERSION=1,TILE_SIZE=64;
const REGION={id:'north-road-stage0',x:1792,y:320,w:1280,h:1664,zones:['1:0','1:1']};
const STORE={id:'poi:abandoned-convenience-store',label:'Abandoned Convenience Store',x:2112,y:640,w:640,h:448,entrance:{x:2392,y:1072,w:80,h:16},parking:{x:2048,y:1088,w:768,h:288}};
const POI_CLEAR={x:STORE.parking.x-32,y:STORE.y-32,w:STORE.parking.w+64,h:(STORE.parking.y+STORE.parking.h-STORE.y)+64};
const WORLD_STAGE={id:'stage0-early1',stage:0,earlyStage1:true,corruptionIntensity:.08,rule:'local-authored-overlays-only'};
const STARTING_SHARDS=Math.max(0,Number(inventory?.shard)||0);
const terrainApi=window.ABYSSAL_TERRAIN_V21||null;
const TILE=terrainApi?.tile||{grass_a:0,grass_b:1,grass_flowers:2,sand_a:3,sand_b:4,road_a:5,road_b:6,water_a:7,water_b:8};
const SHEET_COLS=5,SHEET_PATH=terrainApi?.sheetPath||'assets/art-v21/terrain-v21.png';

const COLLISION=[
{id:'store-wall-n',x:STORE.x,y:STORE.y,w:STORE.w,h:16,kind:'wall'},{id:'store-wall-w',x:STORE.x,y:STORE.y,w:16,h:STORE.h,kind:'wall'},{id:'store-wall-e',x:STORE.x+STORE.w-16,y:STORE.y,w:16,h:STORE.h,kind:'wall'},
{id:'store-wall-s-left',x:STORE.x,y:STORE.y+STORE.h-16,w:280,h:16,kind:'wall'},{id:'store-wall-s-right',x:STORE.entrance.x+STORE.entrance.w,y:STORE.y+STORE.h-16,w:280,h:16,kind:'wall'},
{id:'store-counter',x:2160,y:704,w:160,h:48,kind:'counter'},{id:'store-shelf-a',x:2288,y:800,w:128,h:32,kind:'shelf'},{id:'store-shelf-b',x:2464,y:800,w:128,h:32,kind:'shelf'},{id:'store-shelf-c',x:2288,y:880,w:128,h:32,kind:'shelf'},
{id:'store-fridges',x:2584,y:688,w:112,h:48,kind:'fridge'},{id:'store-debris',x:2504,y:936,w:80,h:56,kind:'debris'},
{id:'road-barrier-left',x:2080,y:1392,w:96,h:24,kind:'barrier'},{id:'road-barrier-right',x:2688,y:1456,w:96,h:24,kind:'barrier'},{id:'fence-west-a',x:2024,y:1192,w:16,h:176,kind:'fence'},{id:'fence-east-a',x:2824,y:1208,w:16,h:160,kind:'fence'}];
const DECALS=[
{id:'puddle-1',kind:'puddle',x:2336,y:1744,w:72,h:26},{id:'puddle-2',kind:'puddle',x:2472,y:1572,w:52,h:20},{id:'puddle-3',kind:'puddle',x:2232,y:1324,w:68,h:24},
{id:'crack-1',kind:'crack',x:2412,y:1816,w:72,h:40},{id:'crack-2',kind:'crack',x:2356,y:1492,w:84,h:44},{id:'crack-3',kind:'crack',x:2488,y:1250,w:62,h:34},
{id:'tire-1',kind:'tire',x:2384,y:1650,w:10,h:96},{id:'tire-2',kind:'tire',x:2472,y:1650,w:10,h:96},{id:'store-glass',kind:'glass',x:2440,y:1128,w:76,h:38},{id:'residue-1',kind:'residue',x:2624,y:950,w:84,h:54}];
const PROPS=[
{id:'fence-west-a',kind:'fence',x:2024,y:1192,w:16,h:176},{id:'fence-east-a',kind:'fence',x:2824,y:1208,w:16,h:160},{id:'barrier-left',kind:'barrier',x:2080,y:1392,w:96,h:24},{id:'barrier-right',kind:'barrier',x:2688,y:1456,w:96,h:24},
{id:'store-wall-n',kind:'wall',x:STORE.x,y:STORE.y,w:STORE.w,h:16},{id:'store-wall-w',kind:'wall',x:STORE.x,y:STORE.y,w:16,h:STORE.h},{id:'store-wall-e',kind:'wall',x:STORE.x+STORE.w-16,y:STORE.y,w:16,h:STORE.h},
{id:'store-wall-s-left',kind:'wall',x:STORE.x,y:STORE.y+STORE.h-16,w:280,h:16},{id:'store-wall-s-right',kind:'wall',x:STORE.entrance.x+STORE.entrance.w,y:STORE.y+STORE.h-16,w:280,h:16},
{id:'store-counter',kind:'counter',x:2160,y:704,w:160,h:48},{id:'store-shelf-a',kind:'shelf',x:2288,y:800,w:128,h:32},{id:'store-shelf-b',kind:'shelf',x:2464,y:800,w:128,h:32},{id:'store-shelf-c',kind:'shelf',x:2288,y:880,w:128,h:32},{id:'store-fridges',kind:'fridge',x:2584,y:688,w:112,h:48},{id:'store-debris',kind:'debris',x:2504,y:936,w:80,h:56}];
const INTERACTIONS=[
{id:'poi:store:shelf-food-a',type:'food',x:2350,y:850,r:18,source:'shelf'},{id:'poi:store:shelf-food-b',type:'food',x:2518,y:850,r:18,source:'shelf'},{id:'poi:store:fridge-food',type:'food',x:2638,y:770,r:18,source:'fridge'},
{id:'poi:store:debris-wood',type:'wood',x:2538,y:1012,r:18,source:'debris'},{id:'poi:store:residue-shard-a',type:'shard',x:2630,y:1008,r:18,source:'residue'},{id:'poi:store:residue-shard-b',type:'shard',x:2690,y:1008,r:18,source:'residue'}];
const ENTITIES=[{id:'poi:store:crawler-a',kind:'crawler',x:2304,y:1248,hp:58,phase:.8,index:6},{id:'poi:store:crawler-b',kind:'crawler',x:2576,y:1288,hp:58,phase:2.6,index:7}];
const FX=[{id:'store-failing-light',kind:'flicker',x:2640,y:720,w:72,h:18},{id:'store-residue',kind:'anomaly',x:2664,y:976,w:96,h:72,intensity:.08}];
const LAYERS={terrain:{region:REGION,store:STORE,tileSize:TILE_SIZE},decals:DECALS,props:PROPS,collision:COLLISION,interactions:INTERACTIONS,entities:ENTITIES,fx:FX};

function hash2(x,y,seed=0){let n=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(seed|0,69069))|0;n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return(n>>>0)/4294967295;}
function clamp01(v){return Math.max(0,Math.min(1,Number(v)||0));}
function inRect(x,y,r){return x>=r.x&&y>=r.y&&x<r.x+r.w&&y<r.y+r.h;}
function rectIntersectsView(r,W,H){const left=camera.x-W/2,right=camera.x+W/2,top=camera.y-H/2,bottom=camera.y+H/2;return right>=r.x&&left<=r.x+r.w&&bottom>=r.y&&top<=r.y+r.h;}
function visibleTileBounds(W,H){const left=Math.max(REGION.x,camera.x-W/2),right=Math.min(REGION.x+REGION.w,camera.x+W/2),top=Math.max(REGION.y,camera.y-H/2),bottom=Math.min(REGION.y+REGION.h,camera.y+H/2);if(right<=left||bottom<=top)return{startX:0,startY:0,endX:0,endY:0,cols:0,rows:0};const startX=Math.max(REGION.x,Math.floor(left/TILE_SIZE)*TILE_SIZE),startY=Math.max(REGION.y,Math.floor(top/TILE_SIZE)*TILE_SIZE),endX=Math.min(REGION.x+REGION.w,Math.ceil(right/TILE_SIZE)*TILE_SIZE),endY=Math.min(REGION.y+REGION.h,Math.ceil(bottom/TILE_SIZE)*TILE_SIZE);return{startX,startY,endX,endY,cols:Math.max(0,Math.ceil((endX-startX)/TILE_SIZE)),rows:Math.max(0,Math.ceil((endY-startY)/TILE_SIZE))};}
function screenRect(r){return{x:Math.round(r.x-camera.x+canvas.width/2),y:Math.round(r.y-camera.y+canvas.height/2),w:r.w,h:r.h};}
function roadCenterAt(y){if(y>1720)return 2400;if(y>1480)return 2368;if(y>1240)return 2400;return 2432;}
function regionMaterial(wx,wy){if(inRect(wx+32,wy+32,STORE))return'store_floor';if(inRect(wx+32,wy+32,STORE.parking))return'asphalt';const center=roadCenterAt(wy+32),dx=Math.abs((wx+32)-center);if(dx<=96)return'asphalt';if(dx<=224)return'dirt_shoulder';return'cold_grass';}
function tileForMaterial(material,wx,wy){const h=hash2(Math.floor(wx/TILE_SIZE),Math.floor(wy/TILE_SIZE),913);if(material==='asphalt')return h>.55?TILE.road_b:TILE.road_a;if(material==='dirt_shoulder')return h>.58?TILE.sand_b:TILE.sand_a;if(material==='cold_grass')return h>.88?TILE.grass_flowers:(h>.48?TILE.grass_b:TILE.grass_a);return null;}

let sheet=null,sheetReady=false;
if(typeof Image!=='undefined'){sheet=new Image();sheet.onload=()=>{sheetReady=true;};sheet.onerror=()=>{sheetReady=false;};sheet.src=SHEET_PATH;}
function drawAtlasTile(tile,wx,wy){const x=sx(wx),y=sy(wy);if(sheetReady&&sheet&&Number.isFinite(tile)){const srcX=(tile%SHEET_COLS)*TILE_SIZE,srcY=Math.floor(tile/SHEET_COLS)*TILE_SIZE;ctx.drawImage(sheet,srcX,srcY,TILE_SIZE,TILE_SIZE,x,y,TILE_SIZE,TILE_SIZE);return;}ctx.fillStyle=tile===TILE.road_a||tile===TILE.road_b?'#444d50':(tile===TILE.sand_a||tile===TILE.sand_b?'#5d5b50':'#4d6259');ctx.fillRect(x,y,TILE_SIZE,TILE_SIZE);}
function drawStoreFloor(){const r=screenRect(STORE);ctx.fillStyle='#343c40';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#3c4549';for(let y=STORE.y+16;y<STORE.y+STORE.h-16;y+=32)for(let x=STORE.x+16;x<STORE.x+STORE.w-16;x+=32)if(((x+y)>>5)&1)ctx.fillRect(sx(x),sy(y),32,32);ctx.fillStyle='rgba(118,142,148,.08)';ctx.fillRect(r.x,r.y,r.w,r.h);}
function drawTerrainLayer(W,H){if(!rectIntersectsView(REGION,W,H))return;const bounds=visibleTileBounds(W,H);if(!bounds.cols||!bounds.rows)return;ctx.save();ctx.imageSmoothingEnabled=false;for(let wy=bounds.startY;wy<bounds.endY;wy+=TILE_SIZE)for(let wx=bounds.startX;wx<bounds.endX;wx+=TILE_SIZE){const material=regionMaterial(wx,wy);if(material==='store_floor')continue;drawAtlasTile(tileForMaterial(material,wx,wy),wx,wy);const cold=clamp01((1900-(wy+32))/1050);if(cold>0){ctx.fillStyle=`rgba(38,55,65,${(.08+cold*.16).toFixed(3)})`;ctx.fillRect(sx(wx),sy(wy),TILE_SIZE,TILE_SIZE);}}if(rectIntersectsView(STORE,W,H))drawStoreFloor();ctx.restore();}
function drawCrack(d){const x=sx(d.x),y=sy(d.y);ctx.fillStyle='#263034';ctx.fillRect(x,y+8,22,3);ctx.fillRect(x+18,y+10,3,12);ctx.fillRect(x+20,y+19,28,3);ctx.fillRect(x+44,y+20,3,12);ctx.fillRect(x+46,y+29,20,3);}
function drawPuddle(d){const x=sx(d.x),y=sy(d.y);ctx.fillStyle='rgba(77,101,110,.45)';ctx.fillRect(x+8,y,d.w-16,d.h);ctx.fillRect(x,y+6,d.w,d.h-12);ctx.fillStyle='rgba(148,169,173,.18)';ctx.fillRect(x+14,y+5,Math.max(8,d.w-34),3);}
function drawDecalLayer(W,H){ctx.save();ctx.imageSmoothingEnabled=false;for(const d of DECALS){if(Math.abs(sx(d.x))>W+180||Math.abs(sy(d.y))>H+180)continue;if(d.kind==='puddle')drawPuddle(d);else if(d.kind==='crack')drawCrack(d);else if(d.kind==='tire'){ctx.fillStyle='rgba(29,36,39,.30)';ctx.fillRect(sx(d.x),sy(d.y),d.w,d.h);}else if(d.kind==='glass'){const x=sx(d.x),y=sy(d.y);ctx.fillStyle='rgba(146,170,176,.35)';for(let i=0;i<7;i++)ctx.fillRect(x+(i*11)%d.w,y+(i*7)%d.h,3,2);}else if(d.kind==='residue'){const x=sx(d.x),y=sy(d.y);ctx.fillStyle='rgba(98,133,127,.26)';ctx.fillRect(x+10,y+18,56,8);ctx.fillRect(x+24,y+9,30,24);ctx.fillStyle='rgba(153,185,176,.18)';ctx.fillRect(x+34,y+2,12,42);}}ctx.restore();}
function drawWall(p){const r=screenRect(p);ctx.fillStyle='#1c2528';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#667076';if(r.w>r.h)ctx.fillRect(r.x+2,r.y+2,r.w-4,5);else ctx.fillRect(r.x+2,r.y+2,5,r.h-4);}
function drawShelf(p){const r=screenRect(p);ctx.fillStyle='#242c2f';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#778087';ctx.fillRect(r.x+4,r.y+5,r.w-8,5);ctx.fillRect(r.x+4,r.y+r.h-9,r.w-8,4);for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#7a6f56':'#596b64';ctx.fillRect(r.x+10+i*22,r.y+12,10,10);}}
function drawFridge(p){const r=screenRect(p);ctx.fillStyle='#20282b';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#708086';ctx.fillRect(r.x+4,r.y+4,r.w-8,r.h-8);ctx.fillStyle='#35464c';for(let i=0;i<3;i++){const w=Math.floor((r.w-16)/3);ctx.fillRect(r.x+8+i*w,r.y+8,w-3,r.h-16);}ctx.fillStyle='#9ab1b2';ctx.fillRect(r.x+9,r.y+10,r.w-18,3);}
function drawCounter(p){const r=screenRect(p);ctx.fillStyle='#202729';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#665e50';ctx.fillRect(r.x+3,r.y+4,r.w-6,r.h-7);ctx.fillStyle='#90908a';ctx.fillRect(r.x+10,r.y+8,28,12);ctx.fillStyle='#3d4749';ctx.fillRect(r.x+46,r.y+8,24,12);}
function drawDebris(p){const r=screenRect(p);ctx.fillStyle='#252d2f';ctx.fillRect(r.x+10,r.y+18,r.w-18,r.h-18);ctx.fillStyle='#67645b';ctx.fillRect(r.x,r.y+28,34,12);ctx.fillStyle='#4c5554';ctx.fillRect(r.x+28,r.y+8,30,18);ctx.fillStyle='#7e7b68';ctx.fillRect(r.x+48,r.y+33,24,10);}
function drawFence(p){const r=screenRect(p);ctx.fillStyle='#30393c';ctx.fillRect(r.x,r.y,4,r.h);ctx.fillRect(r.x+r.w-4,r.y,4,r.h);for(let yy=0;yy<r.h;yy+=24)ctx.fillRect(r.x,r.y+yy,r.w,3);}
function drawBarrier(p){const r=screenRect(p);ctx.fillStyle='#3a4143';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#7a7568';for(let x=4;x<r.w-8;x+=24)ctx.fillRect(r.x+x,r.y+5,12,r.h-10);}
function drawPropLayer(W,H){ctx.save();ctx.imageSmoothingEnabled=false;for(const p of PROPS){const r=screenRect(p);if(r.x>W+80||r.y>H+80||r.x+r.w<-80||r.y+r.h<-80)continue;if(p.kind==='wall')drawWall(p);else if(p.kind==='shelf')drawShelf(p);else if(p.kind==='fridge')drawFridge(p);else if(p.kind==='counter')drawCounter(p);else if(p.kind==='debris')drawDebris(p);else if(p.kind==='fence')drawFence(p);else if(p.kind==='barrier')drawBarrier(p);}if(rectIntersectsView(STORE,W,H)){ctx.fillStyle='#d3c8aa';ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillText('MIRE MART',sx(STORE.x+STORE.w/2),sy(STORE.y+STORE.h+20));ctx.fillStyle='#829098';ctx.font='bold 6px monospace';ctx.fillText('NO POWER',sx(STORE.x+STORE.w/2),sy(STORE.y+STORE.h+31));}ctx.restore();}
function drawFxLayer(W,H){if(!rectIntersectsView(STORE,W,H))return;const t=typeof performance!=='undefined'?performance.now():0,pulse=.16+(Math.sin(t/173)+1)*.05;ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle=`rgba(143,181,174,${pulse.toFixed(3)})`;ctx.fillRect(sx(2624),sy(950),84,5);ctx.fillRect(sx(2650),sy(934),28,28);if((Math.floor(t/380)&3)!==1){ctx.fillStyle='rgba(189,207,199,.22)';ctx.fillRect(sx(2610),sy(676),96,4);}ctx.restore();}

function isBlockedPoint(x,y){return COLLISION.some(r=>inRect(Number(x),Number(y),r));}
function isBlockedCircle(x,y,radius=10){const r=Math.max(0,Math.min(18,Number(radius)||0));if(isBlockedPoint(x,y))return true;for(let i=0;i<8;i++){const a=i*Math.PI/4;if(isBlockedPoint(x+Math.cos(a)*r,y+Math.sin(a)*r))return true;}return false;}
function resolveMovement(fromX,fromY,toX,toY,radius=10){let x=Number(fromX),y=Number(fromY);const fx=x,fy=y,tx=Number(toX),ty=Number(toY);if(![fx,fy,tx,ty].every(Number.isFinite))return{x:fx||0,y:fy||0,blocked:false};const dist=Math.hypot(tx-fx,ty-fy),steps=Math.max(1,Math.ceil(dist/8)),stepX=(tx-fx)/steps,stepY=(ty-fy)/steps;let blocked=false;for(let i=0;i<steps;i++){const wantX=x+stepX,wantY=y+stepY;if(!isBlockedCircle(wantX,wantY,radius)){x=wantX;y=wantY;continue;}blocked=true;let moved=false;if(Math.abs(stepX)>.0001&&!isBlockedCircle(wantX,y,radius)){x=wantX;moved=true;}if(Math.abs(stepY)>.0001&&!isBlockedCircle(x,wantY,radius)){y=wantY;moved=true;}if(!moved)break;}return{x,y,blocked};}
function hasLineOfSight(fromX,fromY,toX,toY){const ax=Number(fromX),ay=Number(fromY),bx=Number(toX),by=Number(toY);if(![ax,ay,bx,by].every(Number.isFinite))return false;const dist=Math.hypot(bx-ax,by-ay),steps=Math.max(1,Math.ceil(dist/4));for(let i=1;i<steps;i++){const t=i/steps;if(isBlockedPoint(ax+(bx-ax)*t,ay+(by-ay)*t))return false;}return true;}
function resolveMobMovement(m,toX,toY){if(!m)return{blocked:false};const r=resolveMovement(m.x,m.y,toX,toY,10);m.x=r.x;m.y=r.y;return r;}
function inStore(p=me){return !!p&&inRect(Number(p.x),Number(p.y),STORE);}

function addPoiResources(zone){
  if(String(zone)!=='1:0')return;
  resources=resources.filter(r=>String(r.id).startsWith('poi:store:')||!inRect(Number(r.x),Number(r.y),POI_CLEAR));
  for(const def of INTERACTIONS){if(resources.some(r=>r.id===def.id))continue;resources.push({id:def.id,type:def.type,x:def.x,y:def.y,r:def.r,poi:STORE.id,source:def.source});}
}
function makePoiMob(def){return{id:def.id,kind:def.kind,x:def.x,y:def.y,hp:def.hp,phase:def.phase,hitCd:0,respawnAt:0,poi:STORE.id};}
const baseSeedZone=typeof window.seedZone==='function'?window.seedZone:null;
if(baseSeedZone)window.seedZone=seedZone=function(zone){const result=baseSeedZone(zone);addPoiResources(zone);return result;};
const baseFreshMob=typeof window.freshMob==='function'?window.freshMob:null;
if(baseFreshMob)window.freshMob=freshMob=function(zone,index){const def=ENTITIES.find(e=>String(zone)==='1:0'&&e.index===index);return def?makePoiMob(def):baseFreshMob(zone,index);};
const baseSpawnMobs=typeof window.spawnMobs==='function'?window.spawnMobs:null;
if(baseSpawnMobs)window.spawnMobs=spawnMobs=function(zone){baseSpawnMobs(zone);if(String(zone)==='1:0')for(const def of ENTITIES)if(!mobs.some(m=>m.id===def.id))mobs.push(makePoiMob(def));};
const baseUpdateMobs=typeof window.updateMobs==='function'?window.updateMobs:null;
if(baseUpdateMobs)window.updateMobs=updateMobs=function(dt){
  if(String(currentZone)!=='1:0')return baseUpdateMobs(dt);
  const actors=[me,...remotes.values()].filter(p=>p&&p.hp!==0&&campDist(p.x,p.y)>=CAMP.r&&!(p.id===SESSION_ID&&Date.now()<fieldGraceUntil));
  for(let i=0;i<mobs.length;i++){
    let m=mobs[i];
    if(m.hp<=0){if(m.respawnAt&&Date.now()>=m.respawnAt){mobs[i]=freshMob(currentZone,i);m=mobs[i];}else continue;}
    m.hitCd=Math.max(0,(m.hitCd||0)-dt);
    const cd=campDist(m.x,m.y);
    if(cd<CAMP.r+90){const a=Math.atan2(m.y-CAMP.y,m.x-CAMP.x);m.x=CAMP.x+Math.cos(a)*(CAMP.r+92);m.y=CAMP.y+Math.sin(a)*(CAMP.r+92);}
    let t=null,bd=1e9;
    for(const p of actors){const d=Math.hypot(m.x-p.x,m.y-p.y);if(d<bd){bd=d;t=p;}}
    if(t&&bd<410){
      const a=Math.atan2(t.y-m.y,t.x-m.x),sp=m.kind==='crawler'?57:(m.kind==='cultist'?39:33),nx=m.x+Math.cos(a)*sp*dt,ny=m.y+Math.sin(a)*sp*dt;
      if(campDist(nx,ny)>CAMP.r+72)resolveMobMovement(m,nx,ny);
      if(bd<(t.r||14)+18&&m.hitCd<=0&&hasLineOfSight(m.x,m.y,t.x,t.y)){m.hitCd=m.kind==='crawler'?.9:1.15;applyMobDamage(t.id,m.kind);}
    }else{
      m.phase+=dt*.48;
      const nx=m.x+Math.cos(m.phase)*9*dt,ny=m.y+Math.sin(m.phase*.71)*9*dt;
      if(campDist(nx,ny)>CAMP.r+72)resolveMobMovement(m,nx,ny);
    }
    const[zx,zy]=currentZone.split(':').map(Number),minX=zx*WORLD.zone+20,maxX=(zx+1)*WORLD.zone-20,minY=zy*WORLD.zone+20,maxY=(zy+1)*WORLD.zone-20;
    m.x=clamp(m.x,minX,maxX);m.y=clamp(m.y,minY,maxY);
  }
};
const baseHandleMobAttack=typeof window.handleMobAttack==='function'?window.handleMobAttack:null;
if(baseHandleMobAttack)window.handleMobAttack=handleMobAttack=function(p){
  if(String(currentZone)!=='1:0')return baseHandleMobAttack(p);
  if(!zoneLeader||!p||campDist(finite(p.x,0),finite(p.y,0))<CAMP.r)return;
  const px=finite(p.x,0),py=finite(p.y,0),range=finite(p.range,60),dir=finite(p.dir,0),damage=clamp(finite(p.damage,10),1,25);
  for(const m of mobs){if(m.hp<=0)continue;const d=Math.hypot(m.x-px,m.y-py);if(d>range||!hasLineOfSight(px,py,m.x,m.y))continue;const a=Math.atan2(m.y-py,m.x-px),diff=Math.abs(Math.atan2(Math.sin(a-dir),Math.cos(a-dir)));if(diff<1.0){m.hp-=damage;if(m.hp<=0){m.hp=0;m.respawnAt=Date.now()+11000;rewardKill(p.id,m.kind);if(p.id===SESSION_ID)toast('Something ancient collapses.');}}}
};
const baseDrawGround=typeof window.drawGround==='function'?window.drawGround:null;if(baseDrawGround)window.drawGround=function(W,H){baseDrawGround(W,H);drawTerrainLayer(W,H);drawDecalLayer(W,H);};
const baseDrawCamp=typeof window.drawCamp==='function'?window.drawCamp:null;if(baseDrawCamp)window.drawCamp=function(W,H){baseDrawCamp(W,H);drawPropLayer(W,H);};
const baseDrawLighting=typeof window.drawLighting==='function'?window.drawLighting:null;if(baseDrawLighting)window.drawLighting=function(W,H){baseDrawLighting(W,H);drawFxLayer(W,H);};
let movementOrigin=null;
const baseSendMove=typeof window.sendMove==='function'?window.sendMove:null;if(baseSendMove)window.sendMove=function(...args){if(movementOrigin&&typeof me!=='undefined'){const r=resolveMovement(movementOrigin.x,movementOrigin.y,me.x,me.y,Math.min(12,me.r||10));me.x=r.x;me.y=r.y;}return baseSendMove(...args);};
const baseUpdate=typeof window.update==='function'?window.update:null;if(baseUpdate)window.update=function(dt){if(typeof me==='undefined')return baseUpdate(dt);movementOrigin={x:me.x,y:me.y};try{const result=baseUpdate(dt),r=resolveMovement(movementOrigin.x,movementOrigin.y,me.x,me.y,Math.min(12,me.r||10));me.x=r.x;me.y=r.y;return result;}finally{movementOrigin=null;}};

let returnAnnounced=false;
const baseUpdateQuest=typeof window.updateQuest==='function'?window.updateQuest:null;
function rewardReady(){return(Number(inventory.shard)||0)>=STARTING_SHARDS+2;}
function objectiveText(){if(!started||dead||!inventory.knife)return null;if(inCamp()){if(hasLeftCamp&&rewardReady()){if(!returnAnnounced){returnAnnounced=true;try{toast('便利店调查完成 · 带回的异质碎片可以推进灯笼制作。');}catch{}}return inventory.lantern?'首次调查完成 · HOME 已补给。':'调查完成 · 工作台：准备灯笼与下一次外出。';}return '北门公路 → 调查停电的废弃便利店。';}if(inStore())return rewardReady()?'异常残留已取得 · 带着补给返回 Safe Camp。':'便利店：搜索货架、冰柜、碎屑与异常残留。';if(rewardReady())return '带着便利店补给返回 Safe Camp。';return '沿破损北路前进 · 寻找停电便利店。';}
if(baseUpdateQuest)window.updateQuest=updateQuest=function(){baseUpdateQuest();const text=objectiveText();if(text&&questText)questText.textContent=text;};

window.ABYSSAL_AWAKENING_WORLD_V1={version:VERSION,stage:WORLD_STAGE,region:REGION,poi:STORE,layers:LAYERS,placeholderArt:true,artContract:'AWAKENING_ASSET_CONTRACT.md',roadCenterAt,regionMaterial,visibleTileBounds,inStore,isBlockedPoint,isBlockedCircle,resolveMovement,resolveMobMovement,hasLineOfSight,addPoiResources,objectiveText};
})();