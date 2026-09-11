import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const rootSource=fs.readFileSync(new URL('../platform-inventory-v19.js',import.meta.url),'utf8');
const moduleSource=fs.readFileSync(new URL('../modules/input/platform-inventory-v19.js',import.meta.url),'utf8');
assert.equal(moduleSource,rootSource,'root and categorized V19 platform sources must remain byte-identical');
assert.ok(moduleSource.includes('reentryCount'),'platform runtime must expose retry observability');
assert.ok(moduleSource.includes('bound:false'),'platform API must distinguish exposed helpers from completed DOM binding');

function makeEmitter(){
  const handlers=new Map();
  return{
    handlers,
    addEventListener(type,fn){const list=handlers.get(type)||[];list.push(fn);handlers.set(type,list);},
    emit(type,event={}){for(const fn of handlers.get(type)||[])fn(event);},
    count(type){return (handlers.get(type)||[]).length;},
    total(){return [...handlers.values()].reduce((n,list)=>n+list.length,0);}
  };
}
function makeClassList(initial=[]){
  const values=new Set(initial);
  return{
    add(...names){for(const name of names)values.add(name);},
    remove(...names){for(const name of names)values.delete(name);},
    contains(name){return values.has(name);},
    toggle(name,force){if(force===undefined){if(values.has(name)){values.delete(name);return false;}values.add(name);return true;}if(force)values.add(name);else values.delete(name);return !!force;}
  };
}
function makeHarness(initialReady=true){
  let ready=initialReady,resizeObservers=0,rafCalls=0,baseUpdateCalls=0,attackCalls=0,contextCalls=0,stopJoyCalls=0;
  const docEvents=makeEmitter(),winEvents=makeEmitter(),fineMedia=makeEmitter(),hoverMedia=makeEmitter();
  fineMedia.matches=true;hoverMedia.matches=true;
  const close=makeEmitter();
  const panel={classList:makeClassList(['hidden']),setAttribute(){},querySelector(selector){if(selector==='.v19-bag-close')return close;if(selector==='.v19-bag-grid')return null;return null;}};
  const toggle=Object.assign(makeEmitter(),{setAttribute(){}});
  const hint={};
  const arenaWrap={getBoundingClientRect(){return{width:900,height:650};}};
  const canvas={width:0,height:0,getContext(){return{imageSmoothingEnabled:true};}};
  const root={appendChild(){}};
  const ids={platformInventoryStyleV19:{},inventoryToggleV19:toggle,inventoryPanelV19:panel,desktopControlsV19:hint};
  const document={
    head:{appendChild(){}},documentElement:{classList:makeClassList()},
    getElementById(id){if(!ready)return null;if(id==='game')return root;if(id==='canvas')return canvas;return ids[id]||null;},
    querySelector(selector){return ready&&selector==='.arena-wrap'?arenaWrap:null;},
    createElement(){return{classList:makeClassList(),dataset:{},style:{},setAttribute(){},append(){},appendChild(){},replaceChildren(){}};},
    addEventListener(type,fn,opts){docEvents.addEventListener(type,fn,opts);}
  };
  class ResizeObserver{
    constructor(fn){resizeObservers++;this.fn=fn;}
    observe(target){this.target=target;}
  }
  const sandbox={
    console,document,window:null,globalThis:null,
    navigator:{platform:'Win32',userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',maxTouchPoints:0},
    game:root,canvas,joystickState:{x:0,y:0},
    started:true,dead:false,dashCd:0,dashQueued:false,
    stopJoy(){stopJoyCalls++;},attack(){attackCalls++;},
    updateUI(){baseUpdateCalls++;},
    requestAnimationFrame(fn){rafCalls++;return 1;},ResizeObserver,
    matchMedia(query){return query.includes('pointer')?fineMedia:hoverMedia;},
    addEventListener(type,fn,opts){winEvents.addEventListener(type,fn,opts);},
    ABYSSAL_SHELL_V1:{blocksGameInput(){return false;}},
    ABYSSAL_INTERACTION_V12:{triggerContextInteraction(){contextCalls++;return true;}},
  };
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  return{
    sandbox,docEvents,winEvents,fineMedia,hoverMedia,toggle,close,panel,
    run(){vm.runInContext(moduleSource,sandbox,{filename:'modules/input/platform-inventory-v19.js'});},
    setReady(value){ready=!!value;},
    key(code,{repeat=false,target={tagName:'DIV'}}={}){const event={code,repeat,target,prevented:false,preventDefault(){this.prevented=true;}};docEvents.emit('keydown',event);return event;},
    stats:()=>({resizeObservers,rafCalls,baseUpdateCalls,attackCalls,contextCalls,stopJoyCalls})
  };
}

// A pre-DOM evaluation may expose helper functions but must not permanently block a later valid install.
const delayed=makeHarness(false);
delayed.run();
assert.ok(delayed.sandbox.ABYSSAL_PLATFORM_V19,'helpers should still be available before gameplay DOM is ready');
assert.equal(delayed.sandbox.ABYSSAL_PLATFORM_V19.bound,false,'pre-DOM attempt must not claim listener ownership');
delayed.setReady(true);
delayed.run();
assert.equal(delayed.sandbox.ABYSSAL_PLATFORM_V19.bound,true,'later retry must install once when gameplay DOM becomes ready');
assert.equal(delayed.docEvents.count('keydown'),1);
assert.equal(delayed.winEvents.count('resize'),1);

const h=makeHarness(true);
h.run();
const api=h.sandbox.ABYSSAL_PLATFORM_V19;
const installedUpdateUI=h.sandbox.updateUI;
assert.equal(api.bound,true,'first ready evaluation must claim platform listener ownership');
assert.equal(api.reentryCount,0);
assert.equal(h.docEvents.count('keydown'),1);assert.equal(h.docEvents.count('keyup'),1);assert.equal(h.docEvents.count('focusin'),1);
assert.equal(h.winEvents.count('blur'),1);assert.equal(h.winEvents.count('resize'),1);
assert.equal(h.fineMedia.count('change'),1);assert.equal(h.hoverMedia.count('change'),1);
assert.equal(h.toggle.count('click'),1);assert.equal(h.close.count('click'),1);
assert.equal(h.stats().resizeObservers,1);

for(let i=0;i<50;i++)h.run();
assert.equal(h.sandbox.ABYSSAL_PLATFORM_V19,api,'retry evaluation must preserve platform API identity');
assert.equal(h.sandbox.updateUI,installedUpdateUI,'retry evaluation must not wrap updateUI again');
assert.equal(api.reentryCount,50,'retry count must remain observable');
assert.equal(h.docEvents.count('keydown'),1);assert.equal(h.docEvents.count('keyup'),1);assert.equal(h.docEvents.count('focusin'),1);
assert.equal(h.winEvents.count('blur'),1);assert.equal(h.winEvents.count('resize'),1);
assert.equal(h.fineMedia.count('change'),1);assert.equal(h.hoverMedia.count('change'),1);
assert.equal(h.toggle.count('click'),1);assert.equal(h.close.count('click'),1);
assert.equal(h.stats().resizeObservers,1,'50 retries must not create new ResizeObservers');

// One physical key event remains one semantic action after 50 whole-script retries.
const e=h.key('KeyE');
assert.equal(e.prevented,true);assert.equal(h.stats().contextCalls,1,'PC E must trigger canonical context interaction once');
const space=h.key('Space');
assert.equal(space.prevented,true);assert.equal(h.stats().attackCalls,1,'PC Space must invoke attack once');
const shift=h.key('ShiftLeft');
assert.equal(shift.prevented,true);assert.equal(h.sandbox.dashCd,1.35);assert.equal(h.sandbox.dashQueued,true);

// One inventory button click must toggle once, not open and immediately close through duplicated listeners.
assert.equal(api.panelOpen,false);
h.toggle.emit('click');
assert.equal(api.panelOpen,true,'one inventory click must open the panel exactly once');

// Existing updateUI contract remains one canonical call through one wrapper.
h.sandbox.updateUI();
assert.equal(h.stats().baseUpdateCalls,1,'one UI update must reach canonical updateUI once');

console.log(JSON.stringify({ok:true,retries:50,documentListeners:h.docEvents.total(),windowListeners:h.winEvents.total(),mediaListeners:2,resizeObservers:h.stats().resizeObservers,pcInteractCalls:1,pcAttackCalls:1,inventoryToggle:'single',updateUI:'single-wrapper',delayedDomRetry:'pass',rootModuleByteEquivalent:true}));
