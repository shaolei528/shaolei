import assert from 'node:assert/strict';
import fs from 'node:fs';

const renderer=fs.readFileSync(new URL('../prototypes/successor-3-4/successor-renderer.js',import.meta.url),'utf8');
const weapon=fs.readFileSync(new URL('../modules/combat/weapon-presentation-v1.js',import.meta.url),'utf8');
const feedback=fs.readFileSync(new URL('../modules/combat/hit-feedback.js',import.meta.url),'utf8');
const feel=fs.readFileSync(new URL('../modules/combat/playable-feel-v1.js',import.meta.url),'utf8');

assert.ok(weapon.includes('drawBoneKnife:drawPixelBoneKnife'),'the existing weapon owner must export one reusable pixel-knife draw routine');
assert.ok(renderer.includes('presentation.drawBoneKnife(')&&renderer.includes('presentation.poseFor?.(p,self)'),
  'the 3/4 actor renderer must adapt and draw the shared Bone Knife pose');
assert.ok(renderer.includes('function drawFacingCue(screen,face)')&&renderer.includes('if(self&&weapon&&!safe&&flash<=0)drawFacingCue(screen,face)'),
  'a subtle snapped direction cue must follow the local equipped knife only outside camp and outside attack frames');
assert.ok(renderer.includes('Math.hypot(face.x,face.y)')&&renderer.includes('Math.round(screen.x+dx*19)'),
  'the facing cue must use projected world facing and pixel-aligned screen coordinates');
assert.match(renderer,/METRO_CLUE_WORLD=\{x:metroStore\.x\+metroStore\.w\+32,y:metroStore\.y\+Math\.round\(metroStore\.h\*\.30\)\}/,'the current world clue must use the authored POI geometry as its stable anchor');
assert.match(renderer,/function discoverShoreSignal\(\)[\s\S]*?Math\.hypot\(me\.x-METRO_CLUE_WORLD\.x,me\.y-METRO_CLUE_WORLD\.y\)>=128/,'the clue must only be discoverable near its authored world anchor');
assert.match(renderer,/k==='e'&&!e\.repeat&&discoverShoreSignal\(\)/,'the first clue interaction must consume E before it can become movement input');
assert.match(renderer,/ABYSSAL_METRO_SERVICE_LOG_DISCOVERED_V1=true[\s\S]*?toast\('检修记录：停电后，地下指示灯亮了三次。[\s\S]*?dispatchEvent\(new CustomEvent\('abyssal:world-clue'[\s\S]*?id:'metro-b2-maintenance-log'/,'the authored utility-room investigation must reveal its short log and emit an additive world-clue event');
assert.ok(renderer.includes('presentation.remoteWeapon?.(p.id)===\'knife\''),
  'remote knife presentation must derive from the existing network attack hint');
assert.ok(feedback.includes('FX.sparks.push(')&&feedback.includes('FX.impacts.push('),
  'the candidate must consume the authoritative confirmed-hit presentation records');
assert.ok(feedback.includes('FX.labels.push(')&&renderer.includes('fx.labels=fx.labels.filter'),
  'confirmed damage labels must be retained and retired by the 3/4 renderer');
assert.ok(renderer.includes('drawCombatImpacts(performance.now())')&&renderer.includes('fx.sparks=fx.sparks.filter')&&renderer.includes('fx.impacts=fx.impacts.filter'),
  'the candidate must draw and retire confirmed-hit sparks and impact pulses');
assert.ok(renderer.includes("out.fillText(value,point.x,point.y)")&&renderer.includes('spark.duration||(spark.killed?210:165)'),
  'the 3/4 renderer must draw readable damage numbers and honor the presentation lifetime');
assert.ok(feel.includes("emit('abyssal:combat-hit',detail)")&&renderer.includes("addEventListener('abyssal:combat-hit'"),
  'render-only hit-stop must begin only from a confirmed local combat hit');
assert.ok(renderer.includes('hit.killed?112:damage>=30?64:damage>=18?48:24')&&renderer.includes('now>=hitStopUntil'),
  'confirmed light, medium, heavy, and lethal hits must hold the rendered frame at distinct bounded durations');
assert.ok(renderer.includes('applyCanvasKick?.(now)')&&renderer.includes('drawPlayerHurt(performance.now())'),
  'the 3/4 frame loop must apply existing kick and hurt-feedback presentation');
assert.match(renderer,/function frame\(now\)\{const elapsed=[\s\S]*?lastTime=now;simulationStep\(elapsed\);[\s\S]*?if\(pendingHitStop>0\)\{render\(\);hitStopUntil=now\+pendingHitStop;pendingHitStop=0\}else if\(now>=hitStopUntil\)render\(\)/,
  'hit-stop must freeze only the last rendered impact frame while simulation and Relay clocks keep advancing');
console.log(JSON.stringify({ok:true,sharedKnifePose:true,confirmedImpactFx:true,renderOnlyHitStopMs:[24,48,64,112],simulationAuthority:'unchanged'}));
