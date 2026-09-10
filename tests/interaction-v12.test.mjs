import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../interaction-v12.js',import.meta.url),'utf8');

function block(startToken,endToken){
  const start=source.indexOf(startToken);
  const end=source.indexOf(endToken,start);
  assert.ok(start>=0,`missing block start: ${startToken}`);
  assert.ok(end>start,`missing block end: ${endToken}`);
  return source.slice(start,end);
}

const interact=block('function interact(){','function replaceInteractionButton(){');
const guide=block('function openGuideDialog(){','function closeGuideDialog(){');

assert.ok(interact.includes('const target=interactionTarget();'),'interaction target must be resolved before deciding movement policy');
assert.equal(interact.includes('function interact(){\n    safeStop();'),false,'all interactions must not stop the joystick unconditionally');

const fireStart=interact.indexOf("if(target.type==='fire')");
const workbenchStart=interact.indexOf("if(target.type==='workbench')");
const chestStart=interact.indexOf("if(target.type==='chest')");
const resourceStart=interact.indexOf("if(target.type==='resource')");
assert.ok(fireStart>=0&&workbenchStart>fireStart&&chestStart>workbenchStart&&resourceStart>chestStart,'interaction branches must remain present');

const fireBranch=interact.slice(fireStart,workbenchStart);
const workbenchBranch=interact.slice(workbenchStart,chestStart);
const chestBranch=interact.slice(chestStart,resourceStart);
const resourceBranch=interact.slice(resourceStart);

assert.equal(fireBranch.includes('safeStop()'),false,'fire interaction must preserve an active joystick gesture');
assert.ok(workbenchBranch.includes('safeStop()'),'workbench must stop movement before opening its modal panel');
assert.equal(chestBranch.includes('safeStop()'),false,'chest interaction must preserve an active joystick gesture');
assert.equal(resourceBranch.includes('safeStop()'),false,'resource collection must preserve an active joystick gesture');
assert.ok(guide.includes('safeStop()'),'guide dialog must still stop movement because it is modal');

assert.ok(source.includes("button.addEventListener('pointerdown',event=>{event.preventDefault();interact();},{passive:false})"),'mobile interaction button must remain pointer-driven');
assert.ok(source.includes("window.ABYSSAL_INTERACTION_V12={"),'interaction public API must remain available');

console.log(JSON.stringify({
  ok:true,
  instantInteractions:'preserve-joystick',
  modalInteractions:'stop-movement',
  mobilePointerControl:'preserved'
}));
