(()=>{
  'use strict';

  const GUIDE={x:2325,y:2370};
  const FIRE={x:2400,y:2400};
  const WORKBENCH={x:2195,y:2535};
  const CHEST={id:'chest:1:1:main',x:2590,y:2540,cooldown:90000};
  const ITEM_ZH={wood:'木材',stone:'石头',food:'食物',shard:'异质碎片'};
  const CHAT_QUEUE=[];

  let fireCooldownUntil=0;
  let dialogOpen=false;
  let lastChatAt=0;
  let chatFlushing=false;

  function safeStop(){
    try{ stopJoy(); }catch{}
    try{ dashQueued=false; }catch{}
  }

  function hideOtherPanels(){
    try{ craftPanel.classList.add('hidden'); }catch{}
    try{ chatPanel.classList.add('hidden'); }catch{}
    document.getElementById('mapPanel')?.classList.add('hidden');
    document.getElementById('mapPanelV11')?.classList.add('hidden');
  }

  function addStyle(){
    if(document.getElementById('v12InteractionStyle'))return;
    const style=document.createElement('style');
    style.id='v12InteractionStyle';
    style.textContent=`
      #interactionPromptV11{display:none!important}
      #interactionPromptV12{position:absolute;left:50%;bottom:calc(155px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:44;display:none;max-width:82%;padding:8px 11px;border:1px solid #a9c6b6;border-radius:5px;background:#091714f2;color:#f4f8f5;font:800 9px ui-monospace,monospace;text-align:center;pointer-events:none;box-shadow:0 5px 18px #0009}
      #guideDialogV12{position:absolute;inset:118px 10px auto 10px;z-index:80;display:none;border:2px solid #9bb9a8;background:#091512f8;box-shadow:0 16px 45px #000c;padding:0;max-height:64%;overflow:auto}
      #guideDialogV12.open{display:block}
      .v12-dialog-head{display:grid;grid-template-columns:62px 1fr 34px;gap:9px;align-items:center;padding:10px;border-bottom:1px solid #496158;background:#10231d}
      .v12-guide-portrait{width:58px;height:58px;position:relative;border:2px solid #829d90;background:#173028;image-rendering:pixelated;overflow:hidden}
      .v12-guide-portrait:before{content:'';position:absolute;left:17px;top:8px;width:22px;height:20px;background:#b8b39a;box-shadow:0 -5px #273830,-6px 6px #7f8977,6px 6px #8d9985}
      .v12-guide-portrait:after{content:'';position:absolute;left:13px;top:30px;width:30px;height:26px;background:#30483e;box-shadow:-6px 5px #20352d,6px 5px #20352d}
      .v12-dialog-name{font-size:12px;color:#f5e6aa;font-weight:950;letter-spacing:.08em}.v12-dialog-role{margin-top:4px;font-size:7px;color:#a9bcb3;line-height:1.5}
      .v12-dialog-close{width:30px;height:30px;border:1px solid #61776e;background:#182a25;color:#fff;font-size:18px}
      .v12-dialog-body{padding:13px 12px 8px;color:#e6eee9;font-size:10px;line-height:1.75;min-height:86px}
      .v12-dialog-options{display:grid;gap:6px;padding:8px 12px 12px}.v12-dialog-options button{min-height:39px;padding:8px 9px;border:1px solid #6d897b;background:#17362d;color:#edf5f0;text-align:left;font:800 9px ui-monospace,monospace;border-radius:4px}.v12-dialog-options button:active{background:#2b5445}
      .v12-dialog-task{margin:0 12px 12px;padding:8px;border:1px dashed #6c8176;background:#0f201b;color:#c5d9cf;font-size:8px;line-height:1.5}
      #chatSendV12{border:1px solid #71887f;background:#285247;color:#fff;font-weight:900}
    `;
    document.head.appendChild(style);
  }

  function makePrompt(){
    let el=document.getElementById('interactionPromptV12');
    if(el)return el;
    el=document.createElement('div');
    el.id='interactionPromptV12';
    game.appendChild(el);
    return el;
  }

  function makeDialog(){
    let panel=document.getElementById('guideDialogV12');
    if(panel)return panel;
    panel=document.createElement('div');
    panel.id='guideDialogV12';
    panel.innerHTML=`
      <div class="v12-dialog-head">
        <div class="v12-guide-portrait" aria-hidden="true"></div>
        <div><div class="v12-dialog-name">营地向导</div><div class="v12-dialog-role">沼林岛守火人 · 新手引导</div></div>
        <button id="guideDialogCloseV12" class="v12-dialog-close" type="button">×</button>
      </div>
      <div id="guideDialogBodyV12" class="v12-dialog-body"></div>
      <div id="guideDialogOptionsV12" class="v12-dialog-options"></div>
      <div id="guideDialogTaskV12" class="v12-dialog-task"></div>
    `;
    game.appendChild(panel);
    panel.querySelector('#guideDialogCloseV12').addEventListener('click',closeGuideDialog);
    panel.addEventListener('click',event=>{
      const button=event.target.closest('[data-dialog-page]');
      if(!button)return;
      showDialogPage(button.dataset.dialogPage);
    });
    return panel;
  }

  const DIALOG={
    intro:{
      text:'你醒了？先别急着往雾里跑。这里是沼林岛唯一稳定的安全营地。火还烧着的时候，你可以在这里恢复、收集基础材料、制作装备，也可以等你的朋友一起出发。',
      options:[['task','我现在应该做什么？'],['gather','材料怎么采集？'],['safe','这里为什么安全？'],['friend','怎么和朋友会合？'],['leave','结束交谈']]
    },
    task:{
      text:'先在营地周围收集 4 份木材和 3 块石头。靠近材料时，屏幕会出现【互动】提示。材料够了以后去西南侧工作台制作骨刃。做好骨刃、带上食物，再决定什么时候离开营地。',
      options:[['intro','我明白了'],['gather','再告诉我怎么采集'],['leave','结束交谈']]
    },
    gather:{
      text:'靠近木头、石头、食物或异质碎片，等屏幕下方出现对应提示，然后按【互动】。营地的新手材料是你自己的，不会被队友抢走；营地外的公共资源会和其他玩家实时同步。',
      options:[['task','那我先做新手任务'],['intro','返回'],['leave','结束交谈']]
    },
    safe:{
      text:'安全营地有结界。怪物不能进入，玩家之间也不能互相伤害。站到篝火旁按【互动】可以恢复生命和理智。离开营地后会得到一段短暂护佑，让你有时间观察周围。',
      options:[['friend','那我的朋友呢？'],['intro','返回'],['leave','结束交谈']]
    },
    friend:{
      text:'让朋友打开和你完全相同的游戏链接，输入不同名字并进入安全营地。顶部“在线”人数应该增加；你们在同一区域时会实时看到彼此移动。世界聊天恢复后，也可以直接用聊天确认位置。',
      options:[['task','我们准备好后做什么？'],['intro','返回'],['leave','结束交谈']]
    }
  };

  function currentTaskText(){
    if(inventory.wood<4||inventory.stone<3)return `当前目标：木材 ${inventory.wood}/4 · 石头 ${inventory.stone}/3`;
    if(!inventory.knife)return '当前目标：前往西南侧工作台制作【骨刃】。';
    if(!hasLeftCamp)return '当前目标：等待队友准备好，然后一起离开安全营地。';
    return '当前状态：已完成基础准备，可以继续探索或返回营地补给。';
  }

  function showDialogPage(page){
    if(page==='leave'){ closeGuideDialog(); return; }
    const data=DIALOG[page]||DIALOG.intro;
    const panel=makeDialog();
    panel.querySelector('#guideDialogBodyV12').textContent=data.text;
    const options=panel.querySelector('#guideDialogOptionsV12');
    options.replaceChildren();
    for(const [target,label] of data.options){
      const b=document.createElement('button');
      b.type='button';
      b.dataset.dialogPage=target;
      b.textContent=label;
      options.appendChild(b);
    }
    panel.querySelector('#guideDialogTaskV12').textContent=currentTaskText();
  }

  function openGuideDialog(){
    safeStop();
    hideOtherPanels();
    try{localStorage.setItem('abyssal_guide_v7','1');}catch{}
    dialogOpen=true;
    const panel=makeDialog();
    panel.classList.add('open');
    showDialogPage('intro');
    try{updateQuest();updateUI();}catch{}
  }

  function closeGuideDialog(){
    dialogOpen=false;
    document.getElementById('guideDialogV12')?.classList.remove('open');
  }

  function nearestResource(){
    let target=null,best=82;
    for(const r of resources){
      if((harvested.get(r.id)||0)>Date.now())continue;
      const d=distance(me,r);
      if(d<best){best=d;target=r;}
    }
    return target?{resource:target,d:best}:null;
  }

  function interactionTarget(){
    if(!started||dead||dialogOpen)return null;
    if(inCamp()){
      const guideD=Math.hypot(me.x-GUIDE.x,me.y-GUIDE.y);
      if(guideD<=92)return{type:'guide',d:guideD,label:'【互动】与营地向导交谈'};
      const workbenchD=Math.hypot(me.x-WORKBENCH.x,me.y-WORKBENCH.y);
      if(workbenchD<=92)return{type:'workbench',d:workbenchD,label:'【互动】使用工作台'};
      const chestD=Math.hypot(me.x-CHEST.x,me.y-CHEST.y);
      if(chestD<=92){
        const left=(harvested.get(CHEST.id)||0)-Date.now();
        return{type:'chest',d:chestD,label:left>0?`共享宝箱刷新中 · ${Math.ceil(left/1000)}秒`:'【互动】打开共享宝箱'};
      }
      const fireD=Math.hypot(me.x-FIRE.x,me.y-FIRE.y);
      if(fireD<=78)return{type:'fire',d:fireD,label:'【互动】在篝火旁休息'};
    }
    const nr=nearestResource();
    if(nr&&nr.d<=82)return{type:'resource',d:nr.d,label:`【互动】采集${ITEM_ZH[nr.resource.type]||'资源'}`,resource:nr.resource};
    return null;
  }

  function harvestResource(r){
    if(!r)return;
    if((harvested.get(r.id)||0)>Date.now())return;
    inventory[r.type]=(inventory[r.type]||0)+1;
    const localCamp=String(r.id).startsWith('camp:');
    const until=Date.now()+(localCamp?12000:60000);
    harvested.set(r.id,until);
    if(!localCamp&&zoneConnected&&zoneCh){
      zoneCh.send({type:'broadcast',event:'harvest',payload:{zone:currentZone,rid:r.id,until}});
    }
    saveLocal();
    updateUI();
    toast(`获得${ITEM_ZH[r.type]||'资源'} ×1`);
  }

  function restAtFire(){
    const now=Date.now();
    if(fireCooldownUntil>now){
      toast(`篝火还需要 ${Math.ceil((fireCooldownUntil-now)/1000)} 秒才能再次休息。`);
      return;
    }
    fireCooldownUntil=now+12000;
    me.hp=clamp(me.hp+24,0,100);
    me.sanity=clamp(me.sanity+34,0,100);
    saveLocal();
    updateUI();
    toast('你坐在篝火旁休息，生命 +24，理智 +34。');
  }

  async function openChest(){
    const until=harvested.get(CHEST.id)||0;
    if(until>Date.now()){
      toast(`共享宝箱还要 ${Math.ceil((until-Date.now())/1000)} 秒刷新。`);
      return;
    }
    if(!zoneConnected||!zoneCh){
      toast('多人同步尚未连接，暂时不能打开共享宝箱。');
      window.ABYSSAL_NET_V9?.reconnect?.();
      return;
    }
    const next=Date.now()+CHEST.cooldown;
    harvested.set(CHEST.id,next);
    const result=await zoneCh.send({type:'broadcast',event:'harvest',payload:{zone:currentZone,rid:CHEST.id,until:next}}).catch(()=>null);
    if(result!=='ok'){
      harvested.delete(CHEST.id);
      toast('宝箱同步失败，请重新试一次。');
      return;
    }
    inventory.food+=1;
    if(Math.random()<0.55){inventory.shard+=1;toast('打开共享宝箱：食物 ×1，异质碎片 ×1。');}
    else{inventory.stone+=1;toast('打开共享宝箱：食物 ×1，石头 ×1。');}
    saveLocal();updateUI();
  }

  function interact(){
    safeStop();
    const target=interactionTarget();
    if(!target){toast('附近没有可以互动的目标。');return;}
    if(target.type==='guide'){openGuideDialog();return;}
    if(target.type==='fire'){restAtFire();return;}
    if(target.type==='workbench'){
      hideOtherPanels();
      craftPanel.classList.remove('hidden');
      return;
    }
    if(target.type==='chest'){openChest();return;}
    if(target.type==='resource'){harvestResource(target.resource);return;}
  }

  function replaceInteractionButton(){
    const old=document.getElementById('useBtn');
    if(!old)return null;
    const button=old.cloneNode(true);
    button.id='interactV12';
    button.textContent='互动';
    old.replaceWith(button);
    button.addEventListener('pointerdown',event=>{event.preventDefault();interact();},{passive:false});
    button.addEventListener('click',event=>event.preventDefault());
    return button;
  }

  function replaceChatControls(){
    const oldInput=document.getElementById('chatInput');
    const oldSend=document.getElementById('chatSend');
    if(!oldInput||!oldSend)return{};
    const input=oldInput.cloneNode(true);
    input.id='chatInputV12';
    input.placeholder='输入消息…';
    const send=oldSend.cloneNode(true);
    send.id='chatSendV12';
    send.textContent='发送';
    oldInput.replaceWith(input);
    oldSend.replaceWith(send);
    return{input,send};
  }

  function appendOwnChat(text){
    receiveChat({id:SESSION_ID,name:me.name||'我',text,zone:currentZone});
  }

  async function transmitChat(item){
    if(!globalConnected||!globalCh)return false;
    try{
      const result=await globalCh.send({type:'broadcast',event:'chat',payload:{id:SESSION_ID,name:me.name,text:item.text,zone:currentZone,clientAt:item.at}});
      return result==='ok';
    }catch(error){
      console.warn('[Abyssal V12 chat]',error);
      return false;
    }
  }

  async function sendChatV12(input){
    const text=cleanChat(input.value);
    if(!text){toast('请输入消息。');return;}
    if(Date.now()-lastChatAt<450)return;
    lastChatAt=Date.now();
    input.value='';
    const item={text,at:Date.now()};
    appendOwnChat(text);
    if(await transmitChat(item)){
      toast('消息已发送。');
      return;
    }
    if(CHAT_QUEUE.length>=20)CHAT_QUEUE.shift();
    CHAT_QUEUE.push(item);
    toast('已显示在聊天框；网络恢复后会自动发送给队友。');
    window.ABYSSAL_NET_V9?.reconnect?.();
  }

  async function flushChat(){
    if(chatFlushing||!CHAT_QUEUE.length||!globalConnected||!globalCh)return;
    chatFlushing=true;
    try{
      while(CHAT_QUEUE.length&&globalConnected&&globalCh){
        if(!(await transmitChat(CHAT_QUEUE[0])))break;
        CHAT_QUEUE.shift();
      }
    }finally{
      chatFlushing=false;
    }
  }

  addStyle();
  const prompt=makePrompt();
  makeDialog();
  replaceInteractionButton();
  const chat=replaceChatControls();

  chat.send?.addEventListener('click',()=>sendChatV12(chat.input));
  chat.input?.addEventListener('keydown',event=>{
    if(event.key==='Enter'){
      event.preventDefault();
      sendChatV12(chat.input);
    }
  });

  document.getElementById('guideDialogV12')?.addEventListener('pointerdown',event=>event.stopPropagation());

  setInterval(()=>{
    if(dialogOpen){prompt.style.display='none';return;}
    const target=interactionTarget();
    if(!target){prompt.style.display='none';}
    else{prompt.style.display='block';prompt.textContent=target.label;}
    flushChat();
  },200);

  window.ABYSSAL_INTERACTION_V12={
    version:12,
    openGuide:openGuideDialog,
    closeGuide:closeGuideDialog,
    getTarget:interactionTarget,
    queuedChatCount:()=>CHAT_QUEUE.length
  };
})();