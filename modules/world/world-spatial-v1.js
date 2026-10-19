(()=>{
'use strict';

if(globalThis.ABYSSAL_WORLD_SPATIAL_V1?.version===1)return;

const registry=new Map();
function zoneKey(zone){return String(zone??'');}
function finite(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback;}
function contains(rect,x,y){return x>=rect.x&&y>=rect.y&&x<rect.x+rect.w&&y<rect.y+rect.h;}
function normalizeCollider(raw={}){const x=Number(raw.x),y=Number(raw.y),w=Number(raw.w),h=Number(raw.h);if(![x,y,w,h].every(Number.isFinite)||w<0||h<0||!Number.isFinite(x+w)||!Number.isFinite(y+h))throw new Error(`World Spatial collider has invalid bounds: ${String(raw.id||'')||'(unnamed)'}`);return{id:String(raw.id||''),kind:String(raw.kind||'obstacle'),x,y,w,h};}
function registerGeometry(def={}){
  const id=String(def.id||'').trim(),zone=zoneKey(def.zone);
  if(!id)throw new Error('World Spatial geometry id is required');
  if(!zone)throw new Error(`World Spatial zone is required for ${id}`);
  const colliders=Array.isArray(def.colliders)?def.colliders.map(normalizeCollider).filter(r=>r.w>0&&r.h>0):[];
  const record={id,zone,colliders};
  registry.set(id,record);
  return record;
}
function unregisterGeometry(id){return registry.delete(String(id||''));}
function geometriesFor(zone){const key=zoneKey(zone);return[...registry.values()].filter(record=>record.zone===key);}
function isBlockedPoint(zone,x,y){const px=finite(x,NaN),py=finite(y,NaN);if(!Number.isFinite(px)||!Number.isFinite(py))return true;for(const record of geometriesFor(zone))for(const rect of record.colliders)if(contains(rect,px,py))return true;return false;}
function isBlockedCircle(zone,x,y,radius=10){const px=Number(x),py=Number(y),rawRadius=Number(radius);if(![px,py,rawRadius].every(Number.isFinite))return true;const r=Math.max(0,Math.min(18,rawRadius));for(const record of geometriesFor(zone))for(const rect of record.colliders){if(contains(rect,px,py))return true;if(r===0)continue;const closestX=Math.max(rect.x,Math.min(px,rect.x+rect.w)),closestY=Math.max(rect.y,Math.min(py,rect.y+rect.h)),dx=px-closestX,dy=py-closestY;if(dx*dx+dy*dy<=r*r)return true;}return false;}
function resolveMovement(zone,fromX,fromY,toX,toY,radius=10){let x=Number(fromX),y=Number(fromY);const fx=x,fy=y,tx=Number(toX),ty=Number(toY);if(![fx,fy,tx,ty].every(Number.isFinite))return{x:Number.isFinite(fx)?fx:0,y:Number.isFinite(fy)?fy:0,blocked:true};if(geometriesFor(zone).length===0)return{x:tx,y:ty,blocked:false};const dist=Math.hypot(tx-fx,ty-fy),steps=Math.max(1,Math.ceil(dist/8)),stepX=(tx-fx)/steps,stepY=(ty-fy)/steps;let blocked=false;for(let i=0;i<steps;i++){const wantX=x+stepX,wantY=y+stepY;if(!isBlockedCircle(zone,wantX,wantY,radius)){x=wantX;y=wantY;continue;}blocked=true;let moved=false;if(Math.abs(stepX)>.0001&&!isBlockedCircle(zone,wantX,y,radius)){x=wantX;moved=true;}if(Math.abs(stepY)>.0001&&!isBlockedCircle(zone,x,wantY,radius)){y=wantY;moved=true;}if(!moved)break;}return{x,y,blocked};}
function hasMeleeLineOfSight(zone,fromX,fromY,toX,toY){const ax=Number(fromX),ay=Number(fromY),bx=Number(toX),by=Number(toY);if(![ax,ay,bx,by].every(Number.isFinite))return false;if(geometriesFor(zone).length===0)return true;const dist=Math.hypot(bx-ax,by-ay),steps=Math.max(1,Math.ceil(dist/4));for(let i=1;i<steps;i++){const t=i/steps;if(isBlockedPoint(zone,ax+(bx-ax)*t,ay+(by-ay)*t))return false;}return true;}
function geometryIds(zone){return geometriesFor(zone).map(record=>record.id);}

globalThis.ABYSSAL_WORLD_SPATIAL_V1={version:1,registerGeometry,unregisterGeometry,isBlockedPoint,isBlockedCircle,resolveMovement,hasMeleeLineOfSight,geometryIds};
})();
