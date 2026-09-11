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
assert.equal(/steel/i.test(source),false,'Bone Knife renderer must not describe or palette the weapon as steel');
assert.ok(source.includes("weaponName:'Bone Knife'"),'presentation identity must match the crafting/inventory Bone Knife');

assert.ok(playerCombat.includes("attackBtn.addEventListener('pointerdown',()=>attack())"),'mobile attack must dynamically resolve the current attack wrapper');
assert.ok(playerCombat.includes('attackCd=inventory.knife?.32:.48'),'attack cooldown must remain unchanged');
assert.ok(playerCombat.includes('range:inventory.knife?80:62'),'attack range must remain unchanged');
assert.ok(playerCombat.includes('damage:inventory.knife?22:11'),'attack damage must remain unchanged');
assert.ok(playerCombat.includes("if(inCamp()){toast('Weapons stay lowered inside Safe Camp.');return}"),'Safe Camp attack restriction must remain unchanged');

const hitIndex=boot.indexOf("'modules/combat/hit-feedback.js'");
const weaponIndex=boot.indexOf("'modules/combat/weapon-presentation-v1.js'");
assert.ok(hitIndex>=0&&weaponIndex>hitIndex,'weapon presentation must load after existing hit feedback');

let baseDraws=0,baseAttacks=0,safeMode=false;
let rects=[],order=[],baseSnapshots=[];
const sandbox={
  console,
  window:null,
  SESSION_ID:'self',
  inventory:{knife:true},
  attackFlash:0,
  sx:x=>x,
  sy:y=>y,
  inCamp(){return safeMode;},
  directionRow(dir){
    const x=Math.cos(dir),y=Math.sin(dir);
    if(Math.abs(y)>Math.abs(x))return y>0?0:3;
    return x<0?1:2;
  },
  onAttack(){baseAttacks++;},
  drawPlayer(p,self){baseDraws++;baseSnapshots.push({self,flash:sandbox.attackFlash,attack:Number(p?.attack)||0});order.push('base');},
  ctx:{
    imageSmoothingEnabled:true,
    globalAlpha:1,
    fillStyle:'',
    save(){},
    restore(){},
    fillRect(x,y,w,h){rects.push([x,y,w,h,this.fillStyle,this.globalAlpha]);order.push('pixel');}
  }
};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'weapon-presentation-v1.js'});

const api=sandbox.ABYSSAL_WEAPON_PRESENTATION_V1;
assert.ok(api,'weapon presentation API must be exposed');
assert.equal(api.version,1,'weapon presentation API version mismatch');
assert.equal(api.weaponName,'Bone Knife','weapon presentation name must match crafting terminology');
assert.equal(api.classifyAttackWeapon({range:80,damage:22}),'knife','existing knife attack payload must classify as knife');
assert.equal(api.classifyAttackWeapon({range:62,damage:11}),'unarmed','existing unarmed attack payload must stay unarmed');

assert.equal(api.attackProgress(.15),0,'fresh attack flash must start at progress 0');
assert.ok(api.attackProgress(.075)>.49&&api.attackProgress(.075)<.51,'half flash duration must map to half swing progress');
assert.equal(api.attackProgress(0),1,'expired attack flash must finish the presentation');
const anticipation=api.swingOffset(.10),slash=api.swingOffset(.55),recovery=api.swingOffset(.92);
assert.ok(anticipation<-.5,'early swing must visibly pull back for anticipation');
assert.ok(slash>anticipation+.6,'middle swing must travel through the slash arc');
assert.ok(recovery>0&&recovery<1.02,'late swing must settle into recovery');

function drawLocal(dir,flash,knife=true,safe=false){
  safeMode=safe;
  sandbox.inventory.knife=knife;
  sandbox.attackFlash=flash;
  rects=[];order=[];baseSnapshots=[];
  sandbox.drawPlayer({id:'self',x:100,y:100,dir,attack:0},true);
  return{rects:[...rects],order:[...order],baseSnapshots:[...baseSnapshots]};
}

{
  const idle=drawLocal(0,0,true,false);
  assert.ok(idle.rects.length>=20,'equipped local survivor must visibly hold a pixel Bone Knife while idle/moving');
  assert.equal(idle.order[0],'base','east-facing outside idle knife should render over the player for readability');
  const colors=new Set(idle.rects.map(rect=>rect[4]));
  assert.ok(colors.has('#d8c89d')&&colors.has('#f0e0b6'),'Bone Knife must use warm bone/ivory blade colors');
  assert.ok(colors.has('#2f2923')&&colors.has('#7a5d42'),'Bone Knife must retain a dark improvised wrapped grip');
}
{
  const northIdle=drawLocal(-Math.PI/2,0,true,false);
  assert.equal(northIdle.order[0],'pixel','north-facing outside idle knife should render behind the player body');
  assert.ok(northIdle.order.includes('base'),'north-facing layering must still draw the base player');
}
{
  const unarmed=drawLocal(0,0,false,false);
  assert.equal(unarmed.rects.length,0,'unarmed player must not receive a fake knife');
}

const phaseSignatures=[];
for(const flash of [.14,.075,.01]){
  const frame=drawLocal(0,flash,true,false);
  assert.ok(frame.rects.length>=20,'Bone Knife attack phase must render the weapon itself');
  phaseSignatures.push(JSON.stringify(frame.rects.slice(-8).map(rect=>rect.slice(0,4))));
}
assert.equal(new Set(phaseSignatures).size,3,'anticipation, slash and recovery must produce visibly different knife positions');

const directionSignatures=[];
for(const dir of [0,Math.PI/2,Math.PI,-Math.PI/2]){
  const frame=drawLocal(dir,.075,true,false);
  directionSignatures.push(JSON.stringify(frame.rects.slice(-8).map(rect=>rect.slice(0,4))));
  const offset=api.swingAngle(dir,.075)-dir;
  assert.ok(Math.abs(offset-api.swingOffset(.5))<1e-9,'swing orientation must preserve the player facing direction');
}
assert.equal(new Set(directionSignatures).size,4,'all four facing directions must render distinct weapon orientations');

{
  safeMode=false;
  sandbox.attackFlash=0;
  const outside=api.poseFor({id:'self',x:100,y:100,dir:0,attack:0},true);
  safeMode=true;
  sandbox.attackFlash=.12;
  const home=api.poseFor({id:'self',x:100,y:100,dir:0,attack:0},true);
  assert.equal(outside.safe,false,'outside pose must not be classified as Safe Camp');
  assert.equal(outside.combatReady,true,'outside idle posture must remain combat-ready');
  assert.equal(home.safe,true,'HOME pose must be classified as Safe Camp');
  assert.equal(home.combatReady,false,'HOME posture must be relaxed/non-combat');
  assert.equal(home.attacking,false,'Safe Camp must suppress weapon attack pose even if a stale flash exists');
  assert.ok(Math.sin(home.angle)>.8,'Safe Camp Bone Knife should point downward in a lowered posture');
  assert.ok(Math.abs(home.angle-outside.angle)>.6,'HOME lowered posture must be visibly distinct from OUTSIDE ready posture');
}
{
  const flashBefore=.08;
  const home=drawLocal(0,flashBefore,true,true);
  assert.ok(home.rects.length>=20,'Safe Camp survivor may still visibly carry the Bone Knife');
  assert.equal(home.order[0],'pixel','Safe Camp knife should sit behind/alongside the body for a softer posture');
  assert.equal(home.baseSnapshots.at(-1)?.flash,0,'Safe Camp render must suppress residual local attack trail presentation');
  assert.equal(sandbox.attackFlash,flashBefore,'Safe Camp render must restore authoritative attack timing after drawing');
}

{
  const before=baseAttacks;
  safeMode=false;
  sandbox.onAttack({id:'remote-knife',range:80,damage:22,dir:0});
  assert.equal(baseAttacks,before+1,'weapon wrapper must call existing remote attack handling exactly once');
  assert.equal(api.remoteWeapon('remote-knife'),'knife','remote knife hint must derive from existing attack payload');
  rects=[];order=[];baseSnapshots=[];
  sandbox.drawPlayer({id:'remote-knife',x:120,y:120,dir:Math.PI/2,attack:.14},false);
  assert.ok(rects.length>=20,'remote knife attack must show the same visible weapon presentation');
}
{
  safeMode=true;
  rects=[];order=[];baseSnapshots=[];
  sandbox.drawPlayer({id:'remote-knife',x:120,y:120,dir:0,attack:.14},false);
  assert.ok(rects.length>=20,'known remote Bone Knife should remain visible inside Safe Camp');
  assert.equal(baseSnapshots.at(-1)?.attack,0,'Safe Camp render must suppress residual remote attack trail presentation');
  const pose=api.poseFor({id:'remote-knife',x:120,y:120,dir:0,attack:.14},false);
  assert.equal(pose.attacking,false,'remote Safe Camp weapon must remain lowered rather than swinging');
}
{
  safeMode=false;
  sandbox.onAttack({id:'remote-unarmed',range:62,damage:11,dir:0});
  assert.equal(api.remoteWeapon('remote-unarmed'),'unarmed','remote unarmed attack must not be mistaken for a knife');
  rects=[];order=[];baseSnapshots=[];
  sandbox.drawPlayer({id:'remote-unarmed',x:120,y:120,dir:0,attack:.14},false);
  assert.equal(rects.length,0,'remote unarmed attack must not render a knife');
}

const flashBefore=sandbox.attackFlash=.08;
drawLocal(0,flashBefore,true,false);
assert.equal(sandbox.attackFlash,flashBefore,'outside rendering must not mutate authoritative attack timing state');
assert.ok(baseDraws>=12,'weapon wrapper must preserve the existing player renderer');

console.log(JSON.stringify({
  ok:true,
  weapon:'Bone Knife',
  bonePalette:'warm-ivory+wrapped-grip',
  knifeIdle:'visible',
  homePosture:'lowered',
  outsidePosture:'combat-ready',
  safeCampAttackVisual:'suppressed',
  attackPhases:'anticipation+slash+recovery',
  directions:4,
  remoteKnife:'existing-payload-derived',
  mobileAttack:'dynamic-current-wrapper',
  unarmed:'distinct',
  timers:'unchanged',
  network:'unchanged',
  saveSchema:'unchanged',
  pixelRendering:'fillRect-snapped'
}));
