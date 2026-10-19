(()=>{
  'use strict';

  const CONTENT = window.ABYSSAL_CONTENT_V9;
  const GAMEPLAY = window.ABYSSAL_GAMEPLAY_V9;
  if(!CONTENT || !GAMEPLAY){
    console.error('[Abyssal V9 render] content/gameplay modules must load first');
    return;
  }

  const particles = [];
  let particleClock = 0;

  function visible(x, y, pad=60){
    const px = sx(x);
    const py = sy(y);
    return px >= -pad && py >= -pad && px <= canvas.width + pad && py <= canvas.height + pad;
  }

  function drawShadow(x, y, radius=10, alpha=.22){
    const px = sx(x);
    const py = sy(y);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#06100d';
    ctx.beginPath();
    ctx.ellipse(px, py + 10, radius, Math.max(3, radius * .35), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function spawnParticle(x, y, kind){
    if(particles.length >= 36) particles.shift();
    const angle = Math.random() * Math.PI * 2;
    const speed = kind === 'ember' ? 8 + Math.random() * 11 : 3 + Math.random() * 6;
    particles.push({
      x, y, kind,
      vx: Math.cos(angle) * speed * .35,
      vy: kind === 'ember' ? -(8 + Math.random() * 12) : Math.sin(angle) * speed,
      life: 1,
      size: kind === 'ember' ? 1 + Math.random() * 1.4 : 1,
      drift: Math.random() * Math.PI * 2
    });
  }

  function updateParticles(dt){
    particleClock += dt;
    if(currentZone === '1:1' && visible(CAMP.x, CAMP.y, 120) && particleClock >= .16){
      particleClock = 0;
      spawnParticle(CAMP.x + (Math.random() - .5) * 12, CAMP.y - 8, 'ember');
    }

    if(particles.length < 26 && Math.random() < dt * 4){
      spawnParticle(
        camera.x + (Math.random() - .5) * canvas.width,
        camera.y + (Math.random() - .5) * canvas.height,
        'mote'
      );
    }

    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.life -= dt * (p.kind === 'ember' ? .72 : .22);
      p.drift += dt * 1.8;
      p.x += p.vx * dt + Math.sin(p.drift) * dt * 2;
      p.y += p.vy * dt;
      if(p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles(){
    ctx.save();
    for(const p of particles){
      const x = sx(p.x);
      const y = sy(p.y);
      if(x < -10 || y < -10 || x > canvas.width + 10 || y > canvas.height + 10) continue;
      ctx.globalAlpha = clamp(p.life, 0, 1) * (p.kind === 'ember' ? .85 : .22);
      ctx.fillStyle = p.kind === 'ember' ? '#ffd279' : '#d8e4c6';
      ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(p.size)), Math.max(1, Math.round(p.size)));
    }
    ctx.restore();
  }

  function drawLandmark(landmark){
    if(landmark.zone !== currentZone || !visible(landmark.x, landmark.y, 80)) return;
    const x = sx(landmark.x);
    const y = sy(landmark.y);

    ctx.save();
    if(landmark.type === 'ruin'){
      ctx.fillStyle = '#63736d';
      ctx.fillRect(x-13, y-17, 7, 29);
      ctx.fillRect(x+6, y-17, 7, 29);
      ctx.fillStyle = '#839088';
      ctx.fillRect(x-13, y-20, 26, 6);
      ctx.fillStyle = '#243a34';
      ctx.fillRect(x-2, y-9, 4, 16);
    }else if(landmark.type === 'idol'){
      ctx.fillStyle = '#475e58';
      ctx.fillRect(x-8, y-17, 16, 29);
      ctx.fillStyle = '#89a08f';
      ctx.fillRect(x-4, y-12, 8, 6);
      ctx.fillStyle = '#3b1f31';
      ctx.fillRect(x-2, y-10, 4, 3);
      ctx.fillStyle = '#314840';
      ctx.fillRect(x-12, y+10, 24, 5);
    }else if(landmark.type === 'pier'){
      ctx.fillStyle = '#755a3c';
      ctx.fillRect(x-18, y-4, 36, 8);
      ctx.fillStyle = '#4f3e2b';
      ctx.fillRect(x-15, y+4, 4, 13);
      ctx.fillRect(x+11, y+4, 4, 13);
    }else if(landmark.type === 'ward'){
      ctx.strokeStyle = '#b9d5ae';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#d8efc4';
      ctx.fillRect(x-1, y-8, 3, 16);
      ctx.fillRect(x-6, y-1, 13, 3);
    }

    if(!['camp','workbench'].includes(landmark.type)){
      ctx.fillStyle = '#dfe8dc';
      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(landmark.label, x, y-25);
    }
    ctx.restore();
  }

  function drawCampGlow(){
    if(currentZone !== '1:1' || !visible(CAMP.x, CAMP.y, 150)) return;
    const x = sx(CAMP.x);
    const y = sy(CAMP.y);
    const gradient = ctx.createRadialGradient(x, y, 10, x, y, 95);
    gradient.addColorStop(0, 'rgba(255,210,112,.18)');
    gradient.addColorStop(.45, 'rgba(255,189,87,.08)');
    gradient.addColorStop(1, 'rgba(255,189,87,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x-95, y-95, 190, 190);
  }

  function drawReadyIndicator(player, self=false){
    const meta = self ? GAMEPLAY.getLocalState() : CONTENT.remoteReady.get(player.id);
    const ready = self ? CONTENT.ready : !!meta?.ready;
    if(!ready) return;

    const x = sx(player.x);
    const y = sy(player.y);
    const pulse = 1 + Math.sin(performance.now()/220 + (self ? 0 : player.id.length)) * .08;

    ctx.save();
    ctx.strokeStyle = '#b7e8b8';
    ctx.globalAlpha = .75;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y+11, 14*pulse, 6*pulse, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#d7f4d4';
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('READY', x, y-33);
    ctx.restore();
  }

  function drawThreatVignette(){
    if(inCamp()) return;
    const score = GAMEPLAY.getThreatScore();
    if(score < 40) return;

    const alpha = clamp((score - 40) / 60, 0, 1) * .16;
    const w = canvas.width;
    const h = canvas.height;
    const gradient = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)*.25, w/2, h/2, Math.max(w,h)*.68);
    gradient.addColorStop(0, 'rgba(46,12,22,0)');
    gradient.addColorStop(1, `rgba(46,12,22,${alpha})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,w,h);
  }

  let lastFrame = performance.now();

  draw = function(){
    const now = performance.now();
    const dt = clamp((now - lastFrame) / 1000, 0, .05);
    lastFrame = now;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0,0,W,H);
    camera.x = lerp(camera.x, me.x, .10);
    camera.y = lerp(camera.y, me.y, .10);

    updateParticles(dt);
    drawGround(W,H);

    for(const landmark of CONTENT.landmarks) drawLandmark(landmark);

    drawCamp(W,H);
    drawCampGlow();
    drawResources(W,H);
    drawMobs(W,H);

    for(const remote of remotes.values()){
      drawShadow(remote.x, remote.y, 10, .20);
      drawPlayer(remote, false);
      drawReadyIndicator(remote, false);
    }

    drawShadow(me.x, me.y, 10, .24);
    drawPlayer(me, true);
    drawReadyIndicator(me, true);

    drawParticles();
    drawLighting(W,H);
    drawThreatVignette();

    requestAnimationFrame(draw);
  };
})();
