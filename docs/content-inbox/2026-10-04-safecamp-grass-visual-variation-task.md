# Draft engineering task — SafeCamp grass tile visual variation

**Status:** DRAFT / NOT IMPLEMENTED; requires the user's separate selection before runtime or test edits  
**Lead module:** Rendering & Art  
**Coordinates with:** World & Terrain (tile IDs and independent collision), Integration & QA (pixel and viewport acceptance)

## Verified reason for this task

- V21 `terrain-v21.js::renderTerrainGround()` draws the selected 64x64 atlas cell unchanged at every map coordinate. The grass family has three visual IDs (`grass_a`, `grass_b`, `grass_flowers`); many map cells reuse the same IDs, so motifs form visible recurring patches in the SafeCamp preview.
- Collision is stored separately in `COLLISION_MAP` and queried independently from `TERRAIN_MAP`. The existing offline study `assets/awakening-v1/intake/whole-game-art-candidate-v1/safe-camp-terrain-before-after-rotations-offline-study.png` deterministically rotates only grass-family pixels by map cell and shows added texture direction variety. It does not alter the game.
- The browser-rendered static terrain preview confirms obvious grass repetition. It is a terrain-only DEV ART PREVIEW, not a full gameplay screenshot.

## Proposed bounded implementation, only if selected

1. For grass visual IDs only, choose a stable quarter-turn from the world cell coordinates and tile ID. The result must not change between frames or clients for the same cell.
2. Keep `TERRAIN_MAP`, `COLLISION_MAP`, world coordinates, tile size, collision queries, water animation, save state and Relay payloads unchanged.
3. Keep the default production atlas selection and opt-in preview separation unchanged. This task changes only how the already-selected grass image is oriented when drawn.
4. Do not rotate shore transitions, paths, signs, props or gameplay colliders. Do not add gameplay semantics.

## Acceptance evidence

- A focused regression proves the orientation is deterministic for a given cell, can select all four turns across the map, and leaves map IDs/collision results untouched.
- Verify nearest-neighbor rendering remains crisp and the atlas edges still meet after turns; compare the same 10x9 and full-map crops before/after.
- Review at the isolated terrain preview and then at 1280x720 desktop and 390x844 mobile after the separate V21 canvas-proportion task is selected and resolved. Mark any visible seams, new repetition or pixel loss REVISE.
- No change to damage, movement, interactions, networking, save data or collision authority.

## Limits and decision

Quarter-turns may reduce repeated leaf direction without removing repetition caused by the small number of fixed atlas cells. It is an art-presentation improvement, not a replacement for a larger authored terrain family or actual PC/mobile art acceptance.

To authorize runtime/test edits, select **Implement SafeCamp grass visual variation** as a separate task. Until then this card is a proposal only; the atlas and renderer remain unchanged.
