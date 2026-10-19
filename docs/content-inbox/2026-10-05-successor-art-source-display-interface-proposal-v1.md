# Successor art source-to-display interface proposal

**DRAFT / ENGINEERING FREEZE REQUIRED / NOT PRODUCTION.** This is an interface proposal for Rendering & Camera and Asset Pipeline owners. It does not authorize runtime changes, asset promotion, or bulk art production.

## Decision needed

Approve one small, measurable SafeCamp art slice contract before the art team expands a reusable family. Keep source-image pixels, logical world units, CSS display pixels, and backing-store/device pixels as separate values. Never treat a PNG's width/height as its in-game size by default.

## What is already safe for the offline review board

| Input | DRAFT source dimensions | Art contact/reference point | Approved scope |
|---|---:|---|---|
| Ground sample | 80×40 | diamond center `(40,20)` | one connected composition review board only |
| Player / Guide proportion still | 40×60 | bottom-center `(20,60)` | single stills on that board; no runtime animation sheet |
| Props | per-image dimensions in board README | bottom-center `(w/2,h)` for visual contact | composition placement only; collision footprint remains separate |

Rendering & Camera's review confirms these are internally consistent **as composition inputs**, not reusable loader or production dimensions. The ground/actor values do not specify destination CSS dimensions or world-space scale.

## Runtime facts that must remain explicit

- The current successor projects a 64×64 logical cell to a 64×32 CSS-pixel ground diamond (`prototypes/successor-3-4/camera-adapter.js:3`; `successor-renderer.js:21-35`).
- The current actor loader crops 24×32 source frames and draws them as 28×38 CSS px (`successor-renderer.js:41`). Props use a 48×48 crop and current heuristic vertical offset (`:40`). These are existing renderer behaviors, not approved art targets.
- The camera applies 2× `displayScale` for arena widths below 480 CSS px; canvas backing dimensions separately use DPR capped at 2 (`camera-adapter.js:10-11`; `successor-renderer.js:17,54`). A 40×60 source frame is not permission to draw at 40×60 CSS px and then double it.
- A paired guarded-preview QA pass reports the same build at 1280×720 outer viewport / 1100×589 CSS arena and 390×844 / 390×713 CSS arena (`docs/handoffs/2026-10-05-dual-viewport-guarded-successor-qa.md`; expanded backing/source mapping measurements are recorded in `docs/PROJECT_STATE.md`). Desktop canvas backing is 1881×1008, about 1.71 backing pixels per CSS pixel; narrow responsive-emulation backing is 390×713, a 1:1 backing-to-CSS ratio. **Neither ratio measures the physical device's `devicePixelRatio`.** Renderer `displayScale` requests 2× below 480px. Active source-to-CSS destinations and these backing ratios describe the current preview only, not target contracts or physical-phone data. The ±world-unit view bounds are inverse-projection estimates, not measured renderer culling bounds; exact visible bounds and HUD/control safe-area overlaps remain unverified.

## Rendering & Camera review — read-only decision

The engineering review accepts the offline-board limits above and returns these statuses for any reusable/runtime family:

| Interface | Review status | Required before art-family freeze |
|---|---|---|
| 80×40 ground sample | **ACCEPT for offline composition only; MEASURE for runtime mapping.** Current 64×64 world cells project to 64×32 CSS px. | Choose source-to-CSS sampling and verify seams, pixel stability, visible world coverage and movement feel. Keep 64×64 world/collision semantics unless World & Terrain separately approves a change. |
| Actor bottom-center contact | **ACCEPT as contact-point semantics; MEASURE for runtime dimensions/animation.** `40×60` is board-only. | Map the canonical world foot point to image anchor; specify source frame, CSS destination, direction/frame layout, timing and transparent padding. Current V21 draws 24×32 crops at 28×38 CSS px. |
| Props | **ACCEPT separate visual anchor from collider; REVISE current renderer for a reusable family.** | Declare per-asset source rect and actual ground contact; define stable foot-depth tie-break, plus ground footprint and occlusion bounds for large buildings. Current 48×48 crop/heuristic offset is not the new contract. |
| Narrow zoom / DPR | **MEASURE; current 480 px threshold and 2× zoom are not production-frozen.** Paired guarded-preview DPR/backing and configured display mappings are now recorded. | Measure exact visible-world bounds and safe-area geometry; decide whether mobile 2× crop/coverage is acceptable. Do not use backing pixels as a substitute for content detail. |
| Missing art / fallback | **ACCEPT current simple shapes as development fallback only; MEASURE production behavior.** | Force-load failures by asset family; record URL/status, fallback rendering, console outcome and confirm the world/HUD/gameplay still start. |

**Freeze status: PARTIALLY UNBLOCKED.** Same-build viewport/arena rectangles, canvas backing ratios, configured current source-to-CSS draw destinations and camera zoom request are now recorded. The remaining screen-contract blocker is exact visible-world/culling coverage and safe-area/overlap geometry. The current source-to-CSS values describe old live assets; `80×40` / `40×60` review-board inputs still have no runtime binding or accepted destination sizes. No visual acceptance is implied: both viewport captures remain REVISE, and physical phone DPR/touch remains UNKNOWN.

## Rendering & Camera decisions ready for partner sign-off

Rendering & Camera recommends freezing these **screen-independent interface semantics** now. This freezes field meaning and ownership only; per-asset values, runtime implementation compliance and production promotion still need their owners' review.

| Interface | Ready-to-freeze semantic | Owner / limits |
|---|---|---|
| Actor/NPC contact | Each asset declares a source-image contact anchor. Default human actor anchor is bottom-center `(w/2,h)`; map it to the canonical world foot position after projection. Other forms declare their own contact point. | Rendering & Camera owns projection; Asset Pipeline stores/validates metadata; Animation & Presentation consumes it. Does not set frame dimensions, collider radius or interaction distance. |
| Source rect / alpha / trim metadata | Every asset/frame carries stable ID, source rect, native dimensions, alpha/trim offset, transparent padding and anchor. Animation entries additionally declare frame size/order, direction rows and timing. | Asset Pipeline owns schema and validation; rendering verifies sampling. This defines metadata fields, not art dimensions, visual-alpha quality or manifest acceptance. |
| Collision separation | Image bounds, source rect and alpha never define collision. Logical collider/footprint comes from its world-domain owner. | World & Terrain owns terrain/POI footprints; HOME & Building owns camp/building footprints; Movement consumes logic. Camera projection only changes display/input mapping. |
| Sorting / occlusion | Default sort key uses explicit world foot/contact anchor `worldX + worldY`; stable instance ID breaks equal-depth ties. Large buildings declare ground footprint and rear/front occlusion bounds or bands. | Rendering & Camera owns draw order; World & Terrain / HOME & Building provide geometry; Asset Pipeline carries anchor/ID. Current single-point prop offsets and procedural POI forms are not thereby declared compliant. |

**Freeze boundary:** engineering has reviewed these semantics, but partner-owner sign-off from Asset Pipeline and the relevant world modules is not yet recorded. Even after that sign-off, batch art stays paused until QA resolves exact world coverage/safe-area overlap, owners pick candidate source-to-CSS destinations, and both REVISE captures are reviewed after the resulting layout/art adjustment.

**Allowed next step:** Rendering & Camera approves one isolated SafeCamp source-to-display mapping experiment as local review-only work using a clearly labeled candidate. It may not change the renderer, manifest, production entry, world collision or saved/network behavior, and it does not authorize a reusable-family batch. Keep it separate from unknown-provenance candidate files; mark the result REVISE unless both target views and all owners accept it.

## Minimum paired QA supplement

Already recorded for both viewport captures: arena CSS rectangles; desktop and narrow-emulation backing sizes; requested CSS zoom tier; current legacy asset source/destination mappings. The remaining supplement is:

- Exact visible-world/culling min/max bounds and visible 64×64 logical cell counts at each arena; separate measured values from the current inverse-projection estimate.
- Safe-area insets plus HUD/task/survivor panels, joystick/action grid, inventory and interaction prompt rectangles; list exact overlapping pairs and pixels.
- Explicit proposed destinations for the `80×40` / `40×60` offline inputs, tested for pixel stability and world coverage before reusing them. They remain offline-only unless actually loaded.
- Review both revised target views for one tile seam and actor-foot/building overlap. Existing QA screenshots were not written to the repo, so retain reviewable evidence outside production assets. Browser-emulated phone remains distinct from physical touch/device acceptance.

## Proposed metadata and owner decisions

Before expanding beyond this review board, have both owners fill and approve these fields for one SafeCamp family:

| Field | Required value / decision owner |
|---|---|
| Asset ID, family and source file | Asset Pipeline |
| Source rectangle and native pixel dimensions | Asset Pipeline |
| Logical world footprint or tile role | World & Terrain / HOME & Building; visual pixels do not set collision |
| Image contact anchor in source pixels | Art + Asset Pipeline; actor contact is proposed at bottom-center |
| Destination width/height in CSS px at reference zoom | Rendering & Camera must specify per family |
| Camera zoom behavior on narrow arenas | Rendering & Camera must say whether objects scale with world zoom or use another explicit rule |
| Backing-store DPR and pixel-snap rule | Rendering & Camera |
| Animation frame order/timing and transparent padding | Rendering & Camera + Asset Pipeline; stills carry no implied animation contract |
| Prop foot-depth key, occlusion bounds and independent collider | Rendering & Camera + World & Terrain/HOME & Building |
| Missing-art fallback and alpha/underlay behavior | Rendering & Camera + Asset Pipeline |
| Evidence | QA captures actual 1280×720 and 390×844 successor scenes, records arena CSS bounds and DPR, and checks movement, overlap, sharpness, safe areas and world coverage |

## Proposed freeze sequence

1. Rendering & Camera measures both real successor arenas and records zoom, DPR, visible world coverage and control/HUD safe areas.
2. Owners choose source-to-CSS display sizes that preserve deliberate pixel clusters at both target views. For any non-integer source/display ratio, inspect shimmer and edge quality before approval.
3. Asset Pipeline records IDs, source rectangles, anchors, alpha and animation metadata; world/collision owners separately provide logical footprints.
4. QA reviews one small connected SafeCamp candidate in the actual successor. Only after owner signatures and both viewports are accepted may the family expand.

Until that freeze, retain `safecamp-tier-a-review-board-v1` as **DRAFT / REVISE**: its 1×/2× board is offline art review, not runtime or mobile acceptance.
