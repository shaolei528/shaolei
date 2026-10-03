import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const rootSource=fs.readFileSync(new URL('../smooth-motion-v18.js',import.meta.url),'utf8');
const moduleSource=fs.readFileSync(new URL('../modules/main-loop/smooth-motion-v18.js',import.meta.url),'utf8');
assert.equal(moduleSource,rootSource,'root and categorized V18 motion sources must remain byte-identical');
assert.ok(moduleSource.includes('reentryCount'),'V18 motion must expose retry observability');

let now=0;
const baseCalls={update:0,draw:0,onMove:0};
const sandbox={
  console,window:null,performance:{now:()=>now},SESSION_ID:'self',currentZone:'1:1',
  WORLD:{w:1000,h:1000},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  me:{x:0,y:0,dir:0},camera:{x:0,y:0},remotes:new Map(),
  validMove(p){return !!(p&&p.id&&p.id!=='self'&&p.zone===sandbox.currentZone&&Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.y)));},
  update(dt){baseCalls.update++;sandbox.me.x+=100*dt;},
  draw(){baseCalls.draw++;},
  onMove(payload){
    baseCalls.onMove++;
    if(!sandbox.validMove(payload))return;
    const x=sandbox.clamp(Number(payload.x),0,sandbox.WORLD.w),y=sandbox.clamp(Number(payload.y),0,sandbox.WORLD.h);
    let r=sandbox.remotes.get(payload.id);
    if(!r){r={id:payload.id,x,y,tx:x,ty:y,dir:0,moving:false};sandbox.remotes.set(payload.id,r);}
    r.tx=x;r.ty=y;r.dir=Number(payload.dir)||0;
  },
};
sandbox.window=sandbox;
vm.createContext(sandbox);
const run=()=>vm.runInContext(moduleSource,sandbox,{filename:'modules/main-loop/smooth-motion-v18.js'});

run();
const motion=sandbox.ABYSSAL_MOTION_V18;
const installed={update:sandbox.update,draw:sandbox.draw,onMove:sandbox.onMove};
assert.equal(motion?.active,true,'first evaluation must activate V18 motion');
assert.equal(motion?.reentryCount,0,'first evaluation must start with zero retries');

for(let i=0;i<50;i++)run();
assert.equal(sandbox.ABYSSAL_MOTION_V18,motion,'retry evaluation must preserve the original motion API/state object');
assert.equal(motion.reentryCount,50,'retry count must remain observable');
for(const [name,fn] of Object.entries(installed))assert.equal(sandbox[name],fn,`${name} wrapper identity must remain stable after retries`);

// Legacy interval call remains blocked exactly at the installed wrapper and never reaches canonical update.
sandbox.update(.033);
assert.equal(baseCalls.update,0,'legacy update outside render ownership must remain blocked');
assert.equal(motion.legacyTicksBlocked,1,'one legacy update call must be counted once after retries');

// One draw after retries advances canonical simulation exactly once and renders exactly once.
now=16.6667;
sandbox.draw();
assert.equal(baseCalls.update,1,'one rendered frame must execute canonical update once');
assert.equal(baseCalls.draw,1,'one rendered frame must execute canonical draw once');
assert.equal(motion.frames,1,'one rendered frame must increment motion frame counter once');
assert.ok(sandbox.me.x>0,'predicted local movement must still advance');
assert.equal(sandbox.camera.x,sandbox.me.x,'camera must still lock to predicted local x');
assert.equal(sandbox.camera.y,sandbox.me.y,'camera must still lock to predicted local y');

// One accepted network move remains one canonical handler call and one visible snapshot entry.
now=100;
sandbox.onMove({id:'remote',zone:'1:1',x:40,y:20,dir:0,seq:1});
assert.equal(baseCalls.onMove,1,'one move packet must reach canonical network handler once');
const buffer=motion.remoteSnapshots.get('remote');
assert.equal(buffer?.length,1,'one accepted move packet must create one snapshot in the installed motion state');
assert.equal(buffer?.[0]?.x,40);assert.equal(buffer?.[0]?.y,20);

// A second frame preserves the original motion algorithm rather than multiplying wrapper work roots.
now=116.6667;
sandbox.draw();
assert.equal(baseCalls.update,2);assert.equal(baseCalls.draw,2);assert.equal(motion.frames,2);

console.log(JSON.stringify({ok:true,retries:50,wrapperIdentity:'stable',canonicalUpdatePerFrame:1,canonicalDrawPerFrame:1,canonicalOnMovePerPacket:1,snapshotsPerPacket:1,rootModuleByteEquivalent:true}));
