# Responsive canvas aspect and sizing

**Status:** PARTIALLY IMPLEMENTED / VISUAL ACCEPTANCE BLOCKED. A narrow confirmed-stretch repair is in the shared UI; DPR, orientation and rendered-quality acceptance remain open.

**Lead module:** UI & Input

**Coordinates with:** Rendering & Art (pixel scale and camera framing), World & Terrain (world-to-screen contract), Integration & QA (responsive regression and screenshots)

## Verified source evidence

- `survival-v7.html` styles `.arena` to `width:100%; height:100%` and `image-rendering:pixelated`; `.arena-wrap` starts below a 102px header.
- `modules/input/platform-inventory-v19.js` expands the desktop `.app` to the viewport width, up to 1100 CSS pixels.
- Both `modules/core/runtime-state.js::resizeCanvas()` and `modules/input/mobile-fixes.js::fitPixelCanvas()` keep canvas backing width at 360 and clamp its height to a minimum of 520 pixels.
- At a 1280×720 CSS viewport, the desktop app/arena are approximately 1100×720 and 1100×618 CSS pixels, while the backing canvas is 360×520. The browser therefore stretches the image about 3.06× horizontally and 1.19× vertically. Nearest-neighbor display keeps edges from being smoothed, but does not preserve the picture's aspect ratio.
- At a 390×844 CSS viewport, the arena is approximately 390×742 and the backing canvas is approximately 360×685, so the two CSS scale factors are both about 1.08×.

Pre-repair baseline: unequal desktop scaling was **VERIFIED by source and layout calculation**. Live player-visible deformation remains **UNKNOWN** until an actual screenshot is inspected.

## Remaining scope

Unify the canvas sizing contract so mobile and desktop preserve the intended aspect ratio and pixel density. Define clearly whether renderer coordinates use CSS pixels or backing-bitmap pixels; account for device-pixel ratio without changing gameplay/world coordinates. Avoid fixing the stretch by forcing an unsuitable zoom or making the player/tiles disproportionately large. Keep CSS nearest-neighbor presentation and `imageSmoothingEnabled=false` for source sprites.

Likely touchpoints are the duplicate sizing helpers in `runtime-state.js` and `mobile-fixes.js`, desktop layout in `platform-inventory-v19.js` / `survival-v7.html`, and rendering/culling helpers that currently read `canvas.width` and `canvas.height`. No collision, save, movement packet, Relay, production art, or camera projection change belongs in this task.

## Implemented source fix - 2026-10-04

- **VERIFIED code path:** V17 and V21 both use the `.arena` CSS copied from `survival-v7.html`. The canvas now keeps nearest-neighbor rendering and uses `object-fit:contain` for fractional layout differences.
- **VERIFIED sizing contract:** `modules/core/runtime-state.js::resizeCanvas()` now sets bitmap width and height to the measured canvas CSS box. `modules/input/mobile-fixes.js::fitPixelCanvas()` delegates to that same function on resize/pageshow/orientation changes instead of restoring a fixed 360px width. Root mirrors `game-core.js` and `mobile-fixes.js` match their module sources.
- **VERIFIED isolated function run:** the fixture executes both core and mobile sizing functions. At 1280×720 the 1100×618 desktop arena uses a 1100×618 backing bitmap; at 390×844 the 390×742 arena uses a 390×742 bitmap. It also checks stable dimensions and nearest-neighbor CSS. It does not prove actual browser output or art readability.
- **PASS:** `tests/canvas-aspect-fit-v1.test.mjs`, related input/render/terrain checks, and all 49 `tests/*.test.mjs` files pass serially.
- **BLOCKED / UNKNOWN:** Edge reports `ERR_BLOCKED_BY_CLIENT` opening the loopback preview. No screenshot was obtained. DPR 1/2 output, orientation changes, actor/tile apparent size, HUD/control usability and actual visual quality remain unaccepted.
## Acceptance checks

1. Exercise CSS viewports 390×844 and 1280×720, including DPR 1 and 2 plus a resize/orientation change; the rendered world must not deform when the CSS arena changes shape.
2. Check actual character scale, 64×64 ground tiles, HUD/control hit targets, and visible world coverage at both sizes. Record screenshots and compare against the current output.
3. Add a focused regression for the single sizing contract; run the existing input/render/terrain checks serially.
4. Confirm that world positions, collision results, saved values, and network message shapes are unchanged. Do not enter a public Relay room as part of local visual verification without a separate user decision.

## Decision

The user authorized narrow fixes for confirmed bugs. This follow-up implemented only the shared responsive backing-size contract and regression fixture. Remaining rendering, DPR, device and screenshot work stays open; this is not production visual acceptance and does not authorize a renderer migration.


## Additional source check - 2026-10-04

- The active player renderer draws a 24x32 source cell at scale 1.18, or about 28x38 backing-canvas pixels. At the documented 1280x720 desktop arena estimate, CSS then expands this to about 86x45 screen pixels. The shape becomes very wide and short even though nearest-neighbor sampling preserves hard pixel edges; new character art cannot be judged fairly in that layout.
- Core `resizeCanvas()` still runs in the render loop; the mobile resize/pageshow/orientation hook now delegates to it instead of maintaining a second sizing formula.
- Keep actual screenshots as an acceptance requirement. Edge blocks the loopback preview with `ERR_BLOCKED_BY_CLIENT`; source calculations do not replace rendered visual checks.
