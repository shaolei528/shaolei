# Awakening Terrain Raw Intake Reference

Donor reference: `2fa31e748ab5f20b91fe4628e1542170304cc57f`.

This file is carried selectively onto `feat/awakening-terrain-normalization-v1` as intake/reference metadata only. It does **not** register production terrain.

## Raw batch

- Source sheets: 5
- Raw crop ids: 36
- Stable range: `aw_v1_terrain_s01_r0_c0` through `aw_v1_terrain_s05_r1_c3`
- Prior classification:
  - base terrain candidates: 11
  - transition candidates: 16
  - threshold/store-floor candidates: 9
- Direct production compliance before normalization: 0 / 36

## Sheet roles

- S01: grass / dirt / asphalt / concrete material references; 1254x1254 and not suitable for strict 6:1 normalization.
- S02: store threshold / floor transition references; 1536x768.
- S03: irregular grass / dirt / asphalt transition references; 1536x768.
- S04: asphalt / concrete edge and corner transition references; 1536x768.
- S05: grass / dirt base-variation references; 1536x768.

All files under `assets/awakening-v1/intake/` are non-runtime data. The production manifest remains authoritative only for accepted exact-grid assets.
