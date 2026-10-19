# Guarded successor preview start gate blocker - 2026-10-04

## Verified observation

- Integration & QA rechecked the successor preview in a new, independent Edge tab (`122977165`) after the prior tab could not be rebound. This new run reset the preview-only memory state to HOME with 0/4 wood and 0/3 stone; previous tab progress was not presumed recoverable.
- The preview showed `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`, `RELAY BLOCKED`, and `memory save shim`. The in-game state had already loaded into HOME: the V21 task HUD showed PREPARE, inventory and camp UI were present, and pressing E at the visible camp prompt produced the normal rest feedback.
- The in-frame entry screen nevertheless remained visible. The successor renderer sets `started=true`, hides `#gate` and reveals `#game` when it installs, while the guarded preview's outer loader already set `started=true` before loading the shell module. Therefore the shell entry flow did not transition to the game surface. QA route buttons were mounted but hidden because no start flow exposed the QA nav.
- Clicking the exposed “先准备” control changed only the objective hint; it did not clear the entry surface. Clicking the visible “进入安全营地” location did not clear it either. A direct canvas coordinate click on the joystick and ArrowUp key did not produce a visible movement or resource change. No material gather, craft, POI trip, combat or return occurred in this restarted tab.
- Browser visual evidence was the screenshot with the island, avatar already at the campfire, onboarding/start cards, resource HUD and the `先准备` button. The mismatch is reproducible in this guarded local preview, but production menu behavior is UNKNOWN.

## Ownership and scope

- Lead: **Integration & QA**. Collaborators: **Core State & Save** (guard invariants), **UI & Input** (entry and input surface), **Rendering & Camera** (preview surface state), **Interaction & Crafting / Items** (resume the native prep loop only after entry works).
- Candidate fix scope, not yet implemented: `prototypes/successor-3-4/preview.js` only. Preserve the in-memory storage shim, WebSocket block, asset guard, and pre/post real-storage equality check. Do not patch production shell modules or V21 runtime to paper over a preview-only lifecycle mismatch.
- Interface boundary: the preview bootstrap may invoke the already-mounted start action only after the successor renderer is installed and real storage is confirmed unchanged. Game state, resources and save/network rules remain owned by their existing V21 modules.

## Acceptance and next action

- Start with a fresh guarded preview; verify the start surface is gone, HOME UI is interactive, Relay remains blocked and `realStorageUnchanged=true`.
- Use only visible UI navigation, ordinary projected joystick movement and native E interactions to gather 4 wood / 3 stone, approach the workbench, inspect the Bone Knife recipe and verify crafting results. Then resume HOME → MIRE MART → gather/combat → return.
- Do not claim the real gameplay loop is accepted from this run. Desktop visual quality remains REVISE; mobile, production art activation, durable save and two-client Relay remain UNKNOWN.
- No shared production/gameplay files, tests, manifests or save files were changed during this reproduction. Worktree has many concurrent dirty and untracked paths with ownership unknown.

## Reassessment and current evidence - 2026-10-05

- The earlier diagnosis above was **incorrect**. `先准备` is the in-game objective hint, not an entry-screen button. `game-shell-v1.js` is loaded after `mountUI()` replaces the page body, so the claim that its cached `#gate` necessarily referenced a detached node was not supported by the actual boot order. The initial screenshot and UI tree already showed the running HOME game, resources, interaction prompt and task HUD.
- QA navigation is hidden by default through `AW_DEV_QA=false` in the current preview source and is required to stay hidden by the existing camera-adapter regression. That was an intentional guard, not proof that the game was trapped at its entry screen.
- Therefore the supposed start-gate bug is **NOT CONFIRMED** and should not be reported as fixed. No production/runtime start failure was demonstrated. The additional post-install live DOM visibility check in `preview.js` is a guarded-preview defensive check; it only runs after a real-storage equality check, keeps the Relay block and memory shim, and does not establish that a defect existed.
- Browser play did show the game can load into guarded HOME with `real save unchanged=true` and Relay blocked. A sequence of preview STEP inputs later showed the authored MIRE MART scene/prompt, then a later read returned to HOME; no material, craft, combat or salvage was verified. The precise movement/zone transitions during that sequence are **UNKNOWN** and should be re-observed from a fresh state before drawing gameplay conclusions.
- **VERIFIED checks on 2026-10-05:** `node --check prototypes/successor-3-4/preview.js`, `node tests/successor-preview-live-gate-v1.test.mjs`, `node tests/successor-camera-adapter-v1.test.mjs`, and `node tests/successor-natural-route-v1.test.mjs` pass when run serially. The scope-specific `git diff --check` passes.
- Next: inspect the active page state before input; use regular game input only. If controls appear inert, record position and input indicators and distinguish browser-focus/input capture from a code defect before changing source.
