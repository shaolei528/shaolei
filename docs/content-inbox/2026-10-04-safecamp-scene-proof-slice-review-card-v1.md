# SafeCamp scene proof slice — owner review card V1

**Status: DRAFT / OWNER DECISIONS REQUIRED / NOT FROZEN / NOT PRODUCTION.**
**Lead owner:** Rendering & Art. **Required decisions:** Rendering & Camera, World & Terrain, UI & Map, Asset Pipeline, Integration & QA. This card only defines review questions for the existing isolated candidate; it does not authorize runtime edits or a larger asset batch.

## Purpose

Move the existing continuous SafeCamp composition toward a reviewable successor proof slice. Preserve its 960×600 1× authored scene and individually sized source studies. Do not convert the composition into a production map, atlas, collision source, or runtime texture. The whole-scene board is at [`assets/art-candidates/safecamp-continuous-scene-draft-v2/README.md`](../../assets/art-candidates/safecamp-continuous-scene-draft-v2/README.md).

This scene must show the existing player preparing at a humane HOME with a Guide, adjacent shelter/workbench/fire/supplies, and a legible path through grass to sand and shore. These are composition goals, not claims that all depicted objects have matching runtime systems.

## Existing evidence and integration boundary

- `prototypes/successor-3-4/successor-renderer.js` currently renders V21 state through legacy sheets: 64×64 terrain cells projected to 64×32 diamonds, 48×48 camp-prop cells placed with a `.76×height` vertical offset, 24×32 actors drawn 28×38 without explicit foot-anchor metadata, 32×32 resources drawn 28×28, and scene-object depth order by world `x+y`.
- The candidate instead has a 960×600 continuous hand-composed ground image, 32×48 actor studies with a candidate contact point `(16,48)`, and individually sized props with candidate bottom-center contacts. The scene bitmap has no world bounds/transform metadata, material cell map, depth IDs, or occlusion bands. It is not directly consumable by the current renderer.
- `docs/handoffs/2026-10-04-successor-renderer-engineering-contract.md` is explicitly **PROPOSAL / NOT FROZEN**. `docs/content-inbox/2026-10-04-successor-art-contract-and-runtime-inventory-v1.md` also records owner confirmation and target-image gates as outstanding. A suggested value in either file is not an approval.
- Rendering & Camera owns projection, viewport/pixel scale, anchors and ordering. World & Terrain owns world coordinates, terrain query and collision. UI & Map owns panel/HUD/safe-area presentation. Asset Pipeline owns source/frame metadata and asset loading status. Integration & QA owns evidence. Artwork, alpha and preview marks must never define collision, damage, rewards, or network state.

## Decision table — owner must fill or explicitly reject

| Contract field | Candidate review input (not frozen) | Current successor behavior | Decision required from named owner | Evidence required |
|---|---|---|---|---|
| Scene ground representation | Keep the 960×600 image as an offline composition reference; if runtime art is desired, author source tiles/material layers separately after mapping. | Terrain is drawn per logical cell from the legacy 64×64 V21 atlas into a 64×32 projected diamond. | Rendering & Camera + Asset Pipeline: can the proof use selected individual source sprites over real terrain, or must this pass remain offline? World & Terrain: which current material IDs exist in the scene slice? | Named material IDs and world extents; no collision change; runtime layer screenshot. |
| Camera and world-to-screen | Existing candidate README shows its proposed 2:1 composition arithmetic for selected reference points; adjusted positions are not authoritative. | Successor uses its camera adapter and real V21 positions. | Rendering & Camera: projection origin, zoom/pixel viewport, camera crop and world-to-screen mapping for this review state. | Measured canvas CSS/backing dimensions, DPR and source-pixel scale at target viewports. |
| Actor source and ground contact | 32×48 frame, lower-center `(16,48)`, opaque shoe row 47 (candidate-study proposal only). | Legacy 24×32 source is drawn 28×38; no explicit actor anchor. | Rendering & Camera + Asset Pipeline: accept/revise frame dimensions, anchor coordinate semantics, direction rows, frame count/timing, integer destination rule and local/remote consistency. | Raw source crop over a projected ground-cell center and live moving actor at both viewports. |
| Prop source bounds and contact | Native bounds per item; candidate bottom-center `(width/2,height)`. | Legacy 48×48 prop source cells and `.76×height` placement. | Rendering & Camera + Asset Pipeline: confirm variable source bounds/contact anchor, separate sort/world anchor, shadow compositing and fallback placeholder. | Shelter, fire and workbench with player in front/behind; contact and fallback visible in live preview. |
| Occlusion and depth tie | Candidate scene is flattened and cannot establish sorting. | Existing successor draws class passes; scene entities currently sort by `x+y`, without authored building front/rear bands. | Rendering & Camera: exact stable tie-break and rules/API for building footprint, roof/rear/front bands. World & Terrain: provide footprint references separately from collision geometry. | Player walks behind/in front of shelter and Guide/workbench without pop or visual collision mismatch. |
| Pixel scale and alpha | All native studies stay at listed size; the scene bitmap is opaque. | Canvas backing uses arena rect × capped DPR and disables smoothing. | Rendering & Camera + UI & Map: integer/fractional scale policy, letterbox/safe-area composition and alpha fringe handling. | Source crop comparison and actual browser/device capture at 1280×720 and 390×844. |
| Failure fallback | Candidate folders are not runtime-loaded. | Current preview reports image dimensions/fallbacks for legacy sheets. | Asset Pipeline + Rendering & Camera: selected asset ID/URL resolution and visible fallback state for candidate load errors. | Force one isolated preview image failure; show safe fallback and diagnostic without gameplay object changes. |

No field above becomes frozen through silence, source similarity, a passing unit fixture, or this review card. Record the owner's name/role, chosen value, date, source/API, and whether it applies only to this proof slice or is the successor production contract.

## Five-game experience checks for this one scene

These checks translate player-experience lessons into visible acceptance; they do not add features or imitate reference-game content.

| Lesson | SafeCamp scene question |
|---|---|
| Crashlands | Are the player, Guide, workbench, fire and nearby threats distinguishable by silhouette and value at native gameplay scale? No combat content is invented in this HOME proof. |
| Terraria | Can the path and shoreline suggest a clear way out of the safe area while keeping existing resources/landmarks identifiable? Do not draw a route beyond authored geometry. |
| Minecraft | Does the cluster read as a usable, personal camp with recognizable shelter, preparation station and supplies, without claiming free building features? |
| Don't Starve | Does the boundary from warm safe lawn to cool wet shore read clearly while the return direction remains visually legible? No fake hunger/danger meter is added. |
| Stardew Valley | Does the Guide and lived-in arrangement make return feel welcoming? Do not imply schedules, friendship scores or unimplemented NPC behaviors. |

## Visual audit of the current offline board

**VERIFIED file inspected:** `assets/art-candidates/safecamp-continuous-scene-draft-v2/SafeCamp_DRAFT_DEV-ART-PREVIEW_1x_NOT-PRODUCTION.png`, decoded at 960×632 (artwork occupies y=0..599; footer is y=600..631). The 1920×1264 file is the nearest-neighbor enlargement. The displayed image was reviewed at board scale in this session; no crop, target viewport render, or source edits were made.

- **Primary silhouette hierarchy — REVISE:** the continuous brown trail enters from the left edge around y≈190, cuts across the central player/fire cluster, then turns down-right to the pier. It is the strongest long diagonal and can pull attention away from the two tents. Keep its path function, but test a narrower/less saturated central span or a quieter entrance approach so the shelter + fire reads first at native gameplay scale. This is a composition proposal, not a renderer change.
- **HOME identity — promising, still REVISE:** two canvas shelters, a workbench, fire, crates, bedroll, benches and lamps are visually present. Their cluster spans much of the upper-middle field, but small isolated props on the far-right/northeast fence line have weak functional grouping. If revising the offline composition after contract confirmation, make the prep cluster (Guide/workbench/supplies) read as one human-use area and keep the rest as quieter perimeter dressing.
- **Actor legibility — unverified in play scale:** the two people can be distinguished on this 960px-wide sheet, and their packs/cap give them different color accents. The static board does not prove that a 32×48 native actor reads at actual camera zoom or over a moving/player crowd; retain **UNKNOWN** until candidate-loaded viewport review.
- **Shore/navigation — KEEP the value transition, check the route:** grass, dry sand, wet edge and cool water separate cleanly. The pier terminates at the shore and the arrow sign points back toward camp in the scene study. They support the Terraria/Don't Starve discovery-versus-return read, while the welcoming Guide/camp supports the Stardew/Minecraft homecoming read. They do not prove runtime pathfinding, safe return, building or NPC behavior.
- **Material density — REVISE:** the lawn still contains broad quiet fields, especially upper-left and upper-right, while small repeated accents (grass tufts, rocks and short fence sections) are much finer than the tents/path. Preserve negative space; next revision should use a few larger, distinct lawn-material groupings tied to the camp perimeter rather than adding more scattered dots. Verify at 1× and crop magnification to avoid turning the meadow into noise.
- **Crashlands pillar:** this is a HOME composition and contains no encounter; do not add an enemy solely to fill space. Combat silhouette/telegraph readability belongs in a separate complete OUTSIDE encounter scene after the same art contract is frozen.

These observations are art-direction review, not measured in-engine behavior. The next useful art edit is a single composition-only revision of existing scene layers, preserving source sprites and their bounds; however, do not run the current builder until its ownership/overwrite safety is established because it rewrites all native PNGs and both boards in place.

## Required acceptance sequence

1. Responsible engineering owner first accepts or revises the limited review inputs: terrain source/display rect, actor frame/contact anchor, and prop source-bounds/contact anchor. These values govern only one review scene; no batch expansion is allowed. Do not scale/resample source files to imitate the proposed sizes.
2. Rendering & Camera, World & Terrain, Asset Pipeline and UI & Map decide the remaining proof-specific fields above. Main coordinator records the accepted finite proof contract with version/date and says whether it is proof-only or production-wide.
3. Review the already-existing complete SafeCamp scene candidate against the finite source contract. Change only its isolated candidate files after the owners select/revise the concrete visual changes; do not draw a larger asset family.
4. After the finite proof contract and a separately scoped preview task are authorized, create a guarded candidate-only adapter/placement layer. It must read current snapshots and preserve V21 world/collision/save/Relay authority. No production manifest is changed by this card.
5. Capture the real successor at exactly 1280×720 and 390×844. Check scene crop, native pixel scale, actor/prop contacts, shore/material repetition, occlusion, HUD/control safe areas, missing-art fallback and original source pixels. Run through normal player movement for contact/occlusion views; a static composite alone cannot pass.
6. Keep **REVISE / DRAFT / NOT PRODUCTION** until all evidence exists. Broader asset-family expansion still requires the complete contract freeze and lead-owner sign-off.

## Current disposition

**BLOCKED for scene-candidate changes that depend on source dimensions/anchors, renderer integration and batch art expansion:** the engineering proposal does not contain a responsible engineering owner's explicit acceptance/revision of the limited sample source sizes and contact anchors. This is not a blocker to editing the written visual direction or reviewing existing pixels, but any source-art edit before that decision would risk authoring to the wrong contract. Remaining display/world mapping, prop depth/occlusion, alpha composition and fallback are also unresolved for the later guarded-preview phase. **UNKNOWN:** actual candidate rendering at either target viewport; no candidate-loaded successor screenshots are attached to this card.
