# Handoff: Camp Guide task follows live equipment - 2026-10-05

## Verified repository context

- Repository: `shaolei528/shaolei`; branch `fix/awakening-production-gate-qa-findings-v1`; HEAD at review start `54d294abc13dd19ee53b56563fe43aaecc81b9ba`.
- The shared working tree has many modified and untracked files of unknown provenance. Only `modules/input/interaction-v12.js`, `tests/interaction-guide-task-v12.test.mjs`, `docs/PROJECT_STATE.md`, and this handoff were intentionally edited for this fix. Do not attribute unrelated changes or clean them up.
- The active responsibility is Interaction & Gathering. Quest & Narrative supplies the objective wording; Items & Inventory supplies read-only current inventory facts. The guide is presentation only and does not change authoritative game state.
- `index.html` redirects to `prototypes/successor-3-4/live-candidate.html`. Source inspection confirms this candidate fetches and boots the full `survival-v21.html` module list before injecting the camera adapter and successor renderer, so Interaction V12 is on the root candidate path. This is route wiring evidence, not a rendered guide verification.

## Confirmed issue and repair

- In the guarded 3/4 preview after death recovery, the equipped Bone Knife and LEAVE HOME retry state were present, while the Camp Guide still told the player to gather starter materials and craft another knife. The footer also displayed a damaged-encoding task string.
- `currentTaskAdvice()` now reads the current wood, stone, food and knife values. An equipped knife points to MIRE MART and the two-shard trip; no food recommends resupply. Missing materials show their counts; ready materials point to the existing workbench. `currentTaskText()` also points to MIRE MART when the knife is equipped.
- No quest, inventory, save, combat, Relay, event, payload or sync behavior changed.

## Checks

- **PASS:** `node tests/interaction-guide-task-v12.test.mjs`
- **PASS:** `node tests/interaction-v12.test.mjs` (`shared` context entry, harvest, guide interaction, joystick/modal movement and shared mobile action checks)
- **PASS:** `node --check modules/input/interaction-v12.js`
- The focused test executes extracted task-advice/status functions against equipped, no-food, missing-material and ready-to-craft states; it also checks that task dialogue uses the dynamic advice.

## Preview play evidence and remaining unknowns

- Earlier guarded-preview play verified natural material collection, the existing workbench recipe, and Bone Knife equip. A subsequent north-road attempt reached the REACH MIRE MART objective and ended in death before POI arrival. Normal return restored HOME and retained the equipped knife; the objective became LEAVE HOME for retry.
- At the time of the latest run, HOME showed HP 100 and food 2; the north-road objective was interrupted by death. Attack result is UNKNOWN. MIRE MART, shards, return-with-loot and growth were not tested.
- The browser tab was not reloaded after this source fix to preserve its memory-only state. The newly rendered advice is therefore **not browser-verified yet**. Mobile, production save, actual Relay, second client and physical-device acceptance remain UNKNOWN.
- On the next continuation the previously retained tab ID was absent from the browser inventory, and the second preview tab was already claimed by another browser session. No candidate tab was reopened because navigation would create a fresh page and lose the previous memory-only state. Current preview play state after that tab disappeared is UNKNOWN.
- Scene quality remains REVISE; mechanics tested through developer-assisted projected step inputs are QA-assisted preview evidence, not ordinary player acceptance.

## Recommended next action

Open the live candidate for a fresh, clearly labeled preview run. Verify the Guide dialogue with an equipped knife and check the rendered result. Then plan a better-supplied retry and record each stage separately: exit HOME, reach MIRE MART, search/salvage, and return/grow. The previous tab state is unavailable, so do not claim it was preserved. Do not claim the complete loop until each stage is observed.
