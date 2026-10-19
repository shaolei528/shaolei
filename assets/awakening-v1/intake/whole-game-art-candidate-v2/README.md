# SafeCamp terrain candidate V2 — DEV ART PREVIEW / NOT PRODUCTION

This isolated draft preserves the existing SafeCamp atlas contract: 320x256 RGBA8, 5x4 cells, 64x64 pixels per tile, with the same 20 semantic positions. It was authored at native tile resolution; nothing was resized.

- Builder: `tools/awakening-art-lab/create-safe-camp-atlas-preview-v2.mjs`
- Map composition: `tools/awakening-art-lab/create-safecamp-map-preview-v2.mjs`
- `safe-camp-terrain-map-offline-dev-preview.png` and the before/after variants are offline compositions using V21 tile IDs and map data. They are not game screenshots.
- `safe-camp-props-dev-preview.png` is copied unchanged from candidate V1 only so the map compositor can build its A/B image. It is not a V2 prop approval.

## Review result: REVISE

The richer grass clusters read more clearly when magnified, but their repeated positions form obvious rows when stamped across the authored map. Rotating tiles in an offline study reduces directional repetition, yet does not remove the repeated cluster rhythm. The material still does not reach the reference image's detail density. Do not use this draft as a final replacement or production atlas.

This result shows that hand-editing one fixed image per grass tile is not enough to meet the requested map-scale variety. A future renderer variation task could explore stable per-cell rotations or a larger set of authored grass variants, but it must be a separately selected implementation task. Any such variation must affect rendering only and preserve tile IDs, collision, saves and networking.
