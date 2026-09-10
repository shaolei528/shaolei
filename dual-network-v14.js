(()=>{
'use strict';

const DUAL={
  version:14,
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
  hubId:'abyssal-wake-v14-hub',
  verified:false,
  linked:false,
  iceState:'new',
  connState:'new',
  pingSeq:0,
  pingSent:0,
  pingReplies:0,
  pingLost:0,
  pendingPings:new Map(),
  lastPacketAt:0
};
window.ABYSSAL_DUAL_V14=DUAL;

function routeBadge(){
  let el=document.getElementById('routeBadgeV14');
  if(el)return el;
  el=document.createElement('div');
  el.id='routeBadgeV14';
  el.style.cssText='position:absolute;left:8px;top:137px;z-index:13;padding:4px 6px;border:1px solid #5e786d;background:#0c1d19e8;color:#c9d8d1;font:700 7px ui-monospace,monospace;pointer-events:auto;cursor:pointer';
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
function dataPeerCount(){
  if(DUAL.role==='host')return [...DUAL.guestConns.values()].filter(c=>c?.open&&DUAL.connSession.has(c.peer)).length;
  return DUAL.role==='guest'&&DUAL.hostConn?.open&&DUAL.verified?1:0;
}
function diagPanel(){
  let el=document.getElementById('networkDiagV14');
  if(el)return el;
  el=document.createElement('div');
  el.id='networkDiagV14';
  el.style.cssText='display:none;position:absolute;left:8px;right:8px;top:166px;z-index:70;padding:9px;border:1px solid #718b80;background:#07120ff5;color:#dbe8e1;font:700 8px ui-monospace,monospace;line-height:1.65;white-space:pre-wrap;box-shadow:0 8px 24px #0009';
  game?.appendChild(el);
  return el;
}
function updateDiag(){
  const el=diagPanel();
  if(el.style.display==='none')return;
  const net=window.ABYSSAL_NET_V9||{};
  const last=DUAL.lastPacketAt?Math.max(0,Math.round((Date.now()-DUAL.lastPacketAt)/1000))+'秒前':'无';
  const p=DUAL.pingMs==null?'--':Math.round(DUAL.pingMs)+'ms';
  el.textContent=[
    '网络诊断 V14',
    '主线路 Global: '+String(net.lastGlobalStatus||'IDLE'),
    '主线路 Zone: '+String(net.lastZoneStatus||'IDLE'),
    '当前路线: '+DUAL.route,
    'P2P角色: '+DUAL.role,
    '数据通道: '+dataPeerCount(),
    'ICE: '+DUAL.iceState,
    'Connection: '+DUAL.connState,
    '真实RTT: '+p,
    'Ping成功/丢失: '+DUAL.pingReplies+'/'+DUAL.pingLost,
    '最近数据: '+last,
    '最后错误: '+(DUAL.lastError||'无')
  ].join('\n');
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
  on(type,filter,cb){this.handlers.push({type,filter:filter||{},cb});return this;}
  subscribe(cb){this.statusCb=cb;this.subscribed=true;queueMicrotask(()=>{if(!this.closed)cb?.('SUBSCRIBED');});return this;}
  async track(meta){if(this.closed)return 'error';sendWire({kind:'track',channel:this.key,from:SESSION_ID,meta:{...meta,id:SESSION_ID}});return 'ok';}
  async send(message){if(this.closed||!DUAL.ready)return 'error';if(message?.type!=='broadcast')return 'ok';sendWire({kind:'broadcast',channel:this.key,event:message.event,payload:message.payload,from:SESSION_ID});return 'ok';}
  presenceState(){const map=DUAL.presence.get(this.key)||new Map(),out={};for(const[id,meta]of map)out[id]=[{...meta,id}];return out;}
  emitBroadcast(event,payload){for(const h of this.handlers){if(h.type==='broadcast'&&h.filter?.event===event){try{h.cb({payload});}catch(e){console.warn('[V14 p2p broadcast handler]',e);}}}}
  applyPresence(entries){
    const before=DUAL.presence.get(this.key)||new Map(),next=new Map();
    for(const item of entries||[])if(item?.id)next.set(item.id,item);
    DUAL.presence.set(this.key,next);
    const joined=[],left=[];
    for(const[id,meta]of next)if(!before.has(id))joined.push(meta);
    for(const[id,meta]of before)if(!next.has(id))left.push(meta);
    for(const h of this.handlers){try{
      if(h.type==='presence'&&h.filter?.event==='sync')h.cb();
      if(joined.length&&h.type==='presence'&&h.filter?.event==='join')h.cb({newPresences:joined});
      if(left.length&&h.type==='presence'&&h.filter?.event==='leave')h.cb({leftPresences:left});
    }catch(e){console.warn('[V14 p2p presence handler]',e);}}
  }
  close(){if(!this.closed&&DUAL.ready)sendWire({kind:'untrack',channel:this.key,from:SESSION_ID});this.closed=true;DUAL.channels.delete(this.key);}
}

function recordPong(msg){
  if(msg?.to!==SESSION_ID||!msg.id)return;
  const sent=DUAL.pendingPings.get(msg.id);if(sent==null)return;
  DUAL.pendingPings.delete(msg.id);
  const rtt=Math.max(0,performance.now()-sent);
  DUAL.pingMs=rtt;DUAL.pingReplies++;DUAL.lastPacketAt=Date.now();
  pingSamples.push(rtt);if(pingSamples.length>12)pingSamples.shift();updateUI();
}
function dispatchWire(msg){
  if(!msg||typeof msg!=='object')return;DUAL.lastPacketAt=Date.now();
  if(msg.kind==='presence_snapshot'){DUAL.channels.get(msg.channel)?.applyPresence(msg.entries||[]);return;}
  if(msg.kind==='broadcast'){if(msg.from===SESSION_ID)return;DUAL.channels.get(msg.channel)?.emitBroadcast(msg.event,msg.payload);return;}
  if(msg.kind==='ping'){if(DUAL.role==='guest'&&DUAL.hostConn?.open){try{DUAL.hostConn.send({kind:'pong',to:msg.from,id:msg.id});}catch{}}return;}
  if(msg.kind==='pong')recordPong(msg);
}
function hostSnapshot(channelKey){
  const map=DUAL.presence.get(channelKey)||new Map(),entries=[...map.values()].map(v=>({...v}));
  const packet={kind:'presence_snapshot',channel:channelKey,entries};dispatchWire(packet);
  for(const c of DUAL.guestConns.values())if(c?.open){try{c.send(packet);}catch{}}
}
function hostRemoveSession(sessionId){if(!sessionId)return;for(const[key,map]of DUAL.presence)if(map.delete(sessionId))hostSnapshot(key);}
function onHostWire(msg,sourceConn){
  if(!msg||typeof msg!=='object')return;
  if(msg.kind==='hello'){
    if(msg.sessionId){DUAL.connSession.set(sourceConn.peer,msg.sessionId);DUAL.lastPacketAt=Date.now();try{sourceConn.send({kind:'hello_ack',to:msg.sessionId,host:SESSION_ID});}catch{}refreshLinkState();for(const key of DUAL.presence.keys())hostSnapshot(key);}return;
  }
  if(msg.kind==='track'){const map=DUAL.presence.get(msg.channel)||new Map();map.set(msg.from,{...(msg.meta||{}),id:msg.from});DUAL.presence.set(msg.channel,map);hostSnapshot(msg.channel);return;}
  if(msg.kind==='untrack'){const map=DUAL.presence.get(msg.channel)||new Map();map.delete(msg.from);DUAL.presence.set(msg.channel,map);hostSnapshot(msg.channel);return;}
  if(msg.kind==='broadcast'){dispatchWire(msg);for(const c of DUAL.guestConns.values()){if(c===sourceConn||!c?.open)continue;try{c.send(msg);}catch{}}return;}
  if(msg.kind==='ping'){try{sourceConn.send({kind:'pong',to:msg.from,id:msg.id});}catch{}return;}
  if(msg.kind==='pong')dispatchWire(msg);
}
function sendWire(msg){
  if(!DUAL.ready)return;
  if(DUAL.role==='host'){
    if(msg.kind==='track'){const map=DUAL.presence.get(msg.channel)||new Map();map.set(SESSION_ID,{...(msg.meta||{}),id:SESSION_ID});DUAL.presence.set(msg.channel,map);hostSnapshot(msg.channel);return;}
    if(msg.kind==='untrack'){const map=DUAL.presence.get(msg.channel)||new Map();map.delete(SESSION_ID);DUAL.presence.set(msg.channel,map);hostSnapshot(msg.channel);return;}
    if(msg.kind==='broadcast'){for(const c of DUAL.guestConns.values())if(c?.open){try{c.send(msg);}catch{}}return;}
    if(msg.kind==='ping'){const conn=[...DUAL.guestConns.values()].find(c=>c?.open&&DUAL.connSession.has(c.peer));if(conn){try{conn.send(msg);}catch{}}return;}
  }
  if(DUAL.role==='guest'&&DUAL.hostConn?.open){try{DUAL.hostConn.send(msg);}catch(e){DUAL.lastError=String(e?.message||e);}}
  else{DUAL.queue.push(msg);if(DUAL.queue.length>60)DUAL.queue.shift();}
}
function flushQueue(){if(!DUAL.ready)return;const q=DUAL.queue.splice(0);for(const msg of q)sendWire(msg);}
function linkLive(){
  if(!DUAL.active||!DUAL.ready)return false;
  if(DUAL.role==='host')return [...DUAL.guestConns.values()].some(c=>c?.open&&DUAL.connSession.has(c.peer));
  if(DUAL.role==='guest')return !!(DUAL.hostConn?.open&&DUAL.verified);
  return false;
}
function monitorConnection(conn){
  const pc=conn?.peerConnection;if(!pc)return;
  const read=()=>{DUAL.iceState=pc.iceConnectionState||DUAL.iceState;DUAL.connState=pc.connectionState||DUAL.connState;if(DUAL.iceState==='failed'||DUAL.connState==='failed')DUAL.lastError='ICE '+DUAL.iceState+' / '+DUAL.connState;refreshLinkState();};
  pc.addEventListener?.('iceconnectionstatechange',read);pc.addEventListener?.('connectionstatechange',read);read();
}
function refreshLinkState(){
  const live=linkLive();DUAL.linked=live;if(!DUAL.active)return live;globalConnected=live;zoneConnected=live;
  if(live){const role=DUAL.role==='host'?'主机':'成员';setRoute('联机线路：P2P备用 · '+role+' · 已直连','#bde8c8');if(DUAL.pingMs==null)setConn('已连接·测延迟','reconnect');}
  else if(DUAL.role==='host'&&DUAL.ready){setRoute('联机线路：P2P备用 · 主机等待队友','#f0d58a');setConn('等待队友','reconnect');}
  else if(DUAL.role==='guest'){const failed=DUAL.iceState==='failed'||DUAL.connState==='failed';setRoute(failed?'联机线路：P2P失败 · ICE':'联机线路：P2P备用 · 握手中',failed?'#ef9b9b':'#f0d58a');setConn(failed?'P2P建连失败':'P2P握手中',failed?'poor':'reconnect');}
  updateUI();return live;
}
function sendPingReal(){
  if(!linkLive())return;const id=SESSION_ID+':'+(++DUAL.pingSeq);DUAL.pendingPings.set(id,performance.now());DUAL.pingSent++;sendWire({kind:'ping',from:SESSION_ID,id});
}
function setupGuestConn(conn){
  DUAL.hostConn=conn;let opened=false;
  const markOpen=()=>{if(opened)return;opened=true;DUAL.ready=true;DUAL.role='guest';DUAL.verified=false;monitorConnection(conn);try{conn.send({kind:'hello',sessionId:SESSION_ID,name:me.name,zone:currentZone});}catch{}flushQueue();onFallbackReady();refreshLinkState();};
  conn.on('open',markOpen);
  conn.on('data',msg=>{if(msg?.kind==='hello_ack'&&msg.to===SESSION_ID){DUAL.verified=true;DUAL.lastPacketAt=Date.now();refreshLinkState();globalCh?.track(globalMeta());zoneCh?.track({id:SESSION_ID,name:me.name,color:me.color,x:Math.round(me.x),y:Math.round(me.y),dir:me.dir,ward:fieldGraceUntil>Date.now()});sendPingReal();return;}dispatchWire(msg);});
  if(conn.open)queueMicrotask(markOpen);
  conn.on('close',()=>{DUAL.verified=false;if(DUAL.active){DUAL.ready=false;refreshLinkState();setConn('备用线路重连','reconnect');scheduleRecover();}});
  conn.on('error',e=>{DUAL.lastError=String(e?.type||e?.message||e);refreshLinkState();if(DUAL.active&&!DUAL.ready)scheduleRecover();});
}
function setupIncoming(conn){
  DUAL.guestConns.set(conn.peer,conn);monitorConnection(conn);conn.on('open',()=>refreshLinkState());conn.on('data',msg=>onHostWire(msg,conn));
  if(conn.open)queueMicrotask(()=>refreshLinkState());
  conn.on('close',()=>{DUAL.guestConns.delete(conn.peer);const sid=DUAL.connSession.get(conn.peer);DUAL.connSession.delete(conn.peer);hostRemoveSession(sid);refreshLinkState();});
  conn.on('error',e=>{DUAL.lastError=String(e?.type||e?.message||e);refreshLinkState();});
}
function tryDestroy(p){try{p?.destroy();}catch{}}
function newPeer(id){
  return new Promise((resolve,reject)=>{
    const opts={debug:0,config:{iceServers:[{urls:['stun:stun.cloudflare.com:3478','stun:stun.l.google.com:19302']}]}};
    const p=id?new window.Peer(id,opts):new window.Peer(opts);let settled=false;
    const t=setTimeout(()=>finish(false,new Error('peer open timeout')),8000);
    function finish(ok,v){if(settled)return;settled=true;clearTimeout(t);ok?resolve({peer:p,id:v}):(tryDestroy(p),reject(v));}
    p.once('open',peerId=>finish(true,peerId));p.once('error',err=>finish(false,err));
  });
}
async function becomeHost(){
  const result=await newPeer(DUAL.hubId);DUAL.peer=result.peer;DUAL.role='host';DUAL.ready=true;DUAL.verified=true;
  DUAL.peer.on('connection',setupIncoming);DUAL.peer.on('disconnected',()=>{try{DUAL.peer.reconnect();}catch{}});DUAL.peer.on('error',e=>{DUAL.lastError=String(e?.type||e?.message||e);});onFallbackReady();
}
async function becomeGuest(){
  const result=await newPeer(null);DUAL.peer=result.peer;DUAL.role='guest';
  DUAL.peer.on('disconnected',()=>{try{DUAL.peer.reconnect();}catch{}});DUAL.peer.on('error',e=>{DUAL.lastError=String(e?.type||e?.message||e);});
  await new Promise((resolve,reject)=>{let attempts=0;function attempt(){attempts++;const conn=DUAL.peer.connect(DUAL.hubId,{reliable:true,serialization:'json'});monitorConnection(conn);let done=false;const t=setTimeout(()=>fail(),3500);function fail(){if(done)return;done=true;clearTimeout(t);try{conn.close();}catch{}if(attempts<5)setTimeout(attempt,650);else reject(new Error('P2P data channel unavailable; ICE/NAT may require TURN'));}conn.once('open',()=>{if(done)return;done=true;clearTimeout(t);setupGuestConn(conn);resolve();});conn.once('error',fail);}attempt();});
}
async function startPeerTransport(){
  await ensurePeer();
  try{await becomeHost();}catch(err){const type=String(err?.type||'');if(type==='unavailable-id'||type==='invalid-id'||String(err?.message||'').includes('taken'))await becomeGuest();else{try{await becomeGuest();}catch{throw err;}}}
}
function bindGlobalP2P(){
  const key=cfg.WORLD_CHANNEL+':global',ch=new P2PChannel(key);globalCh=ch;
  ch.on('presence',{event:'sync'},()=>{const st=ch.presenceState(),next=new Set();for(const list of Object.values(st))for(const p of list)if(p?.id)next.add(p.id);globalPresenceIds=next;updateUI();});
  ch.on('presence',{event:'join'},({newPresences})=>{for(const p of newPresences||[])if(p.id!==SESSION_ID)toast(clean(p.name)+' 进入了世界');});
  ch.on('presence',{event:'leave'},({leftPresences})=>{for(const p of leftPresences||[])if(p.id!==SESSION_ID)toast(clean(p.name)+' 离开了世界');});
  ch.on('broadcast',{event:'chat'},({payload})=>receiveChat(payload));
  ch.on('broadcast',{event:'map_pos'},({payload})=>{try{window.ABYSSAL_UX_V11?.onMapPos?.(payload);}catch{}});
  ch.subscribe(async status=>{if(status==='SUBSCRIBED')await ch.track(globalMeta());refreshLinkState();});
}
async function bindZoneP2P(z){
  const target=String(z||currentZone);switching=true;currentZone=target;me.zone=target;seedZone(target);remotes.clear();lastSeqById.clear();recvSeq=0;missedSeq=0;zonePresenceIds.clear();zoneConnected=false;zoneLeader=false;zoneLeaderId='';mobs=[];if(zoneCh instanceof P2PChannel)zoneCh.close();
  const key=cfg.WORLD_CHANNEL+':zone:'+target,ch=new P2PChannel(key);zoneCh=ch;
  ch.on('presence',{event:'sync'},()=>{const st=ch.presenceState(),ids=new Set(),meta=new Map();for(const list of Object.values(st))for(const p of list)if(p?.id){ids.add(p.id);meta.set(p.id,p);}zonePresenceIds=ids;for(const[pid,p]of meta){if(pid===SESSION_ID)continue;let r=remotes.get(pid);if(!r){r={id:pid,name:clean(p.name),color:p.color||'#aab8af',x:finite(p.x,me.x),y:finite(p.y,me.y),tx:finite(p.x,me.x),ty:finite(p.y,me.y),dir:finite(p.dir,0),hp:100,sanity:100,attack:0,moving:false,ward:!!p.ward};remotes.set(pid,r);}else{r.name=clean(p.name);r.color=p.color||r.color;r.ward=!!p.ward;}}for(const rid of[...remotes.keys()])if(!ids.has(rid))remotes.delete(rid);electLeader();updateUI();});
  ch.on('broadcast',{event:'move'},({payload})=>onMove(payload));ch.on('broadcast',{event:'attack'},({payload})=>onAttack(payload));ch.on('broadcast',{event:'mobs'},({payload})=>onMobs(payload));ch.on('broadcast',{event:'mob_hit'},({payload})=>onMobHit(payload));ch.on('broadcast',{event:'loot'},({payload})=>onLoot(payload));ch.on('broadcast',{event:'harvest'},({payload})=>onHarvest(payload));ch.on('broadcast',{event:'state_req'},()=>{if(zoneLeader)broadcastWorld();});ch.on('broadcast',{event:'world'},({payload})=>onWorld(payload));
  ch.subscribe(async status=>{if(status==='SUBSCRIBED'){await ch.track({id:SESSION_ID,name:me.name,color:me.color,x:Math.round(me.x),y:Math.round(me.y),dir:me.dir,ward:fieldGraceUntil>Date.now()});await globalCh?.track(globalMeta());setTimeout(()=>ch.send({type:'broadcast',event:'state_req',payload:{id:SESSION_ID,zone:target}}),250);if(linkLive())toast(inCamp()?'备用线路已同步安全营地。':'备用线路进入：'+(BIOMES[target]?.[0]||target));}refreshLinkState();});
  switching=false;return ch;
}
function onFallbackReady(){
  if(!DUAL.active||!DUAL.ready)return;if(!(globalCh instanceof P2PChannel))bindGlobalP2P();if(!(zoneCh instanceof P2PChannel))bindZoneP2P(currentZone);
  if(window.ABYSSAL_NET_V9){window.ABYSSAL_NET_V9.disposed=true;window.ABYSSAL_NET_V9.reconnect=reconnectDual;}
  switchZone=async z=>bindZoneP2P(z);connectGlobal=async()=>globalCh;measurePing=async()=>{sendPingReal();updateUI();};refreshLinkState();
  if(DUAL.role==='host')toast('主线路不可用，备用 P2P 已启动，正在等待另一台设备。');else toast('主线路不可用，正在通过 P2P 备用线路与主机握手。');
}
async function activateFallback(){
  if(DUAL.active||DUAL.starting)return;DUAL.starting=true;DUAL.active=true;DUAL.route='p2p';DUAL.routeStartedAt=Date.now();pingSamples.length=0;DUAL.pingMs=null;DUAL.pingSent=0;DUAL.pingReplies=0;DUAL.pingLost=0;DUAL.pendingPings.clear();setRoute('联机线路：正在切换备用…','#f0d58a');setConn('切换备用线路','reconnect');
  const oldGlobal=globalCh,oldZone=zoneCh;if(window.ABYSSAL_NET_V9)window.ABYSSAL_NET_V9.disposed=true;
  try{if(supabase&&oldGlobal&&!oldGlobal.closed)await supabase.removeChannel(oldGlobal).catch(()=>{});if(supabase&&oldZone&&!oldZone.closed)await supabase.removeChannel(oldZone).catch(()=>{});}catch{}
  try{await startPeerTransport();}catch(error){DUAL.lastError=String(error?.type||error?.message||error);DUAL.ready=false;setRoute('联机线路：备用失败 · '+DUAL.lastError,'#ef9b9b');setConn('联机失败','poor');toast('主线路和备用线路都没有连上。正在重试备用线路。');scheduleRecover();}finally{DUAL.starting=false;}
}
function scheduleRecover(){
  if(DUAL.recoverTimer)return;DUAL.recoverTimer=setTimeout(async()=>{DUAL.recoverTimer=0;if(!started)return;try{tryDestroy(DUAL.peer);DUAL.peer=null;DUAL.hostConn=null;DUAL.guestConns.clear();DUAL.connSession.clear();DUAL.channels.clear();DUAL.presence.clear();DUAL.ready=false;DUAL.role='idle';DUAL.verified=false;DUAL.linked=false;DUAL.iceState='new';DUAL.connState='new';await startPeerTransport();}catch(e){DUAL.lastError=String(e?.type||e?.message||e);setRoute('联机线路：备用重试中','#f0d58a');scheduleRecover();}},3500);
}
async function reconnectDual(){if(DUAL.active){if(DUAL.ready){refreshLinkState();return;}scheduleRecover();return;}try{if(window.ABYSSAL_NET_V9){window.ABYSSAL_NET_V9.disposed=false;await window.ABYSSAL_NET_V9.reconnect?.();}}catch{}}

const PRIMARY_QUALITY=connectionQuality;
connectionQuality=function(){
  if(!DUAL.active)return PRIMARY_QUALITY();
  if(!linkLive()){if(DUAL.iceState==='failed'||DUAL.connState==='failed')return ['P2P失败','poor'];return [DUAL.role==='host'?'等待队友':'握手中','reconnect'];}
  const p=DUAL.pingMs;if(p==null)return ['测延迟','reconnect'];const total=DUAL.pingReplies+DUAL.pingLost,loss=total?DUAL.pingLost/total:0;if(p<160&&loss<.08)return ['良好','good'];if(p<320&&loss<.18)return ['一般','fair'];return ['较差','poor'];
};
const BASE_UPDATE_UI_V14=updateUI;
updateUI=function(){
  BASE_UPDATE_UI_V14();if(!DUAL.active)return;const live=linkLive();
  if(!live){pingEl.textContent='--';jitterEl.textContent='--';lossEl.textContent='--';onlineEl.textContent='在线 '+Math.max(1,globalPresenceIds.size||1);return;}
  if(pingSamples.length){const p=pingSamples.at(-1);let jitter=0;if(pingSamples.length>1){for(let i=1;i<pingSamples.length;i++)jitter+=Math.abs(pingSamples[i]-pingSamples[i-1]);jitter/=(pingSamples.length-1);}pingEl.textContent=Math.round(p)+'ms';jitterEl.textContent=Math.round(jitter)+'ms';}else{pingEl.textContent='测量中';jitterEl.textContent='--';}
  const pt=DUAL.pingReplies+DUAL.pingLost,pLoss=pt?DUAL.pingLost/pt:0,mt=recvSeq+missedSeq,mLoss=mt?missedSeq/mt:0,combined=Math.max(pLoss,mLoss);lossEl.textContent=((pt||mt)?combined*100:0).toFixed(1)+'%';onlineEl.textContent='在线 '+Math.max(1,globalPresenceIds.size||1);
};
setInterval(()=>{
  if(!started)return;
  if(DUAL.active){refreshLinkState();if(DUAL.ready){globalCh?.track(globalMeta());zoneCh?.track({id:SESSION_ID,name:me.name,color:me.color,x:Math.round(me.x),y:Math.round(me.y),dir:me.dir,ward:fieldGraceUntil>Date.now()});}const now=performance.now();for(const[id,t]of[...DUAL.pendingPings])if(now-t>4500){DUAL.pendingPings.delete(id);DUAL.pingLost++;}updateUI();return;}
  if(globalConnected&&zoneConnected){DUAL.primaryFailedAt=0;setRoute('联机线路：Supabase 主线路','#bde8c8');return;}
  if(!DUAL.primaryFailedAt)DUAL.primaryFailedAt=Date.now();const net=window.ABYSSAL_NET_V9;if(net){const gs=String(net.lastGlobalStatus||''),zs=String(net.lastZoneStatus||'');if(gs&&gs!=='IDLE')setRoute('主线路：G '+gs+' · Z '+zs,'#f0d58a');}if(Date.now()-DUAL.primaryFailedAt>=8000)activateFallback();
},1000);
setInterval(()=>{if(started&&DUAL.active&&linkLive())sendPingReal();},3000);
window.addEventListener('online',()=>{if(started&&DUAL.active&&!DUAL.ready)scheduleRecover();});
const _routeBadge=routeBadge();_routeBadge.title='点击查看网络诊断';_routeBadge.addEventListener('click',()=>{const d=diagPanel();d.style.display=d.style.display==='none'?'block':'none';updateDiag();});setInterval(updateDiag,500);
})();