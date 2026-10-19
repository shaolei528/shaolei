function use(){if(dead)return;let target=null,best=70;for(const r of resources){const until=harvested.get(r.id)||0;if(until>Date.now())continue;const d=distance(me,r);if(d<best){best=d;target=r}}if(target){inventory[target.type]++;const until=Date.now()+(target.id.startsWith('camp:')?30000:60000);harvested.set(target.id,until);zoneCh?.send({type:'broadcast',event:'harvest',payload:{zone:currentZone,rid:target.id,until}});toast(target.type==='shard'?'Cold light stains your hands.':`Collected ${target.type}`);saveLocal();updateUI();return}craftPanel.classList.remove('hidden')}
useBtn.addEventListener('click',use);closeCraft.addEventListener('click',()=>craftPanel.classList.add('hidden'));

if(!globalThis.ABYSSAL_PLAYER_COMBAT_INPUT_V1){
  globalThis.ABYSSAL_PLAYER_COMBAT_INPUT_V1={version:1,bound:true};
  dashBtn.addEventListener('pointerdown',()=>{if(started&&!dead&&dashCd<=0){dashQueued=true;dashCd=1.35}});
  attackBtn.addEventListener('pointerdown',()=>attack());
}
function attack(){
  if(!started||dead||attackCd>0||!zoneConnected)return;
  if(inCamp()){toast('Weapons stay lowered inside Safe Camp.');return}
  const range=inventory.knife?80:62,spatial=globalThis.ABYSSAL_WORLD_SPATIAL_V1;
  const target=mobs.filter(m=>m.hp>0&&Math.hypot(m.x-me.x,m.y-me.y)<=range)
    .filter(m=>!spatial?.hasMeleeLineOfSight||spatial.hasMeleeLineOfSight(currentZone,me.x,me.y,m.x,m.y))
    .sort((a,b)=>Math.hypot(a.x-me.x,a.y-me.y)-Math.hypot(b.x-me.x,b.y-me.y))[0];
  const dir=target?Math.atan2(target.y-me.y,target.x-me.x):me.dir;
  if(target)me.dir=dir;
  attackCd=inventory.knife?.32:.48;attackFlash=.15;
  const p={id:SESSION_ID,name:me.name,x:me.x,y:me.y,dir,range,damage:(inventory.knife?22:11)+(globalThis.ABYSSAL_PETS_V1?.attackBonus?.()||0),zone:currentZone};
  zoneCh.send({type:'broadcast',event:'attack',payload:p});if(zoneLeader)handleMobAttack(p)
}
function rewardKill(targetId,kind,mob){const companionDrop=globalThis.ABYSSAL_PETS_V1?.rollMonsterDrop?.(kind,mob)||{},loot=globalThis.ABYSSAL_LOOT_REWARDS_V1,payload=loot?.createMobReward?.(targetId,kind,mob,companionDrop)||{target:targetId,mobKind:String(kind||''),shard:kind==='watcher'?2:1,food:kind==='cultist'&&Math.random()<.4?1:0,...companionDrop};if(!payload)return false;if(targetId===SESSION_ID)onLoot(payload);else zoneCh?.send({type:'broadcast',event:'loot',payload})}
function handleMobAttack(p){if(!zoneLeader||!p||campDist(finite(p.x,0),finite(p.y,0))<CAMP.r)return;for(const m of mobs){if(m.hp<=0)continue;const px=finite(p.x,0),py=finite(p.y,0),d=Math.hypot(m.x-px,m.y-py);if(d>finite(p.range,60))continue;const a=Math.atan2(m.y-p.y,m.x-p.x),diff=Math.abs(Math.atan2(Math.sin(a-finite(p.dir,0)),Math.cos(a-finite(p.dir,0))));if(diff<1.0){const spatial=globalThis.ABYSSAL_WORLD_SPATIAL_V1;if(spatial?.hasMeleeLineOfSight&&!spatial.hasMeleeLineOfSight(currentZone,px,py,m.x,m.y))continue;m.hp-=clamp(finite(p.damage,10),1,25);if(m.hp<=0){m.hp=0;m.defeatedAt=Date.now();m.respawnAt=Date.now()+11000;rewardKill(p.id,m.kind,m);if(p.id===SESSION_ID)toast('Something ancient collapses.')}}}}

function die(){if(dead)return;dead=true;me.hp=0;inventory.wood=Math.floor(inventory.wood*.8);inventory.stone=Math.floor(inventory.stone*.8);inventory.food=Math.floor(inventory.food*.8);inventory.shard=Math.floor(inventory.shard*.75);deathEl.classList.remove('hidden');saveLocal();updateUI()}
respawnBtn.addEventListener('click',async()=>{dead=false;deathEl.classList.add('hidden');me.x=CAMP.x+(Math.random()-.5)*110;me.y=CAMP.y+60+(Math.random()-.5)*70;me.hp=100;me.hunger=78;me.sanity=100;invulnerableUntil=Date.now()+5000;fieldGraceUntil=0;const z=zoneOf(me.x,me.y);if(z!==currentZone)await switchZone(z);toast('You wake beside the campfire.');saveLocal();updateUI()});
(()=>{
'use strict';

if(window.ABYSSAL_JOYSTICK_V1?.bound)return;

const API={version:1,bound:true,active:false,pointerId:null};
window.ABYSSAL_JOYSTICK_V1=API;
let joyActive=false,joyPid=null;

function syncState(){API.active=joyActive;API.pointerId=joyPid;}
function moveJoy(e){
  const r=joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.31;
  let dx=e.clientX-cx,dy=e.clientY-cy,l=Math.hypot(dx,dy)||1;
  if(l>max){dx=dx/l*max;dy=dy/l*max;}
  joystickState.x=dx/max;joystickState.y=dy/max;
  stick.style.transform=`translate(${dx}px,${dy}px)`;
}
function onPointerDown(e){
  if(joyActive&&e.pointerId!==joyPid)return;
  joyActive=true;joyPid=e.pointerId;syncState();
  try{joystick.setPointerCapture(e.pointerId);}catch{}
  moveJoy(e);
}
function onPointerMove(e){if(joyActive&&e.pointerId===joyPid)moveJoy(e);}
function stopJoy(event){
  const pointerId=event?.pointerId;
  if(joyActive&&pointerId!=null&&pointerId!==joyPid)return false;
  const owned=joyPid;
  joyActive=false;joyPid=null;syncState();
  joystickState.x=0;joystickState.y=0;stick.style.transform='translate(0,0)';
  if(owned!=null){try{if(joystick.hasPointerCapture?.(owned))joystick.releasePointerCapture?.(owned);}catch{}}
  return true;
}

joystick.addEventListener('pointerdown',onPointerDown);
joystick.addEventListener('pointermove',onPointerMove);
joystick.addEventListener('pointerup',stopJoy);
joystick.addEventListener('pointercancel',stopJoy);
window.stopJoy=stopJoy;
Object.assign(API,{stop:stopJoy});
})();

function applyLocalSurvival(dt){if(window.AW_SUCCESSOR_PREVIEW===true&&window.AW_DEV_QA===true&&(window.AW_SUCCESSOR_PREVIEW_START_AT_MIRE_MART===true||window.AW_SUCCESSOR_PREVIEW_START_AT_METRO_B2===true)){me.hp=100;me.sanity=100;me.hunger=100;return}if(inCamp()){me.hp=clamp(me.hp+dt*.65,0,100);me.sanity=clamp(me.sanity+dt*2.1,0,100);me.hunger=clamp(me.hunger-dt*.018,0,100);return}me.hunger=clamp(me.hunger-dt*.095,0,100);const night=nightLevel();let drain=.009+night*.055;if(inventory.lantern)drain*=.43;drain*=(globalThis.ABYSSAL_SURVIVAL_NEEDS_V1?.sanityDrainMultiplier?.(Date.now())??1);for(const m of mobs)if(m.hp>0&&Math.hypot(me.x-m.x,me.y-m.y)<220)drain+=m.kind==='watcher'?.10:.032;me.sanity=clamp(me.sanity-dt*drain,0,100);if(me.hunger<=0)me.hp-=dt*1.7;if(me.sanity<=0)me.hp-=dt*.26;if(me.hp<=0)die()}

function update(dt){if(!started||!zoneConnected)return;attackCd=Math.max(0,attackCd-dt);dashCd=Math.max(0,dashCd-dt);attackFlash=Math.max(0,attackFlash-dt);if(!dead){let mx=joystickState.x,my=joystickState.y,l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}const hasMoveInput=l>.08;let speed=inCamp()?154:146;if(dashQueued){speed=inCamp()?270:390;dashQueued=false}const fromX=me.x,fromY=me.y,targetX=clamp(fromX+mx*speed*dt,25,WORLD.w-25),targetY=clamp(fromY+my*speed*dt,25,WORLD.h-25),movementWorld=globalThis.ABYSSAL_AWAKENING_WORLD_V1,spatial=globalThis.ABYSSAL_WORLD_SPATIAL_V1,radius=Math.min(18,Math.max(0,Number.isFinite(Number(me.r))?Number(me.r):14)),resolved=movementWorld?.resolveMovement?movementWorld.resolveMovement(fromX,fromY,targetX,targetY,radius):spatial?.resolveMovement?spatial.resolveMovement(currentZone,fromX,fromY,targetX,targetY,radius):{x:targetX,y:targetY};me.x=resolved.x;me.y=resolved.y;isMoving=hasMoveInput&&Math.hypot(me.x-fromX,me.y-fromY)>.5;if(hasMoveInput)me.dir=Math.atan2(my,mx);if(isMoving)walkClock+=dt*8;const nowSafe=inCamp();if(wasInCamp&&!nowSafe){hasLeftCamp=true;const wardMs=globalThis.ABYSSAL_HOME_WORKBENCH_V1?.departureWardMs?.()===25000?25000:15000;fieldGraceUntil=Date.now()+wardMs;toast(`You left Safe Camp · ${Math.round(wardMs/1000)}s field ward.`)}if(!wasInCamp&&nowSafe)toast('Safe Camp · monsters cannot enter.');wasInCamp=nowSafe;const z=zoneOf(me.x,me.y);if(z!==currentZone&&!switching)switchZone(z);applyLocalSurvival(dt)}for(const r of remotes.values()){r.x=lerp(r.x,r.tx,.19);r.y=lerp(r.y,r.ty,.19);r.attack=Math.max(0,(r.attack||0)-dt)}if(zoneLeader)(globalThis.ABYSSAL_MOB_COMBAT_V1?.updateMobs||updateMobs)(dt);moveTimer+=dt;if(moveTimer>=adaptiveInterval()){moveTimer=0;sendMove()}mobSendTimer+=dt;if(zoneLeader&&mobSendTimer>=.45){mobSendTimer=0;zoneCh?.send({type:'broadcast',event:'mobs',payload:{zone:currentZone,mobs:mobs.map(m=>({id:m.id,kind:m.kind,x:Math.round(m.x),y:Math.round(m.y),hp:Math.round(m.hp),phase:m.phase,hitCd:m.hitCd||0,hitCdUntil:m.hitCdUntil||0,respawnAt:m.respawnAt||0}))}})}pingTimer+=dt;if(pingTimer>=5){pingTimer=0;measurePing()}globalTrackTimer+=dt;if(globalTrackTimer>=9){globalTrackTimer=0;globalCh?.track(globalMeta())}saveTimer+=dt;if(saveTimer>=6){saveTimer=0;saveLocal()}uiTimer+=dt;if(uiTimer>=.25){uiTimer=0;updateUI()}}

const AW_MOB_TARGET_ATTACK_RECOVERY_MS=350;
const awMobTargetAttackRecoveryUntil=new Map();
const awMobAttackHistory=new Map();
function applyMobDamage(target,kind,mob){const damage=kind==='watcher'?8:(kind==='crawler'?4:5),sanity=kind==='watcher'?7:(kind==='cultist'?3:1),mobState=mob?.id?{mobId:String(mob.id),hitCd:finite(mob.hitCd,0),hitCdUntil:finite(mob.hitCdUntil,0)}:{},payload={target,damage,sanity,kind,...mobState};if(target===SESSION_ID)onMobHit(payload);zoneCh?.send({type:'broadcast',event:'mob_hit',payload})}
function commitMobMovement(m,nx,ny){const spatial=globalThis.ABYSSAL_WORLD_SPATIAL_V1;if(spatial?.resolveMovement){const r=spatial.resolveMovement(currentZone,m.x,m.y,nx,ny,10);m.x=r.x;m.y=r.y;return;}m.x=nx;m.y=ny}
function mobMeleeHasLOS(m,t){const spatial=globalThis.ABYSSAL_WORLD_SPATIAL_V1;return spatial?.hasMeleeLineOfSight?spatial.hasMeleeLineOfSight(currentZone,m.x,m.y,t.x,t.y):true}
function mobWindupSeconds(kind){return kind==='watcher'?1.1:(kind==='cultist'?.95:.8)}
function mobAttackCooldownSeconds(kind){return kind==='crawler'?.9:1.15}
function updateMobs(dt){
  const now=Date.now();
  for(const[id,until]of awMobTargetAttackRecoveryUntil)if(until<=now)awMobTargetAttackRecoveryUntil.delete(id);
  const starter=currentZone==='1:1';
  // Let the first MIRE MART approach resolve into one readable pursuit before
  // the paired authored crawlers converge; ordinary outside regions retain
  // their wider pursuit radius.
  const aggro=starter?330:(currentZone==='1:0'?180:280);
  const campBuffer=starter?82:72;
  const actors=[me,...remotes.values()].filter(p=>p&&p.hp!==0&&campDist(p.x,p.y)>=CAMP.r&&!p.ward&&!(p.id===SESSION_ID&&Date.now()<fieldGraceUntil));
  const preferredAttackerByTarget=new Map();
  for(let i=0;i<mobs.length;i++){
    const candidate=mobs[i];
    if(candidate.hp<=0||candidate.phase<0||Math.max(0,(candidate.hitCd||0)-dt)>0)continue;
    let target=null,targetDistance=1e9;
    for(const actor of actors){const distanceToActor=Math.hypot(candidate.x-actor.x,candidate.y-actor.y);if(distanceToActor<targetDistance){targetDistance=distanceToActor;target=actor}}
    if(!target||targetDistance>=aggro)continue;
    const reach=(target.r||14)+18;
    if(targetDistance>=reach||!mobMeleeHasLOS(candidate,target))continue;
    const targetId=String(target.id||''),mobKey=String(candidate.id||i),lastAttackAt=awMobAttackHistory.get(mobKey)||0,previous=preferredAttackerByTarget.get(targetId);
    if(!previous||lastAttackAt<previous.lastAttackAt)preferredAttackerByTarget.set(targetId,{index:i,lastAttackAt});
  }
  const windupOwnerByTarget=new Map();
  for(let i=0;i<mobs.length;i++){
    const candidate=mobs[i];
    if(candidate.hp<=0||candidate.phase>=0)continue;
    let target=null,targetDistance=1e9;
    for(const actor of actors){const distanceToActor=Math.hypot(candidate.x-actor.x,candidate.y-actor.y);if(distanceToActor<targetDistance){targetDistance=distanceToActor;target=actor}}
    const reach=(target?.r||14)+18;
    if(target&&targetDistance<reach&&mobMeleeHasLOS(candidate,target)&&!windupOwnerByTarget.has(String(target.id||'')))windupOwnerByTarget.set(String(target.id||''),i);
  }
  const activeWindups=new Set([...windupOwnerByTarget.keys()].map(id=>actors.find(actor=>String(actor.id||'')===id)?.id).filter(id=>id!=null));
  for(let i=0;i<mobs.length;i++){
    let m=mobs[i];
    if(m.hp<=0){if(m.respawnAt&&Date.now()>=m.respawnAt){mobs[i]=freshMob(currentZone,i);m=mobs[i]}else continue}
    m.hitCd=Math.max(0,(m.hitCd||0)-dt);
    const cd=campDist(m.x,m.y);
    if(cd<CAMP.r+(starter?100:90)){const a=Math.atan2(m.y-CAMP.y,m.x-CAMP.x);m.x=CAMP.x+Math.cos(a)*(CAMP.r+(starter?102:92));m.y=CAMP.y+Math.sin(a)*(CAMP.r+(starter?102:92))}
    let t=null,bd=1e9;
    for(const p of actors){const d=Math.hypot(m.x-p.x,m.y-p.y);if(d<bd){bd=d;t=p}}
    const reach=(t?.r||14)+18,canHit=!!t&&bd<reach&&mobMeleeHasLOS(m,t);
    if(m.phase<0){
      if(!canHit||windupOwnerByTarget.get(String(t.id||''))!==i){m.phase=0}
      else{activeWindups.add(t.id);m.phase=Math.min(0,m.phase+dt);if(m.phase>=-.001){m.phase=0;applyMobDamage(t.id,m.kind,m);awMobTargetAttackRecoveryUntil.set(t.id,Date.now()+AW_MOB_TARGET_ATTACK_RECOVERY_MS)}continue}
    }
    if(t&&bd<aggro){
      const base=m.kind==='crawler'?57:(m.kind==='cultist'?39:33),sp=starter?base*.88:base;
      if(bd>=reach||!mobMeleeHasLOS(m,t)){const a=Math.atan2(t.y-m.y,t.x-m.x),nx=m.x+Math.cos(a)*sp*dt,ny=m.y+Math.sin(a)*sp*dt;if(campDist(nx,ny)>CAMP.r+campBuffer)commitMobMovement(m,nx,ny)}
      const distanceToTarget=Math.hypot(m.x-t.x,m.y-t.y),inReach=distanceToTarget<reach&&mobMeleeHasLOS(m,t);
      if(inReach&&m.hitCd<=0&&Date.now()>=(awMobTargetAttackRecoveryUntil.get(t.id)||0)&&preferredAttackerByTarget.get(String(t.id||''))?.index===i&&!activeWindups.has(t.id)){awMobAttackHistory.set(String(m.id||i),Date.now());m.phase=-mobWindupSeconds(m.kind);m.hitCd=mobAttackCooldownSeconds(m.kind);m.hitCdUntil=Date.now()+m.hitCd*1000;activeWindups.add(t.id);windupOwnerByTarget.set(String(t.id||''),i);continue}
    }else{
      m.phase+=dt*.48;
      const nx=m.x+Math.cos(m.phase)*9*dt,ny=m.y+Math.sin(m.phase*.71)*9*dt;
      if(campDist(nx,ny)>CAMP.r+campBuffer)commitMobMovement(m,nx,ny);
    }
    const[zx,zy]=currentZone.split(':').map(Number),minX=zx*WORLD.zone+20,maxX=(zx+1)*WORLD.zone-20,minY=zy*WORLD.zone+20,maxY=(zy+1)*WORLD.zone-20;
    m.x=clamp(m.x,minX,maxX);m.y=clamp(m.y,minY,maxY);
  }
}
globalThis.ABYSSAL_MOB_COMBAT_V1={version:1,updateMobs};

function nightLevel(){const elapsed=(Date.now()-sessionStartedAt)/1000;if(elapsed<240)return 0;const p=(elapsed-240)%600;if(p<320)return 0;if(p<400)return(p-320)/80;if(p<540)return 1;return 1-(p-540)/60}