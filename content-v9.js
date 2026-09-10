(()=>{
  'use strict';

  const GAMEPLAY = window.ABYSSAL_GAMEPLAY_V9;
  if(!GAMEPLAY){
    console.error('[Abyssal V9 content] gameplay-v9.js must load first');
    return;
  }

  const CONTENT = {
    ready: false,
    remoteReady: new Map(),
    groupReadyShown: false,
    landmarks: [
      {id:'camp-fire', zone:'1:1', type:'camp', x:CAMP.x, y:CAMP.y, label:'Mirewood Fire'},
      {id:'camp-workbench', zone:'1:1', type:'workbench', x:CAMP.x-205, y:CAMP.y+135, label:'Workbench'},
      {id:'camp-ward-north', zone:'1:1', type:'ward', x:CAMP.x, y:CAMP.y-CAMP.r+24, label:'North Ward'},
      {id:'drowned-altar', zone:'0:0', type:'ruin', x:610, y:690, label:'Drowned Altar'},
      {id:'black-fen-idol', zone:'1:0', type:'idol', x:2370, y:690, label:'Fen Idol'},
      {id:'salt-arch', zone:'2:0', type:'ruin', x:4060, y:760, label:'Salt Arch'},
      {id:'weeping-pier', zone:'0:1', type:'pier', x:780, y:2410, label:'Weeping Pier'},
      {id:'pale-bell', zone:'2:1', type:'idol', x:4070, y:2410, label:'Pale Bell'},
      {id:'sunken-marker', zone:'0:2', type:'ruin', x:720, y:4070, label:'Sunken Marker'},
      {id:'grave-stone', zone:'1:2', type:'idol', x:2410, y:4100, label:'Grave Stone'},
      {id:'low-tide-gate', zone:'2:2', type:'ruin', x:4060, y:4080, label:'Low Tide Gate'}
    ]
  };

  window.ABYSSAL_CONTENT_V9 = CONTENT;

  function localPrepared(){
    return !!GAMEPLAY.getLocalState().prepared;
  }

  function ensureReadyButton(){
    let button = document.getElementById('readyToggleV9');
    if(button) return button;

    button = document.createElement('button');
    button.id = 'readyToggleV9';
    button.type = 'button';
    button.textContent = 'PREP FIRST';
    button.style.cssText = [
      'position:absolute',
      'right:8px',
      'top:244px',
      'z-index:12',
      'width:118px',
      'height:27px',
      'margin-top:5px',
      'border:1px solid #6f8c7f',
      'border-radius:4px',
      'background:#19342b',
      'color:#e9f3ed',
      'font:700 7px ui-monospace,monospace',
      'letter-spacing:.06em',
      'touch-action:manipulation'
    ].join(';');

    if(game) game.appendChild(button);

    button.addEventListener('click', ()=>{
      if(!inCamp()){
        toast('Ready status can only be changed inside Safe Camp.');
        return;
      }
      if(!localPrepared()){
        CONTENT.ready = false;
        toast('Craft a Bone Knife, carry food, and recover first.');
        refreshReadyButton();
        return;
      }
      CONTENT.ready = !CONTENT.ready;
      CONTENT.groupReadyShown = false;
      toast(CONTENT.ready ? 'You are ready for expedition.' : 'Ready status cancelled.');
      sendMove();
      refreshReadyButton();
    });

    return button;
  }

  function refreshReadyButton(){
    const button = ensureReadyButton();
    if(!button) return;

    const prepared = localPrepared();
    if(!prepared){
      CONTENT.ready = false;
      button.textContent = 'PREP FIRST';
      button.style.background = '#25332e';
      button.style.color = '#9eaea6';
      return;
    }

    if(!inCamp()){
      button.textContent = CONTENT.ready ? 'READY ✓' : 'IN FIELD';
      button.style.background = CONTENT.ready ? '#285744' : '#25332e';
      button.style.color = '#d8eee1';
      return;
    }

    button.textContent = CONTENT.ready ? 'READY ✓ · TAP TO CANCEL' : 'MARK READY';
    button.style.background = CONTENT.ready ? '#285744' : '#1c3a31';
    button.style.color = '#edf6f0';
  }

  sendMove = function(){
    if(!zoneCh || !zoneConnected || dead) return;
    me.seq += 1;
    const v9 = GAMEPLAY.getLocalState();
    zoneCh.send({
      type:'broadcast',
      event:'move',
      payload:{
        id:SESSION_ID,
        name:me.name,
        color:me.color,
        x:Math.round(me.x),
        y:Math.round(me.y),
        dir:me.dir,
        hp:Math.round(me.hp),
        sanity:Math.round(me.sanity),
        zone:currentZone,
        seq:me.seq,
        attack:attackFlash,
        ward:Date.now() < fieldGraceUntil,
        v9:{...v9, ready:CONTENT.ready}
      }
    });
  };

  const baseOnMoveContentV9 = onMove;
  onMove = function(payload){
    baseOnMoveContentV9(payload);
    if(!payload?.id || payload.id === SESSION_ID) return;
    if(payload.v9 && typeof payload.v9 === 'object'){
      CONTENT.remoteReady.set(payload.id, {
        ready: !!payload.v9.ready,
        prepared: !!payload.v9.prepared,
        expedition: !!payload.v9.expedition,
        updatedAt: Date.now()
      });
    }
  };

  setPlayersList = function(){
    const near = [...remotes.values()]
      .sort((a,b)=>distance(a,me)-distance(b,me))
      .slice(0,6);

    playerList.replaceChildren();

    if(!near.length){
      const empty = document.createElement('div');
      empty.textContent = 'waiting by the fire';
      playerList.appendChild(empty);
    }else{
      for(const remote of near){
        const meta = CONTENT.remoteReady.get(remote.id);
        const row = document.createElement('div');
        const status = meta?.expedition ? ' · FIELD' : (meta?.ready ? ' · READY ✓' : ' · CAMP');
        row.textContent = '• ' + clean(remote.name) + status;
        if(meta?.ready) row.style.color = '#bfe8c8';
        playerList.appendChild(row);
      }
    }

    refreshReadyButton();
  };

  function checkGroupReady(){
    if(!started || !inCamp() || !CONTENT.ready){
      CONTENT.groupReadyShown = false;
      return;
    }

    const nearbyIds = [...remotes.values()]
      .filter(remote=>distance(remote, me) < CAMP.r * 1.25)
      .map(remote=>remote.id);

    if(!nearbyIds.length){
      CONTENT.groupReadyShown = false;
      return;
    }

    const everyoneReady = nearbyIds.every(id=>CONTENT.remoteReady.get(id)?.ready === true);
    if(everyoneReady && !CONTENT.groupReadyShown){
      CONTENT.groupReadyShown = true;
      toast('GROUP READY · leave camp when your team chooses.');
    }
    if(!everyoneReady) CONTENT.groupReadyShown = false;
  }

  setInterval(()=>{
    const staleBefore = Date.now() - 30000;
    for(const [id, meta] of CONTENT.remoteReady){
      if(!remotes.has(id) || meta.updatedAt < staleBefore) CONTENT.remoteReady.delete(id);
    }
    if(!inCamp()) CONTENT.ready = false;
    refreshReadyButton();
    checkGroupReady();
  }, 500);
})();
