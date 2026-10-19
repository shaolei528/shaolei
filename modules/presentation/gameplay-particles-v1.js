(()=>{
'use strict';

if(globalThis.ABYSSAL_GAMEPLAY_PARTICLES_V1?.version===1)return;

const particles=[];
const FALLBACK_CONFIG={
  version:1,maxParticles:192,
  colors:{wood:['#f3d18b','#c58e4f','#8b6240'],stone:['#e4e2c7','#a7b1a0','#71827a'],food:['#f5dda0','#c99161','#88a777'],shard:['#d4c5f2','#9b8bc4','#76c8bb'],hit:['#fff4cb','#ffd17a','#e68a4b'],death:['#fff0b9','#dfa75e','#748f69'],hurt:['#ef8b77','#d65e58','#f3d0a5'],craft:['#fff0b5','#e3b666','#91aa7a'],rest:['#f7dfa1','#cfaa70','#9eb182'],swing:['#f5e6b3','#d6c78f','#b3c3ad']},
  profiles:{combatHit:{count:7,life:.5,speed:28,gravity:92,launch:20},mobDeath:{count:18,life:.72,speed:32,gravity:92,launch:20},playerHurt:{count:8,life:.5,speed:22,gravity:92,launch:20},playerSwing:{count:5,life:.5,speed:18,gravity:92,launch:20},resourceCollected:{count:9,life:.5,speed:22,gravity:92,launch:20},itemCrafted:{count:12,life:.5,speed:22,gravity:92,launch:20},campRested:{count:11,life:.66,speed:22,gravity:-6,launch:20},chestOpened:{count:14,life:.5,speed:22,gravity:92,launch:20}}
};
let config=FALLBACK_CONFIG,configLoaded=false;

const nowMs=()=>typeof performance!=='undefined'?performance.now():Date.now();
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
function reducedMotion(){try{return !!window.ABYSSAL_SHELL_V1?.getSettings?.().reducedMotion;}catch{return false;}}
function position(detail={}){
  const px=Number(detail.x),py=Number(detail.y);
  if(Number.isFinite(px)&&Number.isFinite(py))return{x:px,y:py};
  const player=typeof me!=='undefined'?me:null;
  return{x:Number(player?.x)||0,y:Number(player?.y)||0};
}
function spawn(kind,detail={},countOverride,profileKeyOverride){
  const origin=position(detail),colors=config.colors[kind]||config.colors.craft,now=nowMs();
  const profileKey=profileKeyOverride||{hit:'combatHit',death:'mobDeath',hurt:'playerHurt',swing:'playerSwing',craft:'itemCrafted',rest:'campRested',wood:'resourceCollected',stone:'resourceCollected',food:'resourceCollected',shard:'resourceCollected'}[kind]||'resourceCollected';
  const profile=config.profiles[profileKey]||config.profiles.resourceCollected;
  const count=countOverride??profile.count;
  const motionScale=reducedMotion()?0.42:1;
  for(let i=0;i<count;i++){
    const angle=(Math.PI*2*i/count)+(Math.random()-.5)*.48;
    const speed=profile.speed+Math.random()*36;
    const life=profile.life+Math.random()*.22;
    particles.push({
      x:origin.x,y:origin.y,
      vx:Math.cos(angle)*speed*motionScale,
      vy:Math.sin(angle)*speed*motionScale-profile.launch*motionScale,
      gravity:profile.gravity*motionScale,
      size:Math.random()<.24?3:2,
      color:colors[(Math.random()*colors.length)|0],
      born:now,life:life*motionScale,
      kind
    });
  }
  if(particles.length>config.maxParticles)particles.splice(0,particles.length-config.maxParticles);
}

function on(name,handler){window.addEventListener(name,event=>handler(event?.detail||{}));}
on('abyssal:combat-hit',detail=>spawn(detail.killed?'death':'hit',detail));
on('abyssal:player-hurt',detail=>spawn('hurt',detail));
on('abyssal:player-swing',detail=>spawn('swing',detail,detail.knife?6:4));
on('abyssal:resource-collected',detail=>spawn(detail.kind||'food',detail));
on('abyssal:item-crafted',detail=>spawn('craft',detail));
on('abyssal:camp-rested',detail=>spawn('rest',detail,11));
on('abyssal:chest-opened',detail=>spawn('craft',detail,undefined,'chestOpened'));

function draw(target,project,at=nowMs()){
  if(!target||typeof target.fillRect!=='function')return 0;
  for(let index=particles.length-1;index>=0;index--){
    const particle=particles[index],elapsed=Math.max(0,(at-particle.born)/1000);
    if(elapsed>=particle.life){particles.splice(index,1);continue;}
    const point=typeof project==='function'?project(particle.x,particle.y):{
      x:typeof sx==='function'?sx(particle.x):particle.x,
      y:typeof sy==='function'?sy(particle.y):particle.y
    };
    const x=Math.round(point.x+particle.vx*elapsed);
    const y=Math.round(point.y+particle.vy*elapsed+particle.gravity*elapsed*elapsed*.5);
    const alpha=clamp(1-elapsed/particle.life,0,1);
    target.globalAlpha=alpha;
    target.fillStyle=particle.color;
    target.fillRect(x-particle.size/2,y-particle.size/2,particle.size,particle.size);
    if(particle.kind==='death'&&particle.size===3&&alpha>.36){
      target.globalAlpha=alpha*.45;
      target.fillRect(x-1,y-1,3,3);
    }
  }
  target.globalAlpha=1;
  return particles.length;
}

const scriptUrl=typeof document!=='undefined'?document.currentScript?.src:'';
const configUrl=scriptUrl?new URL('../../data/presentation/gameplay-particles-v1.json',scriptUrl).href:'./data/presentation/gameplay-particles-v1.json';
const ready=typeof fetch==='function'?fetch(configUrl,{cache:'force-cache'}).then(response=>{if(!response.ok)throw new Error('particle config unavailable');return response.json()}).then(value=>{if(value?.version===1&&Number(value.maxParticles)>0&&value.colors&&value.profiles){config=value;configLoaded=true}return configLoaded}).catch(()=>false):Promise.resolve(false);
const api={version:1,draw,ready,get configLoaded(){return configLoaded;},get count(){return particles.length;},clear(){particles.length=0;}};
globalThis.ABYSSAL_GAMEPLAY_PARTICLES_V1=api;
const baseDraw=typeof draw==='function'?draw:null;
if(baseDraw)draw=function(){const result=baseDraw.apply(this,arguments);try{api.draw(ctx)}catch{}return result;};
})();
