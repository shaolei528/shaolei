import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const hitSource=fs.readFileSync(new URL('../modules/combat/hit-feedback.js',import.meta.url),'utf8');
const weaponSource=fs.readFileSync(new URL('../modules/combat/weapon-presentation-v1.js',import.meta.url),'utf8');
assert.ok(hitSource.includes('ABYSSAL_HIT_FEEDBACK_RUNTIME_V1'),'hit feedback must expose retry ownership marker');
assert.ok(weaponSource.includes('ABYSSAL_WEAPON_PRESENTATION_RUNTIME_V1'),'weapon presentation must expose retry ownership marker');
for(const [name,source] of [['hit',hitSource],['weapon',weaponSource]]){
  for(const forbidden of ['zoneCh.send','new WebSocket(','fetch(','saveLocal(','localStorage.']){
    assert.equal(source.includes(forbidden),false,`${name} retry hardening must stay presentation-only: ${forbidden}`);
  }
}

let now=1000,safeMode=false,vibrations=0;
const baseCalls={handleMobAttack:0,onMobs:0,onMobHit:0,onAttack:0,drawMobs:0,drawPlayer:0,drawLighting:0};
let fillRects=0,arcs=0,strokeRects=0;
const sandbox={
  console,window:null,globalThis:null,SESSION_ID:'self',
  performance:{now:()=>now},navigator:{vibrate(ms){vibrations+=ms;return true;}},
  mobs:[{id:'m1',kind:'crawler',x:50,y:60,hp:30}],me:{hp:100},inventory:{knife:true},attackFlash:.15,
  sx:x=>x,sy:y=>y,inCamp(){return safeMode;},
  directionRow(dir){const x=Math.cos(dir),y=Math.sin(dir);if(Math.abs(y)>Math.abs(x))return y>0?0:3;return x<0?1:2;},
  handleMobAttack(){baseCalls.handleMobAttack++;sandbox.mobs[0].hp-=10;},
  onMobs(p){baseCalls.onMobs++;if(p?.mobs)sandbox.mobs=p.mobs.map(m=>({...m}));},
  onMobHit(){baseCalls.onMobHit++;sandbox.me.hp-=4;},
  onAttack(){baseCalls.onAttack++;},
  drawMobs(){baseCalls.drawMobs++;},drawPlayer(){baseCalls.drawPlayer++;},drawLighting(){baseCalls.drawLighting++;},
  ctx:{
    imageSmoothingEnabled:true,globalAlpha:1,fillStyle:'',strokeStyle:'',lineWidth:1,
    save(){},restore(){},beginPath(){},stroke(){},
    fillRect(){fillRects++;},strokeRect(){strokeRects++;},arc(){arcs++;}
  }
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);
const runSequence=()=>{
  vm.runInContext(hitSource,sandbox,{filename:'hit-feedback.js'});
  vm.runInContext(weaponSource,sandbox,{filename:'weapon-presentation-v1.js'});
};

runSequence();
const hitApi=sandbox.ABYSSAL_HIT_FEEDBACK;
const hitRuntime=sandbox.ABYSSAL_HIT_FEEDBACK_RUNTIME_V1;
const weaponApi=sandbox.ABYSSAL_WEAPON_PRESENTATION_V1;
const weaponRuntime=sandbox.ABYSSAL_WEAPON_PRESENTATION_RUNTIME_V1;
const installed={
  handleMobAttack:sandbox.handleMobAttack,onMobs:sandbox.onMobs,onMobHit:sandbox.onMobHit,onAttack:sandbox.onAttack,
  drawMobs:sandbox.drawMobs,drawPlayer:sandbox.drawPlayer,drawLighting:sandbox.drawLighting
};
assert.equal(hitRuntime?.bound,true);assert.equal(weaponRuntime?.bound,true);

for(let i=0;i<50;i++)runSequence();
assert.equal(sandbox.ABYSSAL_HIT_FEEDBACK,hitApi,'hit feedback API object must survive retries');
assert.equal(sandbox.ABYSSAL_WEAPON_PRESENTATION_V1,weaponApi,'weapon API object must survive retries');
assert.equal(sandbox.ABYSSAL_HIT_FEEDBACK_RUNTIME_V1,hitRuntime,'hit runtime marker identity must survive retries');
assert.equal(sandbox.ABYSSAL_WEAPON_PRESENTATION_RUNTIME_V1,weaponRuntime,'weapon runtime marker identity must survive retries');
assert.equal(hitRuntime.reentryCount,50);assert.equal(weaponRuntime.reentryCount,50);
for(const [name,fn] of Object.entries(installed))assert.equal(sandbox[name],fn,`${name} wrapper identity must remain stable`);

// One confirmed local hit remains one canonical damage mutation, one spark/impact and one haptic pulse.
sandbox.mobs=[{id:'m1',kind:'crawler',x:50,y:60,hp:30}];
hitApi.sparks.length=0;hitApi.impacts.length=0;vibrations=0;
sandbox.handleMobAttack({id:'self'});
assert.equal(baseCalls.handleMobAttack,1);assert.equal(sandbox.mobs[0].hp,20);
assert.equal(hitApi.sparks.length,1,'retry must not duplicate hit sparks');
assert.equal(hitApi.impacts.length,1,'retry must not duplicate hit impacts');
assert.equal(vibrations,14,'retry must not duplicate local haptic pulse');

// Weapon hint wrapper remains single-owned and still calls canonical remote attack handling once.
sandbox.onAttack({id:'remote-knife',range:80,damage:22,dir:0});
assert.equal(baseCalls.onAttack,1,'weapon/onAttack wrapper chain must reach base exactly once');
assert.equal(weaponApi.remoteWeapon('remote-knife'),'knife');

// Combined hit trail + weapon player render chain stays single-owned.
fillRects=0;arcs=0;safeMode=false;sandbox.attackFlash=.14;
sandbox.drawPlayer({id:'self',x:100,y:100,dir:0,attack:0},true);
assert.equal(baseCalls.drawPlayer,1,'combined player presentation wrappers must call base renderer once');
assert.equal(arcs,2,'attack trail should render one two-layer arc set after retries');
assert.ok(fillRects>=20,'Bone Knife should render once through the stable weapon wrapper');

// Mob and lighting render wrappers also remain one layer deep.
fillRects=0;sandbox.drawMobs(360,600);
assert.equal(baseCalls.drawMobs,1,'hit FX mob wrapper must call base renderer once');
assert.ok(fillRects>=5,'one confirmed hit should still render its pixel feedback');

sandbox.me.hp=100;strokeRects=0;
sandbox.onMobHit({target:'self'});
assert.equal(baseCalls.onMobHit,1);assert.equal(sandbox.me.hp,96);
sandbox.drawLighting(360,600);
assert.equal(baseCalls.drawLighting,1,'hurt overlay wrapper must call base lighting once');
assert.equal(strokeRects,1,'hurt border must render once after retries');

console.log(JSON.stringify({ok:true,retries:50,hitWrappers:'stable',weaponWrappers:'stable',baseCalls:'single',spark:1,impact:1,hapticMs:14,attackTrailArcs:2,hurtBorder:1}));
