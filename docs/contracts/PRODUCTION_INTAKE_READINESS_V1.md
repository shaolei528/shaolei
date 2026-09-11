# ABYSSAL WAKE — Production Intake Readiness V1

Status: **GATED / production manifest NOT authorized**  
Owner: Chat E — Art Integration / Tooling  
Canonical intake branch: `feat/awakening-production-intake-prep-v1`  
Terrain/tooling base: `feat/awakening-terrain-normalization-v1 @ 2036ad752c8ff0e6fb73b7441b19dfc76f1217bc`  
G source branch reviewed: `feat/awakening-props-decals-intake-v1 @ 33419d0da7401bc142bc6edf9aa282cf7c7c6cc6`  
Macro contract reviewed: `docs/contracts/MACRO_TERRAIN_ROLLOUT_CONTRACT_V1.md @ a36e2976b745c963d43b83848384b1528ad36b5c`

## 1. Gate decision

The first production `assets/awakening-v1/manifest.json` may be created only when A + B + C all pass.

| Gate | Result | Evidence / blocker |
|---|---|---|
| A — G final branch clean | **PASS** | Exact diff from `4033ccc...` contains 50 PNG additions only: 16 decals + 34 props. No runtime/tooling/world changes and no marker files remain in the final diff. |
| B — cold grass production candidate | **FAIL** | Mechanical-only processing does not convert the three painterly/high-frequency grass sources into acceptable final-scale pixel art. All three are **REDRAW REQUIRED**. |
| C — every required runtime semantic has a legal candidate | **FAIL** | Missing exact candidates for `decal.residue`, `prop.debris`, `fx.flicker`, and `fx.anomaly`; `terrain.cold_grass` is also blocked by Gate B. |

**Decision:** stop at this readiness matrix. Do **not** create a production manifest. Do **not** perform the conditional presentation-only allowlist validator refactor or the expanded `--strict-required` production gate in this branch yet.

## 2. Governing presentation rules

The approved presentation architecture is:

> **64×64 gameplay/base terrain + visual-only pixel-art macro terrain detail + decals + props**

The macro layer remains presentation-only. It must never own or alter collision, movement, LOS, interaction authority, loot, mob behavior, save state, networking, or walkability. High-frequency grass breakup can move to the macro-detail layer, but the 64×64 base grass must still be deliberately authored at final pixel scale and remain visually coherent with the other base materials.

## 3. Cold Grass Gate V1

Mechanical-only strategies tested on the approved grass source cells:

- separator-free crop
- edge-only square repair where required
- nearest-neighbor normalization to 64×64
- deterministic no-dither palette reduction at 16 / 12 / 8 colors
- 3×3 repetition inspection

Explicitly not used: bilinear filtering, blur, antialias, painterly filtering, soft resampling, or manual paint-over presented as a mechanical conversion.

Result: palette reduction lowers color count but does not solve the fundamental visual-language problem. Dense tuft structure remains painterly/high-frequency after normalization, single-pixel noise / moiré remains visible, and 3×3 macro repetition remains obvious. Mechanical processing cannot turn these sources into intentional final-scale pixel clusters without materially redrawing the art.

### Frozen grass verdict

| Asset | Verdict |
|---|---|
| `aw_v1_terrain_cold_grass_a` | **REDRAW REQUIRED** |
| `aw_v1_terrain_cold_grass_b` | **REDRAW REQUIRED** |
| `aw_v1_terrain_cold_grass_detail` | **REDRAW REQUIRED** |

### Exact Art Lab spec for D

D should re-author the three grass assets under these constraints:

1. Output **exactly 64×64 px** per asset, authored at final pixel scale. Do not downsample a painterly master and call the result production pixel art.
2. Base terrain is **opaque**. No alpha-dependent blending and no gameplay/collision meaning.
3. Use hard, deliberate pixel clusters. No antialias, blur, soft gradients, resampling fringe, or dither used to imitate texture density.
4. `cold_grass_a` and `cold_grass_b` are low-frequency base/fallback variants. Keep the substrate readable and restrained; do not fill the tile with large repeated tuft motifs.
5. `cold_grass_detail` is still a 64×64 base/detail variant, but vegetation accents must be sparse, deliberately clustered, and materially compatible with A/B. Dense/high-frequency field breakup belongs primarily in the approved macro-detail layer.
6. Palette: cold, desaturated Stage-0 grass; restrained contrast; no global purple horror treatment.
7. Pixel density, edge language, and material contrast must match the accepted dirt/asphalt/concrete candidate family.
8. Opposite edges must repeat cleanly in a 3×3 test. Avoid focal tufts cut by an edge unless they continue seamlessly on the opposite edge.
9. Acceptance requires: exact 64×64 dimensions, opaque base, nearest-neighbor rendering, 3×3 seam pass, no dominant macro repetition, and clear evidence of final-pixel authoring.

## 4. G Asset Validation V1

G's final branch was independently validated; G's own acceptance status was not trusted as evidence.

Validation performed with the canonical PNG decoder / intake test path:

- exact expected counts: **16 decals + 34 props**
- canonical lowercase snake_case filenames
- PNG decode succeeds
- 8-bit PNG
- RGBA / color type 6
- real transparent pixels present
- visible-pixel crop bounds inspected
- semi-transparent silhouette fringe inspected
- no runtime/tooling/world files included in G's final diff

### Binary validation result

**50 / 50** staged PNGs passed the structural PNG / RGBA / real-alpha checks.  
**0 / 50** contain semi-transparent pixels, therefore no resampling fringe / alpha halo was detected by the canonical pixel inspection.

Crop warnings are limited to:

- `aw_v1_decal_store_grime_01.png` — unusually tight crop
- `aw_v1_decal_tire_mark_curve_01.png` — unusually tight crop
- `aw_v1_prop_store_counter_02.png` — visible content touches all four crop edges

These warnings do not block the current required candidate set because:

- `store_grime` has no approved runtime semantic and remains **UNBOUND**;
- `decal.tire` can use clean `aw_v1_decal_tire_mark_01`;
- `prop.counter` can use clean `aw_v1_prop_store_counter_01`.

## 5. Current 19 Runtime-Semantic Readiness Matrix

`manifest.example.json` is schema/reference evidence only. There is still **no production `assets/awakening-v1/manifest.json`**, so all production binding status below remains gated.

| Runtime semantic | Required asset ID(s) | Source status | Candidate status | Validated status | Binding status | Missing / blocker |
|---|---|---|---|---|---|---|
| `terrain.cold_grass` | `aw_v1_terrain_cold_grass_a`, `aw_v1_terrain_cold_grass_b`; supporting required asset `aw_v1_terrain_cold_grass_detail` | Approved visual source exists | **REDRAW REQUIRED** | Mechanical Grass Gate **FAIL** | Default/example IDs exist; production unbound | D must re-author A/B/detail as final-scale 64×64 pixel art |
| `terrain.dirt_shoulder` | `aw_v1_terrain_dirt_shoulder_a`, `aw_v1_terrain_dirt_shoulder_b` | Normalization evidence frozen | **production-candidate** | Candidate seam/visual gate PASS; not production accepted | Example/default mapping exists; production unbound | Global production gate only |
| `terrain.asphalt` | `aw_v1_terrain_asphalt_a`, `aw_v1_terrain_asphalt_b`, `aw_v1_terrain_asphalt_cracked` | Normalization evidence frozen | **production-candidate** | Candidate seam/visual gate PASS; not production accepted | Example/default mapping exists; production unbound | Global production gate only |
| `terrain.store_floor` | `aw_v1_terrain_concrete_floor_a`, `aw_v1_terrain_concrete_floor_b` | Normalization evidence frozen | **production-candidate** | Candidate seam/visual gate PASS; not production accepted | Example/default mapping exists; production unbound | Global production gate only |
| `decal.puddle` | `aw_v1_decal_puddle_01` | G asset present | candidate present | **PASS** — RGBA + real alpha + no fringe warning | Example/default mapping exists; production unbound | None locally |
| `decal.crack` | `aw_v1_decal_asphalt_crack_01` | G asset present | candidate present | **PASS** — RGBA + real alpha + no fringe warning | Example/default mapping exists; production unbound | None locally |
| `decal.tire` | `aw_v1_decal_tire_mark_01` | G asset present | candidate present | **PASS** — RGBA + real alpha + no fringe warning | Example/default mapping exists; production unbound | None locally |
| `decal.glass` | `aw_v1_decal_broken_glass_01` | G asset present | candidate present | **PASS** — RGBA + real alpha + no fringe warning | Example/default mapping exists; production unbound | None locally |
| `decal.residue` | `aw_v1_decal_early_residue_01` | **missing** | none | not validated | Example/default ID exists; production unbound | Exact early-residue decal missing. `store_grime` is not a substitute. |
| `prop.fence` | `aw_v1_prop_fence_01` | G asset present | candidate present | **PASS** — RGBA + real alpha + clean crop | Example/default mapping exists; production unbound | None locally |
| `prop.barrier` | `aw_v1_prop_road_barrier_01` | G asset present | candidate present | **PASS** — RGBA + real alpha + clean crop | Example/default mapping exists; production unbound | None locally |
| `prop.wall` | `aw_v1_prop_store_exterior_wall_01` | G asset present | candidate present | **PASS** — RGBA + real alpha + clean required candidate | Example/default mapping exists; production unbound | None locally |
| `prop.sign` | **`aw_v1_prop_store_sign_mire_mart`** | G asset present | candidate present | **PASS** — RGBA + real alpha + clean crop | **Production manifest must explicitly bind this exact ID.** Current renderer defaults do not define `prop.sign`; example schema does. | Global production gate only |
| `prop.counter` | `aw_v1_prop_store_counter_01` | G asset present | candidate present | **PASS** — RGBA + real alpha + clean required candidate | Example/default mapping exists; production unbound | `counter_02` crop warning does not block `counter_01` |
| `prop.shelf` | `aw_v1_prop_store_shelf_01` | G asset present | candidate present | **PASS** — RGBA + real alpha + clean required candidate | Example/default mapping exists; production unbound | None locally |
| `prop.fridge` | `aw_v1_prop_store_fridge_01` | G asset present | candidate present | **PASS** — RGBA + real alpha + clean required candidate | Example/default mapping exists; production unbound | None locally |
| `prop.debris` | `aw_v1_prop_store_debris_01` | **missing** | none | not validated | Example/default ID exists; production unbound | Exact store-debris asset missing. `aw_v1_prop_roadside_debris_01` must remain unbound and is not a substitute. |
| `fx.flicker` | `aw_v1_fx_store_failing_light_01` | **missing** | none | not validated | Example/default ID exists; production unbound | Required FX missing |
| `fx.anomaly` | `aw_v1_fx_store_early_residue_01` | **missing** | none | not validated | Example/default ID exists; production unbound | Required FX missing |

## 6. Explicitly UNBOUND assets / non-semantics

The following do not create new runtime semantics in V1:

- `aw_v1_decal_store_grime_01` / `02` — **UNBOUND**; keep as optional visual inventory only.
- `aw_v1_prop_store_entrance_01` — asset may exist, but there is no approved `entrance` runtime semantic.
- `aw_v1_prop_roadside_bollards_cone_01` — no approved `bollard` runtime semantic.
- `aw_v1_prop_roadside_debris_01` and other `aw_v1_prop_roadside_*` variants — do not invent a generic roadside-debris semantic and do not substitute them for `prop.debris`.
- Terrain transition art — do not invent transition runtime semantics.

No `grime`, `entrance`, `bollard`, generic `roadside debris`, or terrain-transition semantic is authorized by this document.

## 7. Pipeline debt status

The following work is intentionally deferred because A+B+C did not all pass:

1. Do **not** create `assets/awakening-v1/manifest.json`.
2. Do **not** change gameplay-field validation from denylist to the proposed strict presentation-only allowlist yet.
3. Do **not** expand production `--strict-required` to terrain + prop + decal + FX yet.
4. Do **not** add or modify runtime semantics / bindings.
5. Do **not** modify world/gameplay/collision/combat/save/Relay/Supabase.

The current canonical runtime fallback contract remains unchanged: formal art unavailable → presentation adapter returns false → existing programmer art remains visible.

## 8. Next unblock requirements

Production-manifest work may resume only after:

- D supplies and E validates final-scale 64×64 `cold_grass_a`, `cold_grass_b`, and `cold_grass_detail`;
- Art Lab supplies exact candidates for `aw_v1_decal_early_residue_01`, `aw_v1_prop_store_debris_01`, `aw_v1_fx_store_failing_light_01`, and `aw_v1_fx_store_early_residue_01`;
- E re-runs the canonical intake validation and confirms A+B+C all pass.

Until then this branch is a production-intake preparation branch, not a production art manifest branch.
