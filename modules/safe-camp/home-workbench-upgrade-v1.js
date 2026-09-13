(()=>{
'use strict';

if(globalThis.ABYSSAL_HOME_WORKBENCH_V1?.version===1)return;

const STORAGE_KEY='abyssal_home_workbench_v1';
const BASE_WARD_MS=15000;
const UPGRADED_WARD_MS=25000;
const COST=Object.freeze({stone:3,shard:2});
const state={tier:1,returnClearance:false,lastReturnAt:0};

function finite(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback;}
function storage(){try{return typeof localStorage!=='undefined'?localStorage:null;}catch{return null;}}
function inventoryRef(){try{return typeof inventory!=='undefined'&&inventory?inventory:null;}catch{return null;}}
function isHome(){try{return typeof inCamp==='function'&&!!inCamp();}catch{return false;}}
function snapshot(){return{tier:state.tier,returnClearance:state.returnClearance,lastReturnAt:state.lastReturnAt,wardMs:departureWardMs(),cost:{...COST}};}
function persist(){
  const target=storage();
  if(!target)return false;
  try{
    target.setItem(STORAGE_KEY,JSON.stringify({v:1,tier:state.tier,returnClearance:state.returnClearance,lastReturnAt:state.lastReturnAt}));
    return true;
  }catch{return false;}
}
function load(){
  const target=storage();
  if(!target)return snapshot();
  try{
    const saved=JSON.parse(target.getItem(STORAGE_KEY)||'null');
    if(saved?.v===1){
      state.tier=saved.tier===2?2:1;
      state.returnClearance=state.tier<2&&!!saved.returnClearance;
      state.lastReturnAt=Math.max(0,Math.floor(finite(saved.lastReturnAt,0)));
    }
  }catch{}
  return snapshot();
}
function departureWardMs(){return state.tier>=2?UPGRADED_WARD_MS:BASE_WARD_MS;}
function canUpgrade(){
  if(state.tier>=2)return{ok:false,reason:'already-upgraded'};
  if(!state.returnClearance)return{ok:false,reason:'expedition-return-required'};
  if(!isHome())return{ok:false,reason:'home-required'};
  const inv=inventoryRef();
  if(!inv)return{ok:false,reason:'inventory-unavailable'};
  if(finite(inv.stone)<COST.stone||finite(inv.shard)<COST.shard)return{ok:false,reason:'materials-required'};
  return{ok:true,reason:'ready'};
}
function refreshWorkbenchRow(){
  let panel=null;
  try{panel=typeof craftPanel!=='undefined'?craftPanel:null;}catch{}
  if(!panel?.querySelector)return null;
  let row=panel.querySelector('[data-home-upgrade-row="field-rig"]');
  if(!row){
    if(typeof document==='undefined')return null;
    row=document.createElement('div');
    row.className='recipe';
    row.dataset.homeUpgradeRow='field-rig';
    const label=document.createElement('span');
    label.dataset.homeUpgradeLabel='field-rig';
    const button=document.createElement('button');
    button.type='button';
    button.dataset.homeUpgrade='field-rig';
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();upgrade();});
    row.append(label,button);
    const close=panel.querySelector('#closeCraft')?.closest?.('.recipe');
    if(close)panel.insertBefore(row,close);else panel.appendChild(row);
  }
  const label=row.querySelector('[data-home-upgrade-label="field-rig"]');
  const button=row.querySelector('[data-home-upgrade="field-rig"]');
  if(state.tier>=2){
    if(label)label.textContent='Field Rig ONLINE · 出营护佑 25 秒';
    if(button){button.textContent='ONLINE ✓';button.disabled=true;}
  }else if(state.returnClearance){
    if(label)label.textContent='Field Rig · 3 石头 + 2 异质碎片';
    if(button){button.textContent='UPGRADE';button.disabled=false;}
  }else{
    if(label)label.textContent='Field Rig · 完成 MIRE MART 返程后解锁';
    if(button){button.textContent='LOCKED';button.disabled=false;}
  }
  return row;
}
function recordExpeditionReturn(meta={}){
  if(state.tier>=2)return snapshot();
  state.returnClearance=true;
  state.lastReturnAt=Math.max(state.lastReturnAt,Math.floor(finite(meta.at,Date.now())));
  persist();
  refreshWorkbenchRow();
  return snapshot();
}
function upgrade(){
  const gate=canUpgrade();
  if(!gate.ok){
    try{
      if(gate.reason==='already-upgraded')toast('Field Rig 已上线。');
      else if(gate.reason==='expedition-return-required')toast('先完成 MIRE MART 远征并把物资带回营地。');
      else if(gate.reason==='home-required')toast('只能在 Safe Camp 工作台升级 Field Rig。');
      else if(gate.reason==='materials-required')toast('Field Rig 需要 3 石头 + 2 异质碎片。');
      else toast('Field Rig 暂时无法升级。');
    }catch{}
    refreshWorkbenchRow();
    return{ok:false,reason:gate.reason,state:snapshot()};
  }
  const inv=inventoryRef();
  inv.stone=Math.max(0,finite(inv.stone)-COST.stone);
  inv.shard=Math.max(0,finite(inv.shard)-COST.shard);
  state.tier=2;
  state.returnClearance=false;
  persist();
  try{if(typeof saveLocal==='function')saveLocal();}catch{}
  try{if(typeof updateUI==='function')updateUI();}catch{}
  try{toast('Workbench Field Rig 已上线 · 下一次离营护佑延长至 25 秒。');}catch{}
  refreshWorkbenchRow();
  return{ok:true,reason:'upgraded',state:snapshot()};
}

load();
refreshWorkbenchRow();

globalThis.ABYSSAL_HOME_WORKBENCH_V1={
  version:1,
  storageKey:STORAGE_KEY,
  cost:COST,
  baseWardMs:BASE_WARD_MS,
  upgradedWardMs:UPGRADED_WARD_MS,
  getState:snapshot,
  canUpgrade,
  recordExpeditionReturn,
  upgrade,
  departureWardMs,
  refreshWorkbenchRow
};
})();
