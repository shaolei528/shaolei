import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../modules/combat/hit-feedback.js',import.meta.url),'utf8');
const boot=fs.readFileSync(new URL('../survival-v21.html',import.meta.url),'utf8');
const playerCombat=fs.readFileSync(new URL('../modules/combat/player-combat.js',import.meta.url),'utf8');

for(const forbidden of ['zoneCh.send','new WebSocket(','RELAY_URL',"event:'attack'","event:'mob_hit'",'STORAGE_KEY']){
  assert.equal(source.includes(forbidden),false,`hit feedback must stay local-only: ${forbidden}`);
}
assert.ok(playerCombat.includes('attackCd=inventory.knife?.32:.48'),'attack cooldown must remain unchanged');
assert.ok(playerCombat.includes('range:inventory.knife?80:62'),'attack range must remain unchanged');
assert.ok(playerCombat.includes('damage:inventory.knife?22:11'),'attack damage must remain unchanged');

const regressionIndex=boot.indexOf("'modules/ui/regression-v14.js'");
const fxIndex=boot.indexOf("'modules/combat/hit-feedback.js'");
assert.ok(regressionIndex>=0&&fxIndex>regressionIndex,'hit feedback must load after existing runtime patches');

let now=1000,vibrations=0,baseMobDraws=0,basePlayerDraws=0,baseLightingDraws=0,fillRects=0,strokeRects=0,arcs=0;
const sandbox={
  console,window:null,globalThis:null,
  performance:{now:()=>now},
  navigator:{vibrate(ms){vibrations+=ms;return true;}},
  SESSION_ID:'self',
  mobs:[{id:'m1',x:50,y:60,hp:30}],
  me:{hp:100},
  attackFlash:.15,
  handleMobAttack(){sandbox.mobs[0].hp-=10;},
  onMobs(p){sandbox.mobs=(p?.mobs||[]).map(m=>({...m}));},
  onMobHit(){sandbox.me.hp-=4;},
  onAttack(){sandbox.me.hp-=2;},
  drawMobs(){baseMobDraws++;},
  drawPlayer(){basePlayerDraws++;},
  drawLighting(){baseLightingDraws++;},
  sx:x=>x,sy:y=>y,
  ctx:{
    imageSmoothingEnabled:true,globalAlpha:1,fillStyle:'',strokeStyle:'',lineWidth:1,
    save(){},restore(){},beginPath(){},stroke(){},fillRect(){fillRects++;},strokeRect(){strokeRects++;},arc(){arcs++;}
  }
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'hit-feedback.js'});

sandbox.handleMobAttack({id:'self'});
assert.equal(sandbox.mobs[0].hp,20,'base mob damage logic must still run');
assert.equal(sandbox.ABYSSAL_HIT_FEEDBACK.sparks.length,1,'confirmed local mob damage should create one hit spark');
assert.equal(vibrations,14,'confirmed local hit may use one short haptic pulse');

sandbox.drawMobs(360,600);
assert.equal(baseMobDraws,1,'base mob renderer must still run');
assert.ok(fillRects>=5,'hit spark should add pixel feedback');

sandbox.drawPlayer({x:10,y:20,dir:0,attack:.14},false);
assert.equal(basePlayerDraws,1,'base player renderer must still run');
assert.ok(arcs>=2,'attack trail should add layered arcs');

sandbox.onMobHit({});
assert.equal(sandbox.me.hp,96,'base incoming mob damage must still run');
sandbox.drawLighting(360,600);
assert.equal(baseLightingDraws,1,'base lighting renderer must still run');
assert.ok(strokeRects>=1,'taking damage should add a short local damage border');

now+=250;
sandbox.drawLighting(360,600);
assert.equal(strokeRects,1,'damage border must expire without changing gameplay state');

console.log(JSON.stringify({ok:true,network:'unchanged',damage:'unchanged',range:'unchanged',cooldown:'unchanged',hitSpark:'pass',swingTrail:'pass',hurtFlash:'pass',haptics:'local-only'}));
