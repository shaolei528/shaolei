# Player sprite replacement candidate — review draft

**Status: DRAFT / DEV ART PREVIEW / NOT PRODUCTION / REVISE**

**Lead module:** Rendering & Art  
**Coordinates with:** Character & Progression, Animation & Presentation, UI & Input, Integration & QA

## Why this candidate exists

The active V21 player sheet is `assets/player_sheet.png`, a 96×128 RGBA PNG divided into four 24×32 frames across and four directional rows. `modules/render/base-renderer.js` selects rows in down, left, right, up order and draws the source at scale 1.18. A read-only visual inspection shows a very small number of color blocks per character. The sheet contract is compact, so a candidate must preserve silhouettes, foot position and directional order while making face, clothing and gear readable.

## Candidate files

- `assets/awakening-v1/intake/whole-game-art-candidate-v1/player-sheet-dev-preview.png` — native-size 96×128 candidate.
- `assets/awakening-v1/intake/whole-game-art-candidate-v1/player-sheet-6x-nearest-review.png` — inspection-only enlargement; never use it as a runtime texture.
- `tools/awakening-art-lab/create-player-sheet-preview.mjs` — deterministic source builder. It writes only to the isolated intake directory.

The candidate depicts an original coastal-survivor outfit with dark swept hair, teal field jacket, rust scarf, work trousers, boots and a compact field pack. It uses the existing four direction rows and four animation columns. It is an independent visual study, not a crop from the supplied concept image.

## Checks and limits

- **VERIFIED mechanical:** native dimensions are 96×128, RGBA8. All 16 cells contain sprite pixels, each within the 24×32 cell boundary. Transparent background pixels are present; the builder syntax check passes.
- **VERIFIED visual inspection:** the 6× nearest-neighbor review shows clear front/back/side silhouettes, visible jacket/face/pack clusters, and different step/arm poses. Direction order was corrected after review. A single visible eye, turned cheek and diagonal jacket strap make the down-facing row less symmetrical.
- **REVISE:** the 24×32 source contract constrains detail; the current candidate still needs review at its real game draw size and comparison beside props, terrain and NPCs. Its four cardinal rows are only a fit to the existing renderer, not proof that it will read correctly under the selected 3/4 camera. The existing runtime canvas also stretches disproportionately on desktop.
- **BLOCKED / UNKNOWN:** this session's computer-use tool rejected the existing browser tab because its URL protocol was not allowed, and explicitly disallowed browser workarounds. Therefore there is no desktop/mobile game screenshot, real scale comparison, actor/prop alignment review or animation check.

This sheet is not referenced by a runtime manifest or renderer. Do not replace `assets/player_sheet.png` or modify actor/movement/network data from this draft. Keep, revise or discard it after game-scale review.

## Recommended next action

Fix the verified canvas aspect distortion before judging any replacement character art in the actual scene. The focused task card is [`2026-10-04-desktop-canvas-scale-fix.md`](2026-10-04-desktop-canvas-scale-fix.md); repository instructions require the user to select runtime implementation before code changes.
