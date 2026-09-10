(()=>{
'use strict';
document.documentElement.lang='zh-CN';
const DAY_MAP={DAY:'☀ 白天',DUSK:'◐ 黄昏',NIGHT:'☾ 夜晚',DAWN:'◑ 黎明'};
function fixDynamicText(){
  const day=document.getElementById('dayBadge');
  if(day){
    const t=String(day.textContent||'').toUpperCase();
    for(const [key,val] of Object.entries(DAY_MAP))if(t.includes(key)){day.textContent=val;break;}
  }
  const ready=document.getElementById('readyToggleV9');
  if(ready){
    const map={
      'PREP FIRST':'先准备','MARK READY':'标记准备','READY ✓':'已准备 ✓',
      'IN FIELD':'野外','READY ✓ · TAP TO CANCEL':'已准备 ✓ · 点击取消'
    };
    if(map[ready.textContent])ready.textContent=map[ready.textContent];
  }
}
setInterval(fixDynamicText,160);
fixDynamicText();
window.ABYSSAL_REGRESSION_V14={version:14,fixDynamicText};
})();