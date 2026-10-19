# Review — V21 runtime art use and style split

**Status:** VERIFIED source map; visual acceptance PARTIAL / UNKNOWN. Review only — NOT a production-art approval.

**Lead module:** Rendering & Art

**Coordinates with:** World & Terrain, UI & Input, Integration & QA

## Main finding

The assets that appear in the preview are not the same as the assets used in the normal game path. V21 has small authored terrain slices over an older renderer, while most other zones still use a 24-pixel procedural ground. The seven new cold-grass candidates are mapped to the north-road semantic; they do not replace the ordinary grass at the center of SafeCamp. This explains why the camp lawn can appear unchanged even though the preview catalog reports 57/57 loaded.

## Runtime use map

| Area / layer | Actual source and draw path | Current recommendation |
|---|---|---|
| **SafeCamp ground** (`1:1`) | `terrain-v21.js` draws a 24×20 map of 64×64 tiles from `assets/art-v21/terrain-v21.png` over the old 24×24 procedural base. `CAMP` is at `(2400,2400)`; the atlas slice spans approximately X `1632–3168`, Y `1760–3040`. The Awakening north-road region ends at Y `1984`, so it overlaps only the slice's northern edge and leaves the camp-center lawn on the older grass tiles. | Keep the sheet and collision map working as fallback. **Repaint/replace the SafeCamp grass family as a focused art slice** after comparing it in the actual renderer; include its path/shore edge so the new grass does not sit alone. Do not delete the atlas. |
| **MIRE MART / north road** (`1:0`, north edge of `1:1`) | `awakening-world-v1.js` draws a 64×64 authored region for cold grass, shoulders, asphalt and store floor, plus decals, props and FX. In `?awArtPreview=1`, `manifest.preview.json` binds the seven candidate images under existing semantics. | Keep the candidates isolated for this region's development preview. Their mechanics pass; global style and phone/desktop appearance remain unaccepted. They do not solve the main SafeCamp lawn complaint. |
| **Other world zones** | The base renderer fills ground with 24×24 biome-colored `fillRect` cells and sparse primitive details. It draws the shared camp props, resource, monster and player atlases when available; missing sprite frames become simple rectangles. | Retain as fallback while authored coverage is built. Replace zone by zone after terrain families and transitions are ready; do not mass-delete or overlay random art. |
| **Shared actors / props** | `base-renderer.js` reads player cells at 24×32, monster/resource cells at 32×32 and camp-prop cells at 48×48. The V9 renderer draws terrain, landmarks, camp props, resources, mobs, remote players, then the local player; those classes are not depth-sorted together. Missing resource/mob sprites get simple rectangle fallbacks; missing player/prop sprites are not equivalently replaced. | Keep existing gameplay sprites until matching replacements pass the scale and animation contracts. Treat depth sorting and consistent fallback diagnostics as separate rendering tasks; art cannot alter collision or hit authority. |
| **HUD and controls** | Primarily HTML/CSS; the map is a separate canvas and inventory icons use sprite-backed UI elements. These are outside the Awakening art manifest. | Review separately after terrain and world scale are settled; do not treat the concept board's dense HUD as an approved phone layout. |

## SafeCamp tile/collision distribution

I evaluated `ABYSSAL_TERRAIN_V21` from `terrain-v21.js` in a read-only Node VM; this is map-data evidence, not a browser/game screenshot. The 24×20 authored map contains **317 grass, 32 road, 40 sand and 91 water cells**. The center cell `(col 12,row 10)` is road. Its separate collision map contains 369 walkable cells, 20 shoreline cells and 91 water cells. This confirms the camp already has an authored 64×64 terrain layout; the immediate art slice is updating its grass tiles and neighboring transitions while preserving the separate collision map.

The existing 320×256 atlas is a 5×4 sheet of 64×64 IDs: `grass_a`, `grass_b`, `grass_flowers`, `sand_a`, `sand_b`, `road_a`, `road_b`, `water_a`, `water_b`, eight cardinal/corner shore tiles, two grass-to-sand transitions and `sand_pebbles`. The Camp map currently uses three grass fills plus the east grass-to-sand edge. Any preview/repaint should preserve atlas cell positions and all 20 meanings; the production batch gate still covers the full surface family before a production promotion.

## Manifest and fallback status

- Normal mode selects `assets/awakening-v1/manifest.json`; it is absent. The art adapter records a fallback status/reason and the world renderer falls back to the existing terrain atlas or programmer primitives.
- Only explicit `?awArtPreview=1` selects `manifest.preview.json`. The preview badge labels it `DEV ART PREVIEW — NOT PRODUCTION` and displays load count.
- **VERIFIED, 2026-10-04:** `node tests/awakening-art-mapping-v1.test.mjs` passed. It checked 57/57 preview images, exact declared PNG dimensions, 8-bit RGBA, terrain opacity, transparent non-terrain pixels without semi-transparent fringes, frozen anchors, existing semantic bindings, source-rect rendering and fallback behavior. No file writes or child-process calls are present in that test.
- This test proves mechanical asset and binding contracts. It does not prove consistency with the player's concept image, readability at 390×844 or 1280×720, or final pixel-art approval. The terrain atlas could not be displayed by the available image viewer during this review, and the local game page remains blocked in the available browser.

## Keep / revise / wait

- **Keep:** existing atlases and fallback drawing until replacement assets cover their active regions and pass the render gate.
- **Keep in preview only:** the seven cold-grass / residue / debris / FX candidates; do not promote or delete them from the user's worktree.
- **Revise first:** SafeCamp's normal grass and adjoining ground materials, because current candidate bindings do not change its center lawn.
- **Wait:** broad world-wide asset replacement, production manifest creation, final visual approval and camera migration until actual desktop/mobile screenshots are available.

**Next recommended slice:** SafeCamp grass + path/shore transitions using the existing 64×64 terrain contract, with the same player and prop scale. Lead **Rendering & Art**; coordinate **World & Terrain** on cell/material coverage, **UI & Input** on viewport scale, and **Integration & QA** on seam, alpha, fallback and paired-screen evidence. This is a task recommendation, not authorization to edit production assets.
