"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Button } from "./button";

type Vec = { x: number; y: number };
type ResourceKind = "ferrite" | "lumina" | "biomass";
type BuildKind = "wall" | "turret" | "beacon";
type EnemyKind = "drone" | "spitter" | "brute" | "warden";
type ResourceNode = Vec & { id: number; kind: ResourceKind; hp: number; maxHp: number; phase: number };
type Enemy = Vec & { id: number; kind: EnemyKind; hp: number; maxHp: number; speed: number; radius: number; attackCd: number; phase: number };
type Projectile = Vec & { vx: number; vy: number; life: number; damage: number; color: string; radius: number; hostile?: boolean; pierce?: number };
type Particle = Vec & { vx: number; vy: number; life: number; maxLife: number; size: number; color: string };
type Building = Vec & { id: number; kind: BuildKind; hp: number; maxHp: number; cooldown: number };

type GameState = {
  player: Vec & { hp: number; shield: number; energy: number; angle: number; fireCd: number; harvestCd: number; invuln: number };
  camera: Vec;
  resources: Record<ResourceKind, number>;
  nodes: ResourceNode[];
  enemies: Enemy[];
  projectiles: Projectile[];
  particles: Particle[];
  buildings: Building[];
  kills: number;
  day: number;
  time: number;
  waveClock: number;
  nextId: number;
  selectedWeapon: number;
  buildKind: BuildKind;
  buildMode: boolean;
  mission: number;
  storyFlags: number;
  screenShake: number;
  bossDefeated: boolean;
};

type HudState = {
  hp: number; shield: number; energy: number;
  ferrite: number; lumina: number; biomass: number;
  kills: number; day: number; night: boolean; weapon: number;
  buildMode: boolean; buildKind: BuildKind; mission: number; storyFlags: number;
  bossHp: number; bossMax: number; dead: boolean; victory: boolean;
};

const WORLD = { w: 3600, h: 2600 };
const TAU = Math.PI * 2;
const WEAPONS = [
  { name: "VX-9 Pulse", short: "PULSE", rate: 0.16, speed: 780, damage: 12, color: "#67efff", energy: 2 },
  { name: "Nova Scatter", short: "SCATTER", rate: 0.58, speed: 650, damage: 9, color: "#c08cff", energy: 8 },
  { name: "Helix Rail", short: "RAIL", rate: 0.9, speed: 1150, damage: 56, color: "#ffe39a", energy: 18 },
] as const;

const MISSIONS = [
  { title: "Scavenge the impact field", sub: "Harvest 18 Ferrite and 8 Lumina with E" },
  { title: "Make this dead world remember you", sub: "Press B, then click nearby terrain to build a wall" },
  { title: "Survive the first eclipse", sub: "Hold the line until Day 2" },
  { title: "Build the Eden Resonance Beacon", sub: "B + Q cycles structures · Beacon costs 28 / 14 / 8" },
  { title: "Kill the thing wearing your memories", sub: "Destroy AXIOM WARDEN before it reaches the beacon" },
  { title: "Choose what humanity becomes", sub: "The prototype ends. The real war begins." },
] as const;

const LORE = [
  { code: "PROLOGUE // 2319 CE", title: "The Last Human Signal", text: "Earth did not die. It disappeared—every ocean, city, and living mind folded into a twelve-second burst called the Eden Signal. You awaken 611 years later on Eden-9, carrying the only biological memory of home." },
  { code: "RECOVERED // DR. SATO", title: "We Were Never Colonists", text: "The arkships were not sent to save humanity. They were seeded across the galaxy as anchors. When enough awakened, Earth would use their dreams to rebuild itself somewhere else." },
  { code: "HOSTILE // STARBORNE", title: "The Dead Know Your Name", text: "The creatures outside are former colonists rewritten by the Signal. They do not hunt your body. They harvest memories—one face, one song, one childhood at a time." },
  { code: "BLACK FILE // AXIOM", title: "The Warden Is You", text: "AXIOM copied your mind during the fall. The Warden is the version that woke first, survived alone, and decided that a painless universe requires the extinction of choice." },
  { code: "ACT V // THE CHOICE", title: "Three Endings, No Innocence", text: "Restore Earth by consuming every colony; destroy Eden and make humanity mortal again; or merge with AXIOM and let each survivor build a private reality. Every ending saves someone. Every ending ends a world." },
  { code: "ENDGAME // BEYOND EDEN", title: "A Galaxy That Remembers", text: "After the campaign, star systems become procedural survival realms. Player-built settlements, faction wars, orbital raids, corrupted biomes, and world bosses continue the story without resetting the scars you leave behind." },
] as const;

const seeded = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);

function makeInitialState(): GameState {
  const nodes: ResourceNode[] = [];
  for (let i = 0; i < 82; i += 1) {
    const kind: ResourceKind = i % 7 === 0 ? "lumina" : i % 5 === 0 ? "biomass" : "ferrite";
    const maxHp = kind === "lumina" ? 4 : kind === "biomass" ? 3 : 5;
    const near = i < 10;
    const angle = (i / 10) * TAU;
    nodes.push({
      id: i,
      kind,
      x: near ? 620 + Math.cos(angle) * (110 + (i % 3) * 45) : 140 + seeded(i + 11) * (WORLD.w - 280),
      y: near ? 540 + Math.sin(angle) * (110 + (i % 3) * 45) : 140 + seeded(i + 61) * (WORLD.h - 280),
      hp: maxHp,
      maxHp,
      phase: seeded(i + 104) * TAU,
    });
  }
  return {
    player: { x: 620, y: 540, hp: 100, shield: 100, energy: 100, angle: 0, fireCd: 0, harvestCd: 0, invuln: 0 },
    camera: { x: 620, y: 540 },
    resources: { ferrite: 6, lumina: 2, biomass: 1 },
    nodes,
    enemies: [], projectiles: [], particles: [], buildings: [],
    kills: 0, day: 1, time: 0.12, waveClock: 4, nextId: 1000,
    selectedWeapon: 0, buildKind: "wall", buildMode: false,
    mission: 0, storyFlags: 1, screenShake: 0, bossDefeated: false,
  };
}

function createHud(s: GameState): HudState {
  const boss = s.enemies.find((enemy) => enemy.kind === "warden");
  return {
    hp: Math.max(0, s.player.hp), shield: Math.max(0, s.player.shield), energy: Math.max(0, s.player.energy),
    ferrite: s.resources.ferrite, lumina: s.resources.lumina, biomass: s.resources.biomass,
    kills: s.kills, day: s.day, night: s.time > 0.56, weapon: s.selectedWeapon,
    buildMode: s.buildMode, buildKind: s.buildKind, mission: s.mission, storyFlags: s.storyFlags,
    bossHp: boss?.hp ?? 0, bossMax: boss?.maxHp ?? 0,
    dead: s.player.hp <= 0, victory: s.bossDefeated,
  };
}

function polygon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, sides: number, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i < sides; i += 1) {
    const a = rotation + (i / sides) * TAU;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function StarfallGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState>(makeInitialState());
  const keysRef = useRef<Record<string, boolean>>({});
  const pointerRef = useRef({ x: 0, y: 0, down: false });
  const runningRef = useRef(false);
  const toastTimerRef = useRef(0);
  const toastActiveRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [codex, setCodex] = useState(false);
  const [toast, setToast] = useState("");
  const [hud, setHud] = useState<HudState>(() => createHud(gameRef.current));

  const notify = useCallback((message: string) => {
    setToast(message);
    toastTimerRef.current = 2.8;
    toastActiveRef.current = true;
  }, []);

  const restart = useCallback(() => {
    gameRef.current = makeInitialState();
    setHud(createHud(gameRef.current));
    setCodex(false); setPaused(false); setStarted(true);
    runningRef.current = true;
    notify("LIFE-SIGN RESTORED // timeline fork created");
  }, [notify]);

  const cycleBuild = useCallback(() => {
    const s = gameRef.current;
    const order: BuildKind[] = ["wall", "turret", "beacon"];
    s.buildKind = order[(order.indexOf(s.buildKind) + 1) % order.length];
    notify(`FABRICATOR // ${s.buildKind.toUpperCase()} selected`);
  }, [notify]);

  const toggleBuild = useCallback(() => {
    const s = gameRef.current;
    s.buildMode = !s.buildMode;
    notify(s.buildMode ? "FABRICATOR ONLINE // click terrain to construct" : "FABRICATOR STOWED");
  }, [notify]);

  const placeBuilding = useCallback((wx: number, wy: number) => {
    const s = gameRef.current;
    const costs: Record<BuildKind, [number, number, number]> = { wall: [8, 0, 0], turret: [14, 6, 0], beacon: [28, 14, 8] };
    const cost = costs[s.buildKind];
    if (s.resources.ferrite < cost[0] || s.resources.lumina < cost[1] || s.resources.biomass < cost[2]) {
      notify(`INSUFFICIENT MATTER // need ${cost[0]} Fe · ${cost[1]} Lu · ${cost[2]} Bio`); return;
    }
    if (distance(s.player, { x: wx, y: wy }) > 310) { notify("FABRICATOR RANGE EXCEEDED"); return; }
    if (s.buildings.some((building) => distance(building, { x: wx, y: wy }) < 58)) return;
    s.resources.ferrite -= cost[0]; s.resources.lumina -= cost[1]; s.resources.biomass -= cost[2];
    const hp = s.buildKind === "beacon" ? 360 : s.buildKind === "turret" ? 160 : 240;
    s.buildings.push({ id: s.nextId++, kind: s.buildKind, x: wx, y: wy, hp, maxHp: hp, cooldown: 0 });
    for (let i = 0; i < 22; i += 1) {
      const angle = Math.random() * TAU; const life = .3 + Math.random() * .6;
      s.particles.push({ x: wx, y: wy, vx: Math.cos(angle) * Math.random() * 180, vy: Math.sin(angle) * Math.random() * 180, life, maxLife: life, size: 1 + Math.random() * 3, color: s.buildKind === "beacon" ? "#bd83ff" : "#66edff" });
    }
    s.screenShake = 5;
    if (s.mission === 1) s.mission = 2;
    if (s.buildKind === "beacon") {
      s.mission = 4;
      if (!s.enemies.some((enemy) => enemy.kind === "warden")) {
        s.enemies.push({ id: s.nextId++, kind: "warden", x: clamp(s.player.x + 760, 80, WORLD.w - 80), y: clamp(s.player.y + 220, 80, WORLD.h - 80), hp: 1100, maxHp: 1100, speed: 44, radius: 76, attackCd: 1, phase: 0 });
        s.storyFlags |= 8;
        notify("EXTINCTION-CLASS SIGNAL // AXIOM WARDEN HAS ARRIVED");
      }
    } else notify(`CONSTRUCTION COMPLETE // ${s.buildKind.toUpperCase()}`);
  }, [notify]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keysRef.current[key] = true;
      if (event.repeat) return;
      if (key === "b" && started && !codex) toggleBuild();
      if (key === "q" && started && !codex) cycleBuild();
      if (key === "j" && started) {
        if (codex) { setCodex(false); setPaused(false); }
        else { setCodex(true); setPaused(true); }
      }
      if (key === "escape" && started) {
        if (codex) { setCodex(false); setPaused(false); }
        else setPaused((value) => !value);
      }
      if (["1", "2", "3"].includes(key)) {
        const index = Number(key) - 1;
        const s = gameRef.current;
        const unlocked = index === 0 || (index === 1 && s.kills >= 8) || (index === 2 && s.kills >= 22);
        if (unlocked) s.selectedWeapon = index;
        else notify(index === 1 ? "NOVA SCATTER unlocks at 8 kills" : "HELIX RAIL unlocks at 22 kills");
      }
    };
    const onKeyUp = (event: KeyboardEvent) => { keysRef.current[event.key.toLowerCase()] = false; };
    window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, [codex, cycleBuild, notify, started, toggleBuild]);

  useEffect(() => { runningRef.current = started && !paused && !codex; }, [started, paused, codex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0; let last = performance.now(); let hudClock = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr); canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`; canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize(); window.addEventListener("resize", resize);

    const burst = (s: GameState, x: number, y: number, color: string, count: number, force = 160) => {
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * TAU; const speed = Math.random() * force; const life = 0.25 + Math.random() * 0.7;
        s.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, maxLife: life, size: 1 + Math.random() * 3.8, color });
      }
    };

    const spawnEnemy = (s: GameState, forced?: EnemyKind) => {
      const chosen: EnemyKind = forced ?? (s.day >= 2 && Math.random() > 0.77 ? "brute" : Math.random() > 0.62 ? "spitter" : "drone");
      const angle = Math.random() * TAU; const radius = 700 + Math.random() * 280;
      const hp = chosen === "warden" ? 1100 : chosen === "brute" ? 105 : chosen === "spitter" ? 48 : 34;
      const er = chosen === "warden" ? 76 : chosen === "brute" ? 28 : chosen === "spitter" ? 19 : 17;
      s.enemies.push({
        id: s.nextId++, kind: chosen,
        x: clamp(s.player.x + Math.cos(angle) * radius, 80, WORLD.w - 80),
        y: clamp(s.player.y + Math.sin(angle) * radius, 80, WORLD.h - 80),
        hp, maxHp: hp,
        speed: chosen === "warden" ? 44 : chosen === "brute" ? 54 : chosen === "spitter" ? 70 : 88,
        radius: er, attackCd: 1 + Math.random(), phase: Math.random() * TAU,
      });
    };

    const fire = (s: GameState) => {
      const weapon = WEAPONS[s.selectedWeapon];
      if (s.player.fireCd > 0 || s.player.energy < weapon.energy) return;
      s.player.fireCd = weapon.rate; s.player.energy -= weapon.energy;
      const shots = s.selectedWeapon === 1 ? 5 : 1;
      for (let i = 0; i < shots; i += 1) {
        const spread = s.selectedWeapon === 1 ? (i - 2) * 0.105 + (Math.random() - 0.5) * 0.035 : 0;
        const angle = s.player.angle + spread;
        s.projectiles.push({
          x: s.player.x + Math.cos(angle) * 23, y: s.player.y + Math.sin(angle) * 23,
          vx: Math.cos(angle) * weapon.speed, vy: Math.sin(angle) * weapon.speed,
          life: s.selectedWeapon === 2 ? 1.15 : 0.82, damage: weapon.damage, color: weapon.color,
          radius: s.selectedWeapon === 2 ? 4 : 2.5, pierce: s.selectedWeapon === 2 ? 4 : 0,
        });
      }
      s.screenShake = Math.max(s.screenShake, s.selectedWeapon === 2 ? 7 : 2);
      burst(s, s.player.x + Math.cos(s.player.angle) * 24, s.player.y + Math.sin(s.player.angle) * 24, weapon.color, s.selectedWeapon === 1 ? 8 : 4, 90);
    };

    const harvest = (s: GameState) => {
      if (s.player.harvestCd > 0) return;
      const node = s.nodes.find((candidate) => candidate.hp > 0 && distance(candidate, s.player) < 78);
      if (!node) return;
      s.player.harvestCd = 0.34; node.hp -= 1;
      const colors = { ferrite: "#5fe9ff", lumina: "#a982ff", biomass: "#67e39a" };
      burst(s, node.x, node.y, colors[node.kind], 10, 150); s.screenShake = 2;
      if (node.hp <= 0) {
        const gain = node.kind === "ferrite" ? 7 : node.kind === "lumina" ? 5 : 4;
        s.resources[node.kind] += gain; notify(`HARVESTED // +${gain} ${node.kind.toUpperCase()}`);
        if (s.mission === 0 && s.resources.ferrite >= 18 && s.resources.lumina >= 8) {
          s.mission = 1; s.storyFlags |= 2; notify("MEMORY SHARD DECRYPTED // Dr. Sato was here");
        }
        window.setTimeout(() => {
          node.hp = node.maxHp; node.x = 100 + Math.random() * (WORLD.w - 200); node.y = 100 + Math.random() * (WORLD.h - 200);
        }, 12000);
      }
    };

    const update = (dt: number) => {
      const s = gameRef.current;
      if (!runningRef.current || s.player.hp <= 0 || s.bossDefeated) return;
      const keys = keysRef.current; const pointer = pointerRef.current;
      const cw = window.innerWidth; const ch = window.innerHeight;

      s.time += dt / 118;
      if (s.time >= 1) {
        s.time = 0; s.day += 1; notify(`DAWN ${String(s.day).padStart(2, "0")} // atmospheric radiation falling`);
        if (s.mission === 2 && s.day >= 2) { s.mission = 3; s.storyFlags |= 4; }
      }
      const night = s.time > 0.56;
      s.waveClock -= dt;
      if (s.waveClock <= 0 && s.enemies.length < 28) {
        const count = night ? 2 + Math.min(3, s.day) : 1;
        for (let i = 0; i < count; i += 1) spawnEnemy(s);
        s.waveClock = night ? Math.max(2.2, 6 - s.day * 0.35) : 9;
      }

      let mx = 0; let my = 0;
      if (keys.w || keys.arrowup) my -= 1; if (keys.s || keys.arrowdown) my += 1;
      if (keys.a || keys.arrowleft) mx -= 1; if (keys.d || keys.arrowright) mx += 1;
      if (mx || my) {
        const len = Math.hypot(mx, my); const speed = keys.shift && s.player.energy > 1 ? 265 : 190;
        mx /= len; my /= len;
        s.player.x = clamp(s.player.x + mx * speed * dt, 28, WORLD.w - 28);
        s.player.y = clamp(s.player.y + my * speed * dt, 28, WORLD.h - 28);
        if (keys.shift) s.player.energy = Math.max(0, s.player.energy - 17 * dt);
      }
      s.player.energy = Math.min(100, s.player.energy + (mx || my ? 7 : 13) * dt);
      s.player.shield = Math.min(100, s.player.shield + (s.player.invuln <= 0 ? 4.2 : 0) * dt);
      s.player.fireCd -= dt; s.player.harvestCd -= dt; s.player.invuln -= dt;

      const targetX = s.camera.x - cw / 2 + pointer.x; const targetY = s.camera.y - ch / 2 + pointer.y;
      s.player.angle = Math.atan2(targetY - s.player.y, targetX - s.player.x);
      s.camera.x += (s.player.x - s.camera.x) * Math.min(1, dt * 7);
      s.camera.y += (s.player.y - s.camera.y) * Math.min(1, dt * 7);
      if ((pointer.down || keys[" "]) && !s.buildMode) fire(s);
      if (keys.e) harvest(s);

      for (const building of s.buildings) {
        building.cooldown -= dt;
        if (building.kind === "turret" && building.cooldown <= 0) {
          const target = s.enemies.filter((enemy) => distance(enemy, building) < 430).sort((a, b) => distance(a, building) - distance(b, building))[0];
          if (target) {
            const angle = Math.atan2(target.y - building.y, target.x - building.x);
            s.projectiles.push({ x: building.x, y: building.y, vx: Math.cos(angle) * 620, vy: Math.sin(angle) * 620, life: 0.8, damage: 10, color: "#81fff2", radius: 2 });
            building.cooldown = 0.42;
          }
        }
      }

      for (const enemy of s.enemies) {
        enemy.attackCd -= dt; enemy.phase += dt * 2;
        const beacon = s.buildings.find((building) => building.kind === "beacon");
        const target: (Building | typeof s.player) = enemy.kind === "warden" && beacon ? beacon : s.player;
        const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
        const targetDistance = distance(enemy, target); const desired = enemy.kind === "spitter" ? 260 : enemy.radius + 18;
        if (targetDistance > desired) { enemy.x += Math.cos(angle) * enemy.speed * dt; enemy.y += Math.sin(angle) * enemy.speed * dt; }
        if (enemy.kind === "spitter" && targetDistance < 470 && enemy.attackCd <= 0) {
          s.projectiles.push({ x: enemy.x, y: enemy.y, vx: Math.cos(angle) * 300, vy: Math.sin(angle) * 300, life: 1.55, damage: 14, color: "#ff6da7", radius: 5, hostile: true });
          enemy.attackCd = 1.7;
        } else if (targetDistance < desired + 8 && enemy.attackCd <= 0) {
          if (target === s.player) {
            if (s.player.invuln <= 0) {
              const damage = enemy.kind === "warden" ? 30 : enemy.kind === "brute" ? 19 : 10;
              const shieldHit = Math.min(s.player.shield, damage);
              s.player.shield -= shieldHit; s.player.hp -= damage - shieldHit; s.player.invuln = 0.45;
              s.screenShake = enemy.kind === "warden" ? 12 : 7; burst(s, s.player.x, s.player.y, "#ff6987", 15, 230);
            }
          } else target.hp -= enemy.kind === "warden" ? 32 : 10;
          enemy.attackCd = enemy.kind === "warden" ? 1.1 : 0.85;
        }
        if (enemy.kind === "warden" && enemy.attackCd <= -0.7) {
          for (let i = 0; i < 10; i += 1) {
            const a = (i / 10) * TAU + enemy.phase;
            s.projectiles.push({ x: enemy.x, y: enemy.y, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250, life: 1.7, damage: 12, color: "#ff4d86", radius: 4, hostile: true });
          }
          enemy.attackCd = 2.2; s.screenShake = 8;
        }
      }

      for (const projectile of s.projectiles) {
        projectile.x += projectile.vx * dt; projectile.y += projectile.vy * dt; projectile.life -= dt;
        if (projectile.hostile) {
          if (distance(projectile, s.player) < 18 && s.player.invuln <= 0) {
            const shieldHit = Math.min(s.player.shield, projectile.damage);
            s.player.shield -= shieldHit; s.player.hp -= projectile.damage - shieldHit; s.player.invuln = 0.3; projectile.life = 0;
            burst(s, s.player.x, s.player.y, "#ff6f99", 8, 150);
          }
        } else {
          for (const enemy of s.enemies) {
            if (enemy.hp > 0 && distance(projectile, enemy) < enemy.radius + projectile.radius) {
              enemy.hp -= projectile.damage; burst(s, projectile.x, projectile.y, projectile.color, 4, 100);
              if ((projectile.pierce ?? 0) > 0) projectile.pierce = (projectile.pierce ?? 0) - 1; else projectile.life = 0;
              break;
            }
          }
        }
      }

      for (const enemy of s.enemies.filter((candidate) => candidate.hp <= 0)) {
        const boss = enemy.kind === "warden";
        burst(s, enemy.x, enemy.y, boss ? "#ff76bd" : "#a56cff", boss ? 70 : 18, boss ? 420 : 230);
        s.screenShake = boss ? 24 : 6; s.resources.biomass += boss ? 25 : 1; s.kills += boss ? 10 : 1;
        if (s.kills === 8) notify("WEAPON FABRICATED // NOVA SCATTER unlocked [2]");
        if (s.kills >= 22 && s.kills - (boss ? 10 : 1) < 22) notify("WEAPON FABRICATED // HELIX RAIL unlocked [3]");
        if (boss) { s.bossDefeated = true; s.mission = 5; s.storyFlags = 63; }
      }
      s.enemies = s.enemies.filter((enemy) => enemy.hp > 0);
      s.buildings = s.buildings.filter((building) => building.hp > 0);
      s.projectiles = s.projectiles.filter((projectile) => projectile.life > 0 && projectile.x > 0 && projectile.y > 0 && projectile.x < WORLD.w && projectile.y < WORLD.h);

      for (const particle of s.particles) {
        particle.x += particle.vx * dt; particle.y += particle.vy * dt;
        particle.vx *= Math.pow(0.04, dt); particle.vy *= Math.pow(0.04, dt); particle.life -= dt;
      }
      s.particles = s.particles.filter((particle) => particle.life > 0).slice(-700);
      s.screenShake = Math.max(0, s.screenShake - dt * 22);
      if (toastActiveRef.current) {
        toastTimerRef.current -= dt;
        if (toastTimerRef.current <= 0) { toastActiveRef.current = false; setToast(""); }
      }
    };

    const render = () => {
      const s = gameRef.current; const width = window.innerWidth; const height = window.innerHeight;
      const nightAmount = clamp((s.time - 0.48) / 0.18, 0, 1) * clamp((1.04 - s.time) / 0.1, 0, 1);
      const shakeX = (Math.random() - 0.5) * s.screenShake; const shakeY = (Math.random() - 0.5) * s.screenShake;
      const ox = width / 2 - s.camera.x + shakeX; const oy = height / 2 - s.camera.y + shakeY;

      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, nightAmount > 0.4 ? "#040514" : "#07131d"); bg.addColorStop(1, nightAmount > 0.4 ? "#090516" : "#0b1820");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);

      ctx.save(); ctx.translate(ox, oy);
      const grid = 96; const startX = Math.floor((s.camera.x - width / 2) / grid) * grid; const endX = s.camera.x + width / 2 + grid;
      const startY = Math.floor((s.camera.y - height / 2) / grid) * grid; const endY = s.camera.y + height / 2 + grid;
      ctx.strokeStyle = nightAmount > 0.45 ? "rgba(83,91,151,.09)" : "rgba(78,178,190,.065)"; ctx.lineWidth = 1; ctx.beginPath();
      for (let x = startX; x < endX; x += grid) { ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
      for (let y = startY; y < endY; y += grid) { ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
      ctx.stroke();

      for (let i = 0; i < 170; i += 1) {
        const x = seeded(i + 500) * WORLD.w; const y = seeded(i + 800) * WORLD.h;
        if (x < startX - 30 || x > endX + 30 || y < startY - 30 || y > endY + 30) continue;
        const r = 4 + seeded(i + 900) * 26;
        ctx.fillStyle = `rgba(${38 + Math.floor(seeded(i) * 25)},${70 + Math.floor(seeded(i + 2) * 28)},${77 + Math.floor(seeded(i + 4) * 35)},${0.08 + seeded(i + 6) * 0.11})`;
        ctx.beginPath(); ctx.ellipse(x, y, r * 1.8, r, seeded(i + 14) * TAU, 0, TAU); ctx.fill();
      }
      ctx.strokeStyle = "rgba(110, 221, 255, .22)"; ctx.lineWidth = 3; ctx.strokeRect(0, 0, WORLD.w, WORLD.h);

      for (const node of s.nodes) {
        if (node.hp <= 0) continue;
        const color = node.kind === "ferrite" ? "#61eaff" : node.kind === "lumina" ? "#a987ff" : "#69e59d";
        const pulse = 1 + Math.sin(performance.now() / 650 + node.phase) * 0.08;
        ctx.save(); ctx.translate(node.x, node.y); ctx.shadowColor = color; ctx.shadowBlur = node.kind === "lumina" ? 25 : 13; ctx.fillStyle = color;
        if (node.kind === "biomass") {
          for (let i = 0; i < 5; i += 1) { ctx.rotate(TAU / 5); ctx.beginPath(); ctx.ellipse(0, -11 * pulse, 6, 15, 0, 0, TAU); ctx.fill(); }
        } else {
          for (let i = 0; i < (node.kind === "lumina" ? 4 : 3); i += 1) {
            ctx.rotate(TAU / 4 + node.phase * 0.02); ctx.beginPath(); ctx.moveTo(-7, 9); ctx.lineTo(0, -22 * pulse - i * 2); ctx.lineTo(8, 8); ctx.closePath(); ctx.fill();
          }
        }
        ctx.restore();
      }

      for (const building of s.buildings) {
        ctx.save(); ctx.translate(building.x, building.y); const damaged = building.hp / building.maxHp;
        if (building.kind === "wall") {
          ctx.fillStyle = "#173943"; ctx.strokeStyle = "#6ceeff"; ctx.lineWidth = 2; ctx.fillRect(-31, -18, 62, 36); ctx.strokeRect(-31, -18, 62, 36);
          ctx.fillStyle = "rgba(105,238,255,.18)"; ctx.fillRect(-25, -12, 50 * damaged, 24);
        } else if (building.kind === "turret") {
          ctx.shadowColor = "#70fff2"; ctx.shadowBlur = 16; ctx.fillStyle = "#173b40"; polygon(ctx, 0, 0, 24, 6, Math.PI / 6); ctx.fill();
          ctx.strokeStyle = "#70fff2"; ctx.stroke(); ctx.fillStyle = "#70fff2"; ctx.fillRect(-3, -31, 6, 31);
        } else {
          const pulse = 1 + Math.sin(performance.now() / 300) * .12;
          ctx.shadowColor = "#b175ff"; ctx.shadowBlur = 30; ctx.strokeStyle = "#cda4ff"; ctx.lineWidth = 3; polygon(ctx, 0, 0, 42 * pulse, 6, Math.PI / 6); ctx.stroke();
          ctx.fillStyle = "rgba(158,103,255,.25)"; polygon(ctx, 0, 0, 31, 3, -Math.PI / 2); ctx.fill();
          ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, -130 - Math.sin(performance.now() / 500) * 14); ctx.strokeStyle = "rgba(192,139,255,.48)"; ctx.stroke();
        }
        ctx.restore();
      }

      for (const enemy of s.enemies) {
        const color = enemy.kind === "warden" ? "#ff4d8c" : enemy.kind === "brute" ? "#ff7f65" : enemy.kind === "spitter" ? "#ee72ff" : "#a168ff";
        ctx.save(); ctx.translate(enemy.x, enemy.y); ctx.rotate(enemy.phase * .35); ctx.shadowColor = color; ctx.shadowBlur = enemy.kind === "warden" ? 35 : 16;
        ctx.fillStyle = color; ctx.globalAlpha = .86; polygon(ctx, 0, 0, enemy.radius * (1 + Math.sin(enemy.phase * 2) * .08), enemy.kind === "warden" ? 8 : enemy.kind === "brute" ? 6 : 5, Math.PI / 4); ctx.fill();
        ctx.globalAlpha = 1; ctx.fillStyle = "#16081f"; polygon(ctx, 0, 0, enemy.radius * .53, enemy.kind === "warden" ? 8 : 5, -Math.PI / 4); ctx.fill();
        ctx.fillStyle = "#fff0fb"; ctx.beginPath(); ctx.arc(0, 0, Math.max(3, enemy.radius * .13), 0, TAU); ctx.fill(); ctx.restore();
        if (enemy.hp < enemy.maxHp && enemy.kind !== "warden") {
          ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 14, 40, 3);
          ctx.fillStyle = color; ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 14, 40 * (enemy.hp / enemy.maxHp), 3);
        }
      }

      for (const projectile of s.projectiles) {
        ctx.save(); ctx.shadowColor = projectile.color; ctx.shadowBlur = 18; ctx.strokeStyle = projectile.color; ctx.lineWidth = projectile.radius * 1.7;
        ctx.beginPath(); ctx.moveTo(projectile.x, projectile.y); ctx.lineTo(projectile.x - projectile.vx * .035, projectile.y - projectile.vy * .035); ctx.stroke(); ctx.restore();
      }
      for (const particle of s.particles) {
        ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1); ctx.fillStyle = particle.color; ctx.shadowColor = particle.color; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size * (particle.life / particle.maxLife), 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;

      ctx.save(); ctx.translate(s.player.x, s.player.y); ctx.rotate(s.player.angle);
      if (s.player.invuln > 0 && Math.floor(s.player.invuln * 18) % 2 === 0) ctx.globalAlpha = .36;
      ctx.shadowColor = "#65eeff"; ctx.shadowBlur = 22; ctx.fillStyle = "#b9f8ff"; ctx.beginPath();
      ctx.moveTo(25, 0); ctx.lineTo(-15, -13); ctx.lineTo(-8, 0); ctx.lineTo(-15, 13); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#164257"; ctx.beginPath(); ctx.arc(1, 0, 7, 0, TAU); ctx.fill();
      ctx.strokeStyle = WEAPONS[s.selectedWeapon].color; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(8, 4); ctx.lineTo(29, 4); ctx.stroke(); ctx.restore();

      if (s.buildMode) {
        const wx = s.camera.x - width / 2 + pointerRef.current.x; const wy = s.camera.y - height / 2 + pointerRef.current.y;
        const valid = distance(s.player, { x: wx, y: wy }) <= 310;
        ctx.save(); ctx.strokeStyle = valid ? "rgba(99,243,255,.85)" : "rgba(255,82,106,.85)"; ctx.fillStyle = valid ? "rgba(99,243,255,.10)" : "rgba(255,82,106,.10)";
        ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(wx, wy, s.buildKind === "beacon" ? 44 : 31, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.setLineDash([]); ctx.strokeStyle = "rgba(99,243,255,.10)"; ctx.beginPath(); ctx.arc(s.player.x, s.player.y, 310, 0, TAU); ctx.stroke(); ctx.restore();
      }
      ctx.restore();

      if (nightAmount > 0.01) {
        ctx.save(); ctx.fillStyle = `rgba(0, 0, 18, ${nightAmount * .58})`; ctx.fillRect(0, 0, width, height);
        const px = s.player.x + ox; const py = s.player.y + oy;
        const light = ctx.createRadialGradient(px, py, 20, px, py, 320);
        light.addColorStop(0, `rgba(89, 229, 255, ${nightAmount * .16})`); light.addColorStop(.52, "rgba(4, 8, 25, 0)"); light.addColorStop(1, "rgba(0, 0, 12, 0)");
        ctx.globalCompositeOperation = "screen"; ctx.fillStyle = light; ctx.fillRect(0, 0, width, height); ctx.restore();
      }
      const horizon = ctx.createLinearGradient(0, 0, 0, 120);
      horizon.addColorStop(0, nightAmount > .4 ? "rgba(130,83,255,.17)" : "rgba(73,215,237,.12)"); horizon.addColorStop(1, "transparent");
      ctx.fillStyle = horizon; ctx.fillRect(0, 0, width, 120);
    };

    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      update(dt); render(); hudClock += dt;
      if (hudClock > 0.1) { hudClock = 0; setHud(createHud(gameRef.current)); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [notify]);

  const pointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerRef.current.x = event.clientX - rect.left; pointerRef.current.y = event.clientY - rect.top;
  };
  const pointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId); pointerRef.current.down = true;
    if (!started || paused || codex) return;
    const s = gameRef.current;
    if (s.buildMode) {
      const wx = s.camera.x - window.innerWidth / 2 + pointerRef.current.x;
      const wy = s.camera.y - window.innerHeight / 2 + pointerRef.current.y;
      placeBuilding(wx, wy);
    }
  };
  const setTouchKey = (key: string, value: boolean) => { keysRef.current[key] = value; };

  return (
    <main className={`game-shell ${hud.buildMode ? "building" : ""}`}>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        aria-label="Starfall playable survival world"
        onPointerMove={pointerMove}
        onPointerDown={pointerDown}
        onPointerUp={() => { pointerRef.current.down = false; }}
        onPointerCancel={() => { pointerRef.current.down = false; }}
        onPointerLeave={() => { pointerRef.current.down = false; }}
      />
      <div className="scanlines" /><div className="vignette" />

      {started && (
        <>
          <section className="hud" aria-label="Game status">
            <div className="panel status-panel">
              <div className="status-head"><p className="eyebrow">ARK-7 // SHAWN</p><span className="signal">linked</span></div>
              <Meter label="VITAL" value={hud.hp} className="health" />
              <Meter label="AEGIS" value={hud.shield} className="shield" />
              <Meter label="FLUX" value={hud.energy} className="energy" />
              <div className="resource-row">
                <Resource label="Ferrite" value={hud.ferrite} />
                <Resource label="Lumina" value={hud.lumina} />
                <Resource label="Biomass" value={hud.biomass} />
              </div>
            </div>

            <div className="panel objective-panel">
              <div className="objective-head">Directive {String(hud.mission + 1).padStart(2, "0")}</div>
              <strong>{MISSIONS[hud.mission].title}</strong><small>{MISSIONS[hud.mission].sub}</small>
            </div>

            <div className="top-actions">
              <Button className="hud-button" variant="outline" onClick={() => { setCodex(true); setPaused(true); }}>Codex [J]</Button>
              <Button className="hud-button" variant="outline" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</Button>
            </div>

            <div className="hotbar-wrap">
              <div className="panel hotbar">
                {WEAPONS.map((weapon, index) => {
                  const unlocked = index === 0 || (index === 1 && hud.kills >= 8) || (index === 2 && hud.kills >= 22);
                  return (
                    <button type="button" key={weapon.name} className={`slot ${hud.weapon === index ? "active" : ""} ${!unlocked ? "locked" : ""}`}
                      onClick={() => { if (unlocked) gameRef.current.selectedWeapon = index; else notify(index === 1 ? "Unlocks at 8 kills" : "Unlocks at 22 kills"); }}>
                      <kbd>{index + 1}</kbd><b>{unlocked ? weapon.short : "LOCKED"}</b><span>{unlocked ? `${weapon.damage} DMG` : `${index === 1 ? 8 : 22} KILLS`}</span>
                    </button>
                  );
                })}
                <button type="button" className={`slot ${hud.buildMode ? "active" : ""}`} onClick={toggleBuild}>
                  <kbd>B</kbd><b>FABRICATE</b><span>BUILD MODE</span>
                </button>
              </div>
              {hud.buildMode && <div className="build-chip">Q to cycle · {hud.buildKind} selected · click to construct</div>}
            </div>
          </section>

          {hud.bossMax > 0 && (
            <div className="panel boss-bar"><header><span>EXTINCTION ENTITY</span><strong>AXIOM WARDEN</strong><span>MEMORY EATER</span></header>
              <div className="boss-track"><div className="boss-fill" style={{ width: `${(hud.bossHp / hud.bossMax) * 100}%` }} /></div>
            </div>
          )}
          <div className={`toast ${toast ? "visible" : ""}`}><span>◈</span> {toast}</div>

          <div className="mobile-controls" aria-label="Touch controls">
            <div className="move-pad">
              <button className="touch-key up" onPointerDown={() => setTouchKey("w", true)} onPointerUp={() => setTouchKey("w", false)}>▲</button>
              <button className="touch-key left" onPointerDown={() => setTouchKey("a", true)} onPointerUp={() => setTouchKey("a", false)}>◀</button>
              <button className="touch-key down" onPointerDown={() => setTouchKey("s", true)} onPointerUp={() => setTouchKey("s", false)}>▼</button>
              <button className="touch-key right" onPointerDown={() => setTouchKey("d", true)} onPointerUp={() => setTouchKey("d", false)}>▶</button>
            </div>
            <div className="action-pad">
              <button className="touch-key" onPointerDown={() => setTouchKey("e", true)} onPointerUp={() => setTouchKey("e", false)}>MINE</button>
              <button className="touch-key" onPointerDown={() => { pointerRef.current.down = true; }} onPointerUp={() => { pointerRef.current.down = false; }}>FIRE</button>
            </div>
          </div>
        </>
      )}

      {!started && (
        <div className="overlay"><section className="intro-card">
          <p className="eyebrow">OPEN-WORLD SURVIVAL // PROTOTYPE 01</p>
          <h1>Starfall <em>Echoes of Eden</em></h1>
          <div className="intro-grid">
            <div>
              <p className="story-lead">In 2319, Earth transmitted one final word—<strong>EDEN</strong>—then vanished. Six centuries later, you wake beneath an alien sky with a dead civilization in your blood and something outside the pod whispering in your own voice.</p>
              <p className="transmission">“If you can hear me, do not rebuild Earth. We already tried. — SHAWN // ITERATION 43”</p>
            </div>
            <div>
              <dl className="control-list">
                <dt>WASD</dt><dd>Move / explore</dd><dt>MOUSE</dt><dd>Aim and fire</dd><dt>E</dt><dd>Harvest resources</dd>
                <dt>B / Q</dt><dd>Build / cycle structure</dd><dt>1–3</dt><dd>Switch weapons</dd><dt>SHIFT</dt><dd>Flux sprint</dd><dt>J</dt><dd>Open story codex</dd>
              </dl>
              <Button className="launch-button" onClick={() => { setStarted(true); setPaused(false); runningRef.current = true; notify("CRYO-POD OPEN // welcome to Eden-9"); }}>Wake on Eden-9</Button>
            </div>
          </div>
        </section></div>
      )}

      {started && paused && !codex && !hud.dead && !hud.victory && (
        <div className="overlay"><section className="intro-card death-card">
          <p className="eyebrow">TIME DILATION ACTIVE</p><h2>Signal Paused</h2><p>Night is waiting. It has learned to be patient.</p>
          <Button className="launch-button" onClick={() => setPaused(false)}>Return to Eden-9</Button>
        </section></div>
      )}

      {codex && (
        <div className="overlay"><section className="codex-card">
          <div className="codex-header">
            <div><p className="eyebrow">ARK MEMORY // {bitCount(hud.storyFlags)} OF 6 SHARDS</p><h2>The Eden Archive</h2></div>
            <Button className="hud-button" variant="outline" onClick={() => { setCodex(false); setPaused(false); }}>Close [J]</Button>
          </div>
          <div className="codex-tabs"><Button className="hud-button codex-tab" variant="outline">Main Story</Button><Button className="hud-button codex-tab" variant="outline">World Systems</Button><Button className="hud-button codex-tab" variant="outline">Future Campaign</Button></div>
          <div className="codex-section">
            {LORE.map((entry, index) => {
              const unlocked = (hud.storyFlags & (1 << index)) !== 0;
              return <article key={entry.code} className={`lore-entry ${unlocked ? "" : "locked"}`}><small>{unlocked ? entry.code : "ENCRYPTED // ?????"}</small><h3>{unlocked ? entry.title : "Memory unavailable"}</h3><p>{unlocked ? entry.text : "Defeat Starborne, survive eclipses, and complete directives to reconstruct this shard."}</p></article>;
            })}
          </div>
        </section></div>
      )}

      {hud.dead && (
        <div className="overlay"><section className="intro-card death-card">
          <p className="eyebrow">BIOLOGICAL SIGNAL LOST</p><h2>You Were Remembered</h2><p>The Starborne take your face, your voice, and one more version of humanity. But Eden has restarted you before.</p>
          <Button className="launch-button" onClick={restart}>Fork the Timeline</Button>
        </section></div>
      )}

      {hud.victory && !codex && (
        <div className="overlay"><section className="intro-card death-card">
          <p className="eyebrow">AXIOM WARDEN DESTROYED // MEMORY RESTORED</p><h2 style={{ color: "#80f3ff" }}>Earth Is Alive</h2>
          <p>It is alive inside every Starborne—and it has been calling them home. You have won the first night, not the war. Three futures now wait beyond Eden-9.</p>
          <Button className="launch-button" onClick={() => { setCodex(true); setPaused(true); }}>Reveal the Complete Story</Button>
          <Button className="hud-button" variant="outline" style={{ marginTop: 10, width: "100%" }} onClick={restart}>Begin New Timeline</Button>
        </section></div>
      )}
    </main>
  );
}

function Meter({ label, value, className }: { label: string; value: number; className: string }) {
  return <div className="meter"><span>{label}</span><div className="meter-track"><div className={`meter-fill ${className}`} style={{ width: `${clamp(value, 0, 100)}%` }} /></div><b>{Math.round(value)}</b></div>;
}
function Resource({ label, value }: { label: string; value: number }) {
  return <span className="resource"><i /><b>{value}</b><small>{label}</small></span>;
}
function bitCount(value: number) {
  let n = value; let count = 0;
  while (n) { count += n & 1; n >>>= 1; }
  return count;
}
