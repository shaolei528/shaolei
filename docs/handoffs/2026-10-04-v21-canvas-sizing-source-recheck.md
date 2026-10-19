# V21 canvas sizing source recheck — 2026-10-04

**Status:** VERIFIED source/layout calculation; live gameplay rendering UNKNOWN.

**Lead module:** UI & Input  
**Coordinates with:** Rendering & Art, World & Terrain, Integration & QA

## Correction to the older sizing task card

The previous source note that V21 is continuously stretched to a 360×520 desktop backing canvas is stale. The active V21 boot list loads `render-v9.js` before `platform-inventory-v19.js`; `render-v9.js` replaces the base draw loop and does not call `resizeCanvas()` each frame. V19 then runs `fitDesktopCanvas()` and sets the canvas backing width/height to the current `.arena-wrap` dimensions, capped at 1100×820. It also reruns that sizing on `resize` and `ResizeObserver` changes.

Using the current CSS layout at 1280×720:

- Desktop `.app` width is capped at 1100 CSS px; `.arena-wrap` begins below the 102px top bar, so its estimated size is 1100×618.
- V19 sets the canvas backing store to 1100×618. The source-derived steady-layout scale is 1× horizontally and vertically; the prior 3.06×/1.19× distortion estimate does not describe this current load path.

At a 390×844 touch layout, `.arena-wrap` is approximately 390×742. `mobile-fixes.js` uses a 360px backing width and computes a 685px backing height, giving approximately 1.083× scale on both axes. This is also proportional by source calculation.

## Remaining concern and limits

- `mobile-fixes.js::fitPixelCanvas()` and `platform-inventory-v19.js::fitDesktopCanvas()` are separate sizing owners. On desktop, resize observers/events usually let V19 restore the desktop backing dimensions after the mobile helper runs. The mobile helper also runs 180ms after `orientationchange`; possible ordering/race behavior deserves a focused check if desktop orientation changes matter.
- This was source inspection and arithmetic only. The public Relay game-entry button was not clicked, so actual V21 gameplay screenshots, DPR behavior, actor/terrain sharpness and post-resize output remain UNKNOWN.
- The isolated camera prototype's 1280×720 and 390×844 captures are not V21 captures and cannot validate V21 sizing.

## Recommendation

Do not implement the older “desktop canvas ratio fix” task card as currently written. First replace its stale premise with a focused runtime visual check of the active V19 sizing path. If that check exposes a reproducible defect, scope the repair to the observed resize/orientation path. Keep renderer projection, gameplay, save, Relay and production art out of that check.

No runtime source, test, manifest, production asset, gameplay, save, collision or network file was modified for this recheck.
