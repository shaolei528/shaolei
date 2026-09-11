import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const audioSource=fs.readFileSync(new URL('../modules/audio/playable-feel-audio-v1.js',import.meta.url),'utf8');
for(const forbidden of ['localStorage.','saveLocal(','zoneCh.send','new WebSocket(','fetch(','.wav','.ogg']){
  assert.equal(audioSource.includes(forbidden),false,`mixer foundation must stay local/procedural: ${forbidden}`);
}
for(const name of ['master','sfx','ambience','ui','swing','impact','hurt','crawler','campfire','wind']){
  assert.ok(audioSource.includes(name),`missing mixer bus ${name}`);
}

const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function makeHarness(){
  let now=1000,constructors=0,resumes=0,suspends=0,resumeFails=false;
  let sources=0,sourceStarts=0,sourceStops=0,oscillators=0,oscillatorStarts=0,oscillatorStops=0,disconnects=0,activeSources=0;
  let nextId=0;
  const docHandlers=new Map(),winHandlers=new Map(),edges=[],gains=[];
  const param=value=>({value,cancelScheduledValues(){},setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;}});
  const node=(kind,extra={})=>{
    const n={id:`${kind}${++nextId}`,kind,connect(target){edges.push([this,target]);return target;},disconnect(){disconnects++;},...extra};
    return n;
  };
  class FakeAudioContext{
    constructor(){constructors++;this.sampleRate=8000;this.currentTime=0;this.state='suspended';this.destination=node('destination');}
    createGain(){const n=node('gain',{gain:param(0)});gains.push(n);return n;}
    createBuffer(_channels,length){const data=new Float32Array(length);return{getChannelData(){return data;}};}
    createBufferSource(){sources++;return node('source',{buffer:null,loop:false,onended:null,start(){sourceStarts++;activeSources++;},stop(){sourceStops++;activeSources=Math.max(0,activeSources-1);this.onended?.();}});}
    createBiquadFilter(){return node('filter',{type:'lowpass',frequency:param(0),Q:param(0)});}
    createStereoPanner(){return node('panner',{pan:param(0)});}
    createOscillator(){oscillators++;return node('oscillator',{type:'sine',frequency:param(0),onended:null,start(){oscillatorStarts++;},stop(){oscillatorStops++;this.onended?.();}});}
    resume(){resumes++;if(resumeFails)return Promise.reject(new Error('blocked'));this.state='running';return Promise.resolve();}
    suspend(){suspends++;this.state='suspended';return Promise.resolve();}
  }
  const sandbox={
    console,AudioContext:FakeAudioContext,performance:{now:()=>now},Math,
    started:true,me:{x:100,y:100},CAMP:{x:100,y:100,r:180},mobs:[],inCamp(){return true;},
    setInterval(fn){sandbox.interval=fn;return 1;},
    document:{hidden:false,addEventListener(type,fn){docHandlers.set(type,fn);}},
    addEventListener(type,fn){winHandlers.set(type,fn);},window:null,globalThis:null
  };
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);vm.runInContext(audioSource,sandbox,{filename:'playable-feel-audio-v1.js'});
  return{
    sandbox,docHandlers,winHandlers,edges,gains,
    get now(){return now;},set now(v){now=v;},
    get resumeFails(){return resumeFails;},set resumeFails(v){resumeFails=!!v;},
    stats:()=>({constructors,resumes,suspends,sources,sourceStarts,sourceStops,oscillators,oscillatorStarts,oscillatorStops,disconnects,activeSources})
  };
}
function hasEdge(h,from,to){return h.edges.some(([a,b])=>a===from&&b===to);}

// Gains can be staged before first user gesture without constructing AudioContext.
const h=makeHarness();
const api=h.sandbox.ABYSSAL_AUDIO_V1;
assert.equal(api.setMasterGain(.5),.5);
assert.equal(api.setSfxGain(.4),.4);
assert.equal(api.setAmbienceGain(.3),.3);
assert.equal(h.stats().constructors,0,'gain API must not eagerly create AudioContext');
await api.unlock({isTrusted:true});await flush();
assert.equal(h.stats().constructors,1,'mixer must retain exactly one lazy AudioContext');
await api.unlock({isTrusted:true});await flush();
assert.equal(h.stats().constructors,1,'repeated trusted unlock must reuse the same AudioContext');

const [master,sfx,ambience,ui,swing,impact,hurt,crawler,campfire,wind,fireLevel,windLevel]=h.gains;
assert.equal(master.gain.value,.5,'stored master gain must apply at graph creation');
assert.equal(sfx.gain.value,.4,'stored sfx gain must apply at graph creation');
assert.equal(ambience.gain.value,.3,'stored ambience gain must apply at graph creation');
assert.ok(hasEdge(h,sfx,master),'sfx bus must route to master');
assert.ok(hasEdge(h,ambience,master),'ambience bus must route to master');
for(const category of [ui,swing,impact,hurt,crawler])assert.ok(hasEdge(h,category,sfx),'every sfx category must route through sfx bus');
for(const category of [campfire,wind])assert.ok(hasEdge(h,category,ambience),'every ambience category must route through ambience bus');
assert.ok(hasEdge(h,fireLevel,campfire),'campfire loop must route through campfire bus');
assert.ok(hasEdge(h,windLevel,wind),'wind loop must route through wind bus');
assert.deepEqual(JSON.parse(JSON.stringify(api.getMixerState().graph)),{master:['sfx','ambience'],sfx:['ui','swing','impact','hurt','crawler'],ambience:['campfire','wind']});

// Category gain API remains live without changing context ownership.
api.setGain('ui',.25);api.setGain('swing',.6);api.setGain('campfire',.2);
assert.equal(ui.gain.value,.25);assert.equal(swing.gain.value,.6);assert.equal(campfire.gain.value,.2);
assert.equal(api.getGain('ui'),.25);assert.equal(api.setGain('not-a-bus',.5),false);
assert.equal(h.stats().constructors,1);

// Hidden lifecycle mutes the physical master but preserves the configured value for visibility recovery.
h.sandbox.document.hidden=true;h.docHandlers.get('visibilitychange')?.();await flush();
assert.equal(master.gain.value,0,'hidden page must hard-mute the master output');
assert.equal(api.getGain('master'),.5,'hidden mute must not overwrite configured master gain');
assert.equal(h.stats().suspends,1);
const hidden=h.stats();
api.playSwing({knife:true});api.updateAmbience();await flush();
assert.equal(h.stats().oscillators,hidden.oscillators,'hidden semantic audio must not synthesize transients');
assert.equal(h.stats().sources,hidden.sources,'hidden ambience must not create sources');
assert.equal(h.stats().resumes,hidden.resumes,'hidden playback must not auto-resume');
h.sandbox.document.hidden=false;h.docHandlers.get('visibilitychange')?.();await flush();
assert.equal(master.gain.value,.5,'visible lifecycle must restore configured master gain');
assert.equal(h.stats().resumes,hidden.resumes+1,'visible lifecycle may attempt one resume');

// Ambience start/stop/restart remains exactly two persistent loops and is idempotent.
const ambienceHarness=makeHarness();const ambienceApi=ambienceHarness.sandbox.ABYSSAL_AUDIO_V1;
await ambienceApi.unlock({isTrusted:true});await flush();
assert.equal(ambienceHarness.stats().sources,2);assert.equal(ambienceHarness.stats().activeSources,2);assert.equal(ambienceApi.getMixerState().ambienceActive,true);
ambienceApi.startAmbience();ambienceApi.startAmbience();
assert.equal(ambienceHarness.stats().sources,2,'repeated ambience start must not stack loops');
ambienceApi.stopAmbience();
assert.equal(ambienceHarness.stats().activeSources,0);assert.equal(ambienceApi.getMixerState().ambienceActive,false);
ambienceApi.startAmbience();
assert.equal(ambienceHarness.stats().sources,4);assert.equal(ambienceHarness.stats().activeSources,2);
ambienceApi.restartAmbience();
assert.equal(ambienceHarness.stats().sources,6);assert.equal(ambienceHarness.stats().activeSources,2,'restart must replace, not accumulate, ambience loops');
assert.equal(ambienceHarness.stats().sourceStops,4,'stop + restart must stop exactly the replaced persistent loops');

// 1000-swing transient soak: one context, every transient stops and disconnect cleanup runs.
const soak=makeHarness();await soak.sandbox.ABYSSAL_AUDIO_V1.unlock({isTrusted:true});await flush();
for(let i=0;i<1000;i++)soak.sandbox.ABYSSAL_AUDIO_V1.playSwing({knife:true});
const soakStats=soak.stats();
assert.equal(soakStats.constructors,1);
assert.equal(soakStats.oscillators,1000);assert.equal(soakStats.oscillatorStops,1000);
assert.equal(soakStats.sources,1002,'two persistent ambience loops + 1000 swing noise sources expected');
assert.equal(soakStats.sourceStops,1000,'all swing noise sources must stop');
assert.equal(soakStats.activeSources,2,'only the two persistent ambience loops may remain active');
assert.ok(soakStats.disconnects>=7000,'transient node chains must disconnect on ended cleanup');

// Trusted gesture + visibility regression, including blocked visible resume recovery.
const lifecycle=makeHarness();const lifeApi=lifecycle.sandbox.ABYSSAL_AUDIO_V1;
lifecycle.docHandlers.get('click')?.({detail:0,target:{closest(){return this;},disabled:false,matches(){return false;}},isTrusted:false});
assert.equal(lifecycle.stats().constructors,0,'synthetic click must not create AudioContext');
lifecycle.docHandlers.get('keydown')?.({key:'a',isTrusted:true});await flush();
assert.equal(lifecycle.stats().constructors,1);assert.equal(lifecycle.stats().resumes,1);
lifecycle.sandbox.document.hidden=true;lifecycle.docHandlers.get('visibilitychange')?.();await flush();
assert.equal(lifecycle.stats().suspends,1);
lifecycle.resumeFails=true;lifecycle.sandbox.document.hidden=false;lifecycle.docHandlers.get('visibilitychange')?.();await flush();
const blocked=lifecycle.stats();assert.equal(lifeApi.contextState,'suspended');
lifecycle.winHandlers.get('abyssal:player-swing')?.({detail:{knife:true}});lifeApi.updateAmbience();await flush();
assert.equal(lifecycle.stats().resumes,blocked.resumes,'semantic audio must not retry blocked resume');
lifecycle.resumeFails=false;lifecycle.docHandlers.get('keydown')?.({key:'a',isTrusted:true});await flush();
assert.equal(lifecycle.stats().resumes,blocked.resumes+1,'next real gesture may recover blocked resume');
assert.equal(lifeApi.contextState,'running');

console.log(JSON.stringify({ok:true,graph:api.getMixerState().graph,gains:'master+sfx+ambience+categories',audioContext:'single-lazy',swingSoak:{count:1000,oscillatorStops:soakStats.oscillatorStops,noiseStops:soakStats.sourceStops},ambience:'idempotent-start+stop+restart',visibility:'trusted-gesture+hidden-safe'}));
