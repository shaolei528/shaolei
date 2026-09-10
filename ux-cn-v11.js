(()=>{
  'use strict';

  const UX={version:11,chatQueue:[],chatSending:false,lastChatSendAt:0};
  window.ABYSSAL_UX_V11=UX;

  const GUIDE_V11={x:2325,y:2370};
  const FIRE_V11={x:2400,y:2400};
  const WORKBENCH_V11={x:2195,y:2535};
  const CHEST_V11={id:'chest:1:1:main',x:2590,y:2540,cooldown:90000};
  const ZH_ZONES={
    '0:0':'沉没林地','1:0':'黑沼','2:0':'盐蚀遗迹',
    '0:1':'泣水湿地','1:1':'沼林岛','2:1':'苍白泥沼',
    '0:2':'沉没海岸','1:2':'墓苇荡','2:2':'低潮深地'
  };
  const ITEM_ZH={wood:'木材',stone:'石头',food:'食物',shard:'异质碎片'};
  const dayBadgeV11=document.getElementById('dayBadge');

  for(const [zone,label] of Object.entries(ZH_ZONES)){
    if(BIOMES?.[zone]) BIOMES[zone][0]=label;
  }

  function zhText(value){
    const text=String(value??'');
    const exact={
      'GOOD':'良好','FAIR':'一般','POOR':'较差','RECONNECTING':'重新连接','CONNECTING':'连接中','OFFLINE':'离线',
      'Safe Camp synced.':'安全营地已同步。','World sync changed hands.':'世界同步主机已切换。',
      'Weapons stay lowered inside Safe Camp.':'安全营地内禁止攻击。',
      'You already carry a Bone Knife.':'你已经有一把骨刃。','Bone Knife crafted.':'骨刃制作完成。',
      'Need 4 wood + 3 stone.':'需要 4 木材 + 3 石头。','Your lantern is already awake.':'你已经拥有提灯。',
      'Lantern crafted.':'提灯制作完成。','Need 3 wood + 2 shard.':'需要 3 木材 + 2 异质碎片。',
      'You eat by the fire.':'你在篝火旁吃下了口粮。','Need 2 food.':'需要 2 份食物。',
      'The fire needs a moment.':'篝火需要稍微恢复一下。','You rest beside the fire.':'你在篝火旁休息，生命与理智得到恢复。',
      'Workbench is on the southwest side of camp.':'工作台在营地西南侧。','Nothing useful nearby.':'附近没有可以互动的东西。',
      'Something ancient collapses.':'古老的怪物倒下了。','You found food scraps.':'你找到了一些食物。',
      'The Watcher sees you.':'凝视者发现了你。','Something tears at you.':'有什么东西正在撕咬你。',
      'You wake beside the campfire.':'你在营地篝火旁重新醒来。',
      'Safe Camp · monsters cannot enter.':'安全营地：怪物无法进入。',
      'You left Safe Camp · 15s field ward.':'你离开了安全营地，获得临时护佑。',
      'Safe Camp: no monsters, no PvP. Talk and prepare before leaving.':'安全营地：没有怪物、禁止 PvP。先聊天、准备，再出发。'
    };
    if(exact[text]) return exact[text];
    let m=text.match(/^Collected (wood|stone|food|shard)$/);if(m)return '获得 '+ITEM_ZH[m[1]];
    m=text.match(/^Recovered (\d+) eldritch shard/);if(m)return '获得 '+m[1]+' 个异质碎片。';
    m=text.match(/^(.+) arrived at the world$/);if(m)return m[1]+' 进入了世界';
    m=text.match(/^(.+) went quiet$/);if(m)return m[1]+' 离开了世界';
    m=text.match(/^Entered (.+)$/);if(m)return '进入区域：'+m[1];
    m=text.match(/^(.+) struck you$/);if(m)return m[1]+' 攻击了你';
    if(text.startsWith('Guide:')) return '营地向导：先在营地收集材料，制作骨刃，准备好以后再离开。';
    if(text.startsWith('Expedition complete')) return '远征完成：你安全返回了营地。';
    if(text.startsWith('Expedition kit ready')) return '远征装备已准备好。和队友确认后再出发。';
    if(text.startsWith('GROUP READY')) return '队伍已准备完毕，可以一起离开营地。';
    if(text.startsWith('You are ready')) return '你已标记为准备完成。';
    if(text.startsWith('Ready status cancelled')) return '已取消准备状态。';
    if(text.startsWith('Craft a Bone Knife')) return '先制作骨刃、携带食物，并恢复状态。';
    return text;
  }

  const baseToast=toast;
  toast=function(text){baseToast(zhText(text));};

  const baseReceiveChat=receiveChat;
  receiveChat=function(payload){
    if(!payload) return;
    const p={...payload};
    if(p.name==='CAMP') p.name='营地';
    p.text=zhText(p.text);
    baseReceiveChat(p);
  };

  const baseConnectionQuality=connectionQuality;
  connectionQuality=function(){
    const result=baseConnectionQuality();
    const names={GOOD:'良好',FAIR:'一般',POOR:'较差',RECONNECTING:'重新连接',CONNECTING:'连接中',OFFLINE:'离线'};
    return [names[result[0]]||result[0],result[1]];
  };

  function applyStaticChinese(){
    const brand=document.querySelector('.brand');if(brand)brand.innerHTML='深渊<br>苏醒';
    const sub=document.querySelector('.subtitle');if(sub)sub.innerHTML='沼林岛 · 白昼抵达<br>先在营地休息、聊天、制作装备，再一起探索。';
    if(nameInput)nameInput.placeholder='幸存者名字';
    if(enterBtn&&!started)enterBtn.textContent='进入安全营地';
    const note=document.querySelector('.gate .note');if(note)note.textContent='安全营地 · 无怪物 · 禁止 PvP · 可恢复 · 有新手物资';

    const barLabels=[...document.querySelectorAll('.bars .bar > span')];
    ['生命','饱食','理智'].forEach((t,i)=>{if(barLabels[i])barLabels[i].textContent=t;});
    const metrics=[...document.querySelectorAll('.metric small')];
    ['延迟','抖动','同步丢包','区域'].forEach((t,i)=>{if(metrics[i])metrics[i].textContent=t;});
    const questTitle=document.querySelector('.quest small');if(questTitle)questTitle.textContent='当前任务';
    const playerTitle=document.querySelector('.players h3');if(playerTitle)playerTitle.textContent='附近幸存者';
    if(chatToggle)chatToggle.textContent='聊天';
    const oldMapToggle=document.getElementById('mapToggle');if(oldMapToggle)oldMapToggle.textContent='地图';
    if(useBtn)useBtn.textContent='互动';
    if(dashBtn)dashBtn.textContent='冲刺';
    if(attackBtn)attackBtn.textContent='攻击';

    const chatHead=document.querySelector('.chat-head b');if(chatHead)chatHead.textContent='世界聊天';
    if(chatInput)chatInput.placeholder='输入消息…';
    if(chatSend)chatSend.textContent='发送';

    const craftTitle=document.querySelector('#craftPanel h2');if(craftTitle)craftTitle.textContent='营地工作台';
    const recipes=[...document.querySelectorAll('#craftPanel .recipe')];
    if(recipes[0]){const s=recipes[0].querySelector('span');if(s)s.textContent='骨刃 · 4 木材 + 3 石头';const b=recipes[0].querySelector('button');if(b)b.textContent='制作';}
    if(recipes[1]){const s=recipes[1].querySelector('span');if(s)s.textContent='提灯 · 3 木材 + 2 异质碎片';const b=recipes[1].querySelector('button');if(b)b.textContent='制作';}
    if(recipes[2]){const s=recipes[2].querySelector('span');if(s)s.textContent='野外口粮 · 2 食物';const b=recipes[2].querySelector('button');if(b)b.textContent='食用';}
    if(closeCraft)closeCraft.textContent='关闭';

    const deathTitle=document.querySelector('.deathbox h2');if(deathTitle)deathTitle.textContent='深渊吞没了你';
    const deathText=document.querySelector('.deathbox p');if(deathText)deathText.textContent='你会在安全营地醒来，但会损失一部分物资。';
    if(respawnBtn)respawnBtn.textContent='返回营地';
    const footer=document.querySelector('.footer-note');if(footer)footer.textContent='安全营地 · 分区实时联机 · 平滑移动同步';
  }

  updateQuest=function(){
    const guideTalked=localStorage.getItem('abyssal_guide_v7')==='1';
    if(inCamp()){
      if(!guideTalked) questText.textContent='找到篝火旁的营地向导，靠近后按【互动】。';
      else if(inventory.wood<4||inventory.stone<3) questText.textContent=`收集新手材料：木材 ${inventory.wood}/4 · 石头 ${inventory.stone}/3`;
      else if(!inventory.knife) questText.textContent='前往营地西南侧工作台，按【互动】制作骨刃。';
      else if(!hasLeftCamp) questText.textContent='准备完成。等队友准备好后再一起离开营地。';
      else questText.textContent='安全营地：休息、聊天、制作装备，然后再次探索。';
    }else{
      const ward=Math.max(0,Math.ceil((fieldGraceUntil-Date.now())/1000));
      questText.textContent=ward>0?`临时护佑剩余 ${ward} 秒 · 可以先侦察附近区域。`:'探索、采集、生存，并在天黑前返回营地。';
    }
  };

  function localizeDynamic(){
    if(onlineEl)onlineEl.textContent='在线 '+Math.max(1,globalPresenceIds.size);
    if(campBadge&&!campBadge.classList.contains('hidden'))campBadge.textContent='☀ 安全营地';
    if(dayBadgeV11){
      const d=dayBadgeV11.textContent;
      if(d.includes('DAY'))dayBadgeV11.textContent='☀ 白天';
      else if(d.includes('DUSK'))dayBadgeV11.textContent='◐ 黄昏';
      else if(d.includes('NIGHT'))dayBadgeV11.textContent='☾ 夜晚';
      else if(d.includes('DAWN'))dayBadgeV11.textContent='◑ 黎明';
    }
    if(connectionEl)connectionEl.textContent=zhText(connectionEl.textContent);
    for(const row of playerList?.children||[]){
      row.textContent=row.textContent.replace('waiting by the fire','等待其他幸存者…').replace(' · FIELD',' · 野外').replace(' · CAMP',' · 营地').replace(' · READY ✓',' · 已准备 ✓');
    }
    const ready=document.getElementById('readyToggleV9');
    if(ready){
      const map={
        'PREP FIRST':'先准备','MARK READY':'标记准备','READY ✓':'已准备 ✓','IN FIELD':'野外',
        'READY ✓ · TAP TO CANCEL':'已准备 ✓ · 点击取消'
      };
      if(map[ready.textContent])ready.textContent=map[ready.textContent];
    }
  }

  const baseUpdateUI=updateUI;
  updateUI=function(){baseUpdateUI();localizeDynamic();};

  function makeInteractionPrompt(){
    let el=document.getElementById('interactionPromptV11');
    if(el)return el;
    el=document.createElement('div');
    el.id='interactionPromptV11';
    el.style.cssText='position:absolute;left:50%;bottom:calc(154px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:35;display:none;max-width:76%;padding:7px 10px;border:1px solid #91aa9e;border-radius:5px;background:#0b1916ed;color:#f0f6f2;font:700 9px ui-monospace,monospace;text-align:center;pointer-events:none;box-shadow:0 5px 16px #0007';
    game.appendChild(el);
    return el;
  }
  const interactionPrompt=makeInteractionPrompt();

  function nearestResource(){
    let best=null,bestD=86;
    for(const r of resources){
      if((harvested.get(r.id)||0)>Date.now())continue;
      const d=distance(me,r);
      if(d<bestD){best=r;bestD=d;}
    }
    return best?{resource:best,d:bestD}:null;
  }

  function interactionTarget(){
    if(!started||dead)return null;
    const list=[];
    if(inCamp()){
      list.push({type:'guide',d:Math.hypot(me.x-GUIDE_V11.x,me.y-GUIDE_V11.y),text:'【互动】与营地向导交谈'});
      list.push({type:'fire',d:Math.hypot(me.x-FIRE_V11.x,me.y-FIRE_V11.y),text:'【互动】在篝火旁休息'});
      list.push({type:'workbench',d:Math.hypot(me.x-WORKBENCH_V11.x,me.y-WORKBENCH_V11.y),text:'【互动】使用工作台'});
      const chestLeft=(harvested.get(CHEST_V11.id)||0)-Date.now();
      list.push({type:'chest',d:Math.hypot(me.x-CHEST_V11.x,me.y-CHEST_V11.y),text:chestLeft>0?`共享宝箱刷新中 · ${Math.ceil(chestLeft/1000)}秒`:'【互动】打开共享宝箱'});
    }
    const nr=nearestResource();
    if(nr)list.push({type:'resource',d:nr.d,text:`【互动】采集${ITEM_ZH[nr.resource.type]||'资源'}`,resource:nr.resource});
    list.sort((a,b)=>a.d-b.d);
    return list[0]&&list[0].d<=92?list[0]:null;
  }

  function updateInteractionPrompt(){
    const target=interactionTarget();
    if(!target){interactionPrompt.style.display='none';return;}
    interactionPrompt.style.display='block';
    interactionPrompt.textContent=target.text;
  }

  function openSharedChest(){
    const until=harvested.get(CHEST_V11.id)||0;
    if(until>Date.now()){
      toast(`共享宝箱还要 ${Math.ceil((until-Date.now())/1000)} 秒刷新。`);
      return;
    }
    if(!zoneConnected||!zoneCh){
      toast('联机同步尚未连接，暂时不能打开共享宝箱。');
      return;
    }
    const next=Date.now()+CHEST_V11.cooldown;
    harvested.set(CHEST_V11.id,next);
    zoneCh.send({type:'broadcast',event:'harvest',payload:{zone:currentZone,rid:CHEST_V11.id,until:next}});
    inventory.food+=1;
    const gotShard=Math.random()<0.55;
    if(gotShard)inventory.shard+=1;else inventory.stone+=1;
    saveLocal();
    updateUI();
    toast(gotShard?'打开共享宝箱：获得食物 ×1、异质碎片 ×1。':'打开共享宝箱：获得食物 ×1、石头 ×1。');
  }

  document.addEventListener('click',event=>{
    if(!event.target.closest('#useBtn'))return;
    const target=interactionTarget();
    if(target?.type!=='chest')return;
    event.preventDefault();
    event.stopImmediatePropagation();
    stopJoy();
    openSharedChest();
  },true);

  function appendChatStatus(text){toast(text);}
  async function transmitChat(item){
    if(!globalConnected||!globalCh)return false;
    try{
      const result=await globalCh.send({type:'broadcast',event:'chat',payload:{id:SESSION_ID,name:me.name,text:item.text,zone:currentZone,clientAt:item.at}});
      if(result==='ok'){
        receiveChat({id:SESSION_ID,name:me.name,text:item.text,zone:currentZone});
        return true;
      }
    }catch(error){console.warn('[Abyssal V11 chat]',error);}
    return false;
  }

  async function sendChatV11(){
    const text=cleanChat(chatInput.value);
    if(!text){appendChatStatus('请输入消息。');return;}
    if(Date.now()-UX.lastChatSendAt<500)return;
    UX.lastChatSendAt=Date.now();
    chatInput.value='';
    const item={text,at:Date.now()};
    if(await transmitChat(item)){
      appendChatStatus('消息已发送。');
      return;
    }
    if(UX.chatQueue.length>=10)UX.chatQueue.shift();
    UX.chatQueue.push(item);
    appendChatStatus('世界聊天正在连接，消息已排队，会自动重试。');
  }

  async function flushChatQueue(){
    if(UX.chatSending||!UX.chatQueue.length||!globalConnected||!globalCh)return;
    UX.chatSending=true;
    try{
      while(UX.chatQueue.length&&globalConnected&&globalCh){
        const item=UX.chatQueue[0];
        if(!(await transmitChat(item)))break;
        UX.chatQueue.shift();
      }
    }finally{UX.chatSending=false;}
  }

  document.addEventListener('click',event=>{
    if(!event.target.closest('#chatSend'))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    sendChatV11();
  },true);
  document.addEventListener('keydown',event=>{
    if(event.target!==chatInput||event.key!=='Enter')return;
    event.preventDefault();
    event.stopImmediatePropagation();
    sendChatV11();
  },true);

  function createLiveMapPanel(){
    const old=document.getElementById('mapPanel');if(old)old.classList.add('hidden');
    let panel=document.getElementById('mapPanelV11');
    if(panel)return panel;
    panel=document.createElement('div');panel.id='mapPanelV11';panel.className='map-panel hidden';
    panel.innerHTML='<div class="map-head"><b>实时世界地图</b><button id="mapCloseV11" class="map-close" type="button">×</button></div><canvas id="mapCanvasV11" class="map-canvas" width="320" height="320"></canvas><div class="map-note">黄：你　绿：队友　红：怪物　紫：特殊资源<br>向：向导　火：篝火　台：工作台　箱：共享宝箱<br>同区域队友实时刷新，跨区域位置约每 2 秒更新。</div>';
    game.appendChild(panel);
    panel.querySelector('#mapCloseV11').addEventListener('click',()=>panel.classList.add('hidden'));
    return panel;
  }
  const liveMapPanel=createLiveMapPanel();
  const liveMapCanvas=liveMapPanel.querySelector('#mapCanvasV11');
  const liveMapCtx=liveMapCanvas.getContext('2d');

  function worldToMap(x,y){return{x:x/WORLD.w*liveMapCanvas.width,y:y/WORLD.h*liveMapCanvas.height};}
  function mark(x,y,color,label,r=4){
    const p=worldToMap(x,y);liveMapCtx.fillStyle=color;liveMapCtx.beginPath();liveMapCtx.arc(p.x,p.y,r,0,Math.PI*2);liveMapCtx.fill();
    if(label){liveMapCtx.font='bold 9px sans-serif';liveMapCtx.textAlign='center';liveMapCtx.fillStyle='#f2f5ee';liveMapCtx.fillText(label,p.x,p.y-7);}
  }
  function collectGlobalPlayers(){
    const players=new Map();
    try{
      const state=globalCh?.presenceState?.()||{};
      for(const list of Object.values(state))for(const p of list||[])if(p?.id&&p.id!==SESSION_ID&&Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.y)))players.set(p.id,{id:p.id,name:clean(p.name),x:Number(p.x),y:Number(p.y),zone:p.zone});
    }catch{}
    for(const r of remotes.values())players.set(r.id,{id:r.id,name:clean(r.name),x:r.x,y:r.y,zone:currentZone});
    return [...players.values()];
  }
  function drawLiveMap(){
    if(liveMapPanel.classList.contains('hidden'))return;
    const c=liveMapCtx,W=liveMapCanvas.width,H=liveMapCanvas.height;c.clearRect(0,0,W,H);c.fillStyle='#0a1512';c.fillRect(0,0,W,H);
    for(let zy=0;zy<3;zy++)for(let zx=0;zx<3;zx++){
      const z=`${zx}:${zy}`,b=BIOMES[z],x=zx*W/3,y=zy*H/3,w=W/3,h=H/3;c.fillStyle=b?.[1]||'#34594b';c.fillRect(x+1,y+1,w-2,h-2);c.strokeStyle=z===currentZone?'#f4dd8b':'#60796d';c.lineWidth=z===currentZone?2:1;c.strokeRect(x+1.5,y+1.5,w-3,h-3);c.fillStyle='#d9e4dd';c.font='8px sans-serif';c.textAlign='center';c.fillText(ZH_ZONES[z]||z,x+w/2,y+12);
    }
    const cp=worldToMap(CAMP.x,CAMP.y);c.strokeStyle='#c3e2b9';c.lineWidth=2;c.beginPath();c.arc(cp.x,cp.y,CAMP.r/WORLD.w*W,0,Math.PI*2);c.stroke();
    mark(me.x,me.y,'#ffe27c','我',5);
    for(const p of collectGlobalPlayers())mark(p.x,p.y,'#74e59c',p.name.slice(0,6),4);
    mark(GUIDE_V11.x,GUIDE_V11.y,'#e8d890','向',4);mark(FIRE_V11.x,FIRE_V11.y,'#ffb85a','火',4);mark(WORKBENCH_V11.x,WORKBENCH_V11.y,'#b9c3bd','台',4);mark(CHEST_V11.x,CHEST_V11.y,(harvested.get(CHEST_V11.id)||0)>Date.now()?'#756b62':'#d7ae62','箱',4);
    for(const m of mobs)if(m&&m.hp>0)mark(m.x,m.y,'#e36b70','',2.5);
    for(const r of resources)if(r?.type==='shard'&&(harvested.get(r.id)||0)<=Date.now())mark(r.x,r.y,'#b384dd','',2);
  }

  document.addEventListener('click',event=>{
    if(!event.target.closest('#mapToggle'))return;
    event.preventDefault();event.stopImmediatePropagation();stopJoy();
    craftPanel.classList.add('hidden');chatPanel.classList.add('hidden');
    const old=document.getElementById('mapPanel');if(old)old.classList.add('hidden');
    liveMapPanel.classList.toggle('hidden');drawLiveMap();
  },true);

  setInterval(()=>{
    updateInteractionPrompt();
    localizeDynamic();
    flushChatQueue();
    drawLiveMap();
  },200);

  setInterval(()=>{
    if(globalConnected&&globalCh){
      try{globalCh.track(globalMeta());}catch{}
    }
  },2000);

  applyStaticChinese();
  localizeDynamic();
  updateQuest();
})();
