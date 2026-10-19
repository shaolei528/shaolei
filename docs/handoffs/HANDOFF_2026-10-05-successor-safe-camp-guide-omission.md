# Handoff — successor SafeCamp guide presentation omission

Date: 2026-10-05 (Asia/Rangoon)
Repository: `shaolei528/shaolei`
Branch / HEAD: `fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`

## Finding

**CONFIRMED in the local guarded successor preview:** the Camp Guide has a talk interaction range but is omitted from the successor scene draw list, so the player can reach a guide prompt/dialogue without seeing the NPC in the 3/4 world.

## Evidence

- Browser: opened `http://localhost:8765/prototypes/successor-3-4/index.html?review=1`; outer badge says `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`, inner page says `LOCAL PREVIEW · RELAY BLOCKED`, and HUD shows the SafeCamp scene. The screenshot shows the player by the campfire and the local/remote player entity, but no Guide. This is a guarded development preview, not production acceptance.
- Legacy SafeCamp presentation: `modules/safe-camp/game-v7-patch.js` defines `GUIDE={x:2325,y:2370}`, `drawGuide()` draws a player sprite plus `GUIDE`/`!` labels, and the `drawCamp` wrapper calls it for zone `1:1`.
- Interaction: `modules/input/interaction-v12.js` retains a Guide target at the same coordinates and returns the talk prompt inside its interaction radius.
- Successor: `prototypes/successor-3-4/successor-renderer.js::render()` builds a scene list for camp props, Awakening POI props, resources, mobs, remotes, and the local player. It has no local-NPC/Guide actor entry. `preview.js` injects this custom renderer, which clears and repaints the scene, replacing the legacy visible draw path.

## Ownership and repair boundary

Lead: **Rendering & Camera**. Collaborators: **NPC & Social** (authoritative Guide snapshot/position), **Interaction & Gathering** (existing talk request) and Integration & QA.

Add the Guide as a read-only scene actor from the canonical NPC/location source and keep the existing interaction owner/range. Do not duplicate Guide coordinates in a second subsystem; do not change dialogue/quest authority, save, combat, input, or network contracts. Add a focused render-source/scene regression and check desktop/mobile occlusion and interaction alignment. This report does not implement the rendering fix.

## Status

Confirmed successor-preview presentation omission; no production claim. The browser preview is Relay-blocked and memory-save-only. Source/art files were not modified for this finding. Existing broad dirty work remains of unknown provenance and is preserved.

## Follow-up implementation and verification - 2026-10-05

- **VERIFIED current source:** `modules/safe-camp/game-v7-patch.js` now exposes `window.ABYSSAL_CAMP_GUIDE_V1.getSnapshot()` using the already existing Guide coordinates. Root `game-v7-patch.js` matches the module copy. `modules/input/interaction-v12.js` and root `interaction-v12.js` now read that same snapshot instead of maintaining a duplicate coordinate. The successor renderer adds the snapshot to the depth-sorted draw list as an actor only in HOME zone `1:1`.
- **VERIFIED guarded browser:** a separate preview session visibly showed the Guide sprite and “营地向导” label beside the fire. After ordinary joystick movement toward the Guide, the prompt changed to “与营地向导交谈”; ordinary E opened the existing dialogue. This is desktop preview evidence, not production acceptance. The original gathering tab was left untouched in a separate session.
- **VERIFIED regressions:** `tests/successor-camp-guide-render-v1.test.mjs`, `tests/interaction-v12.test.mjs`, `tests/interaction-retry-idempotency-v1.test.mjs`, `tests/module-sort.test.mjs`, `tests/successor-camera-adapter-v1.test.mjs`, and `tests/successor-natural-route-v1.test.mjs` pass. The Guide-render source fixture accepts normal whitespace/line breaks; renderer source need not be minified. Syntax checks and scoped `git diff --check` pass.
- **Boundary:** Rendering & Camera draws the snapshot; SafeCamp remains its existing location source; Interaction retains the talk request/range. No dialogue authority, quest/inventory state, save, combat or Relay contract changed. Dirty/untracked worktree provenance is mixed/UNKNOWN; preserve all unrelated files.
- **Remaining:** 390x844/mobile and physical-device appearance, occlusion at varied camera positions, production integration, real Relay and full gameplay loop remain UNKNOWN. Keep art **REVISE** for terrain repetition, coarse detail, small actor size and debug overlays. The Guide reuses the generic player sprite and relies on its name label for identity; a distinct NPC look remains a visual follow-up. A separate active preview is still gathering materials to verify the equipped-Bone-Knife Guide text.
