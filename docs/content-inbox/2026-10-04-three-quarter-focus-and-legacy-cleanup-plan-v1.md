# 3/4 focus and legacy cleanup plan V1

**Status: DRAFT / SOURCE-AUDITED / NO FILES DELETED / NO PRODUCTION PATH CHANGED.**
Repository at review: `fix/awakening-production-gate-qa-findings-v1`, HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`. Many files are modified/untracked with UNKNOWN provenance; retain them until ownership is known. This plan records the user's clear direction: focus on the chosen 3/4 oblique gameplay and retire the old pure top-down presentation after its dependencies have been replaced safely.

## What is causing the low-quality read

### Small source frames in the current V21 path

| Current file | Source | Current renderer destination | Finding |
|---|---:|---:|---|
| `assets/player_sheet.png` | 96×128 total; 4×4 frames of 24×32 | 28×38 in successor proof; V21 base renderer uses a 1.18 scale | Player is the clearest measurable quality bottleneck: the actual pose is built from a small 24×32 source frame. It cannot show face/clothing/silhouette detail comparable to the user's target. |
| `assets/monster_sheet.png` | 128×96; 4×3 frames of 32×32 | 38×38 in successor proof | Very small animation poses and limited cluster detail. |
| `assets/camp_props.png` | 192×96; 4×2 cells of 48×48 | Cell draw with legacy scale values | Eight small shared camp props; no native per-building bounds or authored depth bands. |
| `assets/resource_sheet.png` | 128×32; four 32×32 cells | 28×28 world nodes; 38×38 inventory CSS cells (152×38 background size) | Sparse details; inventory CSS enlargement is 19/16 and is a sampling risk. |
| `assets/art-v21/terrain-v21.png` | 320×256; 5×4 cells of 64×64 | V21 top-down renderer uses 64×64; successor crops same source cells and draws them as 64×32 diamonds | The successor projection halves terrain source height. This is the visible `64×32` presentation concern; it did not make the source atlas high detail. |

These dimensions are not the only quality measure, but the small source pixel count and current low cluster density directly limit visible detail. Nearest-neighbor preserves crisp pixels; it cannot invent detail absent from the source. Increasing source pixels is only useful with a declared display/world mapping and deliberately authored high-detail clusters. Do not solve it by arbitrarily stretching legacy sprites.

### The specific sizes the user noticed

Repository-wide PNG size scan found:

- `64×32` ground diamonds, including `grass_103_64x32.png`, `road_110_64x32.png`, `sand_117_64x32.png`, `shore_131_64x32.png`, and `water_124_64x32.png`, are in `assets/art-candidates/safecamp-successor-proof-v1/native/terrain/` only. They are not loaded by V21 or `prototypes/successor-3-4/`; several named alternatives within road/sand/water groups are pixel-identical and the folder is marked **REVISE**.
- `40×96` is `assets/art-candidates/safecamp-successor-proof-v1/native/props/shore_pier_40x96.png`, a review-only pier study.
- `36×42` is `assets/art-candidates/safecamp-successor-proof-v1/native/props/return_sign_36x42.png`; a copy also appears in the continuous-scene candidate. Both are isolated scene studies.
- These three examples are not the current formal game assets. They have no production manifest binding and are not source files read by the active renderers.

The optional Awakening art loader uses `manifest.json` normally, but that file is absent. `manifest.preview.json` is selected only by `?awArtPreview=1`; the V21 terrain preview atlas is selected only by `?awTerrainArtPreview=1`. The preview manifest currently declares 57 files, but its edits and candidate provenance are UNKNOWN. I did not add these images to production or author the pre-existing candidate files.

## What “V1 / V2 / V7 / V12” means in this repository

Version numbers are used for different things and cannot be deleted as a group:

| Name pattern | Actual role | Current decision |
|---|---|---|
| `survival-v3.html`, `survival-v7.html`, `survival-v8.html` … `survival-v17.html`, `survival-v21.html` | Standalone page/boot snapshots from different stages | Audit one file at a time. As of 2026-10-05, local `index.html` redirects to the 3/4 live candidate; this uncommitted local change is not a public deployment or art acceptance. `survival-v7.html` is still fetched by V21 as its full UI/CSS/DOM template (`survival-v21.html:33`), so it cannot be deleted yet. V16/V17 also have current CI and regression-test readers. |
| `modules/*-v1.js`, `*v12.js`, `*v18.js`, `*v19.js`, `*v20.js`, `terrain-v21.js` | Named system/API revisions that the V21 loader deliberately combines | These are not whole-game “old builds”. `survival-v21.html:28` currently loads World Spatial V1, Interaction V12, inventory V19, Relay V16, network quality V20, Terrain V21, and newer expedition/UI/combat modules. Removing them by number would break the V21 gameplay underneath the 3/4 successor proof. |
| `prototypes/camera-3-4-v1/`, `prototypes/camera-3-4-v2/` | Standalone camera studies; no canonical world/save/Relay integration. V2 loads draft sheets and its README explicitly reports the player small/low-detail and building blockout. | Old studies can be considered for retirement after dependency/reference check; do not confuse them with the active gameplay-backed `prototypes/successor-3-4/`. Their change provenance is currently unknown/untracked. |
| `prototypes/successor-3-4/` | Current chosen 3/4 presentation proof using the V21 world, movement/collision and gameplay modules behind a local fail-closed preview. | **KEEP / PRIMARY 3/4 PROOF.** Not production-complete: preview disables Relay and uses in-memory save shim; source rendering still uses legacy V21 art. |

## Exact dependency boundary before old pages can go

1. The local `index.html` now redirects to the live 3/4 candidate, while V17 is separately checked by `.github/workflows/cloudflare-check.yml` and read by current network/inventory/combat tests. Removing V17 now breaks those CI/test expectations; the root edit remains uncommitted and does not establish public hosting or release readiness.
2. V21's loader fetches `survival-v7.html` and uses its CSS and body DOM as the gate/game UI. Deleting V7 without first moving that template into the chosen 3/4 entry breaks V21/successor boot.
3. The guarded gameplay-backed preview (`prototypes/successor-3-4/preview.js`) fetches `survival-v21.html`, blocks Relay and persistent storage, and projects V21 state through an in-memory shim. A separate `live-candidate.html` boot uses V21 Relay and origin-scoped V5 browser storage. Neither is an independent game shell or approved production successor; art, full loop, persistence/hosting and release gates remain open.
4. Save v5/v4 migration, Relay V16, world/collision, combat, SafeCamp interactions and expedition/workbench owners are valuable current gameplay. They must be retained and kept behind the 3/4 presentation while the successor replaces the renderer and UI. Camera projection should not erase or reimplement those state owners.
5. Split-module filenames carrying `v1` etc. are imported by current loaders, tests, aggregate reconstruction and CI. Rename/remove them only with explicit import/API migration and targeted regressions, not a numeric cleanup sweep.

**Important architecture distinction:** retiring the old pure top-down *presentation* does not require deleting canonical world coordinates or rewriting collision into an isometric grid. The successor's 3/4 camera adapter projects existing world `(x,y)` into screen coordinates and maps screen-direction input back; gameplay distance, collision, saves, and Relay remain domain-owned. The thing to retire is the old renderer/entry once the successor covers its responsibilities, not the underlying survival/co-op game state the user wants to keep.

## Recommended focus-only cleanup sequence

This is a dependency order, not authorization to remove unknown files or a claim that a phase is complete. The product direction is already decided: the latest 3/4 gameplay-backed successor is the sole target presentation. Remaining work is engineering handoff, completion of the existing survival/co-op loop behind it, and acceptance; do not reopen the camera-choice question. This cleanup plan is about retiring the old pure top-down presentation while retaining useful game-state systems, not deleting the game or its gameplay.

1. **Continue the approved 3/4 successor toward the main development route.** Keep the current gameplay-backed `prototypes/successor-3-4/` as the proof target; label the main-route handoff clearly DEV while Relay/save are guarded. Do not call it production or co-op-complete, and do not present the legacy V17 route as the long-term visual target.
2. **Upgrade art at a frozen display contract.** Engineering and art owners set world-cell screen size/zoom, authored source density, actor foot anchor, prop contact/sort anchor, alpha/depth rules, and target viewport scale. Then replace terrain, player/Guide, monsters, camp buildings, resources and UI as coherent high-detail pixel families. A useful source-density study should compare 1× and 2× authored pixel detail at the exact in-game display size; no casual resizing.
3. **Remove the V7 template dependency.** Move the exact UI shell/CSS/DOM needed by the chosen successor to its owned shell only after a compatibility review, so V7 becomes deletable without breaking V21's remaining gameplay modules.
4. **Promote the successor route only after art and gameplay acceptance.** Verify HOME prepare → OUTSIDE travel → encounter/salvage → return/recovery, save migration, Relay/two-client behavior and the 1280×720/390×844 real captures. Update CI and entry links to name the successor.
5. **Then retire standalone top-down entry pages and redundant aggregate snapshots file by file.** Check all imports, workflows, tests, external entry links, save keys, and rollback before each deletion. Keep an explicit deletion list and restore path. This is the point to remove V17 and genuinely obsolete whole-game versions.
6. **Only after callers no longer import a versioned module** may module revisions themselves be renamed or retired. Keep a clean compatibility/API naming scheme rather than erasing `v1`/`v12` blindly.

## Scope for any deletion request

The user's product direction is clear: focus the shipped experience on 3/4 and retire the pure top-down game. Exact file deletion is not yet safe because the candidate work is untracked/UNKNOWN and V7/V21/V17 have live cross-dependencies. Do not delete or move files solely from the version number. The next safe implementation package, if selected, is the **successor-primary-entry and V7-shell decoupling** task; actual legacy-file removal follows its dependency migration.

## Verified facts and unknowns

- **VERIFIED (worktree snapshot 2026-10-05):** local `index.html` redirects to `prototypes/successor-3-4/live-candidate.html`; V21 remains the live candidate gameplay boot dependency. The change is local/uncommitted and not publicly deployed. `survival-v21.html:28,33` uses V7 UI plus versioned gameplay modules. Current successor preview fetches V21. Explicit preview flags gate non-production Awakening assets.
- **VERIFIED:** Native runtime sprite atlases are small: player 96×128, monsters 128×96, props 192×96, resources 128×32; terrain atlas 320×256 RGB. The successor prototype renders actor 24×32→28×38, monster 32×32→38×38, resource 32×32→28×28, prop source cell 48×48, terrain source cell 64×64→64×32.
- **UNKNOWN:** which unknown-provenance files the user considers personally dispensable; whether the isolated successor preview's offline save/Relay boundaries are acceptable as the immediate default entry; browser quality of all candidate art after live display at 1280×720 and 390×844.
- No code, test, manifest, production asset, file deletion or rename was performed in preparing this plan.
