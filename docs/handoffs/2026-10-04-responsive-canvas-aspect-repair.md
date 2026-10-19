# Handoff: responsive canvas aspect repair

Date: 2026-10-04 (Asia/Rangoon)

## Finding and repair

The legacy bitmap used a fixed 360px width and a clamped backing height while CSS stretched it over the full arena. At a 1280×720 viewport, the desktop arena is about 1100×618 CSS pixels; that produced about 3.06× horizontal versus 1.19× vertical scaling. The 390×844 mobile arena was already close to uniform.

The shared canvas now uses responsive backing dimensions matching its measured CSS rectangle. The existing mobile resize/pageshow/orientation handler delegates to the same `resizeCanvas()` helper instead of independently restoring a 360px width. The canvas retains nearest-neighbor pixel rendering and uses `object-fit:contain` to cover fractional rounding. V17 and V21 both obtain this CSS from `survival-v7.html`.

## Ownership and boundaries

- Lead: UI & Input (canvas sizing).
- Coordinates: Rendering & Art (pixel density/camera framing), Integration & QA (viewport verification).
- Interface: existing canvas backing width/height consumed by renderer coordinate functions.
- Files: `survival-v7.html`; `modules/core/runtime-state.js` and root aggregate `game-core.js`; `modules/input/mobile-fixes.js` and root mirror `mobile-fixes.js`; `tests/canvas-aspect-fit-v1.test.mjs`.
- No world positions, collision, save fields, network messages, or sync cadence changed.

## Verification

- PASS: isolated VM fixture executes both sizing helpers at 1280×720 (1100×618 arena/backing) and 390×844 (390×742 arena/backing), and checks stable sizing/no repeated bitmap reset. Pixelated rendering remains enabled.
- PASS: `canvas-aspect-fit-v1.test.mjs`, `successor-camera-adapter-v1.test.mjs`, `platform-input-retry-idempotency-v1.test.mjs`, `platform-inventory-v19.test.mjs`, `terrain-v21.test.mjs`, `module-sort.test.mjs`; all 49 local test files also pass serially.
- BLOCKED / UNKNOWN: Edge returned `ERR_BLOCKED_BY_CLIENT` for the loopback preview. No browser screenshot or actual canvas output was obtained. DPR 1/2, orientation, actor/tile size, HUD/control usability and pixel density at actual device sizes remain unaccepted. Keep visual status **REVISE / BLOCKED** until actual target-size rendering is inspected.
- The local static server was stopped. No production deployment, merge, or public Relay session was started.
