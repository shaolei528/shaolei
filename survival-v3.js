import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm';

const cfg = window.ABYSSAL_CONFIG || {};
const $ = (s) => document.querySelector(s);
const gate=$('#gate'), game=$('#game'), nameInput=$('#name'), enterBtn=$('#enter'), setup=$('#setup');
const canvas=$('#canvas'), ctx=canvas.getContext('2d'); ctx.imageSmoothingEnabled=false;
const hpFill=$('#hpFill'), hungerFill=$('#hungerFill'), sanityFill=$('#sanityFill');
const hpVal=$('#hpVal'), hungerVal=$('#hungerVal'), sanityVal=$('#sanityVal');
const pingEl=$('#ping'), jitterEl=$('#jitter'), lossEl=$('#loss'), zoneEl=$('#zone');
const connectionEl=$('#connection'), onlineEl=$('#online'), playerList=$('#playerList'), toastEl=$('#toast');
const joystick=$('#joystick'), stick=$('#stick'), useBtn=$('#useBtn'), dashBtn=$('#dashBtn'), attackBtn=$('#attackBtn');
const craftPanel=$('#craftPanel'), closeCraft=$('#closeCraft'), deathEl=$('#death'), respawnBtn=$('#respawn');
const itemEls={wood:$('#wood'), stone:$('#stone'), food:$('#food'), shard:$('#shard')};

const WORLD={w:4800,h:4800,zone:1600};
const STORAGE_KEY='abyssal_wake_save_v4';
const SESSION_ID=(crypto.randomUUID?.() || (Math.random().toString(36).slice(2)+Date.now())).slice(0,12);
const palette=['#a9cab3','#c4a4bb','#bfcf82','#94b8c8','#cba67d','#9f94c9'];
const playerColor=palette[[...SESSION_ID].reduce((a,c)=>a+c.charCodeAt(0),0)%palette.length];
const BIOMES={
  '0:0':['DROWNED WOOD','#0b1713','#173028'], '1:0':['BLACK FEN','#0a1514','#1c2b28'], '2:0':['SALT RUINS','#111712','#30362c'],
  '0:1':['WEEPING MARSH','#0a1815','#17342b'], '1:1':['OLD SHRINE','#0b1814','#20362e'], '2:1':['PALE BOG','#101812','#35402f'],
  '0:2':['SUNKEN SHORE','#0a1415','#173038'], '1:2':['GRAVE REEDS','#0b1714','#20312a'], '2:2':['THE LOW TIDE','#101516','#30383a']
};

let supabase=null, globalCh=null, zoneCh=null;
let globalConnected=false, zoneConnected=false, started=false, switching=false, switchNonce=0;
let currentZone='1:1', zoneLeader=false, zoneLeaderId='';
let globalPresenceIds=new Set(), zonePresenceIds=new Set(), zonePresenceMeta=new Map();
let remotes=new Map(), mobs=[], resources=[], harvested=new Map();
let lastSeqById=new Map(), recvSeq=0, missedSeq=0, pingSamples=[];
let toastTimer=0, lastTick=performance.now(), moveTimer=0, mobSendTimer=0, pingTimer=0, saveTimer=0, globalTrackTimer=0;
let joystickState={x:0,y:0}, dashQueued=false, dashCd=0, attackCd=0, attackFlash=0, dead=false, invulnerableUntil=0;
let inventory={wood:0,stone:0,food:1,shard:0,knife:false,lantern:false};
let me={id:SESSION_ID,name:'',color:playerColor,x:WORLD.w/2,y:WORLD.h/2,r:18,hp:100,hunger:100,sanity:100,dir:0,seq:0,zone:'1:1'};
let camera={x:me.x,y:me.y};

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const clean=(s)=>(String(s||'').replace(/[<>]/g,'').trim().slice(0,16)||'Wanderer');
const zoneOf=(x,y)=>`${clamp(Math.floor(x/WORLD.zone),0,2)}:${clamp(Math.floor(y/WORLD.zone),0,2)}`;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function hash(x,y,s=1337){let n=(x*374761393+y*668265263+s*69069)|0;n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return (n>>>0)/4294967295}
function toast(t){toastEl.textContent=t;toastEl.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.remove('show'),1550)}
function saveLocal(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({v:4,at:Date.now(),name:me.name,x:me.x,y:me.y,hp:me.hp,hunger:me.hunger,sanity:me.sanity,inventory}))}catch{}}
function loadLocal(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(!s||s.v!==4||Date.now()-s.at>1000*60*60*36)return;inventory={...inventory,...s.inventory};me.x=clamp(finite(s.x,me.x),25,WORLD.w-25);me.y=clamp(finite(s.y,me.y),25,WORLD.h-25);me.hp=clamp(finite(s.hp,100),1,100);me.hunger=clamp(finite(s.hunger,100),0,100);me.sanity=clamp(finite(s.sanity,100),0,100);if(s.name)nameInput.value=clean(s.name)}catch{}}
loadLocal();

function connectionQuality(){
  if(!globalConnected||!zoneConnected)return['RECONNECTING','reconnect'];
  const p=pingSamples.at(-1)??120, total=recvSeq+missedSeq, loss=total?missedSeq/total:0;
  if(p<150&&loss<.06)return['GOOD','good'];
  if(p<280&&loss<.15)return['FAIR','fair'];
  return['POOR','poor'];
}
function setPlayersList(){
  const near=[...remotes.values()].sort((a,b)=>distance(a,me)-distance(b,me)).slice(0,7);
  playerList.replaceChildren();
  if(!near.length){const d=document.createElement('div');d.textContent='only the fog';playerList.appendChild(d);return}
  for(const p of near){const d=document.createElement('div');d.textContent=clean(p.name);playerList.appendChild(d)}
}
function updateUI(){
  const pct=(el,v)=>el.style.width=clamp(v,0,100)+'%'; pct(hpFill,me.hp);pct(hungerFill,me.hunger);pct(sanityFill,me.sanity);
  hpVal.textContent=Math.round(me.hp);hungerVal.textContent=Math.round(me.hunger);sanityVal.textContent=Math.round(me.sanity);
  for(const k of ['wood','stone','food','shard'])itemEls[k].textContent=String(inventory[k]||0);
  const biome=BIOMES[currentZone]?.[0]||'UNKNOWN'; zoneEl.textContent=`${currentZone}·${biome}`;
  onlineEl.textContent='ONLINE '+Math.max(1,globalPresenceIds.size);
  const q=connectionQuality(); connectionEl.textContent=q[0];connectionEl.className='connection '+q[1];
  if(pingSamples.length){const p=pingSamples.at(-1),j=pingSamples.length>1?pingSamples.slice(1).reduce((s,v,i)=>s+Math.abs(v-pingSamples[i]),0)/(pingSamples.length-1):0;pingEl.textContent=Math.round(p)+'ms';jitterEl.textContent=Math.round(j)+'ms'}
  const total=recvSeq+missedSeq;lossEl.textContent=(total?missedSeq/total*100:0).toFixed(1)+'%';
  setPlayersList();
}

function seedZone(zone){
  const [zx,zy]=zone.split(':').map(Number), ox=zx*WORLD.zone, oy=zy*WORLD.zone; resources=[];
  const types=['wood','wood','wood','stone','stone','food','food','shard'];
  for(let i=0;i<52;i++){
    const r1=hash(i,zx*17+zy*31,777),r2=hash(i+83,zx*13+zy*19,991),type=types[Math.floor(hash(i,zx+zy,431)*types.length)];
    resources.push({id:`${zone}:${i}`,type,x:ox+80+r1*(WORLD.zone-160),y:oy+120+r2*(WORLD.zone-220),r:type==='wood'?25:18});
  }
}
function freshMob(zone,i){
  const [zx,zy]=zone.split(':').map(Number),ox=zx*WORLD.zone,oy=zy*WORLD.zone;
  const kind=i%4===0?'watcher':(i%4===1?'cultist':'crawler');
  return {id:`m${zone}-${i}`,kind,x:ox+170+hash(i,zx,91)*(WORLD.zone-340),y:oy+170+hash(i,zy,177)*(WORLD.zone-340),hp:kind==='watcher'?95:(kind==='cultist'?72:58),phase:hash(i,zx+zy,23)*6.28,hitCd:0,respawnAt:0};
}
function spawnMobs(zone){mobs=Array.from({length:8},(_,i)=>freshMob(zone,i))}
function harvestSnapshot(){const now=Date.now(),out=[];for(const [rid,until] of harvested)if(until>now)out.push([rid,until]);return out.slice(0,80)}
function broadcastWorld(){if(!zoneLeader||!zoneConnected)return;zoneCh.send({type:'broadcast',event:'world',payload:{zone:currentZone,mobs:mobs.map(m=>({id:m.id,kind:m.kind,x:Math.round(m.x),y:Math.round(m.y),hp:Math.round(m.hp),phase:m.phase,respawnAt:m.respawnAt||0})),harvested:harvestSnapshot()}})}

async function enter(){
  if(started)return;
  if(!cfg.SUPABASE_URL||!cfg.SUPABASE_KEY){setup.classList.remove('hidden');setup.textContent='Realtime backend is not connected yet.';return}
  started=true; me.name=clean(nameInput.value); currentZone=zoneOf(me.x,me.y);me.zone=currentZone; camera={x:me.x,y:me.y};
  gate.classList.add('hidden');game.classList.remove('hidden');seedZone(currentZone);updateUI();
  supabase=createClient(cfg.SUPABASE_URL,cfg.SUPABASE_KEY,{realtime:{params:{eventsPerSecond:12}}});
  connectGlobal(); await switchZone(currentZone); toast('Listening for the fog…');
}
enterBtn.addEventListener('click',enter);nameInput.addEventListener('keydown',e=>{if(e.key==='Enter')enter()});

function globalMeta(){return{id:SESSION_ID,name:me.name,color:me.color,zone:currentZone,online_at:new Date().toISOString()}}
function connectGlobal(){
  globalCh=supabase.channel(cfg.WORLD_CHANNEL+':global',{config:{presence:{key:SESSION_ID},broadcast:{ack:true,self:false}}});
  globalCh.on('presence',{event:'sync'},()=>{
    const st=globalCh.presenceState(),next=new Set();for(const list of Object.values(st))for(const p of list)if(p?.id)next.add(p.id);globalPresenceIds=next;updateUI();
  });
  globalCh.on('presence',{event:'join'},({newPresences})=>{for(const p of newPresences||[])if(p.id!==SESSION_ID)toast(`${clean(p.name)} entered the fog`)});
  globalCh.on('presence',{event:'leave'},({leftPresences})=>{for(const p of leftPresences||[])if(p.id!==SESSION_ID)toast(`${clean(p.name)} vanished`)});
  globalCh.subscribe(async status=>{
    globalConnected=status==='SUBSCRIBED';
    if(globalConnected){await globalCh.track(globalMeta());measurePing()}
    updateUI();
  });
}
function syncZonePresence(){
  if(!zoneCh)return;
  const st=zoneCh.presenceState(),ids=new Set(),metaMap=new Map();
  for(const list of Object.values(st))for(const p of list)if(p?.id){ids.add(p.id);metaMap.set(p.id,p)}
  zonePresenceIds=ids;zonePresenceMeta=metaMap;
  for(const [pid,p] of metaMap){if(pid===SESSION_ID)continue;if(!remotes.has(pid))remotes.set(pid,{id:pid,name:clean(p.name),color:p.color||'#aab8af',x:finite(p.x,me.x),y:finite(p.y,me.y),tx:finite(p.x,me.x),ty:finite(p.y,me.y),dir:0,hp:100,sanity:100,attack:0})}
  for(const rid of [...remotes.keys()])if(!ids.has(rid))remotes.delete(rid);
  electLeader();updateUI();
}
function electLeader(){
  const ids=[...zonePresenceIds].sort();const old=zoneLeaderId;zoneLeaderId=ids[0]||SESSION_ID;const became=zoneLeaderId===SESSION_ID&&!zoneLeader;zoneLeader=zoneLeaderId===SESSION_ID;
  if(became){if(!mobs.length)spawnMobs(currentZone);toast('You hear the zone breathe.');setTimeout(broadcastWorld,180)}
  if(old&&old!==zoneLeaderId&&!zoneLeader)toast('World sync changed hands.');
}
async function switchZone(z){
  if(switching&&z===currentZone)return;
  const nonce=++switchNonce;switching=true;currentZone=z;me.zone=z;seedZone(z);remotes.clear();lastSeqById.clear();zonePresenceIds.clear();zonePresenceMeta.clear();zoneConnected=false;zoneLeader=false;zoneLeaderId='';mobs=[];
  const previous=zoneCh;zoneCh=null;if(previous){try{await supabase.removeChannel(previous)}catch{}}
  if(nonce!==switchNonce)return;
  const ch=supabase.channel(`${cfg.WORLD_CHANNEL}:zone:${z}`,{config:{presence:{key:SESSION_ID},broadcast:{ack:false,self:false}}});zoneCh=ch;
  ch.on('presence',{event:'sync'},syncZonePresence);
  ch.on('broadcast',{event:'move'},({payload})=>onMove(payload));
  ch.on('broadcast',{event:'attack'},({payload})=>onAttack(payload));
  ch.on('broadcast',{event:'mobs'},({payload})=>onMobs(payload));
  ch.on('broadcast',{event:'mob_hit'},({payload})=>onMobHit(payload));
  ch.on('broadcast',{event:'loot'},({payload})=>onLoot(payload));
  ch.on('broadcast',{event:'harvest'},({payload})=>onHarvest(payload));
  ch.on('broadcast',{event:'state_req'},()=>{if(zoneLeader)broadcastWorld()});
  ch.on('broadcast',{event:'world'},({payload})=>onWorld(payload));
  ch.subscribe(async status=>{
    if(ch!==zoneCh)return;
    zoneConnected=status==='SUBSCRIBED';
    if(zoneConnected){await ch.track({id:SESSION_ID,name:me.name,color:me.color,x:Math.round(me.x),y:Math.round(me.y)});await globalCh?.track(globalMeta());setTimeout(()=>ch.send({type:'broadcast',event:'state_req',payload:{id:SESSION_ID}}),250);toast('Entered '+(BIOMES[z]?.[0]||z))}
    updateUI();
  });
  switching=false;updateUI();
}

function validMove(p){return p&&p.id&&p.id!==SESSION_ID&&p.zone===currentZone&&Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.y))}
function onMove(p){
  if(!validMove(p))return;const seq=Math.max(0,Math.floor(finite(p.seq,0))),prev=lastSeqById.get(p.id);if(prev!=null&&seq>prev+1)missedSeq+=seq-prev-1;recvSeq++;lastSeqById.set(p.id,seq);
  const x=clamp(finite(p.x,0),0,WORLD.w),y=clamp(finite(p.y,0),0,WORLD.h);let r=remotes.get(p.id);
  if(!r){r={id:p.id,name:clean(p.name),color:p.color||'#aab8af',x,y,tx:x,ty:y,dir:finite(p.dir,0),hp:100,sanity:100,attack:0};remotes.set(p.id,r)}
  r.name=clean(p.name);r.tx=x;r.ty=y;r.dir=finite(p.dir,r.dir);r.hp=clamp(finite(p.hp,100),0,100);r.sanity=clamp(finite(p.sanity,100),0,100);r.attack=Math.max(r.attack||0,finite(p.attack,0));
}
function onAttack(p){
  if(!p||p.id===SESSION_ID||p.zone!==currentZone)return;let r=remotes.get(p.id);if(r)r.attack=.14;
  if(zoneLeader)handleMobAttack(p);
  if(dead||Date.now()<invulnerableUntil)return;
  const range=clamp(finite(p.range,61),30,90),px=finite(p.x,-9999),py=finite(p.y,-9999),dir=finite(p.dir,0);
  if(Math.hypot(me.x-px,me.y-py)<range){const angle=Math.atan2(me.y-py,me.x-px),diff=Math.abs(Math.atan2(Math.sin(angle-dir),Math.cos(angle-dir)));if(diff<1.0){me.hp-=clamp(finite(p.damage,10),1,25);toast(`${clean(p.name)} struck you`);if(me.hp<=0)die()}}
}
function onMobs(p){if(zoneLeader||!p||p.zone!==currentZone)return;const list=Array.isArray(p.mobs)?p.mobs:[];mobs=list.slice(0,12).map((m,i)=>({id:String(m.id||`m${i}`),kind:['watcher','cultist','crawler'].includes(m.kind)?m.kind:'crawler',x:clamp(finite(m.x,me.x),0,WORLD.w),y:clamp(finite(m.y,me.y),0,WORLD.h),hp:clamp(finite(m.hp,1),0,120),phase:finite(m.phase,0),hitCd:0,respawnAt:finite(m.respawnAt,0)}))}
function onWorld(p){if(zoneLeader||!p||p.zone!==currentZone)return;onMobs(p);for(const h of Array.isArray(p.harvested)?p.harvested:[]){if(Array.isArray(h)&&h.length===2&&finite(h[1],0)>Date.now())harvested.set(String(h[0]),finite(h[1],0))}}
function onHarvest(p){if(!p||p.zone!==currentZone)return;const until=finite(p.until,0);if(until>Date.now())harvested.set(String(p.rid),until)}
function onMobHit(p){if(!p||p.target!==SESSION_ID||dead||Date.now()<invulnerableUntil)return;me.hp-=clamp(finite(p.damage,4),1,16);me.sanity=clamp(me.sanity-clamp(finite(p.sanity,1),0,12),0,100);toast(p.kind==='watcher'?'The Watcher sees you.':'Something tears at you.');if(me.hp<=0)die()}
function onLoot(p){if(!p||p.target!==SESSION_ID)return;const shard=clamp(Math.floor(finite(p.shard,0)),0,3),food=clamp(Math.floor(finite(p.food,0)),0,2);inventory.shard+=shard;inventory.food+=food;toast(shard?`Recovered ${shard} eldritch shard${shard>1?'s':''}.`:'You found scraps of food.');saveLocal();updateUI()}

function sendMove(){if(!zoneCh||!zoneConnected||dead)return;me.seq++;zoneCh.send({type:'broadcast',event:'move',payload:{id:SESSION_ID,name:me.name,color:me.color,x:Math.round(me.x),y:Math.round(me.y),dir:me.dir,hp:Math.round(me.hp),sanity:Math.round(me.sanity),zone:currentZone,seq:me.seq,attack:attackFlash}})}
function adaptiveInterval(){const p=pingSamples.at(-1)??120,total=recvSeq+missedSeq,loss=total?missedSeq/total:0;if(p<150&&loss<.06)return .14;if(p<280&&loss<.15)return .20;return .32}
async function measurePing(){if(!globalCh||!globalConnected)return;const t=performance.now();try{const s=await globalCh.send({type:'broadcast',event:'net_probe',payload:{id:SESSION_ID,t:Date.now()}});if(s==='ok'){pingSamples.push(performance.now()-t);if(pingSamples.length>12)pingSamples.shift()}}catch{}updateUI()}

function use(){
  if(dead)return;let target=null,best=72;for(const r of resources){const until=harvested.get(r.id)||0;if(until>Date.now())continue;const d=distance(me,r);if(d<best){best=d;target=r}}
  if(target){inventory[target.type]++;const until=Date.now()+60000;harvested.set(target.id,until);zoneCh?.send({type:'broadcast',event:'harvest',payload:{zone:currentZone,rid:target.id,until}});toast(target.type==='shard'?'Cold light stains your hands.':`Collected ${target.type}`);saveLocal();updateUI();return}
  craftPanel.classList.remove('hidden');
}
useBtn.addEventListener('click',use);closeCraft.addEventListener('click',()=>craftPanel.classList.add('hidden'));
craftPanel.addEventListener('click',e=>{
  const b=e.target.closest('[data-craft]');if(!b)return;const c=b.dataset.craft;
  if(c==='knife'){if(inventory.knife)toast('You already carry a Bone Knife.');else if(inventory.wood>=4&&inventory.stone>=3){inventory.wood-=4;inventory.stone-=3;inventory.knife=true;toast('Bone Knife crafted.')}else toast('Need 4 wood + 3 stone.')}
  if(c==='lantern'){if(inventory.lantern)toast('Your lantern is already awake.');else if(inventory.wood>=3&&inventory.shard>=2){inventory.wood-=3;inventory.shard-=2;inventory.lantern=true;toast('The lantern whispers back.')}else toast('Need 3 wood + 2 shard.')}
  if(c==='meal'){if(inventory.food>=2){inventory.food-=2;me.hunger=clamp(me.hunger+48,0,100);me.hp=clamp(me.hp+10,0,100);toast('You eat in silence.')}else toast('Need 2 food.')}
  saveLocal();updateUI();
});

dashBtn.addEventListener('pointerdown',()=>{if(started&&!dead&&dashCd<=0){dashQueued=true;dashCd=1.35}});
attackBtn.addEventListener('pointerdown',attack);
function attack(){
  if(!started||dead||attackCd>0||!zoneConnected)return;attackCd=inventory.knife?.32:.48;attackFlash=.15;
  const p={id:SESSION_ID,name:me.name,x:me.x,y:me.y,dir:me.dir,range:inventory.knife?80:62,damage:inventory.knife?22:11,zone:currentZone};
  zoneCh.send({type:'broadcast',event:'attack',payload:p});if(zoneLeader)handleMobAttack(p);
}
function rewardKill(targetId,kind){const payload={target:targetId,shard:kind==='watcher'?2:1,food:kind==='cultist'&&Math.random()<.4?1:0};if(targetId===SESSION_ID)onLoot(payload);else zoneCh?.send({type:'broadcast',event:'loot',payload})}
function handleMobAttack(p){
  if(!zoneLeader||!p)return;for(const m of mobs){if(m.hp<=0)continue;const d=Math.hypot(m.x-finite(p.x,0),m.y-finite(p.y,0));if(d>finite(p.range,60))continue;const a=Math.atan2(m.y-p.y,m.x-p.x),diff=Math.abs(Math.atan2(Math.sin(a-finite(p.dir,0)),Math.cos(a-finite(p.dir,0))));if(diff<1.0){m.hp-=clamp(finite(p.damage,10),1,25);if(m.hp<=0){m.hp=0;m.respawnAt=Date.now()+9000;rewardKill(p.id,m.kind);toast(p.id===SESSION_ID?'Something ancient collapses.':'A creature collapses nearby.')}}}
}

function die(){if(dead)return;dead=true;me.hp=0;inventory.wood=Math.floor(inventory.wood*.75);inventory.stone=Math.floor(inventory.stone*.75);inventory.food=Math.floor(inventory.food*.75);inventory.shard=Math.floor(inventory.shard*.75);deathEl.classList.remove('hidden');saveLocal();updateUI()}
respawnBtn.addEventListener('click',async()=>{dead=false;deathEl.classList.add('hidden');me.x=WORLD.w/2+Math.random()*180-90;me.y=WORLD.h/2+Math.random()*180-90;me.hp=100;me.hunger=72;me.sanity=78;invulnerableUntil=Date.now()+3500;const z=zoneOf(me.x,me.y);if(z!==currentZone)await switchZone(z);toast('The shore rejects you — 3s ward.');saveLocal();updateUI()});

let joyActive=false,joyPid=null;
function moveJoy(e){const r=joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.31;let dx=e.clientX-cx,dy=e.clientY-cy,l=Math.hypot(dx,dy)||1;if(l>max){dx=dx/l*max;dy=dy/l*max}joystickState.x=dx/max;joystickState.y=dy/max;stick.style.transform=`translate(${dx}px,${dy}px)`}
joystick.addEventListener('pointerdown',e=>{joyActive=true;joyPid=e.pointerId;joystick.setPointerCapture(e.pointerId);moveJoy(e)});
joystick.addEventListener('pointermove',e=>{if(joyActive&&e.pointerId===joyPid)moveJoy(e)});
function stopJoy(){joyActive=false;joystickState.x=0;joystickState.y=0;stick.style.transform='translate(0,0)'}
joystick.addEventListener('pointerup',stopJoy);joystick.addEventListener('pointercancel',stopJoy);

function applyLocalSurvival(dt){
  me.hunger=clamp(me.hunger-dt*.105,0,100);const night=nightLevel();let drain=.012+night*.05;if(inventory.lantern)drain*=.42;
  for(const m of mobs)if(m.hp>0&&Math.hypot(me.x-m.x,me.y-m.y)<230)drain+=m.kind==='watcher'?.12:.045;
  me.sanity=clamp(me.sanity-dt*drain,0,100);if(me.hunger<=0)me.hp-=dt*2.0;if(me.sanity<=0)me.hp-=dt*.32;if(me.hp<=0)die();
}
function update(dt){
  if(!started)return;attackCd=Math.max(0,attackCd-dt);dashCd=Math.max(0,dashCd-dt);attackFlash=Math.max(0,attackFlash-dt);
  if(!dead){let mx=joystickState.x,my=joystickState.y,l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}let speed=148;if(dashQueued){speed=405;dashQueued=false}if(l>.08)me.dir=Math.atan2(my,mx);me.x=clamp(me.x+mx*speed*dt,25,WORLD.w-25);me.y=clamp(me.y+my*speed*dt,25,WORLD.h-25);const z=zoneOf(me.x,me.y);if(z!==currentZone&&!switching)switchZone(z);applyLocalSurvival(dt)}
  for(const r of remotes.values()){r.x=lerp(r.x,r.tx,.2);r.y=lerp(r.y,r.ty,.2);r.attack=Math.max(0,(r.attack||0)-dt)}
  if(zoneLeader)updateMobs(dt);
  moveTimer+=dt;if(moveTimer>=adaptiveInterval()){moveTimer=0;sendMove()}
  mobSendTimer+=dt;if(zoneLeader&&mobSendTimer>=.42){mobSendTimer=0;zoneCh?.send({type:'broadcast',event:'mobs',payload:{zone:currentZone,mobs:mobs.map(m=>({id:m.id,kind:m.kind,x:Math.round(m.x),y:Math.round(m.y),hp:Math.round(m.hp),phase:m.phase,respawnAt:m.respawnAt||0}))}})}
  pingTimer+=dt;if(pingTimer>=5){pingTimer=0;measurePing()}
  globalTrackTimer+=dt;if(globalTrackTimer>=10){globalTrackTimer=0;globalCh?.track(globalMeta())}
  saveTimer+=dt;if(saveTimer>=6){saveTimer=0;saveLocal()}
  updateUI();
}
function applyMobDamage(target,kind){const damage=kind==='watcher'?9:(kind==='crawler'?5:6),sanity=kind==='watcher'?8:(kind==='cultist'?3:1);if(target===SESSION_ID)onMobHit({target,damage,sanity,kind});else zoneCh?.send({type:'broadcast',event:'mob_hit',payload:{target,damage,sanity,kind}})}
function updateMobs(dt){
  const actors=[me,...remotes.values()].filter(p=>p&&p.hp!==0);
  for(let i=0;i<mobs.length;i++){
    let m=mobs[i];if(m.hp<=0){if(m.respawnAt&&Date.now()>=m.respawnAt){const fresh=freshMob(currentZone,i);mobs[i]={...fresh};m=mobs[i]}else continue}
    m.hitCd=Math.max(0,(m.hitCd||0)-dt);let t=null,bd=1e9;for(const p of actors){const d=Math.hypot(m.x-p.x,m.y-p.y);if(d<bd){bd=d;t=p}}
    if(t&&bd<460){const a=Math.atan2(t.y-m.y,t.x-m.x),sp=m.kind==='crawler'?64:(m.kind==='cultist'?43:36);m.x+=Math.cos(a)*sp*dt;m.y+=Math.sin(a)*sp*dt;if(bd<(t.r||18)+18&&m.hitCd<=0){m.hitCd=m.kind==='crawler'?.75:1.05;applyMobDamage(t.id,m.kind)}}else{m.phase+=dt*.55;m.x+=Math.cos(m.phase)*11*dt;m.y+=Math.sin(m.phase*.71)*11*dt}
    const [zx,zy]=currentZone.split(':').map(Number),minX=zx*WORLD.zone+20,maxX=(zx+1)*WORLD.zone-20,minY=zy*WORLD.zone+20,maxY=(zy+1)*WORLD.zone-20;m.x=clamp(m.x,minX,maxX);m.y=clamp(m.y,minY,maxY);
  }
}
function nightLevel(){const phase=(Date.now()%360000)/360000;return clamp((Math.sin(phase*Math.PI*2-Math.PI/2)+.18)/1.18,0,1)}

function sx(x){return Math.round(x-camera.x+canvas.width/2)}
function sy(y){return Math.round(y-camera.y+canvas.height/2)}
function draw(){
  const W=canvas.width,H=canvas.height;ctx.clearRect(0,0,W,H);camera.x=lerp(camera.x,me.x,.09);camera.y=lerp(camera.y,me.y,.09);drawGround(W,H);drawResources(W,H);drawMobs(W,H);for(const p of remotes.values())drawPlayer(p,false);drawPlayer(me,true);drawFog(W,H);requestAnimationFrame(draw)
}
function drawGround(W,H){
  const biome=BIOMES[currentZone]||['UNKNOWN','#0b1814','#20362e'];ctx.fillStyle=biome[1];ctx.fillRect(0,0,W,H);const ts=24,minX=Math.floor((camera.x-W/2)/ts)-1,maxX=Math.ceil((camera.x+W/2)/ts)+1,minY=Math.floor((camera.y-H/2)/ts)-1,maxY=Math.ceil((camera.y+H/2)/ts)+1;
  for(let ty=minY;ty<=maxY;ty++)for(let tx=minX;tx<=maxX;tx++){const h=hash(tx,ty,17),x=sx(tx*ts),y=sy(ty*ts);ctx.fillStyle=h>.84?biome[2]:(h<.13?'#07100e':biome[1]);ctx.fillRect(x,y,ts+1,ts+1);if(h>.91){ctx.fillStyle='#1f3930';ctx.fillRect(x+4,y+7,3,7);ctx.fillRect(x+12,y+3,2,10)}if(hash(tx,ty,99)>.977){ctx.fillStyle='#46534d';ctx.fillRect(x+4,y+16,14,3);ctx.fillRect(x+7,y+9,3,7)}if(hash(tx,ty,155)>.987){ctx.fillStyle='#223a39';ctx.fillRect(x+2,y+3,18,17);ctx.fillStyle='#0b1e20';ctx.fillRect(x+5,y+6,12,10)}}
}
function drawResources(W,H){for(const r of resources){if((harvested.get(r.id)||0)>Date.now())continue;const x=sx(r.x),y=sy(r.y);if(x<-35||y<-35||x>W+35||y>H+35)continue;if(r.type==='wood'){ctx.fillStyle='#243c31';ctx.fillRect(x-4,y-18,8,21);ctx.fillStyle='#355b49';ctx.fillRect(x-14,y-21,28,9);ctx.fillRect(x-9,y-29,18,10)}else if(r.type==='stone'){ctx.fillStyle='#505d58';ctx.fillRect(x-11,y-7,22,13);ctx.fillStyle='#738079';ctx.fillRect(x-5,y-12,12,5)}else if(r.type==='food'){ctx.fillStyle='#76504e';ctx.fillRect(x-6,y-4,12,9);ctx.fillStyle='#b47f68';ctx.fillRect(x-2,y-9,4,5)}else{ctx.fillStyle='#5e787c';ctx.fillRect(x-4,y-12,8,20);ctx.fillStyle='#a5bec0';ctx.fillRect(x-1,y-17,3,8);ctx.fillStyle='#314449';ctx.fillRect(x+4,y-7,3,12)}}}
function drawMobs(W,H){for(const m of mobs){if(m.hp<=0)continue;const x=sx(m.x),y=sy(m.y);if(x<-45||y<-45||x>W+45||y>H+45)continue;if(m.kind==='watcher'){ctx.fillStyle='#151f1c';ctx.fillRect(x-14,y-14,28,26);ctx.fillStyle='#beb88a';ctx.fillRect(x-8,y-6,16,8);ctx.fillStyle='#34191d';ctx.fillRect(x-2,y-5,5,6);ctx.fillStyle='#405c51';ctx.fillRect(x-17,y+8,5,14);ctx.fillRect(x+12,y+8,5,14)}else if(m.kind==='cultist'){ctx.fillStyle='#362a38';ctx.fillRect(x-10,y-14,20,27);ctx.fillStyle='#828774';ctx.fillRect(x-5,y-11,10,8);ctx.fillStyle='#101312';ctx.fillRect(x-3,y-8,2,2);ctx.fillRect(x+2,y-8,2,2);ctx.fillStyle='#6d596d';ctx.fillRect(x-13,y+2,4,13)}else{ctx.fillStyle='#29483e';ctx.fillRect(x-12,y-7,24,13);ctx.fillRect(x-15,y+1,5,11);ctx.fillRect(x+10,y+1,5,11);ctx.fillStyle='#a6b78b';ctx.fillRect(x-7,y-3,3,3);ctx.fillRect(x+4,y-3,3,3)}}}
function drawPlayer(p,self){const x=sx(p.x),y=sy(p.y);ctx.fillStyle='#17201d';ctx.fillRect(x-7,y-10,14,20);ctx.fillStyle=p.color||'#b0c0b5';ctx.fillRect(x-6,y-13,12,9);ctx.fillStyle='#dbe4dc';ctx.fillRect(x-4,y-10,2,2);ctx.fillRect(x+2,y-10,2,2);ctx.fillStyle='#45574f';ctx.fillRect(x-9,y-1,3,10);ctx.fillRect(x+6,y-1,3,10);ctx.fillStyle=self?'#dce8e0':'#8fa197';ctx.fillRect(x-8,y+9,5,7);ctx.fillRect(x+3,y+9,5,7);const a=p.dir||0;if((self?attackFlash:p.attack)>0){ctx.strokeStyle='#d8c6a6';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,25,a-.8,a+.8);ctx.stroke()}if(self&&Date.now()<invulnerableUntil){ctx.strokeStyle='#8fc9bc';ctx.lineWidth=1;ctx.strokeRect(x-11,y-16,22,34)}ctx.fillStyle='#dbe5de';ctx.font='7px monospace';ctx.textAlign='center';ctx.fillText(clean(p.name),x,y-19)}
function drawFog(W,H){
  const n=nightLevel(),insanity=1-me.sanity/100;ctx.fillStyle=`rgba(3,7,8,${.10+n*.20})`;ctx.fillRect(0,0,W,H);const radius=inventory.lantern?142:92,px=sx(me.x),py=sy(me.y),g=ctx.createRadialGradient(px,py,25,px,py,radius);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.55,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(1,5,6,${.50+n*.28})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  if(insanity>.28){ctx.fillStyle=`rgba(37,17,43,${insanity*.10})`;ctx.fillRect(0,0,W,H);const count=Math.floor(insanity*9);for(let i=0;i<count;i++){const t=Date.now()/250+i*9,x=Math.floor(hash(i,33,5)*W),y=Math.floor(hash(i,66,7)*H),ww=2+Math.floor(hash(i,91,3)*12);ctx.fillStyle=`rgba(185,200,170,${.03+insanity*.06})`;ctx.fillRect(x+Math.sin(t*.03+i)*8,y,ww,1)}}
}

setInterval(()=>{const now=performance.now(),dt=clamp((now-lastTick)/1000,0,.05);lastTick=now;update(dt)},33);
requestAnimationFrame(draw);updateUI();
