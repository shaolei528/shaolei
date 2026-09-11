# ABYSSAL WAKE — Production Intake Readiness V1

Status: **GATED / production manifest NOT authorized**  
Owner: Chat E — canonical Art Integration / Tooling  
Integration branch: `feat/awakening-production-art-integration-v1`  
Integration base: `feat/awakening-production-intake-prep-v1 @ 61864a4394a5a9d30e36a1a56b4901259d7cedb6`  
Terrain/tooling canonical source: `feat/awakening-terrain-normalization-v1 @ 2036ad752c8ff0e6fb73b7441b19dfc76f1217bc`  
G final source: `feat/awakening-props-decals-intake-v1 @ 33419d0da7401bc142bc6edf9aa282cf7c7c6cc6`  
Macro rollout contract: `docs/contracts/MACRO_TERRAIN_ROLLOUT_CONTRACT_V1.md @ a36e2976b745c963d43b83848384b1528ad36b5c`

## 1. Production gate decision

The first production `assets/awakening-v1/manifest.json` remains blocked. A production manifest may be created only when the required asset gate is complete; this review does not lower the quality bar to force a partial pack.

| Gate | Result | Evidence / blocker |
|---|---|---|
| G final branch cleanliness | **PASS** | Exact diff from `4033ccc...` is one commit containing 50 PNG additions only: 16 decals + 34 props. No marker, runtime, tooling, world, gameplay, Relay or Supabase changes are carried by G. |
| G binary intake validation | **PASS WITH 3 CROP WARNINGS** | 50/50 decode as 8-bit RGBA PNG, 50/50 contain real transparent pixels, no semi-transparent silhouette fringe detected, canonical names pass. All 34 prop crops reach the bottom edge and are compatible with future bottom-center anchors. |
| Cold Grass final gate | **FAIL** | All three grass sources remain outside the approved final-pixel pixel-art language after the final mechanical-only normalization attempts. All three are **REDRAW REQUIRED**. |
| Required 19-semantic candidate coverage | **FAIL** | Exact candidates remain missing for `decal.residue`, `prop.debris`, `fx.flicker`, and `fx.anomaly`; `terrain.cold_grass` is blocked by redraw. Frozen dirt/asphalt/concrete candidates also remain intake candidates rather than production-promoted pack files. |

**Decision:** stop at readiness. Do **not** create `assets/awakening-v1/manifest.json`. Do **not** perform the conditional presentation-only allowlist refactor or the expanded production `--strict-required` gate yet.

## 2. Governing presentation architecture

Approved direction remains:

> **64×64 gameplay/base terrain + visual-only pixel-art macro terrain detail + decals + props**

The macro layer is presentation-only. It must not own or infer collision, walkability, movement, LOS, interaction authority, loot, mobs, save state or networking. High-frequency grass richness may move into the macro layer, but the 64×64 base grass still needs deliberate final-scale pixel clusters and a low-frequency material read.

No new runtime semantic is introduced by this integration review.

## 3. Phase 1 — G asset import and independent validation

G's self-reported PASS was not used as acceptance evidence. The staged 16 decals and 34 props were re-checked through the canonical PNG decoder / staged intake test path on the integration branch.

Checks performed:

- expected counts: **16 decals + 34 props**;
- canonical lowercase snake_case naming;
- valid PNG decode;
- 8-bit RGBA / PNG color type 6;
- real transparent pixels exist;
- semi-transparent silhouette fringe inspection;
- visible crop bounds;
- prop crop compatibility with bottom-center anchoring;
- G branch diff is presentation-only asset intake.

### Phase 1 result

- **50 / 50** PNGs decode successfully as 8-bit RGBA.
- **50 / 50** contain real transparent pixels.
- **0 / 50** show semi-transparent silhouette fringe in the canonical pixel inspection.
- **34 / 34 props** have visible content reaching the bottom edge, so the raw crops are compatible with future `{x:0.5,y:1}` bottom-center anchor metadata.
- Raw PNG files do not themselves store manifest anchor metadata. Actual `{x:0.5,y:1}` declaration remains mandatory when a production manifest is eventually authorized.

Crop warnings are limited to:

- `aw_v1_decal_store_grime_01.png` — unusually tight crop;
- `aw_v1_decal_tire_mark_curve_01.png` — unusually tight crop;
- `aw_v1_prop_store_counter_02.png` — visible content touches all four crop edges.

These warnings do not block the existing required semantic candidates because `store_grime` remains unbound, `decal.tire` can use `aw_v1_decal_tire_mark_01`, and `prop.counter` can use `aw_v1_prop_store_counter_01`.

## 4. Phase 2 — Cold Grass final mechanical gate

Assets under review:

- `aw_v1_terrain_cold_grass_a`
- `aw_v1_terrain_cold_grass_b`
- `aw_v1_terrain_cold_grass_detail`

Mechanical-only strategies tested across the approved source crops:

1. separator-free source crop;
2. edge-only square repair where required;
3. nearest-neighbor normalization to 64×64;
4. no-dither palette reduction at 16 / 12 / 8 colors;
5. a final pixel-safe attempt using no-dither palette reduction at 16 / 12 / 8 / 6 colors, then selecting the dominant palette index over each output pixel's exact source footprint;
6. 3×3 repetition inspection for every mechanical candidate.

Explicitly not used: bilinear filtering, box/area blur, gaussian blur, antialias, soft painterly filtering, alpha feathering, or manual paint-over presented as mechanical conversion.

### Final result

Palette reduction can reduce the number of colors, but it does not repair the underlying art language. The tuft shapes remain inherited from a high-resolution painterly composition rather than deliberately authored final-scale pixel clusters. Single-pixel noise / moiré persists, and the 3×3 repeat still reveals strong macro repetition, especially in `cold_grass_detail`.

| Asset | Final verdict |
|---|---|
| `aw_v1_terrain_cold_grass_a` | **REDRAW REQUIRED** |
| `aw_v1_terrain_cold_grass_b` | **REDRAW REQUIRED** |
| `aw_v1_terrain_cold_grass_detail` | **REDRAW REQUIRED** |

No mechanical output from this gate is promoted to production candidate status.

### Exact redraw spec for D

D should re-author exactly these three files:

1. **Canvas/output:** exactly **64×64 px** each, authored at final pixel scale.
2. **Base opacity:** fully opaque base terrain. Alpha must not carry terrain authority or blending logic.
3. **Pixel language:** hard deliberate pixel clusters; no antialias, blur, soft gradients, vector-like edges, downsample fringe, or dither used to imitate detail density.
4. **`cold_grass_a`:** low-frequency primary base. Readable dark/cold substrate first; sparse restrained grass clusters second.
5. **`cold_grass_b`:** alternate base with a visibly different but compatible low-frequency cluster distribution; avoid repeating the same focal tuft locations as A.
6. **`cold_grass_detail`:** still a 64×64 base/detail tile, but vegetation accents must remain sparse and intentional. Dense field breakup belongs to the approved macro-detail layer, not this tile.
7. **Material palette:** cold, desaturated Stage-0 grass/soil; restrained contrast; no purple horror tint and no smooth painterly shading.
8. **Family consistency:** pixel density, edge hardness and contrast must match the accepted dirt/asphalt/concrete candidate family.
9. **No baked extras:** no puddles, cracks, props, grime, collision cues or interaction cues baked into the base grass.
10. **Seam requirement:** opposite edges must repeat cleanly in a 3×3 test. Do not place a focal tuft on an edge unless it continues coherently on the opposite edge.
11. **Macro compatibility:** leave enough low-frequency visual calm that 3×3 / 4×4 / 6×6 macro-detail patches can add high-frequency richness without producing density conflict.
12. **Acceptance gate:** exact 64×64, opaque, nearest-neighbor clean, clear final-pixel authorship, 3×3 seam pass, no dominant macro repetition, and no misleading collision silhouette.

## 5. Phase 3 — First 19-semantic production readiness matrix

There are exactly 19 currently approved runtime semantics in this review: terrain ×4, decal ×5, prop ×8, FX ×2. `manifest.example.json` is reference/schema evidence only; it is not a production manifest.

| Runtime semantic | Required asset ID(s) | Source | Candidate | Validated | Bindable now | Blocker |
|---|---|---|---|---|---|---|
| `terrain.cold_grass` | `aw_v1_terrain_cold_grass_a`, `aw_v1_terrain_cold_grass_b`; required support `aw_v1_terrain_cold_grass_detail` | approved visual source | **REDRAW REQUIRED** | final mechanical gate FAIL | **NO** | D exact 64×64 redraw required |
| `terrain.dirt_shoulder` | `aw_v1_terrain_dirt_shoulder_a`, `aw_v1_terrain_dirt_shoulder_b` | frozen normalization evidence | production-candidate evidence | seam/visual candidate PASS | **NO** | candidate PNGs are not yet promoted into the production pack |
| `terrain.asphalt` | `aw_v1_terrain_asphalt_a`, `aw_v1_terrain_asphalt_b`, `aw_v1_terrain_asphalt_cracked` | frozen normalization evidence | production-candidate evidence | seam/visual candidate PASS | **NO** | candidate PNGs are not yet promoted into the production pack |
| `terrain.store_floor` | `aw_v1_terrain_concrete_floor_a`, `aw_v1_terrain_concrete_floor_b` | frozen normalization evidence | production-candidate evidence | seam/visual candidate PASS | **NO** | candidate PNGs are not yet promoted into the production pack |
| `decal.puddle` | `aw_v1_decal_puddle_01` | G final branch | present | **PASS** | **YES after manifest gate** | global gate only |
| `decal.crack` | `aw_v1_decal_asphalt_crack_01` | G final branch | present | **PASS** | **YES after manifest gate** | global gate only |
| `decal.tire` | `aw_v1_decal_tire_mark_01` | G final branch | present | **PASS** | **YES after manifest gate** | global gate only |
| `decal.glass` | `aw_v1_decal_broken_glass_01` | G final branch | present | **PASS** | **YES after manifest gate** | global gate only |
| `decal.residue` | `aw_v1_decal_early_residue_01` | missing | none | not validated | **NO** | exact required decal missing; `store_grime` is not a substitute |
| `prop.fence` | `aw_v1_prop_fence_01` | G final branch | present | **PASS**, anchor-compatible crop | **YES after manifest gate** | manifest must declare `{x:0.5,y:1}` |
| `prop.barrier` | `aw_v1_prop_road_barrier_01` | G final branch | present | **PASS**, anchor-compatible crop | **YES after manifest gate** | manifest must declare `{x:0.5,y:1}` |
| `prop.wall` | `aw_v1_prop_store_exterior_wall_01` | G final branch | present | **PASS**, anchor-compatible crop | **YES after manifest gate** | manifest must declare `{x:0.5,y:1}` |
| `prop.sign` | **`aw_v1_prop_store_sign_mire_mart`** | G final branch | present | **PASS**, anchor-compatible crop | **YES after manifest gate** | production manifest must explicitly bind this exact ID and declare `{x:0.5,y:1}` |
| `prop.counter` | `aw_v1_prop_store_counter_01` | G final branch | present | **PASS**, anchor-compatible crop | **YES after manifest gate** | `counter_02` warning is irrelevant to required `_01`; manifest anchor still required |
| `prop.shelf` | `aw_v1_prop_store_shelf_01` | G final branch | present | **PASS**, anchor-compatible crop | **YES after manifest gate** | manifest must declare `{x:0.5,y:1}` |
| `prop.fridge` | `aw_v1_prop_store_fridge_01` | G final branch | present | **PASS**, anchor-compatible crop | **YES after manifest gate** | manifest must declare `{x:0.5,y:1}` |
| `prop.debris` | `aw_v1_prop_store_debris_01` | missing | none | not validated | **NO** | exact store-debris asset missing; roadside debris is not a substitute |
| `fx.flicker` | `aw_v1_fx_store_failing_light_01` | missing | none | not validated | **NO** | required FX missing |
| `fx.anomaly` | `aw_v1_fx_store_early_residue_01` | missing | none | not validated | **NO** | required FX missing |

## 6. Explicitly unbound assets and forbidden invented semantics

The following remain presentation inventory only and do not create V1 runtime semantics:

- `aw_v1_decal_store_grime_01` / `02` — **UNBOUND**;
- `aw_v1_prop_store_entrance_01` — no `entrance` semantic;
- `aw_v1_prop_roadside_bollards_cone_01` — no `bollard` semantic;
- `aw_v1_prop_roadside_debris_01` and other roadside variants — no generic roadside-debris semantic and not a substitute for `prop.debris`;
- terrain transition art — no transition semantic.

Do not invent grime, entrance, bollard, generic roadside debris, threshold, transition, or other runtime semantics in this production intake.

## 7. Phase 4 — Conditional production manifest decision

**NOT AUTHORIZED.** Required assets are not complete, therefore this branch intentionally does not create `assets/awakening-v1/manifest.json`.

The following conditional pipeline work is also deferred rather than landing half of the production protocol:

1. gameplay-field validation denylist → strict presentation-only allowlist;
2. production `--strict-required` expansion across required terrain + decal + prop + FX;
3. production semantic bindings.

When the gate eventually opens, the production manifest may bind only the existing 19 semantics. `prop.sign` must explicitly bind `aw_v1_prop_store_sign_mire_mart`. Grime remains unbound. No entrance, bollard, roadside-debris or transition semantic may be added as part of that manifest.

The existing fallback contract remains unchanged: formal art unavailable → presentation adapter returns false → programmer art continues.

## 8. Phase 5 validation expectations for this gated branch

Because no production manifest is authorized, the correct validation target is the current staged intake/tooling state:

- canonical validator fixture suite;
- staged 16-decal / 34-prop binary intake checks;
- `--strict-required` fixture/CLI path, which is expected to detect incomplete production packs;
- physical slicer pixel-exact regression;
- preview / mapping / nearest-neighbor regression;
- full existing `terrain-v21-check` CI.

The production-manifest validator step must continue reporting that no production manifest exists rather than validating a fabricated partial pack.

## 9. Unblock requirements

Production manifest work may resume only after all of the following are true:

- D supplies and E validates final-scale 64×64 `cold_grass_a`, `cold_grass_b`, and `cold_grass_detail`;
- exact candidates exist for `aw_v1_decal_early_residue_01`, `aw_v1_prop_store_debris_01`, `aw_v1_fx_store_failing_light_01`, and `aw_v1_fx_store_early_residue_01`;
- the frozen dirt/asphalt/concrete candidate PNGs are explicitly promoted/staged into the production pack with their evidence preserved;
- E re-runs the canonical intake validation and confirms every one of the 19 existing semantics has a legal validated candidate.

Until those conditions are met, this branch remains a production-readiness integration branch, not a production art manifest branch.
