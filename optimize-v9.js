(()=>{
  'use strict';

  const NET = window.ABYSSAL_NET_V9;
  const CONTENT = window.ABYSSAL_CONTENT_V9;
  const GAMEPLAY = window.ABYSSAL_GAMEPLAY_V9;

  if(!NET || !CONTENT || !GAMEPLAY){
    console.error('[Abyssal V9 optimize] required V9 modules are missing');
    return;
  }

  const PERF = {
    lastPacketKey: '',
    lastPacketAt: 0,
    heartbeatMs: 2000,
    lastPlayerListKey: '',
    lastGateWatchAt: 0
  };

  window.ABYSSAL_OPTIMIZE_V9 = PERF;

  const baseSendMoveOptimized = sendMove;
  sendMove = function(){
    if(!zoneCh || !zoneConnected || dead) return;

    const social = GAMEPLAY.getLocalState();
    const key = [
      Math.round(me.x),
      Math.round(me.y),
      Math.round(me.dir * 100),
      Math.round(me.hp),
      Math.round(me.sanity),
      attackFlash > 0 ? 1 : 0,
      fieldGraceUntil > Date.now() ? 1 : 0,
      CONTENT.ready ? 1 : 0,
      social.prepared ? 1 : 0,
      social.expedition ? 1 : 0
    ].join('|');

    const now = Date.now();
    if(key === PERF.lastPacketKey && now - PERF.lastPacketAt < PERF.heartbeatMs) return;

    PERF.lastPacketKey = key;
    PERF.lastPacketAt = now;
    baseSendMoveOptimized();
  };

  setPlayersList = function(){
    const near = [...remotes.values()]
      .sort((a,b)=>distance(a,me)-distance(b,me))
      .slice(0,6);

    const rowsKey = near.map(remote=>{
      const meta = CONTENT.remoteReady.get(remote.id);
      return [remote.id, clean(remote.name), meta?.ready ? 1 : 0, meta?.expedition ? 1 : 0].join(':');
    }).join('|');

    if(rowsKey === PERF.lastPlayerListKey) return;
    PERF.lastPlayerListKey = rowsKey;

    const readyButton = document.getElementById('readyToggleV9');
    const fragment = document.createDocumentFragment();

    if(!near.length){
      const empty = document.createElement('div');
      empty.textContent = 'waiting by the fire';
      fragment.appendChild(empty);
    }else{
      for(const remote of near){
        const meta = CONTENT.remoteReady.get(remote.id);
        const row = document.createElement('div');
        const status = meta?.expedition ? ' · FIELD' : (meta?.ready ? ' · READY ✓' : ' · CAMP');
        row.textContent = '• ' + clean(remote.name) + status;
        if(meta?.ready) row.style.color = '#bfe8c8';
        fragment.appendChild(row);
      }
    }

    playerList.replaceChildren(fragment);
    if(readyButton && readyButton.parentElement !== playerList.parentElement){
      playerList.parentElement?.appendChild(readyButton);
    }
  };

  function cancelInput(){
    try{ stopJoy(); }catch(error){ console.warn('[Abyssal V9 optimize] stopJoy failed', error); }
    dashQueued = false;
  }

  function reconnectWithoutReload(){
    if(!started || navigator.onLine === false) return;
    NET.reconnect();
  }

  window.addEventListener('blur', cancelInput);
  window.addEventListener('pagehide', cancelInput);
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden){
      cancelInput();
    }else{
      resizeCanvas();
      reconnectWithoutReload();
    }
  });

  window.addEventListener('online', reconnectWithoutReload);

  const retryObserver = new MutationObserver(mutations=>{
    for(const mutation of mutations){
      for(const node of mutation.addedNodes){
        if(!(node instanceof HTMLButtonElement)) continue;
        if(node.textContent?.trim().toUpperCase() !== 'RECONNECT') continue;
        node.onclick = event=>{
          event.preventDefault();
          node.disabled = true;
          node.textContent = 'RECONNECTING…';
          reconnectWithoutReload();
          setTimeout(()=>{
            if(node.isConnected){
              node.disabled = false;
              node.textContent = 'RECONNECT';
            }
          }, 2500);
        };
      }
    }
  });

  if(game) retryObserver.observe(game, {childList:true});

  setInterval(()=>{
    const boot = window.ABYSSAL_BOOT_V9;
    if(!boot || boot.ready || boot.loading || started) return;
    if(gate.classList.contains('hidden')) return;
    if(enterBtn.disabled) enterBtn.disabled = false;
  }, 1500);

  setInterval(()=>{
    const now = Date.now();
    for(const [key, until] of harvested){
      if(finite(until, 0) <= now) harvested.delete(key);
    }
    for(const [id] of CONTENT.remoteReady){
      if(!remotes.has(id)) CONTENT.remoteReady.delete(id);
    }
  }, 5000);
})();
