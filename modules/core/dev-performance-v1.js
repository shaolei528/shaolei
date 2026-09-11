(()=>{
'use strict';

const params=new URLSearchParams(location.search||'');
const enabled=params.get('devperf')==='1';
if(window.ABYSSAL_PERF_V1?.initialized)return;
const API={
  version:1,auditVersion:1,initialized:true,enabled,visible:false,
  fps:0,avgFrameMs:0,p95FrameMs:0,refreshHz:0,
  frameCount:0,longFrameCount:0,hitchCount:0,fpsDriftPct:0,lastInput:null,drawWrapped:false
};
window.ABYSSAL_PERF_V1=API;
if(!enabled)return;

const overlay=document.createElement('div');
overlay.id='abyssalDevPerfV1';
overlay.setAttribute('aria-live','off');
Object.assign(overlay.style,{position:'fixed',left:'8px',bottom:'8px',zIndex:'9999',pointerEvents:'none',padding:'6px 8px',border:'1px solid #6d8078',background:'#07110fe6',color:'#d9e7df',font:'700 10px/1.35 ui-monospace,monospace',whiteSpace:'pre',textShadow:'0 1px #000'});
document.body.appendChild(overlay);API.visible=true;

const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
const perfNow=()=>performance.now();
const defer=typeof queueMicrotask==='function'?queueMicrotask:(fn=>Promise.resolve().then(fn));
const rollingFrames=[],baselineFps=[],recentFps=[];
const inputMetrics=new Map(),pendingVisual=[];
let last=perfNow(),windowStart=last,frames=0,totalMs=0;
const samples=[];

function percentile(values,p=.95){
  if(!values.length)return 0;
  const sorted=[...values].sort((a,b)=>a-b),q=clamp(p,0,1);
  return sorted[Math.min(sorted.length-1,Math.max(0,Math.ceil(sorted.length*q)-1))];
}
function percentile95(values){return percentile(values,.95);}
function average(values){return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0;}
function pushBounded(values,value,max=600){values.push(value);if(values.length>max)values.splice(0,values.length-max);}
function safeAttackState(){try{return{cd:Number(attackCd)||0,flash:Number(attackFlash)||0};}catch{return{cd:0,flash:0};}}
function safeDashState(){try{return{cd:Number(dashCd)||0,queued:!!dashQueued};}catch{return{cd:0,queued:false};}}
function metric(device,action){
  const key=device+':'+action;let value=inputMetrics.get(key);
  if(!value){value={device,action,accepted:0,rejected:0,handlerMs:[],visualMs:[]};inputMetrics.set(key,value);}
  return value;
}
function summarizeMetric(value){
  return{
    device:value.device,action:value.action,accepted:value.accepted,rejected:value.rejected,
    handlerAvgMs:average(value.handlerMs),handlerP95Ms:percentile95(value.handlerMs),
    visualAvgMs:average(value.visualMs),visualP95Ms:percentile95(value.visualMs),lastVisualMs:value.visualMs.at(-1)||0
  };
}
function inputDescriptor(event){
  if(event?.isTrusted===false)return null;
  if(event?.type==='keydown'){
    if(event.repeat)return null;
    if(window.ABYSSAL_PLATFORM_V19&&window.ABYSSAL_PLATFORM_V19.desktop===false)return null;
    if(event.code==='Space')return{device:'pc',action:'attack'};
    if(event.code==='ShiftLeft'||event.code==='ShiftRight')return{device:'pc',action:'dash'};
    if(event.code==='KeyE')return{device:'pc',action:'interact'};
    return null;
  }
  if(event?.type!=='pointerdown')return null;
  let button=null;try{button=event.target?.closest?.('#attackBtn,#dashBtn,#interactV12');}catch{}
  if(!button)return null;
  if(button.id==='attackBtn')return{device:'mobile',action:'attack'};
  if(button.id==='dashBtn')return{device:'mobile',action:'dash'};
  if(button.id==='interactV12')return{device:'mobile',action:'interact'};
  return null;
}
function inputBlocked(event){
  try{if(window.ABYSSAL_SHELL_V1?.blocksGameInput?.(event))return true;}catch{}
  try{if(window.ABYSSAL_PLATFORM_V19?.panelOpen)return true;}catch{}
  return false;
}
function interactionAvailable(){try{return !!window.ABYSSAL_INTERACTION_V12?.getTarget?.();}catch{return false;}}
function stateBefore(action){
  if(action==='attack')return safeAttackState();
  if(action==='dash')return safeDashState();
  if(action==='interact')return{available:interactionAvailable()};
  return{};
}
function acceptedAfter(action,before,blocked){
  if(blocked)return false;
  if(action==='attack'){const after=safeAttackState();return after.cd>before.cd||after.flash>before.flash;}
  if(action==='dash'){const after=safeDashState();return after.cd>before.cd||(!before.queued&&after.queued);}
  if(action==='interact')return !!before.available;
  return false;
}
function captureInput(event){
  const desc=inputDescriptor(event);if(!desc)return;
  const startedAt=perfNow(),before=stateBefore(desc.action),blocked=inputBlocked(event);
  defer(()=>{
    const handledAt=perfNow(),accepted=acceptedAfter(desc.action,before,blocked),m=metric(desc.device,desc.action);
    pushBounded(m.handlerMs,Math.max(0,handledAt-startedAt),120);
    if(accepted){m.accepted++;pendingVisual.push({device:desc.device,action:desc.action,startedAt});if(pendingVisual.length>32)pendingVisual.splice(0,pendingVisual.length-32);}
    else m.rejected++;
    API.lastInput={device:desc.device,action:desc.action,accepted,handlerMs:Math.max(0,handledAt-startedAt),visualMs:null};
  });
}
function flushVisual(now=perfNow()){
  if(!pendingVisual.length)return;
  for(const item of pendingVisual.splice(0,pendingVisual.length)){
    const visualMs=Math.max(0,now-item.startedAt),m=metric(item.device,item.action);
    pushBounded(m.visualMs,visualMs,120);
    API.lastInput={device:item.device,action:item.action,accepted:true,handlerMs:m.handlerMs.at(-1)||0,visualMs};
  }
}
function frameSummary(){
  const med=percentile(rollingFrames,.5),base=average(baselineFps),recent=average(recentFps);
  return{
    fps:API.fps,avgFrameMs:API.avgFrameMs,p95FrameMs:API.p95FrameMs,
    rollingAvgFrameMs:average(rollingFrames),rollingP95FrameMs:percentile95(rollingFrames),
    refreshHz:med>0?1000/med:0,frameCount:API.frameCount,longFrameCount:API.longFrameCount,hitchCount:API.hitchCount,
    baselineFps:base,recentFps:recent,fpsDriftPct:base>0?(recent-base)/base*100:0
  };
}
function snapshot(){
  const scheduler=window.ABYSSAL_LEGACY_SCHEDULER;
  return{
    kind:'playable-slice-smoothness-v1',frame:frameSummary(),
    input:Object.fromEntries([...inputMetrics].map(([key,value])=>[key,summarizeMetric(value)])),
    runtime:{
      motionFrames:Number(window.ABYSSAL_MOTION_V18?.frames)||0,
      legacyIntervalActive:!!scheduler?.intervalId,legacyIntervalCleared:!!scheduler?.intervalCleared,
      audioUnlocked:!!window.ABYSSAL_AUDIO_V1?.unlocked,audioContextState:window.ABYSSAL_AUDIO_V1?.contextState||'unavailable'
    }
  };
}
function render(now){
  const elapsed=now-windowStart;if(elapsed<500)return;
  API.fps=frames*1000/Math.max(1,elapsed);API.avgFrameMs=frames?totalMs/frames:0;API.p95FrameMs=percentile95(samples);
  const med=percentile(rollingFrames,.5);API.refreshHz=med>0?1000/med:0;
  if(baselineFps.length<10)baselineFps.push(API.fps);pushBounded(recentFps,API.fps,10);
  const base=average(baselineFps),recent=average(recentFps);API.fpsDriftPct=base>0?(recent-base)/base*100:0;
  const input=API.lastInput,inputLine=input?`${input.device.toUpperCase()} ${input.action} ${input.accepted?'OK':'BLOCK'}${input.visualMs==null?'':` ${input.visualMs.toFixed(1)}ms`}`:'none';
  overlay.textContent=`DEV PERF\nFPS ${API.fps.toFixed(1)}\nAVG ${API.avgFrameMs.toFixed(1)} ms\nP95 ${API.p95FrameMs.toFixed(1)} ms\nREFRESH ~${API.refreshHz.toFixed(0)} Hz\nLONG>=50 ${API.longFrameCount}\nHITCH ${API.hitchCount}\nDRIFT ${API.fpsDriftPct.toFixed(1)}%\nINPUT ${inputLine}`;
  windowStart=now;frames=0;totalMs=0;samples.length=0;
}
function tick(now){
  const dt=Math.max(0,Math.min(250,now-last));last=now;frames++;API.frameCount++;totalMs+=dt;samples.push(dt);
  const priorMedian=percentile(rollingFrames.slice(-120),.5),hitchThreshold=Math.max(50,priorMedian>0?priorMedian*2.5:50);
  if(dt>=50)API.longFrameCount++;if(rollingFrames.length>=20&&dt>hitchThreshold)API.hitchCount++;
  pushBounded(rollingFrames,dt,600);render(now);requestAnimationFrame(tick);
}
function resetFrameClock(){last=perfNow();windowStart=last;frames=0;totalMs=0;samples.length=0;}

window.addEventListener?.('keydown',captureInput,true);
window.addEventListener?.('pointerdown',captureInput,true);
if(typeof draw==='function'){
  const baseDraw=draw;draw=function(){const result=baseDraw.apply(this,arguments);flushVisual(perfNow());return result;};API.drawWrapped=true;
}
requestAnimationFrame(tick);
document.addEventListener('visibilitychange',resetFrameClock,true);
document.addEventListener('keydown',event=>{if(event.code!=='F3')return;event.preventDefault();API.visible=!API.visible;overlay.style.display=API.visible?'':'none';},true);

Object.assign(API,{overlay,percentile95,percentile,snapshot,flushVisual});
})();
