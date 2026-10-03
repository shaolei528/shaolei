import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const audioSource=fs.readFileSync(new URL('../modules/audio/playable-feel-audio-v1.js',import.meta.url),'utf8');
assert.ok(audioSource.includes('ABYSSAL_AUDIO_RUNTIME_V1'),'audio runtime must expose a retry-idempotency marker');

const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};

function makeHarness(){
  let now=1000,constructors=0,resumes=0,suspends=0,sources=0,oscillators=0;
  const docHandlers=new Map(),winHandlers=new Map(),intervals=[];
  const add=(map,type,fn)=>{const list=map.get(type)||[];list.push(fn);map.set(type,list);};
  const emit=(map,type,event)=>{for(const fn of map.get(type)||[])fn(event);};
  const param=value=>({value,cancelScheduledValues(){},setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;}});
  const node=(extra={})=>({connect(){},disconnect(){},...extra});
  class FakeAudioContext{
    constructor(){constructors++;this.sampleRate=8000;this.currentTime=0;this.state='suspended';this.destination=node();}
    createGain(){return node({gain:param(0)});}
    createBuffer(_channels,length){const data=new Float32Array(length);return{getChannelData(){return data;}};}
    createBufferSource(){sources++;return node({buffer:null,loop:false,onended:null,start(){},stop(){this.onended?.();}});}
    createBiquadFilter(){return node({type:'lowpass',frequency:param(0),Q:param(0)});}
    createStereoPanner(){return node({pan:param(0)});}
    createOscillator(){oscillators++;return node({type:'sine',frequency:param(0),onended:null,start(){},stop(){this.onended?.();}});}
    resume(){resumes++;this.state='running';return Promise.resolve();}
    suspend(){suspends++;this.state='suspended';return Promise.resolve();}
  }
  const sandbox={
    console,AudioContext:FakeAudioContext,performance:{now:()=>now},Math,
    started:true,me:{x:100,y:100},CAMP:{x:100,y:100,r:180},mobs:[],inCamp(){return true;},
    ABYSSAL_AWAKENING_WORLD_V1:{inStore(){return false;}},
    setInterval(fn,ms){const id=intervals.length+1;intervals.push({id,fn,ms});return id;},
    document:{hidden:false,addEventListener(type,fn){add(docHandlers,type,fn);}},
    addEventListener(type,fn){add(winHandlers,type,fn);},
    window:null,globalThis:null
  };
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  return{
    sandbox,docHandlers,winHandlers,intervals,
    run(){vm.runInContext(audioSource,sandbox,{filename:'playable-feel-audio-v1.js'});},
    emitDoc(type,event={}){emit(docHandlers,type,event);},
    emitWin(type,event={}){emit(winHandlers,type,event);},
    tick(){for(const entry of intervals)entry.fn();},
    set now(value){now=value;},get now(){return now;},
    stats:()=>({constructors,resumes,suspends,sources,oscillators})
  };
}

const h=makeHarness();
h.run();
const api=h.sandbox.ABYSSAL_AUDIO_V1;
const runtime=h.sandbox.ABYSSAL_AUDIO_RUNTIME_V1;
assert.ok(api,'first evaluation must install the public audio API');
assert.equal(runtime?.bound,true,'first evaluation must mark the runtime bound');
assert.equal(runtime?.version,1);
assert.equal(h.intervals.length,1,'first evaluation must own exactly one ambience interval');
assert.equal(h.intervals[0].ms,250);
assert.equal([...h.docHandlers.values()].reduce((n,list)=>n+list.length,0),4,'first evaluation must bind the expected document listeners once');
assert.equal([...h.winHandlers.values()].reduce((n,list)=>n+list.length,0),3,'first evaluation must bind the expected window listeners once');

// Simulate V21 whole-sequence retries after this script already completed.
for(let i=0;i<50;i++)h.run();
assert.equal(h.sandbox.ABYSSAL_AUDIO_V1,api,'retry evaluation must preserve the original audio API instance');
assert.equal(h.sandbox.ABYSSAL_AUDIO_RUNTIME_V1,runtime,'retry evaluation must preserve the runtime marker instance');
assert.equal(runtime.reentryCount,50,'runtime marker must make retries observable without rebinding');
assert.equal(h.intervals.length,1,'50 retries must not add ambience intervals');
assert.equal([...h.docHandlers.values()].reduce((n,list)=>n+list.length,0),4,'50 retries must not duplicate document listeners');
assert.equal([...h.winHandlers.values()].reduce((n,list)=>n+list.length,0),3,'50 retries must not duplicate window listeners');
assert.equal(h.stats().constructors,0,'retry evaluation alone must remain lazy and create no AudioContext');

// One trusted gesture after retries still owns one context and one persistent ambience graph.
h.emitDoc('keydown',{key:'a',isTrusted:true});
await flush();
assert.equal(h.stats().constructors,1,'one trusted gesture after retries must create exactly one AudioContext');
assert.equal(h.stats().resumes,1,'one trusted gesture after retries must make one resume attempt');
assert.equal(h.stats().sources,2,'context creation must start exactly the two persistent ambience loops');

// Semantic events must fire once after retries rather than once per script evaluation.
const beforeSwing=h.stats();
h.emitWin('abyssal:player-swing',{detail:{knife:true}});
const afterSwing=h.stats();
assert.equal(afterSwing.oscillators-beforeSwing.oscillators,1,'one swing semantic event must create one tone chain');
assert.equal(afterSwing.sources-beforeSwing.sources,1,'one swing semantic event must create one noise chain');

// Visibility lifecycle also stays single-owned after retries.
h.sandbox.document.hidden=true;
h.emitDoc('visibilitychange');
await flush();
assert.equal(h.stats().suspends,1,'hidden transition after retries must suspend once');
h.sandbox.document.hidden=false;
h.emitDoc('visibilitychange');
await flush();
assert.equal(h.stats().resumes,2,'visible transition after retries must attempt one resume');

// One interval tick may update presentation state, but retry count must not multiply work roots.
h.sandbox.inCamp=()=>false;
h.now+=500;
h.tick();
assert.equal(api.atmosphereState,'OUTSIDE');
assert.equal(api.atmosphereTransitions,1,'single owned interval must produce one state transition');
assert.equal(h.intervals.length,1);

console.log(JSON.stringify({ok:true,retries:50,documentListeners:4,windowListeners:3,intervals:1,audioContexts:h.stats().constructors,persistentLoops:2,semanticSwing:'single-owned',visibility:'single-owned'}));
