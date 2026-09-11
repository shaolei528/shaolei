(()=>{
'use strict';
/* Presentation-only prototype. Gameplay terrain/collision remain 64x64 and authoritative elsewhere. */
const TILE=64;
const ALLOWED_CELLS=new Set([3,4,6]);
const MODES=new Set(['A','B','C']);
const state={mode:'C',patches:[],images:new Map(),stats:{drawCalls:0,frameTimes:[],renderTimes:[],fps:0,avgMs:0,p95Ms:0,renderAvgMs:0,renderP95Ms:0,lastFrameAt:0,_start:0}};
function snapCell(v){return Math.floor(Number(v)/TILE)*TILE;}
function normalizePatch(input={}){const cells=ALLOWED_CELLS.has(Number(input.cells))?Number(input.cells):3;return{id:String(input.id||`macro-${snapCell(input.x)}-${snapCell(input.y)}-${cells}`),x:snapCell(input.x||0),y:snapCell(input.y||0),cells,w:cells*TILE,h:cells*TILE,src:String(input.src||''),alpha:Math.max(0,Math.min(1,Number(input.alpha??1))),detail:input.detail!==false};}
function setPatches(list=[]){state.patches=list.map(normalizePatch).sort((a,b)=>a.id.localeCompare(b.id));return state.patches;}
function setMode(mode){if(MODES.has(mode))state.mode=mode;return state.mode;}
function viewRect(cameraLike,W,H,pad=0){return{x:cameraLike.x-W/2-pad,y:cameraLike.y-H/2-pad,w:W+pad*2,h:H+pad*2};}
function intersects(a,b){return a.x+a.w>=b.x&&a.x<=b.x+b.w&&a.y+a.h>=b.y&&a.y<=b.y+b.h;}
function visiblePatches(cameraLike,W,H){const view=viewRect(cameraLike,W,H,TILE);return state.patches.filter(p=>intersects(p,view));}
function loadPatch(p){if(!p.src||typeof Image==='undefined')return null;let rec=state.images.get(p.src);if(rec)return rec;const image=new Image();rec={image,ready:false,failed:false};image.onload=()=>{rec.ready=true;};image.onerror=()=>{rec.failed=true;};image.src=p.src;state.images.set(p.src,rec);return rec;}
function addDrawCalls(count=1){state.stats.drawCalls+=Math.max(0,Number(count)||0);return state.stats.drawCalls;}
function drawPatch(context,p,cameraLike,W,H,alpha=1){const rec=loadPatch(p);if(!rec?.ready)return false;const dx=Math.round(p.x-cameraLike.x+W/2),dy=Math.round(p.y-cameraLike.y+H/2);const previousSmoothing=context.imageSmoothingEnabled,previousAlpha=context.globalAlpha;context.save();try{context.imageSmoothingEnabled=false;context.globalAlpha=Math.max(0,Math.min(1,p.alpha*alpha));context.drawImage(rec.image,0,0,rec.image.naturalWidth,rec.image.naturalHeight,dx,dy,p.w,p.h);}finally{context.restore();context.imageSmoothingEnabled=previousSmoothing;context.globalAlpha=previousAlpha;}addDrawCalls();return true;}
function render(args={}){const context=args.ctx,cameraLike=args.camera,W=Number(args.W)||0,H=Number(args.H)||0;if(!context||!cameraLike||!W||!H)return{drawn:0,visible:0,missing:[]};const mode=MODES.has(args.mode)?args.mode:state.mode;if(mode==='A')return{drawn:0,visible:0,missing:[]};const visible=visiblePatches(cameraLike,W,H);let drawn=0;const missing=[];for(const p of visible){if(mode==='C'&&!p.detail)continue;if(drawPatch(context,p,cameraLike,W,H,mode==='C'?.72:1))drawn++;else missing.push(p);}return{drawn,visible:visible.length,missing};}
function percentile95(values){if(!values.length)return 0;const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))];}
function average(values){return values.length?values.reduce((a,b)=>a+b,0)/values.length:0;}
function trim(values){if(values.length>240)values.splice(0,values.length-240);}
function beginFrame(now=(typeof performance!=='undefined'?performance.now():Date.now())){const current=Number(now)||0;state.stats.drawCalls=0;if(state.stats.lastFrameAt>0){const delta=current-state.stats.lastFrameAt;if(delta>0&&delta<1000){state.stats.frameTimes.push(delta);trim(state.stats.frameTimes);}}state.stats.lastFrameAt=current;state.stats._start=current;}
function endFrame(now=(typeof performance!=='undefined'?performance.now():Date.now())){const end=Number(now)||0,start=Number(state.stats._start)||end,renderMs=Math.max(0,end-start);state.stats.renderTimes.push(renderMs);trim(state.stats.renderTimes);state.stats.avgMs=average(state.stats.frameTimes);state.stats.p95Ms=percentile95(state.stats.frameTimes);state.stats.fps=state.stats.avgMs>0?1000/state.stats.avgMs:0;state.stats.renderAvgMs=average(state.stats.renderTimes);state.stats.renderP95Ms=percentile95(state.stats.renderTimes);return snapshotStats();}
function resetStats(){state.stats.drawCalls=0;state.stats.frameTimes.length=0;state.stats.renderTimes.length=0;state.stats.fps=0;state.stats.avgMs=0;state.stats.p95Ms=0;state.stats.renderAvgMs=0;state.stats.renderP95Ms=0;state.stats.lastFrameAt=0;state.stats._start=0;return snapshotStats();}
function snapshotStats(){return{drawCalls:state.stats.drawCalls,fps:state.stats.fps,avgMs:state.stats.avgMs,p95Ms:state.stats.p95Ms,renderAvgMs:state.stats.renderAvgMs,renderP95Ms:state.stats.renderP95Ms,samples:state.stats.frameTimes.length};}
const API={version:1,tileSize:TILE,allowedCells:[3,4,6],state,setMode,setPatches,normalizePatch,visiblePatches,render,beginFrame,endFrame,resetStats,snapshotStats,addDrawCalls};
window.ABYSSAL_MACRO_TERRAIN_PROTOTYPE_V1=API;
})();
