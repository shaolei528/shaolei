# Draft: Isolated 3/4 Camera Renderer Prototype

**Status:** ISOLATED PAGE IMPLEMENTED; VISUAL ACCEPTANCE NOT RUN

**Module lead:** Rendering & Art

**Coordinates with:** World & Terrain, UI & Input, Home & Building, Integration & QA

**Decision this prototype should support:** whether the user-selected 3/4 oblique view reads well enough at phone scale to justify a separate renderer-migration task.

## Repository facts

- `survival-v21.html` loads `modules/render/base-renderer.js`, `terrain-v21.js`, and `modules/render/render-v9.js` in its active boot list.
- `sx` and `sy` currently subtract the camera's world X and Y independently. `terrain-v21.js` draws axis-aligned 64×64 tiles. `render-v9.js` draws ground, camp, resources, mobs, remote players, then the local player; it does not depth-sort players against props.
- SafeCamp and MIRE MART already have separate presentation material to reference, but neither the current runtime nor its collision map implements the concept image's oblique projection.

These are visual-pipeline facts, not a proposal to change the live renderer.

## Current V21 integration risks — source review, 2026-10-04

- `terrain-v21.js` preserves the 64×64 art grid and overlays its 24×20 SafeCamp slice over legacy ground. `awakening-world-v1.js` adds 64×64 authored terrain and decals for the MIRE MART region. Outside those authored regions, the base renderer's 24×24 procedural ground remains visible. This is a real source-level reason different areas can look disconnected; neither terrain test nor a loaded image proves the whole world is visually unified.
- The active `render-v9.js` order is ground, landmarks, camp props, resources, mobs, remote players, then the local player. There is no shared depth sort by foot/contact point, so tall scenery cannot reliably pass in front of a walking character. A camera change must not alter collision or network coordinates to solve that visual problem.
- **Desktop aspect-ratio risk, source-derived; appearance UNKNOWN:** on Windows desktop the V19 layout can expand `.app` to at most 1100 CSS px. At a 1280×720 viewport, `.arena-wrap` is approximately 1100×618 CSS px; both canvas sizing helpers keep its backing bitmap at 360×520 because their height has a 520px minimum. CSS then scales horizontal pixels about 3.06× and vertical pixels about 1.19×. The canvas also declares `image-rendering: pixelated`, which prevents smoothing but cannot correct this unequal scaling. Mobile sizing follows the arena aspect more closely. Confirm with actual screenshots before changing the sizing code.
- **VERIFIED checks, 2026-10-04:** `node tests/terrain-v21.test.mjs`, `node tests/awakening-world-v1.test.mjs`, and `node tests/module-sort.test.mjs` each passed when run sequentially. They confirm the 64px tile contract, collision separation, legacy fallback, world slice and module order; they do not verify pixels at desktop/mobile display sizes.

## Proposed isolated test

Create a standalone, locally served page under `prototypes/camera-3-4-v1/`, with its own small HTML/CSS/JS files. It must not load `survival-v21.html` or any network, save, gameplay, or production-manifest module. Add a visible `VISUAL PROTOTYPE — NON-PRODUCTION` label.

Use one fixed 2:1 oblique projection in both scenes. For a prototype-local world point `(x,y)` relative to camera center `(cx,cy)`, map it to `(screenCenterX + (x-cx-y+cy)×0.5, screenCenterY + (x-cx+y-cy)×0.25)`. A 64×64 logical ground cell therefore projects to a 64×32 screen diamond. This is only a camera test; it does not require final terrain to use a strict tile-aligned isometric layout. Render the ground first; then sort a small list of complete visual objects by their logical depth key (`worldX + worldY`), using each character's foot point and each prop's ground-contact point. This allows the player to walk both behind and in front of one tall prop without changing any game collision or world-coordinate rules.

Use temporary crisp pixel blockouts at the current player scale (about 24×32 screen pixels) and one taller prop with a visible ground-contact footprint. Keep camera center and projection identical between scenes; use a scene selector rather than changing the angle to improve either composition.

### Scene A — HOME, daylight

- Compact coastal SafeCamp with a visible entrance and an uncluttered path.
- Include only a shelter edge, one work/camp prop, one resident, the player and a small warm light.
- Use simple crisp pixel-cluster blockouts or clearly suitable existing reference sprites. Do not promote the concept board or temporary graphics to production art.

### Scene B — OUTSIDE, dusk/night

- Nearby MIRE MART approach with a readable path and storefront silhouette.
- Use the same projection, tile scale and player scale as HOME; add the player's lantern, one restrained failing light and a small early-anomaly accent.
- Keep enough light on the path to see the return route. Do not add a fight or new threat behavior.

### Phone composition

- Evaluate in a 390×844 CSS-pixel viewport, with the game view and safe-area insets visible.
- Show a temporary left thumb area and compact right-side attack/interact/dash circles as screen-space overlays. They are visual placeholders; only the thumb area needs to move the prototype player.
- Include a desktop 1280×720 view for comparison. Do not redesign or replace the live HUD.

## Review gates

Record each as **PASS**, **REVISE**, or **UNKNOWN**, with a screenshot and one-sentence reason.

| Gate | PASS means |
|---|---|
| Phone-scale legibility | Player, resident, path and key prop remain distinct at 390×844 without controls covering the immediate play area. |
| Projection consistency | Both scenes use the same diagonal ground axes, object scale and camera framing; ground remains easy to read. |
| Occlusion | Moving the player across the test prop visibly changes front/behind order without popping or hiding the player's feet. |
| HOME/OUTSIDE mood | HOME reads warm and safe; OUTSIDE reads cooler and uncertain while its return path remains visible. |
| Pixel clarity | Temporary shapes stay crisp at intended size, use deliberate clusters and show no smoothing blur. |

The board cannot pass final-art quality, real collision, live-game movement, performance, or production-loading gates. Those remain **UNKNOWN** until their own scoped work exists.

## Deliverables and boundary

- The isolated page, its temporary blockout graphics, and paired phone/desktop screenshots.
- A short results table for all five gates and a recommendation: keep this camera direction, revise the prototype, or discard it.
- No changes to `survival-v21.html`, runtime modules, game assets, tests, manifests, collision, saves, Relay, or gameplay.
- No estimate or renderer migration in this prototype. If the camera passes, prepare a separate implementation task with migration risks and scope for the user to select.

## Acceptance procedure

1. Open the isolated page with network disconnected and confirm the prototype still works.
2. Switch between HOME and OUTSIDE; verify the projection and player scale remain identical.
3. Move the player across the test prop in both directions and inspect the foot-point sorting.
4. Capture 390×844 and 1280×720 views; review path, characters, prop and control-overlay readability.
5. Compare the resulting scenes with the user's concept for composition and mood, while treating all proxy art as non-production.

**Current result (2026-10-04):** `prototypes/camera-3-4-v1/` now contains a standalone canvas page, CSS, local-only static server and temporary blockout drawing code. `node --check` and local HTTP responses for the page/CSS/JS passed. The available Edge browser blocked the loopback page (`ERR_BLOCKED_BY_CLIENT`), and the browser-control policy rejected `file:` navigation and disallowed alternate routes around that block. No **runtime screenshot** was captured; `2026-10-04-camera-prototype-v1.png` is a generated concept board, not a game capture. All five visual review gates therefore remain **UNKNOWN**; there is no camera-migration recommendation yet. The page has no game runtime, gameplay, collision, save, Relay or production-asset imports.

### Live-game migration boundary (2026-10-04 source review)

- `modules/input/joystick.js` writes normalized stick values into `joystickState`; `modules/main-loop/simulation-update.js` currently applies them directly to world `me.x/me.y`. Under an oblique camera, screen directions need inverse projection at the input boundary. Keep `me.x/me.y` as world coordinates after conversion.
- `modules/network/outbound-sync.js` broadcasts world `me.x/me.y`; saves and interaction checks also use world positions. Never send projected screen coordinates over the network or store them in saves.
- `terrain-v21.js` collision and `modules/world/world-spatial-v1.js` geometry operate on world X/Y. A camera study or later renderer must transform drawing only; projection must not rotate collision geometry or derive collision from PNGs.
- `modules/main-loop/smooth-motion-v18.js` follows the predicted local player position. A future camera adapter must preserve that behavior and verify remote players remain aligned.

The migration boundary is therefore: convert touch intent into world movement once, retain world-space gameplay/network/save/collision state, and project world coordinates for drawing. This source review does not approve a live renderer migration; desktop/mobile captures and multiplayer alignment remain **UNKNOWN**.

### Static movement-mapping finding (2026-10-04)

**Concrete correction for a selected prototype task:** clamp/normalize the desired screen input `(u,v)` to unit length first, then apply the inverse projection directly, without normalizing the resulting world vector a second time:

```text
worldDX = speed * dt * (u + 2*v)
worldDY = speed * dt * (-u + 2*v)
```

This inverts the prototype projection, so the resulting screen displacement is exactly `(speed*dt*u, speed*dt*v)`. Treat keyboard arrows/WASD as the same desired screen directions before this conversion. Acceptance should compare projected displacement for full horizontal, vertical and diagonal input (equal lengths), plus partial analog input (proportionally shorter); also confirm the resulting world position remains finite and the input returns to zero on release/blur.

**REVISE before visual playtest; derived from source math, not browser observation.** The prototype projects world movement as `screenX = 0.5 × (worldX - worldY)` and `screenY = 0.25 × (worldX + worldY)`. Keyboard up/down currently move along equal world X/Y, which produces half the screen speed of left/right. The touch pad correctly applies the inverse projection, but then normalizes the result in world space; that also makes screen speed depend on direction. For example, a full horizontal pad input projects to about `0.707` screen units, while a full vertical input projects to about `0.354` units after normalization.

Before judging whether the camera feels good, movement should be normalized in screen space and then mapped back into world coordinates, or the prototype should explicitly label movement speed as uncalibrated. This is isolated prototype input math only; do not change live gameplay movement or network coordinates as part of the visual review. Projection axes, 64×64-to-64×32 diamond dimensions, and `x + y` depth key are internally consistent by source inspection, but occlusion and feel remain **UNKNOWN** until an actual run is visible.

## Browser review and source correction — 2026-10-04 addendum

**VERIFIED:** the existing isolated page was captured at 1280×720 with HOME and OUTSIDE selected, and at 390×844 with OUTSIDE selected. Results update the older "all gates UNKNOWN" note above:

| Gate | Current result | Evidence limit |
|---|---|---|
| Rough projection/composition consistency | PASS for blockout | Both scenes use the same 2:1 oblique projection; no final art or V21 world data |
| HOME/OUTSIDE mood direction | PASS for blockout palette | Warm HOME and cooler OUTSIDE are visible, but materials are flat |
| Ground/path readability | REVISE | Repeated high-contrast dark diamonds make the ground patchy and compete with the route |
| Pixel-art clarity/style | REVISE | People/buildings are geometric primitives; this is not representative production art |
| Static mobile overlay fit | PASS at 390×844 screenshot | No touch-response or device test was performed |
| Movement parity, occlusion, collisions, production display | UNKNOWN | No movement test and no V21 gameplay capture |

**VERIFIED source correction:** do not use the older desktop 360×520-stretch calculation as the current steady-state premise. The active boot path loads `render-v9.js`, then `platform-inventory-v19.js`; V19 sizes the desktop canvas to its arena, capped at 1100×820. At 1280×720, source/CSS estimates are 1100×618 for both the arena and backing bitmap. At 390×844, the mobile helper computes about 360×685 for an estimated 390×742 arena. Actual V21 gameplay/DPR/resizing behavior remains UNKNOWN. See `handoffs/2026-10-04-v21-canvas-sizing-source-recheck.md`.

**Next prototype work, if selected:** reduce the contrast and repetition in the ground blockout, make the route/shoreline continuity explicit, and replace screen-aligned rectangle people/buildings with contract-sized draft sprites and contact footprints. Keep the page isolated and non-production.
