# Natural preparation and workbench approach — 2026-10-04

## Verified guarded play

- Lead: **Integration & QA**. Collaborators: **Interaction & Crafting / Items** (native harvest and recipe), **UI & Input** (camera-projected joystick and native E), **Core State & Save** (memory-only preview guard).
- An independent Edge preview tab (`122977083`) was used so existing Fight / Supply QA tabs were not controlled. It showed `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`, `RELAY BLOCKED`, `MEMORY SAVE SHIM`, and initially `real save unchanged=true`.
- Starting from HOME with 0/4 wood and 0/3 stone, developer preview buttons `NEAREST WOOD · QA`, `NEAREST STONE · QA`, and `TO WORKBENCH · QA` issued ordinary projected screen joystick input. No teleport/location button, coordinate write or inventory injection was used.
- Native E interactions gathered materials one at a time. HUD progressed through wood 1/4, wood 2/4, stone 1/3, stone 2/3, stone 3/3, wood 3/4, and finally wood 4/4 / stone 3/3. The PREPARE objective then changed to “前往营地西南侧工作台制作骨刃”.
- After selecting `TO WORKBENCH · QA`, last successfully observed HUD position was `(2270,2558)` while movement input showed `toward workbench · QA`. The authored V21 workbench is `(2195,2535)`, so straight-line separation at that observation was about 78 units, within the V12 workbench interaction radius of 92. This is an approach observation only; native E, recipe panel, and crafting were **not observed**.
- Each gather was locally reflected in HUD. The page was a memory-shim preview with Relay blocked; no actual co-op, server save or permanent progression was involved.

## QA checks and interruption

- **VERIFIED pass:** `safe-return-localization.test.mjs`, `interaction-v12.test.mjs`, `interaction-retry-idempotency-v1.test.mjs`, `awakening-expedition-loop-v1.test.mjs`, `awakening-world-v1.test.mjs`, `successor-camera-adapter-v1.test.mjs`, and the current `successor-natural-route-v1.test.mjs`; JS syntax and scoped diff checks pass.
- The route test's earlier assertion failure is resolved in the current shared untracked fixture: it now extracts the full `routeToResource` source line instead of truncating at the first closing brace. The updated route/collision fixture passes. File ownership remains unknown; this review did not modify the renderer or fixture.
- Browser access was interrupted by a repeated `Unable to load browser request-header policy` error. Inventory temporarily returned an empty tab list and direct rebinding to the known tab ID failed with the same policy error. This does **not** prove the page closed or its memory state was lost. Last read occurred during approach to the workbench; do not open another replacement tab solely to guess/resume state until browser access can read the existing one.

## Remaining scope

- Bone Knife crafting, leaving HOME naturally, MIRE MART approach, search/fight, 2-shard salvage, natural return and HOME growth remain **UNKNOWN / incomplete**.
- Live return-statistic toast, mobile/device acceptance, production art activation and two-client Relay remain **UNKNOWN**. The previously inspected desktop preview remains **REVISE** for repeated terrain, small legacy sprites and developer overlays.
- Next: rebind tab `122977083` when browser policy access works; inspect the current HUD before any action. If still near the workbench, press the native E interaction, verify material costs and recipe result, then continue the route only with freshly observed state.

## Worktree boundary

- Branch / HEAD at session check: `fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`.
- Worktree remains broadly dirty, including unknown-provenance untracked successor renderer/tests and concurrent protocol/gameplay edits. This continuation did not modify the preview renderer, route test, save data, production manifest, Relay protocol, or any files outside its own prior safe-return/localization work and this additive handoff/state note.
