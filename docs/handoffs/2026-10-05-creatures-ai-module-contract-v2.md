# Handoff — Creatures & AI Module Contract V2

Date: 2026-10-05  
Status: DRAFT / no separate successor creature service or production art implemented.

## Baseline and current facts

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- Shared worktree has many dirty/untracked files of mixed or unknown provenance. They were preserved and are not attributed to this pass.
- `survival-v21.html` loads `world-state.js` and `mob-combat.js`; the main loop calls `ABYSSAL_MOB_COMBAT_V1.updateMobs()`. Awakening World wraps mob spawning to add MIRE MART creatures.
- Current `mob-combat.js` owns leader AI/movement/windup, while `player-combat.js` still applies mob HP/death/respawn and calls the reward path. The canonical split between Creature HP/life, Combat-confirmed damage and Loot settlement is PLANNED and not implemented.
- Current `phase` shares roam angle and negative windup semantics. Cooldown/windup values and interruption timing are captured in the V2 card, but actual fairness/player readability remain UNKNOWN.
- Base `world-state.js` spawn values are modified by the later `game-v7-patch.js`: ordinary zones spawn 6 mobs with 58/72/95 HP by kind; Safe Camp zone `1:1` spawns 3 crawler/cultist/crawler mobs with 48/60 HP. MIRE MART adds two crawlers. The V2 card records this load-order override.
- `assets/monster_sheet.png` decodes at 128×96 with alpha. Existing V21 draw code reads 32×32 frames and 3/4 preview draws 38×38. There is no accepted 1280×720 or 390×844 creature combat visual capture in this pass.
- Replay/duplicate award settlement and live two-client leader handoff remain UNKNOWN/SUSPECTED test gaps, not confirmed bugs.

## Two-AI review and regression evidence

An independent read-only AI reviewed V1, actual source, snapshots, existing tests and visual bounds, then checked the V2 draft. The reviewer did not edit files or execute tests. Its actionable review notes led to the card's current-vs-planned split, updated snapshot fields, cooldown timing clarification and conservative replay-risk wording.

This pass serially ran and passed: `mob-attack-windup-v1.test.mjs`, `mob-cooldown-authority-handoff-v1.test.mjs`, `awakening-world-logic-hardening-v1.test.mjs`, `core-smoke.test.mjs`, and `combat-hit-feedback.test.mjs`. These are source/fixture evidence, not real network/device acceptance.

## Art concept result

Two original six-pose shoreline crawler concept boards were generated and viewed inline. The first skewed painterly and is **REVISE**. A second style pass achieved clearer hard edges and deliberate pixel clusters, so it can inform art direction; however, its pose cells remain insufficiently distinct for an animation sheet and have no agreed frame/anchor contract. Keep it **DRAFT / NOT A PROJECT ASSET / NOT A SPRITE SHEET**. A further pose-only edit failed to connect. Neither image was copied into the project, atlas or manifest; no runtime art acceptance is implied.

## Files and scope

- Added `docs/content-inbox/2026-10-05-creatures-ai-module-card-v2.md` with the five-game experience translation, current vs. future ownership, verified mob snapshots/timing, replay test gaps, a one-creature slice and source→frame→runtime art acceptance.
- Routed the canonical owner index and source crosswalk to V2 in `docs/SUCCESSOR_MODULE_MAP.md`.
- Added the current evidence and remaining limits to `docs/PROJECT_STATE.md`.
- No runtime code, tests, art files, manifests, save schema, Relay protocol, merge or deployment changed.

## Next step

Do not auto-promote the concept art. If the user wants to continue the creature visual, make a more deliberately pixel-clustered concept and inspect it at full view before discussing source dimensions or asset intake. A code task needs one explicitly selected, reproducible Creature behavior target and a failing regression before the smallest fix.
