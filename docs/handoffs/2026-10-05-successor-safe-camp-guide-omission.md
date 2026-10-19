# Successor SafeCamp Guide render check — 2026-10-05

## Scope and owner

- **Lead:** Rendering & Camera.
- **Partners:** Safe Camp, Interaction & Gathering, NPC & Social, Integration & QA.
- **Interface:** renderer reads the existing `window.ABYSSAL_CAMP_GUIDE_V1.getSnapshot()` value supplied by `modules/safe-camp/game-v7-patch.js`; the position and interaction behavior remain owned by Safe Camp and Interaction.
- **Files inspected:** `prototypes/successor-3-4/successor-renderer.js`, `modules/safe-camp/game-v7-patch.js`, `modules/input/interaction-v12.js`, their root aggregate counterparts, `survival-v21.html`, and the narrow successor guide fixture.

## Findings

- **REPORTED earlier:** a local guarded successor HOME screenshot showed the player and fire but no Guide actor. At that time the renderer's draw list did not include the local NPC.
- **VERIFIED current source:** the renderer now requests the SafeCamp Guide snapshot only in zone `1:1`, inserts it into the common depth-sorted actor list, and passes that snapshot to the normal actor renderer. The Guide position still has one owner; no duplicate coordinates, quest state, save fields, or network messages were added.
- **Change provenance:** the renderer addition and newly present guide test were already in the shared worktree at the start of this check. Their author is UNKNOWN. This check did not claim them as authored.
- **CONFIRMED fixture defect / narrow repair:** `tests/successor-camp-guide-render-v1.test.mjs` expected a compact one-line expression and omitted the semicolon after `list.push`, although the current renderer uses a multiline expression. Updated only that assertion to accept whitespace and the optional semicolon; preserved its remaining assertions.

## Verification

- `tests/successor-camp-guide-render-v1.test.mjs` — PASS after the assertion correction.
- `tests/interaction-v12.test.mjs` — PASS.
- `tests/interaction-guide-task-v12.test.mjs` — PASS.
- `tests/successor-camera-adapter-v1.test.mjs` — PASS.
- `tests/successor-live-candidate-v1.test.mjs` — PASS.
- `tests/successor-preview-live-gate-v1.test.mjs` — PASS.
- `tests/successor-natural-route-v1.test.mjs` — PASS: the collision-checked natural path still reaches the outside POI.
- `cloudflare/test.mjs` — PASS: canonical identity and existing Relay compatibility fixture.
- Syntax checks for the renderer and SafeCamp module — PASS.
- Current static package rebuilt as `.cloudflare-site-074ddef88185`: 56 allowlisted files, no missing files or V17/test/docs/intake paths; QA flag remains false and the packaged V21 top-level redirect remains present.
- The browser refused the loopback page with `ERR_BLOCKED_BY_CLIENT`; no fresh visual or touch-device acceptance is claimed. The Guide's display size, overlap, distinctness and whether the interaction prompt aligns with the sprite remain UNKNOWN.

## Boundary and next check

No player state, persistence, combat, Relay protocol, terrain collision, or art asset changed. Review the Guide on the exact packaged page at desktop and phone viewport sizes before calling this player-visible fix accepted. If the shared renderer change does not display the actor at the expected foot position, inspect the 3/4 camera projection and existing Guide foot anchor before changing coordinates.
