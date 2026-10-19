# Successor 3/4 high-detail pixel density contract — proposal V2

**Status: DRAFT / OWNER REVIEW REQUIRED / NOT FROZEN / NOT PRODUCTION.**
**Purpose:** replace the assumption that the old 64×32 displayed diamond is the desired art resolution. The user wants the existing game substantially more detailed in its chosen 3/4 view. This proposal distinguishes world-cell geometry, native source resolution, and destination pixels so Engineering and Art can choose a quality/visibility trade-off explicitly.

## Verified baseline

`prototypes/successor-3-4/successor-renderer.js` currently projects one 64×64 world-unit cell into a 64×32 screen diamond, reads one 64×64 tile from the V21 atlas, and draws that cell into 64×32 (`drawDiamond`). It draws V21 24×32 player frames to 28×38, 32×32 mob frames to 38×38, 32×32 resource icons to 28×28, and 48×48 prop cells through their legacy scale/height offset. Smoothing is disabled. These draw dimensions are legacy preview behavior, not a frozen user-approved art contract.

The high-quality gap has two related causes:

1. The active frames are small and many existing source cells have low visible-cluster detail.
2. Increasing source PNG dimensions alone cannot improve the final display if the renderer squeezes/downsamples them back into the same output rectangle. Nearest-neighbor keeps steps sharp; it does not add source detail.

The standalone `64×32` candidate diamonds and `40×96` pier / `36×42` sign examples are not selected production resources. They do not establish a production source or display size.

## Runtime character and camp source-sheet visual audit — 2026-10-05

Directly inspected the active source sheets, separate from any candidate: `assets/player_sheet.png` contains 24×32 player cells, `assets/monster_sheet.png` contains 32×32 monster cells, `assets/camp_props.png` uses 48×48 cells for its eight small props, and `assets/resource_sheet.png` has four 32×32 icons. The source artwork itself has sparse face/clothing/equipment and silhouette clusters; the successor then draws player frames at 28×38, monster cells at 38×38, resources at 28×28, and props through legacy cell scale/offset. This establishes two independent quality limits: little authored detail exists in each source cell, and current display bounds leave little room to read it. Increasing only destination size can make those same sparse clusters larger; replacing only terrain also leaves the player, Guide, monsters, camp stations and collected materials visibly out of the same detail family. The first coherent replacement family should therefore prioritize player + Guide identity, the preparation stations/resources they use, then the first threat silhouette, all against the same ground-density study. These source sheets remain in use and were not modified.

## Candidate display-density tiers

Logical world cell stays 64×64 world units. Each option changes its screen projection. Art is authored natively for the selected renderer reference-space destination size; no asset is resampled to fill a box. The renderer must document how reference-space pixels map to CSS and device pixels at each DPR before density is frozen.

| Tier | Diamond destination per logical cell | Actor frame destination study | 1100px historic arena-width estimate | 390px target viewport-width estimate | Trade-off |
|---|---:|---:|---:|---:|---|
| Legacy proof | 64×32 | 28×38 currently rendered from 24×32 | 17.2 | 6.1 | Most world visible; current actors and pixels read small. |
| **Detail step A (recommended for first review)** | **80×40** | **40×60, four direction rows × four frames** | **13.8** | **4.9** | 25% larger scene pixels; 56% more terrain-pixel area per cell and actor-pixel area vs 32×48. Moderate reduction in visible world. |
| Detail step B | 96×48 | 48×72, four direction rows × four frames | 11.5 | 4.1 | 50% larger scene pixels; 2.25× pixel area; noticeably closer camera, fewer landmarks visible on phone. |

These are comparison inputs, not accepted values. The 1100px figure is a historic arena width; 390px is the total mobile viewport width, not a measured arena width. Dividing either estimate by the diamond width gives only a rough upper bound on visible cells: HUD, controls, crop, letterboxing and aspect ratio reduce the usable area. These numbers are not viewport acceptance evidence. Rendering & Camera must record actual arena bounds and visible world extents in both target viewports.

## Reconciliation with the existing SafeCamp scene board

The current offline `safecamp-continuous-scene-draft-v2` board uses proposed `64×32` ground detail and `32×48` actor studies. Those sizes are useful for its composition review; they do not satisfy the user's request to materially raise pixel detail, and they do not validate how assets read in the live successor. The board's broad grass field, road emphasis, and separated preparation props remain REVISE points from the native-size visual review. Do not treat the existing board as evidence that high-detail art has been accepted.

A read-only engineering review recommends `80×40` ground and `40×60` actor frames as inputs for **one isolated comparison study only**, with image-coordinate contact anchors `(w/2,h)` for actors and props. This agrees with Tier A above and the half-cell-width / 1.5-cell-height actor proportion. It is not confirmation from the responsible Rendering & Camera owner, not a runtime world-point mapping, and not authorization to expand a full terrain/actor family. Before drawing that comparison, the engineering owner still must confirm or revise these finite sample dimensions, image-space anchors, and the reference-space / DPR mapping. Keep the existing scene and its unknown-provenance files intact.

This reconciliation resolves an art-review issue only: the earlier `32×48` sample should not be mistaken for the requested pixel-density increase. It does not freeze projection scale, viewport behavior, draw/sort mapping, terrain tiling, collision or production asset contracts.

## Latest live-candidate visual evidence — 2026-10-05

The current local `index.html` now redirects to `prototypes/successor-3-4/live-candidate.html` (uncommitted shared-worktree change; preserved). I served the checkout on loopback and opened the candidate at an actual 1280×720 browser viewport. The visible screen was the V21 start menu with the successor renderer's projected background: menu typography is crisp, while repeated diagonal mountain/terrain bands dominate the backdrop (**REVISE**). This is a menu capture, not a gameplay scene or the SafeCamp candidate. The SafeCamp offline board was not loaded. I did not activate the menu because the live candidate sets `AW_SUCCESSOR_PREVIEW=false` and retains the real Relay path. The dated handoff records a 390×844 HOME view with small legacy actor/HUD and repeated ground, also **REVISE**; that is prior browser evidence and was not recaptured in this check. Neither view accepts the proposed higher-density art contract.

## Offline SafeCamp source and nearest-neighbor review — 2026-10-05

Inspected `assets/art-candidates/safecamp-continuous-scene-draft-v2/SafeCamp_DRAFT_2xNearestReview_NOT-PRODUCTION.png` at 2×. Pixel steps stay crisp under the documented integer nearest-neighbor enlargement; this is a sampling check, not proof that the 1× source has enough detail for the game. The broad lawn reads largely as empty green with isolated small tufts/patches, furniture and supplies are dispersed across the clearing, and the wide road crosses the preparation/fire focal area and dominates the composition. Improve scene hierarchy by grouping player + Guide + workbench + supplies around the hearth, then route the return path around that working space while preserving a clear pier connection. Use a few larger, intentionally varied material clusters to give the lawn structure; do not add another uniform sprinkle pass. The continuous one-piece shoreline is suitable for coast-composition review but cannot reveal modular tile repetition or neighbor-order seams. These are offline visual observations only; do not alter the candidate source or infer runtime position, collision, alpha compositing or tile contract from them.

An independent read-only PNG pixel scan of all 14 native sprites on this pass decoded 36,392 pixels: there are zero partial-alpha pixels and zero nonzero RGB values under alpha 0. A direct color comparison of every pixel in the 960×600 scene region against its four corresponding pixels in the 1920×1200 scene region found 0 mismatches across 576,000 source pixels / 2,304,000 enlarged samples. This verifies the stored assets' hard alpha and exact 2× nearest-neighbor export only; it does not verify browser compositing or increase detail in the source sprites.

A read-only color-frequency scan of the 960×600 scene rectangle counted 388,333 pixels of HOME mid-grass `#617C58` (67.4%), 99,199 near-shore water `#315E69` (17.2%) and 32,370 dry-sand `#C4A575` (5.6%). The specified darkest grass/wood ramps (`#465F4A`, `#513E31`) did not occur as exact colors; the exact hearth target `#F3C36F` appeared 30 times. This supports the visual impression that broad mid-grass dominates the scene and gives little exact-palette dark/light breakup. For a composition revision, create a few larger value-shaped lawn masses and a more deliberate warm hearth/return-path focal cluster, while keeping the quiet HOME base. Color counts cannot measure perceived contrast or tell whether similarly colored pixels form useful shapes, so this is a revision guide only, not palette or visual acceptance.

Also inspected `assets/awakening-v1/intake/whole-game-art-candidate-v2/safe-camp-terrain-map-offline-dev-preview.png`. Its README identifies it as a native `320×256` / `5×4` V21 terrain-atlas experiment, not a successor 3/4 candidate. At map scale, dense grass motifs repeat in aligned horizontal rows and produce a strong stamped rhythm; the candidate README independently marks this experiment **REVISE** for repetition and insufficient reference-level detail. It must not be used as evidence that `64×64` source dimensions alone solve quality, nor loaded into the successor without a separately agreed projection/mapping. Future terrain review should check authored cluster variation and the full multi-cell composition, not just a close crop or atlas pixel count.

Uniformly raising the projection from 64×32 to 80×40 or 96×48 requires the camera projection and all world draw positions to use the same scale. Input inversion can retain the same direction under uniform zoom, while a fixed world movement speed covers more screen pixels per second. Camera/QA must review perceived movement speed and update or interpret projected-motion diagnostics against the selected scale; this art proposal does not authorize changing world speed or collision.

## Recommended proof contract for owner decision

| Field | Art-side proposal | Required owner decision |
|---|---|---|
| Logical geometry | Preserve 64×64 canonical world cell and existing collision map. | World & Terrain confirms unchanged world/collision coordinate semantics. |
| 3/4 projected cell | Compare 80×40 and 96×48 as native displayed diamonds; do not predeclare 64×32 production art. | Rendering & Camera selects one tier after checking 1280×720 and 390×844 crop, visible route/POIs, and projected input direction/speed. |
| Source pixel density | Draw terrain source diamonds at the chosen destination size, initially opaque through continuous underlay so corner gaps cannot expose canvas. | Rendering & Camera + Asset Pipeline confirm source rect, underlay/composition, reference-space mapping, integer device-pixel ratio policy and high-DPI behavior. |
| Player/Guide | Start review studies at half a projected-cell width and 1.5 projected-cell heights: 40×60 at 80×40 tier, or 48×72 at 96×48 tier. Each actor has bottom-center image placement anchor `(w/2,h)`; foot/shoe pixels end at row `h-1`. Guide silhouette, clothing accents and equipment must be distinct from the player. | Owners confirm actual frame dimensions, exact placement point vs simulation position, four screen-facing rows, idle/walk frame count and frame cadence for local/remotes. |
| Monsters | Scale studies to the same visible humanoid/creature family height, with extra silhouette width per species; include idle and clear windup/attack frames. | Combat & Creatures confirms presentation event/phase availability; Rendering decides shared base pixel density. Art cannot change hit timing/damage. |
| Props/buildings | Source each prop at its chosen visible pixel bounds. Separate source-image bottom contact from world sort anchor and collision footprint. Large shelter has named rear/front occlusion bands. | Rendering & Camera confirms variable source rects, stable sort tie-break, occlusion input and placeholder behavior; World & Terrain keeps collision independent. |
| Pixel clusters / palette | At these larger native canvas sizes, keep large form clusters deliberately shaped, then use smaller seams/folds/highlights only where output resolution can show them. Preserve existing HOME olive/wood/amber vs OUTSIDE cold wet stone/teal contrast; anomaly colors stay rare. | Art Lead reviews side-by-side HOME/OUTSIDE and grayscale value hierarchy; no production palette is implied yet. |
| Asset failure | Missing/bad candidate art visibly falls back to an intentional flat silhouette/status in the preview. | Asset Pipeline confirms per-class load/fallback reporting without gameplay side effects. |

## In-game quality gates

The first review is one complete SafeCamp scene (grass/path/sand/shore, adjacent tent/prep/fire/supply group, player + Guide), authored at the selected native dimensions. Include an adjacent crop comparison for actor feet, tent canvas, workbench tools and shoreline textures, plus a 3×3 material arrangement to expose repetition. Do not produce disconnected icon sheets or complete new creature/building batches before the proof values are accepted.

At 1280×720 and 390×844, the real successor review must record:

- actual arena CSS bounds, canvas backing dimensions, DPR, projection tier, visible logical-world extents, and HUD/control safe areas;
- source and destination dimensions for each reviewed sprite, pixel-step sharpness, tile seams, alpha fringe, actor/prop contact points, sorting/occlusion, and fallback status;
- whether the player, Guide, stations, threat silhouettes, path back to SafeCamp and shore/material transitions remain readable during ordinary movement and interaction;
- no loss/change to existing movement, collision, combat, inventory, save migration, Relay protocol or co-op authority.

Only after finite proof inputs and real dual-viewport review may the main coordinator mark the successor pixel-density/art contract **FROZEN** and authorize coherent family expansion. No claim of completion follows from this proposal or a static enlargement.

## Decision needed from Rendering & Camera / Engineering

Select one comparison tier for a single proof scene, or return another native cell-and-actor size with actual target-world visibility estimates. The user has already rejected treating sparse 64×32 samples as an adequate visual target; do not default back to that contract without a demonstrated high-detail native scene at game scale.
