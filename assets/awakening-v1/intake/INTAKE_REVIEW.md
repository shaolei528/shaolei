# Awakening Terrain Raw Intake Review V1

This directory is preview/reference intake only. Nothing here is a production terrain asset and nothing here may be copied into `assets/awakening-v1/manifest.json` without exact-grid Art Lab re-export/redraw and normal production validation.

## Batch summary

- Source sheets: 5
- Raw crops: 36
- Stable ids: `aw_v1_terrain_s01_r0_c0` through `aw_v1_terrain_s05_r1_c3`
- Base terrain candidates: 11
- Transition candidates: 16
- Threshold/store-floor candidates: 9
- Direct 64-grid production passes: 0 / 36

## Classification

- `s01_r0_c0` — base terrain candidate — cold grass reference
- `s01_r0_c1` — base terrain candidate — dirt shoulder reference
- `s01_r1_c0` — base terrain candidate — asphalt/cracked-asphalt reference
- `s01_r1_c1` — threshold/store-floor candidate — concrete/store-floor reference
- `s02_*` — threshold/store-floor candidates — exterior asphalt ↔ store threshold/floor references
- `s03_*` — transition candidates — irregular grass/dirt/asphalt blend references
- `s04_*` — transition candidates — asphalt ↔ concrete edge/corner references
- `s05_*` — base terrain candidates — cold-grass/dirt variation references

No crop is rejected as a visual reference. All 36 are rejected as direct production terrain assets because their source dimensions are not 64×64 or exact 64-pixel grid cells, and the contract requires terrain authored at final pixel scale without resampling.

## Required Art Lab re-output

Exact 64×64 base terrain cells are still required for:

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

Exact-grid transition coverage is still required for grass↔dirt, dirt↔asphalt, asphalt↔parking concrete/asphalt, and exterior asphalt↔store threshold/floor. Preferred coverage remains N/S/E/W edges plus NE/NW/SE/SW corners and irregular variants.

## Decals still missing as separate transparent assets

The puddles/cracks visible inside these source sheets are baked into terrain references and therefore do not satisfy the separate decal layer contract. Separate transparent PNGs are still required for:

- `aw_v1_decal_puddle_*`
- `aw_v1_decal_asphalt_crack_*`
- `aw_v1_decal_tire_mark_*`
- `aw_v1_decal_broken_glass_*`
- `aw_v1_decal_store_grime_*`
- `aw_v1_decal_early_residue_*`
- store-specific broken-glass / floor-grime variants

Use `awakening-assets-preview.html?manifest=assets/awakening-v1/intake/manifest.preview.json` for preview after the raw PNGs are present at the indexed paths.
