# Camera prototype V2 progress — 2026-10-04

**Status:** DRAFT / DEV ART PREVIEW / NOT PRODUCTION.  
**Lead module:** Rendering & Art.  
**Coordinates with:** World & Terrain, Home & Building, UI & Input, Integration & QA.

## Scope and preservation

- Added `prototypes/camera-3-4-v2/` as a separate local study. The existing V1 files were not edited.
- V2 reads the isolated `player-sheet-dev-preview.png` and `safe-camp-props-dev-preview.png` directly from the intake directory. It does not use or alter a manifest.
- No active V21 runtime, gameplay, tests, production art, collision, save or network code was changed. The V21 entry page was not entered and no Relay room was joined.

## Changes in V2

- Replaced alternating high-contrast filled diamonds with continuous ground, road, yard, shore and water shapes; the 64×64 logical guide is faint.
- Connected a projected dock to the shoreline and drew HOME and OUTSIDE blockouts from the same 2:1 transform.
- Added the current 24×32 player draft and 48×48 camp-prop draft with their existing atlas cell contracts. Depth ordering uses each object's world foot/front point.
- Corrected prototype input conversion: normalize desired screen input, then map `(u,v)` to `(u+2v,-u+2v)` world movement without a second world-space normalization. Algebraically the projection returns `(u,v)`; interactive movement parity has not been playtested.

## Verification and visual review

- **VERIFIED:** local HTTP returned 200 for V2 HTML, CSS, JS and both PNGs; `node --check` passed after the final JS change.
- **VERIFIED browser render:** at 1280×720, viewed both HOME and OUTSIDE. At 390×844, viewed both scenes. Both art sheets loaded (`2/2`); browser console returned no errors or warnings. The temporary viewport override was reset.
- **PASS, composition study only:** warm HOME/cool OUTSIDE separation, connected route/shoreline, and static 390×844 control clearance are readable.
- **REVISE:** 24×32 player art still looks small and low-detail; the building remains a simple blockout and visually contrasts with the more detailed prop atlas. Ground is flatter than the target art. V2 is not a final art solution.
- **UNKNOWN:** actual keyboard/touch movement feel, player crossing front/behind the building, true phone hardware behavior, performance, V21 gameplay appearance, and all production art gates.

## Follow-up interaction observation - 2026-10-04

- **VERIFIED, isolated prototype only:** at a 390x844 viewport, browser-emulated pointer drags on the on-screen pad moved the scene. During one northwest approach, the player sprite became partly covered by the building facade, matching the expected behind-building order for that path.
- **LIMIT:** this was browser pointer emulation, not a physical touchscreen test. Only one approach direction was checked. Because the whole building is drawn as one depth-sorted object, coverage around its other edges and actor paths still needs review. No collision or V21 gameplay behavior was involved.
- **Visual acceptance remains REVISE / NOT PRODUCTION:** flat ground, blockout building, and low-detail player remain unchanged.

## Direction-row mapping finding and prototype-only repair - 2026-10-04

- **Finding:** the candidate player sheet uses rows down/left/right/up. V2 was classifying the inverse-projected world angle as if it were a screen-facing angle; screen-down selected right, and screen-left selected down on the checked JavaScript engine. Exact diagonal ties were sensitive to floating-point rounding.
- **Repair:** `prototype.js` now stores the normalized screen-space facing input and maps that directly to the four sheet rows. World movement still uses the inverse 2:1 projection. This change is isolated to V2; the active V21 renderer and its axis-aligned direction mapping were not touched.
- **Verification:** `node --check prototypes/camera-3-4-v2/prototype.js` passed. The page loaded both art sheets (`2/2`) after reload at 1280x720 and 390x844. Browser-emulated down and left pad drags still moved the scene. Physical touch and exhaustive directional/diagonal play feel remain **UNKNOWN**.
- This repairs directional selection in the camera blockout; the terrain, building and player art still remain **REVISE / NOT PRODUCTION**.

## Repository state

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- Worktree remains dirty with existing unknown-provenance modifications and untracked files. They were preserved. `git diff --check` only reported the existing LF-to-CRLF warning for `assets/awakening-v1/manifest.preview.json`.

## Next step

Use V2 only to refine the camera/material blockout and compare candidate scale. Do not treat the spritesheets as accepted. Before live renderer migration, resolve movement/occlusion review and capture V21 only through an explicitly safe local path; public Relay entry remains a user decision.
