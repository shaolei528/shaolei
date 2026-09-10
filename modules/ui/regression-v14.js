(()=>{
'use strict';
document.documentElement.lang='zh-CN';

const DAY_MAP={DAY:'☀ 白天',DUSK:'◐ 黄昏',NIGHT:'☾ 夜晚',DAWN:'◑ 黎明'};
const CONNECTION_MAP={
  GOOD:'良好',FAIR:'一般',POOR:'较差',RECONNECTING:'重新连接',CONNECTING:'连接中',OFFLINE:'离线',
  'PUBLIC RELAY · RECONNECTING':'重新连接','公网重连中':'重新连接'
};

function canonicalDay(text){
  const t=String(text||'').trim();
  const upper=t.toUpperCase();
  for(const [key,val] of Object.entries(DAY_MAP))if(upper.includes(key))return val;
  return t;
}
function canonicalConnection(text){
  const t=String(text||'').trim();
  return CONNECTION_MAP[t.toUpperCase()]||CONNECTION_MAP[t]||t;
}
function fixDynamicText(){
  const day=document.getElementById('dayBadge');
  if(day){const next=canonicalDay(day.textContent);if(next&&day.textContent!==next)day.textContent=next;}

  const connection=document.getElementById('connection');
  if(connection){const next=canonicalConnection(connection.textContent);if(next&&connection.textContent!==next)connection.textContent=next;}

  const ready=document.getElementById('readyToggleV9');
  if(ready){
    const map={
      'PREP FIRST':'先准备','MARK READY':'标记准备','READY ✓':'已准备 ✓',
      'IN FIELD':'野外','READY ✓ · TAP TO CANCEL':'已准备 ✓ · 点击取消'
    };
    if(map[ready.textContent])ready.textContent=map[ready.textContent];
  }
}

/* Apply localization synchronously after the normal UI update instead of polling
   every 160ms. A targeted MutationObserver catches any late network/day label write
   in the same microtask checkpoint, avoiding visible English/Chinese oscillation. */
const baseUpdateUIV14=typeof updateUI==='function'?updateUI:null;
if(baseUpdateUIV14){
  updateUI=function(){const result=baseUpdateUIV14.apply(this,arguments);fixDynamicText();return result;};
}

const observed=[];
for(const id of ['dayBadge','connection']){
  const el=document.getElementById(id);
  if(el&&typeof MutationObserver==='function'){
    const observer=new MutationObserver(()=>fixDynamicText());
    observer.observe(el,{childList:true,characterData:true,subtree:true});
    observed.push(observer);
  }
}

fixDynamicText();
window.ABYSSAL_REGRESSION_V14={version:14,fixDynamicText,canonicalDay,canonicalConnection,observers:observed.length};
})();