(()=>{
  'use strict';

  const SETTINGS_KEY='abyssal_wake_settings_v1';
  const DEFAULTS=Object.freeze({reducedMotion:false,performance:false,highContrast:false});
  const gate=document.getElementById('gate');
  const game=document.getElementById('game');
  const main=document.getElementById('shellMain');
  const playPanel=document.getElementById('shellPlayPanel');
  const settingsPanel=document.getElementById('shellSettingsPanel');
  const continueButton=document.getElementById('shellContinue');
  const pauseButton=document.getElementById('shellPause');
  const overlay=document.getElementById('shellOverlay');
  const overlayTitle=document.getElementById('shellOverlayTitle');
  const overlayNote=document.getElementById('shellOverlayNote');
  const overlayActions=document.getElementById('shellOverlayActions');
  const relayState=document.getElementById('shellRelayState');
  if(!gate||!game||!main||!playPanel||!settingsPanel||!overlay||!overlayActions)return;

  let settings={...DEFAULTS};
  let overlayMode='closed';

  function loadSettings(){
    try{
      const value=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'null');
      if(value&&typeof value==='object')settings={...DEFAULTS,...Object.fromEntries(Object.keys(DEFAULTS).map(key=>[key,!!value[key]]))};
    }catch{}
  }
  function saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}catch{}}
  function applySettings(){
    const root=document.documentElement;
    root.classList.toggle('abyssal-shell-reduced-motion',settings.reducedMotion);
    root.classList.toggle('abyssal-shell-performance',settings.performance);
    root.classList.toggle('abyssal-shell-contrast',settings.highContrast);
    for(const button of document.querySelectorAll('[data-shell-setting]')){
      const key=button.dataset.shellSetting;
      if(!(key in settings))continue;
      button.textContent=settings[key]?'开启':'关闭';
      button.setAttribute('aria-pressed',String(settings[key]));
    }
  }
  function stopGameInput(){
    try{stopJoy();}catch{}
    try{joystickState.x=0;joystickState.y=0;dashQueued=false;}catch{}
    try{window.ABYSSAL_PLATFORM_V19?.stopMovement?.();}catch{}
  }
  function hasLocalContinue(){
    try{return !!localStorage.getItem('abyssal_wake_save_v5');}catch{return false;}
  }
  function applyMenuCopy(){
    if(started)return;
    const brand=document.querySelector('.brand');
    const subtitle=document.querySelector('.subtitle');
    const note=document.querySelector('.gate .note');
    if(brand)brand.innerHTML='ABYSSAL WAKE<span>深渊苏醒</span>';
    if(subtitle)subtitle.innerHTML='现代废墟之上的求生营地<br>准备、结伴、探索，然后平安归来';
    if(note)note.textContent='当前可用：公网实时营地 · SafeCamp 安全区域';
  }
  function refreshEntry(){
    const relay=window.ABYSSAL_RELAY_V16;
    const configured=!!(relay?.enabled||cfg?.RELAY_URL);
    relayState.textContent=configured?'公网 Relay 已配置；进入后将连接实时营地。':'公网 Relay 未配置；暂时无法进入多人营地。';
    continueButton.classList.toggle('hidden',!hasLocalContinue());
  }
  function showGatePanel(panel){
    main.classList.toggle('hidden',!!panel);
    playPanel.classList.toggle('hidden',panel!=='play');
    settingsPanel.classList.toggle('hidden',panel!=='settings');
    if(panel==='play')refreshEntry();
    if(panel==='settings')applySettings();
  }
  function closeOverlay(){
    overlayMode='closed';
    overlay.setAttribute('aria-hidden','true');
    overlayActions.replaceChildren();
    pauseButton?.focus?.({preventScroll:true});
  }
  function makeButton(label,action,primary=false){
    const button=document.createElement('button');
    button.type='button';button.className='shell-button'+(primary?' primary':'');button.textContent=label;
    button.addEventListener('click',action);return button;
  }
  function settingRow(key,label,detail){
    const row=document.createElement('div');row.className='shell-setting';
    const text=document.createElement('span');text.textContent=label;
    const small=document.createElement('small');small.textContent=detail;text.appendChild(small);
    const button=document.createElement('button');button.type='button';button.className='shell-toggle';button.dataset.shellSetting=key;
    button.addEventListener('click',()=>{settings[key]=!settings[key];saveSettings();applySettings();});
    row.append(text,button);return row;
  }
  function openSettingsOverlay(){
    overlayMode='settings';overlayTitle.textContent='设置';overlayNote.textContent='这些设置只保存在本机，并且不会改动幸存者存档、联机协议或世界状态。';
    overlayActions.replaceChildren();
    overlayActions.append(settingRow('reducedMotion','减少动态','停用菜单环境漂浮动画。'));
    overlayActions.append(settingRow('performance','简化菜单特效','减少菜单背景装饰性效果。'));
    overlayActions.append(settingRow('highContrast','高对比菜单','提高菜单和暂停面板的文字与边框对比。'));
    overlayActions.append(makeButton('返回游戏菜单',openPause));
    overlay.setAttribute('aria-hidden','false');applySettings();stopGameInput();
  }
  function confirmReturnToTitle(){
    overlayMode='confirm';overlayTitle.textContent='返回标题画面？';overlayNote.textContent='这会重新加载页面并离开当前实时会话；不会修改你的本地幸存者存档。';
    overlayActions.replaceChildren();
    overlayActions.append(makeButton('重新加载并返回标题',()=>location.reload(),true));
    overlayActions.append(makeButton('取消',openPause));
    overlay.setAttribute('aria-hidden','false');stopGameInput();
  }
  function openPause(){
    if(!started)return;
    overlayMode='pause';overlayTitle.textContent='游戏菜单';overlayNote.textContent='多人游戏不会因打开菜单暂停。你的角色会停止接收本地移动与攻击输入。';
    overlayActions.replaceChildren();
    overlayActions.append(makeButton('继续游戏',closeOverlay,true));
    overlayActions.append(makeButton('设置',openSettingsOverlay));
    overlayActions.append(makeButton('返回标题画面',confirmReturnToTitle));
    overlay.setAttribute('aria-hidden','false');stopGameInput();
    overlay.querySelector('button')?.focus?.({preventScroll:true});
  }
  function isTypingTarget(target){
    const tag=String(target?.tagName||'').toUpperCase();
    return tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||!!target?.isContentEditable;
  }

  const API={
    version:1,
    settingsKey:SETTINGS_KEY,
    getSettings:()=>({...settings}),
    blocksGameInput(event){
      if(!started)return true;
      if(overlayMode!=='closed')return true;
      return isTypingTarget(event?.target);
    },
    openPause,
    closeOverlay
  };
  window.ABYSSAL_SHELL_V1=API;

  document.getElementById('shellPlay')?.addEventListener('click',()=>showGatePanel('play'));
  document.getElementById('shellSettings')?.addEventListener('click',()=>showGatePanel('settings'));
  for(const button of document.querySelectorAll('[data-shell-back]'))button.addEventListener('click',()=>showGatePanel(null));
  for(const button of document.querySelectorAll('[data-shell-setting]'))button.addEventListener('click',()=>{
    const key=button.dataset.shellSetting;if(!(key in settings))return;
    settings[key]=!settings[key];saveSettings();applySettings();
  });
  continueButton.addEventListener('click',()=>{showGatePanel('play');enterBtn?.click();});
  pauseButton?.addEventListener('click',openPause);
  overlay.addEventListener('pointerdown',event=>event.stopPropagation());
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||isTypingTarget(event.target))return;
    if(!started)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(overlayMode==='closed')openPause();else if(overlayMode==='settings'||overlayMode==='confirm')openPause();else closeOverlay();
  },true);

  loadSettings();applySettings();applyMenuCopy();showGatePanel(null);refreshEntry();
})();
