# Handoff — Movement & Locomotion Module Contract V2

Date: 2026-10-05  
Status: DRAFT design/handoff contract; no successor movement service implemented.

## Verified context

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- Worktree: broadly dirty with mixed/unknown provenance. Preserve all unrelated changes and untracked assets.
- V21 source ownership was checked: input handlers provide `joystickState`; `modules/main-loop/simulation-update.js` performs base local movement and coordinate writes; terrain and awakening-world wrappers handle collision/zone/send behavior; `smooth-motion-v18.js` handles frame cadence and interpolation rather than owning base movement rules.
- The guarded 3/4 preview adapts screen input in `camera-adapter.js` and calls the inherited V21 simulation. Its normalized screen speed uses a `sqrt(8)` scale. Automated math tests accept the mapping, while actual player feel remains UNKNOWN / FEEL QUESTION.

## Independent review and evidence

A read-only second-AI review found no confirmed movement bug and recommended documenting the source ownership chain, test limits, five reference-game experience translation, and unresolved movement-feel question. No files were changed by that reviewer.

The following focused tests passed during this review: `successor-camera-adapter-v1`, `successor-live-screen-movement-v1`, `successor-natural-route-v1`, `terrain-v21`, `platform-inventory-v19`, `playable-slice-smoothness-v1`, `motion-v18`, and `network-disconnect-simulation-pause`. These are fixture/source checks. They do not prove physical-device feel, obstacle-route touch behavior, or full HOME → POI → combat → return acceptance.

The prior guarded-preview desktop review recorded the overall scene as **REVISE** for repeated/coarse terrain, small low-detail actors, and crowded HUD. A real 390×844 gameplay capture and physical phone review remain UNKNOWN.

## Files and scope

- Added `docs/content-inbox/2026-10-05-movement-locomotion-module-card-v2.md`, covering five reference lessons, current and proposed ownership boundaries, visual gates, tests, and a single-module assignment prompt.
- Updated `docs/SUCCESSOR_MODULE_MAP.md` to route Movement & Locomotion to V2 and document the current runtime source chain.
- Appended current evidence and limits to `docs/PROJECT_STATE.md`.
- No runtime code, tests, art, saves, Relay protocol, merge, or deployment changed in this documentation pass.

## Next step

Keep the speed question as a user-reviewable feel item. If a player reports a repeatable problem, capture the same route/input conditions, add a failing regression, then propose the smallest movement-only fix. Do not alter speed, dash, attack movement, camera, network cadence, or save behavior under this documentation card.
