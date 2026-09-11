import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../modules/audio/playable-feel-audio-v1.js',import.meta.url),'utf8');

for(const forbidden of [
  'zoneCh.send','new WebSocket(','RELAY_URL','saveLocal(','localStorage.','fetch(',
  'isBlockedPoint','isBlockedCircle','COLLISION','getImageData','globalAlpha','attackCd=','dashCd='
]){
  assert.equal(source.includes(forbidden),false,`atmosphere audio must stay presentation-only: ${forbidden}`);
}
for(const required of ['HOME','OUTSIDE','MIRE_MART','resolveAtmosphereState','ABYSSAL_AWAKENING_WORLD_V1','inStore']){
  assert.ok(source.includes(required),`missing atmosphere state contract: ${required}`);
}

const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};

function makeHarness(){
  let now=1000,constructors=0,resumes=0,suspends=0,resumeFails=false;
  let sources=0,sourceStarts=0,sourceStops=0,persistentSources=0,persistentActive=0,activeSources=0;
  let oscillators=0,oscillatorStops=0,disconnects=0,nextId=0;
  const docHandlers=new Map(),winHandlers=new Map(),gains=[],filters=[];
  const params=[];
  const param=value=>{
    const p={value,lastSeconds:null,cancelScheduledValues(){},setTargetAtTime(v,_t,seconds){this.value=v;this.lastSeconds=seconds;},setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;}};
    params.push(p);return p;
  };
  const node=(kind,extra={})=>({
    id:`${kind}${++nextId}`,kind,
    connect(target){return target;},
    disconnect(){disconnects++;},
    ...extra
  });
  class FakeAudioContext{
    constructor(){constructors++;this.sampleRate=8000;this.currentTime=0;this.state='suspended';this.destination=node('destination');}
    createGain(){const n=node('gain',{gain:param(0)});gains.push(n);return n;}
    createBuffer(_channels,length){const data=new Float32Array(length);return{getChannelData(){return data;}};}
    createBufferSource(){
      sources++;
      const n=node('source',{
        buffer:null,loop:false,onended:null,_active:false,
        start(){
          sourceStarts++;this._active=true;activeSources++;
          if(this.loop){persistentSources++;persistentActive++;}
        },
        stop(){
          sourceStops++;
          if(this._active){this._active=false;activeSources--;if(this.loop)persistentActive--;}
          this.onended?.();
        }
      });
      return n;
    }
    createBiquadFilter(){const n=node('filter',{type:'lowpass',frequency:param(0),Q:param(0)});filters.push(n);return n;}
    createStereoPanner(){return node('panner',{pan:param(0)});}
    createOscillator(){
      oscillators++;
      return node('oscillator',{type:'sine',frequency:param(0),onended:null,start(){},stop(){oscillatorStops++;this.onended?.();}});
    }
    resume(){resumes++;if(resumeFails)return Promise.reject(new Error('blocked'));this.state='running';return Promise.resolve();}
    suspend(){suspends++;this.state='suspended';return Promise.resolve();}
  }
  const add=(map,type,fn)=>{const list=map.get(type)||[];list.push(fn);map.set(type,list);};
  const first=(map,type)=>map.get(type)?.[0];
  const me={x:100,y:100};
  const CAMP={x:100,y:100,r:180};
  const STORE={x:2112,y:640,w:640,h:448};
  const inRect=(p,r)=>p.x>=r.x&&p.y>=r.y&&p.x<r.x+r.w&&p.y<r.y+r.h;
  const math=Object.create(Math);math.random=()=>.5;
  const sandbox={
    console,AudioContext:FakeAudioContext,performance:{now:()=>now},Math:math,
    started:true,me,CAMP,mobs:[],attackCd:.32,dashCd:1.35,dashQueued:false,
    inCamp(){return Math.hypot(me.x-CAMP.x,me.y-CAMP.y)<=CAMP.r;},
    ABYSSAL_AWAKENING_WORLD_V1:{inStore(p){return !!p&&inRect(p,STORE);},poi:STORE},
    setInterval(fn){sandbox.interval=fn;return 1;},
    document:{
      hidden:false,
      addEventListener(type,fn){add(docHandlers,type,fn);}
    },
    addEventListener(type,fn){add(winHandlers,type,fn);},
    window:null,globalThis:null
  };
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'playable-feel-audio-v1.js'});
  return{
    sandbox,docHandlers,winHandlers,gains,filters,first,
    setPosition(x,y){me.x=x;me.y=y;},
    advance(ms){now+=ms;},
    get now(){return now;},
    set resumeFails(v){resumeFails=!!v;},
    stats:()=>({constructors,resumes,suspends,sources,sourceStarts,sourceStops,persistentSources,persistentActive,activeSources,oscillators,oscillatorStops,disconnects})
  };
}

const h=makeHarness(),api=h.sandbox.ABYSSAL_AUDIO_V1;
assert.equal(api.supported,true);
assert.equal(h.stats().constructors,0,'AudioContext must remain lazy');
await api.unlock({isTrusted:true});await flush();
assert.equal(h.stats().constructors,1);
assert.equal(h.stats().persistentSources,2,'existing mixer must own exactly two persistent ambience loops');
assert.equal(h.stats().persistentActive,2);

// HOME baseline: warm fire + very low wind.
h.setPosition(100,100);api.updateAmbience();
assert.equal(api.getAtmosphereState(),'HOME');
const fireLevel=h.gains[10],windLevel=h.gains[11];
assert.ok(fireLevel.gain.value>.02,'HOME should retain a warm audible campfire bed');
assert.ok(windLevel.gain.value<.006,'HOME wind must stay restrained');
assert.ok(fireLevel.gain.lastSeconds>=.35&&windLevel.gain.lastSeconds>=.45,'HOME profile must use eased crossfade targets');

// OUTSIDE: fire retreats, wind becomes the dominant bed.
h.setPosition(800,800);h.advance(20);api.updateAmbience();
assert.equal(api.getAtmosphereState(),'OUTSIDE');
assert.ok(windLevel.gain.value>.025,'OUTSIDE should be wind-led');
assert.ok(fireLevel.gain.value<.008,'OUTSIDE should lose the close campfire bed');

// MIRE MART: existing world inStore() is the only store classification input.
h.setPosition(2300,820);h.advance(20);api.updateAmbience();
assert.equal(api.getAtmosphereState(),'MIRE_MART');
assert.ok(fireLevel.gain.value>.009&&fireLevel.gain.value<.014,'MIRE MART low hum must stay subdued');
assert.ok(windLevel.gain.value<.008,'MIRE MART should suppress exterior wind');
assert.ok(h.filters[0].frequency.value<150,'first persistent loop should morph into low interior hum');
assert.ok(h.filters[1].frequency.value>1500,'second persistent loop should carry restrained electrical air');
assert.equal(api.getMixerState().atmosphere.crossfadeMs,480);

// 500 full HOME -> OUTSIDE -> STORE -> HOME cycles. State switching may retarget existing loops,
// but must never create a new persistent loop or bind another listener.
const listenersBefore={
  doc:[...h.docHandlers.values()].reduce((n,list)=>n+list.length,0),
  win:[...h.winHandlers.values()].reduce((n,list)=>n+list.length,0)
};
const persistentBefore=h.stats().persistentSources;
for(let i=0;i<500;i++){
  h.setPosition(100,100);h.advance(10);api.updateAmbience();
  h.setPosition(800,800);h.advance(10);api.updateAmbience();
  h.setPosition(2300,820);h.advance(10);api.updateAmbience();
  h.setPosition(100,100);h.advance(10);api.updateAmbience();
}
assert.equal(api.getAtmosphereState(),'HOME');
assert.equal(api.atmosphereTransitions,1503,'state accounting should remain deterministic across repeated switching');
assert.equal(h.stats().persistentSources,persistentBefore,'zone switching must not construct more persistent loops');
assert.equal(h.stats().persistentActive,2,'only the original two persistent loops may remain active');
assert.equal([...h.docHandlers.values()].reduce((n,list)=>n+list.length,0),listenersBefore.doc,'state changes must not accumulate document listeners');
assert.equal([...h.winHandlers.values()].reduce((n,list)=>n+list.length,0),listenersBefore.win,'state changes must not accumulate window listeners');

// Repeated background/foreground preserves the same loops and does not synthesize while hidden.
for(let i=0;i<40;i++){
  const before=h.stats();
  h.sandbox.document.hidden=true;h.first(h.docHandlers,'visibilitychange')?.();await flush();
  api.updateAmbience();
  assert.equal(h.stats().sources,before.sources,'hidden ambience tick must not allocate audio nodes');
  h.sandbox.document.hidden=false;h.first(h.docHandlers,'visibilitychange')?.();await flush();
  api.updateAmbience();
}
assert.equal(h.stats().persistentSources,persistentBefore);
assert.equal(h.stats().persistentActive,2);

// A rejected foreground resume gets one best-effort attempt and then stays quiet until a real gesture.
h.sandbox.document.hidden=true;h.first(h.docHandlers,'visibilitychange')?.();await flush();
h.resumeFails=true;
h.sandbox.document.hidden=false;h.first(h.docHandlers,'visibilitychange')?.();await flush();
const blocked=h.stats();
for(let i=0;i<12;i++){h.advance(250);api.updateAmbience();h.first(h.winHandlers,'abyssal:player-swing')?.({detail:{knife:true}});}
await flush();
assert.equal(h.stats().resumes,blocked.resumes,'blocked foreground resume must not be retried by semantics or ambience ticks');
assert.equal(api.contextState,'suspended');
h.resumeFails=false;h.first(h.docHandlers,'keydown')?.({key:'w',isTrusted:true});await flush();
assert.equal(h.stats().resumes,blocked.resumes+1,'next real keyboard gesture may recover audio');
assert.equal(api.contextState,'running');

// PC/mobile input contract: audio capture listeners may unlock sound but never alter gameplay input state.
const inputBefore={attackCd:h.sandbox.attackCd,dashCd:h.sandbox.dashCd,dashQueued:h.sandbox.dashQueued};
h.first(h.docHandlers,'keydown')?.({key:' ',isTrusted:true});await flush();
const attackButton={disabled:false,closest(){return this;},matches(selector){return selector.includes('.attack');}};
h.first(h.docHandlers,'pointerdown')?.({target:attackButton,isTrusted:true});await flush();
assert.deepEqual({attackCd:h.sandbox.attackCd,dashCd:h.sandbox.dashCd,dashQueued:h.sandbox.dashQueued},inputBefore);

// Stop/start/restart retains the mixer's old two-loop ownership invariant.
api.stopAmbience();
assert.equal(h.stats().persistentActive,0);
api.startAmbience();api.startAmbience();
assert.equal(h.stats().persistentActive,2);
const afterStart=h.stats().persistentSources;
api.restartAmbience();
assert.equal(h.stats().persistentActive,2);
assert.equal(h.stats().persistentSources,afterStart+2,'restart replaces exactly two loops rather than stacking them');

console.log(JSON.stringify({
  ok:true,
  states:['HOME','OUTSIDE','MIRE_MART'],
  crossfadeMs:api.getMixerState().atmosphere.crossfadeMs,
  transitionStress:500,
  atmosphereTransitions:api.atmosphereTransitions,
  persistentLoops:'2-owned-no-transition-stacking',
  visibility:'40-background-foreground-cycles+rejected-resume-recovery',
  input:'PC+mobile-contract-unchanged',
  authority:'presentation-only-existing-inStore+inCamp'
}));
