# Awakening High-Resolution Terrain Reference Intake V1

Status: **REFERENCE / MATERIAL / COMPOSITION SOURCE ONLY**

These 36 crops are pixel-exact reference extractions. They are **not** production terrain assets, are not listed in `assets/awakening-v1/manifest.json`, and create no runtime semantics or bindings.

## Rules

- Pixel-exact crop only; no resampling.
- Separator/border pixels excluded by explicit rects.
- Stable reference namespace: `ref_aw_*`, not `aw_v1_*`.
- High-resolution painterly/material references are not converted into production pixel art by downscaling.
- `PASS` requires direct compliance with the locked Modern High-Detail Pixel Art / runtime density / nearest-neighbor readability gate. No crop in this intake passes that gate directly.

## Summary

- Total crops: **36**
- Categories: **base 4 / threshold 8 / transition 16 / macro reference 8**
- Suitability: **NEED REDRAW 1 / REFERENCE ONLY 35 / PASS 0**
- Direct production candidates from these crop bytes: **0**

## 36-entry matrix

| Reference ID | Source | Exact rect | Crop path | Category | Material/content | Suitability |
|---|---|---:|---|---|---|---|
| `ref_aw_s01_r0_c0` | `s01` | `0,0 625×626` | `raw/s01/ref_aw_s01_r0_c0.png` | base | dense cold grass / muddy substrate / puddle-rich field material | **NEED REDRAW** |
| `ref_aw_s01_r0_c1` | `s01` | `628,0 625×626` | `raw/s01/ref_aw_s01_r0_c1.png` | base | dirt shoulder / gravel / puddles / sparse verge vegetation | **REFERENCE ONLY** |
| `ref_aw_s01_r1_c0` | `s01` | `0,628 625×625` | `raw/s01/ref_aw_s01_r1_c0.png` | base | cracked asphalt / gravel breakup / puddled road surface | **REFERENCE ONLY** |
| `ref_aw_s01_r1_c1` | `s01` | `628,628 625×625` | `raw/s01/ref_aw_s01_r1_c1.png` | base | worn concrete slabs / stains / scattered grit | **REFERENCE ONLY** |
| `ref_aw_s02_r0_c0` | `s02` | `3,2 378×379` | `raw/s02/ref_aw_s02_r0_c0.png` | threshold | horizontal asphalt-to-concrete threshold with metal edge, left segment | **REFERENCE ONLY** |
| `ref_aw_s02_r0_c1` | `s02` | `386,2 379×379` | `raw/s02/ref_aw_s02_r0_c1.png` | threshold | horizontal asphalt-to-concrete threshold with metal edge, continuation segment | **REFERENCE ONLY** |
| `ref_aw_s02_r0_c2` | `s02` | `770,2 380×379` | `raw/s02/ref_aw_s02_r0_c2.png` | threshold | vertical asphalt/concrete threshold with metal curb, asphalt-heavy side | **REFERENCE ONLY** |
| `ref_aw_s02_r0_c3` | `s02` | `1154,2 378×379` | `raw/s02/ref_aw_s02_r0_c3.png` | threshold | vertical concrete approach strip framed by asphalt/metal edges | **REFERENCE ONLY** |
| `ref_aw_s02_r1_c0` | `s02` | `3,386 378×379` | `raw/s02/ref_aw_s02_r1_c0.png` | threshold | corner/tee threshold composition with concrete apron and asphalt surround | **REFERENCE ONLY** |
| `ref_aw_s02_r1_c1` | `s02` | `386,386 379×379` | `raw/s02/ref_aw_s02_r1_c1.png` | threshold | angled threshold corner joining horizontal and vertical metal edging | **REFERENCE ONLY** |
| `ref_aw_s02_r1_c2` | `s02` | `770,386 380×379` | `raw/s02/ref_aw_s02_r1_c2.png` | threshold | horizontal threshold segment with broken asphalt and concrete frontage | **REFERENCE ONLY** |
| `ref_aw_s02_r1_c3` | `s02` | `1154,386 378×379` | `raw/s02/ref_aw_s02_r1_c3.png` | threshold | corner threshold composition with concrete apron and asphalt pocket | **REFERENCE ONLY** |
| `ref_aw_s03_r0_c0` | `s03` | `2,2 379×379` | `raw/s03/ref_aw_s03_r0_c0.png` | transition | grass-heavy verge blending through dirt/gravel into cracked asphalt | **REFERENCE ONLY** |
| `ref_aw_s03_r0_c1` | `s03` | `386,2 379×379` | `raw/s03/ref_aw_s03_r0_c1.png` | transition | asphalt-heavy transition with puddle pockets and grass/dirt intrusion | **REFERENCE ONLY** |
| `ref_aw_s03_r0_c2` | `s03` | `770,2 379×379` | `raw/s03/ref_aw_s03_r0_c2.png` | transition | cracked asphalt center with dirt/gravel transition shoulders | **REFERENCE ONLY** |
| `ref_aw_s03_r0_c3` | `s03` | `1155,2 379×379` | `raw/s03/ref_aw_s03_r0_c3.png` | transition | grass/dirt shoulder transitioning into fractured asphalt edge | **REFERENCE ONLY** |
| `ref_aw_s03_r1_c0` | `s03` | `2,386 379×379` | `raw/s03/ref_aw_s03_r1_c0.png` | transition | mud/grass corridor between broken asphalt masses with puddles | **REFERENCE ONLY** |
| `ref_aw_s03_r1_c1` | `s03` | `386,386 379×379` | `raw/s03/ref_aw_s03_r1_c1.png` | transition | grass-heavy shoulder with gravel and asphalt intrusion | **REFERENCE ONLY** |
| `ref_aw_s03_r1_c2` | `s03` | `770,386 379×379` | `raw/s03/ref_aw_s03_r1_c2.png` | transition | broad cracked asphalt field with sparse dirt/gravel transition | **REFERENCE ONLY** |
| `ref_aw_s03_r1_c3` | `s03` | `1155,386 379×379` | `raw/s03/ref_aw_s03_r1_c3.png` | transition | vegetated dirt band cutting into cracked asphalt with puddles | **REFERENCE ONLY** |
| `ref_aw_s04_r0_c0` | `s04` | `0,0 382×382` | `raw/s04/ref_aw_s04_r0_c0.png` | transition | asphalt-to-concrete edge, concrete lower-left / asphalt upper-right | **REFERENCE ONLY** |
| `ref_aw_s04_r0_c1` | `s04` | `386,0 380×382` | `raw/s04/ref_aw_s04_r0_c1.png` | transition | concrete-to-asphalt diagonal edge with rubble and puddle | **REFERENCE ONLY** |
| `ref_aw_s04_r0_c2` | `s04` | `770,0 381×382` | `raw/s04/ref_aw_s04_r0_c2.png` | transition | asphalt-to-concrete edge, asphalt left / concrete right | **REFERENCE ONLY** |
| `ref_aw_s04_r0_c3` | `s04` | `1154,0 380×382` | `raw/s04/ref_aw_s04_r0_c3.png` | transition | concrete strip beside broken asphalt and puddle channel | **REFERENCE ONLY** |
| `ref_aw_s04_r1_c0` | `s04` | `0,386 382×382` | `raw/s04/ref_aw_s04_r1_c0.png` | transition | diagonal asphalt/concrete boundary with loose gravel | **REFERENCE ONLY** |
| `ref_aw_s04_r1_c1` | `s04` | `386,386 380×382` | `raw/s04/ref_aw_s04_r1_c1.png` | transition | concrete corner surrounded by broken asphalt and puddle | **REFERENCE ONLY** |
| `ref_aw_s04_r1_c2` | `s04` | `770,386 381×382` | `raw/s04/ref_aw_s04_r1_c2.png` | transition | concrete slab corner meeting asphalt/gravel boundary | **REFERENCE ONLY** |
| `ref_aw_s04_r1_c3` | `s04` | `1154,386 380×382` | `raw/s04/ref_aw_s04_r1_c3.png` | transition | concrete right-side slab beside fractured asphalt/puddle edge | **REFERENCE ONLY** |
| `ref_aw_s05_r0_c0` | `s05` | `2,2 379×379` | `raw/s05/ref_aw_s05_r0_c0.png` | macro reference | grass-heavy macro field cluster with muddy openings and stones | **REFERENCE ONLY** |
| `ref_aw_s05_r0_c1` | `s05` | `386,2 379×379` | `raw/s05/ref_aw_s05_r0_c1.png` | macro reference | mixed dirt/grass macro breakup with puddles and scattered stones | **REFERENCE ONLY** |
| `ref_aw_s05_r0_c2` | `s05` | `770,2 379×379` | `raw/s05/ref_aw_s05_r0_c2.png` | macro reference | dense grass macro cluster framing open muddy substrate | **REFERENCE ONLY** |
| `ref_aw_s05_r0_c3` | `s05` | `1155,2 378×379` | `raw/s05/ref_aw_s05_r0_c3.png` | macro reference | dirt-heavy macro patch with grass margins and puddles | **REFERENCE ONLY** |
| `ref_aw_s05_r1_c0` | `s05` | `2,386 379×379` | `raw/s05/ref_aw_s05_r1_c0.png` | macro reference | mixed grass/dirt macro composition with puddle focal point | **REFERENCE ONLY** |
| `ref_aw_s05_r1_c1` | `s05` | `386,386 379×379` | `raw/s05/ref_aw_s05_r1_c1.png` | macro reference | vegetation-heavy macro breakup with muddy corridor | **REFERENCE ONLY** |
| `ref_aw_s05_r1_c2` | `s05` | `770,386 379×379` | `raw/s05/ref_aw_s05_r1_c2.png` | macro reference | open dirt/gravel macro patch with sparse grass clusters | **REFERENCE ONLY** |
| `ref_aw_s05_r1_c3` | `s05` | `1155,386 378×379` | `raw/s05/ref_aw_s05_r1_c3.png` | macro reference | dense grass macro field with narrow muddy channels | **REFERENCE ONLY** |

## Production-candidate interpretation

**None of the 36 raw crop bytes are production candidates.** The source language is high-resolution painterly/material reference, not final-pixel authored runtime terrain.

The closest production-directed reference is `ref_aw_s01_r0_c0` because `terrain.cold_grass` still requires final-scale 64×64 redraw; this crop is useful as material/composition reference only. Dirt/asphalt/concrete already have separate frozen candidate evidence, so their S01 crops remain reference-only rather than triggering redundant redraw work.

S02 threshold layouts, S03/S04 transitions, and S05 macro compositions remain reference-only. They do not authorize new threshold/transition/entrance/grime/bollard semantics. S05 is particularly suitable as composition guidance for the approved presentation-only macro terrain layer, but the crop bytes themselves are not production macro art.

## Explicit redraw requirement

- `ref_aw_s01_r0_c0` → **NEED REDRAW** if used to fulfill cold-grass base terrain. D should follow the existing exact 64×64 final-pixel grass spec.
- All other crops → **REFERENCE ONLY** in this batch; no blanket redraw request is created by this intake.
