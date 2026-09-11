import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const bootSource=read('survival-v21.html');
const legacySource=read('modules/main-loop/legacy-scheduler.js');
const motionSource=read('modules/main-loop/smooth-motion-v18.js');
const joystickSource=read('modules/input/joystick.js');
const combatSource=read('modules/combat/player-combat.js');
const perfSource=read('modules/core/dev-performance-v1.js');
const audioSource=read('modules/audio/playable-feel-audio-v1.js');

// Inventory every script loaded by V21 so later Macro Terrain A/B/C runs use the same scheduler baseline.
const listMatch=bootSource.match(/const files=\[([\s\S]*?)\];for\(const name of files\)/);
assert.ok(listMatch,'V21 module list must be discoverable');
const runtimeFiles=[...listMatch[1].matchAll(/'([^']+)'/g)].map(match=>match[1]);
assert.ok(runtimeFiles.length>30,'expected the complete categorized V21 runtime module list');
const count=(source,re)=>[...source.matchAll(re)].length;
const inventory=[{path:'survival-v21.html:inline',source:bootSource},...runtimeFiles.map(path=>({path,source:read(path)}))].map(({path,source})=>({
  path,
  intervals:count(source,/\bsetInterval\s*\(/g),
  timeouts:count(source,/\bsetTimeout\s*\(/g),
  raf:count(source,/\brequestAnimationFrame\s*\(/g),
  listeners:count(source,/\baddEventListener\s*\(/g),
  resizeObservers:count(source,/\bnew\s+ResizeObserver\s*\(/g)
}));
const schedulerTotals=inventory.reduce((sum,row)=>({
  intervals:sum.intervals+row.intervals,timeouts:sum.timeouts+row.timeouts,raf:sum.raf+row.raf,
  listeners:sum.listeners+row.listeners,resizeObservers:sum.resizeObservers+row.resizeObservers
}),{intervals:0,timeouts:0,raf:0,listeners:0,resizeObservers:0});
const intervalFiles=inventory.filter(row=>row.intervals).map(({path,intervals})=>({path,intervals}));
const rafFiles=inventory.filter(row=>row.raf).map(({path,raf})=>({path,raf}));

// Legacy 33ms scheduler starts the game, then self-cancels once V18 owns simulation; reload is idempotent.
{
  let intervalFn=null,intervalStarts=0,clears=0,rafStarts=0,updates=0,uiUpdates=0,now=0;
  const sandbox={
    window:null,performance:{now:()=>now},lastTick:0,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
    setInterval(fn){intervalStarts++;intervalFn=fn;return 91;},clearInterval(){clears++;},
    requestAnimationFrame(){rafStarts++;return 1;},update(){updates++;},draw(){},updateUI(){uiUpdates++;}
  };
  sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(legacySource,sandbox,{filename:'legacy-scheduler.js'});
  assert.equal(intervalStarts,1);assert.equal(rafStarts,1);assert.equal(uiUpdates,1);
  now=33;intervalFn();assert.equal(updates,1,'legacy scheduler must work before V18 owns the clock');
  sandbox.ABYSSAL_MOTION_V18={active:true};now=66;intervalFn();
  assert.equal(clears,1,'legacy interval must clear itself when V18 becomes active');
  assert.equal(sandbox.ABYSSAL_LEGACY_SCHEDULER.intervalId,null);
  assert.equal(sandbox.ABYSSAL_LEGACY_SCHEDULER.intervalCleared,true);
  vm.runInContext(legacySource,sandbox,{filename:'legacy-scheduler-reload.js'});
  assert.equal(intervalStarts,1,'scheduler reload must not create a second interval');
  assert.equal(rafStarts,1,'scheduler reload must not create a second game RAF root');
}

// Multi-touch joystick ownership: secondary fingers cannot steal or cancel the active movement pointer.
{
  const handlers=new Map();let captures=0,releases=0;
  const joystick={
    getBoundingClientRect(){return{left:0,top:0,width:100,height:100};},
    addEventListener(type,fn){assert.equal(handlers.has(type),false,`duplicate joystick listener: ${type}`);handlers.set(type,fn);},
    setPointerCapture(){captures++;},hasPointerCapture(){return true;},releasePointerCapture(){releases++;}
  };
  const sandbox={window:null,joystick,joystickState:{x:0,y:0},stick:{style:{transform:''}},Math};sandbox.window=sandbox;
  vm.createContext(sandbox);vm.runInContext(joystickSource,sandbox,{filename:'joystick.js'});
  handlers.get('pointerdown')({pointerId:1,clientX:80,clientY:50});
  const ownedX=sandbox.joystickState.x;assert.ok(ownedX>.5);assert.equal(sandbox.ABYSSAL_JOYSTICK_V1.pointerId,1);
  handlers.get('pointerdown')({pointerId:2,clientX:20,clientY:50});
  assert.equal(sandbox.ABYSSAL_JOYSTICK_V1.pointerId,1,'second finger must not steal joystick ownership');
  assert.equal(sandbox.joystickState.x,ownedX);
  handlers.get('pointerup')({pointerId:2});assert.equal(sandbox.ABYSSAL_JOYSTICK_V1.active,true);assert.equal(sandbox.joystickState.x,ownedX);
  handlers.get('pointerup')({pointerId:1});assert.equal(sandbox.ABYSSAL_JOYSTICK_V1.active,false);assert.equal(sandbox.joystickState.x,0);assert.equal(releases,1);
  handlers.get('pointerdown')({pointerId:3,clientX:65,clientY:65});sandbox.stopJoy();assert.equal(sandbox.joystickState.x,0);assert.equal(sandbox.joystickState.y,0);
  assert.equal(captures,2);
  vm.runInContext(joystickSource,sandbox,{filename:'joystick-reload.js'});assert.equal(handlers.size,4,'joystick reload must stay listener-idempotent');
}

// Mobile attack listener must dynamically resolve the current wrapped attack(), matching PC semantics/audio.
{
  const attackHandlers=[],dashHandlers=[];
  const sandbox={
    window:null,wrapperCalls:0,
    attackBtn:{addEventListener(type,fn){if(type==='pointerdown')attackHandlers.push(fn);}},
    dashBtn:{addEventListener(type,fn){if(type==='pointerdown')dashHandlers.push(fn);}}
  };
  sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(combatSource,sandbox,{filename:'player-combat.js'});
  assert.equal(attackHandlers.length,1);assert.equal(dashHandlers.length,1);
  vm.runInContext('attack=function(){globalThis.wrapperCalls++}',sandbox);
  attackHandlers[0]();assert.equal(sandbox.wrapperCalls,1,'stored mobile handler must call the latest attack wrapper');
  vm.runInContext(combatSource,sandbox,{filename:'player-combat-reload.js'});
  assert.equal(attackHandlers.length,1,'combat module reload must not duplicate mobile attack listener');
  assert.equal(dashHandlers.length,1,'combat module reload must not duplicate mobile dash listener');
}
for(const invariant of ["dashCd=1.35","inventory.knife?.32:.48","attackFlash=.15","range:inventory.knife?80:62","damage:inventory.knife?22:11"]){
  assert.ok(combatSource.includes(invariant),`combat feel numeric invariant changed: ${invariant}`);
}

// V18 is display-rate driven: one simulation update per game RAF, with a 50ms safety clamp.
assert.ok(motionSource.includes('baseUpdate(dt);'),'V18 must advance gameplay exactly from the render-owned clock');
assert.ok(motionSource.includes('const dt=clamp((now-lastMotionFrame)/1000,0,.05);'),'V18 50ms dt safety clamp changed unexpectedly');
const displayBaseline=Object.fromEntries([30,60,120].map(hz=>{
  const frameMs=1000/hz;
  return[hz,{frameMs,maxInputToNextFrameMs:frameMs,uniformPhaseMeanMs:frameMs/2,simulationUpdatesPerSecond:hz}];
}));

function makePerfHarness(){
  let now=0,raf=null,rafRequests=0,created=0,appended=0;
  const deferred=[],windowHandlers=new Map(),documentHandlers=new Map();
  const overlay={id:'',textContent:'',style:{},setAttribute(){}};
  const sandbox={
    URLSearchParams,location:{search:'?devperf=1'},performance:{now:()=>now},queueMicrotask(fn){deferred.push(fn);},
    attackCd:0,attackFlash:0,dashCd:0,dashQueued:false,
    ABYSSAL_PLATFORM_V19:{desktop:true,panelOpen:false},ABYSSAL_SHELL_V1:{blocksGameInput(){return false;}},
    ABYSSAL_INTERACTION_V12:{getTarget(){return{type:'fire'};}},
    draw(){},
    requestAnimationFrame(fn){rafRequests++;raf=fn;return rafRequests;},
    addEventListener(type,fn){windowHandlers.set(type,fn);},
    document:{hidden:false,createElement(){created++;return overlay;},body:{appendChild(){appended++;}},addEventListener(type,fn){documentHandlers.set(type,fn);}},
    window:null,globalThis:null,console
  };
  sandbox.window=sandbox;sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(perfSource,sandbox,{filename:'dev-performance-v1.js'});
  return{
    sandbox,overlay,windowHandlers,documentHandlers,deferred,
    setNow(value){now=value;},get now(){return now;},get raf(){return raf;},get rafRequests(){return rafRequests;},created,appended,
    flushDeferred(){while(deferred.length)deferred.shift()();},stepRaf(value){now=value;const fn=raf;assert.equal(typeof fn,'function');fn(value);}
  };
}

// Dev-only latency instrumentation measures event dispatch -> gameplay acceptance -> next presentation frame.
{
  const h=makePerfHarness();assert.equal(h.created,1);assert.equal(h.appended,1);assert.equal(h.sandbox.ABYSSAL_PERF_V1.drawWrapped,true);
  const key=h.windowHandlers.get('keydown'),pointer=h.windowHandlers.get('pointerdown');
  h.setNow(10);key({type:'keydown',code:'Space',repeat:false,isTrusted:true,target:{}});h.sandbox.attackCd=.32;h.sandbox.attackFlash=.15;h.setNow(10.4);h.flushDeferred();h.setNow(16.7);h.sandbox.draw();
  h.sandbox.attackCd=0;h.sandbox.attackFlash=0;
  h.setNow(20);pointer({type:'pointerdown',isTrusted:true,target:{closest(){return{id:'attackBtn'};}}});h.sandbox.attackCd=.32;h.sandbox.attackFlash=.15;h.setNow(20.3);h.flushDeferred();h.setNow(33.4);h.sandbox.draw();
  h.sandbox.dashCd=0;h.sandbox.dashQueued=false;
  h.setNow(40);key({type:'keydown',code:'ShiftLeft',repeat:false,isTrusted:true,target:{}});h.sandbox.dashCd=1.35;h.sandbox.dashQueued=true;h.setNow(40.2);h.flushDeferred();h.setNow(50);h.sandbox.draw();
  h.setNow(55);key({type:'keydown',code:'KeyE',repeat:false,isTrusted:true,target:{}});h.setNow(55.1);h.flushDeferred();h.setNow(66.7);h.sandbox.draw();
  const snap=h.sandbox.ABYSSAL_PERF_V1.snapshot();
  assert.equal(snap.input['pc:attack'].accepted,1);assert.ok(snap.input['pc:attack'].lastVisualMs>0);
  assert.equal(snap.input['mobile:attack'].accepted,1);assert.ok(snap.input['mobile:attack'].lastVisualMs>0);
  assert.equal(snap.input['pc:dash'].accepted,1);assert.equal(snap.input['pc:interact'].accepted,1);
}

// Ten-minute synthetic 60Hz dev soak: RAF scheduling remains linear and frame metrics do not drift downward.
let soakSnapshot=null;
{
  const h=makePerfHarness(),frameMs=1000/60,frames=60*60*10;
  for(let i=1;i<=frames;i++)h.stepRaf(i*frameMs);
  soakSnapshot=h.sandbox.ABYSSAL_PERF_V1.snapshot();
  assert.equal(soakSnapshot.frame.frameCount,frames);
  assert.equal(h.rafRequests,frames+1,'dev sampler must schedule exactly one successor RAF per tick');
  assert.equal(soakSnapshot.frame.longFrameCount,0);assert.equal(soakSnapshot.frame.hitchCount,0);
  assert.ok(Math.abs(soakSnapshot.frame.refreshHz-60)<.1,`expected synthetic 60Hz estimate, got ${soakSnapshot.frame.refreshHz}`);
  assert.ok(Math.abs(soakSnapshot.frame.fpsDriftPct)<.5,`stable synthetic cadence drifted ${soakSnapshot.frame.fpsDriftPct}%`);
  assert.equal(h.windowHandlers.size,2,'dev soak must not multiply window listeners');
  assert.equal(h.documentHandlers.size,2,'dev soak must not multiply document listeners');
}

// Audio soak: one lazy AudioContext; every transient swing source/oscillator is stopped and not retained by the module.
let audioSoak=null;
{
  let constructors=0,sources=0,sourceStops=0,oscillators=0,oscillatorStops=0;
  const param=value=>({value,cancelScheduledValues(){},setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;}});
  class FakeAudioContext{
    constructor(){constructors++;this.sampleRate=8000;this.currentTime=0;this.state='suspended';this.destination={};}
    createGain(){return{gain:param(0),connect(){}};}createBuffer(_channels,length){const data=new Float32Array(length);return{getChannelData(){return data;}};}
    createBufferSource(){sources++;return{buffer:null,loop:false,connect(){},start(){},stop(){sourceStops++;}};}
    createBiquadFilter(){return{type:'lowpass',frequency:param(0),Q:param(0),connect(){}};}createStereoPanner(){return{pan:param(0),connect(){}};}
    createOscillator(){oscillators++;return{type:'sine',frequency:param(0),connect(){},start(){},stop(){oscillatorStops++;}};}
    resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}
  }
  const sandbox={
    console,AudioContext:FakeAudioContext,performance:{now:()=>1000},Math,started:true,me:{x:0,y:0},CAMP:{x:0,y:0,r:100},mobs:[],inCamp(){return true;},
    setInterval(){return 1;},document:{hidden:false,addEventListener(){}},addEventListener(){},window:null,globalThis:null
  };
  sandbox.window=sandbox;sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(audioSource,sandbox,{filename:'playable-feel-audio-v1.js'});
  await sandbox.ABYSSAL_AUDIO_V1.unlock({isTrusted:true});
  for(let i=0;i<1000;i++)sandbox.ABYSSAL_AUDIO_V1.playSwing({knife:true});
  assert.equal(constructors,1,'soak must not construct additional AudioContexts');
  assert.equal(oscillators,1000);assert.equal(oscillatorStops,1000,'every transient oscillator must be stopped');
  assert.equal(sources,1002,'two persistent ambience loops plus one transient noise source per swing expected');
  assert.equal(sourceStops,1000,'every transient noise source must be stopped; ambience loops remain persistent');
  assert.ok(audioSource.includes('osc.stop(')&&audioSource.includes('source.stop('));
  audioSoak={constructors,transientOscillators:oscillators,oscillatorStops,transientNoiseSources:sources-2,noiseStops:sourceStops,persistentAmbienceLoops:2};
}

console.log(JSON.stringify({
  ok:true,
  schedulerTotals,intervalFiles,rafFiles,
  displayBaseline,
  fixes:{legacyInterval:'self-clears+idempotent',joystick:'pointer-owner-isolated',mobileAttack:'dynamic-wrapper-trampoline'},
  devSoak:{minutes:10,refreshHz:Number(soakSnapshot.frame.refreshHz.toFixed(2)),fpsDriftPct:Number(soakSnapshot.frame.fpsDriftPct.toFixed(3)),longFrames:soakSnapshot.frame.longFrameCount,hitches:soakSnapshot.frame.hitchCount},
  audioSoak
}));
