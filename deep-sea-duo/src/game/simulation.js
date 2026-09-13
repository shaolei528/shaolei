import { CONFIG, UPGRADES, WORLD } from './constants.js';
import { clamp, circlesTouch, normalize, randomRange } from './math.js';
import { createBubble, createEnemy, createFood, createPlayer } from './entities.js';
import { chooseEnemyType, stepEnemy } from './enemies.js';
import { CORALS, currentAt, keepOutOfCoral, touchesJellyfish } from './environment.js';
import { BOSS, bossRewardPositions, createSharkBoss, stepSharkBoss } from './boss.js';
import { applyPowerup, choosePowerup, createPowerup } from './powerups.js';

export function createGame(random = Math.random) {
  const player = createPlayer(); const remotePlayer = createPlayer(); remotePlayer.id = 'player-2'; remotePlayer.x = 1050; remotePlayer.y = 500;
  return { player, remotePlayer, enemies: [], bubbles: [], food: [], time: 0, spawnClock: 0.8, random, state: 'playing', lastShot: 0, remoteLastShot: 0, remoteInputAge: 99, lastRemoteInputSequence: -1, boss: null, nextBossAt: BOSS.firstSpawnAt, bossCount: 0, bossMessageTimer: 0, powerup: null, nextPowerupAt: 28, powerupMessage: '', powerupMessageTimer: 0 };
}

export function applyRemoteInput(game, input) { if (Number.isFinite(input.sequence) && input.sequence <= game.lastRemoteInputSequence) return false; game.lastRemoteInputSequence = input.sequence ?? game.lastRemoteInputSequence; game.remoteInputAge = 0; const p = game.remotePlayer; p.movement = input.movement ?? {x:0,y:0}; if (input.aim?.x || input.aim?.y) p.aim = normalize(input.aim.x, input.aim.y); p.firing = Boolean(input.firing); p.dashRequested ||= Boolean(input.dash); return true; }
export function applyHostSnapshot(game, snapshot) {
  if (!Number.isFinite(snapshot.tick) || snapshot.tick <= (game.lastSnapshotTick ?? -1)) return false;
  game.lastSnapshotTick = snapshot.tick;
  const [host, guest] = snapshot.players ?? [];
  if (host) Object.assign(game.player, host); if (guest) Object.assign(game.remotePlayer, guest);
  for (const key of ['time', 'state', 'enemies', 'bubbles', 'food', 'boss', 'powerup', 'bossMessageTimer', 'powerupMessage', 'powerupMessageTimer']) if (key in snapshot) game[key] = snapshot[key];
  return true;
}

export function getUpgradeChoices(random = Math.random) {
  const pool = [...UPGRADES]; const choices = [];
  while (choices.length < 3 && pool.length) choices.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  return choices;
}

function spawnEnemy(game) {
  const edge = Math.floor(game.random() * 4); const pad = 60;
  const x = edge < 2 ? randomRange(0, WORLD.width, game.random) : (edge === 2 ? -pad : WORLD.width + pad);
  const y = edge >= 2 ? randomRange(0, WORLD.height, game.random) : (edge === 0 ? -pad : WORLD.height + pad);
  const type = chooseEnemyType(game.random, game.time);
  game.enemies.push(createEnemy(x, y, Math.floor(game.time / 25) + 1, type));
}

function movePlayer(player, dt) {
  const moving = normalize(player.movement.x, player.movement.y);
  const dashing = player.dashTimer > 0;
  const speed = dashing ? CONFIG.player.dashSpeed : player.speed * (player.levelShieldTimer > 0 ? 0.6 : 1);
  player.x = clamp(player.x + moving.x * speed * dt, player.radius, WORLD.width - player.radius);
  player.y = clamp(player.y + moving.y * speed * dt, player.radius, WORLD.height - player.radius);
  player.tail.unshift({ x: player.x, y: player.y }); player.tail.length = Math.min(14 + player.level * 2, 44);
}

function hurt(player) {
  if (player.hurtTimer > 0 || player.dashTimer > 0 || player.levelShieldTimer > 0 || player.shieldTimer > 0) return;
  player.hp -= 1; player.hurtTimer = CONFIG.player.contactInvulnerability;
  if (player.hp <= 0) player.hp = 0;
}

function gainXp(player, xp = CONFIG.food.xp) {
  const p = player; p.xp += xp; p.score += 10 * xp;
  if (p.xp >= p.nextLevelXp) { p.xp -= p.nextLevelXp; p.level += 1; p.nextLevelXp = Math.ceil(p.nextLevelXp * CONFIG.level.growth); p.pendingLevel = true; p.levelShieldTimer = 3; }
}

export function chooseUpgrade(game, upgrade) { upgrade.apply(game.player); game.player.pendingLevel = false; }
export function chooseRemoteUpgrade(game, upgrade) { if (!upgrade || !game.remotePlayer.pendingLevel) return false; upgrade.apply(game.remotePlayer); game.remotePlayer.pendingLevel = false; return true; }

export function requestDash(game) {
  const p = game.player; requestPlayerDash(p);
}
function requestPlayerDash(p) {
  if (p.dashReady <= 0 && (p.movement.x || p.movement.y)) { p.dashTimer = CONFIG.player.dashDuration; p.dashReady = p.dashCooldown; }
}

function nearestLivingPlayer(game, entity) { const living = [game.player, game.remotePlayer].filter(p => p.hp > 0); return living.sort((a, b) => (a.x-entity.x)**2+(a.y-entity.y)**2-((b.x-entity.x)**2+(b.y-entity.y)**2))[0] ?? game.player; }
function pushPlayersApart(a, b) { if (a.hp <= 0 || b.hp <= 0 || !circlesTouch(a, b)) return; const direction = normalize(b.x-a.x, b.y-a.y); b.x += direction.x * 5; b.y += direction.y * 5; a.x -= direction.x * 5; a.y -= direction.y * 5; }

function spawnBossIfDue(game) {
  if (!game.boss && game.time >= game.nextBossAt) { game.boss = createSharkBoss(); game.bossCount += 1; game.bossMessageTimer = 2.6; }
}

function defeatBoss(game) {
  for (const point of bossRewardPositions(game.boss)) game.food.push(createFood(point.x, point.y, 3));
  game.player.score += 250; game.boss = null;
  game.nextBossAt = game.time + randomRange(135, 210, game.random);
}
function spawnPowerupIfDue(game) { if (!game.powerup && game.time >= game.nextPowerupAt) game.powerup = createPowerup(choosePowerup(game.random), game.random); }

export function step(game, input, dt) {
  if (game.state !== 'playing') return game;
  const p = game.player, r = game.remotePlayer; game.time += dt; game.lastShot -= dt; game.remoteLastShot -= dt; game.remoteInputAge += dt; if (game.remoteInputAge > .4) { r.movement = {x:0,y:0}; r.firing = false; } for (const player of [p,r]) { player.hurtTimer -= dt; player.dashTimer -= dt; player.dashReady -= dt; player.levelShieldTimer -= dt; player.shieldTimer -= dt; } game.bossMessageTimer -= dt; game.powerupMessageTimer -= dt;
  p.movement = input.movement;
  if (input.aim.x || input.aim.y) p.aim = normalize(input.aim.x, input.aim.y);
  if (p.hp > 0) movePlayer(p, dt); if (r.hp > 0) movePlayer(r, dt); pushPlayersApart(p, r);
  const current = currentAt(game.time); for (const player of [p,r]) { player.x = clamp(player.x + current.x * dt, player.radius, WORLD.width-player.radius); player.y = clamp(player.y + current.y * dt, player.radius, WORLD.height-player.radius); keepOutOfCoral(player); if (touchesJellyfish(player, game.time)) hurt(player); }
  if (input.dash) requestDash(game);
  if (r.dashRequested) { requestPlayerDash(r); r.dashRequested = false; }
  if (input.firing && game.lastShot <= 0 && !p.pendingLevel) { game.bubbles.push(createBubble(p)); game.lastShot = p.fireInterval; }
  if (r.firing && game.remoteLastShot <= 0 && !r.pendingLevel && r.hp > 0) { game.bubbles.push(createBubble(r)); game.remoteLastShot = r.fireInterval; }
  spawnBossIfDue(game);
  spawnPowerupIfDue(game);
  game.spawnClock -= dt;
  if (game.spawnClock <= 0 && game.enemies.length < CONFIG.enemy.maxAlive) { spawnEnemy(game); game.spawnClock = Math.max(0.38, CONFIG.enemy.spawnEvery - game.time * 0.009); }
  for (const enemy of game.enemies) { stepEnemy(enemy, nearestLivingPlayer(game, enemy), dt); keepOutOfCoral(enemy); enemy.hitFlash -= dt; for (const player of [p,r]) if (circlesTouch(enemy, player)) hurt(player); }
  if (game.boss) { stepSharkBoss(game.boss, nearestLivingPlayer(game, game.boss), dt); if (game.boss.phase !== 'arriving') for (const player of [p,r]) if (circlesTouch(game.boss, player)) hurt(player); }
  for (const bubble of game.bubbles) { bubble.x += bubble.vx * dt; bubble.y += bubble.vy * dt; const teammate = bubble.ownerId === p.id ? r : p; if (bubble.life > 0 && circlesTouch(bubble, teammate)) { const push = normalize(bubble.vx, bubble.vy); teammate.x += push.x * 18; teammate.y += push.y * 18; bubble.life = 0; } for (const enemy of game.enemies) if (bubble.life > 0 && circlesTouch(bubble, enemy)) { enemy.hp -= bubble.damage; enemy.hitFlash = 0.1; bubble.life = 0; } if (game.boss && bubble.life > 0 && circlesTouch(bubble, game.boss)) { game.boss.hp -= bubble.damage; game.boss.hitFlash = 0.1; bubble.life = 0; } bubble.life -= dt; }
  const dead = game.enemies.filter(enemy => enemy.hp <= 0); for (const enemy of dead) game.food.push(createFood(enemy.x, enemy.y));
  game.enemies = game.enemies.filter(enemy => enemy.hp > 0); game.bubbles = game.bubbles.filter(b => b.life > 0 && b.x > -40 && b.x < WORLD.width + 40 && b.y > -40 && b.y < WORLD.height + 40);
  if (game.boss?.hp <= 0) defeatBoss(game);
  for (const food of game.food) { food.life -= dt; food.spin += dt * 4; for (const player of [p,r]) if (food.life > 0 && circlesTouch(food, player)) { food.life = -1; gainXp(player, food.xp); } }
  game.food = game.food.filter(item => item.life > 0);
  if (game.powerup) { game.powerup.life -= dt; game.powerup.pulse += dt * 5; const collector = [p,r].find(player => circlesTouch(game.powerup, player)); if (collector) { applyPowerup(game, game.powerup, collector); game.powerup = null; game.nextPowerupAt = game.time + randomRange(26, 46, game.random); } else if (game.powerup.life <= 0) { game.powerup = null; game.nextPowerupAt = game.time + 12; } }
  if (p.hp <= 0 && r.hp <= 0) game.state = 'gameover';
  return game;
}
