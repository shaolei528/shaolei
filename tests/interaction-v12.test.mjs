import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../interaction-v12.js',import.meta.url),'utf8');

function block(startToken,endToken){
  const start=source.indexOf(startToken);
  const end=source.indexOf(endToken,start);
  assert.ok(start>=0,`missing block start: ${startToken}`);
  assert.ok(end>start,`missing block end: ${endToken}`);
  return source.slice(start,end);
}

const harvest=block('function harvestResource(r){','function restAtFire(){');
const interact=block('function interact(){','function triggerContextInteraction(){');
const trigger=block('function triggerContextInteraction(){','function replaceInteractionButton(){');
const guide=block('function openGuideDialog(){','function closeGuideDialog(){');

assert.ok(interact.includes('const target=interactionTarget();'),'interaction target must be resolved before deciding movement policy');
assert.equal(interact.includes('function interact(){\n    safeStop();'),false,'all interactions must not stop the joystick unconditionally');
assert.ok(trigger.includes('return interact();'),'public context-action entry point must delegate to the canonical interaction action');

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

function exerciseTarget(target){
  const calls={guide:0,fire:0,workbenchStop:0,hidePanels:0,workbenchOpen:0,chest:0,resource:0,resourceValue:null,toast:0};
  const sandbox={
    interactionTarget:()=>target,
    toast(){calls.toast++;},
    openGuideDialog(){calls.guide++;},
    restAtFire(){calls.fire++;},
    safeStop(){calls.workbenchStop++;},
    hideOtherPanels(){calls.hidePanels++;},
    craftPanel:{classList:{remove(name){if(name==='hidden')calls.workbenchOpen++;}}},
    openChest(){calls.chest++;},
    harvestResource(value){calls.resource++;calls.resourceValue=value;}
  };
  vm.createContext(sandbox);
  vm.runInContext(`${interact}\ninteract();`,sandbox,{filename:'interaction-target-test.js'});
  return calls;
}

{
  const calls=exerciseTarget({type:'guide'});
  assert.equal(calls.guide,1,'context action must open the Guide dialog for a Guide target');
}
{
  const calls=exerciseTarget({type:'fire'});
  assert.equal(calls.fire,1,'context action must preserve campfire interaction');
}
{
  const calls=exerciseTarget({type:'workbench'});
  assert.equal(calls.workbenchStop,1,'workbench interaction must stop movement');
  assert.equal(calls.hidePanels,1,'workbench interaction must hide competing panels');
  assert.equal(calls.workbenchOpen,1,'context action must preserve workbench interaction');
}
{
  const calls=exerciseTarget({type:'chest'});
  assert.equal(calls.chest,1,'context action must preserve chest interaction');
}
{
  const resource={id:'camp:test',type:'wood'};
  const calls=exerciseTarget({type:'resource',resource});
  assert.equal(calls.resource,1,'context action must dispatch resource targets to harvesting');
  assert.equal(calls.resourceValue,resource,'resource target must be forwarded intact to harvesting');
}

{
  const sandbox={
    resource:{id:'camp:test',type:'wood'},
    harvested:new Map(),
    inventory:{wood:0},
    zoneConnected:false,
    zoneCh:null,
    currentZone:'1:1',
    saveLocal(){},
    updateUI(){},
    toast(){}
  };
  vm.createContext(sandbox);
  vm.runInContext(`${harvest}\nharvestResource(resource);`,sandbox,{filename:'resource-harvest-test.js'});
  assert.equal(sandbox.inventory.wood,1,'canonical resource harvest must increment the resource count');
  assert.ok(sandbox.harvested.get('camp:test')>Date.now(),'canonical resource harvest must start its local respawn cooldown');
}

assert.ok(source.includes("button.addEventListener('pointerdown',event=>{event.preventDefault();triggerContextInteraction();},{passive:false})"),'mobile interaction button must call the canonical context-action entry point');
assert.ok(source.includes('triggerContextInteraction,'),'interaction public API must expose the canonical context-action entry point');
assert.ok(source.includes("window.ABYSSAL_INTERACTION_V12={"),'interaction public API must remain available');

console.log(JSON.stringify({
  ok:true,
  contextEntry:'shared',
  resourceHarvest:'pass',
  guideInteraction:'pass',
  instantInteractions:'preserve-joystick',
  modalInteractions:'stop-movement',
  mobilePointerControl:'shared-context-action'
}));
