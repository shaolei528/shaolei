(()=>{
'use strict';

const DUAL={
  version:13,
  active:false,
  starting:false,
  ready:false,
  role:'idle',
  route:'supabase',
  peer:null,
  hostConn:null,
  guestConns:new Map(),
  connSession:new Map(),
  channels:new Map(),
  presence:new Map(),
  queue:[],
  routeStartedAt:0,
  primaryFailedAt:0,
  recoverTimer:0,
  pingMs:null,
  lastError:'',
  hubId:'abyssal-wake-v13-hub'
};
window.ABYSSAL_DUAL_V13=DUAL;

function routeBadge(){
  let el=document.getElementById('routeBadgeV13');
  if(el)return el;
  el=document.createElement('div');
  el.id='routeBadgeV13';
  el.style.cssText='position:absolute;left:8px;top:137px;z-index:13;padding:4px 6px;border:1px solid #5e786d;background:#0c1d19e8;color:#c9d8d1;font:700 7px ui-monospace,monospace;pointer-events:none';
  el.textContent='联机线路：主线路';
  game?.appendChild(el);
  return el;
}
function setRoute(text,color){
  const el=routeBadge();
  el.textContent=text;
  if(color)el.style.color=color;
}
function setConn(text,cls='reconnect'){
  if(connectionEl){
    connectionEl.textContent=text;
    connectionEl.className='connection '+cls;
  }
}
function loadScript(src,timeout=7000){
  return new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    let done=false;
    const t=setTimeout(()=>finish(false,new Error('timeout '+src)),timeout);
    function finish(ok,v){
      if(done)return; done=true; clearTimeout(t);
      s.onload=s.onerror=null;
      if(ok)resolve(v); else {s.remove();reject(v);}
    }
    s.src=src;s.async=true;
    s.onload=()=>finish(true);
    s.onerror=()=>finish(false,new Error('failed '+src));
    document.head.appendChild(s);
  });
}
async function ensurePeer(){
  if(window.Peer)return;
  const mirrors=[
    'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js',
    'https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js'
  ];
  let last=null;
  for(const src of mirrors){
    try{await loadScript(src,7000);if(window.Peer)return;}catch(e){last=e;}
  }
  throw last||new Error('PeerJS unavailable');
}

class P2PChannel{
  constructor(key){
    this.key=key;
    this.handlers=[];
    this.statusCb=null;
    this.subscribed=false;
    this.closed=false;
    DUAL.channels.set(key,this);
    if(!DUAL.presence.has(key))DUAL.presence.set(key,new Map());
  }
  on(type,filter,cb){
    this.handlers.push({type,filter:filter||{},cb});
    return this;
  }
  subscribe(cb){
    this.statusCb=cb;
    this.subscribed=true;
    queueMicrotask(()=>{ if(!this.closed) cb?.('SUBSCRIBED'); });
    return this;
  }
  async track(meta){
    if(this.closed)return 'error';
    sendWire({kind:'track',channel:this.key,from:SESSION_ID,meta:{...meta,id:SESSION_ID}});
    return 'ok';
  }
  async send(message){
    if(this.closed||!DUAL.ready)return 'error';
    if(message?.type!=='broadcast')return 'ok';
    sendWire({kind:'broadcast',channel:this.key,event:message.event,payload:message.payload,from:SESSION_ID});
    return 'ok';
  }
  presenceState(){
    const map=DUAL.presence.get(this.key)||new Map();
    const out={};
    for(const [id,meta] of map)out[id]=[{...meta,id}];
    return out;
  }
  emitBroadcast(event,payload){
    for(const h of this.handlers){
      if(h.type==='broadcast'&&h.filter?.event===event){
        try{h.cb({payload});}catch(e){console.warn('[V13 p2p broadcast handler]',e);}
      }
    }
  }
  applyPresence(entries){
    const before=DUAL.presence.get(this.key)||new Map();
    const next=new Map();
    for(const item of entries||[]){
      if(item?.id)next.set(item.id,item);
    }
    DUAL.presence.set(this.key,next);

    const joined=[];
    const left=[];
    for(const [id,meta] of next)if(!before.has(id))joined.push(meta);
    for(const [id,meta] of before)if(!next.has(id))left.push(meta);

    for(const h of this.handlers){
      try{
        if(h.type==='presence'&&h.filter?.event==='sync')h.cb();
        if(joined.length&&h.type==='presence'&&h.filter?.event==='join')h.cb({newPresences:joined});
        if(left.length&&h.type==='presence'&&h.filter?.event==='leave')h.cb({leftPresences:left});
      }catch(e){console.warn('[V13 p2p presence handler]',e);}
    }
  }
  close(){
    if(!this.closed&&DUAL.ready){
      sendWire({kind:'untrack',channel:this.key,from:SESSION_ID});
    }
    this.closed=true;
    DUAL.channels.delete(this.key);
  }
}

function dispatchWire(msg){
  if(!msg||typeof msg!=='object')return;
  if(msg.kind==='presence_snapshot'){
    const ch=DUAL.channels.get(msg.channel);
    ch?.applyPresence(msg.entries||[]);
    return;
  }
  if(msg.kind==='broadcast'){
    if(msg.from===SESSION_ID)return;
    DUAL.channels.get(msg.channel)?.emitBroadcast(msg.event,msg.payload);
    return;
  }
  if(msg.kind==='pong'){
    if(msg.to===SESSION_ID&&msg.t){
      DUAL.pingMs=Math.max(0,performance.now()-Number(msg.t));
      pingSamples.push(DUAL.pingMs);
      if(pingSamples.length>12)pingSamples.shift();
    }
  }
}

function hostSnapshot(channelKey){
  const map=DUAL.presence.get(channelKey)||new Map();
  const entries=[...map.values()].map(v=>({...v}));
  const packet={kind:'presence_snapshot',channel:channelKey,entries};
  dispatchWire(packet);
  for(const c of DUAL.guestConns.values()){
    if(c?.open){try{c.send(packet);}catch{}}
  }
}
function hostRemoveSession(sessionId){
  if(!sessionId)return;
  for(const [key,map] of DUAL.presence){
    if(map.delete(sessionId))hostSnapshot(key);
  }
}
function onHostWire(msg,sourceConn){
  if(!msg||typeof msg!=='object')return;
  if(msg.kind==='hello'){
    if(msg.sessionId){
      DUAL.connSession.set(sourceConn.peer,msg.sessionId);
      for(const key of DUAL.presence.keys())hostSnapshot(key);
    }
    return;
  }
  if(msg.kind==='track'){
    const map=DUAL.presence.get(msg.channel)||new Map();
    map.set(msg.from,{...(msg.meta||{}),id:msg.from});
    DUAL.presence.set(msg.channel,map);
    hostSnapshot(msg.channel);
    return;
  }
  if(msg.kind==='untrack'){
    const map=DUAL.presence.get(msg.channel)||new Map();
    map.delete(msg.from);
    DUAL.presence.set(msg.channel,map);
    hostSnapshot(msg.channel);
    return;
  }
  if(msg.kind==='broadcast'){
    dispatchWire(msg);
    for(const c of DUAL.guestConns.values()){
      if(c===sourceConn||!c?.open)continue;
      try{c.send(msg);}catch{}
    }
    return;
  }
  if(msg.kind==='ping'){
    try{sourceConn.send({kind:'pong',to:msg.from,t:msg.t});}catch{}
  }
}

function sendWire(msg){
  if(!DUAL.ready)return;
  if(DUAL.role==='host'){
    if(msg.kind==='track'){
      const map=DUAL.presence.get(msg.channel)||new Map();
      map.set(SESSION_ID,{...(msg.meta||{}),id:SESSION_ID});
      DUAL.presence.set(msg.channel,map);
      hostSnapshot(msg.channel);
      return;
    }
    if(msg.kind==='untrack'){
      const map=DUAL.presence.get(msg.channel)||new Map();
      map.delete(SESSION_ID);
      DUAL.presence.set(msg.channel,map);
      hostSnapshot(msg.channel);
      return;
    }
    if(msg.kind==='broadcast'){
      for(const c of DUAL.guestConns.values()){
        if(c?.open){try{c.send(msg);}catch{}}
      }
      return;
    }
    if(msg.kind==='ping'){
      DUAL.pingMs=0;
      return;
    }
  }
  if(DUAL.role==='guest'&&DUAL.hostConn?.open){
    try{DUAL.hostConn.send(msg);}catch(e){DUAL.lastError=String(e?.message||e);}
  }else{
    DUAL.queue.push(msg);
    if(DUAL.queue.length>60)DUAL.queue.shift();
  }
}
function flushQueue(){
  if(!DUAL.ready)return;
  const q=DUAL.queue.splice(0);
  for(const msg of q)sendWire(msg);
}

function setupGuestConn(conn){
  DUAL.hostConn=conn;
  let opened=false;
  const markOpen=()=>{
    if(opened)return;
    opened=true;
    DUAL.ready=true;
    DUAL.role='guest';
    try{conn.send({kind:'hello',sessionId:SESSION_ID});}catch{}
    flushQueue();
    onFallbackReady();
  };
  conn.on('open',markOpen);
  conn.on('data',dispatchWire);
  if(conn.open)queueMicrotask(markOpen);
  conn.on('close',()=>{
    if(DUAL.active){DUAL.ready=false;setConn('备用线路重连','reconnect');scheduleRecover();}
  });
  conn.on('error',e=>{
    DUAL.lastError=String(e?.type||e?.message||e);
    if(DUAL.active&&!DUAL.ready)scheduleRecover();
  });
}
function setupIncoming(conn){
  DUAL.guestConns.set(conn.peer,conn);
  conn.on('data',msg=>onHostWire(msg,conn));
  conn.on('close',()=>{
    DUAL.guestConns.delete(conn.peer);
    const sid=DUAL.connSession.get(conn.peer);
    DUAL.connSession.delete(conn.peer);
    hostRemoveSession(sid);
  });
  conn.on('error',()=>{});
}
function newPeer(id){
  return new Promise((resolve,reject)=>{
    const p=id?new window.Peer(id,{debug:0}):new window.Peer({debug:0});
    let settled=false;
    const t=setTimeout(()=>finish(false,new Error('peer open timeout')),8000);
    function finish(ok,v){
      if(settled)return;settled=true;clearTimeout(t);
      ok?resolve({peer:p,id:v}):(tryDestroy(p),reject(v));
    }
    p.once('open',peerId=>finish(true,peerId));
    p.once('error',err=>finish(false,err));
  });
}
function tryDestroy(p){try{p?.destroy();}catch{}}

async function becomeHost(){
  const result=await newPeer(DUAL.hubId);
  DUAL.peer=result.peer;
  DUAL.role='host';
  DUAL.ready=true;
  DUAL.peer.on('connection',setupIncoming);
  DUAL.peer.on('disconnected',()=>{try{DUAL.peer.reconnect();}catch{}});
  DUAL.peer.on('error',e=>{DUAL.lastError=String(e?.type||e?.message||e);});
  onFallbackReady();
}
async function becomeGuest(){
  const result=await newPeer(null);
  DUAL.peer=result.peer;
  DUAL.role='guest';
  DUAL.peer.on('disconnected',()=>{try{DUAL.peer.reconnect();}catch{}});
  DUAL.peer.on('error',e=>{DUAL.lastError=String(e?.type||e?.message||e);});
  await new Promise((resolve,reject)=>{
    let attempts=0;
    function attempt(){
      attempts++;
      const conn=DUAL.peer.connect(DUAL.hubId,{reliable:true,serialization:'json'});
      let done=false;
      const t=setTimeout(()=>fail(),3500);
      function fail(){
        if(done)return;done=true;clearTimeout(t);
        try{conn.close();}catch{}
        if(attempts<5)setTimeout(attempt,650);
        else reject(new Error('P2P host unavailable'));
      }
      conn.once('open',()=>{
        if(done)return;done=true;clearTimeout(t);
        setupGuestConn(conn);
        resolve();
      });
      conn.once('error',fail);
    }
    attempt();
  });
}
async function startPeerTransport(){
  await ensurePeer();
  try{
    await becomeHost();
  }catch(err){
    const type=String(err?.type||'');
    if(type==='unavailable-id'||type==='invalid-id'||String(err?.message||'').includes('taken')){
      await becomeGuest();
    }else{
      try{await becomeGuest();}catch{throw err;}
    }
  }
}

function bindGlobalP2P(){
  const key=cfg.WORLD_CHANNEL+':global';
  const ch=new P2PChannel(key);
  globalCh=ch;
  ch.on('presence',{event:'sync'},()=>{
    const st=ch.presenceState(),next=new Set();
    for(const list of Object.values(st))for(const p of list)if(p?.id)next.add(p.id);
    globalPresenceIds=next;updateUI();
  });
  ch.on('presence',{event:'join'},({newPresences})=>{
    for(const p of newPresences||[])if(p.id!==SESSION_ID)toast(clean(p.name)+' 进入了世界');
  });
  ch.on('presence',{event:'leave'},({leftPresences})=>{
    for(const p of leftPresences||[])if(p.id!==SESSION_ID)toast(clean(p.name)+' 离开了世界');
  });
  ch.on('broadcast',{event:'chat'},({payload})=>receiveChat(payload));
  ch.on('broadcast',{event:'map_pos'},({payload})=>{
    try{window.ABYSSAL_UX_V11?.onMapPos?.(payload);}catch{}
  });
  ch.subscribe(async status=>{
    globalConnected=status==='SUBSCRIBED';
    if(globalConnected)await ch.track(globalMeta());
    updateUI();
  });
}
async function bindZoneP2P(z){
  const target=String(z||currentZone);
  switching=true;
  currentZone=target;me.zone=target;
  seedZone(target);
  remotes.clear();lastSeqById.clear();recvSeq=0;missedSeq=0;
  zonePresenceIds.clear();zoneConnected=false;zoneLeader=false;zoneLeaderId='';mobs=[];
  if(zoneCh instanceof P2PChannel)zoneCh.close();

  const key=cfg.WORLD_CHANNEL+':zone:'+target;
  const ch=new P2PChannel(key);
  zoneCh=ch;
  ch.on('presence',{event:'sync'},()=>{
    const st=ch.presenceState(),ids=new Set(),meta=new Map();
    for(const list of Object.values(st))for(const p of list)if(p?.id){ids.add(p.id);meta.set(p.id,p);}
    zonePresenceIds=ids;
    for(const [pid,p] of meta){
      if(pid===SESSION_ID)continue;
      let r=remotes.get(pid);
      if(!r){
        r={id:pid,name:clean(p.name),color:p.color||'#aab8af',x:finite(p.x,me.x),y:finite(p.y,me.y),tx:finite(p.x,me.x),ty:finite(p.y,me.y),dir:finite(p.dir,0),hp:100,sanity:100,attack:0,moving:false,ward:!!p.ward};
        remotes.set(pid,r);
      }else{r.name=clean(p.name);r.color=p.color||r.color;r.ward=!!p.ward;}
    }
    for(const rid of [...remotes.keys()])if(!ids.has(rid))remotes.delete(rid);
    electLeader();updateUI();
  });
  ch.on('broadcast',{event:'move'},({payload})=>onMove(payload));
  ch.on('broadcast',{event:'attack'},({payload})=>onAttack(payload));
  ch.on('broadcast',{event:'mobs'},({payload})=>onMobs(payload));
  ch.on('broadcast',{event:'mob_hit'},({payload})=>onMobHit(payload));
  ch.on('broadcast',{event:'loot'},({payload})=>onLoot(payload));
  ch.on('broadcast',{event:'harvest'},({payload})=>onHarvest(payload));
  ch.on('broadcast',{event:'state_req'},()=>{if(zoneLeader)broadcastWorld();});
  ch.on('broadcast',{event:'world'},({payload})=>onWorld(payload));
  ch.subscribe(async status=>{
    zoneConnected=status==='SUBSCRIBED';
    if(zoneConnected){
      await ch.track({id:SESSION_ID,name:me.name,color:me.color,x:Math.round(me.x),y:Math.round(me.y),dir:me.dir,ward:fieldGraceUntil>Date.now()});
      await globalCh?.track(globalMeta());
      setTimeout(()=>ch.send({type:'broadcast',event:'state_req',payload:{id:SESSION_ID,zone:target}}),250);
      toast(inCamp()?'备用线路已同步安全营地。':'备用线路进入：'+(BIOMES[target]?.[0]||target));
    }
    updateUI();
  });
  switching=false;
  return ch;
}

function onFallbackReady(){
  if(!DUAL.active||!DUAL.ready)return;
  bindGlobalP2P();
  bindZoneP2P(currentZone);
  globalConnected=true;zoneConnected=true;
  if(window.ABYSSAL_NET_V9){
    window.ABYSSAL_NET_V9.disposed=true;
    window.ABYSSAL_NET_V9.reconnect=reconnectDual;
  }
  switchZone=async z=>bindZoneP2P(z);
  connectGlobal=async()=>globalCh;
  measurePing=async()=>{
    const t=performance.now();
    sendWire({kind:'ping',from:SESSION_ID,t});
    if(DUAL.role==='host'){
      pingSamples.push(0);if(pingSamples.length>12)pingSamples.shift();
    }
    updateUI();
  };
  setRoute(DUAL.role==='host'?'联机线路：P2P备用 · 主机':'联机线路：P2P备用 · 已连接','#bde8c8');
  setConn('备用线路已连接','good');
  toast('主线路不可用，已切换到 P2P 备用联机。');
}

async function activateFallback(){
  if(DUAL.active||DUAL.starting)return;
  DUAL.starting=true;
  DUAL.active=true;
  DUAL.route='p2p';
  DUAL.routeStartedAt=Date.now();
  setRoute('联机线路：正在切换备用…','#f0d58a');
  setConn('切换备用线路','reconnect');

  const oldGlobal=globalCh,oldZone=zoneCh;
  if(window.ABYSSAL_NET_V9)window.ABYSSAL_NET_V9.disposed=true;
  try{
    if(supabase&&oldGlobal&&!oldGlobal.closed)await supabase.removeChannel(oldGlobal).catch(()=>{});
    if(supabase&&oldZone&&!oldZone.closed)await supabase.removeChannel(oldZone).catch(()=>{});
  }catch{}

  try{
    await startPeerTransport();
  }catch(error){
    DUAL.lastError=String(error?.type||error?.message||error);
    DUAL.ready=false;
    setRoute('联机线路：备用失败 · '+DUAL.lastError,'#ef9b9b');
    setConn('联机失败','poor');
    toast('主线路和备用线路都没有连上。正在重试备用线路。');
    scheduleRecover();
  }finally{
    DUAL.starting=false;
  }
}
function scheduleRecover(){
  if(DUAL.recoverTimer)return;
  DUAL.recoverTimer=setTimeout(async()=>{
    DUAL.recoverTimer=0;
    if(!started)return;
    try{
      tryDestroy(DUAL.peer);
      DUAL.peer=null;DUAL.hostConn=null;DUAL.guestConns.clear();DUAL.connSession.clear();
      DUAL.channels.clear();DUAL.presence.clear();
      DUAL.ready=false;DUAL.role='idle';
      await startPeerTransport();
    }catch(e){
      DUAL.lastError=String(e?.type||e?.message||e);
      setRoute('联机线路：备用重试中','#f0d58a');
      scheduleRecover();
    }
  },3500);
}
async function reconnectDual(){
  if(DUAL.active){
    if(DUAL.ready){globalConnected=true;zoneConnected=true;return;}
    scheduleRecover();return;
  }
  try{
    if(window.ABYSSAL_NET_V9){
      window.ABYSSAL_NET_V9.disposed=false;
      await window.ABYSSAL_NET_V9.reconnect?.();
    }
  }catch{}
}

setInterval(()=>{
  if(!started)return;
  if(DUAL.active){
    if(DUAL.ready){
      globalConnected=true;zoneConnected=true;
      globalCh?.track(globalMeta());
      zoneCh?.track({id:SESSION_ID,name:me.name,color:me.color,x:Math.round(me.x),y:Math.round(me.y),dir:me.dir,ward:fieldGraceUntil>Date.now()});
    }
    return;
  }
  if(globalConnected&&zoneConnected){
    DUAL.primaryFailedAt=0;
    setRoute('联机线路：Supabase 主线路','#bde8c8');
    return;
  }
  if(!DUAL.primaryFailedAt)DUAL.primaryFailedAt=Date.now();
  if(Date.now()-DUAL.primaryFailedAt>=8000)activateFallback();
},1000);

window.addEventListener('online',()=>{
  if(started&&DUAL.active&&!DUAL.ready)scheduleRecover();
});

routeBadge();
})();