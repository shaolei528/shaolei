# Guarded successor QA harness extraction

Date: 2026-10-05 (Asia/Rangoon)
Owner: Integration & QA
Status: implemented; local regression PASS; visual/player acceptance remains UNKNOWN

## What changed

- Added `prototypes/successor-3-4/qa-harness.js` for development-only HOME, MIRE MART, LOOT, FIGHT, cardinal-step, world-north, route-sequence, STOP, and live diagnostic controls.
- `prototypes/successor-3-4/preview.js` injects that module only when the outer guarded preview URL explicitly has `?awDevQa=1`. Ordinary preview and the player candidate do not load it.
- `successor-renderer.js` no longer creates QA buttons, route/input queues, or diagnostics. Under the guarded local-preview + dev-flag condition it exposes a narrow bridge for teleport, bounded input, stop, and read-only state snapshots. Movement still goes through the captured V21 frame and resolved collision path.
- Updated camera/route tests and added `tests/successor-qa-harness-v1.test.mjs`.

## Validation

- JavaScript syntax checks passed for `preview.js`, `successor-renderer.js`, and `qa-harness.js`.
- Focused checks passed: `successor-qa-harness-v1`, `successor-camera-adapter-v1`, `successor-natural-route-v1`, `successor-preview-live-gate-v1`, `successor-live-candidate-v1`, and `successor-module-routing-contract-v1`.
- Full serial suite: **59/59 `tests/*.test.mjs` passed**.
- `awakening-assets-validator.test.mjs` explicitly skipped its CLI subprocess assertion because Windows process creation returned `EPERM`; CI remains the verifier for that subprocess path.

## Boundaries and remaining work

- This changes development QA tooling, not player-facing game behavior or art quality. No new desktop/mobile screenshots were captured. Modern High-Detail Pixel Art acceptance at 1280×720 and 390×844 remains open.
- Save schema, Relay/network protocols, production art manifest, production entry, collision authority, merge and deployment were not changed.
- Worktree HEAD remains `54d294abc13dd19ee53b56563fe43aaecc81b9ba` on `fix/awakening-production-gate-qa-findings-v1`; numerous shared modified/untracked files have mixed or unknown provenance. This work was not committed, and no source authorship is inferred from the mixed status.
- Next proposed slice is stage 2 under **Rendering & Camera**: establish the existing camera adapter as the single projection/viewport owner and extract a small render context, with coordinate and visual regressions. It must be re-scoped against the live dirty worktree before implementation.
