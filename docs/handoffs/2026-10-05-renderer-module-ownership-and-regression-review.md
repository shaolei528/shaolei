# Successor renderer module ownership and regression review

Date: 2026-10-05
Status: documentation correction and current regression snapshot; no runtime implementation.

## Verified baseline

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- The shared worktree has many modified and untracked files of mixed/unknown provenance. Preserve them and do not infer authorship from status alone.
- The successor proof still has its preview-specific rendering concentrated in `prototypes/successor-3-4/successor-renderer.js`; the module map describes it as not production and not broadly separated. Current dirty code provenance is unknown.
- Rechecked file metadata after shared-worktree changes: the renderer is currently 107 lines / 21,213 bytes, while the existing draft task card still claimed 62 lines. The card now uses symbol-search hints and says line/size snapshots must be rechecked before assignment; no renderer source was modified in this review.
- `SUCCESSOR_MODULE_MAP.md` has one canonical list of 27 named owners. Runtime feature coverage is not implied by the ownership directory.

## Documentation finding and correction

The draft task card `docs/content-inbox/2026-10-04-successor-renderer-modularization-task-v1.md` used `Rendering & Camera Integration` as a joint lead and included legacy combined labels such as `UI & Input` and `Content & Art`. These labels do not match the canonical owner directory and would make future AI file ownership unclear.

The task card now says it is a multi-stage plan, not one assignable joint-owner task. Its stages route to one lead each: Integration & QA for the guarded preview/QA harness and simulation bridge; Rendering & Camera for projection/context/scene layers and runtime asset lookup; Asset Pipeline for source metadata; Input & Accessibility for input normalization; Animation & Presentation for visual state. Partner modules supply interfaces or regressions only. Source metadata approval and runtime loading/fallback display are separate responsibilities. The module map now points future implementation to the stage-specific card and restates that V21 must not be retired during this modularization work.

## Regression evidence

- First full serial run: 57 of 58 test files exited successfully; `successor-camera-adapter-v1.test.mjs` exited 1. That invocation suppressed its test output, so the assertion that first failed was not captured.
- Isolated rerun of that test passed; two subsequent full serial runs also passed all 58 files. The result does not explain the first failure; record it as **non-reproduced, root cause UNKNOWN** rather than a confirmed product bug.
- The latest suite ran after rechecking newer shared-worktree timestamps: `successor-renderer.js` last changed at 16:02, `preview.js` at 16:08, and `successor-camera-adapter-v1.test.mjs` at 16:08 (Asia/Rangoon local time). All 58 test processes exited 0 against that observed snapshot.
- `awakening-assets-validator.test.mjs` explicitly reports that its CLI subprocess assertion is skipped because this Windows host returns `EPERM` for child-process creation. CI is still needed for that CLI path.
- The focused successor module routing test passes: 27 canonical owners, 27 indexed cards, 27 reference routes, no broken links/duplicates/missing task triggers/interfaces.
- These are local test results, not desktop/mobile visual acceptance, physical-device input, public Relay or human end-to-end play.

## Scope and next step

This review changed only `docs/content-inbox/2026-10-04-successor-renderer-modularization-task-v1.md`, `docs/SUCCESSOR_MODULE_MAP.md`, and `docs/PROJECT_STATE.md`. It did not change runtime, tests, assets, manifests, save data, Relay, or public deployment.

Recommended next engineering stage remains the guarded preview QA-harness extraction with **Integration & QA** as the single lead. Before implementation, recheck the live dirty worktree and exact file allowlist; preserve art and renderer work owned by the parallel visual lane. The 3/4 runtime, high-detail pixel-art quality, mobile device behavior and full HOME → POI → return-growth acceptance remain open.
