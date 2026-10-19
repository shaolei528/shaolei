# Audio & Feel source review — 2026-10-05

## Scope and ownership

- **Lead:** Audio & Feel.
- **Partners:** Combat & Weapons owns confirmed combat results; Integration & QA owns regression evidence.
- **Interfaces inspected:** `abyssal:player-swing`, `abyssal:combat-hit`, `abyssal:player-hurt`, SafeCamp `inCamp()`, and world `inStore(player)`.
- **Files reviewed:** `modules/audio/playable-feel-audio-v1.js`, `tests/playable-slice-audio-mixer-v1.test.mjs`, and `tests/playable-slice-feel-audio-v1.test.mjs`.
- **Boundary:** Audio communicates accepted outcomes and ambience. It does not decide hits, damage, creature behavior, or rewards. This was a read-only runtime review; no gameplay code or assets changed.

## Verified behavior

Source inspection shows a single lazy AudioContext, trusted-user-gesture unlock, master/SFX/ambience buses with separate effect categories, confirmed combat-event listeners, read-only HOME/OUTSIDE/MIRE MART selection, transient stop/disconnect cleanup, and visibility-triggered mute/suspend behavior.

The following checks pass:

- `node tests/playable-slice-audio-mixer-v1.test.mjs`
- `node tests/playable-slice-feel-audio-v1.test.mjs`
- `node --check modules/audio/playable-feel-audio-v1.js`
- Scoped `git diff --check` for the reviewed audio files

The fixtures cover event routing, lazy unlock, click and attack de-duplication, configured bus gains, hidden-page mute/suspend, ambience loop start/stop/restart, and cleanup after 1,000 swing transients.

## Findings

- **No confirmed source bug found** in the inspected behaviors.
- **UNKNOWN:** tests do not measure the final mixed waveform peak or prove no clipping during overlapping effects. A gain value below 1 is not enough evidence for that acceptance.
- **UNKNOWN:** no real browser/device playback was listened to in this review. Desktop speakers/headphones, mobile audio permission, Bluetooth latency, HOME/OUTSIDE comfort, and whether important cues remain clear during combat need player-facing listening evidence.
- No new content candidate was created; the existing one-candidate-per-day proposal remains unchanged.

## Adjacent combat-button sound recheck — 2026-10-05

Inspected the actual `.attack`, `.dash`, and `.use` controls in `survival-v7.html` against `eligibleUiButton()` in the audio owner. The filter excludes these gameplay buttons from generic UI click sounds; accepted swing/hit/hurt results continue through the semantic combat event bridge. This addresses the suspected duplicate-click path at source level; no code bug was confirmed.

The following additional regressions passed serially: `playable-slice-atmosphere-audio-v1`, `playable-audio-retry-idempotency-v1`, and `playable-feel-retry-idempotency-v1`, alongside reruns of the original mixer and feel tests. This verifies fixtures and routing, not real mixed-waveform peaks or player listening comfort; those remain **UNKNOWN**.

## Next bounded acceptance step

On the exact active 3/4 candidate build, capture the mixed output for UI, swing-only, confirmed hit, player hurt, crawler cue, HOME ambience, OUTSIDE ambience, MIRE MART, and plausible simultaneous combat cues. Inspect true peak/headroom and listen on desktop plus one phone before changing mastering values or adding a limiter. Keep Audio as presentation only; do not let sound callbacks settle gameplay.
