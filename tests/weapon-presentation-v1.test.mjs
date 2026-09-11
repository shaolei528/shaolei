import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../modules/combat/weapon-presentation-v1.js',import.meta.url),'utf8');
const boot=fs.readFileSync(new URL('../survival-v21.html',import.meta.url),'utf8');
const playerCombat=fs.readFileSync(new URL('../modules/combat/player-combat.js',import.meta.url),'utf8');

for(const forbidden of ['zoneCh.send','new WebSocket(','RELAY_URL','STORAGE_KEY','localStorage','setInterval(','requestAnimationFrame(','ctx.rotate(','ctx.arc(']){
  assert.equal(source.includes(forbidden),false,`weapon presentation must stay local/presentation-only: ${forbidden}`);
}
assert.ok(source.includes('ctx.fillRect('),'knife must be rendered from crisp pixel blocks');
assert.ok(source.includes('ctx.imageSmoothingEnabled=false'),'weapon renderer must explicitly keep pixel smoothing disabled');
assert.ok(source.includes('attackProgress(flash'),'weapon swing must derive from existing attack flash state');
assert.equal(source.includes('let attack'),false,'weapon presentation must not create an independent attack timer');

assert.ok(playerCombat.includes('attackCd=inventory.knife?.32:.48'),'attack cooldown must remain unchanged');
assert.ok(playerCombat.includes('range:inventory.knife?80:62'),'attack range must remain unchanged');
assert.ok(playerCombat.includes('damage:inventory.knife?22:11'),'attack damage must remain unchanged');
assert.ok(playerCombat.includes("if(inCamp()){toast('Weapons stay lowered inside Safe Camp.');return}"),'Safe Camp attack restriction must remain unchanged');

const hitIndex=boot.indexOf("'modules/combat/hit-feedback.js'");
const weaponIndex=boot.indexOf("'modules/combat/weapon-presentation-v1.js'");
assert.ok(hitIndex>=0&&weaponIndex>hitIndex,'weapon presentation must load after existing hit feedback');

let baseDraws=0,baseAttacks=0;
let rects=[],order=[];
const sandbox={
  console,
  window:null,
  SESSION_ID:'self',
  inventory:{knife:true},
  attackFlash:0,
  sx:x=>x,
  sy:y=>y,
  directionRow(dir){
    const x=Math.cos(dir),y=Math.sin(dir);
    if(Math.abs(y)>Math.abs(x))return y>0?0:3;
    return x<0?1:2;
  },
  onAttack(){baseAttacks++;},
  drawPlayer(){baseDraws++;order.push('base');},
  ctx:{
    imageSmoothingEnabled:true,
    globalAlpha:1,
    fillStyle:'',
    save(){},
    restore(){},
    fillRect(x,y,w,h){rects.push([x,y,w,h]);order.push('pixel');}
  }
};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'weapon-presentation-v1.js'});

const api=sandbox.ABYSSAL_WEAPON_PRESENTATION_V1;
assert.ok(api,'weapon presentation API must be exposed');
assert.equal(api.version,1,'weapon presentation API version mismatch');
assert.equal(api.classifyAttackWeapon({range:80,damage:22}),'knife','existing knife attack payload must classify as knife');
assert.equal(api.classifyAttackWeapon({range:62,damage:11}),'unarmed','existing unarmed attack payload must stay unarmed');

assert.equal(api.attackProgress(.15),0,'fresh attack flash must start at progress 0');
assert.ok(api.attackProgress(.075)>.49&&api.attackProgress(.075)<.51,'half flash duration must map to half swing progress');
assert.equal(api.attackProgress(0),1,'expired attack flash must finish the presentation');
const anticipation=api.swingOffset(.10),slash=api.swingOffset(.55),recovery=api.swingOffset(.92);
assert.ok(anticipation<-.5,'early swing must visibly pull back for anticipation');
assert.ok(slash>anticipation+.6,'middle swing must travel through the slash arc');
assert.ok(recovery>0&&recovery<1.02,'late swing must settle into recovery');

function drawLocal(dir,flash,knife=true){
  sandbox.inventory.knife=knife;
  sandbox.attackFlash=flash;
  rects=[];order=[];
  sandbox.drawPlayer({id:'self',x:100,y:100,dir,attack:0},true);
  return{rects:[...rects],order:[...order]};
}

{
  const idle=drawLocal(0,0,true);
  assert.ok(idle.rects.length>=20,'equipped local survivor must visibly hold a pixel knife while idle/moving');
  assert.equal(idle.order[0],'base','east-facing idle knife should render over the player for readability');
}
{
  const northIdle=drawLocal(-Math.PI/2,0,true);
  assert.equal(northIdle.order[0],'pixel','north-facing idle knife should render behind the player body');
  assert.ok(northIdle.order.includes('base'),'north-facing layering must still draw the base player');
}
{
  const unarmed=drawLocal(0,0,false);
  assert.equal(unarmed.rects.length,0,'unarmed player must not receive a fake knife');
}

const phaseSignatures=[];
for(const flash of [.14,.075,.01]){
  const frame=drawLocal(0,flash,true);
  assert.ok(frame.rects.length>=20,'knife attack phase must render the weapon itself');
  phaseSignatures.push(JSON.stringify(frame.rects.slice(-8)));
}
assert.equal(new Set(phaseSignatures).size,3,'anticipation, slash and recovery must produce visibly different knife positions');

const directionSignatures=[];
for(const dir of [0,Math.PI/2,Math.PI,-Math.PI/2]){
  const frame=drawLocal(dir,.075,true);
  directionSignatures.push(JSON.stringify(frame.rects.slice(-8)));
  const offset=api.swingAngle(dir,.075)-dir;
  assert.ok(Math.abs(offset-api.swingOffset(.5))<1e-9,'swing orientation must preserve the player facing direction');
}
assert.equal(new Set(directionSignatures).size,4,'all four facing directions must render distinct weapon orientations');

{
  const before=baseAttacks;
  sandbox.onAttack({id:'remote-knife',range:80,damage:22,dir:0});
  assert.equal(baseAttacks,before+1,'weapon wrapper must call existing remote attack handling exactly once');
  assert.equal(api.remoteWeapon('remote-knife'),'knife','remote knife hint must derive from existing attack payload');
  rects=[];order=[];
  sandbox.drawPlayer({id:'remote-knife',x:120,y:120,dir:Math.PI/2,attack:.14},false);
  assert.ok(rects.length>=20,'remote knife attack must show the same visible weapon presentation');
}
{
  sandbox.onAttack({id:'remote-unarmed',range:62,damage:11,dir:0});
  assert.equal(api.remoteWeapon('remote-unarmed'),'unarmed','remote unarmed attack must not be mistaken for a knife');
  rects=[];order=[];
  sandbox.drawPlayer({id:'remote-unarmed',x:120,y:120,dir:0,attack:.14},false);
  assert.equal(rects.length,0,'remote unarmed attack must not render a knife');
}

const flashBefore=sandbox.attackFlash=.08;
drawLocal(0,flashBefore,true);
assert.equal(sandbox.attackFlash,flashBefore,'rendering must not mutate authoritative attack timing state');
assert.ok(baseDraws>=10,'weapon wrapper must preserve the existing player renderer');

console.log(JSON.stringify({
  ok:true,
  knifeIdle:'visible',
  attackPhases:'anticipation+slash+recovery',
  directions:4,
  remoteKnife:'existing-payload-derived',
  unarmed:'distinct',
  timers:'unchanged',
  network:'unchanged',
  saveSchema:'unchanged',
  pixelRendering:'fillRect-snapped'
}));
