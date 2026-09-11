(()=>{
'use strict';

const params=new URLSearchParams(location.search||'');
const enabled=params.get('devperf')==='1';
const API={version:1,enabled,visible:false,fps:0,avgFrameMs:0,p95FrameMs:0};
window.ABYSSAL_PERF_V1=API;
if(!enabled)return;

const overlay=document.createElement('div');
overlay.id='abyssalDevPerfV1';
overlay.setAttribute('aria-live','off');
Object.assign(overlay.style,{position:'fixed',left:'8px',bottom:'8px',zIndex:'9999',pointerEvents:'none',padding:'6px 8px',border:'1px solid #6d8078',background:'#07110fe6',color:'#d9e7df',font:'700 10px/1.35 ui-monospace,monospace',whiteSpace:'pre',textShadow:'0 1px #000'});
document.body.appendChild(overlay);API.visible=true;

let last=performance.now(),windowStart=last,frames=0,totalMs=0;
const samples=[];
function percentile95(values){
  if(!values.length)return 0;
  const sorted=[...values].sort((a,b)=>a-b);
  return sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*.95)-1)];
}
function render(now){
  const elapsed=now-windowStart;
  if(elapsed<500)return;
  API.fps=frames*1000/Math.max(1,elapsed);
  API.avgFrameMs=frames?totalMs/frames:0;
  API.p95FrameMs=percentile95(samples);
  overlay.textContent=`DEV PERF\nFPS ${API.fps.toFixed(1)}\nAVG ${API.avgFrameMs.toFixed(1)} ms\nP95 ${API.p95FrameMs.toFixed(1)} ms`;
  windowStart=now;frames=0;totalMs=0;samples.length=0;
}
function tick(now){
  const dt=Math.max(0,Math.min(250,now-last));last=now;frames++;totalMs+=dt;samples.push(dt);
  if(samples.length>180)samples.shift();
  render(now);requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

document.addEventListener('keydown',event=>{
  if(event.code!=='F3')return;
  event.preventDefault();API.visible=!API.visible;overlay.style.display=API.visible?'':'none';
},true);

Object.assign(API,{overlay,percentile95});
})();
