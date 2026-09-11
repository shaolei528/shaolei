if(!globalThis.ABYSSAL_PLAYER_COMBAT_INPUT_V1){
  globalThis.ABYSSAL_PLAYER_COMBAT_INPUT_V1={version:1,bound:true};
  dashBtn.addEventListener('pointerdown',()=>{if(started&&!dead&&dashCd<=0){dashQueued=true;dashCd=1.35}});
  attackBtn.addEventListener('pointerdown',()=>attack());
}
function attack(){if(!started||dead||attackCd>0||!zoneConnected)return;if(inCamp()){toast('Weapons stay lowered inside Safe Camp.');return}attackCd=inventory.knife?.32:.48;attackFlash=.15;const p={id:SESSION_ID,name:me.name,x:me.x,y:me.y,dir:me.dir,range:inventory.knife?80:62,damage:inventory.knife?22:11,zone:currentZone};zoneCh.send({type:'broadcast',event:'attack',payload:p});if(zoneLeader)handleMobAttack(p)}
function rewardKill(targetId,kind){const payload={target:targetId,shard:kind==='watcher'?2:1,food:kind==='cultist'&&Math.random()<.4?1:0};if(targetId===SESSION_ID)onLoot(payload);else zoneCh?.send({type:'broadcast',event:'loot',payload})}
function handleMobAttack(p){if(!zoneLeader||!p||campDist(finite(p.x,0),finite(p.y,0))<CAMP.r)return;for(const m of mobs){if(m.hp<=0)continue;const d=Math.hypot(m.x-finite(p.x,0),m.y-finite(p.y,0));if(d>finite(p.range,60))continue;const a=Math.atan2(m.y-p.y,m.x-p.x),diff=Math.abs(Math.atan2(Math.sin(a-finite(p.dir,0)),Math.cos(a-finite(p.dir,0))));if(diff<1.0){m.hp-=clamp(finite(p.damage,10),1,25);if(m.hp<=0){m.hp=0;m.respawnAt=Date.now()+11000;rewardKill(p.id,m.kind);if(p.id===SESSION_ID)toast('Something ancient collapses.')}}}}
