import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../platform-inventory-v19.js',import.meta.url),'utf8');
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
assert.equal(api.isTypingTarget({tagName:'textarea'}),true,'TEXTAREA must suppress game hotkeys');
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
