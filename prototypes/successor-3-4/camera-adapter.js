(() => {
  'use strict';
  function project(x,y,originX=0,originY=0){return{x:(x-y-originX+originY)*.5,y:(x+y-originX-originY)*.25};}
  function screenIntentToWorld(x,y){return{x:x+2*y,y:-x+2*y};}
  function worldIntentForScreenInput(x,y){const length=Math.hypot(x,y),scale=length>1?1/length:1,intent=screenIntentToWorld(x*scale,y*scale);return{x:intent.x/Math.sqrt(8),y:intent.y/Math.sqrt(8)};}
  function worldDeltaForScreenIntent(x,y,speed,dt){const length=Math.hypot(x,y);if(!length)return{x:0,y:0};const n=length>1?{x:x/length,y:y/length}:{x,y};const v=screenIntentToWorld(n.x,n.y);return{x:v.x*speed*dt,y:v.y*speed*dt};}
  function depthKey(object){return Number(object.x)+Number(object.y);}
  function sortByFootDepth(objects){return [...objects].sort((a,b)=>depthKey(a)-depthKey(b)||String(a.id).localeCompare(String(b.id)));}
  function screenDeltaFromResolvedWorldDelta(dx,dy){return{x:(dx-dy)*.5,y:(dx+dy)*.25};}
  function pixelZoomForViewport(width){return 1;}
  function backingSizeForViewport(width,height,dpr=1){const scale=Math.min(2,Math.max(1,Number(dpr)||1));return{width:Math.max(1,Math.round(Number(width)*scale)),height:Math.max(1,Math.round(Number(height)*scale))};}
  globalThis.ABYSSAL_CAMERA_ADAPTER_V1={project,screenIntentToWorld,worldIntentForScreenInput,worldDeltaForScreenIntent,screenDeltaFromResolvedWorldDelta,depthKey,sortByFootDepth,pixelZoomForViewport,backingSizeForViewport};
})();
