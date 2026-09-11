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

function makeAudioSandbox(withAudio=true){
  let now=1000,constructors=0,oscillators=0,sources=0;
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
    resume(){this.state='running';return Promise.resolve();}
    suspend(){this.state='suspended';return Promise.resolve();}
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
  return{sandbox,docHandlers,winHandlers,get now(){return now;},set now(v){now=v;},stats:()=>({constructors,oscillators,sources})};
}

const supported=makeAudioSandbox(true);
assert.equal(supported.stats().constructors,0,'AudioContext must be lazy and wait for a user gesture');
assert.equal(supported.sandbox.ABYSSAL_AUDIO_V1.supported,true);
assert.equal(supported.sandbox.ABYSSAL_AUDIO_V1.unlocked,false);
supported.sandbox.ABYSSAL_AUDIO_V1.unlock();
assert.equal(supported.stats().constructors,1,'unlock should construct exactly one audio context');
assert.equal(supported.sandbox.ABYSSAL_AUDIO_V1.unlocked,true);

supported.winHandlers.get('abyssal:player-swing')?.({detail:{knife:true}});
supported.now+=100;
supported.winHandlers.get('abyssal:combat-hit')?.({detail:{local:true}});
supported.now+=100;
supported.winHandlers.get('abyssal:player-hurt')?.({detail:{delta:4}});
supported.sandbox.ABYSSAL_AUDIO_V1.updateAmbience();
assert.ok(supported.stats().oscillators>=4,'swing/impact/hurt/crawler should synthesize transient tones');
assert.ok(supported.stats().sources>=4,'procedural noise should cover effects and ambience without audio assets');

const uiTarget={disabled:false,closest(){return this;},matches(){return false;}};
supported.now+=100;
supported.docHandlers.get('pointerdown')?.({target:uiTarget});
assert.ok(supported.stats().oscillators>=5,'ordinary UI buttons should synthesize a click');
const beforeAttackButton=supported.stats().oscillators;
supported.now+=100;
supported.docHandlers.get('pointerdown')?.({target:{disabled:false,closest(){return this;},matches(){return true;}}});
assert.equal(supported.stats().oscillators,beforeAttackButton,'combat action buttons must not double-play the generic UI click');

const unsupported=makeAudioSandbox(false);
assert.equal(unsupported.sandbox.ABYSSAL_AUDIO_V1.supported,false,'no Web Audio must degrade safely');
assert.doesNotThrow(()=>unsupported.sandbox.ABYSSAL_AUDIO_V1.unlock());
assert.doesNotThrow(()=>unsupported.sandbox.ABYSSAL_AUDIO_V1.playUiClick());

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

console.log(JSON.stringify({ok:true,audio:'procedural+lazy+local-only',uiClick:'pass',knifeSwing:'pass',impact:'pass',hurt:'pass',crawler:'pass',ambience:'campfire+wind',fallback:'no-audio-safe',feel:'semantic-bridge+presentation-kick'}));
