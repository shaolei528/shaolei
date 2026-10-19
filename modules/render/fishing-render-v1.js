(()=>{
  'use strict';
  if(globalThis.ABYSSAL_FISHING_RENDER_V1?.version===1)return;
  const config=globalThis.ABYSSAL_FISHING_CONFIG_V1;
  const water=globalThis.ABYSSAL_WATER_BODIES_V1;
  function polygon(ctx,points,color,stroke){ctx.beginPath();ctx.moveTo(Math.round(points[0].x),Math.round(points[0].y));for(let i=1;i<points.length;i++)ctx.lineTo(Math.round(points[i].x),Math.round(points[i].y));ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
  function pondGeometry(project){
    if(typeof project!=='function'||!config||!water?.getBody)return null;
    const pond=config.ponds?.[0];if(!pond)return null;
    const body=water.getBody(pond.waterBodyId||pond.id);if(!body)return null;
    const cx=body.cx,cy=body.cy,r=Math.min(body.halfWidth,body.halfHeight),shore=Math.max(0,Number(body.collisionPadding)||0);
    const points=(radius,dy=0)=>[[cx-radius,cy-radius],[cx+radius,cy-radius],[cx+radius,cy+radius],[cx-radius,cy+radius]].map(([x,y])=>project(x,y+dy));
    return{body,r,shore,points};
  }
  function drawPond(ctx,project,now=0){
    if(!ctx)return false;
    const geometry=pondGeometry(project);if(!geometry)return false;
    const {body,r,shore,points}=geometry,cx=body.cx,cy=body.cy,outer=r+shore,mid=Math.max(r,outer-8),inner=Math.max(r,Math.min(outer-16,r+Math.max(8,shore*.15)));
    ctx.save();ctx.imageSmoothingEnabled=false;
    // The dry bank reaches the same world-space boundary as the padded water
    // collider, so the player never appears to stand on an invisible margin.
    polygon(ctx,points(outer,2),'#514b3d','#817154');
    polygon(ctx,points(mid,1),'#ad976c','#d0b77f');
    polygon(ctx,points(inner,0),'#7fa79a','#9bb8a2');
    polygon(ctx,points(r,-1),'#37646a','#688f87');
    const center=project(cx,cy);ctx.save();ctx.beginPath();const edge=points(r);ctx.moveTo(edge[0].x,edge[0].y);for(let i=1;i<edge.length;i++)ctx.lineTo(edge[i].x,edge[i].y);ctx.closePath();ctx.clip();
    for(let i=0;i<9;i++){const x=Math.round(center.x-36+(i*19)%73),y=Math.round(center.y-11+((i*13+Math.floor(now/700))%24));ctx.fillStyle=i%3?'#91b4a0':'#c8c99a';ctx.fillRect(x,y,5+(i%3)*2,1);}
    ctx.restore();
    ctx.restore();return true;
  }
  function drawPondFrontBank(ctx,project){
    if(!ctx)return false;
    const geometry=pondGeometry(project);if(!geometry)return false;
    const {r,shore,points}=geometry,outerRadius=r+shore,midRadius=Math.max(r,outerRadius-8),innerRadius=Math.max(r,Math.min(outerRadius-16,r+Math.max(8,shore*.15)));
    const outer=points(outerRadius,2),mid=points(midRadius,1),inner=points(innerRadius,0);
    // The near half of the bank is a depth-sorted foreground edge. It covers
    // feet that are behind the shoreline, while actors standing on the dry
    // side are drawn later and remain visibly in front of the water.
    ctx.save();ctx.imageSmoothingEnabled=false;
    polygon(ctx,[outer[1],outer[2],outer[3],mid[3],mid[2],mid[1]],'#514b3d','#817154');
    polygon(ctx,[mid[1],mid[2],mid[3],inner[3],inner[2],inner[1]],'#ad976c','#d0b77f');
    ctx.restore();return true;
  }
  function frontBankSortAnchor(id,extra=0){
    const body=water?.getBody?.(id);if(!body)return null;
    const values=[body.cx,body.cy,body.halfWidth,body.halfHeight,body.collisionPadding,extra].map(Number);
    if(!values.every(Number.isFinite))return null;
    const [cx,cy,halfWidth,halfHeight,padding,margin]=values;
    return{x:cx+halfWidth+Math.max(0,padding)+Math.max(0,margin),y:cy+halfHeight+Math.max(0,padding)+Math.max(0,margin)};
  }
  globalThis.ABYSSAL_FISHING_RENDER_V1=Object.freeze({version:1,drawPond,drawPondFrontBank,frontBankSortAnchor});
})();
