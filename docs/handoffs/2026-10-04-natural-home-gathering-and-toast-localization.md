# Natural HOME movement and gathering recheck — 2026-10-04

## Verified guarded browser play

- Lead module: **Integration & QA**. Collaborators: **UI & Input** (projected joystick and E intent), **Survival & Life** (return statistic), **UI & Localization** (toast translation), **World & Terrain / Interaction & Crafting** (camp resource placement and native harvest).
- An independent Edge tab was created for this check; existing parallel QA tabs were not controlled. It loaded the local successor preview at viewport 1490×810 with an embedded 1100×709 game view.
- **VERIFIED guard before play and after gathering:** the page identifies itself as `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`, the inner HUD says `LOCAL PREVIEW · RELAY BLOCKED` and `MEMORY SAVE SHIM`, and the outer guard reports `realStorageUnchanged=true`. No Relay or real save was used.
- **VERIFIED ordinary movement:** starting HOME coordinate `(2400,2470)` changed through screen-direction input to `(2118,2252)`. The move used the visible preview joystick and bounded direction buttons; the renderer's QA position teleport buttons were not used.
- **VERIFIED native gathering:** the HUD showed `【互动】采集木材`; one ordinary `E` interaction changed wood from 0 to 1 and PREPARE from `木材 0/4` to `木材 1/4`. Food later ticked from 100 to 99 during preview time; HP and sanity stayed 100. No inventory or world coordinates were injected.
- At `(2139,2251)`, one E press correctly reported no nearby target. The effective `modules/safe-camp/game-v7-patch.js` places the first wood at `(2050,2255)`, about 89 units away, outside the V12 82-unit interaction threshold. After moving to `(2118,2252)`, distance was about 68 and native E harvesting succeeded. This observation does not establish an interaction bug.
- **VERIFIED visual status: REVISE.** The rendered HOME still uses legacy low-detail sprites, repeated terrain clusters, and prominent developer controls/status text. The screenshot was desktop preview only; no mobile/device acceptance was performed.
- Browser console warning/error query returned an empty list. The player remains HOME in the independent preview; Relay is blocked and the memory save shim remains active.

## Code change and regression evidence

- The earlier Survival & Life toast wording fix was followed by one adjacent **CONFIRMED localization gap**: `ux-cn-v11.js` has an English-to-Chinese toast adapter, but did not recognize the new neutral `Safe return recorded · total N` text. Added a count-preserving Chinese mapping. The real expedition-completion translation is unchanged.
- Added `tests/safe-return-localization.test.mjs` to assert neutral source wording, Chinese count mapping and unchanged completion wording.
- **VERIFIED pass:** safe-return localization, ready localization, interaction V12, interaction retry/idempotency, expedition loop, MIRE MART world, camera adapter, JS syntax checks and scoped diff check.
- **VERIFIED test defect in an untracked parallel file:** `tests/successor-natural-route-v1.test.mjs` fails its route-bearing assertion. Its extractor `rendererSource.match(/function routeToResource\(type\)\{([^}]+)\}/)` stops at the nested `if(!target){...}` block before the later `adapter.project(...)`. The current untracked renderer source does contain that projection call after the block. This is a fixture-extraction issue, not evidence that the route code lacks camera conversion. The test and renderer are parallel, untracked work and were preserved without edits; update the extractor with its owner before relying on that test.

## Remaining UNKNOWN / next step

- This was only the first of 4 required wood and 3 required stone. Bone Knife crafting, MIRE MART travel, fight/search, 2-shard salvage, natural return, HOME growth and permanent persistence were not tested.
- Live display of the new neutral safe-return toast was not triggered; its translator is covered by source regression only.
- Mobile controls/visuals, production art activation, public Relay and two-client co-op remain UNKNOWN. Authored art remains preview-only / REVISE.
- Suggested next QA: continue from an observed HOME position with ordinary controls and native E interactions; record each stage. Do not count developer location teleports as route evidence.

## Worktree boundary

- Branch / HEAD: `fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba` at start of check.
- Broad worktree edits remain of unknown ownership. This follow-up edited only the known Survival toast and Chinese localization mapping and added their focused regression plus this handoff/state note. It did not modify the concurrent renderer/test, shared preview data, production manifest, real storage or network protocol.
