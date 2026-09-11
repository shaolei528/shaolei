# Awakening Art Integration Toolchain V1

This directory is intentionally presentation-only. It must not own collision, combat, mobs, inventory, save data, Relay, or Supabase behavior.

## Asset pack contract

Default production pack root:

```text
assets/awakening-v1/
  manifest.json
  terrain/
  decals/
  props/
  poi/store/
  fx/
```

The validator accepts either a top-level asset array or:

```json
{
  "assets": [
    {
      "id": "aw_v1_terrain_cold_grass_a",
      "category": "terrain",
      "atlas": "terrain/awakening-terrain-v1.png",
      "sourceRect": { "x": 0, "y": 0, "w": 64, "h": 64 },
      "width": 64,
      "height": 64
    },
    {
      "id": "aw_v1_prop_store_shelf_01",
      "category": "prop",
      "file": "poi/store/aw_v1_prop_store_shelf_01.png",
      "width": 128,
      "height": 96,
      "anchor": { "x": 0.5, "y": 1 },
      "frameCount": 1,
      "fallback": "aw_v1_prop_store_shelf_placeholder"
    }
  ],
  "fallbacks": {
    "aw_v1_prop_store_shelf_requested": "aw_v1_prop_store_shelf_placeholder"
  }
}
```

Supported PNG input is standard non-interlaced 8-bit PNG (grayscale, RGB, indexed, grayscale+alpha, or RGBA). Unsupported exports fail loudly instead of being guessed.

## Validate a pack

```bash
node tools/awakening-art/validator.mjs assets/awakening-v1
node tools/awakening-art/validator.mjs assets/awakening-v1 --strict-required
node tools/awakening-art/validator.mjs assets/awakening-v1 --json
```

Checks include:

- valid JSON manifest and unique `aw_v1_*` lowercase snake_case ids
- referenced PNG existence and safe in-pack paths
- terrain PNG/atlas dimensions on a 64 px grid
- terrain atlas source rectangles on a 64 px grid
- transparent pixels for decals, props, and FX
- warning on unexpected transparency in non-transition terrain
- prop bottom-center anchor (`0.5, 1.0`)
- declared dimensions against actual PNG/source rectangle
- animation frame-0 fallback rules
- fallback target existence and cycle detection
- rejection of collision/hitbox/walkability fields in the art manifest

`--strict-required` additionally requires the ten base terrain ids listed in `AWAKENING_ASSET_CONTRACT.md`. Partial Art Lab drops can be validated without that flag.

## Slice a source sheet

Create a JSON spec next to the source sheet:

```json
{
  "source": "source-sheet.png",
  "outputDir": "../../assets/awakening-v1",
  "slices": [
    {
      "id": "aw_v1_decal_puddle_01",
      "x": 0,
      "y": 0,
      "w": 64,
      "h": 32,
      "file": "decals/aw_v1_decal_puddle_01.png"
    }
  ]
}
```

Then:

```bash
node tools/awakening-art/slice-sheet.mjs path/to/slice-spec.json
```

Slicing is pixel-exact; there is no resampling.

## Pack an atlas

```bash
node tools/awakening-art/pack-atlas.mjs \
  --out /tmp/awakening-atlas.png \
  --map /tmp/awakening-atlas.json \
  --max-width 1024 \
  --align 64 \
  assets/awakening-v1/terrain/aw_v1_terrain_*.png
```

The atlas helper is an offline art-pipeline tool only. Core Engineering still decides how/when runtime presentation adapters consume atlas references.

## Preview

Serve the repository root with any static file server and open:

```text
tools/awakening-art/preview.html
```

It defaults to `../../assets/awakening-v1/manifest.json`. Add `?manifest=<relative-or-http-url>` to inspect another manifest.

The preview uses nearest-neighbor rendering and provides:

- asset inspection
- 3×3 terrain seam repetition
- checkerboard decal/FX transparency inspection
- prop bottom-center anchor visualization
- fallback relationship display

It does not load or mutate gameplay runtime modules.
