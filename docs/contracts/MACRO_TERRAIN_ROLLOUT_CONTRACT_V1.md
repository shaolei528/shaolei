# ABYSSAL WAKE — Macro Terrain Rollout Contract V1

Status: Approved presentation architecture contract  
Scope: Contract/spec only  
Non-goals: No gameplay/runtime adoption in this document, no renderer refactor, no collision/system changes

## 1. Purpose

This document freezes the production presentation direction for Awakening World macro terrain rollout.

Approved direction:

**64×64 gameplay/base terrain + visual-only pixel-art macro terrain detail + decals + props**

This is an **architecture adoption** decision, not a production art approval for the prototype reference images `S03.png`, `S04.png`, or `S05.png`.

Those three references remain:

- technical reference only
- composition/material reference only
- non-production runtime art

## 2. Macro Layer Authority

The macro layer is **presentation only**.

### Authority rules

- Gameplay authority remains with the existing **64×64 world/gameplay data**.
- Macro terrain patches must never own or alter:
  - collision
  - movement
  - LOS
  - interaction
  - loot/interactable authority
  - mob behavior
  - save state
  - networking / Relay
- Collision must **never** be inferred from macro image content or image alpha.
- Walkability must **never** be inferred from macro image content or image alpha.
- Macro terrain is not a second terrain gameplay system.

## 3. Approved Footprints

Only the following patch footprints are approved for V1 rollout:

| Cells | World size | Use class |
|---|---:|---|
| 3×3 | 192×192 px | small breakup / verge detail / compact field clusters |
| 4×4 | 256×256 px | medium transition emphasis / store threshold surroundings / parking-adjacent material breakup |
| 6×6 | 384×384 px | long road sections / broad shoulder treatment / large field breakup |

### Footprint guidance

#### 3×3 (192×192)
Recommended for:
- compact grass breakup
- verge clusters
- small puddle-and-grit grouping
- local material richness near a path without dominating the scene

#### 4×4 (256×256)
Recommended for:
- medium road shoulder emphasis
- convenience-store frontage support
- parking threshold enrichment
- medium transition zones between surface families

#### 6×6 (384×384)
Recommended for:
- longer road-side visual continuity
- broad roadside composition passes
- large field/ground repetition breakup
- high-visibility exterior bands around major POIs

### Explicit limits

- Do **not** introduce arbitrary footprint sizes.
- Do **not** scale patches freely to any dimension.
- Do **not** stretch or non-uniformly scale macro artwork.
- Future additional sizes require a separate architecture review.

## 4. Placement and Anchoring

### Hard placement rules

- Every macro patch origin must **snap to the 64 px logical grid**.
- Placement must be **deterministic**.
- Placement must not vary per frame.
- Placement must be compatible with **viewport culling**.
- Rendering must remain **nearest-neighbor compatible**.
- Image smoothing must remain disabled.

### Placement contract

- Patches are authored in world space.
- Patch world footprint derives from approved logical-cell size only.
- Runtime placement data may be hand-authored or data-authored, but must remain deterministic.
- Offscreen patches must not draw.

## 5. Priority Use Areas

Macro terrain should be prioritized in the following production presentation zones:

### 5.1 Long road sections
Use macro terrain to reduce obvious road tiling repetition and create broader surface continuity.

### 5.2 Road shoulder
Use macro terrain to add broader breakup between asphalt and adjacent dirt/grass.

### 5.3 Grass clusters / field breakup
Use macro terrain to break repeated grass-tile patterns and create larger readable ground masses.

### 5.4 MIRE MART exterior / parking surroundings
Use macro terrain to reinforce the store exterior composition, especially:
- parking perimeter
- threshold surroundings
- approach route
- roadside verge near the store

### 5.5 Large environmental transition areas
Use macro terrain where a broad composition band benefits from stronger material continuity than single-tile repetition can provide.

## 6. Forbidden / Cautious Use Areas

Macro terrain must be forbidden or used with strong caution in the following areas.

### Do not use macro terrain as authority in:
- gameplay-critical collision edges
- narrow interaction doorways
- precise obstacle silhouettes
- loot/interactable authority locations
- any location where visual macro shape would contradict real walkability

### Use with caution in:
- tight passages
- exact traversal bottlenecks
- any doorway requiring precise radius readability
- any obstacle edge that players will read as blocking geometry
- any place where high visual density may imply false collision

Rule of thumb:

> If the macro patch could make the player misread collision, walkability, or interactable reach, it is either forbidden or requires a more conservative composition treatment.

## 7. Art Requirements

Formal production macro art must follow the game’s approved visual direction.

### Required visual direction

- **Modern High-Detail Pixel Art**
- hard pixel readability
- nearest-neighbor friendly rendering
- coherent with the project’s 64×64 base terrain
- coherent material language with the rest of Awakening World

### Explicitly disallowed

- painterly airbrush look
- semi-realistic smooth rendering
- photoreal texture language
- soft blended digital-painting gradients
- blurry upscale artifacts
- anti-aliased/soft-edged compositing that breaks pixel readability

### Consistency requirement

Production macro art must maintain:
- compatible pixel density with the 64×64 base terrain
- compatible edge language
- compatible material language
- compatible contrast discipline

## 8. Edge Treatment

Macro rollout must explicitly avoid these failure modes:

- rectangular patch edge readability
- abrupt detail-density step
- obvious texture seam
- macro/base material mismatch

### Required treatment strategy

Preferred edge treatment:
- irregular visual boundaries
- feathered composition via **pixel clusters**
- broken-up material contours
- shape variation that disguises patch extents

### Explicitly disallowed edge treatment

- alpha blur as the main blending strategy
- soft airbrushed edge fade
- obvious rectangular cutout borders
- visibly pasted texture blocks

The goal is to make a macro patch read as part of the same terrain family, not as a separate overlay card.

## 9. Layer Order

Default production presentation layer order:

1. **base terrain**
2. **macro detail**
3. **decals**
4. **props / entities / FX**

### Notes

- Decals remain above macro detail by default.
- Props/entities/FX remain above the ground treatment stack.
- Exceptions are allowed only when a dedicated presentation case explicitly requires it.
- Any exception must preserve gameplay readability.

## 10. Performance Contract

Prototype telemetry established the following approximate draw structure:

- **PC viewport:** about **345 base + 7 macro**
- **Mobile viewport:** about **187 base + 4 macro**

### Important limitation

These figures are **not** a complete real-device FPS / p95 benchmark.

They are accepted only as prototype structural telemetry indicating that:
- macro patch culling is functioning
- macro presentation cost is incremental rather than systemic
- the approved architecture is plausible for production presentation use

### Production acceptance requirement

Before production acceptance of actual shipped macro rollout, **F performance instrumentation** must run:
- PC real-device smoke
- mobile real-device smoke
- real FPS
- avg frame time
- p95 frame time

Prototype telemetry does not replace that later validation step.

## 11. Acceptance Criteria

Before Art / E adoption is accepted, review at least the following:

- seam quality
- repetition reduction
- pixel density consistency
- base/macro material-language consistency
- viewport culling correctness
- no gameplay authority leakage
- no collision inference from imagery
- no walkability contradiction severe enough to mislead players

## 12. Non-Goals

This contract does **not** approve or require:

- gameplay-grid changes
- collision changes
- LOS changes
- interaction changes
- save changes
- networking changes
- new runtime semantic categories
- direct prototype insertion into the normal survival runtime boot path

## 13. Adoption Summary

Approved production presentation direction:

**64×64 gameplay/base terrain + visual-only pixel-art macro terrain detail + decals + props**

References `S03/S04/S05` remain technical only.

Future work should treat this contract as the governing rollout rule set unless superseded by a newer approved contract revision.
