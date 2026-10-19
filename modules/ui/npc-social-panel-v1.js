(()=>{
  'use strict';
  if(globalThis.ABYSSAL_NPC_SOCIAL_PANEL_V1?.version===1)return;
  const root=document.getElementById('game');if(!root)return;
  const names={food:'口粮',egg:'鸡蛋',milk:'牛奶',wool:'羊毛',fish_reedcarp:'芦影鲫',fish_glassminnow:'玻璃银鱼',fish_holloweye:'空眼鱼'};
  let panel=null,body=null,isOpen=false;
  function make(){
    if(panel)return panel;
    const style=document.createElement('style');style.id='npcSocialPanelV1Style';style.textContent='#npcSocialPanelV1{position:absolute;inset:118px 12px auto;z-index:96;max-height:calc(100% - 138px);overflow:auto;border:2px solid #a7b99d;background:#111c17f8;color:#f0f1e8;box-shadow:0 18px 48px #000c}#npcSocialPanelV1[hidden]{display:none!important}.social-v1-head{display:flex;align-items:center;justify-content:space-between;padding:11px;border-bottom:1px solid #53624f;background:#1b2c22}.social-v1-title{font:950 11px ui-monospace,monospace;color:#f4e7ad}.social-v1-close{width:31px;height:30px;border:1px solid #71826a;background:#293a2d;color:#fff;font-size:18px}.social-v1-body{display:grid;gap:9px;padding:11px}.social-v1-summary{padding:9px;border:1px solid #536652;background:#17241a;font:800 8px/1.6 ui-monospace,monospace;color:#d9e4cb}.social-v1-gift{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:8px;border:1px solid #3d4d3d;background:#17221a}.social-v1-gift-name{font:900 8px ui-monospace,monospace}.social-v1-response{margin-top:4px;color:#a8b9a4;font:600 7px/1.45 ui-monospace,monospace}.social-v1-button{min-width:64px;height:31px;border:1px solid #9cae8b;background:#34533a;color:#fff;font:900 8px ui-monospace,monospace}.social-v1-button:disabled{border-color:#4b554a;background:#292f2a;color:#889187}.social-v1-note{padding:8px;border:1px dashed #56644e;color:#b7c1ae;font:700 7px/1.5 ui-monospace,monospace}';document.head.appendChild(style);
    panel=document.createElement('section');panel.id='npcSocialPanelV1';panel.hidden=true;panel.innerHTML='<header class="social-v1-head"><div><div class="social-v1-title">营地来往</div><div class="social-v1-response">把一份用得上的东西交给向导，关系会留在这份存档里。</div></div><button type="button" class="social-v1-close" aria-label="关闭送礼面板">×</button></header><div class="social-v1-body"></div>';
    body=panel.querySelector('.social-v1-body');panel.querySelector('.social-v1-close').addEventListener('click',close);panel.addEventListener('pointerdown',event=>event.stopPropagation());
    panel.addEventListener('click',event=>{const button=event.target.closest('[data-gift]');if(!button)return;const result=globalThis.ABYSSAL_NPC_SOCIAL_V1?.giveGift?.(button.dataset.gift);if(result?.ok){render(result.response,result.newlyUnlocked);return;}try{toast(result?.reason==='materials-required'?'背包里没有这件礼物。':result?.reason==='save-failed'?'关系没有保存，物品已退回。':'需要靠近营地向导才能送礼。')}catch{}});
    root.appendChild(panel);return panel;
  }
  function render(response='',newlyUnlocked=[]){
    if(!body)return;body.replaceChildren();const social=globalThis.ABYSSAL_NPC_SOCIAL_V1?.getSnapshot?.()||{favor:0,level:'刚认识'},summary=document.createElement('div');summary.className='social-v1-summary';summary.textContent=`${social.title||'营地向导'} · ${social.level} · 好感 ${social.favor}${social.nextFavor===null?'':` / ${social.nextFavor} 解锁下一份信任`}${response?`\n“${response}”`:''}`;body.appendChild(summary);
    for(const gift of globalThis.ABYSSAL_NPC_SOCIAL_V1?.giftOptions?.()||[]){const row=document.createElement('article');row.className='social-v1-gift';const copy=document.createElement('div'),title=document.createElement('div'),description=document.createElement('div');title.className='social-v1-gift-name';title.textContent=`${names[gift.itemId]||gift.itemId} · 好感 +${gift.favor}`;description.className='social-v1-response';description.textContent=gift.response||'';copy.append(title,description);const button=document.createElement('button');button.type='button';button.className='social-v1-button';button.dataset.gift=gift.itemId;button.textContent=`赠送 ×${gift.count}`;button.disabled=gift.count<1;row.append(copy,button);body.appendChild(row);}
    const note=document.createElement('div');note.className='social-v1-note';note.textContent=newlyUnlocked.length?newlyUnlocked.map(unlock=>unlock.message).join(' '):'靠近向导后交谈，再选择“送一份礼物”。送礼每次只消耗一件物品。';body.appendChild(note);
  }
  function open(){const social=globalThis.ABYSSAL_NPC_SOCIAL_V1;if(!social?.inReach?.()){try{toast('需要靠近营地向导才能送礼。')}catch{}return false;}make();render();isOpen=true;panel.hidden=false;return true;}
  function close(){isOpen=false;if(panel)panel.hidden=true;}
  window.addEventListener('abyssal:npc-relationship-changed',event=>{if(isOpen)render('',event.detail?.newlyUnlocked||[])});
  globalThis.ABYSSAL_NPC_SOCIAL_PANEL_V1=Object.freeze({version:1,open,close,render,visible:()=>isOpen});
})();
