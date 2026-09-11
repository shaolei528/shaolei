# Production Base Terrain Intake V1 — Freeze

Status is frozen pending Macro Terrain Prototype conclusions and props/decal intake.

## Production-candidate (not production accepted)

- `aw_v1_terrain_dirt_shoulder_a`
- `aw_v1_terrain_dirt_shoulder_b`
- `aw_v1_terrain_asphalt_a`
- `aw_v1_terrain_asphalt_b`
- `aw_v1_terrain_asphalt_cracked`
- `aw_v1_terrain_concrete_floor_a`
- `aw_v1_terrain_concrete_floor_b`

## FIXABLE / HOLD

- `aw_v1_terrain_cold_grass_a`
- `aw_v1_terrain_cold_grass_b`
- `aw_v1_terrain_cold_grass_detail`

## REDRAW

- none

No candidate manifest was created. `assets/awakening-v1/manifest.json` is untouched. No runtime semantic, binding, world, gameplay, combat, collision, or transition work is included.

Normalization evidence only: separator-free crop -> edge-only square reconstruction -> nearest-neighbor 64x64 -> 3x3 same-tile seam preview. The source-to-64 ratio is non-integer, so this result is a tile-specific feasibility decision, not a general automatic production rule.

The 10 normalized PNGs and 10 seam previews are preserved in the companion binary evidence archive recorded in `FREEZE_RECORD.json` and are not production-accepted assets.
