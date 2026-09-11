import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const rootSource=fs.readFileSync(new URL('../interaction-v12.js',import.meta.url),'utf8');
const moduleSource=fs.readFileSync(new URL('../modules/input/interaction-v12.js',import.meta.url),'utf8');
assert.equal(moduleSource,rootSource,'root and categorized V12 interaction sources must remain byte-identical');
assert.ok(moduleSource.includes('reentryCount'),'interaction runtime must expose retry observability');
assert.ok(moduleSource.includes('bound:true'),'interaction API must mark completed installation');

function emitter(extra={}){
  const handlers=new Map();
  return Object.assign({
    handlers,
    addEventListener(type,fn){const list=handlers.get(type)||[];list.push(fn);handlers.set(type,list);},
    emit(type,event={}){for(const fn of handlers.get(type)||[])fn(event);},
    count(type){return (handlers.get(type)||[]).length;}
  },extra);
}
function classList(initial=[]){
  const values=new Set(initial);
  return{add(...n){n.forEach(v=>values.add(v));},remove(...n){n.forEach(v=>values.delete(v));},contains(v){return values.has(v);}};
}
function makeHarness(){
  let intervals=0,saveCalls=0,uiCalls=0,toastCalls=0;
  const prompt={style:{display:'none'},textContent:''};
  const dialog=emitter({classList:classList(),querySelector(){return null;}});
  const interact=emitter({id:'interactV12',textContent:'互动'});
  const chatInput=emitter({id:'chatInputV12',value:'',placeholder:'输入消息…'});
  const chatSend=emitter({id:'chatSendV12',textContent:'发送'});
  const ids={
    v12InteractionStyle:{id:'v12InteractionStyle'},interactionPromptV12:prompt,guideDialogV12:dialog,
    interactV12:interact,chatInputV12:chatInput,chatSendV12:chatSend
  };
  const document={
    head:{appendChild(){}},
    getElementById(id){return ids[id]||null;},
    createElement(){return{id:'',style:{},dataset:{},classList:classList(),setAttribute(){},appendChild(){},querySelector(){return null;},addEventListener(){}};}
  };
  const resource={id:'camp:retry-test',type:'wood',x:0,y:0};
  const sandbox={
    console,window:null,globalThis:null,document,game:{appendChild(){}},
    inventory:{wood:0,stone:0,food:0,shard:0,knife:false},hasLeftCamp:false,
    resources:[resource],harvested:new Map(),me:{x:0,y:0,hp:100,sanity:100,name:'Retry'},
    started:true,dead:false,currentZone:'1:1',zoneConnected:false,zoneCh:null,globalConnected:false,globalCh:null,
    inCamp(){return false;},distance(){return 0;},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
    stopJoy(){},dashQueued:false,craftPanel:{classList:classList(['hidden'])},chatPanel:{classList:classList(['hidden'])},
    saveLocal(){saveCalls++;},updateUI(){uiCalls++;},updateQuest(){},toast(){toastCalls++;},
    cleanChat:v=>String(v||'').trim(),receiveChat(){},
    localStorage:{setItem(){}},
    setInterval(fn,ms){intervals++;sandbox.interval={fn,ms};return intervals;}
  };
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  return{
    sandbox,dialog,interact,chatInput,chatSend,
    run(){vm.runInContext(moduleSource,sandbox,{filename:'modules/input/interaction-v12.js'});},
    stats:()=>({intervals,saveCalls,uiCalls,toastCalls})
  };
}

const h=makeHarness();
h.run();
const api=h.sandbox.ABYSSAL_INTERACTION_V12;
assert.ok(api,'first evaluation must expose interaction API');
assert.equal(api.bound,true,'first successful evaluation must claim ownership');
assert.equal(api.reentryCount,0);
assert.equal(h.stats().intervals,1,'first evaluation must own one prompt/chat interval');
assert.equal(h.dialog.count('pointerdown'),1,'first evaluation must bind dialog propagation guard once');

for(let i=0;i<50;i++)h.run();
assert.equal(h.sandbox.ABYSSAL_INTERACTION_V12,api,'retry evaluation must preserve API identity');
assert.equal(api.reentryCount,50,'retry count must remain observable');
assert.equal(h.stats().intervals,1,'50 retries must not add 200ms intervals');
assert.equal(h.dialog.count('pointerdown'),1,'50 retries must not duplicate dialog pointer listeners');

// Canonical interaction authority is unchanged: one public action harvests exactly one local resource.
assert.equal(h.sandbox.inventory.wood,0);
api.triggerContextInteraction();
assert.equal(h.sandbox.inventory.wood,1,'one canonical context action must harvest exactly one resource');
assert.equal(h.stats().saveCalls,1,'one harvest must save once');
assert.equal(h.stats().uiCalls,1,'one harvest must update UI once');
assert.equal(h.stats().toastCalls,1,'one harvest must toast once');
assert.ok(h.sandbox.harvested.get('camp:retry-test')>Date.now(),'harvest cooldown semantics must remain intact');

console.log(JSON.stringify({ok:true,retries:50,intervals:1,dialogPointerListeners:1,canonicalHarvestDelta:1,saveCalls:1,uiCalls:1,rootModuleByteEquivalent:true}));
