# Terrain Normalization Feasibility V1

Base: `4033ccc368b6dcb7464b6c168028346176ce675e`.

Scope is deliberately limited to representative S03/S04/S05 samples. S01 remains reference-only. No production manifest, gameplay, world, combat, or collision files are changed.

## Method

For each representative raw crop, use the separator-free content crop from intake, reconstruct its 384x384 logical source cell by edge-padding only the pixels removed with the sheet separator/border, then perform an exact 384 -> 64 nearest-neighbor resize (6:1). No bilinear filtering, blur, or antialiasing. Generate a 3x3 same-tile repeat preview to expose texture destruction, seams, and repetition.

Samples:
- `aw_v1_terrain_s03_r0_c0`
- `aw_v1_terrain_s03_r1_c1`
- `aw_v1_terrain_s04_r0_c0`
- `aw_v1_terrain_s04_r1_c1`
- `aw_v1_terrain_s05_r0_c0`
- `aw_v1_terrain_s05_r1_c1`

## Result

### S03 — conditional PASS for candidate generation
Nearest normalization preserves the large grass/dirt/asphalt transition silhouettes sufficiently for further transition-set evaluation. Repeating one directional transition as a 3x3 texture naturally exposes strong motifs, so these must not be treated as seamless base tiles. Batch normalization is feasible for experimental transition candidates, followed by neighbor-aware edge/corner validation.

### S04 — conditional PASS for candidate generation
The asphalt/concrete directional structures survive nearest 6:1 normalization. Opposite edges are intentionally dissimilar on directional transition tiles, so same-tile 3x3 seam mismatch is not by itself a rejection; final validation must use the intended N/S/E/W/corner adjacency set. Batch candidate conversion is feasible, not blind production promotion.

### S05 — FAIL for direct base-terrain production
The 3x3 repeats expose obvious identical macro-pattern repetition and non-matching opposite edges. The source remains useful reference, but directly normalized S05 cells should not become canonical repeating base terrain. Return these base textures to Art Lab for deliberately tileable 64x64 final-scale authoring (or a purpose-built tileable derivation reviewed as new art).

### S01 — reference only
Do not force normalization of the 1254x1254 sheet.

## Decision

Feasibility succeeds for **S03/S04 experimental candidate generation only**. S05 should return to Art Lab for tileable 64x64 base-terrain authoring. S01 remains reference-only. Do not batch all 36 crops and do not register the six feasibility outputs as production assets.

Binary experiment outputs (raw crop, reconstructed logical 384, normalized 64, and 3x3 seam preview) are intentionally kept outside the production manifest until this gate is accepted.