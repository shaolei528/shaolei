(()=>{
'use strict';

const AudioCtor=window.AudioContext||window.webkitAudioContext;
const STATE={version:1,supported:!!AudioCtor,unlocked:false,contextState:'unavailable',nextCrawlerAt:0};
window.ABYSSAL_AUDIO_V1=STATE;

let ctx=null,master=null,fireGain=null,windGain=null,fireNoise=null,windNoise=null;
let lastUiAt=0,lastImpactAt=0,lastHurtAt=0;
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,Number(value)||0));
const nowMs=()=>typeof performance!=='undefined'?performance.now():Date.now();

function safeStarted(){try{return !!started;}catch{return false;}}
function safeMe(){try{return me||null;}catch{return null;}}
function safeCamp(){try{return CAMP||null;}catch{return null;}}
function safeMobs(){try{return Array.isArray(mobs)?mobs:[];}catch{return [];}}
function safeInCamp(){try{return typeof inCamp==='function'&&!!inCamp();}catch{return false;}}

function makeNoiseBuffer(seconds=2){
  if(!ctx)return null;
  const length=Math.max(1,Math.floor(ctx.sampleRate*seconds));
  const buffer=ctx.createBuffer(1,length,ctx.sampleRate);
  const data=buffer.getChannelData(0);
  for(let i=0;i<length;i++)data[i]=Math.random()*2-1;
  return buffer;
}
function connectNoiseLoop({type='lowpass',frequency=600,q=.4,gain=.01}={}){
  if(!ctx||!master)return null;
  const source=ctx.createBufferSource();
  const filter=ctx.createBiquadFilter();
  const level=ctx.createGain();
  source.buffer=makeNoiseBuffer(2.4);source.loop=true;
  filter.type=type;filter.frequency.value=frequency;filter.Q.value=q;
  level.gain.value=gain;
  source.connect(filter);filter.connect(level);level.connect(master);source.start();
  return{source,filter,level};
}
function buildGraph(){
  if(!ctx||master)return;
  master=ctx.createGain();master.gain.value=.72;master.connect(ctx.destination);
  const fire=connectNoiseLoop({type:'bandpass',frequency:980,q:.72,gain:0});
  const wind=connectNoiseLoop({type:'lowpass',frequency:520,q:.2,gain:0});
  fireGain=fire?.level||null;windGain=wind?.level||null;fireNoise=fire;windNoise=wind;
}
function ensureContext(){
  if(!AudioCtor)return null;
  if(!ctx){
    try{ctx=new AudioCtor({latencyHint:'interactive'});buildGraph();}
    catch(error){console.warn('[Abyssal audio] Web Audio unavailable',error);return null;}
  }
  STATE.contextState=ctx.state||'unknown';
  if(ctx.state==='suspended')ctx.resume?.().catch(()=>{});
  STATE.unlocked=true;
  return ctx;
}
function unlock(){ensureContext();}
function setTarget(gain,value,seconds=.08){
  if(!ctx||!gain)return;
  const v=Math.max(0,Number(value)||0),t=ctx.currentTime;
  try{gain.gain.cancelScheduledValues(t);gain.gain.setTargetAtTime(v,t,seconds);}catch{gain.gain.value=v;}
}
function panNode(value=0){
  if(!ctx||typeof ctx.createStereoPanner!=='function')return null;
  const p=ctx.createStereoPanner();p.pan.value=clamp(value,-1,1);return p;
}
function tone({frequency=440,endFrequency=null,duration=.06,gain=.04,type='sine',pan=0}={}){
  if(!ensureContext()||!master)return false;
  const osc=ctx.createOscillator(),level=ctx.createGain(),panner=panNode(pan),t=ctx.currentTime;
  osc.type=type;osc.frequency.setValueAtTime(Math.max(20,frequency),t);
  if(endFrequency!=null)osc.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency),t+duration);
  level.gain.setValueAtTime(.0001,t);level.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.006);level.gain.exponentialRampToValueAtTime(.0001,t+duration);
  if(panner){osc.connect(level);level.connect(panner);panner.connect(master);}else{osc.connect(level);level.connect(master);}
  osc.start(t);osc.stop(t+duration+.02);return true;
}
function noiseBurst({duration=.05,gain=.04,frequency=1400,type='bandpass',pan=0}={}){
  if(!ensureContext()||!master)return false;
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),level=ctx.createGain(),panner=panNode(pan),t=ctx.currentTime;
  source.buffer=makeNoiseBuffer(Math.max(.03,duration));filter.type=type;filter.frequency.value=frequency;filter.Q.value=.7;
  level.gain.setValueAtTime(Math.max(.0002,gain),t);level.gain.exponentialRampToValueAtTime(.0001,t+duration);
  source.connect(filter);filter.connect(level);if(panner){level.connect(panner);panner.connect(master);}else level.connect(master);
  source.start(t);source.stop(t+duration+.02);return true;
}
function playUiClick(){
  const now=nowMs();if(now-lastUiAt<45)return false;lastUiAt=now;
  tone({frequency:560,endFrequency:430,duration:.035,gain:.018,type:'square'});return true;
}
function playSwing(detail={}){
  const knife=detail?.knife!==false;
  noiseBurst({duration:knife ? .085 : .065,gain:knife ? .055 : .035,frequency:knife?1850:900,type:'bandpass'});
  tone({frequency:knife?170:120,endFrequency:knife?92:75,duration:knife ? .09 : .07,gain:knife ? .018 : .013,type:'triangle'});
}
function playImpact(detail={}){
  const now=nowMs();if(now-lastImpactAt<55)return false;
  const player=safeMe(),local=detail?.local!==false;
  let pan=Number(detail?.pan)||0,gainScale=1;
  if(!local&&player&&Number.isFinite(Number(detail?.x))&&Number.isFinite(Number(detail?.y))){
    const dx=Number(detail.x)-(Number(player.x)||0),dy=Number(detail.y)-(Number(player.y)||0),distance=Math.hypot(dx,dy);
    if(distance>280)return false;
    pan=clamp(dx/240,-1,1);gainScale=.35+.35*(1-clamp(distance/280));
  }
  lastImpactAt=now;
  noiseBurst({duration:.055,gain:.065*gainScale,frequency:720,type:'bandpass',pan});
  tone({frequency:115,endFrequency:62,duration:.07,gain:.032*gainScale,type:'triangle',pan});
  return true;
}
function playHurt(){
  const now=nowMs();if(now-lastHurtAt<90)return;lastHurtAt=now;
  noiseBurst({duration:.12,gain:.07,frequency:360,type:'lowpass'});
  tone({frequency:105,endFrequency:48,duration:.14,gain:.038,type:'sawtooth'});
}
function playCrawler({pan=0,distance=220}={}){
  const proximity=1-clamp(distance/320);
  tone({frequency:96,endFrequency:55,duration:.24,gain:.018+.028*proximity,type:'sawtooth',pan});
  noiseBurst({duration:.18,gain:.014+.025*proximity,frequency:520,type:'bandpass',pan});
}
function nearestCrawler(){
  const player=safeMe();if(!player)return null;
  let best=null,bestDistance=Infinity;
  for(const mob of safeMobs()){
    if(!mob||mob.kind!=='crawler'||Number(mob.hp)<=0)continue;
    const d=Math.hypot((Number(mob.x)||0)-(Number(player.x)||0),(Number(mob.y)||0)-(Number(player.y)||0));
    if(d<bestDistance){bestDistance=d;best=mob;}
  }
  return best&&bestDistance<=320?{mob:best,distance:bestDistance}:null;
}
function updateAmbience(){
  if(!ctx||!master)return;
  STATE.contextState=ctx.state||'unknown';
  if(!safeStarted()){setTarget(fireGain,0,.12);setTarget(windGain,0,.12);return;}
  const player=safeMe(),camp=safeCamp();
  let fire=0,wind=safeInCamp() ? .004 : .027;
  if(player&&camp){
    const dist=Math.hypot((Number(player.x)||0)-(Number(camp.x)||0),(Number(player.y)||0)-(Number(camp.y)||0));
    fire=.032*(1-clamp(dist/430));
    if(dist>Number(camp.r||0)+90)wind=.035;
  }
  setTarget(fireGain,fire,.16);setTarget(windGain,wind,.22);

  const now=nowMs();
  if(fire>.008&&Math.random()<.22)noiseBurst({duration:.025+.03*Math.random(),gain:.014+.016*Math.random(),frequency:1450+900*Math.random(),type:'highpass'});
  if(now>=STATE.nextCrawlerAt){
    const nearest=nearestCrawler();
    if(nearest){
      const player=safeMe();
      const dx=(Number(nearest.mob.x)||0)-(Number(player?.x)||0);
      playCrawler({pan:clamp(dx/260,-1,1),distance:nearest.distance});
      STATE.nextCrawlerAt=now+2600+Math.random()*2800;
    }else STATE.nextCrawlerAt=now+1200;
  }
}

function onPointerDown(event){
  unlock();
  const button=event?.target?.closest?.('button,[role="button"]');
  if(!button||button.disabled||button.matches?.('.attack,.dash,.use'))return;
  playUiClick();
}
document.addEventListener('pointerdown',onPointerDown,true);
document.addEventListener('click',event=>{
  if(event.detail!==0)return;
  const button=event?.target?.closest?.('button,[role="button"]');
  if(button&&!button.disabled&&!button.matches?.('.attack,.dash,.use'))playUiClick();
},true);
document.addEventListener('keydown',unlock,true);
window.addEventListener('abyssal:player-swing',event=>playSwing(event.detail));
window.addEventListener('abyssal:combat-hit',event=>playImpact(event.detail));
window.addEventListener('abyssal:player-hurt',playHurt);
document.addEventListener('visibilitychange',()=>{
  if(!ctx)return;
  if(document.hidden)ctx.suspend?.().catch(()=>{});else if(STATE.unlocked)ctx.resume?.().catch(()=>{});
});
setInterval(updateAmbience,250);

Object.assign(STATE,{unlock,playUiClick,playSwing,playImpact,playHurt,playCrawler,updateAmbience});
})();
