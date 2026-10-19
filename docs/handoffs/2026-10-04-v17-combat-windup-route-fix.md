# Handoff: V17 default-route creature windup repair

Date: 2026-10-04 (Asia/Rangoon)

## Result

The local default entry (`index.html` -> `survival-v17.html`) loads `game-play.js` before `game-v7-patch.js`. The latter used to replace the combat updater with immediate contact damage. That duplicate override is now removed from both the root aggregate and its Safe Camp module source. The root `updateMobs` function was synchronized with the existing Combat module so V17 gets the same windup while retaining its starter-zone tuning, ward handling, and safe-camp spacing. The matching API export and optional interface-first dispatch make the aggregate reconstruct byte-for-byte; when V17 has not loaded the split Combat API, it falls back to its local updater. A small wrapper preserves the old `mob_hit` payload shape by discarding the optional mob timing argument.

## Ownership and boundaries

- Lead: Combat & Creatures (`game-play.js` remains the existing updater owner).
- Coordination: Safe Camp compatibility, Network & Co-op, Integration & QA.
- Interface: existing `updateMobs(dt)`, `applyMobDamage(target, kind)`, and mob `phase` sync.
- Touched files: `game-play.js` (Combat updater, API export, and dispatch), `game-v7-patch.js`, `modules/safe-camp/game-v7-patch.js`, `tests/mob-attack-windup-v1.test.mjs`, `tests/field-ward-duration-regression.test.mjs`.
- No new event, message field, save field, cadence, or backend behavior was added.

## Verification

- PASS: `mob-attack-windup-v1.test.mjs` exercises both module and V17 root combat update, including delayed damage and ignoring a remote player with an active ward; `mob-cooldown-authority-handoff-v1.test.mjs`, `combat-hit-feedback.test.mjs`, `playable-slice-combat-presentation-v1.test.mjs`, and `field-ward-duration-regression.test.mjs` also pass.
- PASS: syntax checks for root combat, both Safe Camp copies, and windup test; Safe Camp copies are byte-identical.
- PASS: `module-sort.test.mjs` verifies all 17 split parts reconstruct exactly, 14 mirrored copies match, and V21 load order/save key/Relay identifier assertions pass.
- PASS: all 48 `tests/*.test.mjs` files passed serially on the current local worktree. These fixtures do not prove browser/device acceptance or real two-client behavior.
- UNAPPROVED / UNVERIFIED existing worktree changes still add cooldown fields to `mob_hit`, periodic `mobs`, and full `world` payloads. This repair did not add them; no live two-client compatibility proof or protocol approval is present.
- UNKNOWN: actual V17 browser combat at desktop/mobile sizes and live two-client behavior.

Other existing worktree changes in `game-play.js`, network files and related tests have unknown provenance and were preserved.
