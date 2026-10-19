(()=>{
'use strict';
if(globalThis.ABYSSAL_FARM_RENDER_V1?.version===1)return;

function polygon(ctx,points,fill,stroke){
  ctx.beginPath();ctx.moveTo(Math.round(points[0].x),Math.round(points[0].y));
  for(let i=1;i<points.length;i++)ctx.lineTo(Math.round(points[i].x),Math.round(points[i].y));
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
}
function drawPlot(ctx,project,plot,selected=false){
  if(!ctx||typeof project!=='function'||!plot)return false;
  const p=project(plot.x,plot.y),ready=plot.stage==='ready',growing=plot.stage==='growing';
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='#1c241d66';ctx.beginPath();ctx.ellipse(p.x,p.y+4,24,7,0,0,Math.PI*2);ctx.fill();
  polygon(ctx,[{x:p.x-22,y:p.y-4},{x:p.x,y:p.y-14},{x:p.x+22,y:p.y-4},{x:p.x,y:p.y+7}],'#574533',selected?'#f0d58b':'#766146');
  polygon(ctx,[{x:p.x-18,y:p.y-4},{x:p.x,y:p.y-12},{x:p.x+18,y:p.y-4},{x:p.x,y:p.y+4}],'#72543c');
  for(let i=0;i<3;i++){const x=Math.round(p.x-11+i*11),lift=growing?5:ready?14:0;
    if(lift){ctx.fillStyle='#394e32';ctx.fillRect(x-2,p.y-5-lift+3,4,5+lift);ctx.fillStyle=ready?'#b5c679':'#829d61';ctx.fillRect(x-6,p.y-8-lift,6,3);ctx.fillRect(x+1,p.y-10-lift,6,3);ctx.fillStyle='#c0bd79';if(ready)ctx.fillRect(x+1,p.y-16,3,3);}
  }
  if(selected){ctx.fillStyle='#18221b';ctx.fillRect(p.x-25,p.y-35,50,11);ctx.strokeStyle='#e0cb89';ctx.strokeRect(p.x-24.5,p.y-34.5,49,10);ctx.fillStyle='#f2e7c9';ctx.font='bold 7px ui-monospace,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(ready?'可收获':growing?'生长中':'种下叶菜',p.x,p.y-29);}
  ctx.restore();return true;
}
const api=Object.freeze({version:1,drawPlot});
globalThis.ABYSSAL_FARM_RENDER_V1=api;
if(typeof window.AW_SUCCESSOR_VIEW!=='string'||window.AW_SUCCESSOR_VIEW!=='34'){
  if(typeof drawCamp==='function'&&typeof sx==='function'&&typeof sy==='function'){
    const previous=drawCamp;
    drawCamp=function(width,height){previous(width,height);const plots=globalThis.ABYSSAL_FARMING_V1?.getSnapshot?.()||[],target=globalThis.ABYSSAL_FARMING_V1?.getTarget?.();for(const plot of plots)if(currentZone==='1:1')drawPlot(ctx,(x,y)=>({x:sx(x),y:sy(y)}),plot,target?.plotId===plot.id);};
  }
}
})();
