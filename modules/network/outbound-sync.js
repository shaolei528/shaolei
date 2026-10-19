const MOVE_INVENTORY_COUNTS=Object.freeze(['wood','stone','food','shard','seed','egg','milk','wool','fish_reedcarp','fish_glassminnow','fish_holloweye','companion_egg','meal_river_stew','meal_glass_porridge','meal_holloweye_chowder','meal_trail_stew']);
function inventoryMoveSnapshot(){
  const source=typeof inventory!=='undefined'&&inventory?inventory:null;
  if(!source)return null;
  const snapshot={};
  for(const key of MOVE_INVENTORY_COUNTS){const count=Number(source[key]||0);snapshot[key]=Number.isFinite(count)?Math.max(0,Math.min(9999,Math.floor(count))):0;}
  snapshot.knife=source.knife===true;
  snapshot.lantern=source.lantern===true;
  return snapshot;
}
function companionMoveSnapshot(){
  const pet=globalThis.ABYSSAL_PETS_V1?.getRenderState?.(typeof me!=='undefined'?me:null);
  if(!pet||!Number.isFinite(Number(pet.x))||!Number.isFinite(Number(pet.y)))return null;
  return{id:String(pet.id||'companion').slice(0,40),name:String(pet.name||'伙伴').replace(/[<>]/g,'').trim().slice(0,14)||'伙伴',x:Math.round(Number(pet.x)),y:Math.round(Number(pet.y)),evolved:pet.evolved===true,command:pet.command==='WAIT'?'WAIT':'FOLLOW'};
}
function sendMove(){
  if(!zoneCh||!zoneConnected||dead)return;
  me.seq++;
  zoneCh.send({type:'broadcast',event:'move',payload:{id:SESSION_ID,name:me.name,color:me.color,x:Math.round(me.x),y:Math.round(me.y),dir:me.dir,hp:Math.round(me.hp),hunger:Math.round(me.hunger),sanity:Math.round(me.sanity),zone:currentZone,seq:me.seq,attack:attackFlash,inventory:inventoryMoveSnapshot(),pet:companionMoveSnapshot(),activity:globalThis.ABYSSAL_PLAYER_ACTIVITY_SYNC_V1?.getLocalSnapshot?.()||null}});
}
function adaptiveInterval(){const p=pingSamples.at(-1)??120,total=recvSeq+missedSeq,loss=total?missedSeq/total:0;if(p<150&&loss<.06)return.14;if(p<280&&loss<.15)return.20;return.32}
async function measurePing(){if(!globalCh||!globalConnected)return;const t=performance.now();try{const s=await globalCh.send({type:'broadcast',event:'net_probe',payload:{id:SESSION_ID,t:Date.now()}});if(s==='ok'){pingSamples.push(performance.now()-t);if(pingSamples.length>12)pingSamples.shift()}}catch{}updateUI()}
