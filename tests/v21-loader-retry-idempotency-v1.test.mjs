import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../survival-v21.html',import.meta.url),'utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match,'V21 inline boot script must exist');
const original=match[1];
const listMatch=original.match(/const files=\[([\s\S]*?)\];for\(const name of files\)/);
assert.ok(listMatch,'V21 module list must remain discoverable');
const modules=[...listMatch[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
assert.ok(modules.length>30,'expected the full V21 module list');

const failureTarget='modules/safe-camp/game-v7-patch.js';
const failureIndex=modules.indexOf(failureTarget);
assert.ok(failureIndex>0,'failure target must be after successful prefix modules');
assert.ok(modules.slice(0,failureIndex).includes('modules/main-loop/legacy-scheduler.js'),'failure injection must occur after scheduler startup');
assert.ok(modules.slice(0,failureIndex).includes('modules/input/joystick.js'),'failure injection must occur after input listener startup');

const endMarker='mountUI();\n})();';
assert.ok(original.includes(endMarker),'boot test hook marker must exist');
const source=original.replace(endMarker,`window.__V21_BOOT_TEST__={BOOT,loadModules,requestEntry,handoff,setEntry(value){enter=value;},setName(value){nameInput=value;}};\n})();`);

const attempts=new Map(),executions=new Map();
let schedulerRoots=0,joystickBinds=0,combatInputBinds=0,handoffClicks=0;
const bootEl={innerHTML:''};
const setupEl={textContent:'',style:{},classList:{remove(){},add(){}}};
const enterEl={dataset:{},textContent:'进入安全营地',style:{},disabled:false,addEventListener(){},removeEventListener(){},click(){handoffClicks++;}};
const nameEl={addEventListener(){},removeEventListener(){}};

const document={
  getElementById(id){if(id==='boot')return bootEl;if(id==='setup')return setupEl;if(id==='enter')return enterEl;if(id==='name')return nameEl;return null;},
  createElement(tag){assert.equal(tag,'script');return{async:true,src:'',onload:null,onerror:null,remove(){this.removed=true;}};},
  head:{appendChild(node){
    const name=String(node.src||'').replace(/^\.\//,'').replace(/\?v=.*$/,'');
    const count=(attempts.get(name)||0)+1;attempts.set(name,count);
    queueMicrotask(()=>{
      if(name===failureTarget&&count===1){node.onerror?.(new Error('injected failure'));return;}
      executions.set(name,(executions.get(name)||0)+1);
      if(name==='modules/main-loop/legacy-scheduler.js')schedulerRoots++;
      if(name==='modules/input/joystick.js')joystickBinds++;
      if(name==='modules/combat/player-combat.js')combatInputBinds++;
      node.onload?.();
    });
    return node;
  }}
};

const sandbox={
  window:null,document,console:{log(){},warn(){},error(){}},queueMicrotask,setTimeout,clearTimeout,
  performance:{now:()=>1000},ABYSSAL_CONFIG:{RELAY_URL:'wss://fixture.invalid/ws'}
};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'survival-v21-inline.js'});
const api=sandbox.__V21_BOOT_TEST__,BOOT=sandbox.ABYSSAL_BOOT_V21;
assert.ok(api&&BOOT,'boot test API must be exposed');
api.setEntry(enterEl);api.setName(nameEl);

const event={preventDefault(){this.prevented=(this.prevented||0)+1;},stopImmediatePropagation(){this.stopped=(this.stopped||0)+1;}};
api.requestEntry(event);
const first=BOOT.promise;
assert.ok(first instanceof Promise,'first entry request must create BOOT.promise');
api.requestEntry(event);
const concurrent=BOOT.promise;
assert.strictEqual(concurrent,first,'concurrent entry requests must share the same BOOT.promise');

const firstResult=await first;
assert.equal(firstResult,false,'injected transport failure must leave boot retryable');
assert.equal(BOOT.depsReady,false);assert.equal(BOOT.depsLoading,false);assert.equal(BOOT.promise,null);
assert.equal(BOOT.loadedModules.size,failureIndex,'only modules with successful onload may be remembered');
for(const name of modules.slice(0,failureIndex)){
  assert.equal(attempts.get(name),1,`${name} should be attempted once before failure`);
  assert.equal(executions.get(name),1,`${name} should execute once before failure`);
}
assert.equal(attempts.get(failureTarget),1,'failed module must be attempted on first pass');
assert.equal(executions.get(failureTarget)||0,0,'failed module must not be marked executed/loaded');
for(const name of modules.slice(failureIndex+1))assert.equal(attempts.get(name)||0,0,`${name} must wait for retry after the failure`);
assert.equal(schedulerRoots,1,'failed boot must not create a duplicate scheduler root yet');
assert.equal(joystickBinds,1,'failed boot must not duplicate joystick listener registration');
assert.equal(combatInputBinds,1,'failed boot must not duplicate combat input registration');

api.requestEntry(event);
const retry=BOOT.promise;
assert.ok(retry instanceof Promise&&retry!==first,'retry must create one new boot attempt');
const retryResult=await retry;
await Promise.resolve();
assert.equal(retryResult,true,'retry must complete boot');
assert.equal(BOOT.depsReady,true);assert.equal(BOOT.depsLoading,false);assert.equal(BOOT.promise,null);
assert.equal(BOOT.loadedModules.size,modules.length,'all modules must be remembered after successful retry');
for(const name of modules.slice(0,failureIndex))assert.equal(attempts.get(name),1,`${name} must be skipped on retry`);
assert.equal(attempts.get(failureTarget),2,'the actually failed module must be retried');
assert.equal(executions.get(failureTarget),1,'failed module must execute exactly once after retry succeeds');
for(const name of modules.slice(failureIndex+1)){
  assert.equal(attempts.get(name),1,`${name} must continue normally after retry`);
  assert.equal(executions.get(name),1,`${name} must execute once after retry`);
}
assert.equal(executions.get(modules.at(-1)),1,'the final module must load after recovery');
assert.equal(schedulerRoots,1,'retry must not create a second scheduler/RAF root');
assert.equal(joystickBinds,1,'retry must not duplicate input listener roots');
assert.equal(combatInputBinds,1,'retry must not duplicate combat input roots');
assert.equal(handoffClicks,1,'successful retry must hand off exactly once to the real entry control');

const attemptsAfterSuccess=[...attempts.values()].reduce((a,b)=>a+b,0);
assert.equal(await api.loadModules(),true,'already-ready boot must resolve successfully');
assert.equal([...attempts.values()].reduce((a,b)=>a+b,0),attemptsAfterSuccess,'success boot must not reload any module');
assert.equal(handoffClicks,1,'already-ready loadModules must not repeat handoff');

assert.ok(html.includes('loadedModules:new Set()'),'loader must keep successful module state only for the current page session');
assert.ok(html.includes('if(BOOT.loadedModules.has(name))continue'),'retry must explicitly skip successful modules');
console.log(JSON.stringify({ok:true,failureInjection:`1..${failureIndex} success -> ${failureIndex+1} fail -> retry`,prefixReloads:0,failedModuleAttempts:2,laterModules:'continued',concurrentPromise:'shared',handoffClicks,schedulerRoots,joystickBinds,combatInputBinds,loadedModules:BOOT.loadedModules.size}));
