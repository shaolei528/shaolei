# Handoff — Character & Progression module contract V2

Date: 2026-10-05 (Asia/Rangoon)  
Status: documentation-only; no Character runtime, test, save, Relay or art changes.

## Evidence basis

- Repository: `C:\Users\MECH\Documents\ChatGPT\游戏编程\abyssal-wake-integration`
- Branch / HEAD rechecked: `fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`.
- The shared working tree remains dirty with mixed/unknown-provenance source, tests, and untracked files. Preserve all of it; this note does not assign provenance outside its listed documentation edits.
- Inspected active `survival-v21.html` loader, `modules/core/runtime-state.js`, `modules/survival/gameplay-v9.js`, Character V1, `modules/items/inventory-transactions-v1.js`, `modules/crafting/crafting-processing-v1.js`, owner map, targeted tests and current successor visual handoffs.

## Findings

- Limited search of inspected V21/successor modules and tests found no broad XP, player-level, skill-point or character-growth API. V21's `me` name/session/position, Survival needs and Inventory `knife`/`lantern` bits are implementation facts; they do not prove a separate Character owner exists.
- The new inventory transaction bridge settles bounded crafting changes. It is not a Character progression/unlock service.
- Core State & Save V2's corrupt-V5-to-V4 fallback fix adds no Character save fields or schema changes.
- Browser previews at 1280×720 and 390×844 currently mark the 3/4 scene REVISE for coarse/repetitive terrain and small, low-detail actors; the mobile view also has crowded UI. This is not physical-device acceptance or new character-art approval.
- An independent read-only review found V1's ownership wording and current-state snapshot stale. V2 reconciles Character semantic identity/build/progression with the canonical map, distinguishes Inventory equipment from character unlocks, reflects Save V2 and the new crafting bridge, and preserves all five-game experience translations without selecting a leveling design.

## Changes and checks

- Added `docs/content-inbox/2026-10-05-character-progression-module-card-v2.md`; retained V1 as history.
- Updated the canonical card index and V21 source crosswalk in `docs/SUCCESSOR_MODULE_MAP.md`.
- Added a dated status entry to `docs/PROJECT_STATE.md`.
- No XP curve, character art, code, API, test, save field, Relay event or production asset was added.
- Passed this turn: canonical module routing, `player-save-v5-migration`, crafting transaction regression, successor live-candidate route and Guide render-source tests. These static/fixture tests do not prove character appearance or progression gameplay.

## Next work

For an implementation task, begin with CHAR-0 read-only source/state map, then a single user-selected visible behavior. Do not bundle XP, classes, skills, unlocks, panel UI, persistence and co-op. Any visible art must use the formal renderer/asset contract and pass source-to-runtime sharpness/readability at both target viewports; the current scene remains REVISE.
