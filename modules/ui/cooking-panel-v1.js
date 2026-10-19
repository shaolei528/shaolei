(()=>{
  'use strict';
  if(globalThis.ABYSSAL_COOKING_PANEL_V1?.version===1)return;
  const root=document.getElementById('game');
  if(!root)return;
  const names={wood:'木材',stone:'石头',food:'口粮',shard:'异质碎片',egg:'鸡蛋',milk:'牛奶',wool:'羊毛',fish_reedcarp:'芦影鲫',fish_glassminnow:'玻璃银鱼',fish_holloweye:'空眼鱼'};
  for(const[id,meal]of Object.entries(globalThis.ABYSSAL_COOKING_CONFIG_V1?.meals||{}))names[id]=meal.name;
  let isOpen=false,panel=null,body=null,refreshId=0;
  function addStyle(){
    if(document.getElementById('cookingPanelV1Style'))return;
    const style=document.createElement('style');style.id='cookingPanelV1Style';
    style.textContent=`#cookingPanelV1{position:absolute;inset:112px 10px auto;z-index:93;max-height:calc(100% - 132px);overflow:auto;border:2px solid #819b8d;background:#101a17f7;color:#edf3ef;box-shadow:0 18px 48px #000c}#cookingPanelV1[hidden]{display:none!important}.cook-v1-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #46574f;background:#172721}.cook-v1-title{font:950 12px ui-monospace,monospace;letter-spacing:.08em}.cook-v1-close{width:31px;height:30px;border:1px solid #72877c;background:#21362d;color:#fff;font-size:18px}.cook-v1-body{padding:11px;display:grid;gap:12px}.cook-v1-section{display:grid;gap:7px}.cook-v1-section h3{margin:0;color:#d9c891;font:900 8px ui-monospace,monospace;letter-spacing:.08em}.cook-v1-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;border:1px solid #3b5046;background:#14221c;padding:9px}.cook-v1-name{font:900 9px ui-monospace,monospace;color:#f1eee1}.cook-v1-desc{margin-top:4px;color:#aabbb2;font:600 7px/1.5 ui-monospace,monospace}.cook-v1-cost{margin-top:4px;color:#c8d4cd;font:700 7px ui-monospace,monospace}.cook-v1-action{min-width:60px;height:31px;border:1px solid #91a99a;border-radius:3px;background:#28503d;color:#fff;font:900 8px ui-monospace,monospace}.cook-v1-action:disabled{border-color:#46534d;background:#252e2a;color:#89968f}.cook-v1-empty{padding:8px;border:1px dashed #4a5c52;color:#99aaa1;font:700 8px/1.55 ui-monospace,monospace}`;
    document.head.appendChild(style);
  }
  function makePanel(){
    if(panel)return panel;
    addStyle();panel=document.createElement('section');panel.id='cookingPanelV1';panel.hidden=true;
    panel.innerHTML='<header class="cook-v1-head"><div><div class="cook-v1-title">篝火料理</div><div class="cook-v1-desc">食材会从背包原子扣除，料理效果会随存档保存</div></div><button class="cook-v1-close" type="button" aria-label="关闭料理">×</button></header><div class="cook-v1-body"></div>';
    body=panel.querySelector('.cook-v1-body');panel.querySelector('.cook-v1-close').addEventListener('click',close);
    panel.addEventListener('pointerdown',event=>event.stopPropagation());
    panel.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(!button)return;const action=button.dataset.action,id=button.dataset.id;let result;if(action==='cook')result=globalThis.ABYSSAL_COOKING_V1?.cookRecipe?.(id);else if(action==='eat')result=globalThis.ABYSSAL_COOKING_V1?.eatMeal?.(id);if(result?.ok)render();else if(result?.reason==='materials-required')render();});
    panel.addEventListener('pointerdown',event=>{const button=event.target.closest('[data-action]');if(!button)return;event.preventDefault();button.click();},{passive:false});
    root.appendChild(panel);return panel;
  }
  function makeCard({title,description,costs={},action,id,disabled=false,locked=false}){
    const card=document.createElement('article');card.className='cook-v1-card';
    const copy=document.createElement('div');const heading=document.createElement('div');heading.className='cook-v1-name';heading.textContent=title;copy.appendChild(heading);
    if(description){const desc=document.createElement('div');desc.className='cook-v1-desc';desc.textContent=description;copy.appendChild(desc);}
    const ingredients=Object.entries(costs).map(([item,count])=>`${names[item]||item} ${Math.max(0,Math.floor(Number(inventory?.[item])||0))}/${count}`).join(' · ');
    if(ingredients){const line=document.createElement('div');line.className='cook-v1-cost';line.textContent=ingredients;copy.appendChild(line);}
    const button=document.createElement('button');button.type='button';button.className='cook-v1-action';button.dataset.action=action;button.dataset.id=id;button.textContent=locked?'未解锁':action==='cook'?'制作':'食用';button.disabled=disabled||locked;card.append(copy,button);return card;
  }
  function section(title,rows){const group=document.createElement('section');group.className='cook-v1-section';const heading=document.createElement('h3');heading.textContent=title;group.appendChild(heading);if(!rows.length){const empty=document.createElement('div');empty.className='cook-v1-empty';empty.textContent=title==='可制作'?'钓鱼或收取农场产物，带回篝火后就能烹饪。':'还没有做好的料理。';group.appendChild(empty);}else for(const row of rows)group.appendChild(row);return group;}
  function render(){
    if(!body)return;body.replaceChildren();
    const cooking=globalThis.ABYSSAL_COOKING_V1,recipes=cooking?.listRecipes?.()||[],available=recipes.map(recipe=>makeCard({title:recipe.name,description:recipe.description,costs:recipe.costs,action:'cook',id:recipe.id,disabled:!recipe.available,locked:!recipe.unlocked}));
    const meals=Object.entries(globalThis.ABYSSAL_COOKING_CONFIG_V1?.meals||{}).filter(([id])=>Number(inventory?.[id])>0).map(([id,meal])=>makeCard({title:`${meal.name} ×${Math.floor(Number(inventory[id])||0)}`,description:`饱食 +${meal.effects?.hunger||0} · 生命 +${meal.effects?.hp||0} · 理智 ${Number(meal.effects?.sanity)>=0?'+':''}${meal.effects?.sanity||0}${meal.buff?.name?` · ${meal.buff.name} ${meal.buff.durationSeconds}秒`:''}`,action:'eat',id,disabled:false}));
    body.append(section('可制作',available),section('背包料理',meals));
  }
  function isNearFire(){return globalThis.ABYSSAL_COOKING_V1?.nearFire?.(typeof me!=='undefined'?me:null)===true;}
  function openPanel(){if(!isNearFire()){try{toast('需要靠近营地篝火才能料理。')}catch{}return false;}makePanel();render();isOpen=true;panel.hidden=false;clearInterval(refreshId);refreshId=setInterval(()=>{if(isOpen)render();},900);return true;}
  function close(){isOpen=false;clearInterval(refreshId);refreshId=0;if(panel)panel.hidden=true;}
  function visible(){return !!isOpen;}
  window.addEventListener('keydown',event=>{if(event.key==='Escape'&&isOpen){event.preventDefault();close();}});
  globalThis.ABYSSAL_COOKING_PANEL_V1=Object.freeze({version:1,open:openPanel,close,render,isNearFire,visible});
})();
