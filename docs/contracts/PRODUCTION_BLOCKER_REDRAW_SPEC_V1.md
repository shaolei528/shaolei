# ABYSSAL WAKE — Production Blocker Redraw Spec V1

Status: **ACTIVE BLOCKER SPEC / no production manifest authorization**  
Owner: Chat E — canonical Art Integration / Tooling  
Purpose: remove ambiguity in the D → G → E handoff for the assets that currently block the first Awakening production manifest.

## 1. Governing rules

All assets in this document are presentation-only. They must not encode or imply authoritative collision, damage, movement, loot, AI, networking, save state, or interaction authority. Engineering remains authoritative for gameplay placement and state.

General acceptance rules:

- stable asset IDs exactly as listed below;
- final-pixel authorship where a pixel-art asset is required;
- nearest-neighbor-safe edges; no bilinear blur or antialias fringe;
- no baked collision or interaction cues;
- props use bottom-center anchor `{x:0.5,y:1}` in the production manifest;
- decals / FX use transparent RGBA and must contain real transparent pixels;
- base terrain is opaque unless explicitly approved as a presentation overlay;
- no unsupported runtime semantic may be invented to accommodate the art;
- D authors; G exports the exact approved files without semantic invention; E validates and alone decides production manifest readiness.

## 2. Current blocking asset set

| Required asset ID | Semantic | Exact output size | Alpha | Manifest anchor | Reference source | Current state |
|---|---|---:|---|---|---|---|
| `aw_v1_terrain_cold_grass_a` | `terrain.cold_grass` | **64×64** | opaque | none | reference ID `ref_aw_s01_r0_c0`; approved cold-grass material source | **REDRAW REQUIRED** |
| `aw_v1_terrain_cold_grass_b` | `terrain.cold_grass` | **64×64** | opaque | none | same cold-grass source family; A must not be duplicated compositionally | **REDRAW REQUIRED** |
| `aw_v1_terrain_cold_grass_detail` | support asset required by production gate for `terrain.cold_grass` | **64×64** | opaque | none | same cold-grass source family + Macro Terrain Rollout Contract | **REDRAW REQUIRED** |
| `aw_v1_decal_early_residue_01` | `decal.residue` | **96×72** | RGBA transparent | `{x:0.5,y:0.5}` | `AWAKENING_ASSET_CONTRACT.md` early Stage-1 anomaly direction; existing store grime is **not** a substitute | **MISSING / DRAW REQUIRED** |
| `aw_v1_prop_store_debris_01` | `prop.debris` | **80×64** | RGBA transparent | `{x:0.5,y:1}` | abandoned convenience-store contract; G roadside debris may inform material language but is **not** this semantic | **MISSING / DRAW REQUIRED** |
| `aw_v1_fx_store_failing_light_01` | `fx.flicker` | **96×16** | RGBA transparent | `{x:0.5,y:0.5}` | abandoned-store failing fluorescent requirement | **MISSING / DRAW REQUIRED** |
| `aw_v1_fx_store_early_residue_01` | `fx.anomaly` | **96×72** | RGBA transparent | `{x:0.5,y:0.5}` | early-residue anomaly direction; subtle Stage-0 → early Stage-1 presentation | **MISSING / DRAW REQUIRED** |

These seven IDs are the current D-facing blocker set. Dirt shoulder, asphalt and concrete are not redraw blockers; they already have frozen candidate evidence and require later promotion/staging, not new art.

## 3. Cold grass exact art specification

### `aw_v1_terrain_cold_grass_a`

- exactly 64×64, authored at final pixel scale;
- fully opaque;
- primary low-frequency cold-grass / soil base;
- dark, desaturated grey-green / cold soil palette consistent with Stage 0;
- sparse deliberate grass clusters over a readable substrate;
- no painterly downsample noise, moiré, blur, soft gradients, antialias, or dithering used to fake density;
- no puddles, cracks, props, grime, interaction hints, collision silhouettes, or anomaly FX baked into the tile;
- opposite edges must tile cleanly in a 3×3 repetition check;
- avoid a dominant focal tuft that reveals the tile period immediately.

### `aw_v1_terrain_cold_grass_b`

Same technical requirements as A, but it must be a genuine alternate layout:

- visibly different low-frequency grass-cluster distribution;
- no copied focal-tuft placement from A;
- same palette family, contrast range and pixel density as A;
- A/B mixed placement must reduce repetition rather than create a checkerboard pattern.

### `aw_v1_terrain_cold_grass_detail`

- exactly 64×64 and fully opaque;
- still a base/detail terrain tile, not a macro overlay;
- slightly richer vegetation accents than A/B, but clusters remain sparse and deliberate;
- high-frequency field richness belongs to the separate presentation-only macro layer;
- must leave enough visual calm for 3×3 / 4×4 / 6×6 macro detail to sit above it without density conflict.

### Grass acceptance gate

All three must pass:

1. exact 64×64 dimensions;
2. opaque base pixels;
3. deliberate final-scale pixel clusters at 1× inspection;
4. nearest-neighbor zoom readability;
5. 3×3 seam check with no edge break;
6. no dominant macro repetition;
7. family consistency with frozen dirt/asphalt/concrete candidates;
8. no gameplay-authority information encoded in color or silhouette.

## 4. Residue decal exact art specification

### `aw_v1_decal_early_residue_01`

- exactly 96×72;
- RGBA with real transparent pixels and no baked background rectangle;
- anchor `{x:0.5,y:0.5}`;
- subtle early-anomaly residue, readable as “something is slightly wrong” rather than late-stage corruption;
- restrained cold / dirty material language; no global purple-horror treatment;
- hard pixel-art silhouette at final scale;
- no resampling fringe or premultiplied dark halo;
- intentional internal translucency is allowed only when artist-authored; no feathered antialias boundary;
- `store_grime` artwork must not be relabeled to satisfy this semantic.

Acceptance: PNG/RGBA/real-alpha validation, fringe check, crop check, nearest-neighbor visual check, and restrained Stage-1 tone review.

## 5. Store debris prop exact art specification

### `aw_v1_prop_store_debris_01`

- exactly 80×64;
- RGBA transparent background;
- visible art must reach the bottom baseline so bottom-center placement is stable;
- production anchor `{x:0.5,y:1}`;
- abandoned convenience-store interior debris: packaging, broken small fixtures, loose store material, or similar modular clutter;
- must remain visually modular and must not paint collision boundaries, loot glow, interaction icons, or inaccessible-wall cues into the sprite;
- roadside debris is a material reference only and cannot substitute for this exact ID/semantic.

Acceptance: PNG/RGBA/real-alpha/fringe/crop validation, bottom-baseline compatibility, anchor declaration, and in-store scale/readability review.

## 6. Store FX exact art specification

### `aw_v1_fx_store_failing_light_01`

- exactly 96×16 for the V1 required static frame-0 asset;
- RGBA transparent;
- anchor `{x:0.5,y:0.5}`;
- failing fluorescent / light-strip presentation only;
- subtle irregular illumination cue, not a gameplay hazard indicator;
- no bloom blur baked into the silhouette; controlled pixel clusters only;
- V1 production gate may accept `frames:1`; later 2–4 frame animation may be added without changing the semantic.

### `aw_v1_fx_store_early_residue_01`

- exactly 96×72 for the V1 required static frame-0 asset;
- RGBA transparent;
- anchor `{x:0.5,y:0.5}`;
- visually related to early residue but functioning as restrained FX/anomaly presentation rather than a decal substitute;
- no damage area, collision radius, interaction target, loot marker, or network state encoded in the image;
- V1 production gate may accept `frames:1`; optional restrained animation can follow later.

Acceptance for both FX: valid RGBA, real transparency, no fringe, correct dimensions/anchor, frame-0 readability, nearest-neighbor presentation, and Stage-0/early-Stage-1 restraint.

## 7. D → G → E handoff protocol

### D — Art Lab

Deliver only the exact blocker IDs above. Do not rename them, substitute another existing asset, or invent a new semantic. Include a nearest-neighbor 1×/4× review and, for grass, a 3×3 seam preview.

### G — Raw asset export

Export the approved art as exact PNG files. Preserve dimensions and hard pixel edges. Do not add gameplay metadata, runtime bindings, collision, interaction, network, or save information. Do not rename store grime, roadside debris, entrance, or bollard art to satisfy a missing blocker.

### E — Canonical intake

E validates:

- exact ID / naming;
- dimensions;
- PNG validity;
- RGBA / alpha requirements;
- real transparency for decal/prop/FX;
- fringe and crop;
- prop bottom-center compatibility;
- grass seam / pixel-language acceptance;
- production strict-required semantic coverage.

Only after all production blockers pass may E authorize the first `assets/awakening-v1/manifest.json`.

## 8. Explicit non-substitutions

The following remain unbound or non-semantic inventory and cannot close blockers:

- `aw_v1_decal_store_grime_*` ≠ `decal.residue`;
- `aw_v1_prop_store_entrance_*` does not create an `entrance` semantic;
- `aw_v1_prop_roadside_bollards_cone_*` does not create a `bollard` semantic;
- `aw_v1_prop_roadside_debris_*` ≠ `prop.debris`;
- high-resolution reference transitions do not create transition semantics.

This document defines art deliverables only; it does not authorize a production manifest while any blocker remains unresolved.
