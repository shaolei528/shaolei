# Combat warning cue single-draw fix — 2026-10-06

## Scope and owners

- **Lead:** Animation & Presentation, responsible for rendering the confirmed monster windup cue once per frame.
- **Partners:** Combat & Weapons supplies the synchronized negative-phase state; Rendering & Camera owns draw order and culling; Integration & QA verifies the composed result.
- **Interface:** a mob's negative `phase` signals an active windup. The renderer consumes that signal and draws the cue. The presentation layer does not decide attack timing, damage, hit authority, cooldowns, rewards, saves, or network state.
- **Files:** one duplicate cue call was removed from `modules/render/base-renderer.js`; one assertion was changed in the pre-existing untracked `tests/mob-attack-windup-v1.test.mjs`. Other runtime behavior and existing shared-tree work were preserved.

## Finding and repair

**CONFIRMED:** V21's base `drawMobs()` called the exported windup cue. The later `modules/combat/hit-feedback.js` wrapper then drew the same cue after the base frame. A VM composition with one winding-up mob reproduced two cue ellipse calls in one frame.

Removed the base-renderer duplicate and retained the frame-level cue pass. The 3/4 successor has its own frame renderer and still calls the shared cue once. Negative phases continue to be handled safely by mob sprite animation.

## Verification

- Behavioral VM reproduction: cue draw calls changed from 2 to 1 for one active mob in one frame.
- Serial passes: `tests/mob-attack-windup-v1.test.mjs`, `tests/combat-hit-feedback.test.mjs`, `tests/combat-presentation-retry-idempotency-v1.test.mjs`, `tests/playable-slice-combat-presentation-v1.test.mjs`, `tests/mob-cooldown-authority-handoff-v1.test.mjs`, and `tests/weapon-presentation-v1.test.mjs`.
- `node --check modules/render/base-renderer.js` passed; `git diff --check` found no whitespace errors (Git reported existing line-ending notices).

**Limits:** these are VM/source regressions. Actual screen pixels, mobile layout, player readability and physical-device presentation remain unverified; the terrain-art verdict remains **REVISE**. No save, Relay protocol, deployment, cleanup, or art files changed.
