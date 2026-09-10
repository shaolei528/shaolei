(()=>{
'use strict';

const NET_V9=window.ABYSSAL_NET_V9;
const originalConnectGlobal=connectGlobal;
const originalSwitchZone=switchZone;
const originalMeasurePing=measurePing;
const originalConnectionQuality=connectionQuality;

const params=new URLSearchParams(location.search);
const configuredUrl=String(params.get('relay')||cfg.RELAY_URL||'').trim();
const RELAY={
  version:16,
  protocol:'abyssal-relay-v1',
  url:configuredUrl,
  enabled:!!configuredUrl,
  active:false,
  connecting:false,
  connected:false,
  helloAck:false,
  socket:null,
  connectPromise:null,
  connectResolve:null,
  connectReject:null,
  channels:new Map(),
  retryTimer:0,
  retryCount:0,
  pingSeq:0,
  pendingPings:new Map(),
  pingSent:0,
  pingReplies:0,
  pingLost:0,
  lastPacketAt:0,
  lastError:'',
  fallbackReason:'',
  route:'relay'
};
window.ABYSSAL_RELAY_V16=RELAY;

function badge(){
  let el=document.getElementById('routeBadgeV16');
  if(el)return el;
  el=document.createElement('div');
  el.id='routeBadgeV16';
  el.style.cssText='position:absolute;left:8px;top:137px;z-index:15;padding:4px 6px;border:1px solid #5e786d;background:#0c1d19ed;color:#c9d8d1;font:700 7px ui-monospace,monospace;touch-action:manipulation';
  el.textContent=RELAY.enabled?'联机线路：公网中继':'联机线路：Supabase';
  game?.appendChild(el);
  el.addEventListener('click',()=>{const d=diag();d.style.display=d.style.display==='none'?'block':'none';refreshDiag();});
  return el;
}
function diag(){
  let el=document.getElementById('networkDiagV16');
  if(el)return el;
  el=document.createElement('div');
  el.id='networkDiagV16';
  el.style.cssText='display:none;position:absolute;left:8px;right:8px;top:181px;z-index:90;max-height:54%;overflow:auto;padding:10px;border:2px solid #6f897d;background:#07120ff4;color:#dce9e1;font:700 8px ui-monospace,monospace;line-height:1.65;white-space:pre-wrap';
  game?.appendChild(el);
  return el;
}
function refreshDiag(){
  const el=document.getElementById('networkDiagV16');
  if(!el||el.style.display==='none')return;
  const lastPing=pingSamples.length?Math.round(pingSamples.at(-1))+'ms':'--';
  const total=RELAY.pingReplies+RELAY.pingLost;
  const loss=total?(RELAY.pingLost/total*100).toFixed(1)+'%':'--';
  el.textContent=[
    'V16 公网联机诊断',
    '线路: '+(RELAY.active?'公网 WebSocket 中继':(RELAY.enabled?'准备中':'Supabase 备用')),
    '地址: '+(RELAY.url||'未配置'),
    'WebSocket: '+(RELAY.connected?'OPEN':'CLOSED'),
    'Global: '+(globalConnected?'已订阅':'未订阅'),
    'Zone: '+(zoneConnected?'已订阅':'未订阅'),
    '在线: '+Math.max(1,globalPresenceIds.size||1),
    'RTT: '+lastPing,
    'Ping 丢失: '+loss,
    '最近数据: '+(RELAY.lastPacketAt?Math.max(0,Math.round((Date.now()-RELAY.lastPacketAt)/1000))+'秒前':'--'),
    '错误: '+(RELAY.lastError||'--'),
    '说明: 公网中继不需要两台手机互相打洞。'
  ].join('\n');
}
function setBadge(text,color){const el=badge();el.textContent=text;if(color)el.style.color=color;}
function setConnection(text,cls='reconnect'){if(connectionEl){connectionEl.textContent=text;connectionEl.className='connection '+cls;}}
function isOpen(){return RELAY.socket?.readyState===WebSocket.OPEN&&RELAY.connected;}
function send(packet){
  if(!isOpen())return false;
  try{RELAY.socket.send(JSON.stringify(packet));return true;}catch(error){RELAY.lastError=String(error?.message||error);return false;}
}
function finishConnect(ok,value){
  const resolve=RELAY.connectResolve,reject=RELAY.connectReject;
  RELAY.connectResolve=null;RELAY.connectReject=null;RELAY.connectPromise=null;RELAY.connecting=false;
  ok?resolve?.(value):reject?.(value);
}
function scheduleReconnect(){
  if(RELAY.retryTimer||!RELAY.active||!started)return;
  const delay=Math.min(12000,1800*Math.pow(1.55,Math.min(RELAY.retryCount++,4)));
  setConnection('公网重连中','reconnect');setBadge('联机线路：公网中继 · 重连中','#f0d58a');
  RELAY.retryTimer=setTimeout(async()=>{
    RELAY.retryTimer=0;
    try{await ensureSocket();RELAY.retryCount=0;}catch{scheduleReconnect();}
  },Math.round(delay));
}
function markDisconnected(reason){
  RELAY.connected=false;RELAY.helloAck=false;globalConnected=false;zoneConnected=false;
  if(reason)RELAY.lastError=String(reason);
  for(const ch of RELAY.channels.values())ch._markDisconnected();
  updateUI();refreshDiag();
  if(RELAY.active)scheduleReconnect();
}
function onSocketMessage(event){
  let msg;
  try{msg=JSON.parse(String(event.data||''));}catch{return;}
  if(!msg||typeof msg!=='object')return;
  RELAY.lastPacketAt=Date.now();
  if(msg.type==='hello_ack'){
    if(msg.protocol!==RELAY.protocol){finishConnect(false,new Error('relay protocol mismatch'));return;}
    RELAY.connected=true;RELAY.helloAck=true;RELAY.retryCount=0;RELAY.active=true;
    setBadge('联机线路：公网中继','#bde8c8');
    for(const ch of RELAY.channels.values())ch._resubscribe();
    finishConnect(true,RELAY.socket);refreshDiag();return;
  }
  if(msg.type==='subscribed'){RELAY.channels.get(msg.channel)?._markSubscribed();return;}
  if(msg.type==='presence_snapshot'){RELAY.channels.get(msg.channel)?._applyPresence(msg.entries||[]);return;}
  if(msg.type==='broadcast'){RELAY.channels.get(msg.channel)?._emitBroadcast(msg.event,msg.payload);return;}
  if(msg.type==='pong'){
    const id=String(msg.id||''),startedAt=RELAY.pendingPings.get(id);
    if(startedAt!=null){
      RELAY.pendingPings.delete(id);RELAY.pingReplies++;
      const rtt=Math.max(0,performance.now()-startedAt);pingSamples.push(rtt);if(pingSamples.length>12)pingSamples.shift();
      updateUI();refreshDiag();
    }
    return;
  }
  if(msg.type==='error'){
    RELAY.lastError=String(msg.code||msg.message||'relay error');refreshDiag();
  }
}
function ensureSocket(){
  if(!RELAY.enabled)return Promise.reject(new Error('relay URL not configured'));
  if(isOpen()&&RELAY.helloAck)return Promise.resolve(RELAY.socket);
  if(RELAY.connectPromise)return RELAY.connectPromise;
  RELAY.connecting=true;
  RELAY.connectPromise=new Promise((resolve,reject)=>{RELAY.connectResolve=resolve;RELAY.connectReject=reject;});
  let ws;
  try{ws=new WebSocket(RELAY.url);}catch(error){finishConnect(false,error);return Promise.reject(error);}
  RELAY.socket=ws;
  const timeout=setTimeout(()=>{
    if(!RELAY.helloAck){try{ws.close();}catch{};const error=new Error('relay hello timeout');RELAY.lastError=error.message;finishConnect(false,error);}
  },8000);
  ws.addEventListener('open',()=>{
    sendRaw(ws,{type:'hello',sessionId:SESSION_ID,name:me.name||nameInput?.value||'Wanderer',protocol:RELAY.protocol});
  });
  ws.addEventListener('message',event=>{if(ws===RELAY.socket)onSocketMessage(event);});
  ws.addEventListener('close',()=>{clearTimeout(timeout);if(ws===RELAY.socket)markDisconnected('relay socket closed');});
  ws.addEventListener('error',()=>{RELAY.lastError='relay websocket error';});
  RELAY.connectPromise.finally(()=>clearTimeout(timeout)).catch(()=>{});
  return RELAY.connectPromise;
}
function sendRaw(ws,packet){try{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(packet));}catch{}}

class RelayChannel{
  constructor(key){
    this.key=key;this.handlers=[];this.statusCb=null;this.subscribed=false;this.closed=false;this.trackMeta=null;
    this.ready=new Promise((resolve,reject)=>{this._resolveReady=resolve;this._rejectReady=reject;});
    RELAY.channels.set(key,this);
  }
  on(type,filter,cb){this.handlers.push({type,filter:filter||{},cb});return this;}
  subscribe(cb){this.statusCb=cb;this._resubscribe();return this;}
  async track(meta){this.trackMeta={...(meta||{}),id:SESSION_ID};if(this.subscribed&&isOpen())send({type:'track',channel:this.key,meta:this.trackMeta});return isOpen()?'ok':'error';}
  async send(message){if(!this.subscribed||!isOpen())return 'error';if(message?.type==='broadcast'){return send({type:'broadcast',channel:this.key,event:message.event,payload:message.payload})?'ok':'error';}return 'ok';}
  presenceState(){const out={};for(const [id,meta] of this.presence)out[id]=[{...meta,id}];return out;}
  close(){if(this.closed)return;this.closed=true;if(isOpen()){send({type:'untrack',channel:this.key});send({type:'unsubscribe',channel:this.key});}RELAY.channels.delete(this.key);}
  _resubscribe(){if(this.closed||!isOpen())return;this.subscribed=false;send({type:'subscribe',channel:this.key});}
  _markSubscribed(){if(this.closed)return;this.subscribed=true;try{this.statusCb?.('SUBSCRIBED');}catch{}this._resolveReady?.(this);this._resolveReady=null;if(this.trackMeta)send({type:'track',channel:this.key,meta:this.trackMeta});}
  _markDisconnected(){if(this.closed)return;this.subscribed=false;try{this.statusCb?.('CLOSED');}catch{}}
  _emitBroadcast(event,payload){for(const h of this.handlers){if(h.type==='broadcast'&&h.filter?.event===event){try{h.cb({payload});}catch(error){console.warn('[V16 relay broadcast]',error);}}}}
  _applyPresence(entries){
    const before=this.presence||new Map(),next=new Map();for(const item of entries||[])if(item?.id)next.set(item.id,item);this.presence=next;
    const joined=[],left=[];for(const[id,meta]of next)if(!before.has(id))joined.push(meta);for(const[id,meta]of before)if(!next.has(id))left.push(meta);
    for(const h of this.handlers){try{
      if(h.type==='presence'&&h.filter?.event==='sync')h.cb();
      if(joined.length&&h.type==='presence'&&h.filter?.event==='join')h.cb({newPresences:joined});
      if(left.length&&h.type==='presence'&&h.filter?.event==='leave')h.cb({leftPresences:left});
    }catch(error){console.warn('[V16 relay presence]',error);}}
  }
}
RelayChannel.prototype.presence=new Map();

async function connectGlobalRelay(){
  await ensureSocket();RELAY.active=true;if(NET_V9)NET_V9.disposed=true;
  if(globalCh instanceof RelayChannel&&globalCh.subscribed){globalConnected=true;return globalCh;}
  if(globalCh instanceof RelayChannel)globalCh.close();
  const key=cfg.WORLD_CHANNEL+':global',ch=new RelayChannel(key);ch.presence=new Map();globalCh=ch;
  ch.on('presence',{event:'sync'},()=>{const st=ch.presenceState(),ids=new Set();for(const list of Object.values(st))for(const p of list)if(p?.id)ids.add(p.id);globalPresenceIds=ids;updateUI();});
  ch.on('presence',{event:'join'},({newPresences})=>{for(const p of newPresences||[])if(p.id!==SESSION_ID)toast(clean(p.name)+' 进入了世界');});
  ch.on('presence',{event:'leave'},({leftPresences})=>{for(const p of leftPresences||[])if(p.id!==SESSION_ID)toast(clean(p.name)+' 离开了世界');});
  ch.on('broadcast',{event:'chat'},({payload})=>receiveChat(payload));
  ch.on('broadcast',{event:'map_pos'},({payload})=>{try{window.ABYSSAL_UX_V11?.onMapPos?.(payload);}catch{}});
  ch.subscribe(status=>{globalConnected=status==='SUBSCRIBED';updateUI();});
  await ch.ready;globalConnected=true;await ch.track(globalMeta());measurePingRelay();updateUI();return ch;
}
async function switchZoneRelay(z){
  await ensureSocket();RELAY.active=true;if(NET_V9)NET_V9.disposed=true;
  const target=String(z||currentZone);const nonce=++switchNonce;switching=true;currentZone=target;me.zone=target;seedZone(target);remotes.clear();lastSeqById.clear();recvSeq=0;missedSeq=0;zonePresenceIds.clear();zoneConnected=false;zoneLeader=false;zoneLeaderId='';mobs=[];
  const previous=zoneCh;if(previous instanceof RelayChannel)previous.close();zoneCh=null;
  if(nonce!==switchNonce){switching=false;return null;}
  const key=cfg.WORLD_CHANNEL+':zone:'+target,ch=new RelayChannel(key);ch.presence=new Map();zoneCh=ch;
  ch.on('presence',{event:'sync'},()=>{
    const st=ch.presenceState(),ids=new Set(),meta=new Map();for(const list of Object.values(st))for(const p of list)if(p?.id){ids.add(p.id);meta.set(p.id,p);}zonePresenceIds=ids;
    for(const[pid,p]of meta){if(pid===SESSION_ID)continue;let r=remotes.get(pid);if(!r){r={id:pid,name:clean(p.name),color:p.color||'#aab8af',x:finite(p.x,me.x),y:finite(p.y,me.y),tx:finite(p.x,me.x),ty:finite(p.y,me.y),dir:finite(p.dir,0),hp:100,sanity:100,attack:0,moving:false,ward:!!p.ward};remotes.set(pid,r);}else{r.name=clean(p.name);r.color=p.color||r.color;r.ward=!!p.ward;}}
    for(const rid of [...remotes.keys()])if(!ids.has(rid))remotes.delete(rid);electLeader();updateUI();
  });
  ch.on('broadcast',{event:'move'},({payload})=>onMove(payload));ch.on('broadcast',{event:'attack'},({payload})=>onAttack(payload));ch.on('broadcast',{event:'mobs'},({payload})=>onMobs(payload));ch.on('broadcast',{event:'mob_hit'},({payload})=>onMobHit(payload));ch.on('broadcast',{event:'loot'},({payload})=>onLoot(payload));ch.on('broadcast',{event:'harvest'},({payload})=>onHarvest(payload));ch.on('broadcast',{event:'state_req'},()=>{if(zoneLeader)broadcastWorld();});ch.on('broadcast',{event:'world'},({payload})=>onWorld(payload));
  ch.subscribe(status=>{zoneConnected=status==='SUBSCRIBED';updateUI();});
  await ch.ready;if(ch!==zoneCh||nonce!==switchNonce){switching=false;return null;}zoneConnected=true;
  await ch.track({id:SESSION_ID,name:me.name,color:me.color,x:Math.round(me.x),y:Math.round(me.y),dir:me.dir,ward:fieldGraceUntil>Date.now()});if(globalCh instanceof RelayChannel)await globalCh.track(globalMeta());
  setTimeout(()=>{if(ch===zoneCh&&zoneConnected)ch.send({type:'broadcast',event:'state_req',payload:{id:SESSION_ID,zone:target}});},250);
  switching=false;updateUI();return ch;
}
function measurePingRelay(){
  if(!isOpen())return;const id=SESSION_ID+':'+(++RELAY.pingSeq);RELAY.pendingPings.set(id,performance.now());RELAY.pingSent++;send({type:'ping',id});
}
async function reconnectRelay(){
  if(!RELAY.enabled)return;
  try{try{RELAY.socket?.close();}catch{}RELAY.connected=false;RELAY.helloAck=false;await ensureSocket();globalConnected=false;zoneConnected=false;await connectGlobalRelay();await switchZoneRelay(currentZone);}catch(error){RELAY.lastError=String(error?.message||error);scheduleReconnect();}
}
function fallBackToSupabase(reason){
  RELAY.active=false;RELAY.enabled=false;RELAY.fallbackReason=String(reason||'relay unavailable');if(NET_V9)NET_V9.disposed=false;setBadge('联机线路：Supabase 备用','#f0d58a');
}

connectGlobal=async function(){
  if(!RELAY.enabled)return originalConnectGlobal();
  try{return await connectGlobalRelay();}catch(error){RELAY.lastError=String(error?.message||error);fallBackToSupabase(RELAY.lastError);return originalConnectGlobal();}
};
switchZone=async function(z){
  if(!RELAY.enabled)return originalSwitchZone(z);
  try{return await switchZoneRelay(z);}catch(error){RELAY.lastError=String(error?.message||error);fallBackToSupabase(RELAY.lastError);return originalSwitchZone(z);}
};
measurePing=function(){if(RELAY.active)return measurePingRelay();return originalMeasurePing();};
connectionQuality=function(){
  if(!RELAY.active)return originalConnectionQuality();
  if(!isOpen()||!globalConnected||!zoneConnected)return ['重新连接','reconnect'];
  if(!pingSamples.length)return ['测量中','reconnect'];
  const p=pingSamples.at(-1),total=RELAY.pingReplies+RELAY.pingLost,loss=total?RELAY.pingLost/total:0;if(p<180&&loss<.06)return ['良好','good'];if(p<330&&loss<.15)return ['一般','fair'];return ['较差','poor'];
};
if(NET_V9)NET_V9.reconnect=reconnectRelay;

const baseUpdateUIV16=updateUI;
updateUI=function(){
  baseUpdateUIV16();if(!RELAY.active)return;
  if(pingSamples.length){const p=pingSamples.at(-1);let j=0;for(let i=1;i<pingSamples.length;i++)j+=Math.abs(pingSamples[i]-pingSamples[i-1]);if(pingSamples.length>1)j/=pingSamples.length-1;pingEl.textContent=Math.round(p)+'ms';jitterEl.textContent=Math.round(j)+'ms';}else{pingEl.textContent='测量中';jitterEl.textContent='--';}
  const total=RELAY.pingReplies+RELAY.pingLost;lossEl.textContent=total?(RELAY.pingLost/total*100).toFixed(1)+'%':'0.0%';onlineEl.textContent='在线 '+Math.max(1,globalPresenceIds.size||1);refreshDiag();
};

setInterval(()=>{
  if(!started||!RELAY.active)return;const now=performance.now();for(const[id,t]of [...RELAY.pendingPings])if(now-t>5000){RELAY.pendingPings.delete(id);RELAY.pingLost++;}if(isOpen()){globalCh?.track(globalMeta());zoneCh?.track({id:SESSION_ID,name:me.name,color:me.color,x:Math.round(me.x),y:Math.round(me.y),dir:me.dir,ward:fieldGraceUntil>Date.now()});}updateUI();
},2000);
setInterval(()=>{if(started&&RELAY.active&&isOpen())measurePingRelay();},4000);
window.addEventListener('online',()=>{if(started&&RELAY.active&&!isOpen())scheduleReconnect();});
window.addEventListener('offline',()=>{if(RELAY.active){globalConnected=false;zoneConnected=false;setConnection('离线','poor');}});

badge();
})();
