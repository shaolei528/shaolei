(()=>{
  'use strict';

  const SAVE_KEY = 'abyssal_v9_gameplay';
  const remoteGameplay = new Map();

  const state = {
    expeditionStartedAt: 0,
    successfulReturns: 0,
    longestExpeditionMs: 0,
    lastSafeState: true,
    lastPreparedState: false
  };

  function loadState(){
    try{
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if(!saved) return;
      state.successfulReturns = clamp(Math.floor(finite(saved.successfulReturns, 0)), 0, 9999);
      state.longestExpeditionMs = clamp(Math.floor(finite(saved.longestExpeditionMs, 0)), 0, 24 * 60 * 60 * 1000);
    }catch(error){
      console.warn('[Abyssal V9 gameplay] save read failed', error);
    }
  }

  function saveState(){
    try{
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        successfulReturns: state.successfulReturns,
        longestExpeditionMs: state.longestExpeditionMs
      }));
    }catch(error){
      console.warn('[Abyssal V9 gameplay] save write failed', error);
    }
  }

  function isPrepared(){
    return !!inventory.knife && inventory.food >= 1 && me.hp >= 80 && me.sanity >= 70;
  }

  function expeditionAgeMs(){
    if(!state.expeditionStartedAt) return 0;
    return Math.max(0, Date.now() - state.expeditionStartedAt);
  }

  function zoneThreatScore(){
    const [zx, zy] = String(currentZone).split(':').map(Number);
    const zoneDistance = Math.abs(finite(zx, 1) - 1) + Math.abs(finite(zy, 1) - 1);
    const livingMobs = mobs.reduce((sum, mob)=>sum + (mob && mob.hp > 0 ? 1 : 0), 0);
    const darkness = clamp(finite(nightLevel(), 0), 0, 1);
    return clamp(zoneDistance * 18 + livingMobs * 5 + darkness * 32, 0, 100);
  }

  function threatLabel(){
    const score = zoneThreatScore();
    if(inCamp()) return 'SAFE';
    if(score < 32) return 'LOW';
    if(score < 58) return 'ELEVATED';
    if(score < 78) return 'HIGH';
    return 'SEVERE';
  }

  function localSyncState(){
    return {
      prepared: isPrepared(),
      expedition: !inCamp(),
      expeditionSec: Math.min(3600, Math.round(expeditionAgeMs() / 1000)),
      returns: state.successfulReturns,
      threat: threatLabel()
    };
  }

  function updateExpeditionState(){
    if(!started || dead) return;

    const safeNow = inCamp();
    if(state.lastSafeState && !safeNow){
      state.expeditionStartedAt = Date.now();
    }

    if(!state.lastSafeState && safeNow && state.expeditionStartedAt){
      const duration = Date.now() - state.expeditionStartedAt;
      state.longestExpeditionMs = Math.max(state.longestExpeditionMs, duration);
      if(duration >= 15000){
        state.successfulReturns += 1;
        toast('Expedition complete · safe return ' + state.successfulReturns);
      }
      state.expeditionStartedAt = 0;
      saveState();
    }

    state.lastSafeState = safeNow;

    const preparedNow = isPrepared();
    if(preparedNow && !state.lastPreparedState && inCamp()){
      toast('Expedition kit ready. Leave when your group is ready.');
    }
    state.lastPreparedState = preparedNow;
  }

  sendMove = function(){
    if(!zoneCh || !zoneConnected || dead) return;
    me.seq += 1;
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
        v9:localSyncState()
      }
    });
  };

  const baseOnMoveV9 = onMove;
  onMove = function(payload){
    baseOnMoveV9(payload);
    if(!payload?.id || payload.id === SESSION_ID) return;

    const meta = payload.v9;
    if(!meta || typeof meta !== 'object') return;

    remoteGameplay.set(payload.id, {
      prepared: !!meta.prepared,
      expedition: !!meta.expedition,
      expeditionSec: clamp(Math.floor(finite(meta.expeditionSec, 0)), 0, 3600),
      returns: clamp(Math.floor(finite(meta.returns, 0)), 0, 9999),
      threat: ['SAFE','LOW','ELEVATED','HIGH','SEVERE'].includes(meta.threat) ? meta.threat : 'LOW',
      updatedAt: Date.now()
    });
  };

  setInterval(()=>{
    updateExpeditionState();
    const staleBefore = Date.now() - 30000;
    for(const [id, meta] of remoteGameplay){
      if(!remotes.has(id) || meta.updatedAt < staleBefore) remoteGameplay.delete(id);
    }
  }, 500);

  loadState();
  state.lastSafeState = inCamp();
  state.lastPreparedState = isPrepared();

  window.ABYSSAL_GAMEPLAY_V9 = {
    getLocalState(){
      return {
        ...localSyncState(),
        longestExpeditionSec: Math.round(state.longestExpeditionMs / 1000)
      };
    },
    getRemoteState(id){
      return remoteGameplay.get(id) || null;
    },
    getThreatScore: zoneThreatScore,
    getThreatLabel: threatLabel
  };
})();
