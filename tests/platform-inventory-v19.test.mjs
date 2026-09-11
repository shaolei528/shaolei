import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../platform-inventory-v19.js',import.meta.url),'utf8');
const interactionSource=fs.readFileSync(new URL('../interaction-v12.js',import.meta.url),'utf8');
const boot=fs.readFileSync(new URL('../survival-v17.html',import.meta.url),'utf8');
const regression=fs.readFileSync(new URL('../regression-v14.js',import.meta.url),'utf8');

const documentStub={
  getElementById(){return null;},
  querySelector(){return null;}
};
const sandbox={
  console,
  document:documentStub,
  window:null,
  navigator:{maxTouchPoints:0}
};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'platform-inventory-v19.js'});

const api=sandbox.ABYSSAL_PLATFORM_V19;
assert.ok(api,'platform API must be exposed');
assert.equal(api.version,19,'platform API version mismatch');

function set(...codes){return new Set(codes);}
function blockFrom(text,startToken,endToken){
  const start=text.indexOf(startToken);
  const end=text.indexOf(endToken,start);
  assert.ok(start>=0,`missing block start: ${startToken}`);
  assert.ok(end>start,`missing block end: ${endToken}`);
  return text.slice(start,end);
}
function block(startToken,endToken){return blockFrom(source,startToken,endToken);}

{
  const v=api.keyboardVector(set('KeyW'));
  assert.deepEqual({x:v.x,y:v.y},{x:0,y:-1},'W must move north');
}
{
  const v=api.keyboardVector(set('KeyA','KeyD'));
  assert.deepEqual({x:v.x,y:v.y},{x:0,y:0},'opposite horizontal keys must cancel');
}
{
  const v=api.keyboardVector(set('ArrowRight','ArrowDown'));
  assert.ok(Math.abs(v.x-Math.SQRT1_2)<1e-12,'diagonal x must be normalized');
  assert.ok(Math.abs(v.y-Math.SQRT1_2)<1e-12,'diagonal y must be normalized');
}

assert.equal(api.isTypingTarget({tagName:'INPUT'}),true,'INPUT must suppress game hotkeys');
assert.equal(api.isTypingTarget({tagName:'textarea'}),true,'TEXTAREA must suppress hotkeys');
assert.equal(api.isTypingTarget({tagName:'DIV',isContentEditable:true}),true,'contenteditable must suppress hotkeys');
assert.equal(api.isTypingTarget({tagName:'DIV'}),false,'normal game surface must accept hotkeys');

{
  const bag=api.inventorySnapshot({wood:4.8,stone:-2,food:'3',shard:null,knife:1,lantern:0});
  assert.deepEqual(JSON.parse(JSON.stringify(bag)),{
    wood:4,stone:0,food:3,shard:0,knife:true,lantern:false
  },'inventory snapshot must preserve existing item semantics safely');
  assert.equal(
    api.inventorySignature(bag),
    'wood:4|stone:0|food:3|shard:0|knife:1|lantern:0',
    'inventory signature must change only with meaningful inventory state'
  );
}

assert.equal(api.detectDesktop({
  finePointer:true,
  hover:true,
  navigatorLike:{platform:'Win32',userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',maxTouchPoints:0}
}),true,'Windows desktop must stay desktop even in a narrow embedded browser');

assert.equal(api.detectDesktop({
  finePointer:false,
  hover:false,
  navigatorLike:{platform:'Win32',userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',maxTouchPoints:0}
}),true,'Windows keyboard platform must not depend on viewport width');

assert.equal(api.detectDesktop({
  finePointer:false,
  hover:false,
  navigatorLike:{platform:'iPhone',userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile',maxTouchPoints:5}
}),false,'iPhone must remain touch mode');

assert.equal(api.detectDesktop({
  finePointer:false,
  hover:false,
  navigatorLike:{platform:'MacIntel',userAgent:'Mozilla/5.0',maxTouchPoints:5}
}),false,'iPad desktop UA must remain touch mode');

const triggerInteractSource=block('function triggerInteract(){','function movementCode(code){');
assert.ok(triggerInteractSource.includes('window.ABYSSAL_INTERACTION_V12?.triggerContextInteraction?.()'),'desktop interaction must call the public context-action API');
assert.equal(triggerInteractSource.includes('.click()'),false,'desktop interaction must not simulate a DOM button click');

const keyboardSource=[
  triggerInteractSource,
  block('function movementCode(code){','function onKeyDown(event){'),
  block('function onKeyDown(event){','function onKeyUp(event){')
].join('\n');

const keySandbox={
  API:{panelOpen:false},
  keys:new Set(),
  shellBlocked:false,
  contextCalls:0,
  isDesktop:()=>true,
  isTypingTarget:target=>api.isTypingTarget(target),
  applyKeyboardMovement(){},
  setPanelOpen(){},
  triggerDash(){},
  triggerAttack(){},
  window:null
};
keySandbox.window=keySandbox;
keySandbox.ABYSSAL_SHELL_V1={blocksGameInput:()=>keySandbox.shellBlocked};
keySandbox.ABYSSAL_INTERACTION_V12={triggerContextInteraction(){keySandbox.contextCalls++;}};
vm.createContext(keySandbox);
vm.runInContext(keyboardSource,keySandbox,{filename:'platform-keyboard-context-test.js'});

function keyE(target={tagName:'DIV'},repeat=false){
  return{code:'KeyE',repeat,target,prevented:false,preventDefault(){this.prevented=true;}};
}

{
  const event=keyE();
  keySandbox.onKeyDown(event);
  assert.equal(keySandbox.contextCalls,1,'PC KeyE must invoke the canonical context-action entry point exactly once');
  assert.equal(event.prevented,true,'handled PC KeyE must prevent browser default behavior');
}
{
  const event=keyE({tagName:'DIV'},true);
  keySandbox.onKeyDown(event);
  assert.equal(keySandbox.contextCalls,1,'held/repeated KeyE must not repeat context interaction');
}
{
  keySandbox.shellBlocked=true;
  const event=keyE();
  keySandbox.onKeyDown(event);
  assert.equal(keySandbox.contextCalls,1,'Game Shell blocked state must prevent KeyE context interaction');
  assert.equal(event.prevented,true,'Game Shell blocked KeyE must prevent browser default behavior');
  keySandbox.shellBlocked=false;
}
{
  const event=keyE({tagName:'INPUT'});
  keySandbox.onKeyDown(event);
  assert.equal(keySandbox.contextCalls,1,'typing/name input must prevent KeyE context interaction');
}
{
  keySandbox.API.panelOpen=true;
  const event=keyE();
  keySandbox.onKeyDown(event);
  assert.equal(keySandbox.contextCalls,1,'inventory panel must prevent KeyE context interaction');
  keySandbox.API.panelOpen=false;
}

const interactionRuntimeSource=[
  blockFrom(interactionSource,'function harvestResource(r){','function restAtFire(){'),
  blockFrom(interactionSource,'function interact(){','function triggerContextInteraction(){'),
  blockFrom(interactionSource,'function triggerContextInteraction(){','function replaceInteractionButton(){')
].join('\n');

function runIntegratedKeyE(target){
  const state={guideOpen:0};
  const integrated={
    API:{panelOpen:false},
    keys:new Set(),
    isDesktop:()=>true,
    isTypingTarget:targetNode=>api.isTypingTarget(targetNode),
    applyKeyboardMovement(){},
    setPanelOpen(){},
    triggerDash(){},
    triggerAttack(){},
    interactionTarget:()=>target,
    openGuideDialog(){state.guideOpen++;},
    restAtFire(){},
    safeStop(){},
    hideOtherPanels(){},
    craftPanel:{classList:{remove(){}}},
    openChest(){},
    inventory:{wood:0},
    harvested:new Map(),
    ITEM_ZH:{wood:'木材'},
    zoneConnected:false,
    zoneCh:null,
    currentZone:'1:1',
    saveLocal(){},
    updateUI(){},
    toast(){},
    window:null
  };
  integrated.window=integrated;
  integrated.ABYSSAL_SHELL_V1={blocksGameInput:()=>false};
  vm.createContext(integrated);
  vm.runInContext(`${interactionRuntimeSource}\nwindow.ABYSSAL_INTERACTION_V12={triggerContextInteraction};\n${keyboardSource}`,integrated,{filename:'pc-context-integration-test.js'});
  const event={code:'KeyE',repeat:false,target:{tagName:'DIV'},prevented:false,preventDefault(){this.prevented=true;}};
  integrated.onKeyDown(event);
  return{integrated,state,event};
}

{
  const resource={id:'camp:pc-e',type:'wood'};
  const {integrated,event}=runIntegratedKeyE({type:'resource',resource});
  assert.equal(integrated.inventory.wood,1,'PC KeyE must traverse the shared context action and harvest a resource');
  assert.ok(integrated.harvested.get(resource.id)>Date.now(),'PC KeyE resource harvest must preserve the resource cooldown');
  assert.equal(event.prevented,true,'integrated PC KeyE resource action must prevent browser default behavior');
}
{
  const {state,event}=runIntegratedKeyE({type:'guide'});
  assert.equal(state.guideOpen,1,'PC KeyE must traverse the shared context action and open Guide interaction');
  assert.equal(event.prevented,true,'integrated PC KeyE Guide action must prevent browser default behavior');
}

const interactionIndex=boot.indexOf("'interaction-v12.js'");
const platformIndex=boot.indexOf("'platform-inventory-v19.js'");
const relayIndex=boot.indexOf("'network-relay-v16.js'");
assert.ok(interactionIndex>=0,'interaction module missing from V17 boot');
assert.ok(platformIndex>interactionIndex,'platform module must load after interaction controls exist');
assert.ok(relayIndex>platformIndex,'platform module should load before relay wraps updateUI');

for(const required of[
  'WASD / 方向键 移动',
  "document.addEventListener('keydown',onKeyDown,true)",
  "document.addEventListener('keyup',onKeyUp,true)",
  "background-image:url('assets/resource_sheet.png')",
  "ITEM_META",
  "inventorySnapshot(inventory)",
  "inventorySignature(snapshot)",
  "if(!force&&!API.panelOpen)return false",
  "if(API.panelOpen)refreshInventory()",
  "imageSmoothingEnabled=false",
  "html.abyssal-desktop-v19 .joystick",
  "window.matchMedia('(any-pointer: fine)')"
]){
  assert.ok(source.includes(required),`platform invariant missing: ${required}`);
}

assert.equal(source.includes('(min-width: 820px) and (pointer: fine)'),false,'desktop mode must not depend on 820px viewport width');
assert.equal(source.includes('draw=function(){fitDesktopCanvas()'),false,'layout must not be measured on every render frame');
assert.equal(regression.includes('setInterval(fixDynamicText,160)'),false,'localization must not poll the DOM every 160ms');
assert.ok(regression.includes('new MutationObserver(()=>fixDynamicText())'),'late status writes must be localized before paint');
assert.ok(regression.includes("updateUI=function(){const result=baseUpdateUIV14.apply(this,arguments);fixDynamicText();return result;}"),'normal UI updates must localize synchronously');

console.log(JSON.stringify({
  ok:true,
  keyboard:'wasd+arrows',
  pcContextInteraction:'pass',
  pcResourceHarvestEndToEnd:'pass',
  pcGuideInteractionEndToEnd:'pass',
  shellInputBlock:'pass',
  typingIsolation:'pass',
  inventoryMapping:'pass',
  inventoryHiddenRender:'suppressed',
  inventoryStateRender:'deduplicated',
  perFrameLayoutRead:'removed',
  embeddedWindowsDesktop:'pass',
  mobileIsolation:'pass',
  localizationPolling:'removed',
  bootOrder:'pass'
}));
