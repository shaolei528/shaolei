(()=>{
  'use strict';

  /*
    V9 network hardening layer.
    Loaded after the existing V7 gameplay modules.
    It keeps the same Supabase global + zoned architecture and replaces only
    connection lifecycle functions that were previously too optimistic.
  */

  const NET_V9 = {
    version: 9,
    globalTimeoutMs: 9000,
    zoneTimeoutMs: 9000,
    retryBaseMs: 2200,
    retryMaxMs: 12000,
    retryCount: 0,
    retryTimer: 0,
    connecting: false,
    disposed: false,
    lastGlobalStatus: 'IDLE',
    lastZoneStatus: 'IDLE'
  };

  window.ABYSSAL_NET_V9 = NET_V9;

  function setConnectionLabel(text, className='reconnect'){
    if(!connectionEl) return;
    connectionEl.textContent = text;
    connectionEl.className = 'connection ' + className;
  }

  function clearRetry(){
    if(NET_V9.retryTimer){
      clearTimeout(NET_V9.retryTimer);
      NET_V9.retryTimer = 0;
    }
  }

  function nextRetryDelay(){
    const step = Math.min(NET_V9.retryCount, 4);
    return Math.min(NET_V9.retryBaseMs * Math.pow(1.55, step), NET_V9.retryMaxMs);
  }

  function scheduleReconnect(reason){
    if(NET_V9.disposed || !started) return;
    clearRetry();
    NET_V9.retryCount += 1;
    const delay = Math.round(nextRetryDelay());
    setConnectionLabel('RECONNECTING', 'reconnect');
    console.warn('[Abyssal V9 network] reconnect scheduled', reason || 'unknown', delay);
    NET_V9.retryTimer = setTimeout(()=>{
      NET_V9.retryTimer = 0;
      reconnectAll();
    }, delay);
  }

  function waitForSubscription(channel, kind, timeoutMs){
    return new Promise((resolve, reject)=>{
      let settled = false;
      const timer = setTimeout(()=>finish(false, new Error(kind + ' subscribe timeout')), timeoutMs);

      function finish(ok, value){
        if(settled) return;
        settled = true;
        clearTimeout(timer);
        ok ? resolve(value) : reject(value);
      }

      channel.subscribe(async status=>{
        if(kind === 'global') NET_V9.lastGlobalStatus = status;
        else NET_V9.lastZoneStatus = status;

        if(status === 'SUBSCRIBED'){
          finish(true, status);
          return;
        }

        if(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED'){
          finish(false, new Error(kind + ' status ' + status));
        }
      });
    });
  }

  async function removeChannelSafe(channel){
    if(!channel || !supabase) return;
    try{
      await supabase.removeChannel(channel);
    }catch(error){
      console.warn('[Abyssal V9 network] removeChannel failed', error);
    }
  }

  function collectPresenceIds(state){
    const ids = new Set();
    const metadata = new Map();
    for(const list of Object.values(state || {})){
      if(!Array.isArray(list)) continue;
      for(const p of list){
        if(!p?.id) continue;
        ids.add(p.id);
        metadata.set(p.id, p);
      }
    }
    return { ids, metadata };
  }

  async function connectGlobalV9(){
    if(!supabase) throw new Error('Realtime client is not initialized');
    if(globalConnected && globalCh) return globalCh;

    const old = globalCh;
    globalCh = null;
    globalConnected = false;
    await removeChannelSafe(old);

    const channel = supabase.channel(cfg.WORLD_CHANNEL + ':global', {
      config: {
        presence: { key: SESSION_ID },
        broadcast: { ack: true, self: false }
      }
    });

    globalCh = channel;

    channel.on('presence', {event:'sync'}, ()=>{
      if(channel !== globalCh) return;
      const {ids} = collectPresenceIds(channel.presenceState());
      globalPresenceIds = ids;
      updateUI();
    });

    channel.on('presence', {event:'join'}, ({newPresences})=>{
      for(const p of newPresences || []){
        if(p?.id && p.id !== SESSION_ID) toast(clean(p.name) + ' arrived at the world');
      }
    });

    channel.on('presence', {event:'leave'}, ({leftPresences})=>{
      for(const p of leftPresences || []){
        if(p?.id && p.id !== SESSION_ID) toast(clean(p.name) + ' went quiet');
      }
    });

    channel.on('broadcast', {event:'chat'}, ({payload})=>receiveChat(payload));

    await waitForSubscription(channel, 'global', NET_V9.globalTimeoutMs);
    if(channel !== globalCh) throw new Error('Global channel superseded during connect');

    globalConnected = true;
    NET_V9.retryCount = 0;
    await channel.track(globalMeta());
    measurePing();
    updateUI();
    return channel;
  }

  function syncZonePresenceV9(channel){
    if(!channel || channel !== zoneCh) return;
    const {ids, metadata} = collectPresenceIds(channel.presenceState());
    zonePresenceIds = ids;

    for(const [pid, p] of metadata){
      if(pid === SESSION_ID) continue;
      let remote = remotes.get(pid);
      if(!remote){
        remote = {
          id: pid,
          name: clean(p.name),
          color: p.color || '#aab8af',
          x: finite(p.x, me.x),
          y: finite(p.y, me.y),
          tx: finite(p.x, me.x),
          ty: finite(p.y, me.y),
          dir: finite(p.dir, 0),
          hp: 100,
          sanity: 100,
          attack: 0,
          moving: false,
          ward: !!p.ward
        };
        remotes.set(pid, remote);
      }else{
        remote.name = clean(p.name);
        remote.color = p.color || remote.color;
        remote.ward = !!p.ward;
      }
    }

    for(const pid of [...remotes.keys()]){
      if(!ids.has(pid)) remotes.delete(pid);
    }

    electLeader();
    updateUI();
  }

  async function switchZoneV9(z){
    const target = String(z || currentZone);
    const nonce = ++switchNonce;
    switching = true;

    currentZone = target;
    me.zone = target;
    seedZone(target);
    remotes.clear();
    lastSeqById.clear();
    recvSeq = 0;
    missedSeq = 0;
    zonePresenceIds.clear();
    zoneConnected = false;
    zoneLeader = false;
    zoneLeaderId = '';
    mobs = [];

    const previous = zoneCh;
    zoneCh = null;
    await removeChannelSafe(previous);

    if(nonce !== switchNonce){
      switching = false;
      return null;
    }

    if(!supabase){
      switching = false;
      throw new Error('Realtime client is not initialized');
    }

    const channel = supabase.channel(cfg.WORLD_CHANNEL + ':zone:' + target, {
      config: {
        presence: { key: SESSION_ID },
        broadcast: { ack: false, self: false }
      }
    });

    zoneCh = channel;

    channel.on('presence', {event:'sync'}, ()=>syncZonePresenceV9(channel));
    channel.on('broadcast', {event:'move'}, ({payload})=>onMove(payload));
    channel.on('broadcast', {event:'attack'}, ({payload})=>onAttack(payload));
    channel.on('broadcast', {event:'mobs'}, ({payload})=>onMobs(payload));
    channel.on('broadcast', {event:'mob_hit'}, ({payload})=>onMobHit(payload));
    channel.on('broadcast', {event:'loot'}, ({payload})=>onLoot(payload));
    channel.on('broadcast', {event:'harvest'}, ({payload})=>onHarvest(payload));
    channel.on('broadcast', {event:'state_req'}, ()=>{
      if(zoneLeader) broadcastWorld();
    });
    channel.on('broadcast', {event:'world'}, ({payload})=>onWorld(payload));

    try{
      await waitForSubscription(channel, 'zone', NET_V9.zoneTimeoutMs);
      if(channel !== zoneCh || nonce !== switchNonce) return null;

      zoneConnected = true;
      await channel.track({
        id: SESSION_ID,
        name: me.name,
        color: me.color,
        x: Math.round(me.x),
        y: Math.round(me.y),
        dir: me.dir,
        ward: fieldGraceUntil > Date.now()
      });

      if(globalCh && globalConnected){
        await globalCh.track(globalMeta());
      }

      setTimeout(()=>{
        if(channel === zoneCh && zoneConnected){
          channel.send({
            type:'broadcast',
            event:'state_req',
            payload:{id:SESSION_ID, zone:target}
          });
        }
      }, 250);

      updateUI();
      return channel;
    }finally{
      if(nonce === switchNonce) switching = false;
    }
  }

  async function reconnectAll(){
    if(NET_V9.connecting || NET_V9.disposed || !started) return;
    NET_V9.connecting = true;
    setConnectionLabel('RECONNECTING', 'reconnect');

    try{
      globalConnected = false;
      zoneConnected = false;
      await connectGlobalV9();
      await switchZoneV9(currentZone);
      NET_V9.retryCount = 0;
      clearRetry();
      updateUI();
    }catch(error){
      console.warn('[Abyssal V9 network] reconnect failed', error);
      globalConnected = false;
      zoneConnected = false;
      updateUI();
      scheduleReconnect(error?.message || 'reconnect failed');
    }finally{
      NET_V9.connecting = false;
    }
  }

  async function measurePingV9(){
    if(!globalCh || !globalConnected) return;
    const start = performance.now();
    try{
      const result = await globalCh.send({
        type:'broadcast',
        event:'net_probe',
        payload:{id:SESSION_ID, t:Date.now()}
      });
      if(result === 'ok'){
        pingSamples.push(performance.now() - start);
        if(pingSamples.length > 12) pingSamples.shift();
      }
    }catch(error){
      console.warn('[Abyssal V9 network] ping failed', error);
    }
    updateUI();
  }

  /* Replace only lifecycle functions. Existing gameplay event handlers remain intact. */
  connectGlobal = connectGlobalV9;
  switchZone = switchZoneV9;
  measurePing = measurePingV9;

  window.addEventListener('online', ()=>{
    if(started) reconnectAll();
  });

  window.addEventListener('offline', ()=>{
    globalConnected = false;
    zoneConnected = false;
    clearRetry();
    setConnectionLabel('OFFLINE', 'poor');
  });

  window.addEventListener('pagehide', ()=>{
    clearRetry();
  });

  window.ABYSSAL_NET_V9.reconnect = reconnectAll;
})();
