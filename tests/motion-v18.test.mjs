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
    WORLD:{w:1000,h:1000},
    clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
    me:{x:0,y:0,dir:0},
    camera:{x:0,y:0},
    remotes:new Map()
  };

  sandbox.validMove=function(p){
    return !!(p&&p.id&&p.id!=='self'&&p.zone===sandbox.currentZone&&Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.y)));
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
    if(!sandbox.validMove(payload))return;
    const x=sandbox.clamp(Number(payload.x),0,sandbox.WORLD.w);
    const y=sandbox.clamp(Number(payload.y),0,sandbox.WORLD.h);
    let r=sandbox.remotes.get(payload.id);
    if(!r){
      r={id:payload.id,x,y,tx:x,ty:y,dir:0,moving:false};
      sandbox.remotes.set(payload.id,r);
    }
    r.tx=x;
    r.ty=y;
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
  const delayed=[[0,0],[320,32],[690,69],[1040,104]];
  let i=0;
  let lastX=-Infinity;
  for(let t=0;t<=1250;t+=1000/60){
    h.setNow(t);
    while(i<delayed.length&&delayed[i][0]<=t){
      const [at,x]=delayed[i++];
      h.setNow(at);
      h.sandbox.onMove({id:'remote-lag',zone:'1:1',x,y:0,dir:0,seq:i});
      h.setNow(t);
    }
    h.sandbox.draw();
    const remote=h.sandbox.remotes.get('remote-lag');
    if(remote){
      assert.ok(Number.isFinite(remote.x),'high-latency simulation produced non-finite position');
      assert.ok(remote.x+0.001>=lastX,`high-latency interpolation moved backwards: ${lastX} -> ${remote.x}`);
      lastX=remote.x;
    }
  }
  const remote=h.sandbox.remotes.get('remote-lag');
  assert.ok(remote.x<=112,'high-latency extrapolation exceeded the 80ms safety cap');
}

{
  const h=makeHarness();
  h.setNow(0);
  h.sandbox.onMove({id:'remote-bound',zone:'1:1',x:999999,y:-500,dir:0,seq:1});
  h.setNow(120);
  h.sandbox.draw();
  const remote=h.sandbox.remotes.get('remote-bound');
  assert.ok(remote,'bounded remote player should exist');
  assert.equal(remote.tx,1000,'base movement handler should clamp x to WORLD.w');
  assert.equal(remote.ty,0,'base movement handler should clamp y to zero');
  assert.equal(remote.x,1000,'snapshot renderer must use canonical clamped x');
  assert.equal(remote.y,0,'snapshot renderer must use canonical clamped y');
}

{
  const h=makeHarness();
  h.setNow(0);
  h.sandbox.onMove({id:'remote-zone',zone:'1:1',x:40,y:40,dir:0,seq:10});
  h.setNow(100);
  h.sandbox.onMove({id:'remote-zone',zone:'1:1',x:60,y:40,dir:0,seq:11});
  h.sandbox.currentZone='2:2';
  h.sandbox.remotes.clear();
  h.setNow(180);
  h.sandbox.onMove({id:'remote-zone',zone:'2:2',x:700,y:700,dir:1,seq:1});
  h.setNow(220);
  h.sandbox.draw();
  const remote=h.sandbox.remotes.get('remote-zone');
  const buffer=h.sandbox.ABYSSAL_MOTION_V18.remoteSnapshots.get('remote-zone');
  assert.ok(remote,'same player id should be recreated in the new zone');
  assert.equal(remote.x,700,'old-zone snapshot must not pull the player back after zone switch');
  assert.equal(remote.y,700,'old-zone snapshot must not contaminate new-zone y');
  assert.equal(buffer?.at(-1)?.zone,'2:2','snapshot buffer must belong to the current zone');
  assert.equal(buffer?.at(-1)?.seq,1,'new-zone sequence must not be rejected by old-zone sequence history');
}

{
  const h=makeHarness();
  h.setNow(0);
  h.sandbox.onMove({id:'self',zone:'1:1',x:999,y:999,seq:1});
  assert.equal(h.sandbox.remotes.has('self'),false,'self move must never create a remote correction target');
}

console.log(JSON.stringify({ok:true,p30,p60,p120,mode:'client-prediction',remote:'snapshot-buffer',highLatency:'simulated-pass',boundedSnapshots:'pass',zoneIsolation:'pass'}));
