import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../smooth-motion-v18.js',import.meta.url),'utf8');

function makeHarness(){
  let now=0;
  const sandbox={
    console,
    window:null,
    performance:{now:()=>now},
    SESSION_ID:'self',
    currentZone:'1:1',
    clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
    me:{x:0,y:0,dir:0},
    camera:{x:0,y:0},
    remotes:new Map()
  };

  sandbox.update=function(dt){
    sandbox.me.x+=100*dt;
    for(const r of sandbox.remotes.values()){
      r.x=r.x+(r.tx-r.x)*.19;
      r.y=r.y+(r.ty-r.y)*.19;
    }
  };
  sandbox.draw=function(){};
  sandbox.onMove=function(payload){
    if(!payload||payload.id==='self'||payload.zone!=='1:1')return;
    let r=sandbox.remotes.get(payload.id);
    if(!r){
      r={id:payload.id,x:Number(payload.x)||0,y:Number(payload.y)||0,tx:Number(payload.x)||0,ty:Number(payload.y)||0,dir:0,moving:false};
      sandbox.remotes.set(payload.id,r);
    }
    r.tx=Number(payload.x)||0;
    r.ty=Number(payload.y)||0;
    r.dir=Number(payload.dir)||0;
  };

  sandbox.window=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:'smooth-motion-v18.js'});
  return {
    sandbox,
    setNow(v){now=v;},
    advance(ms){now+=ms;sandbox.draw();return now;}
  };
}

function simulateLocal(fps,seconds=2){
  const h=makeHarness();
  const frameMs=1000/fps;
  const frames=Math.round(fps*seconds);
  for(let i=0;i<frames;i++)h.advance(frameMs);
  return h.sandbox.me.x;
}

const p30=simulateLocal(30);
const p60=simulateLocal(60);
const p120=simulateLocal(120);
assert.ok(Math.abs(p30-p60)<0.01,`30/60Hz local distance diverged: ${p30} vs ${p60}`);
assert.ok(Math.abs(p60-p120)<0.01,`60/120Hz local distance diverged: ${p60} vs ${p120}`);

{
  const h=makeHarness();
  h.sandbox.update(.033);
  assert.equal(h.sandbox.me.x,0,'legacy 33ms update must be blocked outside RAF');
  h.advance(16.6667);
  assert.ok(h.sandbox.me.x>0,'RAF update must advance local predicted movement');
  assert.equal(h.sandbox.camera.x,h.sandbox.me.x,'camera must track predicted local x exactly');
  assert.equal(h.sandbox.camera.y,h.sandbox.me.y,'camera must track predicted local y exactly');
  assert.ok(h.sandbox.ABYSSAL_MOTION_V18.legacyTicksBlocked>=1,'blocked legacy tick must be recorded');
}

{
  const h=makeHarness();
  h.setNow(0);
  h.sandbox.onMove({id:'remote',zone:'1:1',x:0,y:0,dir:0,seq:1});
  h.setNow(100);
  h.sandbox.onMove({id:'remote',zone:'1:1',x:10,y:0,dir:0,seq:2});
  h.setNow(200);
  h.sandbox.onMove({id:'remote',zone:'1:1',x:20,y:0,dir:0,seq:3});
  h.setNow(250);
  h.sandbox.draw();
  const remote=h.sandbox.remotes.get('remote');
  assert.ok(remote,'remote player should exist');
  assert.ok(Math.abs(remote.x-15)<0.01,`snapshot interpolation expected x≈15, got ${remote.x}`);
}

{
  const h=makeHarness();
  const arrivals=[[0,0],[70,7],[190,19],[260,26],[410,41],[500,50]];
  let arrivalIndex=0;
  let lastX=-Infinity;
  for(let t=0;t<=650;t+=1000/60){
    h.setNow(t);
    while(arrivalIndex<arrivals.length&&arrivals[arrivalIndex][0]<=t){
      const [at,x]=arrivals[arrivalIndex++];
      h.setNow(at);
      h.sandbox.onMove({id:'remote',zone:'1:1',x,y:0,dir:0,seq:arrivalIndex});
      h.setNow(t);
    }
    h.sandbox.draw();
    const remote=h.sandbox.remotes.get('remote');
    if(remote){
      assert.ok(remote.x+0.001>=lastX,`jitter buffer moved remote backwards: ${lastX} -> ${remote.x}`);
      lastX=remote.x;
    }
  }
}

{
  const h=makeHarness();
  h.setNow(0);
  h.sandbox.onMove({id:'self',zone:'1:1',x:999,y:999,seq:1});
  assert.equal(h.sandbox.remotes.has('self'),false,'self move must never create a remote correction target');
}

console.log(JSON.stringify({ok:true,p30,p60,p120,mode:'client-prediction',remote:'snapshot-buffer'}));
