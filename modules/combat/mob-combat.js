const AW_MOB_TARGET_ATTACK_RECOVERY_MS=350;
const awMobTargetAttackRecoveryUntil=new Map();
const awMobAttackHistory=new Map();
function applyMobDamage(target,kind,mob){const damage=kind==='watcher'?8:(kind==='crawler'?4:5),sanity=kind==='watcher'?7:(kind==='cultist'?3:1),mobState=mob?.id?{mobId:String(mob.id),hitCd:finite(mob.hitCd,0),hitCdUntil:finite(mob.hitCdUntil,0)}:{},payload={target,damage,sanity,kind,...mobState};if(target===SESSION_ID)onMobHit(payload);zoneCh?.send({type:'broadcast',event:'mob_hit',payload})}
function commitMobMovement(m,nx,ny){const fromX=m.x,fromY=m.y,spatial=globalThis.ABYSSAL_WORLD_SPATIAL_V1;if(spatial?.resolveMovement){const r=spatial.resolveMovement(currentZone,fromX,fromY,nx,ny,10);m.x=r.x;m.y=r.y;if(r.blocked)try{window.dispatchEvent(new CustomEvent('abyssal:mob-movement-blocked',{detail:{playerId:SESSION_ID,zone:currentZone,mobId:String(m.id||''),mobKind:String(m.kind||''),fromX,fromY,toX:r.x,toY:r.y,attemptX:nx,attemptY:ny,radius:10}}))}catch{}return;}m.x=nx;m.y=ny}
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
