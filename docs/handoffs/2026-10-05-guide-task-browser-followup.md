# Camp Guide task-hint browser follow-up - 2026-10-05

## Repository and ownership

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- Lead: **Interaction & Gathering**. Quest & Narrative owns objective semantics; Items & Inventory owns inventory facts. Guide reads those values and presents advice; it does not mutate task/inventory state.
- The worktree remains broadly modified/untracked. Current root `interaction-v12.js` and `modules/input/interaction-v12.js` have byte-identical guide logic. Preserve unrelated edits and unknown provenance.

## Verified source and regressions

- Root `index.html` redirects to `prototypes/successor-3-4/live-candidate.html`; the candidate wraps the V21 runtime and injects the successor camera/renderer. The V21 load list includes `modules/input/interaction-v12.js`.
- **PASS:** `node tests/interaction-guide-task-v12.test.mjs`
- **PASS:** `node tests/interaction-v12.test.mjs`
- **PASS:** `node tests/interaction-retry-idempotency-v1.test.mjs` (50 retries, one interval/listener, one canonical harvest/save/UI path, root/module parity)
- **PASS:** `node tests/module-sort.test.mjs` (split source reconstruction remains byte-identical)
- **PASS:** syntax checks for both root and module Interaction V12 files, and scoped `git diff --check`.

## Guarded browser evidence

- A fresh `prototypes/successor-3-4/index.html` session displayed `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`, `LOCAL PREVIEW · RELAY BLOCKED`, and memory-only save behavior. It did not connect to the public Relay or use persistent game save.
- Starting from HOME / PREPARE (HP 100, food 2, wood 0, stone 0), normal visible joystick input approached the Camp Guide. Ordinary E interaction opened the dialogue. Selecting “我现在应该做什么？” rendered readable Chinese and the current requirement `木材 0/4 · 石头 0/3`.
- Continued with normal movement and E actions to collect three stone. The HUD and preparation objective both updated to stone 3/3. This was QA-assisted local desktop preview play, not ordinary player acceptance.
- The fresh session is browser tab `122977173`, marked for handoff. It is at HOME with wood 4, stone 3, food 2, HP 100, hunger 62. The task now points to the southwest workbench, but the player has not yet reached or used it. An earlier retained tab disappeared from browser inventory; its old state is UNKNOWN and was not overwritten.

## Not verified / next action

- The equipped-Bone-Knife advice has not yet been rendered in the live dialog. The new run has not collected wood, crafted the knife, or begun the expedition. That branch remains supported by source and VM tests only.
- No POI arrival, salvage, combat outcome, return/growth, mobile view, production save, physical-device or live multiplayer result is established. Scene visuals remain **REVISE** for coarse repetitive terrain, small actors and QA overlays.
- Continue the existing guarded tab naturally: reach the authored southwest workbench, craft/equip the knife, then reopen the Guide task page and verify the MIRE MART advice. Do not use QA teleports or claim completion of the expedition loop.

## Follow-up: movement input blocked in guarded desktop preview - 2026-10-05

- **Current observed state:** tab `122977173` still shows CAMP / PREPARE, HP 100, hunger 13, food 2, wood 4, stone 4, shards 0. Pressing E once successfully collected one nearby stone through the normal V21 interaction path. Repeated direction-key presses and brief joystick drags did not visibly change the player's rendered position or `【互动】采集石头` prompt; workbench interaction was not reached and no craft occurred.
- **Movement acceptance: UNKNOWN / BLOCKED by available input method.** Input source reads the joystick/key state during each simulation frame, while pointer-up clears the joystick immediately; the CUA drag and keypress actions are brief and do not expose a sustained key/pointer hold. This is a plausible explanation, not proof of a game defect. E reaching the same embedded game confirms the active preview and focus path. Do not classify movement as a confirmed gameplay bug from this run.
- **Safety:** no QA teleport, reload, persistent save, Relay connection, or source change was used. The game menu was opened then dismissed, leaving the memory-only run available for continuation; the tab is marked for handoff.
- **Next step:** continue only with an input method that can hold a direction across simulation frames, then resume natural movement from this state and use the interaction prompt to identify the workbench. Do not reset or reload unless the preview's memory-only run is explicitly expendable.

## Later continuation: tab expiry and source QA - 2026-10-05

- The browser inventory no longer contains tab `122977173`; reading its old handle returned “No tab with id”. The memory-only preview state is therefore unavailable. This does not affect persistent saves; the preview's local storage shim was in-memory only.
- Input source confirms the joystick vector is sampled in each V21 simulation frame and reset on pointer release. The available CUA drag/keypress actions do not provide a sustained hold, so movement remains UNKNOWN rather than a confirmed gameplay defect. A prior E action in the tab did collect one stone normally (stone 3 to 4), before the tab expired.
- A separate source QA pass verified the shared worktree's multi-frame FX correction: frame selection uses a mutable derived entry and does not mutate the selected manifest record. The focused two-frame/wrap test and neighboring art-mapping regression pass. Changes have unknown provenance and were not edited here. Details are in the matching `PROJECT_STATE.md` entry.
