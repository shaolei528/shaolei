# Awakening World Art Pipeline V1

This folder prepares `Awakening World Art Pack 01` for integration without changing gameplay data.

## Validate a delivered pack

Place the delivery under `assets/awakening-v1/` with a real `manifest.json`, then run:

```bash
node tools/awakening-assets/validate-pack.mjs assets/awakening-v1
```

Machine-readable output:

```bash
node tools/awakening-assets/validate-pack.mjs assets/awakening-v1 --json
```

The validator checks:
- `manifest.json` exists and parses
- stable lowercase `aw_v1_*` ids
- duplicate ids
- referenced PNG files exist
- PNG header validity and legal dimensions
- terrain PNG width/height are 64px multiples
- terrain atlas source rectangles use 64px multiples
- decal / prop / FX PNGs expose an alpha channel
- source rectangles remain inside their source PNG
- declared width/height match source rectangles
- binding ids resolve to declared assets
- sheet cell dimensions are valid

## Source-sheet / atlas deliveries

A physical split is not required. Declare a source sheet and grid entries:

```json
{
  "sheets": [{
    "id": "terrain",
    "file": "terrain/awakening-terrain-v1.png",
    "cellWidth": 64,
    "cellHeight": 64,
    "entries": [
      {"id":"aw_v1_terrain_cold_grass_a","category":"terrain","col":0,"row":0}
    ]
  }]
}
```

`prepare-sheet.mjs` expands those grid cells into renderer-ready `sourceRect` entries:

```bash
node tools/awakening-assets/prepare-sheet.mjs assets/awakening-v1/manifest.json --out /tmp/awakening-runtime-manifest.json
```

This is a virtual split: the original atlas remains intact, while runtime/preview use exact source rectangles.

## Runtime fallback

`modules/render/awakening-art-assets-v1.js` tries to load `assets/awakening-v1/manifest.json` asynchronously. Missing manifest, missing image, or missing binding does **not** block game boot. The corresponding item falls back to the existing programmer rendering in `awakening-world-v1.js`.

The production asset pack should change presentation bindings only. Collision, interaction/loot, mobs, save, Relay, combat and world coordinates remain owned by gameplay code.

## Preview

Serve the repo with any static HTTP server and open:

`awakening-assets-preview.html`

It renders every manifest asset with nearest-neighbor sampling on an alpha checkerboard. Terrain entries additionally render as a 3×3 repeat to inspect seams. Use the page to visually catch blurry scaling, transparency halos, bad source rectangles and inconsistent pixel density before touching the live game.
