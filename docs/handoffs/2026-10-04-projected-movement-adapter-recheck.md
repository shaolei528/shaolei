# Projected movement adapter recheck — 2026-10-04

**Status:** VERIFIED source and focused test; player feel UNKNOWN. This is a correction to older state notes that described direction-dependent speed as still present.

- The observed `camera-adapter.js` now maps normalized screen input through `worldIntentForScreenInput`, dividing the inverse-projected vector by `sqrt(8)` so its world magnitude never crosses V21's `l > 1` normalization threshold.
- The observed `successor-renderer.js` passes that vector through the real V21 frame and compares resolved displacement in projected screen space. The current expected speed is `canonical V21 speed / sqrt(8)` for all directions; this is uniform, though actual player feel remains unverified.
- `node tests/successor-camera-adapter-v1.test.mjs` passes and simulates the V21 normalization rule for all eight directions. Both successor scripts pass `node --check`; `git diff --check` reports only pre-existing LF/CRLF warnings in unrelated files.
- This check made no source or art edits. The prototype files are untracked and their change provenance is unknown; no ownership is inferred. No browser/device movement capture, controlled HOME gathering, network, save, or full-loop acceptance was performed.
- Lead module: UI & Input; coordinates with World & Terrain (preserve world/collision units) and Integration & QA (real-preview movement and obstacle checks). Before changing the movement multiplier, capture controlled cardinal/diagonal displacement and decide whether the uniform `1/sqrt(8)` baseline feels right; do not infer a feel bug from the adapter math alone.
