# Handoff — Combat & Weapons Module Contract V2

Date: 2026-10-05  
Status: DRAFT / NOT IMPLEMENTED; documentation pass only.

## Baseline and evidence

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- The shared worktree is broadly dirty, with mixed/unknown provenance. No unrelated changes or files were cleaned, overwritten or attributed to this pass.
- Read the active combat card, canonical successor map, project charter/state, V21 boot list, combat/creature/network/survival files and MIRE MART expedition contract. An independent read-only review also inspected current ownership and test boundaries; that reviewer made no edits or code execution.
- The current implementation and target ownership were explicitly separated. `player-combat.js` still combines attack handling with mob HP/respawn/reward effects; `inbound-events.js`, Survival status and lifecycle divide player damage/needs/death behavior. The planned canonical Creature/Survival/Loot boundaries are not yet fully implemented.

## Verification this pass

Eight targeted tests were run serially and passed: `core-smoke`, `awakening-world-logic-hardening-v1`, `combat-hit-feedback`, `combat-presentation-retry-idempotency-v1`, `playable-slice-combat-presentation-v1`, `mob-attack-windup-v1`, `mob-cooldown-authority-handoff-v1`, and `awakening-expedition-loop-v1`.

These fixtures do not establish live dual-client combat consistency, physical mobile input/audio feel, reward idempotency across all duplicated/out-of-order events, or accepted combat art at 1280×720 and 390×844.

## Documentation result

- Added `docs/content-inbox/2026-10-05-combat-weapons-module-card-v2.md` with five-game experience translation, current-vs-planned owner boundaries, high-detail pixel readability gates, regression limits and a narrow future-task prompt.
- Routed the canonical owner index and source crosswalk to V2 in `docs/SUCCESSOR_MODULE_MAP.md`.
- Recorded the evidence, limitations and art status in `docs/PROJECT_STATE.md`.
- No runtime code, tests, image assets, manifest, save schema, Relay protocol, merge or deployment changed.

The requested original high-detail pixel combat concept was attempted twice through built-in image generation; both attempts failed to connect. No image was produced or claimed. Existing combat image concepts remain REVISE / NOT PROJECT ASSETS; true runtime visual acceptance remains UNKNOWN.

## Recommended next step

Keep this card as a DRAFT task-routing contract. A future isolated combat concept should be generated and inspected as a concept before anyone proposes asset intake. Separately, any combat implementation needs one user-selected reproducible target, a failing regression first, and a narrow diff with adjacent regression evidence.
