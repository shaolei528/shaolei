# Creature windup and telegraph QA review — 2026-10-04

**Status:** focused source/fixture review passes; player-readability and live co-op acceptance remain UNKNOWN. This review did not modify the combat/render implementation.

## Current working-tree behavior verified

- `modules/combat/mob-combat.js` starts a bounded windup before a contact hit: crawler 0.8s, cultist 0.95s, watcher 1.1s. The existing cooldown begins with the windup. If the target leaves reach or line of sight, the pending windup is canceled; if it completes, damage is applied once through the existing `applyMobDamage()` path.
- The negative `m.phase` value is also the preview/snapshot intent marker. Periodic and full-world mob snapshots carry it; the receiver preserves the signed value. Rendering reads that state and draws an amber ring/tick. Sprite animation uses the absolute phase so the negative marker does not select an invalid frame.
- This keeps ownership aligned in source: Combat & Creatures owns target/range/LOS/timing and damage; Hit Feedback/Rendering presents the pending intent. The visual cue does not itself apply damage.

## Checks run against the latest observed files

Passed serially: `tests/mob-attack-windup-v1.test.mjs`, `tests/mob-cooldown-authority-handoff-v1.test.mjs`, `tests/awakening-world-logic-hardening-v1.test.mjs`, `tests/combat-hit-feedback.test.mjs`, and `tests/module-sort.test.mjs`. Syntax checks passed for `mob-combat.js`, `hit-feedback.js`, `base-renderer.js`, and `successor-renderer.js`.

`module-sort.test.mjs` briefly failed during concurrent edits because the root `game-render.js` aggregate lagged the split renderer sources. A later check passed after the shared worktree updated. This review did not edit the aggregate; retain byte-identical reconstruction as a compatibility gate for older entrypoints.

## Runtime limits

The guarded preview's `FIGHT · QA` shortcut teleported the player into a dense MIRE MART mob group and quickly reduced health; this is a QA shortcut, not a natural encounter or evidence of a combat balance defect. The player was returned to camp and the preview reloaded; the resulting state showed the initial 100/100 health, 100/100 hunger and sanity, 2 food, Relay blocked and memory-save shim. No persistent save or network room was used.

The captured encounter was too compressed to accept the cue's readability, and was not a natural-input test. Test fixtures prove timing/cancel branches and unchanged values; they do not prove desktop/phone human reaction time, sightline clarity, enemy-intent comprehension, physical touch behavior or two-client synchronization. Mark those **UNKNOWN** until a controlled playable encounter is available.

Branch/HEAD remained `fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`. The worktree is shared and broadly dirty. No code, art, assets, tests, commit, push, merge or deployment was changed by this QA review.
