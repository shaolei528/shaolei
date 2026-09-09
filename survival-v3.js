import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm';

const cfg=window.ABYSSAL_CONFIG||{};
const $=s=>document.querySelector(s);
const gate=$('#gate'),game=$('#game'),nameInput=$('#name'),enterBtn=$('#enter'),setup=$('#setup');
const canvas=$('#canvas'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const hpFill=$('#hpFill'),hungerFill=$('#hungerFill'),sanityFill=$('#sanityFill'),hpVal=$('#hpVal'),hungerVal=$('#hungerVal'),sanityVal=$('#sanityVal');
const pingEl=$('#ping'),jitterEl=$('#jitter'),lossEl=$('#loss'),zoneEl=$('#zone'),connectionEl=$('#connection'),onlineEl=$('#online'),playerList=$('#playerList'),toastEl=$('#toast');
const joystick=$('#joystick'),stick=$('#stick'),useBtn=$('#useBtn'),dashBtn=$('#dashBtn'),attackBtn=$('#attackBtn'),craftPanel=$('#craftPanel'),closeCraft=$('#closeCraft'),deathEl=$('#death'),respawnBtn=$('#respawn');
const itemEls={wood:$('#wood'),stone:$('#stone'),food:$('#food'),shard:$('#shard')};

const WORLD={w:4800,h:4800,zone:1600};
const id=(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now()).slice(0,12);
const palette=['#a9cab3','#c4a4bb','#bfcf82','#94b8c8','#cba67d','#9f94c9'];
const color=palette[[...id].reduce((a,c)=>a+c.charCodeAt(0),0)%palette.length];
let supabase=null,globalCh=null,zoneCh=null,connected=false,currentZone='1:1',zoneLeader=false,zoneLeaderId='';
let remotes=new Map(),presenceMeta=new Map(),presenceIds=new Set(),mobs=[],resources=[],harvested=new Map();
let pingSamples=[],recvSeq=0,missedSeq=0,lastSeqById=new Map(),toastTimer=0,last=performance.now(),netTimer=0,moveTimer=0,mobSendTimer=0,presenceTimer=0;
let joystickState={x:0,y:0},dashQueued=false,attackCd=0,dashCd=0,attackFlash=0,dead=false;
let inventory={wood:0,stone:0,food:1,shard:0,knife:false,lantern:false};
let me={id,name:'',color,x:WORLD.w/2+Math.random()*120-60,y:WORLD.h/2+Math.random()*120-60,r:18,hp:100,hunger:100,sanity:100,dir:0,seq:0,zone:'1:1'};
let camera={x:me.x,y:me.y};

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const clean=s=>(String(s||'').replace(/[<>]/g,'').trim().slice(0,16)||'Wanderer');
const zoneOf=(x,y)=>`${clamp(Math.floor(x/WORLD.zone),0,2)}:${clamp(Math.floor(y/WORLD.zone),0,2)}`;
const d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function hash(x,y,s=1337){let n=(x*374761393+y*668265263+s*69069)|0;n=(n^(n>>>13))*1274126177;n^=n>>>16;return (n>>>0)/4294967295}
function toast(t){toastEl.textContent=t;toastEl.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.remove('show'),1500)}
function netClass(){if(!connected)return['RECONNECTING','reconnect'];const p=pingSamples.at(-1)??999;if(p<140)return['GOOD','good'];if(p<260)return['FAIR','fair'];return['POOR','poor']}
function updateUI(){
  const pct=(el,v)=>el.style.width=clamp(v,0,100)+'%';pct(hpFill,me.hp);pct(hungerFill,me.hunger);pct(sanityFill,me.sanity);
  hpVal.textContent=Math.round(me.hp);hungerVal.textContent=Math.round(me.hunger);sanityVal.textContent=Math.round(me.sanity);
  for(const k of ['wood','stone','food','shard'])itemEls[k].textContent=inventory[k];
  zoneEl.textContent=currentZone;onlineEl.textContent='ONLINE '+Math.max(1,presenceIds.size);
  const q=netClass();connectionEl.textContent=q[0];connectionEl.className='connection '+q[1];
  if(pingSamples.length){const p=pingSamples.at(-1),j=pingSamples.length>1?pingSamples.slice(1).reduce((s,v,i)=>s+Math.abs(v-pingSamples[i]),0)/(pingSamples.length-1):0;pingEl.textContent=Math.round(p)+'ms';jitterEl.textContent=Math.round(j)+'ms'}
  const total=recvSeq+missedSeq;lossEl.textContent=(total?missedSeq/total*100:0).toFixed(1)+'%';
  const near=[...remotes.values()].sort((a,b)=>d2(a,me)-d2(b,me)).slice(0,7);playerList.innerHTML=near.map(p=>`<div>${p.name||'Wanderer'}</div>`).join('')||'<div>only the fog</div>';
}

function seedZone(zone){
  const [zx,zy]=zone.split(':').map(Number),ox=zx*WORLD.zone,oy=zy*WORLD.zone;resources=[];
  const types=['wood','wood','wood','stone','stone','food','shard'];
  for(let i=0;i<44;i++){const r1=hash(i,zx*17+zy*31,777),r2=hash(i+83,zx*13+zy*19,991),type=types[Math.floor(hash(i,zx+zy,431)*types.length)];resources.push({id:`${zone}:${i}`,type,x:ox+80+r1*(WORLD.zone-160),y:oy+120+r2*(WORLD.zone-220),r:type==='wood'?25:18})}
}
function spawnMobs(zone){
  const [zx,zy]=zone.split(':').map(Number),ox=zx*WORLD.zone,oy=zy*WORLD.zone;mobs=[];
  for(let i=0;i<7;i++){const kind=i%3===0?'watcher':(i%3===1?'cultist':'crawler');mobs.push({id:`m${zone}-${i}`,kind,x:ox+180+hash(i,zx,91)*(WORLD.zone-360),y:oy+180+hash(i,zy,177)*(WORLD.zone-360),hp:kind==='watcher'?85:60,phase:hash(i,zx+zy,23)*6.28})}
}

async function enter(){
  if(!cfg.SUPABASE_URL||!cfg.SUPABASE_KEY){setup.classList.remove('hidden');setup.textContent='Realtime backend is not connected yet. The survival build is ready, but needs its free Supabase project.';return}
  me.name=clean(nameInput.value);gate.classList.add('hidden');game.classList.remove('hidden');seedZone(currentZone);updateUI();
  supabase=createClient(cfg.SUPABASE_URL,cfg.SUPABASE_KEY,{realtime:{params:{eventsPerSecond:10}}});
  await connectGlobal();await switchZone(zoneOf(me.x,me.y));requestAnimationFrame(loop);
}
enterBtn.addEventListener('click',enter);nameInput.addEventListener('keydown',e=>{if(e.key==='Enter')enter()});

async function connectGlobal(){
  globalCh=supabase.channel(cfg.WORLD_CHANNEL+':presence',{config:{presence:{key:id},broadcast:{ack:true,self:true}}});
  globalCh.on('presence',{event:'sync'},syncPresence).on('presence',{event:'join'},({newPresences})=>{for(const p of newPresences||[])if(p.id!==id)toast(`${p.name||'Someone'} entered the fog`)}).on('presence',{event:'leave'},({leftPresences})=>{for(const p of leftPresences||[])if(p.id!==id){toast(`${p.name||'Someone'} vanished`);remotes.delete(p.id)}});
  globalCh.subscribe(async status=>{connected=status==='SUBSCRIBED';if(connected){await globalCh.track(meta());toast('The world is listening.')}updateUI()});
}
function meta(){return{id,name:me.name,color:me.color,x:Math.round(me.x),y:Math.round(me.y),zone:currentZone,online_at:new Date().toISOString()}}
function syncPresence(){
  const st=globalCh.presenceState(),next=new Set(),metaMap=new Map();for(const list of Object.values(st))for(const p of list){if(!p?.id)continue;next.add(p.id);metaMap.set(p.id,p)}presenceIds=next;presenceMeta=metaMap;electLeader();updateUI();
}
function electLeader(){const ids=[...presenceMeta.values()].filter(p=>p.zone===currentZone).map(p=>p.id).sort();zoneLeaderId=ids[0]||id;const was=zoneLeader;zoneLeader=zoneLeaderId===id;if(zoneLeader&&!was)spawnMobs(currentZone)}

async function switchZone(z){
  if(zoneCh){try{await supabase.removeChannel(zoneCh)}catch{}}currentZone=z;me.zone=z;seedZone(z);remotes.clear();lastSeqById.clear();
  zoneCh=supabase.channel(`${cfg.WORLD_CHANNEL}:zone:${z}`,{config:{broadcast:{ack:true,self:false}}});
  zoneCh.on('broadcast',{event:'move'},({payload})=>onMove(payload)).on('broadcast',{event:'attack'},({payload})=>onAttack(payload)).on('broadcast',{event:'mobs'},({payload})=>{if(!zoneLeader&&payload?.zone===currentZone)mobs=(payload.mobs||[]).map(m=>({...m}))});
  zoneCh.subscribe(async status=>{if(status==='SUBSCRIBED'){await globalCh.track(meta());electLeader();toast('Zone '+z)}});updateUI();
}
function onMove(p){if(!p||p.id===id||p.zone!==currentZone)return;const prev=lastSeqById.get(p.id);if(prev!=null&&p.seq>prev+1)missedSeq+=p.seq-prev-1;recvSeq++;lastSeqById.set(p.id,p.seq);let r=remotes.get(p.id);if(!r){r={...p,x:p.x,y:p.y,tx:p.x,ty:p.y,attack:0};remotes.set(p.id,r)}else{r.tx=p.x;r.ty=p.y;r.dir=p.dir;r.hp=p.hp;r.sanity=p.sanity;r.attack=Math.max(r.attack||0,p.attack||0)}}
function onAttack(p){if(!p||p.id===id)return;let r=remotes.get(p.id);if(r)r.attack=.14;const range=p.range||62;if(!dead&&Math.hypot(me.x-p.x,me.y-p.y)<range){const angle=Math.atan2(me.y-p.y,me.x-p.x),diff=Math.abs(Math.atan2(Math.sin(angle-p.dir),Math.cos(angle-p.dir)));if(diff<1.0){me.hp-=p.damage||10;toast(`${p.name||'A survivor'} struck you`);if(me.hp<=0)die()}}}

function sendMove(){if(!zoneCh||!connected)return;me.seq++;zoneCh.send({type:'broadcast',event:'move',payload:{id,name:me.name,color:me.color,x:Math.round(me.x),y:Math.round(me.y),dir:me.dir,hp:Math.round(me.hp),sanity:Math.round(me.sanity),zone:currentZone,seq:me.seq,attack:attackFlash}})}
function adaptiveInterval(){const p=pingSamples.at(-1)??120;return p<140?.12:p<260?.18:.3}
async function measurePing(){if(!globalCh||!connected)return;const t=performance.now();try{const s=await globalCh.send({type:'broadcast',event:'net_probe',payload:{id,t:Date.now()}});if(s==='ok'){pingSamples.push(performance.now()-t);if(pingSamples.length>10)pingSamples.shift()}}catch{}updateUI()}

function use(){if(dead)return;let target=null,best=70;for(const r of resources){const until=harvested.get(r.id)||0;if(until>Date.now())continue;const d=d2(me,r);if(d<best){best=d;target=r}}if(target){inventory[target.type]++;harvested.set(target.id,Date.now()+45000);toast(target.type==='shard'?'You found an eldritch shard.':`Collected ${target.type}`);updateUI();return}craftPanel.classList.remove('hidden')}
useBtn.addEventListener('click',use);closeCraft.addEventListener('click',()=>craftPanel.classList.add('hidden'));
craftPanel.addEventListener('click',e=>{const b=e.target.closest('[data-craft]');if(!b)return;const c=b.dataset.craft;if(c==='knife'){if(inventory.wood>=4&&inventory.stone>=3){inventory.wood-=4;inventory.stone-=3;inventory.knife=true;toast('Bone Knife crafted')}else toast('Not enough materials')}if(c==='lantern'){if(inventory.wood>=3&&inventory.shard>=2){inventory.wood-=3;inventory.shard-=2;inventory.lantern=true;toast('The lantern whispers back.')}else toast('Not enough materials')}if(c==='meal'){if(inventory.food>=2){inventory.food-=2;me.hunger=clamp(me.hunger+45,0,100);me.hp=clamp(me.hp+8,0,100);toast('You eat in silence.')}else toast('Need 2 food')}updateUI()});

dashBtn.addEventListener('pointerdown',()=>{if(!dead&&dashCd<=0){dashQueued=true;dashCd=1.4}});
attackBtn.addEventListener('pointerdown',attack);
function attack(){if(dead||attackCd>0)return;attackCd=inventory.knife?.32:.48;attackFlash=.15;const payload={id,name:me.name,x:me.x,y:me.y,dir:me.dir,range:inventory.knife?78:61,damage:inventory.knife?22:11};zoneCh?.send({type:'broadcast',event:'attack',payload});handleMobAttack(payload)}
function handleMobAttack(p){if(!zoneLeader)return;for(const m of mobs){if(m.hp<=0)continue;const d=Math.hypot(m.x-p.x,m.y-p.y);if(d>p.range)continue;const a=Math.atan2(m.y-p.y,m.x-p.x),diff=Math.abs(Math.atan2(Math.sin(a-p.dir),Math.cos(a-p.dir)));if(diff<1.0){m.hp-=p.damage;if(m.hp<=0){inventory.shard+=m.kind==='watcher'?2:1;toast('Something ancient collapses.');setTimeout(()=>{m.hp=m.kind==='watcher'?85:60;m.x+=120*(Math.random()-.5);m.y+=120*(Math.random()-.5)},8000)}}}}

function die(){if(dead)return;dead=true;me.hp=0;inventory.wood=Math.floor(inventory.wood*.75);inventory.stone=Math.floor(inventory.stone*.75);inventory.food=Math.floor(inventory.food*.75);inventory.shard=Math.floor(inventory.shard*.75);deathEl.classList.remove('hidden');updateUI()}
respawnBtn.addEventListener('click',()=>{dead=false;deathEl.classList.add('hidden');me.x=WORLD.w/2+Math.random()*180-90;me.y=WORLD.h/2+Math.random()*180-90;me.hp=100;me.hunger=70;me.sanity=75;const z=zoneOf(me.x,me.y);if(z!==currentZone)switchZone(z);updateUI()});

let joyActive=false,joyPid=null;
function moveJoy(e){const r=joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.31;let dx=e.clientX-cx,dy=e.clientY-cy,l=Math.hypot(dx,dy)||1;if(l>max){dx=dx/l*max;dy=dy/l*max}joystickState.x=dx/max;joystickState.y=dy/max;stick.style.transform=`translate(${dx}px,${dy}px)`}
joystick.addEventListener('pointerdown',e=>{joyActive=true;joyPid=e.pointerId;joystick.setPointerCapture(e.pointerId);moveJoy(e)});joystick.addEventListener('pointermove',e=>{if(joyActive&&e.pointerId===joyPid)moveJoy(e)});function stopJoy(){joyActive=false;joystickState.x=joystickState.y=0;stick.style.transform='translate(0,0)'}joystick.addEventListener('pointerup',stopJoy);joystick.addEventListener('pointercancel',stopJoy);

function update(dt,now){
  if(dead)return;attackCd=Math.max(0,attackCd-dt);dashCd=Math.max(0,dashCd-dt);attackFlash=Math.max(0,attackFlash-dt);
  let mx=joystickState.x,my=joystickState.y,l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}let speed=145;if(dashQueued){speed=390;dashQueued=false}if(l>.08)me.dir=Math.atan2(my,mx);me.x=clamp(me.x+mx*speed*dt,25,WORLD.w-25);me.y=clamp(me.y+my*speed*dt,25,WORLD.h-25);
  const z=zoneOf(me.x,me.y);if(z!==currentZone)switchZone(z);
  me.hunger=clamp(me.hunger-dt*.12,0,100);const night=nightLevel();let sanityDrain=.015+night*.055;if(inventory.lantern)sanityDrain*=.45;for(const m of mobs)if(m.hp>0&&Math.hypot(me.x-m.x,me.y-m.y)<220)sanityDrain+=.09;me.sanity=clamp(me.sanity-dt*sanityDrain,0,100);if(me.hunger<=0)me.hp-=dt*2.2;if(me.sanity<=0)me.hp-=dt*.35;if(me.hp<=0)die();
  for(const r of remotes.values()){r.x=lerp(r.x,r.tx,.22);r.y=lerp(r.y,r.ty,.22);r.attack=Math.max(0,(r.attack||0)-dt)}
  if(zoneLeader)updateMobs(dt);
  moveTimer+=dt;const interval=adaptiveInterval();if(moveTimer>=interval){moveTimer=0;sendMove()}
  presenceTimer+=dt;if(presenceTimer>4){presenceTimer=0;globalCh?.track(meta())}
  netTimer+=dt;if(netTimer>4){netTimer=0;measurePing()}
  if(zoneLeader){mobSendTimer+=dt;if(mobSendTimer>.28){mobSendTimer=0;zoneCh?.send({type:'broadcast',event:'mobs',payload:{zone:currentZone,mobs:mobs.map(m=>({id:m.id,kind:m.kind,x:Math.round(m.x),y:Math.round(m.y),hp:m.hp,phase:m.phase}))}})}}
  updateUI()
}
function updateMobs(dt){const actors=[me,...remotes.values()];for(const m of mobs){if(m.hp<=0)continue;let t=null,bd=1e9;for(const p of actors){const d=Math.hypot(m.x-p.x,m.y-p.y);if(d<bd){bd=d;t=p}}if(t&&bd<430){const a=Math.atan2(t.y-m.y,t.x-m.x),sp=m.kind==='crawler'?58:38;m.x+=Math.cos(a)*sp*dt;m.y+=Math.sin(a)*sp*dt}else{m.phase+=dt*.5;m.x+=Math.cos(m.phase)*10*dt;m.y+=Math.sin(m.phase*.7)*10*dt}m.x=clamp(m.x,12,WORLD.w-12);m.y=clamp(m.y,12,WORLD.h-12);if(Math.hypot(me.x-m.x,me.y-m.y)<me.r+16&&Math.random()<dt*1.2){me.hp-=m.kind==='watcher'?9:5;me.sanity-=m.kind==='watcher'?7:2;if(me.hp<=0)die()}}}
function nightLevel(){const phase=(Date.now()%180000)/180000;return clamp((Math.sin(phase*Math.PI*2-Math.PI/2)+.15)/1.15,0,1)}

function draw(){
  const W=canvas.width,H=canvas.height;ctx.clearRect(0,0,W,H);camera.x=lerp(camera.x,me.x,.08);camera.y=lerp(camera.y,me.y,.08);drawGround(W,H);drawResources(W,H);drawMobs(W,H);for(const p of remotes.values())drawPlayer(p,false);drawPlayer(me,true);drawFog(W,H);requestAnimationFrame(draw)
}
function sx(x){return Math.round(x-camera.x+canvas.width/2)}function sy(y){return Math.round(y-camera.y+canvas.height/2)}
function drawGround(W,H){ctx.fillStyle='#0b1814';ctx.fillRect(0,0,W,H);const ts=24,minX=Math.floor((camera.x-W/2)/ts)-1,maxX=Math.ceil((camera.x+W/2)/ts)+1,minY=Math.floor((camera.y-H/2)/ts)-1,maxY=Math.ceil((camera.y+H/2)/ts)+1;for(let ty=minY;ty<=maxY;ty++)for(let tx=minX;tx<=maxX;tx++){const h=hash(tx,ty,17),x=sx(tx*ts),y=sy(ty*ts);ctx.fillStyle=h>.82?'#10221c':h<.16?'#08110f':'#0c1a16';ctx.fillRect(x,y,ts+1,ts+1);if(h>.92){ctx.fillStyle='#1b3028';ctx.fillRect(x+5,y+6,3,6);ctx.fillRect(x+12,y+3,2,8)}if(hash(tx,ty,99)>.975){ctx.fillStyle='#33433d';ctx.fillRect(x+4,y+16,14,3);ctx.fillRect(x+7,y+8,3,8)}}}
function drawResources(W,H){for(const r of resources){if((harvested.get(r.id)||0)>Date.now())continue;const x=sx(r.x),y=sy(r.y);if(x<-30||y<-30||x>W+30||y>H+30)continue;if(r.type==='wood'){ctx.fillStyle='#263b32';ctx.fillRect(x-4,y-17,8,20);ctx.fillStyle='#355247';ctx.fillRect(x-14,y-20,28,10);ctx.fillRect(x-9,y-28,18,10)}else if(r.type==='stone'){ctx.fillStyle='#53605c';ctx.fillRect(x-10,y-7,20,12);ctx.fillStyle='#6b7772';ctx.fillRect(x-5,y-12,11,5)}else if(r.type==='food'){ctx.fillStyle='#80605f';ctx.fillRect(x-5,y-5,10,10);ctx.fillStyle='#b58b76';ctx.fillRect(x-2,y-9,4,4)}else{ctx.fillStyle='#667d80';ctx.fillRect(x-3,y-12,6,20);ctx.fillStyle='#91a9aa';ctx.fillRect(x-1,y-16,3,6)}}}
function drawMobs(W,H){for(const m of mobs){if(m.hp<=0)continue;const x=sx(m.x),y=sy(m.y);if(x<-40||y<-40||x>W+40||y>H+40)continue;if(m.kind==='watcher'){ctx.fillStyle='#17201d';ctx.fillRect(x-13,y-13,26,25);ctx.fillStyle='#b8b082';ctx.fillRect(x-7,y-5,14,7);ctx.fillStyle='#2b1719';ctx.fillRect(x-2,y-4,4,5);ctx.fillStyle='#40564d';ctx.fillRect(x-16,y+8,5,13);ctx.fillRect(x+11,y+8,5,13)}else if(m.kind==='cultist'){ctx.fillStyle='#302831';ctx.fillRect(x-9,y-13,18,25);ctx.fillStyle='#7f8371';ctx.fillRect(x-5,y-11,10,8);ctx.fillStyle='#111';ctx.fillRect(x-3,y-8,2,2);ctx.fillRect(x+2,y-8,2,2)}else{ctx.fillStyle='#284139';ctx.fillRect(x-11,y-6,22,12);ctx.fillRect(x-14,y+2,5,10);ctx.fillRect(x+9,y+2,5,10);ctx.fillStyle='#98aa82';ctx.fillRect(x-6,y-3,3,3);ctx.fillRect(x+3,y-3,3,3)}}}
function drawPlayer(p,self){const x=sx(p.x),y=sy(p.y);ctx.fillStyle='#1b2521';ctx.fillRect(x-7,y-11,14,22);ctx.fillStyle=p.color||'#b0c0b5';ctx.fillRect(x-6,y-12,12,9);ctx.fillStyle='#d9e0d8';ctx.fillRect(x-4,y-9,2,2);ctx.fillRect(x+2,y-9,2,2);ctx.fillStyle=self?'#dbe9df':'#8fa197';ctx.fillRect(x-9,y+10,6,7);ctx.fillRect(x+3,y+10,6,7);const a=p.dir||0;if((self?attackFlash:p.attack)>0){ctx.strokeStyle='#d8c6a6';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,24,a-.8,a+.8);ctx.stroke()}ctx.fillStyle='#dbe5de';ctx.font='7px monospace';ctx.textAlign='center';ctx.fillText(p.name||'Wanderer',x,y-17)}
function drawFog(W,H){const n=nightLevel(),insanity=1-me.sanity/100;ctx.fillStyle=`rgba(4,8,9,${.12+n*.34})`;ctx.fillRect(0,0,W,H);if(insanity>.25){ctx.fillStyle=`rgba(32,18,38,${insanity*.12})`;ctx.fillRect(0,0,W,H);for(let i=0;i<Math.floor(insanity*6);i++){const t=(Date.now()/900+i*91)%1,x=(hash(i,33,5)*W),y=(hash(i,66,7)*H);ctx.fillStyle=`rgba(180,190,160,${.05+insanity*.06})`;ctx.fillRect(x+Math.sin(t*6.28+i)*5,y,2,2)}}}

function loop(now){const dt=clamp((now-last)/1000,0,.05);last=now;update(dt,now)}
setInterval(()=>{const now=performance.now();const dt=clamp((now-last)/1000,0,.05);last=now;update(dt,now)},33);requestAnimationFrame(draw);
updateUI();
