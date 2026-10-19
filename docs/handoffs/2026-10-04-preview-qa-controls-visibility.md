# Handoff: successor preview QA controls visibility

Date: 2026-10-04 (Asia/Rangoon)

## Finding

The successor preview contains developer shortcuts (HOME/POI location selection, fight/loot QA, and timed movement) for local QA. Following the player's preference, `preview.js` now sets `AW_DEV_QA=false` unconditionally, so neither the controls nor diagnostic badge can appear through a URL flag. Helper code remains local to the preview harness. This is source/fixture verification; no visual browser acceptance is claimed.

## Verification

- `node --check prototypes/successor-3-4/preview.js` passes, and `tests/successor-natural-route-v1.test.mjs` passes (`enteredOutside=true`, collision and reachable POI node confirmed by its fixture).
- The camera-adapter test reaches and passes the new `AW_DEV_QA=false` assertion, then fails later at its continuous-input QA sequence assertion (line 43); the current renderer does not contain the expected `HOLD NW` helper. This test is therefore **FAILED / broader successor harness UNKNOWN**, not a passing regression gate.
- The earlier 48/48 suite result predates this recheck and is not current acceptance evidence. Actual 1280×720 / 390×844 screenshots and interaction remain UNKNOWN.
- Attempted isolated local preview in Edge returned `ERR_BLOCKED_BY_CLIENT` for `127.0.0.1`; loopback-only static server was stopped afterward. No browser restrictions were bypassed.
- Actual 1280×720 / 390×844 screenshots and interaction remain UNKNOWN.

## Ownership and boundaries

- Lead: UI & Input for controls; Integration & QA for the guard and evidence.
- Files: `prototypes/successor-3-4/preview.js`, `prototypes/successor-3-4/successor-renderer.js`, `tests/successor-camera-adapter-v1.test.mjs`.
- QA helper code remains available inside the preview harness but cannot be exposed by the preview URL. No gameplay state, save, network, or production route was changed in this check.
