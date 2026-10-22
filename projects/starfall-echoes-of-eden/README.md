# STARFALL: ECHOES OF EDEN

> A science-fiction open-world survival game where memory is matter and every world remembers what you build.

**Playable prototype:** https://starfall-echoes-of-eden.shaolei199.chatgpt.site

This repository contains the first vertical slice of **Starfall: Echoes of Eden**. It combines the freedom of Minecraft, the progression and boss rhythm of Terraria, and an original cosmic-horror story built around one question: **If rebuilding Earth requires sacrificing every surviving colony, is humanity worth restoring?**

## Current playable systems

- Large explorable alien world rendered in real time
- Ferrite, Lumina, and Biomass harvesting
- Day/night cycle with escalating enemy waves
- Health, regenerating shield, and Flux energy
- Three weapons: VX-9 Pulse, Nova Scatter, and Helix Rail
- Walls, automated turrets, and an Eden Resonance Beacon
- Four enemy classes and the AXIOM WARDEN boss
- Particle effects, weapon trails, lighting, screen shake, and glass HUD
- Six-step story directive and unlockable Eden Archive
- Keyboard/mouse and basic touch controls

## Controls

| Input | Action |
|---|---|
| WASD / arrows | Move |
| Mouse / Space | Aim and fire |
| E | Harvest nearby resource |
| Shift | Flux sprint |
| B | Toggle build mode |
| Q | Cycle wall, turret, beacon |
| 1 / 2 / 3 | Switch weapons |
| J | Open story archive |
| Esc | Pause |

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite address. For a production build:

```bash
npm run build
```

## Project structure

```text
src/
  main.tsx            App entry
  App.tsx             Root composition
  starfall-game.tsx   Simulation, combat, AI, rendering, story state
  button.tsx          Lightweight UI primitive
  styles.css          HUD, overlays, responsive controls
GAME_DESIGN.md        Full story and production roadmap
```

## Status

This is **Prototype 0.1**, not a finished commercial game. The current goal is to prove the core feeling: land, scavenge, build a foothold, survive the eclipse, awaken the beacon, and learn that the final boss is a version of yourself.

The full design, five-act campaign, biomes, factions, bosses, crafting tree, multiplayer direction, and development milestones are documented in [GAME_DESIGN.md](./GAME_DESIGN.md).
