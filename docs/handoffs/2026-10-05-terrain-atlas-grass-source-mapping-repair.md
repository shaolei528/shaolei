# Successor terrain atlas grass mapping repair — 2026-10-05

## Finding

- **CONFIRMED render bug:** `assets/art-v21/terrain-v21.png` is a 320×256 sheet divided into 20 64×64 cells. The source sheet's cell 0 contains the grass texture; cells 1 and 2 visibly contain tan sand. `terrain-v21.js` nevertheless defines tile IDs 1 and 2 as `grass_b` and `grass_flowers`, and its grass selector emits those IDs. The 3/4 renderer used each logical ID as the atlas cell number without a semantic mapping. Grass cells therefore sampled sand, matching the earlier broad diagonal sand bands seen in gameplay.
- Evidence is source image inspection plus the numeric tile-to-cell code path. A new player-browser screenshot could not be captured because the loopback page remains blocked by the browser; exact runtime improvement is **not visually accepted**.

## Owner and bounded change

- **Lead:** Rendering & Camera (logical tile ID to sampled atlas cell and projection draw).
- **Partners:** World & Terrain (terrain tile IDs), Asset Pipeline (sheet semantics), Integration & QA (regressions and player-view verdict).
- **Interface:** `ABYSSAL_TERRAIN_V21.tileAtCell()` and `tile` provide stable semantic IDs; `drawDiamond()` selects the source rectangle and draws the projected diamond.
- **Changed files:** `prototypes/successor-3-4/successor-renderer.js`, new `tests/successor-terrain-atlas-mapping-v1.test.mjs`. The existing build script generated a new content-addressed public package and updated only the managed `assets.directory` field in `wrangler.jsonc`.
- **Fix:** in the shipped production atlas only, the `grass_b` and `grass_flowers` IDs sample the actual grass cell with distinct horizontal/vertical mirroring. Explicit art-preview mode keeps its own cell mapping. Sand, water, shoreline and road cells retain their existing mappings. Terrain IDs, geometry, collision, save, Relay, and gameplay state are untouched.
- This uses mirrored views of one grass texture as a compatibility fix; authored independent grass and flower cells are still needed for the target art quality.

## Verification

- `tests/successor-terrain-atlas-mapping-v1.test.mjs` — PASS for production grass sampling, deterministic mirroring, sand sampling and unchanged explicit art-preview mapping.
- `tests/terrain-v21.test.mjs`, `tests/awakening-world-v1.test.mjs`, `tests/awakening-world-logic-hardening-v1.test.mjs`, `tests/successor-camera-adapter-v1.test.mjs`, `tests/successor-natural-route-v1.test.mjs`, and `tests/successor-live-candidate-v1.test.mjs` — PASS, run serially.
- Renderer and new fixture syntax checks — PASS.
- `npm run build:site` — PASS twice at the same fingerprint. Active local package: `.cloudflare-site-5ff71f2b3f62`, 56 allowlisted files, 0.34 MiB. Inventory check found no missing files, V17 entry, tests, docs, intake art or candidate art; packaged renderer SHA-256 matches current source.
- Scoped `git diff --check` — PASS.

## Status and remaining acceptance

- **Source bug fixed; player-view status remains REVISE / UNKNOWN.** No browser capture at desktop or phone size confirms that the strips disappeared, the mirrored pattern reads naturally, or the mobile scene remains crisp. The 3/4 scene's earlier broad terrain still requires proper authored variants and runtime review.
- The package is local only. No Cloudflare deployment or file deletion occurred. Previous generated build folders and user files were preserved.
