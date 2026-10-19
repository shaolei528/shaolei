# 3/4 Camera Prototype Source Review

**Status:** VERIFIED SOURCE REVIEW / VISUAL ACCEPTANCE UNKNOWN / NOT A GAME RENDERER

**Lead module:** Rendering & Art  
**Coordinates with:** UI & Input, World & Terrain, Home & Building, Integration & QA

## What the current prototype proves

- `prototypes/camera-3-4-v1/prototype.js` contains a 2:1 oblique world-to-screen transform. Logical ground diamonds are drawn as 64x32 screen shapes, and movement input is inverted through that transform.
- The HTML labels the page as a non-production visual prototype. It is separate from `survival-v21.html` and does not load V21 assets, collision, world state, save or Relay code.
- The prototype resizes its backing canvas from its CSS box and caps device pixel ratio at 2. That is a separate sizing implementation from V21 and does not prove the main game's canvas distortion has been corrected.

## Limits found in source

- The person is a collection of plain rectangles; shelter and store are screen-aligned rectangles; only ground cells and some dock lines use the oblique projection. This is enough to study rough composition and diagonal movement, but object faces and character art do not yet demonstrate a consistent 3/4 pixel-art language.
- Depth objects sort by `x + y`, which matches the prototype's projected vertical ordering for simple points. Building footprint occlusion, walk-behind behavior, collision boundaries, moving-camera composition, and overlap with actual V21 props are not connected or verified.
- No browser-rendered screenshot was available in this review. Appearance at 390x844 and 1280x720, detail sharpness, UI safe areas, and player/ground proportions remain **UNKNOWN**.

## Recommended gate

Treat this as a camera/composition blockout only. Before drawing or replacing a large character/building family, first resolve the existing V21 canvas sizing task in `2026-10-04-desktop-canvas-scale-fix.md` after the user selects it. Then capture the isolated prototype at mobile and desktop sizes and review projection, contact shadows, object footprints and draw order with representative approved draft art. Do not promote the prototype's primitive shapes as final art.

No runtime code, tests, manifest, production asset, gameplay, save, collision or network behavior was changed by this review.
