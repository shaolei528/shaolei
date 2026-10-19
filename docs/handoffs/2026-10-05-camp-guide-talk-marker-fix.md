# Camp Guide talk-marker synchronization fix

Date: 2026-10-05 (Asia/Rangoon)
Owner: SafeCamp-owned Guide state; Interaction V12 consumes the interface
Status: confirmed local UX bug fixed; browser/mobile acceptance UNKNOWN

## Reproduction and root cause

V21 loads `modules/safe-camp/game-v7-patch.js` before `modules/input/interaction-v12.js`. SafeCamp initialized a closure-local `guideTalked` value from `abyssal_guide_v7` and used it to decide whether `drawGuide()` displays `!`. V12 replaces the original interact button and handles Guide talk through `openGuideDialog()`, which previously wrote the same localStorage key without updating SafeCamp's closure. The UX localization module read storage for quest text, but that did not update SafeCamp's in-memory marker state.

The cause was reproduced from the actual source fragments in a VM, and a parallel read-only audit independently verified the active loader and button-replacement path. `git show HEAD:` showed the behavior already existed on the branch base.

## Fix

- SafeCamp's existing `ABYSSAL_CAMP_GUIDE_V1` now owns `markTalked()`. It changes the closure-local flag and writes the existing `abyssal_guide_v7` key.
- Interaction V12 calls the Guide state API when present. It keeps the former direct key write only as a compatibility fallback.
- Root/category mirror pairs (`game-v7-patch.js`, `interaction-v12.js`) remain byte-identical. Existing unknown-provenance changes elsewhere in these files were preserved.

No schema, migration, quest, inventory, Relay, save ownership, collision, production art or renderer behavior changed.

## Verification

- `tests/camp-guide-talk-sync-v1.test.mjs`: actual source-owned API and entry functions in a VM; confirms `!` before dialogue, existing key persistence, immediate state sync, and no `!` after dialogue in the same session.
- Focused pass: `successor-camp-guide-render-v1`, `interaction-guide-task-v12`, `interaction-retry-idempotency-v1`, `core-smoke`, and `module-sort`.
- Full serial suite: **60/60 `tests/*.test.mjs` passed**.
- Browser/mobile rendering, dialog comfort/readability, physical touch and real multiplayer were not tested; remain UNKNOWN.
