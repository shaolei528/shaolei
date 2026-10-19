# Rendering & Camera module card V2 — 2026-10-05

Date: 2026-10-05 (Asia/Rangoon)  
Status: documentation-only; renderer, art, runtime contracts and deployment unchanged.

## Change

- Added [`Rendering & Camera V2`](../content-inbox/2026-10-05-rendering-camera-module-card-v2.md) as the canonical task card; updated the owner index and rendering/art crosswalk in [`SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md).
- Marked [`Rendering & Camera V1`](../content-inbox/2026-10-04-rendering-camera-module-card-v1.md) historical and excluded from active routing.
- V2 turns the high-detail requirement into measurable in-game evidence: source/destination dimensions, source rect, anchor, native density, actual CSS/backing size, DPR, scale policy, safe areas and same-build HOME/POI captures at 1280×720 and 390×844.

## Evidence and limits

- **VERIFIED source:** guarded successor is injected over V21 and remains a development preview; `successor-renderer.js` combines projection/viewport and many draw responsibilities.
- **VERIFIED source-level risk / UNKNOWN visible effect:** actor source frames (player 24×32, mob 32×32) are drawn as 28×38 and 38×38 with smoothing disabled. Need target-size in-game comparison to judge actual clarity; this is not reported as a confirmed visual bug.
- Historical preview evidence recorded repeated terrain and small/coarse actors/props for the builds reviewed, but does not prove the current build's visual result. Current overall visual acceptance is UNKNOWN pending fresh same-build dual-viewport captures.
- Source/VM tests do not satisfy the visual gate. V2 calls for focused camera/aspect/routing tests and adjacent UI/movement/preview regressions after any implementation.
- An independent read-only review was requested. Append any specific correction to this handoff before considering its audit closed.

## Independent review corrections

- Linked the exact historical dual-viewport recheck: 1280×720 and 390×844 were both REVISE for the build reviewed; this is not current HEAD acceptance.
- Clarified ownership at the UI boundary: Rendering supplies canvas viewport/safe-area bounds and layer baseline; UI owns internal HUD/dialog layout; Input owns touch hit regions and intent mapping.
- Independent reviewer found no blocking ownership or source-fact errors in the card; these were precision improvements.

## Current local preview spot check

- Opened `http://localhost:8765/prototypes/successor-3-4/index.html?review=1` in the Codex in-app browser. It reached the guarded SafeCamp scene; accessibility state reported `LOCAL PREVIEW · RELAY BLOCKED`, memory-save preview behavior, local player presence, and loaded terrain/player/props/resources/monster sheets. Reported game viewport: 1100×589.
- This confirms the guarded route and loaded asset metadata in the current workspace only. No fresh screenshot-based visual judgment was captured in this spot check, and no 390×844 current-build capture was obtained. Therefore **current visual status remains UNKNOWN**; the linked historical desktop and phone evidence remains REVISE for the builds it reviewed.

## Next stage

Begin with RENDER-0: recheck the live entry/loader, current renderer/assets, dirty state, and fresh desktop/mobile captures. Then choose one complete proof scene and agree source/anchor/density/projection inputs with World & Terrain and Asset Pipeline. Extract one rendering responsibility only after that evidence is reviewable.

No runtime code, asset, manifest, save or Relay change was made. Existing shared-worktree changes of mixed provenance remain untouched.
