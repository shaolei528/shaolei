(()=>{
  const GUIDE={x:2325,y:2370};
  const WORKBENCH={x:2195,y:2535};
  const CAMPFIRE={x:2400,y:2400};
  const dayBadge=document.getElementById('dayBadge');
  const mapToggle=document.getElementById('mapToggle');
  const mapPanel=document.getElementById('mapPanel');
  const mapClose=document.getElementById('mapClose');
  const mapCanvas=document.getElementById('mapCanvas');
  let guideTalked=localStorage.getItem('abyssal_guide_v7')==='1',restCooldown=0,lastExtendedGrace=0;

  CAMP.r=500; CAMP.inner=340;
  function safeCount(v,d=0){v=Number(v);return Number.isFinite(v)?Math.max(0,Math.min(999,Math.floor(v))):d}
  inventory={wood:safeCount(inventory?.wood),stone:safeCount(inventory?.stone),food:safeCount(inventory?.food,2),shard:safeCount(inventory?.shard),knife:!!inventory?.knife,lantern:!!inventory?.lantern};
  try{
    const old=JSON.parse(localStorage.getItem('abyssal_wake_save_v5')||localStorage.getItem('abyssal_wake_save_v4')||'null');
    if(old&&Number(old.hp)<=0){me.x=CAMP.x;me.y=CAMP.y+70;me.hp=100;me.hunger=78;me.sanity=100}
  }catch{}

  addCampResources=function(){
    const defs=[['wood',-350,-145],['wood',350,-140],['wood',-335,160],['wood',335,160],['wood',-240,320],['wood',235,315],['stone',300,250],['stone',-300,250],['stone',-360,40],['stone',360,35],['food',260,-315],['food',-260,-315],['food',0,350]];
    defs.forEach((r,i)=>resources.push({id:`camp:${i}`,type:r[0],x:CAMP.x+r[1],y:CAMP.y+r[2],r:18}));
  };
  harvestSnapshot=function(){const now=Date.now(),out=[];for(const[rid,until]of harvested)if(until>now&&!String(rid).startsWith('camp:'))out.push([rid,until]);return out.slice(0,80)};
  onHarvest=function(p){if(!p||p.zone!==currentZone)return;const rid=String(p.rid||'');if(rid.startsWith('camp:'))return;const until=finite(p.until,0);if(until>Date.now())harvested.set(rid,until)};
  const oldOnWorld=onWorld;
  onWorld=function(p){oldOnWorld(p);for(const k of [...harvested.keys()])if(String(k).startsWith('camp:'))harvested.delete(k)};

  freshMob=function(zone,i){
    const[zx,zy]=zone.split(':').map(Number),ox=zx*WORLD.zone,oy=zy*WORLD.zone;
    const kind=zone==='1:1'?(['crawler','cultist','crawler'][i%3]):(i%4===0?'watcher':(i%4===1?'cultist':'crawler'));
    let x=ox+170+hash(i,zx,91)*(WORLD.zone-340),y=oy+170+hash(i,zy,177)*(WORLD.zone-340);
    if(zone==='1:1'&&campDist(x,y)<CAMP.r+340){const a=hash(i,31,911)*Math.PI*2,rr=CAMP.r+360+hash(i,37,321)*180;x=CAMP.x+Math.cos(a)*rr;y=CAMP.y+Math.sin(a)*rr}
    const hp=zone==='1:1'?(kind==='cultist'?60:48):(kind==='watcher'?95:(kind==='cultist'?72:58));
    return{id:`m${zone}-${i}`,kind,x,y,hp,phase:hash(i,zx+zy,23)*6.28,hitCd:0,respawnAt:0};
  };
  spawnMobs=function(zone){mobs=Array.from({length:zone==='1:1'?3:6},(_,i)=>freshMob(zone,i))};

  sendMove=function(){if(!zoneCh||!zoneConnected||dead)return;me.seq++;zoneCh.send({type:'broadcast',event:'move',payload:{id:SESSION_ID,name:me.name,color:me.color,x:Math.round(me.x),y:Math.round(me.y),dir:me.dir,hp:Math.round(me.hp),sanity:Math.round(me.sanity),zone:currentZone,seq:me.seq,attack:attackFlash,ward:Date.now()<fieldGraceUntil}})};
  const oldOnMove=onMove;
  onMove=function(p){oldOnMove(p);const r=p?.id&&remotes.get(p.id);if(r)r.ward=!!p.ward};

  updateMobs=function(dt){
    const actors=[me,...remotes.values()].filter(p=>p&&p.hp!==0&&campDist(p.x,p.y)>=CAMP.r&&!p.ward&&!(p.id===SESSION_ID&&Date.now()<fieldGraceUntil));
    for(let i=0;i<mobs.length;i++){
      let m=mobs[i];
      if(m.hp<=0){if(m.respawnAt&&Date.now()>=m.respawnAt){mobs[i]=freshMob(currentZone,i);m=mobs[i]}else continue}
      m.hitCd=Math.max(0,(m.hitCd||0)-dt);
      if(campDist(m.x,m.y)<CAMP.r+100){const a=Math.atan2(m.y-CAMP.y,m.x-CAMP.x);m.x=CAMP.x+Math.cos(a)*(CAMP.r+102);m.y=CAMP.y+Math.sin(a)*(CAMP.r+102)}
      let t=null,bd=1e9;for(const p of actors){const d=Math.hypot(m.x-p.x,m.y-p.y);if(d<bd){bd=d;t=p}}
      const starter=currentZone==='1:1',aggro=starter?330:410;
      if(t&&bd<aggro){
        const a=Math.atan2(t.y-m.y,t.x-m.x),base=m.kind==='crawler'?57:(m.kind==='cultist'?39:33),sp=starter?base*.88:base;
        const nx=m.x+Math.cos(a)*sp*dt,ny=m.y+Math.sin(a)*sp*dt;
        if(campDist(nx,ny)>CAMP.r+82){m.x=nx;m.y=ny}
        if(bd<(t.r||14)+18&&m.hitCd<=0){m.hitCd=m.kind==='crawler'?.9:1.15;applyMobDamage(t.id,m.kind)}
      }else{
        m.phase+=dt*.48;const nx=m.x+Math.cos(m.phase)*9*dt,ny=m.y+Math.sin(m.phase*.71)*9*dt;
        if(campDist(nx,ny)>CAMP.r+82){m.x=nx;m.y=ny}
      }
      const[zx,zy]=currentZone.split(':').map(Number);m.x=clamp(m.x,zx*WORLD.zone+20,(zx+1)*WORLD.zone-20);m.y=clamp(m.y,zy*WORLD.zone+20,(zy+1)*WORLD.zone-20);
    }
  };

  updateQuest=function(){
    if(inCamp()){
      if(!guideTalked)questText.textContent='Find Camp Guide by the fire · USE to talk.';
      else if(inventory.wood<4||inventory.stone<3)questText.textContent=`Starter supplies · wood ${inventory.wood}/4 · stone ${inventory.stone}/3`;
      else if(!inventory.knife)questText.textContent='Go southwest to the workbench · USE.';
      else if(!hasLeftCamp)questText.textContent='Prepared. Leave camp only when you choose.';
      else questText.textContent='Safe Camp · rest, chat, craft, prepare.';
    }else questText.textContent=fieldGraceUntil>Date.now()?'FIELD WARD ACTIVE · scout safely.':'Explore · gather · return before night.';
  };

  function blocked(){return !craftPanel.classList.contains('hidden')||!chatPanel.classList.contains('hidden')||(mapPanel&&!mapPanel.classList.contains('hidden'))}
  function newUse(e){
    e?.preventDefault();e?.stopImmediatePropagation();if(dead)return;stopJoy();
    if(inCamp()&&Math.hypot(me.x-GUIDE.x,me.y-GUIDE.y)<82){guideTalked=true;try{localStorage.setItem('abyssal_guide_v7','1')}catch{};toast('Guide: Gather supplies here, craft a knife, then leave when YOU are ready.');saveLocal();updateUI();return}
    if(inCamp()&&Math.hypot(me.x-CAMPFIRE.x,me.y-CAMPFIRE.y)<78){if(restCooldown>0){toast('The fire needs a moment.');return}restCooldown=18;me.hp=clamp(me.hp+24,0,100);me.sanity=clamp(me.sanity+34,0,100);toast('You rest beside the fire.');saveLocal();updateUI();return}
    let target=null,best=70;for(const r of resources){const until=harvested.get(r.id)||0;if(until>Date.now())continue;const d=distance(me,r);if(d<best){best=d;target=r}}
    if(target){inventory[target.type]++;const localCamp=target.id.startsWith('camp:'),until=Date.now()+(localCamp?12000:60000);harvested.set(target.id,until);if(!localCamp)zoneCh?.send({type:'broadcast',event:'harvest',payload:{zone:currentZone,rid:target.id,until}});toast(target.type==='shard'?'Cold light stains your hands.':`Collected ${target.type}`);saveLocal();updateUI();return}
    if(inCamp()&&Math.hypot(me.x-WORKBENCH.x,me.y-WORKBENCH.y)<125){craftPanel.classList.remove('hidden');return}
    toast(inCamp()?'Workbench is on the southwest side of camp.':'Nothing useful nearby.');
  }
  useBtn.addEventListener('click',newUse,true);
  for(const b of[attackBtn,dashBtn])b.addEventListener('pointerdown',e=>{if(blocked()){e.preventDefault();e.stopImmediatePropagation();stopJoy()}},true);
  chatToggle?.addEventListener('click',()=>stopJoy(),true);
  joystick?.addEventListener('pointerdown',e=>{if(blocked()){e.preventDefault();e.stopImmediatePropagation();stopJoy()}},true);

  setInterval(()=>{
    restCooldown=Math.max(0,restCooldown-.25);const now=Date.now();
    if(fieldGraceUntil>now&&fieldGraceUntil!==lastExtendedGrace&&fieldGraceUntil-now<15800){fieldGraceUntil+=5000;lastExtendedGrace=fieldGraceUntil}
    for(const[k,v]of harvested)if(v<=now)harvested.delete(k);
  },250);

  function phase(){const elapsed=(Date.now()-sessionStartedAt)/1000;if(elapsed<300)return{label:'☀ DAY',night:0};const p=(elapsed-300)%600;if(p<260)return{label:'☀ DAY',night:0};if(p<340)return{label:'◐ DUSK',night:(p-260)/80};if(p<500)return{label:'☾ NIGHT',night:1};return{label:'◑ DAWN',night:1-(p-500)/100}}
  nightLevel=function(){return phase().night};
  drawLighting=function(W,H){let n=nightLevel();if(inCamp())n=Math.min(n,.06);const insanity=1-me.sanity/100;if(n>0){ctx.fillStyle=`rgba(3,10,14,${n*.32})`;ctx.fillRect(0,0,W,H)}if(!inCamp()&&(n>.18||insanity>.32)){const radius=inventory.lantern?150:110,px=sx(me.x),py=sy(me.y),g=ctx.createRadialGradient(px,py,20,px,py,radius);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.62,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,4,7,${.22+n*.27})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}if(insanity>.35){ctx.fillStyle=`rgba(65,25,69,${insanity*.07})`;ctx.fillRect(0,0,W,H)}};

  function drawGuide(){const x=sx(GUIDE.x),y=sy(GUIDE.y);drawSprite(img.player,24,32,0,0,x,y,1.18);ctx.strokeStyle='#f0d57b';ctx.strokeRect(x-10,y-21,20,29);ctx.fillStyle='#fff0a7';ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillText('GUIDE',x,y-26);if(!guideTalked)ctx.fillText('!',x,y-37)}
  const oldDrawCamp=drawCamp;
  drawCamp=function(W,H){oldDrawCamp(W,H);if(currentZone==='1:1')drawGuide()};
  draw=function(){const W=canvas.width,H=canvas.height;ctx.clearRect(0,0,W,H);camera.x=lerp(camera.x,me.x,.10);camera.y=lerp(camera.y,me.y,.10);drawGround(W,H);drawCamp(W,H);drawResources(W,H);drawMobs(W,H);for(const p of remotes.values())drawPlayer(p,false);drawPlayer(me,true);drawLighting(W,H);requestAnimationFrame(draw)};

  function drawMap(){if(!mapCanvas||mapPanel?.classList.contains('hidden'))return;const c=mapCanvas.getContext('2d'),W=mapCanvas.width,H=mapCanvas.height;c.clearRect(0,0,W,H);c.fillStyle='#10201c';c.fillRect(0,0,W,H);for(let y=0;y<3;y++)for(let x=0;x<3;x++){const z=`${x}:${y}`,b=BIOMES[z];c.fillStyle=b?.[1]||'#35594c';c.fillRect(x*W/3+2,y*H/3+2,W/3-4,H/3-4);c.fillStyle='#dce7df';c.font='9px monospace';c.textAlign='center';c.fillText((b?.[0]||z).split(' ')[0],(x+.5)*W/3,(y+.5)*H/3)}c.fillStyle='#fff2a5';c.beginPath();c.arc(me.x/WORLD.w*W,me.y/WORLD.h*H,5,0,Math.PI*2);c.fill();for(const p of remotes.values()){c.fillStyle='#9ed6b5';c.fillRect(p.x/WORLD.w*W-2,p.y/WORLD.h*H-2,4,4)}c.strokeStyle='#b9d9bc';c.lineWidth=2;c.beginPath();c.arc(CAMP.x/WORLD.w*W,CAMP.y/WORLD.h*H,CAMP.r/WORLD.w*W,0,Math.PI*2);c.stroke()}
  mapToggle?.addEventListener('click',()=>{stopJoy();craftPanel.classList.add('hidden');chatPanel.classList.add('hidden');mapPanel.classList.toggle('hidden');drawMap()});
  mapClose?.addEventListener('click',()=>mapPanel.classList.add('hidden'));
  setInterval(()=>{if(dayBadge)dayBadge.textContent=phase().label;if(!mapPanel?.classList.contains('hidden'))drawMap()},500);
})();