# ABYSSAL WAKE Project Charter

This is the stable orientation page for new project sessions. It records product intent and working boundaries; current implementation status belongs in [`PROJECT_STATE.md`](PROJECT_STATE.md), and runtime facts must be checked against the repository.

## Game identity

**ABYSSAL WAKE / 深渊苏醒** is a 3/4 oblique-view pixel-art co-op survival sandbox RPG set in a recognizable modern coastal city touched by cosmic horror. The player prepares a home, explores dangerous places, fights and salvages, then brings value home to recover, craft, build and grow. The intended view is a readable diagonal top-down camera, not a strict isometric grid.

The emotional contrast is **HOME / OUTSIDE**: HOME is warm, humane, readable and safe; OUTSIDE is cold, uncertain, dangerous and rewarding. Cosmic horror escalates gradually from ordinary modern life through small anomalies and failing infrastructure toward monsters, awakening and abyssal corruption. Do not begin with a world-wide purple/tentacle treatment.

## Experience and visual goals

- Core experience: **边生活，边战斗** — a useful home and meaningful expeditions reinforce one another.
- Target look: **warm, cohesive small-scale pixel art** in a recognizable modern coastal city. Keep a consistent native pixel density, compact readable characters, intentional pixel clusters, a restrained palette and nearest-neighbor edges. High craft means clean composition and connected terrain, not realistic illustration or enlarged concept art. Use concept images for mood/composition only; gameplay art must pass the in-game pixel and scale gate.
- The user-provided 2026-10-04 concept image is the primary composition/mood reference: a bright coastal safe harbor, visible residents and co-op, survival/inventory/map layers, and a tense night expedition. The user chose its 3/4 oblique view and reports the isolated prototype's gameplay direction is acceptable; its current image quality is not. The intended successor should bring that view into the real game. V21 may be phased out after a replacement path preserves and passes the real game loop, save/network boundaries, and art/runtime acceptance. Do not treat the current prototype as production-ready or delete old files before replacement and dependency checks pass.
- First useful scale: a compact authored HOME → POI → return loop, not a huge empty map.
- Every new system should strengthen HOME, survival, exploration, combat, progression or co-op. Farming, pets, fishing, NPC life and other large systems are long-term goals, not claims about current V21 implementation.

## Reference games

Borrow player-experience lessons; do not copy protected content, maps, names, art or exact systems.

| Reference | Experience to learn from |
|---|---|
| Crashlands | Immediate readable combat feedback and energetic creatures |
| Terraria | Exploration, equipment-gated access and memorable boss progression |
| Minecraft | Player expression and a home that changes how the player prepares |
| Don't Starve | Readable survival pressure and danger beyond safety |
| Stardew Valley | Warm routines, growth, farming/life value and community |

## System modules

Use [`SUCCESSOR_MODULE_MAP.md`](SUCCESSOR_MODULE_MAP.md) as the **canonical module-owner directory**. The parent domains below are only navigation groups; they are never a substitute for a named single owner in a task. V21 source files may still combine responsibilities during transition, so this product ownership map does not claim those systems have already been physically separated in code.

| Parent domain (not a code owner) | Canonical child modules |
|---|---|
| Player, Movement & Items | Core State & Save; Character & Progression; Movement & Locomotion; Items & Inventory; Crafting & Processing |
| World & Daily Life | World & Terrain; POI & Exploration; HOME & Building; Interaction & Gathering; NPC & Social; Quest & Narrative; Pets & Companions; Farming & Food |
| Survival & Encounters | Survival & Needs; Time & Weather; Combat & Weapons; Creatures & AI; Loot & Rewards |
| Presentation | Rendering & Camera; Animation & Presentation; UI & Map; Input & Accessibility; Audio & Feel |
| Platform & Delivery | Network & Co-op; Content & Localization; Asset Pipeline; Integration & QA |

Every task names one canonical lead module, its owned state, explicit requests/events to neighbor modules, allowed files, and regression checks. A parent domain cannot own a second copy of child-module state.

## Working rules

- The active repository, current boot path, tests and contracts are the evidence for what exists. Chat history and handoff reports are leads to verify, not proof.
- Default daily work is review and reviewable design/content drafts; the user chooses which proposed content to keep, change, discard, or implement. The user has also authorized narrow fixes for confirmed bugs: reproduce or prove the defect, preserve all existing/untracked files, make the smallest reversible fix, add or run relevant regression checks, and report any limits. Do not expand a bug fix into unrelated feature work. Ask before destructive file/data removal, save migration, breaking shared contracts, merging, or deployment.
- Distinguish **VERIFIED**, **REPORTED**, **PLANNED**, and **UNKNOWN**. A generated concept is not runtime integration; a bug report is not a fix.
- Preserve the active V21 boot order, Relay protocol, save format, mobile behavior and gameplay authority boundaries unless a scoped task explicitly changes them.
- Keep provider/backend costs at the established free-plan target unless the user changes that constraint.
- Explain technical choices in beginner-friendly language. Ask the user to choose product direction, not to diagnose code or gather routine logs.

## Project references

- Copyable long-term AI Goal: [`PROJECT_LONG_TERM_GOAL.md`](PROJECT_LONG_TERM_GOAL.md)
- Product pillars and loop: [`GAME_DESIGN.md`](../GAME_DESIGN.md)
- Visual contract and art acceptance: [`ART_BIBLE.md`](../ART_BIBLE.md)
- Current and planned system boundaries: [`SYSTEM_BLUEPRINT.md`](../SYSTEM_BLUEPRINT.md)
- Sequenced project phases: [`ROADMAP.md`](../ROADMAP.md)
- Active V21 module wiring: [`MODULE_MAP.md`](../MODULE_MAP.md)
- Successor module crosswalk and proof-preview boundary: [`SUCCESSOR_MODULE_MAP.md`](SUCCESSOR_MODULE_MAP.md)
- Current verified status: [`PROJECT_STATE.md`](PROJECT_STATE.md)
- Dated context snapshots: [`handoffs/`](handoffs/)
- User-reviewable content drafts: [`content-inbox/`](content-inbox/)
- Session continuity workflow: [`.agents/skills/abyssal-wake-continuity/SKILL.md`](../.agents/skills/abyssal-wake-continuity/SKILL.md)
- Integrated five-game reference analysis and system modules: [`GAMEPLAY_VISION_AND_REFERENCE_ANALYSIS_V1.md`](GAMEPLAY_VISION_AND_REFERENCE_ANALYSIS_V1.md)
