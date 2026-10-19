# SafeCamp warm pixel terrain V3 — draft review

Status: **DRAFT / successor art candidate**.

This atlas keeps the 320x256, 5x4, 64px tile positions used by V21. V3 replaces the dense repeated grass flecks with six broad clover patches, grouped blades and a few warm flower accents. The 3/4 candidate composes grass and water as continuous fills clipped to the union of the existing projected terrain diamonds; shore transitions, road edges and collision continue to use their authored map cells. Rendering does not change world tile IDs, collision, save data or network state.

`safe-camp-meadow-repeat-2x2-draft.png`, `safe-camp-water-repeat-2x2-draft.png`, and `safe-camp-sand-repeat-2x2-draft.png` are generated 128x128 repeat textures from the native-resolution atlas. The new `safe-camp-road-repeat-2x2-draft.png` is a 128x128 hand-authored, seamless warm packed-earth pixel texture. It is original work in this repository, authored by `tools/awakening-art-lab/create-stardew-pixel-terrain-v3.mjs`; no external art or source image was copied. The 3/4 candidate keeps its walkable tile IDs and renders grass, open water, sand/shore, and road-cell unions as continuous surfaces; coast boundaries therefore follow the collision map while per-diamond interior seams disappear. Road texture is clipped only to existing `road_a` / `road_b` map cells. The artwork from the menu scene is a visual/mood reference, not a flat background under walkable coordinates.

The atlas and repeat-texture builder is `tools/awakening-art-lab/create-stardew-pixel-terrain-v3.mjs`. `safe-camp-terrain-map-offline-dev-preview.png` is an offline composition, not a browser screenshot. The hand-built pixel survivor and tree renderer are in the dated art candidate README one folder above.

**Road art status: DRAFT / DEV ART PREVIEW / NOT PRODUCTION.** Runtime use is limited to the successor's explicit live-ground-art candidate. Missing or invalid texture keeps the existing terrain-atlas road rendering as fallback. No V21 tile mapping, collision, save/network state, or production manifest was changed. Review the path at gameplay scale, including its coast connection and 1280x720 / 390x844 viewports, before acceptance.

Review the actual browser route at normal scale, especially transition edges and the balance between meadow, paths and coast, before considering promotion to the formal V21 art manifest.
