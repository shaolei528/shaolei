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
const targetResolver=block('function nearestResource(){','function harvestResource(r){');
const interact=block('function interact(){','function triggerContextInteraction(){');
const trigger=block('function triggerContextInteraction(){','function replaceInteractionButton(){');
const bindButton=block('function replaceInteractionButton(){','function replaceChatControls(){');
const guide=block('function openGuideDialog(){','function closeGuideDialog(){');
const breedButtonSource=block('function makeBreedButton(){','function makeCookingButton(){');
const refreshPromptSource=block('function refreshInteractionPrompt(){','  makeDialog();');

function resolveWorldTarget({resourceDistance=Infinity,farmDistance=Infinity,guideDistance=Infinity}={}){
  const point=(distance)=>({x:distance,y:0});
  const resource=Number.isFinite(resourceDistance)?{id:'camp:stone-test',type:'stone',...point(resourceDistance)}:null;
  const sandbox={
    started:true,dead:false,dialogOpen:false,me:{x:0,y:0},
    resources:resource?[resource]:[],harvested:new Map(),Date,
    WORKBENCH:point(500),CHEST:{...point(600),id:'camp:chest'},FIRE:point(700),
    inCamp:()=>true,distance:(actor,target)=>Math.hypot(actor.x-target.x,actor.y-target.y),
    ITEM_ZH:{stone:'石头'},
    window:{
      ABYSSAL_CAMP_GUIDE_V1:{getSnapshot:()=>Number.isFinite(guideDistance)?point(guideDistance):null},
      ABYSSAL_LIVESTOCK_V1:{getTarget:()=>null},
      ABYSSAL_FARMING_V1:{getTarget:()=>Number.isFinite(farmDistance)?{type:'farm',d:farmDistance,label:'test'}:null},
      ABYSSAL_FISHING_V1:{getTarget:()=>null},
      ABYSSAL_PETS_V1:{getTarget:()=>null}
    }
  };
  vm.createContext(sandbox);
  return vm.runInContext(`${targetResolver}\ninteractionTarget();`,sandbox,{filename:'interaction-target-resolution-test.js'});
}

assert.equal(resolveWorldTarget({resourceDistance:4,farmDistance:48})?.type,'resource','a nearby mineable stone must beat a farther farm plot for the shared interaction key');
assert.equal(resolveWorldTarget({farmDistance:48})?.type,'farm','farm actions remain available when they are the nearest target');
assert.equal(resolveWorldTarget({farmDistance:48,guideDistance:12})?.type,'guide','the closest service interaction wins over farther farm actions');

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
  const calls={guide:0,fire:0,workbenchStop:0,hidePanels:0,workbenchOpen:0,chest:0,resource:0,resourceValue:null,livestock:0,toast:0};
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
  const calls={stopped:0,hidden:0,opened:0};
  const sandbox={interactionTarget:()=>({type:'pet-station'}),dashQueued:true,hideOtherPanels(){calls.hidden++;},window:{
    ABYSSAL_JOYSTICK_V1:{stop(){calls.stopped++;}},
    ABYSSAL_PET_PANEL_V1:{open(){calls.opened++;}}
  }};
  vm.createContext(sandbox);
  vm.runInContext(`${interact}\ninteract();`,sandbox,{filename:'pet-station-interaction-test.js'});
  assert.deepEqual(calls,{stopped:1,hidden:1,opened:1},'the incubator command stops movement and opens the pet panel');
  assert.equal(sandbox.dashQueued,false,'opening the pet modal cancels a queued dash');
}

{
  const calls={updates:0,prompt:0,toasts:[]};
  const sandbox={
    interactionTarget:()=>({type:'livestock',animalId:'hen-a'}),
    window:{ABYSSAL_LIVESTOCK_V1:{interact(id){calls.livestock=id;return{ok:true,item:'egg',amount:1}}}},
    ITEM_ZH:{egg:'鸡蛋'},inventory:{food:1},
    toast(message){calls.toasts.push(message);},updateUI(){calls.updates++;},refreshInteractionPrompt(){calls.prompt++;}
  };
  vm.createContext(sandbox);
  vm.runInContext(`${interact}\ninteract();`,sandbox,{filename:'livestock-interaction-test.js'});
  assert.equal(calls.livestock,'hen-a','normal context interaction must call the livestock owner');
  assert.ok(calls.toasts.some(message=>message.includes('鸡蛋')),'collected animal products receive a player-facing toast');
  assert.equal(calls.updates,1,'livestock interaction refreshes the HUD');
  assert.equal(calls.prompt,1,'livestock interaction immediately refreshes its next prompt');
}

{
  const calls={breed:null,updates:0,prompt:0,toasts:[],listeners:new Map(),appended:null};
  const button={style:{},setAttribute(){},addEventListener(type,handler){calls.listeners.set(type,handler);}};
  const target={type:'livestock',animalId:'hen-a',label:'【互动】喂养鸡 · 口粮 ×1',breedPair:{maleId:'hen-b',femaleId:'hen-a',speciesName:'鸡'}};
  const sandbox={
    document:{getElementById:()=>null,createElement:()=>button},game:{appendChild(element){calls.appended=element;}},
    interactionTarget:()=>calls.breed?{...target,breedPair:null,label:'【互动】喂养鸡 · 口粮 ×1'}:target,inventory:{food:1},toast(message){calls.toasts.push(message);},
    updateUI(){calls.updates++;},refreshInteractionPrompt(){calls.prompt++;},
    window:{ABYSSAL_LIVESTOCK_V1:{breedAnimal(maleId,femaleId){calls.breed={maleId,femaleId};return{ok:true};}}}
  };
  vm.createContext(sandbox);
  vm.runInContext(`${breedButtonSource}\nglobalThis.testBreedButton=makeBreedButton();`,sandbox,{filename:'livestock-breed-button-test.js'});
  assert.equal(calls.appended,button,'the explicit breeding action is added to the normal game UI');
  assert.equal(button.textContent,'繁育','the separate button distinguishes breeding from the E-key feed action');

  const prompt={style:{},classList:{toggle(){}}},cookingButton={style:{}},petButton={style:{}};
  Object.assign(sandbox,{dialogOpen:false,prompt,breedButton:button,cookingButton,petButton,lastFishingPrompt:'',inventory:{food:1},
    window:{...sandbox.window,ABYSSAL_FISHING_V1:{},ABYSSAL_COOKING_PANEL_V1:{visible:()=>false},ABYSSAL_PET_PANEL_V1:{visible:()=>false}}});
  vm.runInContext(`${refreshPromptSource}\nrefreshInteractionPrompt();`,sandbox,{filename:'livestock-breed-prompt-test.js'});
  assert.equal(button.style.display,'block','the breeding button appears only for a nearby eligible pair with feed available');
  assert.ok(prompt.textContent.includes('喂养鸡'),'the E prompt remains the separate feed action');

  calls.listeners.get('pointerdown')({preventDefault(){}});
  assert.deepEqual(calls.breed,{maleId:'hen-b',femaleId:'hen-a'},'touching the breeding button calls the livestock owner with the eligible pair');
  assert.equal(calls.updates,1,'successful breeding refreshes the shared inventory HUD');
  assert.equal(button.style.display,'none','successful breeding refresh hides the button when the pair is no longer eligible');
  assert.ok(calls.toasts.some(message=>message.includes('新的幼崽')),'breeding produces immediate player-facing feedback');

  calls.breed=null;
  sandbox.inventory.food=0;
  vm.runInContext('refreshInteractionPrompt();',sandbox,{filename:'livestock-breed-prompt-empty-feed-test.js'});
  assert.equal(button.style.display,'none','the breeding button hides when the shared inventory has no feed');
}

{
  const calls={updates:0,prompt:0,toasts:[],casts:0};
  const sandbox={
    interactionTarget:()=>({type:'fishing',pondId:'camp-pool'}),
    window:{ABYSSAL_FISHING_V1:{interact(){calls.casts++;return{ok:true,phase:'waiting'}}}},
    ITEM_ZH:{},inventory:{food:1},
    toast(message){calls.toasts.push(message);},updateUI(){calls.updates++;},refreshInteractionPrompt(){calls.prompt++;}
  };
  vm.createContext(sandbox);
  vm.runInContext(`${interact}\ninteract();`,sandbox,{filename:'fishing-interaction-test.js'});
  assert.equal(calls.casts,1,'normal context interaction must start the fishing minigame');
  assert.ok(calls.toasts.some(message=>message.includes('回水池')),'the cast gives immediate player-facing feedback');
  assert.equal(calls.updates,1);
  assert.equal(calls.prompt,1);
}

{
  let promptRefreshes=0;
  const sandbox={
    resource:{id:'camp:test',type:'wood'},
    harvested:new Map(),
    inventory:{wood:0},
    ITEM_ZH:{wood:'木材'},
    zoneConnected:false,
    zoneCh:null,
    currentZone:'1:1',
    emitGameplayEvent(){},
    saveLocal(){},
    updateUI(){},
    refreshInteractionPrompt(){promptRefreshes++;},
    toast(){}
  };
  vm.createContext(sandbox);
  vm.runInContext(`${harvest}\nharvestResource(resource);`,sandbox,{filename:'resource-harvest-test.js'});
  assert.equal(sandbox.inventory.wood,1,'canonical resource harvest must increment the resource count');
  assert.ok(sandbox.harvested.get('camp:test')>Date.now(),'canonical resource harvest must start its local respawn cooldown');
  assert.equal(promptRefreshes,1,'successful local harvesting must immediately refresh the next interaction prompt');
}

{
  const calls={interact:0,listeners:new Map(),replaced:false};
  const button={id:'useBtn',textContent:'USE',cloneNode(){return this;},addEventListener(type,handler){calls.listeners.set(type,handler);}};
  const old={cloneNode(){return button;},replaceWith(replacement){calls.replaced=replacement===button;}};
  const sandbox={document:{getElementById:()=>old},Date,triggerContextInteraction(){calls.interact++;}};
  vm.createContext(sandbox);
  vm.runInContext(`${bindButton}\nreplaceInteractionButton();`,sandbox,{filename:'interaction-button-test.js'});
  const preventDefault=()=>{};
  calls.listeners.get('pointerdown')({type:'pointerdown',detail:1,preventDefault});
  calls.listeners.get('click')({type:'click',detail:1,preventDefault});
  assert.equal(calls.interact,1,'a pointer press must trigger one interaction even when its click event follows');
  calls.listeners.get('click')({type:'click',detail:0,preventDefault});
  assert.equal(calls.interact,2,'keyboard and semantic clicks must trigger the contextual interaction');
  assert.equal(calls.replaced,true,'the contextual control must replace the legacy USE button');
}

assert.ok(source.includes("button.addEventListener('pointerdown',event=>{event.preventDefault();triggerContextInteraction();},{passive:false})"),'mobile interaction button must call the canonical context-action entry point');
assert.ok(source.includes("button.addEventListener('click',event=>{event.preventDefault();if(event.detail===0)triggerContextInteraction();})"),'keyboard and semantic clicks must activate the same contextual action without double firing pointer presses');
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
