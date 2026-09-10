(()=>{
'use strict';

/*
  V19 cross-platform controls + inventory UI.

  This module intentionally reuses the existing gameplay state instead of creating
  a second inventory or movement system. Mobile keeps the current touch controls;
  desktop gains keyboard controls and a wider native-resolution canvas. No network
  event, payload, save schema, item id or authority rule is changed here.
*/

const DESKTOP_MEDIA='(min-width: 820px) and (pointer: fine)';
const RESOURCE_ITEMS=['wood','stone','food','shard'];
const ITEM_META={
  wood:{name:'木材',desc:'基础制作材料',sprite:0},
  stone:{name:'石头',desc:'制作武器与工具',sprite:1},
  food:{name:'食物',desc:'用于恢复饥饿',sprite:2},
  shard:{name:'异质碎片',desc:'带有冷光的稀有材料',sprite:3},
  knife:{name:'骨刃',desc:'近战武器',glyph:'†'},
  lantern:{name:'提灯',desc:'降低黑暗中的理智消耗',glyph:'◈'}
};

function keyboardVector(keys){
  const has=code=>keys?.has?.(code);
  let x=(has('KeyD')||has('ArrowRight')?1:0)-(has('KeyA')||has('ArrowLeft')?1:0);
  let y=(has('KeyS')||has('ArrowDown')?1:0)-(has('KeyW')||has('ArrowUp')?1:0);
  const length=Math.hypot(x,y);
  if(length>1){x/=length;y/=length;}
  return{x,y};
}
function isTypingTarget(target){
  const tag=String(target?.tagName||'').toUpperCase();
  return tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||!!target?.isContentEditable;
}
function inventorySnapshot(source){
  const src=source||{};
  return Object.fromEntries(Object.keys(ITEM_META).map(id=>[id,id==='knife'||id==='lantern'?!!src[id]:Math.max(0,Math.floor(Number(src[id])||0))]));
}

const API={version:19,keyboardVector,isTypingTarget,inventorySnapshot,desktop:false,panelOpen:false};
window.ABYSSAL_PLATFORM_V19=API;

const root=typeof game!=='undefined'?game:document.getElementById('game');
const arenaWrap=document.querySelector('.arena-wrap');
const arenaCanvas=typeof canvas!=='undefined'?canvas:document.getElementById('canvas');
if(!root||!arenaWrap||!arenaCanvas)return;

const media=window.matchMedia?window.matchMedia(DESKTOP_MEDIA):{matches:false,addEventListener(){}};
const keys=new Set();
let panel=null;
let toggle=null;
let hint=null;

function isDesktop(){return !!media.matches;}
function addStyles(){
  if(document.getElementById('platformInventoryStyleV19'))return;
  const style=document.createElement('style');
  style.id='platformInventoryStyleV19';
  style.textContent=`
    #inventoryToggleV19{position:absolute;right:62px;bottom:calc(157px + env(safe-area-inset-bottom));z-index:14;width:48px;height:34px;border:1px solid #8aa096;border-radius:5px;background:#173128ed;color:#eef6f1;font:900 8px ui-monospace,monospace;letter-spacing:.05em;touch-action:manipulation}
    #inventoryPanelV19{position:absolute;left:10px;right:10px;top:126px;z-index:92;max-height:calc(100% - 150px);overflow:auto;border:2px solid #718b80;background:#091512f8;box-shadow:0 18px 48px #000c;padding:0;color:#eef5f0}
    #inventoryPanelV19.hidden{display:none!important}
    .v19-bag-head{position:sticky;top:0;z-index:2;display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:11px 12px;border-bottom:1px solid #40584e;background:#10231eef}
    .v19-bag-title{font:950 13px ui-monospace,monospace;letter-spacing:.08em}.v19-bag-sub{margin-top:3px;color:#aebfb7;font:600 7px ui-monospace,monospace}
    .v19-bag-close{width:34px;height:34px;border:1px solid #657d73;background:#162a24;color:#fff;font-size:20px;border-radius:4px}
    .v19-bag-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;padding:10px}
    .v19-item{min-height:76px;display:grid;grid-template-columns:42px 1fr;gap:9px;align-items:center;padding:8px;border:1px solid #40584f;background:#10211d}
    .v19-item-icon{width:38px;height:38px;display:grid;place-items:center;border:1px solid #60776d;background-color:#0b1714;background-repeat:no-repeat;image-rendering:pixelated;overflow:hidden}
    .v19-item-icon.sprite{background-image:url('assets/resource_sheet.png');background-size:152px 38px}
    .v19-item-icon[data-sprite="0"]{background-position:0 0}.v19-item-icon[data-sprite="1"]{background-position:-38px 0}.v19-item-icon[data-sprite="2"]{background-position:-76px 0}.v19-item-icon[data-sprite="3"]{background-position:-114px 0}
    .v19-item-icon.gear{font:950 23px Georgia,serif;color:#e6d8a3;text-shadow:0 2px #000}
    .v19-item-name{display:flex;align-items:baseline;justify-content:space-between;gap:6px;font:900 9px ui-monospace,monospace}.v19-item-count{color:#f1d98e;font-size:11px}
    .v19-item-desc{margin-top:4px;color:#9fb3aa;font:600 7px/1.45 ui-monospace,monospace}.v19-item-state{margin-top:4px;color:#a9dfb4;font:800 7px ui-monospace,monospace}
    .v19-bag-foot{padding:0 10px 11px;color:#91a59c;font:600 7px/1.5 ui-monospace,monospace;text-align:center}
    #desktopControlsV19{display:none;position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:13;padding:6px 9px;border:1px solid #465f55;background:#0a1714d9;color:#b7c9c1;font:700 7px ui-monospace,monospace;white-space:nowrap;pointer-events:none}
    @media(max-height:700px){#inventoryToggleV19{bottom:145px}}
    @media(min-width:820px) and (pointer:fine){
      .app{width:100vw!important;max-width:1180px!important;height:100svh!important}
      .top{grid-template-columns:56px minmax(300px,430px) minmax(270px,1fr);padding-left:12px;padding-right:12px}
      .joystick,.actions{display:none!important}
      .inventory{bottom:12px!important}
      .chat-toggle,.map-toggle{bottom:12px!important}
      .chat-toggle{left:12px!important}.map-toggle{right:12px!important}
      #inventoryToggleV19{right:68px;bottom:12px;width:54px;height:34px}
      #desktopControlsV19{display:block}
      #inventoryPanelV19{left:50%;right:auto;top:126px;transform:translateX(-50%);width:min(720px,calc(100% - 40px));max-height:calc(100% - 164px)}
      .v19-bag-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;padding:12px}
      .v19-item{min-height:88px}
      .quest{width:190px}.players{width:160px}
    }
  `;
  document.head.appendChild(style);
}

function makeInventory(){
  toggle=document.getElementById('inventoryToggleV19');
  if(!toggle){
    toggle=document.createElement('button');
    toggle.id='inventoryToggleV19';
    toggle.type='button';
    toggle.textContent='背包';
    root.appendChild(toggle);
  }

  panel=document.getElementById('inventoryPanelV19');
  if(!panel){
    panel=document.createElement('section');
    panel.id='inventoryPanelV19';
    panel.className='hidden';
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-label','背包');
    panel.innerHTML=`
      <div class="v19-bag-head">
        <div><div class="v19-bag-title">幸存者背包</div><div class="v19-bag-sub">材料与装备 · 自动保存</div></div>
        <button class="v19-bag-close" type="button" aria-label="关闭背包">×</button>
      </div>
      <div class="v19-bag-grid"></div>
      <div class="v19-bag-foot">电脑：B / I 打开背包 · 手机：点击【背包】</div>`;
    root.appendChild(panel);
  }

  hint=document.getElementById('desktopControlsV19');
  if(!hint){
    hint=document.createElement('div');
    hint.id='desktopControlsV19';
    hint.textContent='WASD / 方向键 移动 · Shift 冲刺 · 空格 攻击 · E 互动 · B / I 背包';
    root.appendChild(hint);
  }

  toggle.addEventListener('click',()=>setPanelOpen(panel.classList.contains('hidden')));
  panel.querySelector('.v19-bag-close')?.addEventListener('click',()=>setPanelOpen(false));
  refreshInventory();
}

function stopMovement(){
  keys.clear();
  try{joystickState.x=0;joystickState.y=0;}catch{}
  try{stopJoy();}catch{}
}
function setPanelOpen(open){
  API.panelOpen=!!open;
  if(open){
    stopMovement();
    try{craftPanel?.classList.add('hidden');}catch{}
    try{chatPanel?.classList.add('hidden');}catch{}
    document.getElementById('mapPanel')?.classList.add('hidden');
    document.getElementById('mapPanelV11')?.classList.add('hidden');
    refreshInventory();
    panel?.classList.remove('hidden');
  }else panel?.classList.add('hidden');
  toggle?.setAttribute('aria-expanded',open?'true':'false');
}

function refreshInventory(){
  if(!panel||typeof inventory==='undefined')return;
  const grid=panel.querySelector('.v19-bag-grid');
  if(!grid)return;
  const snapshot=inventorySnapshot(inventory);
  grid.replaceChildren();
  for(const id of Object.keys(ITEM_META)){
    const meta=ITEM_META[id];
    const card=document.createElement('article');
    card.className='v19-item';
    const icon=document.createElement('div');
    icon.className='v19-item-icon '+(RESOURCE_ITEMS.includes(id)?'sprite':'gear');
    if(RESOURCE_ITEMS.includes(id))icon.dataset.sprite=String(meta.sprite);
    else icon.textContent=meta.glyph||'?';
    const info=document.createElement('div');
    const title=document.createElement('div');title.className='v19-item-name';
    const name=document.createElement('span');name.textContent=meta.name;
    const count=document.createElement('strong');count.className='v19-item-count';count.textContent=RESOURCE_ITEMS.includes(id)?`×${snapshot[id]}`:(snapshot[id]?'已装备':'未制作');
    title.append(name,count);
    const desc=document.createElement('div');desc.className='v19-item-desc';desc.textContent=meta.desc;
    info.append(title,desc);
    if(!RESOURCE_ITEMS.includes(id)){
      const state=document.createElement('div');state.className='v19-item-state';state.textContent=snapshot[id]?'当前生效':'可在工作台制作';info.appendChild(state);
    }
    card.append(icon,info);grid.appendChild(card);
  }
}

function applyKeyboardMovement(){
  if(!isDesktop()||API.panelOpen)return;
  const v=keyboardVector(keys);
  try{joystickState.x=v.x;joystickState.y=v.y;}catch{}
}
function triggerDash(){
  try{if(started&&!dead&&dashCd<=0){dashQueued=true;dashCd=1.35;}}catch{}
}
function triggerAttack(){try{attack();}catch{}}
function triggerInteract(){
  const button=document.getElementById('interactV12')||document.getElementById('useBtn');
  try{button?.click();}catch{}
}
function movementCode(code){return ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight'].includes(code);}

function onKeyDown(event){
  if(!isDesktop()||isTypingTarget(event.target))return;
  if(movementCode(event.code)){
    event.preventDefault();keys.add(event.code);applyKeyboardMovement();return;
  }
  if((event.code==='KeyB'||event.code==='KeyI')&&!event.repeat){event.preventDefault();setPanelOpen(!API.panelOpen);return;}
  if(event.code==='Escape'&&API.panelOpen){event.preventDefault();setPanelOpen(false);return;}
  if(API.panelOpen)return;
  if((event.code==='ShiftLeft'||event.code==='ShiftRight')&&!event.repeat){event.preventDefault();triggerDash();return;}
  if(event.code==='Space'&&!event.repeat){event.preventDefault();triggerAttack();return;}
  if(event.code==='KeyE'&&!event.repeat){event.preventDefault();triggerInteract();}
}
function onKeyUp(event){
  if(!isDesktop()||isTypingTarget(event.target))return;
  if(movementCode(event.code)){event.preventDefault();keys.delete(event.code);applyKeyboardMovement();}
}

function fitDesktopCanvas(){
  if(!isDesktop())return;
  const rect=arenaWrap.getBoundingClientRect();
  if(rect.width<100||rect.height<100)return;
  const w=Math.max(640,Math.min(1100,Math.round(rect.width)));
  const h=Math.max(420,Math.min(820,Math.round(rect.height)));
  if(arenaCanvas.width!==w||arenaCanvas.height!==h){
    arenaCanvas.width=w;arenaCanvas.height=h;
    const context=arenaCanvas.getContext('2d');if(context)context.imageSmoothingEnabled=false;
  }
}
function applyPlatform(){
  API.desktop=isDesktop();
  document.documentElement.classList.toggle('abyssal-desktop-v19',API.desktop);
  document.documentElement.classList.toggle('abyssal-touch-v19',!API.desktop);
  stopMovement();
  fitDesktopCanvas();
}

addStyles();
makeInventory();

const baseUpdateUI=typeof updateUI==='function'?updateUI:null;
if(baseUpdateUI){
  updateUI=function(){const result=baseUpdateUI.apply(this,arguments);refreshInventory();return result;};
}

const baseDraw=typeof draw==='function'?draw:null;
if(baseDraw){
  draw=function(){fitDesktopCanvas();return baseDraw.apply(this,arguments);};
}

document.addEventListener('keydown',onKeyDown,true);
document.addEventListener('keyup',onKeyUp,true);
window.addEventListener('blur',stopMovement);
window.addEventListener('resize',()=>requestAnimationFrame(fitDesktopCanvas),{passive:true});
if(media.addEventListener)media.addEventListener('change',applyPlatform);
if('ResizeObserver' in window)new ResizeObserver(()=>requestAnimationFrame(fitDesktopCanvas)).observe(arenaWrap);
applyPlatform();
})();