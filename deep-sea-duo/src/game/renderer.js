import { WORLD } from './constants.js';
import { CORALS, JELLYFISH, currentAt, jellyPosition } from './environment.js';
import { POWERUPS } from './powerups.js';
import { powerupText, t } from '../i18n.js';

const viewState = { lowQuality: false, dpr: 1 };
const snap = value => Math.round(value);
const fract = value => value - Math.floor(value);
const seeded = seed => fract(Math.sin(seed * 91.731 + 17.13) * 43758.5453);

function qualityProfile() {
  const memory = Number(globalThis.navigator?.deviceMemory ?? 8);
  const saveData = Boolean(globalThis.navigator?.connection?.saveData);
  const reducedMotion = Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  const lowQuality = saveData || memory <= 3 || reducedMotion;
  return { lowQuality, maxDpr: lowQuality ? 1.15 : 1.75, pixelBudget: lowQuality ? 1_450_000 : 2_650_000 };
}

export function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect(); const profile = qualityProfile();
  const deviceRatio = Math.min(globalThis.devicePixelRatio || 1, profile.maxDpr);
  const pixels = Math.max(1, rect.width * rect.height * deviceRatio * deviceRatio);
  const budgetScale = Math.min(1, Math.sqrt(profile.pixelBudget / pixels));
  const ratio = Math.max(0.8, deviceRatio * budgetScale);
  canvas.width = Math.max(1, Math.round(rect.width * ratio)); canvas.height = Math.max(1, Math.round(rect.height * ratio));
  canvas.dataset.renderQuality = profile.lowQuality ? 'low' : 'high'; viewState.lowQuality = profile.lowQuality; viewState.dpr = ratio; return ratio;
}

function fillPixel(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(snap(x), snap(y), snap(w), snap(h)); }
function glow(ctx, color, blur) { ctx.shadowColor = color; ctx.shadowBlur = viewState.lowQuality ? Math.min(8, blur * 0.35) : blur; }

function drawBackdrop(ctx, time) {
  const bg = ctx.createLinearGradient(0, 0, WORLD.width, WORLD.height); bg.addColorStop(0, '#17165b'); bg.addColorStop(.32, '#071d4c'); bg.addColorStop(.7, '#041632'); bg.addColorStop(1, '#210c45'); ctx.fillStyle = bg; ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 5; i++) { const sway = Math.sin(time * .12 + i * 1.7) * 70; const x = 170 + i * 320 + sway; const beam = ctx.createLinearGradient(x, 0, x + 160, 820); beam.addColorStop(0, 'rgba(102,242,255,.10)'); beam.addColorStop(.68, 'rgba(105,154,255,.025)'); beam.addColorStop(1, 'rgba(90,73,255,0)'); ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(x - 55, 0); ctx.lineTo(x + 70, 0); ctx.lineTo(x + 240, 900); ctx.lineTo(x - 150, 900); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  const count = viewState.lowQuality ? 34 : 78;
  for (let i = 0; i < count; i++) { const depth = .35 + seeded(i + 4) * .9; const x = (seeded(i + 12) * WORLD.width + time * (5 + depth * 8)) % WORLD.width; const y = (seeded(i + 41) * WORLD.height + Math.sin(time * .22 + i) * 13 + WORLD.height) % WORLD.height; const size = 2 + Math.floor(seeded(i + 80) * 4); fillPixel(ctx, x, y, size, size, i % 3 ? 'rgba(139,246,255,.14)' : 'rgba(232,145,255,.13)'); }
  ctx.fillStyle = 'rgba(3,9,28,.46)'; ctx.fillRect(0, 790, WORLD.width, 110); for (let x = 0; x < WORLD.width; x += 20) { const h = 6 + Math.floor(seeded(x) * 18); fillPixel(ctx, x, 790 - h, 18, h, x % 60 ? '#081e3f' : '#10265b'); }
}

function drawCoral(ctx, coral, time, index) {
  ctx.save(); ctx.translate(snap(coral.x), snap(coral.y)); const pulse = .96 + Math.sin(time * 1.3 + index) * .035; ctx.scale(pulse, pulse); glow(ctx, '#ca72ff', 22);
  fillPixel(ctx, -coral.radius, 15, coral.radius * 2, 22, '#40226e'); fillPixel(ctx, -coral.radius * .72, -8, coral.radius * 1.44, 25, '#5f3096');
  const branch = Math.max(8, Math.round(coral.radius * .17)); const heights = [.62,.92,.74,.55,.82]; heights.forEach((height, i) => { const bx = (i - 2) * branch * 1.55; const bh = coral.radius * height; fillPixel(ctx, bx, -bh, branch, bh + 14, i % 2 ? '#b35cdb' : '#8a46c4'); fillPixel(ctx, bx + branch, -bh + 10, branch * .7, branch, '#e38cff'); if (i % 2 === 0) fillPixel(ctx, bx - branch * .7, -bh * .62, branch * .8, branch, '#d778f5'); });
  fillPixel(ctx, -coral.radius * .55, -8, coral.radius * 1.1, 6, 'rgba(242,182,255,.38)'); ctx.restore();
}

function drawJelly(ctx, jelly, gameTime, index) {
  const p = jellyPosition(jelly, gameTime); ctx.save(); ctx.translate(snap(p.x), snap(p.y)); ctx.translate(0, Math.sin(gameTime * 2.7 + index) * 3); glow(ctx, '#83fbff', 22); const r = snap(p.radius);
  fillPixel(ctx, -r + 6, -r * .55, (r - 6) * 2, r * .55, '#6ce8ed'); fillPixel(ctx, -r + 2, -6, (r - 2) * 2, 11, '#93faff'); fillPixel(ctx, -r * .62, -r * .78, r * 1.24, 7, '#c6ffff'); fillPixel(ctx, -8, -r * .76, 8, 5, '#ecffff'); ctx.shadowBlur = 0;
  for (let i = -2; i <= 2; i++) { const sway = snap(Math.sin(gameTime * 3.1 + i) * 5); fillPixel(ctx, i * 9, 5, 4, 18 + ((i + 2) % 2) * 7, '#77dbe7'); fillPixel(ctx, i * 9 + sway, 22, 4, 12, '#ba8df4'); } ctx.restore();
}

function drawCurrent(ctx, gameTime) {
  const current = currentAt(gameTime); ctx.save(); ctx.globalAlpha = .24; const horizontal = Math.abs(current.x) > Math.abs(current.y); const offset = (gameTime * 32) % 170;
  for (let x = -80; x < WORLD.width + 80; x += 180) for (let y = 110; y < WORLD.height; y += 200) { const px = horizontal ? x + offset : x; const py = horizontal ? y : y - offset; if (horizontal) { fillPixel(ctx, px, py, 45, 3, '#86f7ff'); fillPixel(ctx, px + 39, py - 5, 10, 3, '#86f7ff'); fillPixel(ctx, px + 39, py + 5, 10, 3, '#86f7ff'); } else { fillPixel(ctx, px, py, 3, 45, '#86f7ff'); fillPixel(ctx, px - 5, py, 3, 10, '#86f7ff'); fillPixel(ctx, px + 5, py, 3, 10, '#86f7ff'); } }
  ctx.restore();
}

function drawFood(ctx, food, gameTime) { ctx.save(); ctx.translate(snap(food.x), snap(food.y)); ctx.rotate(food.spin); const pulse = 1 + Math.sin(gameTime * 5 + food.spin) * .08; ctx.scale(pulse, pulse); glow(ctx, food.rare ? '#ffd5ff' : '#7dfff0', food.rare ? 28 : 16); const c = food.rare ? '#ffb9f5' : '#92ffe8'; fillPixel(ctx, -4, -food.radius, 8, food.radius * 2, c); fillPixel(ctx, -food.radius, -4, food.radius * 2, 8, c); fillPixel(ctx, -7, -7, 14, 14, '#f3ffff'); if (food.rare) { fillPixel(ctx, -food.radius - 4, -2, 5, 4, '#fff4ff'); fillPixel(ctx, food.radius - 1, -2, 5, 4, '#fff4ff'); } ctx.restore(); }
function drawPowerup(ctx, item) { const profile = POWERUPS[item.type]; ctx.save(); ctx.translate(snap(item.x), snap(item.y)); const pulse = Math.sin(item.pulse) * 4; glow(ctx, profile.color, 30); ctx.strokeStyle = profile.color; ctx.lineWidth = 4; ctx.setLineDash([8,5]); ctx.beginPath(); ctx.arc(0,0,item.radius+10+pulse,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]); fillPixel(ctx,-12,-12,24,24,profile.color); fillPixel(ctx,-6,-18,12,36,'#f1ffff'); fillPixel(ctx,-18,-6,36,12,'#f1ffff'); ctx.restore(); }
function drawBubble(ctx, bubble, gameTime) { ctx.save(); ctx.translate(snap(bubble.x), snap(bubble.y)); glow(ctx,'#5ff3ff',14); ctx.globalAlpha=.88; ctx.strokeStyle='#affcff'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,Math.max(4,bubble.radius),0,Math.PI*2); ctx.stroke(); fillPixel(ctx,-2,-bubble.radius*.62,4,4,'#ffffff'); const trail=viewState.lowQuality?1:3; const angle=Math.atan2(bubble.vy,bubble.vx); for(let i=1;i<=trail;i++){const d=10+i*8;const wobble=Math.sin(gameTime*13+i)*3;fillPixel(ctx,-Math.cos(angle)*d-2,-Math.sin(angle)*d+wobble-2,4,4,`rgba(105,237,255,${.36/i})`);} ctx.restore(); }

function drawTail(ctx, player, palette, gameTime) { const step=viewState.lowQuality?3:2; for(let i=player.tail.length-1;i>=0;i-=step){const part=player.tail[i];const t=i/Math.max(1,player.tail.length);const size=Math.max(5,(1-t)*17);const wiggle=Math.sin(gameTime*10-i*.65)*(2+t*3);fillPixel(ctx,part.x-size/2,part.y-size/2+wiggle,size,size,t>.55?palette.tailDark:palette.tail);} }
function drawSeaSnake(ctx, player, gameTime, palette) {
  drawTail(ctx,player,palette,gameTime); ctx.save(); ctx.globalAlpha=player.hp>0?1:.35; ctx.translate(snap(player.x),snap(player.y)); const angle=Math.atan2(player.aim?.y??0,player.aim?.x??1); ctx.rotate(angle); ctx.translate(0,Math.sin(gameTime*8)*1.5); glow(ctx,player.hurtTimer>0?'#ffffff':palette.glow,player.hurtTimer>0?32:24);
  if(player.dashTimer>0){ctx.globalAlpha*=.48;for(let i=1;i<=4;i++)fillPixel(ctx,-24-i*13,-12+i%2*5,18,18,palette.wake);ctx.globalAlpha=player.hp>0?1:.35;}
  fillPixel(ctx,-22,-15,36,30,player.hurtTimer>0?'#ffffff':palette.body); fillPixel(ctx,9,-11,19,22,player.hurtTimer>0?'#ffffff':palette.face); fillPixel(ctx,-15,-20,15,7,palette.highlight); fillPixel(ctx,-16,14,12,7,palette.shadow); fillPixel(ctx,-3,-5,7,7,palette.spot); fillPixel(ctx,14,-7,6,6,'#071735'); fillPixel(ctx,16,-6,2,2,'#ffffff'); if(gameTime%4.4>4.15) fillPixel(ctx,14,-7,7,2,palette.shadow); fillPixel(ctx,25,3,6,4,palette.mouth);
  if(player.shieldTimer>0||player.levelShieldTimer>0){ctx.shadowBlur=0;ctx.strokeStyle=player.levelShieldTimer>0?'#d9b8ff':'#b8ffff';ctx.lineWidth=4;ctx.setLineDash([6,5]);ctx.beginPath();ctx.arc(2,0,player.radius+16+Math.sin(gameTime*7)*2,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);} ctx.restore();
}

function drawEnemy(ctx, enemy, gameTime) {
  ctx.save();ctx.translate(snap(enemy.x),snap(enemy.y));const pulse=1+Math.sin(gameTime*6+enemy.x*.01)*.06;ctx.scale(pulse,pulse);glow(ctx,enemy.type==='dasher'?'#ff7dca':'#c576ff',enemy.hitFlash>0?30:18);const hit=enemy.hitFlash>0;
  if(enemy.type==='blocker'){const body=hit?'#ffffff':'#7759cb';fillPixel(ctx,-26,-19,52,38,body);fillPixel(ctx,-34,-11,10,10,'#a884ff');fillPixel(ctx,24,-11,10,10,'#a884ff');fillPixel(ctx,-19,18,9,10,'#513c96');fillPixel(ctx,10,18,9,10,'#513c96');fillPixel(ctx,-11,-7,7,7,'#171136');fillPixel(ctx,8,-7,7,7,'#171136');fillPixel(ctx,-4,5,8,4,'#ffd4ff');}
  else if(enemy.type==='dasher'){const body=hit?'#ffffff':'#ee72b8';fillPixel(ctx,-19,-15,38,30,body);fillPixel(ctx,17,-9,12,18,'#ff9fd1');for(let i=-2;i<=2;i++)fillPixel(ctx,i*8-2,-23+Math.abs(i)*2,5,9,'#ffb0dc');fillPixel(ctx,7,-6,6,6,'#25103a');fillPixel(ctx,10,-5,2,2,'#ffffff');if(enemy.dashTimer>0){ctx.globalAlpha=.55;fillPixel(ctx,-42,-8,18,5,'#ffd3f2');fillPixel(ctx,-50,4,25,5,'#ff8bd0');}}
  else {const body=hit?'#ffffff':'#a95cdc';fillPixel(ctx,-21,-14,35,28,body);fillPixel(ctx,11,-10,17,20,'#c777ef');fillPixel(ctx,-28,-8,10,16,'#7340a6');fillPixel(ctx,-14,-19,8,6,'#d996f6');fillPixel(ctx,15,-6,6,6,'#23103f');fillPixel(ctx,17,-5,2,2,'#ffffff');fillPixel(ctx,24,4,7,3,'#ffe6ff');}ctx.restore();
}

function drawBoss(ctx,boss,gameTime){ctx.save();ctx.translate(snap(boss.x),snap(boss.y));const facing=boss.dashDirection?.x<0?-1:1;ctx.scale(facing,1);glow(ctx,'#ff5fa5',boss.hitFlash>0?48:34);if(boss.phase==='charge'){ctx.strokeStyle='rgba(255,112,174,.88)';ctx.lineWidth=6;ctx.setLineDash([14,10]);ctx.beginPath();ctx.arc(0,0,boss.radius+28+Math.sin(gameTime*16)*5,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}const body=boss.hitFlash>0?'#ffffff':'#5d70d9';fillPixel(ctx,-72,-29,102,58,body);fillPixel(ctx,27,-21,43,42,'#7189ef');fillPixel(ctx,-94,-18,25,36,'#4756ad');fillPixel(ctx,-104,-8,15,16,'#39468d');fillPixel(ctx,-18,-48,24,20,'#6f7ee3');fillPixel(ctx,-14,28,28,19,'#4454a4');fillPixel(ctx,48,-12,8,8,'#081330');fillPixel(ctx,51,-10,3,3,'#ffffff');fillPixel(ctx,63,4,10,6,'#1a1638');const jaw=Math.sin(gameTime*8)>.1?8:3;fillPixel(ctx,43,14,27,7+jaw,'#eff6ff');for(let i=0;i<4;i++)fillPixel(ctx,46+i*6,14,3,7,'#ffeff7');ctx.restore();
  ctx.save();ctx.fillStyle='rgba(3,6,27,.76)';ctx.fillRect(WORLD.width/2-236,72,472,22);ctx.strokeStyle='rgba(184,202,255,.38)';ctx.lineWidth=2;ctx.strokeRect(WORLD.width/2-236,72,472,22);const ratio=Math.max(0,boss.hp/boss.maxHp);const hp=ctx.createLinearGradient(WORLD.width/2-230,0,WORLD.width/2+230,0);hp.addColorStop(0,'#ff66c4');hp.addColorStop(1,'#ff8a78');ctx.fillStyle=hp;ctx.fillRect(WORLD.width/2-230,78,460*ratio,10);ctx.fillStyle='#ffffff';ctx.font='700 17px ui-rounded, system-ui';ctx.textAlign='center';ctx.fillText(t('bossName'),WORLD.width/2,60);ctx.restore();}

function drawMessages(ctx,game){if(game.bossMessageTimer>0){ctx.save();ctx.globalAlpha=Math.min(1,game.bossMessageTimer);ctx.fillStyle='#ffe0f3';ctx.font='800 34px ui-rounded, system-ui';ctx.textAlign='center';ctx.shadowColor='#ff4d9d';ctx.shadowBlur=18;ctx.fillText(t('bossApproach'),WORLD.width/2,146);ctx.restore();}if(game.powerupMessageTimer>0&&game.powerupMessage){const type=Object.entries(POWERUPS).find(([,profile])=>profile.label===game.powerupMessage)?.[0];const label=type?powerupText(type):game.powerupMessage;ctx.save();ctx.globalAlpha=Math.min(1,game.powerupMessageTimer);ctx.fillStyle='#ccffff';ctx.font='700 25px ui-rounded, system-ui';ctx.textAlign='center';ctx.shadowColor='#57efff';ctx.shadowBlur=14;ctx.fillText(`✦ ${label} ✦`,WORLD.width/2,196);ctx.restore();}}
function drawGameOver(ctx,game){if(game.state!=='gameover')return;ctx.fillStyle='rgba(3,4,22,.76)';ctx.fillRect(0,0,WORLD.width,WORLD.height);ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.shadowColor='#7ff4ff';ctx.shadowBlur=18;ctx.font='800 54px ui-rounded, system-ui';ctx.fillText(t('gameOverTitle'),WORLD.width/2,WORLD.height/2-20);ctx.shadowBlur=0;ctx.fillStyle='#c8dcff';ctx.font='25px ui-rounded, system-ui';ctx.fillText(`${t('survived',{seconds:Math.floor(game.time)})} · ${t('restart')}`,WORLD.width/2,WORLD.height/2+38);}

export function render(ctx,game){const canvas=ctx.canvas;const sx=canvas.width/WORLD.width;const sy=canvas.height/WORLD.height;const scale=Math.min(sx,sy);const ox=(canvas.width-WORLD.width*scale)/2;const oy=(canvas.height-WORLD.height*scale)/2;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#020617';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);drawBackdrop(ctx,game.time);CORALS.forEach((coral,index)=>drawCoral(ctx,coral,game.time,index));JELLYFISH.forEach((jelly,index)=>drawJelly(ctx,jelly,game.time,index));drawCurrent(ctx,game.time);for(const food of game.food)drawFood(ctx,food,game.time);if(game.powerup)drawPowerup(ctx,game.powerup);for(const bubble of game.bubbles)drawBubble(ctx,bubble,game.time);for(const enemy of game.enemies)drawEnemy(ctx,enemy,game.time);if(game.boss)drawBoss(ctx,game.boss,game.time);drawSeaSnake(ctx,game.player,game.time,{body:'#3be7e6',face:'#73fbf1',tail:'#2fd0e5',tailDark:'#3a78ca',highlight:'#b8fff8',shadow:'#197eab',spot:'#7958d8',mouth:'#153a72',glow:'#49f8ff',wake:'#78f7ff'});drawSeaSnake(ctx,game.remotePlayer,game.time+.45,{body:'#ae78f2',face:'#d6a5ff',tail:'#9564e7',tailDark:'#5b4cb6',highlight:'#f3d8ff',shadow:'#6541ad',spot:'#ff7bc5',mouth:'#321653',glow:'#cf83ff',wake:'#e09aff'});drawMessages(ctx,game);drawGameOver(ctx,game);ctx.restore();}
