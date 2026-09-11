# ABYSSAL WAKE — Awakening World V1 Asset Contract

## Purpose
This contract lets Art Lab replace the temporary programmer-rendered Stage 0 / early Stage 1 world visuals without rewriting map, collision, interaction, combat, save, or network logic.

The engineering branch remains authoritative for placement and gameplay data. Art is presentation only.

## Coordinate and pixel rules
- World coordinates remain the existing ABYSSAL WAKE world coordinates. Do not derive gameplay coordinates from image pixels.
- Base terrain grid: **64×64 px per cell**.
- Rendering: nearest-neighbor only (`imageSmoothingEnabled = false`).
- Pixel art must be authored at final pixel scale. Do not provide anti-aliased or smooth vector-looking exports.
- Terrain, decals, props, collision, interaction/loot, entities, and FX/lighting are separate layers.
- **Never infer collision from PNG alpha, silhouette, or color.** Collision is explicit gameplay data.

## World art direction — this batch
Stage: **Normal Reality / Stage 0 with very early Stage 1 anomalies**.

Outside palette:
- cold grey-blue
- wet asphalt
- desaturated grass
- muted dirt / concrete
- abandoned modern infrastructure
- restrained rust and grime

HOME remains warmer and more human than OUTSIDE.

Do not use:
- global purple horror tint
- full-screen black fog
- giant tentacles everywhere
- high-fantasy glowing ruins
- late-stage Abyss corruption

The first anomaly should read as: “something is subtly wrong here.”

## Folder structure
Expected production structure:

```text
assets/awakening-v1/
  manifest.json
  terrain/
    awakening-terrain-v1.png
  decals/
    aw_v1_decal_*.png
  props/
    aw_v1_prop_*.png
  poi/store/
    aw_v1_prop_store_*.png
  fx/
    aw_v1_fx_*.png
```

The current engineering slice may render placeholders until these files exist.

## Terrain atlas contract
Preferred file: `assets/awakening-v1/terrain/awakening-terrain-v1.png`

- Cell size: **64×64 px**.
- Atlas width and height must be exact multiples of 64.
- Transparent pixels are allowed for transition overlays, but base full-material cells should be opaque.
- Atlas order must be declared in `assets/awakening-v1/manifest.json` before integration.
- Base terrain required for this slice:
  - `aw_v1_terrain_cold_grass_a`
  - `aw_v1_terrain_cold_grass_b`
  - `aw_v1_terrain_cold_grass_detail`
  - `aw_v1_terrain_dirt_shoulder_a`
  - `aw_v1_terrain_dirt_shoulder_b`
  - `aw_v1_terrain_asphalt_a`
  - `aw_v1_terrain_asphalt_b`
  - `aw_v1_terrain_asphalt_cracked`
  - `aw_v1_terrain_concrete_floor_a`
  - `aw_v1_terrain_concrete_floor_b`

## Terrain transition requirements
The world must not read as repeated 1×1 squares.

Art Lab should provide transition coverage for:
- grass ↔ dirt shoulder
- dirt shoulder ↔ asphalt
- asphalt ↔ parking concrete/asphalt
- exterior asphalt ↔ convenience-store threshold/floor

Preferred transition set per important pair:
- N / S / E / W edge
- NE / NW / SE / SW corner
- one or more broken/irregular edge variations where visually useful

Transitions are visual data only. Walkability still comes from collision data.

## Decal contract
Typical exported size: **16–128 px** per axis. Larger authored decals are allowed when composition requires them.

Required categories:
- `aw_v1_decal_puddle_*`
- `aw_v1_decal_asphalt_crack_*`
- `aw_v1_decal_tire_mark_*`
- `aw_v1_decal_broken_glass_*`
- `aw_v1_decal_store_grime_*`
- `aw_v1_decal_early_residue_*`

Rules:
- transparent PNG
- no gameplay collision
- no baked background rectangle
- use subtle variation so repeated surfaces do not read as tiled wallpaper

## Prop contract
Typical prop size: **32–256 px**. Buildings and long wall sections may exceed 256 px or span multiple tiles.

Image anchor for world props: **bottom-center** (`anchorX=0.5`, `anchorY=1.0`).

For a prop placed from engineering rectangle `{x,y,w,h}`, the production art renderer should normally place the visual anchor at:
- world X = `x + w/2`
- world Y = `y + h`

This anchor is visual only; collision uses its own explicit rectangle(s).

Required transition-zone props:
- `aw_v1_prop_fence_*`
- `aw_v1_prop_road_barrier_*`
- `aw_v1_prop_roadside_debris_*`
- optional modern utility / sign / bollard variants

## Abandoned Convenience Store asset set
Do not bake the whole POI into one flattened background. Keep the store modular enough that collision and interaction remain independent.

Required production assets:
- `aw_v1_prop_store_exterior_wall_*`
- `aw_v1_prop_store_entrance_*`
- `aw_v1_prop_store_sign_mire_mart`
- `aw_v1_prop_store_counter_*`
- `aw_v1_prop_store_shelf_*`
- `aw_v1_prop_store_fridge_*`
- `aw_v1_prop_store_debris_*`
- `aw_v1_decal_store_broken_glass_*`
- `aw_v1_decal_store_floor_grime_*`
- `aw_v1_fx_store_failing_light_*`
- `aw_v1_fx_store_early_residue_*`

Entrance art must visually preserve the authored open doorway. Do not paint a closed wall across the gameplay entrance.

## Collision footprints
Engineering owns collision.

Expected collision shapes in V1 are explicit axis-aligned world rectangles for:
- exterior walls
- counter
- shelves
- fridge/freezer bank
- major debris
- fences / barriers

Art Lab may propose visual changes, but if a visual footprint changes substantially the collision data must be reviewed separately. Art replacement alone must not silently change collision.

## Transparency
- Props / decals / FX: transparent PNG.
- No semi-transparent fringe caused by resampling.
- Avoid premultiplied-looking halos around dark pixel art.
- Base terrain: normally opaque.

## Animation frames
Most V1 world assets are static: **1 frame**.

Optional animated assets:
- failing fluorescent light: **2–4 frames**, 6–10 fps equivalent
- subtle residue shimmer: **2–4 frames**, intentionally restrained

Engineering must be able to use frame 0 as a static fallback if animation assets are unavailable.

## Naming and manifest
Every production asset must have a stable lowercase snake_case id.

Examples:
- `aw_v1_terrain_asphalt_cracked`
- `aw_v1_decal_puddle_01`
- `aw_v1_prop_store_shelf_01`
- `aw_v1_prop_store_fridge_bank_01`
- `aw_v1_fx_store_failing_light_01`

`assets/awakening-v1/manifest.json` should declare, as applicable:
- id
- file / atlas source
- source rectangle for atlas entries
- width / height
- anchor
- frame count
- frame duration
- visual category

It must not contain authoritative gameplay collision.

## Renderer loading contract
The current V1 engineering module exposes world placement and layer data through `window.ABYSSAL_AWAKENING_WORLD_V1`.

Production integration should replace only presentation adapters / asset references:
- terrain cell id → atlas source rect
- decal id → PNG
- prop id → PNG / atlas entry
- FX id → optional animation frames

The following must not require redesign when Art Lab assets arrive:
- world coordinates
- Safe Camp
- POI placement
- collision rectangles
- interaction resource ids
- mob placement contract
- inventory / crafting
- save schema
- Relay protocol

## Acceptance for Art Lab handoff
An asset batch is not accepted only because the source sheet looks attractive. It must pass:
- exact dimensions / atlas multiples
- nearest-neighbor in-game rendering
- transition seam inspection
- readable doorway and interior navigation
- no alpha-derived collision
- PC viewport check
- mobile viewport check
- HOME vs OUTSIDE temperature contrast
- Stage 0 realism retained
- early anomaly remains subtle
