import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const audioSource=fs.readFileSync(new URL('../modules/audio/playable-feel-audio-v1.js',import.meta.url),'utf8');
const feelSource=fs.readFileSync(new URL('../modules/combat/playable-feel-v1.js',import.meta.url),'utf8');

for(const forbidden of ['zoneCh.send','new WebSocket(','RELAY_URL','saveLocal(','STORAGE_KEY','localStorage.']){
  assert.equal(audioSource.includes(forbidden),false,`audio must stay local-only: ${forbidden}`);
  assert.equal(feelSource.includes(forbidden),false,`feel bridge must stay local-only: ${forbidden}`);
}
for(const eventName of ['abyssal:player-swing','abyssal:combat-hit','abyssal:player-hurt']){
  assert.ok(audioSource.includes(eventName),`audio must consume ${eventName}`);
  assert.ok(feelSource.includes(eventName),`feel bridge must emit ${eventName}`);
}
assert.equal(audioSource.includes('fetch('),false,'V1 audio must not depend on an asset/audio fetch pipeline');
assert.ok(audioSource.includes("mob.kind!=='crawler'"),'crawler ambience must target crawler mobs only');
assert.ok(audioSource.includes('safeInCamp()'),'ambience must distinguish SafeCamp from outside wind');

const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function makeAudioSandbox(withAudio=true){
  let now=1000,constructors=0,oscillators=0,sources=0,resumes=0,suspends=0,resumeFails=false;
  const docHandlers=new Map(),winHandlers=new Map();
  const param=value=>({value,cancelScheduledValues(){},setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;}});
  class FakeAudioContext{
    constructor(){constructors++;this.sampleRate=8000;this.currentTime=0;this.state='suspended';this.destination={};}
    createGain(){return{gain:param(0),connect(){}};}
    createBuffer(_channels,length){const data=new Float32Array(length);return{getChannelData(){return data;}};}
    createBufferSource(){sources++;return{buffer:null,loop:false,connect(){},start(){},stop(){}};}
    createBiquadFilter(){return{type:'lowpass',frequency:param(0),Q:param(0),connect(){}};}
    createStereoPanner(){return{pan:param(0),connect(){}};}
    createOscillator(){oscillators++;return{type:'sine',frequency:param(0),connect(){},start(){},stop(){}};}
    resume(){resumes++;if(resumeFails)return Promise.reject(new Error('resume blocked'));this.state='running';return Promise.resolve();}
    suspend(){suspends++;this.state='suspended';return Promise.resolve();}
  }
  const sandbox={
    console,
    performance:{now:()=>now},
    Math,
    started:true,
    me:{x:100,y:100},
    CAMP:{x:100,y:100,r:180},
    mobs:[{id:'c1',kind:'crawler',x:180,y:100,hp:20}],
    inCamp(){return true;},
    setInterval(fn){sandbox.interval=fn;return 1;},
    document:{
      hidden:false,
      addEventListener(type,fn){docHandlers.set(type,fn);}
    },
    addEventListener(type,fn){winHandlers.set(type,fn);},
    window:null,
    globalThis:null
  };
  if(withAudio)sandbox.AudioContext=FakeAudioContext;
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(audioSource,sandbox,{filename:'playable-feel-audio-v1.js'});
  return{
    sandbox,docHandlers,winHandlers,
    get now(){return now;},set now(v){now=v;},
    get resumeFails(){return resumeFails;},set resumeFails(v){resumeFails=!!v;},
    stats:()=>({constructors,oscillators,sources,resumes,suspends})
  };
}

const uiTarget={disabled:false,closest(){return this;},matches(){return false;}};
const syntheticBeforeUnlock=makeAudioSandbox(true);
syntheticBeforeUnlock.docHandlers.get('click')?.({detail:0,target:uiTarget,isTrusted:false});
syntheticBeforeUnlock.winHandlers.get('abyssal:player-swing')?.({detail:{knife:true}});
assert.deepEqual(syntheticBeforeUnlock.stats(),{constructors:0,oscillators:0,sources:0,resumes:0,suspends:0},'synthetic click/background semantics before a real gesture must not create or unlock AudioContext');
assert.equal(syntheticBeforeUnlock.sandbox.ABYSSAL_AUDIO_V1.unlocked,false);

const supported=makeAudioSandbox(true);
assert.equal(supported.stats().constructors,0,'AudioContext must be lazy and wait for a real user gesture');
assert.equal(supported.sandbox.ABYSSAL_AUDIO_V1.supported,true);
assert.equal(supported.sandbox.ABYSSAL_AUDIO_V1.unlocked,false);
supported.docHandlers.get('pointerdown')?.({target:uiTarget,isTrusted:true});
await flush();
assert.equal(supported.stats().constructors,1,'real pointerdown should construct exactly one audio context');
assert.equal(supported.stats().resumes,1,'real pointerdown should make the first resume attempt');
assert.equal(supported.sandbox.ABYSSAL_AUDIO_V1.unlocked,true);
assert.equal(supported.sandbox.ABYSSAL_AUDIO_V1.contextState,'running');
assert.ok(supported.stats().oscillators>=1,'real UI pointerdown may play the ordinary UI click after unlock');

supported.winHandlers.get('abyssal:player-swing')?.({detail:{knife:true}});
supported.now+=100;
supported.winHandlers.get('abyssal:combat-hit')?.({detail:{local:true}});
supported.now+=100;
supported.winHandlers.get('abyssal:player-hurt')?.({detail:{delta:4}});
supported.sandbox.ABYSSAL_AUDIO_V1.updateAmbience();
assert.ok(supported.stats().oscillators>=5,'swing/impact/hurt/crawler should synthesize transient tones after unlock');
assert.ok(supported.stats().sources>=4,'procedural noise should cover effects and ambience without audio assets');

const beforeAttackButton=supported.stats().oscillators;
supported.now+=100;
supported.docHandlers.get('pointerdown')?.({target:{disabled:false,closest(){return this;},matches(){return true;}},isTrusted:true});
await flush();
assert.equal(supported.stats().oscillators,beforeAttackButton,'combat action buttons must not double-play the generic UI click');

const unsupported=makeAudioSandbox(false);
unsupported.docHandlers.get('pointerdown')?.({target:uiTarget,isTrusted:true});
await flush();
assert.equal(unsupported.sandbox.ABYSSAL_AUDIO_V1.supported,false,'no Web Audio must degrade safely');
assert.equal(unsupported.sandbox.ABYSSAL_AUDIO_V1.unlocked,false);
assert.equal(unsupported.stats().constructors,0);
assert.doesNotThrow(()=>unsupported.sandbox.ABYSSAL_AUDIO_V1.playUiClick());

const lifecycle=makeAudioSandbox(true);
lifecycle.docHandlers.get('keydown')?.({key:'a',isTrusted:true});
await flush();
assert.equal(lifecycle.stats().constructors,1);
assert.equal(lifecycle.stats().resumes,1);
assert.equal(lifecycle.sandbox.ABYSSAL_AUDIO_V1.contextState,'running');

lifecycle.sandbox.document.hidden=true;
lifecycle.docHandlers.get('visibilitychange')?.();
await flush();
assert.equal(lifecycle.stats().suspends,1,'hidden transition must suspend an unlocked AudioContext');
assert.equal(lifecycle.sandbox.ABYSSAL_AUDIO_V1.contextState,'suspended');
const hiddenBaseline=lifecycle.stats();
for(let i=0;i<4;i++){
  lifecycle.now+=300;
  lifecycle.sandbox.ABYSSAL_AUDIO_V1.updateAmbience();
  lifecycle.winHandlers.get('abyssal:player-swing')?.({detail:{knife:true}});
  lifecycle.winHandlers.get('abyssal:combat-hit')?.({detail:{local:true}});
  lifecycle.winHandlers.get('abyssal:player-hurt')?.({detail:{delta:4}});
  lifecycle.docHandlers.get('click')?.({detail:0,target:uiTarget,isTrusted:false});
}
await flush();
const hiddenAfter=lifecycle.stats();
assert.equal(hiddenAfter.resumes,hiddenBaseline.resumes,'hidden ambience/semantic playback must never resume AudioContext');
assert.equal(hiddenAfter.oscillators,hiddenBaseline.oscillators,'hidden ambience/semantic playback must not create tones');
assert.equal(hiddenAfter.sources,hiddenBaseline.sources,'hidden ambience/semantic playback must not create noise/transient sources');
assert.equal(lifecycle.sandbox.ABYSSAL_AUDIO_V1.contextState,'suspended','context must remain suspended throughout hidden ticks');

lifecycle.resumeFails=true;
lifecycle.sandbox.document.hidden=false;
lifecycle.docHandlers.get('visibilitychange')?.();
await flush();
const afterBlockedVisible=lifecycle.stats();
assert.equal(afterBlockedVisible.resumes,hiddenBaseline.resumes+1,'visible transition may make one best-effort resume attempt');
assert.equal(lifecycle.sandbox.ABYSSAL_AUDIO_V1.contextState,'suspended','rejected visible resume must leave context suspended');
lifecycle.winHandlers.get('abyssal:player-swing')?.({detail:{knife:true}});
lifecycle.sandbox.ABYSSAL_AUDIO_V1.updateAmbience();
await flush();
assert.equal(lifecycle.stats().resumes,afterBlockedVisible.resumes,'semantic/ambience playback after a rejected resume must not auto-resume');

lifecycle.resumeFails=false;
lifecycle.docHandlers.get('keydown')?.({key:'a',isTrusted:true});
await flush();
assert.equal(lifecycle.stats().resumes,afterBlockedVisible.resumes+1,'next real user gesture may retry resume');
assert.equal(lifecycle.sandbox.ABYSSAL_AUDIO_V1.contextState,'running','real user gesture should recover audio after background resume was rejected');

// Existing hit feedback stays untouched; this bridge only layers semantics + a tiny presentation kick.
let now=2000;
const emitted=[];
class CustomEventMock{constructor(type,init={}){this.type=type;this.detail=init.detail;}}
const hitSandbox={
  console,window:null,globalThis:null,CustomEvent:CustomEventMock,
  performance:{now:()=>now},navigator:{vibrate(){throw new Error('feel bridge must not own haptics');}},
  SESSION_ID:'self',mobs:[{id:'m1',kind:'crawler',x:40,y:50,hp:30}],me:{hp:100},
  inventory:{knife:true},attackCd:0,attackFlash:0,
  attack(){hitSandbox.attackCd=.32;hitSandbox.attackFlash=.15;},
  handleMobAttack(){hitSandbox.mobs[0].hp-=10;},onMobs(){},onMobHit(){hitSandbox.me.hp-=4;},onAttack(){},
  drawMobs(){},drawPlayer(){},drawLighting(){},sx:x=>x,sy:y=>y,
  canvas:{style:{translate:''}},
  dispatchEvent(event){emitted.push(event);return true;},
  ctx:{},
};
hitSandbox.window=hitSandbox;hitSandbox.globalThis=hitSandbox;
vm.createContext(hitSandbox);vm.runInContext(feelSource,hitSandbox,{filename:'playable-feel-v1.js'});
hitSandbox.attack();
assert.equal(emitted.at(-1)?.type,'abyssal:player-swing','successful local attack should emit one swing semantic event');
assert.equal(emitted.at(-1)?.detail?.knife,true,'swing event should preserve knife state');
hitSandbox.handleMobAttack({id:'self'});
assert.equal(hitSandbox.mobs[0].hp,20,'base mob damage logic must still run');
assert.ok(emitted.some(event=>event.type==='abyssal:combat-hit'&&event.detail.local===true),'confirmed local damage should emit a hit event');
hitSandbox.onMobHit({target:'self'});
assert.equal(hitSandbox.me.hp,96,'base incoming damage path must still run');
assert.ok(emitted.some(event=>event.type==='abyssal:player-hurt'&&event.detail.delta===4),'HP loss should emit a hurt event');
hitSandbox.drawLighting(360,600);
assert.ok(hitSandbox.canvas.style.translate,'hurt feedback may add a small presentation-only canvas kick');

console.log(JSON.stringify({ok:true,audio:'procedural+gesture-unlock+background-safe',uiClick:'pass',knifeSwing:'pass',impact:'pass',hurt:'pass',crawler:'pass',ambience:'campfire+wind',backgroundLifecycle:'suspend+no-auto-resume',syntheticClick:'no-first-unlock',fallback:'no-audio-safe',feel:'semantic-bridge+presentation-kick'}));
