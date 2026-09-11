(()=>{
'use strict';

const AudioCtor=window.AudioContext||window.webkitAudioContext;
const MASTER_GAIN=.72;
const BUS_DEFAULTS=Object.freeze({master:MASTER_GAIN,sfx:1,ambience:1,ui:1,swing:1,impact:1,hurt:1,crawler:1,campfire:1,wind:1});
const BUS_GRAPH=Object.freeze({master:['sfx','ambience'],sfx:['ui','swing','impact','hurt','crawler'],ambience:['campfire','wind']});
const STATE={version:1,mixerVersion:1,supported:!!AudioCtor,unlocked:false,contextState:'unavailable',nextCrawlerAt:0,ambienceActive:false,gains:{...BUS_DEFAULTS}};
window.ABYSSAL_AUDIO_V1=STATE;

let ctx=null,master=null,sfxBus=null,ambienceBus=null;
let uiBus=null,swingBus=null,impactBus=null,hurtBus=null,crawlerBus=null,campfireBus=null,windBus=null;
let fireGain=null,windGain=null,fireNoise=null,windNoise=null,ambienceEnabled=true;
let lastUiAt=0,lastImpactAt=0,lastHurtAt=0;
const busNodes={master:null,sfx:null,ambience:null,ui:null,swing:null,impact:null,hurt:null,crawler:null,campfire:null,wind:null};
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,Number(value)||0));
const nowMs=()=>typeof performance!=='undefined'?performance.now():Date.now();
const isHidden=()=>!!document.hidden;

function safeStarted(){try{return !!started;}catch{return false;}}
function safeMe(){try{return me||null;}catch{return null;}}
function safeCamp(){try{return CAMP||null;}catch{return null;}}
function safeMobs(){try{return Array.isArray(mobs)?mobs:[];}catch{return [];}}
function safeInCamp(){try{return typeof inCamp==='function'&&!!inCamp();}catch{return false;}}
function syncContextState(){STATE.contextState=ctx?.state||'unavailable';return STATE.contextState;}
function disconnectNode(node){try{node?.disconnect?.();}catch{}}
function applyBusGain(name){
  const node=busNodes[name];if(!node)return;
  const value=name==='master'&&isHidden()?0:STATE.gains[name];
  node.gain.value=value;
}
function setGain(name,value){
  if(!Object.prototype.hasOwnProperty.call(STATE.gains,name))return false;
  STATE.gains[name]=clamp(value);
  applyBusGain(name);
  return STATE.gains[name];
}
function getGain(name){return Object.prototype.hasOwnProperty.call(STATE.gains,name)?STATE.gains[name]:null;}
function getMixerState(){
  return{version:STATE.mixerVersion,gains:{...STATE.gains},graph:{master:[...BUS_GRAPH.master],sfx:[...BUS_GRAPH.sfx],ambience:[...BUS_GRAPH.ambience]},ambienceActive:STATE.ambienceActive,contextState:syncContextState()};
}

function makeNoiseBuffer(seconds=2){
  if(!ctx)return null;
  const length=Math.max(1,Math.floor(ctx.sampleRate*seconds));
  const buffer=ctx.createBuffer(1,length,ctx.sampleRate);
  const data=buffer.getChannelData(0);
  for(let i=0;i<length;i++)data[i]=Math.random()*2-1;
  return buffer;
}
function connectNoiseLoop({type='lowpass',frequency=600,q=.4,gain=.01,bus='ambience'}={}){
  const route=busNodes[bus]||ambienceBus||master;
  if(!ctx||!route)return null;
  const source=ctx.createBufferSource();
  const filter=ctx.createBiquadFilter();
  const level=ctx.createGain();
  source.buffer=makeNoiseBuffer(2.4);source.loop=true;
  filter.type=type;filter.frequency.value=frequency;filter.Q.value=q;
  level.gain.value=gain;
  source.connect(filter);filter.connect(level);level.connect(route);source.start();
  return{source,filter,level};
}
function stopNoiseLoop(loop){
  if(!loop)return;
  try{loop.source?.stop?.();}catch{}
  disconnectNode(loop.source);disconnectNode(loop.filter);disconnectNode(loop.level);
}
function syncAmbienceState(){STATE.ambienceActive=!!(fireNoise&&windNoise);return STATE.ambienceActive;}
function startAmbience(){
  ambienceEnabled=true;
  if(!ctx||!master)return false;
  if(fireNoise&&windNoise)return syncAmbienceState();
  if(fireNoise)stopNoiseLoop(fireNoise);
  if(windNoise)stopNoiseLoop(windNoise);
  const fire=connectNoiseLoop({type:'bandpass',frequency:980,q:.72,gain:0,bus:'campfire'});
  const wind=connectNoiseLoop({type:'lowpass',frequency:520,q:.2,gain:0,bus:'wind'});
  fireGain=fire?.level||null;windGain=wind?.level||null;fireNoise=fire;windNoise=wind;
  return syncAmbienceState();
}
function stopAmbience(){
  ambienceEnabled=false;
  if(fireGain)fireGain.gain.value=0;
  if(windGain)windGain.gain.value=0;
  stopNoiseLoop(fireNoise);stopNoiseLoop(windNoise);
  fireGain=null;windGain=null;fireNoise=null;windNoise=null;
  return !syncAmbienceState();
}
function restartAmbience(){stopAmbience();ambienceEnabled=true;return startAmbience();}
function buildGraph(){
  if(!ctx||master)return;
  master=ctx.createGain();sfxBus=ctx.createGain();ambienceBus=ctx.createGain();
  uiBus=ctx.createGain();swingBus=ctx.createGain();impactBus=ctx.createGain();hurtBus=ctx.createGain();crawlerBus=ctx.createGain();campfireBus=ctx.createGain();windBus=ctx.createGain();
  Object.assign(busNodes,{master,sfx:sfxBus,ambience:ambienceBus,ui:uiBus,swing:swingBus,impact:impactBus,hurt:hurtBus,crawler:crawlerBus,campfire:campfireBus,wind:windBus});
  uiBus.connect(sfxBus);swingBus.connect(sfxBus);impactBus.connect(sfxBus);hurtBus.connect(sfxBus);crawlerBus.connect(sfxBus);sfxBus.connect(master);
  campfireBus.connect(ambienceBus);windBus.connect(ambienceBus);ambienceBus.connect(master);master.connect(ctx.destination);
  for(const name of Object.keys(busNodes))applyBusGain(name);
  startAmbience();
}
function createContext(){
  if(!AudioCtor||ctx||isHidden())return ctx;
  try{ctx=new AudioCtor({latencyHint:'interactive'});buildGraph();syncContextState();}
  catch(error){console.warn('[Abyssal audio] Web Audio unavailable',error);return null;}
  return ctx;
}
function resumeContext(){
  if(!ctx||isHidden())return Promise.resolve(false);
  syncContextState();
  if(ctx.state==='running')return Promise.resolve(true);
  if(ctx.state!=='suspended'||typeof ctx.resume!=='function')return Promise.resolve(false);
  try{
    const resumed=ctx.resume();syncContextState();
    return Promise.resolve(resumed).then(()=>{syncContextState();return ctx.state==='running';}).catch(()=>{syncContextState();return false;});
  }catch{syncContextState();return Promise.resolve(false);}
}
function unlock(event){
  if(!event?.isTrusted||isHidden())return Promise.resolve(false);
  if(!createContext())return Promise.resolve(false);
  STATE.unlocked=true;
  applyBusGain('master');
  return resumeContext();
}
function ensureContext(){
  if(!AudioCtor||!ctx||!STATE.unlocked||isHidden())return null;
  syncContextState();
  return ctx.state==='running'?ctx:null;
}
function silenceBackground(){
  if(fireGain)fireGain.gain.value=0;
  if(windGain)windGain.gain.value=0;
  if(master)master.gain.value=0;
}
function setTarget(gain,value,seconds=.08){
  if(!ctx||!gain)return;
  const v=Math.max(0,Number(value)||0),t=ctx.currentTime;
  try{gain.gain.cancelScheduledValues(t);gain.gain.setTargetAtTime(v,t,seconds);}catch{gain.gain.value=v;}
}
function panNode(value=0){
  if(!ctx||typeof ctx.createStereoPanner!=='function')return null;
  const p=ctx.createStereoPanner();p.pan.value=clamp(value,-1,1);return p;
}
function onTransientEnded(source,nodes){
  let cleaned=false;
  source.onended=()=>{
    if(cleaned)return;cleaned=true;
    for(const node of nodes)disconnectNode(node);
  };
}
function tone({frequency=440,endFrequency=null,duration=.06,gain=.04,type='sine',pan=0,bus='sfx'}={}){
  const route=busNodes[bus]||sfxBus||master;
  if(!ensureContext()||!route)return false;
  const osc=ctx.createOscillator(),level=ctx.createGain(),panner=panNode(pan),t=ctx.currentTime;
  osc.type=type;osc.frequency.setValueAtTime(Math.max(20,frequency),t);
  if(endFrequency!=null)osc.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency),t+duration);
  level.gain.setValueAtTime(.0001,t);level.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.006);level.gain.exponentialRampToValueAtTime(.0001,t+duration);
  if(panner){osc.connect(level);level.connect(panner);panner.connect(route);onTransientEnded(osc,[osc,level,panner]);}
  else{osc.connect(level);level.connect(route);onTransientEnded(osc,[osc,level]);}
  osc.start(t);osc.stop(t+duration+.02);return true;
}
function noiseBurst({duration=.05,gain=.04,frequency=1400,type='bandpass',pan=0,bus='sfx'}={}){
  const route=busNodes[bus]||sfxBus||master;
  if(!ensureContext()||!route)return false;
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),level=ctx.createGain(),panner=panNode(pan),t=ctx.currentTime;
  source.buffer=makeNoiseBuffer(Math.max(.03,duration));filter.type=type;filter.frequency.value=frequency;filter.Q.value=.7;
  level.gain.setValueAtTime(Math.max(.0002,gain),t);level.gain.exponentialRampToValueAtTime(.0001,t+duration);
  source.connect(filter);filter.connect(level);
  if(panner){level.connect(panner);panner.connect(route);onTransientEnded(source,[source,filter,level,panner]);}
  else{level.connect(route);onTransientEnded(source,[source,filter,level]);}
  source.start(t);source.stop(t+duration+.02);return true;
}
function playUiClick(){
  const now=nowMs();if(now-lastUiAt<45)return false;lastUiAt=now;
  return tone({frequency:560,endFrequency:430,duration:.035,gain:.018,type:'square',bus:'ui'});
}
function playSwing(detail={}){
  const knife=detail?.knife!==false;
  noiseBurst({duration:knife ? .085 : .065,gain:knife ? .055 : .035,frequency:knife?1850:900,type:'bandpass',bus:'swing'});
  tone({frequency:knife?170:120,endFrequency:knife?92:75,duration:knife ? .09 : .07,gain:knife ? .018 : .013,type:'triangle',bus:'swing'});
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
  noiseBurst({duration:.055,gain:.065*gainScale,frequency:720,type:'bandpass',pan,bus:'impact'});
  tone({frequency:115,endFrequency:62,duration:.07,gain:.032*gainScale,type:'triangle',pan,bus:'impact'});
  return true;
}
function playHurt(){
  const now=nowMs();if(now-lastHurtAt<90)return;lastHurtAt=now;
  noiseBurst({duration:.12,gain:.07,frequency:360,type:'lowpass',bus:'hurt'});
  tone({frequency:105,endFrequency:48,duration:.14,gain:.038,type:'sawtooth',bus:'hurt'});
}
function playCrawler({pan=0,distance=220}={}){
  const proximity=1-clamp(distance/320);
  tone({frequency:96,endFrequency:55,duration:.24,gain:.018+.028*proximity,type:'sawtooth',pan,bus:'crawler'});
  noiseBurst({duration:.18,gain:.014+.025*proximity,frequency:520,type:'bandpass',pan,bus:'crawler'});
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
  if(!ambienceEnabled||isHidden()||!ensureContext()||!master)return;
  if(!fireNoise||!windNoise)startAmbience();
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
  if(fire>.008&&Math.random()<.22)noiseBurst({duration:.025+.03*Math.random(),gain:.014+.016*Math.random(),frequency:1450+900*Math.random(),type:'highpass',bus:'campfire'});
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

function eligibleUiButton(event){
  const button=event?.target?.closest?.('button,[role="button"]');
  return button&&!button.disabled&&!button.matches?.('.attack,.dash,.use')?button:null;
}
function onPointerDown(event){
  const button=eligibleUiButton(event);
  unlock(event).then(ready=>{if(ready&&button&&!isHidden())playUiClick();});
}
document.addEventListener('pointerdown',onPointerDown,true);
document.addEventListener('click',event=>{
  if(event.detail!==0||!STATE.unlocked)return;
  if(eligibleUiButton(event))playUiClick();
},true);
document.addEventListener('keydown',event=>{unlock(event);},true);
window.addEventListener('abyssal:player-swing',event=>playSwing(event.detail));
window.addEventListener('abyssal:combat-hit',event=>playImpact(event.detail));
window.addEventListener('abyssal:player-hurt',playHurt);
document.addEventListener('visibilitychange',()=>{
  if(!ctx)return;
  if(isHidden()){
    silenceBackground();syncContextState();
    try{const suspended=ctx.suspend?.();Promise.resolve(suspended).then(syncContextState).catch(syncContextState);}catch{syncContextState();}
    return;
  }
  applyBusGain('master');
  if(STATE.unlocked)resumeContext();
});
setInterval(updateAmbience,250);

Object.assign(STATE,{
  unlock,playUiClick,playSwing,playImpact,playHurt,playCrawler,updateAmbience,
  setGain,getGain,getMixerState,
  setMasterGain:value=>setGain('master',value),
  setSfxGain:value=>setGain('sfx',value),
  setAmbienceGain:value=>setGain('ambience',value),
  startAmbience,stopAmbience,restartAmbience
});
})();
