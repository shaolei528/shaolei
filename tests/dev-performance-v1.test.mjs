import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../modules/core/dev-performance-v1.js',import.meta.url),'utf8');
for(const forbidden of ['setInterval(','zoneCh','WebSocket','localStorage','saveLocal','inventory.','me.hp']){
  assert.equal(source.includes(forbidden),false,`performance overlay must stay observational/dev-only: ${forbidden}`);
}
assert.ok(source.includes("params.get('devperf')==='1'"),'overlay must require explicit ?devperf=1 opt-in');

function run(search){
  let created=0,appended=0,raf=null,keydown=null;
  const overlay={id:'',textContent:'',style:{},setAttribute(){}};
  const sandbox={
    URLSearchParams,
    location:{search},
    performance:{now:()=>0},
    requestAnimationFrame(fn){raf=fn;return 1;},
    document:{
      createElement(){created++;return overlay;},
      body:{appendChild(){appended++;}},
      addEventListener(type,fn){if(type==='keydown')keydown=fn;}
    },
    window:null,globalThis:null
  };
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'dev-performance-v1.js'});
  return{sandbox,overlay,get created(){return created;},get appended(){return appended;},get raf(){return raf;},get keydown(){return keydown;}};
}

const normal=run('');
assert.equal(normal.sandbox.ABYSSAL_PERF_V1.enabled,false);
assert.equal(normal.created,0,'normal players must not get an overlay DOM node');
assert.equal(normal.raf,null,'normal players must not start an extra RAF sampler');

const dev=run('?devperf=1');
assert.equal(dev.sandbox.ABYSSAL_PERF_V1.enabled,true);
assert.equal(dev.created,1);assert.equal(dev.appended,1);
assert.equal(typeof dev.raf,'function');
for(let now=16;now<=560;now+=16){const frame=dev.raf;frame(now);}
assert.match(dev.overlay.textContent,/DEV PERF/);
assert.match(dev.overlay.textContent,/FPS \d/);
assert.match(dev.overlay.textContent,/AVG \d/);
assert.match(dev.overlay.textContent,/P95 \d/);
assert.ok(dev.sandbox.ABYSSAL_PERF_V1.fps>0);
assert.ok(dev.sandbox.ABYSSAL_PERF_V1.avgFrameMs>0);
assert.ok(dev.sandbox.ABYSSAL_PERF_V1.p95FrameMs>0);
let prevented=0;dev.keydown?.({code:'F3',preventDefault(){prevented++;}});
assert.equal(prevented,1);assert.equal(dev.sandbox.ABYSSAL_PERF_V1.visible,false);assert.equal(dev.overlay.style.display,'none');

console.log(JSON.stringify({ok:true,gate:'?devperf=1',normalPath:'zero-overlay-raf',metrics:['fps','avgFrameMs','p95FrameMs'],toggle:'F3'}));
