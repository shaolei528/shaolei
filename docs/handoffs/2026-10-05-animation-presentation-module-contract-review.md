# Handoff — Animation & Presentation Module Contract Review

Date: 2026-10-05  
Status: DRAFT module contract; no animation service or art asset implemented.

## Verified baseline

- Repository branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- Worktree: many dirty/untracked files with mixed or unknown provenance. Preserve them; no reset, cleanup, or attribution.
- Project direction: original Modern High-Detail Pixel Art in the accepted 3/4 oblique view. Art must be reviewed in actual 1280×720 and 390×844 gameplay; source resolution and smoothing flags alone do not prove clarity.
- V21 loads `smooth-motion-v18`, `hit-feedback`, `weapon-presentation`, `playable-feel`, and audio modules as ordered wrappers. They are legacy behavior, not proof of a separate successor animation service.

## Contract corrections

- The Animation & Presentation card now names canonical cooperating modules instead of legacy combined labels.
- State ownership is clearer: Network & Co-op delivers approved remote snapshots; Movement & Locomotion owns movement state; Rendering & Camera owns camera/projection; Animation & Presentation consumes the provided visual state and selects pose/clip. It must not create a second position smoother, camera-follow loop, Relay message or simulation timer.
- Asset dimensions, frame rectangles, anchors, alpha and pixel density remain under actual Asset Pipeline/source contracts. Unknown contracts stay `UNKNOWN`; no dimensions are invented and no image is resampled as compensation.
- Related module links were replaced with canonical module card links and manually verified: 11 linked cards/contracts exist.

## Source-level review item

In the guarded proof renderer `prototypes/successor-3-4/successor-renderer.js`, actor and mob frame selection/drawing still live directly in the renderer; there is no reusable successor animation service. The source selects player cells at 24×32 and mob cells at 32×32, then draws them at 28×38 and 38×38 with canvas smoothing disabled. This is a **Rendering & Camera-owned pixel-density risk**, not a confirmed in-game blur bug; the actual 1280×720 / 390×844 appearance has not been measured in this review. Animation must not alter source-frame sizes to hide that renderer question.

## Verification

- Serial focused tests: `module-sort`, successor camera adapter, weapon presentation, playable combat presentation, combat retry/idempotency, successor module routing — **6 passed, 0 failed**.
- Canonical routing contract: 27 owners/cards and 27 five-game rows; no broken/duplicate owner links; triggers and cooperating interfaces populated.
- `git diff --check` passed for the touched card/state docs.
- No runtime renderer/animation code, tests, assets, manifest, save, Relay contract, merge, or deployment was changed by this module-card pass.

## Remaining UNKNOWN

The successor animation service is not implemented. Pixel-density impact, native device rendering, frame pacing, reduced-motion coverage beyond existing kick behavior, audio timing, and repeated/out-of-order two-client events remain unaccepted. The next engineering task should either be a dedicated Rendering & Camera scale review based on actual screenshots, or a bounded animation slice after its state/asset contracts are approved; do not modify both owners in one change.
